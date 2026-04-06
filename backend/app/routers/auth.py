"""Public router for authentication and public endpoints."""
import json
import logging
import re
from datetime import timedelta, date
from secrets import randbelow
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy import or_
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.database import get_db
from app.models import User, ClientProfile, BodyMeasurement, PasswordReset
from app.schemas import (
    UserCreate, UserLogin, Token, TokenPair, RefreshTokenRequest, PasswordChange,
    PasswordResetRequest, PasswordResetVerify, PasswordResetComplete, PasswordResetResponse,
    ClientListItem, ClientDetailResponse, BodyMeasurementResponse,
)
from app.security import (
    hash_password, verify_password, 
    create_token_pair, rotate_refresh_token,
    verify_refresh_token
)
from app.core.cookies import set_auth_cookies, clear_auth_cookies
from app.config import settings
from app.dependencies import get_current_user
from app.logging_config import log_auth_attempt
from app.email_service import send_password_reset_code_email

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
role_router = APIRouter(tags=["Role Authentication"])
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


def _build_auth_response(tokens: dict, user_id: int, role: str) -> dict:
    """Return an auth payload without exposing the refresh token in JSON."""
    return {
        "access_token": tokens["access_token"],
        "token_type": tokens.get("token_type", "bearer"),
        "access_token_expires": tokens.get("access_token_expires", settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60),
        "user_id": user_id,
        "role": role,
    }


def _get_or_create_admin_user(db: Session) -> User:
    """Ensure a persisted admin user exists and return it.

    Refresh tokens are tracked in DB with FK to users.id, so admin auth
    cannot use synthetic user_id=0 when issuing token pairs.
    """
    admin_email = settings.ADMIN_EMAIL.lower().strip()
    admin_user = db.query(User).filter(User.email == admin_email).first()

    if admin_user:
        needs_update = False
        if admin_user.role != "admin":
            admin_user.role = "admin"
            needs_update = True
        if not admin_user.is_active:
            admin_user.is_active = True
            needs_update = True
        if not admin_user.full_name:
            admin_user.full_name = "System Admin"
            needs_update = True
        if not admin_user.name:
            admin_user.name = admin_user.full_name
            needs_update = True
        if not admin_user.hashed_password:
            admin_hash = hash_password(settings.ADMIN_PASSWORD)
            admin_user.hashed_password = admin_hash
            admin_user.password_hash = admin_hash
            needs_update = True

        if needs_update:
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

        return admin_user

    admin_hash = hash_password(settings.ADMIN_PASSWORD)
    admin_user = User(
        email=admin_email,
        name="System Admin",
        full_name="System Admin",
        password_hash=admin_hash,
        hashed_password=admin_hash,
        role="admin",
        is_active=True,
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    return admin_user


class ClientCreatePayload(BaseModel):
    full_name: str
    phone_country_code: str = "+20"
    phone_number: str
    email: EmailStr
    password: str = Field(min_length=6)
    gender: str
    birthday: date
    country: str
    club: str | None = None
    religion: str | None = None
    source: str = "add_client"

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        parts = [p for p in str(value or "").strip().split() if p]
        if len(parts) < 4:
            raise ValueError("full_name must contain at least 4 names")
        return " ".join(parts)

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        digits = re.sub(r"\D", "", str(value or ""))
        if len(digits) < 6:
            raise ValueError("phone_number must contain at least 6 digits")
        return digits

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, value: str) -> str:
        normalized = str(value or "").strip().lower()
        if normalized not in {"male", "female"}:
            raise ValueError("gender must be Male or Female")
        return normalized


class ClientCreateResponse(BaseModel):
    user_id: int
    client_id: int
    display_id: int
    full_name: str
    email: str
    phone_country_code: str
    phone_number: str
    created_source: str


def _calculate_age(birthday_value):
    """Calculate age from birthday date."""
    if not birthday_value:
        return None
    today = date.today()
    return today.year - birthday_value.year - (
        (today.month, today.day) < (birthday_value.month, birthday_value.day)
    )


def _parse_training_details(raw_value):
    """Decode training details JSON stored in DB text column."""
    if not raw_value:
        return None
    try:
        parsed = json.loads(raw_value)
        return parsed if isinstance(parsed, list) else None
    except (TypeError, ValueError):
        return None


def _parse_json_object(raw_value):
    """Decode JSON object stored in DB text column."""
    if not raw_value:
        return None
    try:
        parsed = json.loads(raw_value)
        return parsed if isinstance(parsed, dict) else None
    except (TypeError, ValueError):
        return None


def _parse_json_list(raw_value):
    """Decode JSON list stored in DB text column."""
    if not raw_value:
        return None
    try:
        parsed = json.loads(raw_value)
        return parsed if isinstance(parsed, list) else None
    except (TypeError, ValueError):
        return None


def _normalize_created_source(value: str | None) -> str:
    """Normalize legacy source values to profile_setup or add_client."""
    normalized = (value or "").strip().lower()
    if normalized == "profile_setup":
        return "profile_setup"
    return "add_client"


@role_router.options("/api/client")
async def preflight_create_client():
    """Explicit OPTIONS handler for local/browser preflight compatibility."""
    return {"status": "ok"}


@role_router.post("/api/client", response_model=ClientCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    payload: ClientCreatePayload,
    db: Session = Depends(get_db),
):
    """Create a client from Add Client or Profile Setup save flow."""
    normalized_email = str(payload.email).strip().lower()
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    last_client = db.query(ClientProfile).order_by(ClientProfile.display_id.desc()).first()
    next_display_id = (last_client.display_id + 1) if last_client and last_client.display_id else 1

    phone_country_code = payload.phone_country_code.strip() or "+20"
    if not phone_country_code.startswith("+"):
        phone_country_code = f"+{phone_country_code}"

    created_source = _normalize_created_source(payload.source)
    hashed = hash_password(payload.password)

    user = User(
        email=normalized_email,
        full_name=payload.full_name,
        name=payload.full_name,
        password_hash=hashed,
        hashed_password=hashed,
        role="client",
        is_active=True,
    )
    db.add(user)
    db.flush()

    profile = ClientProfile(
        user_id=user.id,
        display_id=next_display_id,
        phone=f"{phone_country_code}{payload.phone_number}",
        birthday=payload.birthday,
        gender=payload.gender,
        country=payload.country,
        club=payload.club,
        religion=payload.religion,
        created_source=created_source,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    return ClientCreateResponse(
        user_id=user.id,
        client_id=profile.id,
        display_id=profile.display_id,
        full_name=user.full_name,
        email=user.email,
        phone_country_code=phone_country_code,
        phone_number=payload.phone_number,
        created_source=created_source,
    )


@router.post("/register", response_model=TokenPair)
async def register(
    response: Response,
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new client user and return access + refresh tokens."""
    # Normalize email to lowercase for case-insensitive lookup
    normalized_email = user_data.email.lower().strip()
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        logger.warning(f"Registration attempt with existing email: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        email=normalized_email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role="client"
    )
    db.add(new_user)
    db.flush()  # Get the user ID without committing
    
    # Get next display ID for client profile
    last_client = db.query(ClientProfile).order_by(ClientProfile.display_id.desc()).first()
    next_display_id = (last_client.display_id + 1) if last_client else 1
    
    # Create client profile
    client_profile = ClientProfile(
        user_id=new_user.id,
        display_id=next_display_id,
        created_source="profile_setup"
    )
    db.add(client_profile)
    db.commit()
    db.refresh(new_user)
    
    # Create token pair with database tracking
    token_data = {"user_id": new_user.id, "email": new_user.email, "role": new_user.role}
    tokens = create_token_pair(token_data, db=db)
    
    # Set secure cookies
    set_auth_cookies(
        response,
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"]
    )
    
    log_auth_attempt(user_data.email, True, details="user_registration")
    
    return _build_auth_response(tokens, new_user.id, new_user.role)


@router.post("/login", response_model=TokenPair)
@limiter.limit(settings.LOGIN_RATE_LIMIT)
async def login(
    request: Request,
    response: Response,
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Login user (admin or client) and return access + refresh tokens.
    
    Rate limited: 5 attempts per minute per IP
    """
    client_ip = request.client.host
    
    # Normalize email to lowercase for case-insensitive lookup
    normalized_email = credentials.email.lower().strip()
    
    # Check for admin login
    if normalized_email == settings.ADMIN_EMAIL.lower() and credentials.password == settings.ADMIN_PASSWORD:
        admin_user = _get_or_create_admin_user(db)
        token_data = {
            "user_id": admin_user.id,
            "email": settings.ADMIN_EMAIL,
            "role": "admin"
        }
        tokens = create_token_pair(token_data, db=db)
        
        # Set secure cookies
        set_auth_cookies(
            response,
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"]
        )
        
        log_auth_attempt(credentials.email, True, ip=client_ip, details="admin_login")
        
        return _build_auth_response(tokens, admin_user.id, "admin")
    
    # Check for client login
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        log_auth_attempt(normalized_email, False, ip=client_ip, details="invalid_credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        log_auth_attempt(credentials.email, False, ip=client_ip, details="inactive_account")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )
    
    # Create token pair with database tracking
    token_data = {"user_id": user.id, "email": user.email, "role": user.role}
    tokens = create_token_pair(token_data, db=db)
    
    # Set secure cookies
    set_auth_cookies(
        response,
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"]
    )
    
    log_auth_attempt(credentials.email, True, ip=client_ip, details="client_login")
    
    return _build_auth_response(tokens, user.id, user.role)


@role_router.post("/doctor/signup", response_model=TokenPair)
@role_router.post("/api/doctor/signup", response_model=TokenPair)
async def doctor_signup(
    response: Response,
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Create a doctor account and return auth tokens."""
    normalized_email = user_data.email.lower().strip()
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed_password = hash_password(user_data.password)
    new_user = User(
        email=normalized_email,
        name=user_data.full_name,
        full_name=user_data.full_name,
        password_hash=hashed_password,
        hashed_password=hashed_password,
        role="doctor",
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token_data = {"user_id": new_user.id, "email": new_user.email, "role": new_user.role}
    tokens = create_token_pair(token_data, db=db)
    set_auth_cookies(
        response,
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
    )

    return _build_auth_response(tokens, new_user.id, new_user.role)


@role_router.post("/doctor/login", response_model=TokenPair)
@role_router.post("/api/doctor/login", response_model=TokenPair)
async def doctor_login(
    response: Response,
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Dedicated doctor login flow."""
    normalized_email = credentials.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email, User.role == "doctor").first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid doctor credentials")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Doctor account is inactive")

    token_data = {"user_id": user.id, "email": user.email, "role": user.role}
    tokens = create_token_pair(token_data, db=db)
    set_auth_cookies(
        response,
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
    )

    return _build_auth_response(tokens, user.id, user.role)


@role_router.post("/admin/login", response_model=TokenPair)
@role_router.post("/api/admin/login", response_model=TokenPair)
async def admin_login(
    response: Response,
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Dedicated admin login flow."""
    normalized_email = credentials.email.lower().strip()
    if normalized_email != settings.ADMIN_EMAIL.lower() or credentials.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin credentials")

    admin_user = _get_or_create_admin_user(db)

    token_data = {
        "user_id": admin_user.id,
        "email": settings.ADMIN_EMAIL,
        "role": "admin",
    }
    tokens = create_token_pair(token_data, db=db)
    set_auth_cookies(
        response,
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
    )

    return _build_auth_response(tokens, admin_user.id, "admin")


@router.get("/clients-public/detail/{client_id}", response_model=ClientDetailResponse)
async def get_client_public_detail(
    client_id: int,
    db: Session = Depends(get_db),
):
    """Public read-only client details by user id or display id.

    Used by the no-login admin view in frontend `client-detail.html`.
    """
    user = (
        db.query(User)
        .join(ClientProfile)
        .filter(User.role == "client")
        .filter(or_(User.id == client_id, ClientProfile.display_id == client_id))
        .first()
    )

    if not user or not user.client_profile:
        raise HTTPException(status_code=404, detail="Client not found")

    nutrition_profile = user.client_profile.nutrition_profile

    measurements = (
        db.query(BodyMeasurement)
        .filter(BodyMeasurement.client_id == user.client_profile.id)
        .order_by(BodyMeasurement.recorded_at.desc())
        .all()
    )

    return ClientDetailResponse(
        id=user.id,
        display_id=user.client_profile.display_id,
        full_name=user.full_name,
        email=user.email,
        phone=user.client_profile.phone,
        birthday=user.client_profile.birthday,
        gender=user.client_profile.gender,
        country=user.client_profile.country,
        religion=user.client_profile.religion,
        club=user.client_profile.club,
        sport=user.client_profile.sport,
        position=user.client_profile.position,
        activity_level=user.client_profile.activity_level,
        priority=user.client_profile.priority,
        competition_date=user.client_profile.competition_date,
        goal_weight=user.client_profile.goal_weight,
        training_details=_parse_training_details(user.client_profile.training_details),
        injuries=user.client_profile.injuries,
        medical=user.client_profile.medical,
        allergies=user.client_profile.allergies,
        food_allergies=user.client_profile.food_allergies,
        food_likes=user.client_profile.food_likes,
        food_dislikes=user.client_profile.food_dislikes,
        test_record_notes=user.client_profile.test_record_notes,
        additional_notes=user.client_profile.additional_notes,
        client_notes=user.client_profile.client_notes,
        mental_observation=user.client_profile.mental_observation,
        supplements=user.client_profile.supplements,
        competition_enabled=user.client_profile.competition_enabled,
        competition_status=user.client_profile.competition_status,
        progression_type=(nutrition_profile.progression_type if nutrition_profile and nutrition_profile.progression_type is not None else user.client_profile.progression_type),
        calories=(nutrition_profile.calories if nutrition_profile and nutrition_profile.calories is not None else user.client_profile.calories),
        protein_target=(nutrition_profile.protein_target if nutrition_profile and nutrition_profile.protein_target is not None else user.client_profile.protein_target),
        carbs_target=(nutrition_profile.carbs_target if nutrition_profile and nutrition_profile.carbs_target is not None else user.client_profile.carbs_target),
        fats_target=(nutrition_profile.fats_target if nutrition_profile and nutrition_profile.fats_target is not None else user.client_profile.fats_target),
        water_intake=(nutrition_profile.water_intake if nutrition_profile and nutrition_profile.water_intake is not None else user.client_profile.water_intake),
        water_in_body=(nutrition_profile.water_in_body if nutrition_profile else None),
        minerals=(nutrition_profile.minerals if nutrition_profile else None),
        days_left=(nutrition_profile.days_left if nutrition_profile and nutrition_profile.days_left is not None else user.client_profile.days_left),
        mental_obs_date=user.client_profile.mental_obs_date,
        wake_up_time=user.client_profile.wake_up_time,
        sleep_time=user.client_profile.sleep_time,
        injury_status=user.client_profile.injury_status,
        injury_description=user.client_profile.injury_description,
        original_protein=user.client_profile.original_protein,
        original_carbs=user.client_profile.original_carbs,
        original_fats=user.client_profile.original_fats,
        training_time=user.client_profile.training_time,
        height=(nutrition_profile.height if nutrition_profile else None),
        weight=(nutrition_profile.weight if nutrition_profile else None),
        bmi=(nutrition_profile.bmi if nutrition_profile else None),
        body_fat_percentage=(nutrition_profile.body_fat_percentage if nutrition_profile else None),
        skeletal_muscle=(nutrition_profile.skeletal_muscle if nutrition_profile else None),
        body_fat_mass=(nutrition_profile.body_fat_mass if nutrition_profile else None),
        muscle_percentage=(nutrition_profile.muscle_percentage if nutrition_profile else None),
        medical_allergies=(nutrition_profile.medical_allergies if nutrition_profile else None),
        medical_notes=(nutrition_profile.medical_notes if nutrition_profile else None),
        mental_notes=(nutrition_profile.mental_notes if nutrition_profile else None),
        training_sessions=(_parse_json_list(nutrition_profile.training_sessions) if nutrition_profile else None),
        supplements_list=(_parse_json_list(nutrition_profile.supplements) if nutrition_profile else None),
        meal_swaps=_parse_json_object(user.client_profile.meal_swaps),
        measurements=[BodyMeasurementResponse.model_validate(m, from_attributes=True) for m in measurements],
        nutrition_plans=[],
        created_at=user.created_at,
    )


@router.get("/clients-public", response_model=list[ClientListItem])
async def list_clients_public(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 500,
):
    """Public read-only client listing for frontend clients page.

    Returns minimal client profile information from database.
    """
    users = (
        db.query(User)
        .filter(User.role == "client")
        .join(ClientProfile)
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        ClientListItem(
            id=user.id,
            display_id=user.client_profile.display_id,
            full_name=user.full_name,
            email=user.email,
            phone=user.client_profile.phone,
            gender=user.client_profile.gender,
            age=_calculate_age(user.client_profile.birthday),
            activity_level=user.client_profile.activity_level,
            sport=user.client_profile.sport,
            priority=user.client_profile.priority,
            religion=user.client_profile.religion,
            created_source=_normalize_created_source(user.client_profile.created_source),
            created_at=user.created_at,
        )
        for user in users
    ]


@router.post("/refresh", response_model=TokenPair)
async def refresh_access_token(
    response: Response,
    request: Request,
    request_data: RefreshTokenRequest | None = None,
    db: Session = Depends(get_db)
):
    """Refresh expired access token using the HttpOnly refresh token cookie.

    Token rotation: issues a new access token and rotates the refresh token cookie.
    The refresh token is not exposed in the JSON response.
    """
    refresh_token = None
    if request_data and request_data.refresh_token:
        refresh_token = request_data.refresh_token
    elif hasattr(request, "cookies"):
        refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token"
        )

    # Verify refresh token with revocation check
    token_data = verify_refresh_token(refresh_token, db=db)
    
    if not token_data:
        logger.warning("Invalid or revoked refresh token attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or revoked refresh token"
        )
    
    # Extract old JTI from token for revocation
    from jose import jwt
    try:
        old_payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        old_jti = old_payload.get("jti")
    except:
        old_jti = None
    
    # Verify user still exists and is active
    if token_data.user_id == 0:  # Legacy admin tokens
        admin_user = _get_or_create_admin_user(db)
        token_payload = {
            "user_id": admin_user.id,
            "email": admin_user.email,
            "role": "admin"
        }
        # Issue new token pair with rotation (revoke old token)
        tokens = rotate_refresh_token(token_payload, old_jti=old_jti, db=db)
    else:
        # Client token - verify user exists
        user = db.query(User).filter(User.id == token_data.user_id).first()
        if not user or not user.is_active:
            logger.warning(f"Refresh token for inactive/deleted user: {token_data.user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User no longer exists or is inactive"
            )
        
        token_payload = {
            "user_id": user.id,
            "email": user.email,
            "role": user.role
        }
        # Issue new token pair with rotation (revoke old token)
        tokens = rotate_refresh_token(token_payload, old_jti=old_jti, db=db)
    
    # Set new secure cookies
    set_auth_cookies(
        response,
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"]
    )
    
    logger.info(f"Token refreshed with rotation for user: {token_data.user_id}")
    
    return _build_auth_response(tokens, token_data.user_id, token_data.role)


@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user)
):
    """
    Logout user by clearing authentication cookies.
    
    Returns:
        Success message
    """
    # Clear secure cookies
    clear_auth_cookies(response)
    
    logger.info(f"User {current_user.id} logged out")
    
    return {"message": "Successfully logged out"}


@router.post("/change-password", response_model=str)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user password.
    
    Requires authentication. Validates the current password before setting the new one.
    """
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Direct password change is disabled. Use email verification code flow to update password."
    )


@router.post("/request-password-reset", response_model=PasswordResetResponse)
async def request_password_reset(
    request_data: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Request password reset code via email.
    
    Generates a 6-digit verification code, stores it temporarily,
    and sends it to the provided email address.
    """
    from datetime import timedelta, datetime as dt
    
    # Normalize email to lowercase
    email = request_data.email.lower().strip()
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    if not user:
        logger.warning("Password reset requested for unknown email", extra={"email": email})
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found in our system"
        )
    
    # Generate 6-digit verification code
    verification_code = f"{randbelow(1_000_000):06d}"
    
    # Remove any existing non-used codes for this email
    db.query(PasswordReset).filter(
        PasswordReset.email == email,
        PasswordReset.is_used == False
    ).delete()
    db.commit()
    
    # Create new password reset record
    expires_at = dt.utcnow() + timedelta(minutes=15)
    
    password_reset = PasswordReset(
        email=email,
        verification_code=verification_code,
        expires_at=expires_at
    )
    db.add(password_reset)
    db.commit()
    db.refresh(password_reset)

    # Try sending code via configured SMTP provider.
    email_sent, email_error = send_password_reset_code_email(email, verification_code)
    if not email_sent:
        logger.error(
            "Password reset email delivery failed",
            extra={"email": email, "reset_id": password_reset.id, "error": email_error}
        )
        db.delete(password_reset)
        db.commit()

        auth_failed = "535" in str(email_error) or "Authentication" in str(email_error)
        detail_message = (
            "Email service authentication failed. Please verify SMTP username and app password."
            if auth_failed
            else "Failed to send verification email. Please try again later."
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail_message
        )

    logger.info("Password reset verification email sent", extra={"email": email, "reset_id": password_reset.id})

    return {
        "success": True,
        "message": f"Verification code sent to {email}",
        "email_sent": True
    }


@router.post("/verify-password-reset-code", response_model=dict)
async def verify_password_reset_code(
    verify_data: PasswordResetVerify,
    db: Session = Depends(get_db)
):
    """
    Verify password reset code before allowing password change.
    """
    from datetime import datetime
    
    # Normalize email to lowercase
    email = verify_data.email.lower().strip()
    code = verify_data.verification_code
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Check for valid, unused code
    password_reset = db.query(PasswordReset).filter(
        PasswordReset.email == email,
        PasswordReset.verification_code == code,
        PasswordReset.is_used == False
    ).first()
    
    if not password_reset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # Check if code has expired
    if datetime.utcnow() > password_reset.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one."
        )
    
    return {"message": "Code verified successfully", "valid": True}


@router.post("/complete-password-reset", response_model=dict)
async def complete_password_reset(
    reset_data: PasswordResetComplete,
    db: Session = Depends(get_db)
):
    """
    Complete password reset by verifying code and setting new password.
    """
    from datetime import datetime
    
    # Normalize email to lowercase
    email = reset_data.email.lower().strip()
    code = reset_data.verification_code
    new_password = reset_data.new_password
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Find and verify the reset code
    password_reset = db.query(PasswordReset).filter(
        PasswordReset.email == email,
        PasswordReset.verification_code == code,
        PasswordReset.is_used == False
    ).first()
    
    if not password_reset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # Check if code has expired
    if datetime.utcnow() > password_reset.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired"
        )
    
    # Update password
    user.hashed_password = hash_password(new_password)
    user.updated_at = datetime.utcnow()
    
    # Mark reset code as used
    password_reset.is_used = True
    
    db.commit()
    
    logger.info(f"Password reset completed for {email}")
    
    return {"message": "Password reset successful. You can now login with your new password."}


@router.get("/me")
async def get_current_user_info(
    db: Session = Depends(get_db)
):
    """
    Get current user information.
    
    Args:
        db: Database session
    
    Returns:
        User information
    
    Note:
        This endpoint can be accessed by any authenticated user.
        The current_user is obtained from the Authorization header.
    """
    return {
        "message": "Use Authorization header with Bearer token to get user info",
        "example": "Authorization: Bearer <your_token>"
    }
