"""Admin router for admin-only operations."""
import json
import re
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.database import get_db
from app.diet_plan_selector import infer_schedule_from_text, select_diet_template
from app.meal_plan_utils import normalize_meal_plan_json
from app.models import User, ClientProfile, BodyMeasurement, NutritionPlan, DietTemplate, NutritionProfile
from app.schemas import (
    ClientListItem, ClientDetailResponse, ClientProfileCreate, ClientProfileUpdate,
    NutritionPlanCreate, NutritionPlanResponse, DietTemplateCreate, DietTemplateResponse,
    DietTemplateRecommendationRequest, DietTemplateRecommendationResponse,
    BodyMeasurementCreate, BodyMeasurementResponse, MessageResponse
)
from app.dependencies import get_current_admin, get_current_admin_or_doctor
from app.security import hash_password

router = APIRouter(prefix="/api/admin", tags=["Admin"])
# NOTE: Authentication removed at router level for development purposes
# Individual endpoints can still require authentication via Depends(get_current_admin)


def _parse_training_details(raw_value: Optional[str]) -> Optional[list]:
    """Decode training details JSON stored in DB text column."""
    if not raw_value:
        return None
    try:
        parsed = json.loads(raw_value)
        return parsed if isinstance(parsed, list) else None
    except (TypeError, ValueError):
        return None


def _serialize_training_details(value) -> Optional[str]:
    """Encode training details to JSON string for DB storage."""
    if value is None:
        return None
    if isinstance(value, str):
        return value
    try:
        return json.dumps(value)
    except (TypeError, ValueError):
        return None


def _parse_json_object(raw_value: Optional[str]) -> Optional[dict]:
    """Decode JSON object stored in DB text column."""
    if not raw_value:
        return None
    try:
        parsed = json.loads(raw_value)
        return parsed if isinstance(parsed, dict) else None
    except (TypeError, ValueError):
        return None


def _serialize_json_object(value) -> Optional[str]:
    """Encode JSON object to DB text column."""
    if value is None:
        return None
    if isinstance(value, str):
        return value
    try:
        return json.dumps(value)
    except (TypeError, ValueError):
        return None


def _normalize_created_source(value: Optional[str]) -> str:
    """Normalize legacy source values to profile_setup or add_client."""
    normalized = (value or "").strip().lower()
    if normalized == "profile_setup":
        return "profile_setup"
    return "add_client"


def _next_display_id(db: Session) -> int:
    last = db.query(ClientProfile).order_by(ClientProfile.display_id.desc()).first()
    return (last.display_id + 1) if last and last.display_id else 1


def _serialize_json(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    try:
        return json.dumps(value)
    except (TypeError, ValueError):
        return None


def _parse_json(value: Optional[str], default: Any):
    if not value:
        return default
    try:
        parsed = json.loads(value)
        return parsed
    except (TypeError, ValueError):
        return default


class BasicClientPayload(BaseModel):
    full_name: str
    phone_country_code: str = "+20"
    phone_number: str
    email: EmailStr
    password: str = Field(min_length=6)
    gender: str
    birthday: date
    country: str
    club: Optional[str] = None
    religion: Optional[str] = None
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


class BasicClientUpdatePayload(BaseModel):
    full_name: str
    phone_country_code: str = "+20"
    phone_number: str
    email: EmailStr
    password: Optional[str] = Field(default=None, min_length=6)
    gender: str
    birthday: date
    country: str
    club: Optional[str] = None
    religion: Optional[str] = None
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


class BasicClientResponse(BaseModel):
    user_id: int
    client_id: int
    display_id: int
    full_name: str
    email: str
    phone_country_code: str
    phone_number: str
    gender: Optional[str] = None
    birthday: Optional[date] = None
    country: Optional[str] = None
    club: Optional[str] = None
    religion: Optional[str] = None


class NutritionProfilePayload(BaseModel):
    height: Optional[float] = None
    weight: Optional[float] = None
    bmi: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    skeletal_muscle: Optional[float] = None
    body_fat_mass: Optional[float] = None
    muscle_percentage: Optional[float] = None
    bmr: Optional[float] = None
    activity_level: Optional[str] = None
    sport: Optional[str] = None
    position: Optional[str] = None
    tdee: Optional[float] = None
    progression_type: Optional[str] = None
    calories: Optional[float] = None
    protein_target: Optional[float] = None
    carbs_target: Optional[float] = None
    fats_target: Optional[float] = None
    water_in_body: Optional[float] = None
    water_intake: Optional[float] = None
    minerals: Optional[float] = None
    test_record_notes: Optional[str] = None
    injuries: Optional[str] = None
    mental_notes: Optional[str] = None
    medical_allergies: Optional[str] = None
    food_allergies: Optional[str] = None
    medical_notes: Optional[str] = None
    food_likes: Optional[str] = None
    food_dislikes: Optional[str] = None
    competition_status: Optional[str] = None
    competition_date: Optional[date] = None
    days_left: Optional[int] = None
    goal_weight: Optional[float] = None
    additional_notes: Optional[str] = None
    training_sessions: Optional[List[Dict[str, Any]]] = None
    supplements: Optional[List[Dict[str, Any]]] = None


class NutritionProfileResponse(NutritionProfilePayload):
    client_id: int


@router.get("/clients", response_model=List[ClientListItem])
async def list_clients(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    # Filters
    gender: Optional[str] = Query(None, description="Filter by gender"),
    min_age: Optional[int] = Query(None, description="Minimum age"),
    max_age: Optional[int] = Query(None, description="Maximum age"),
    activity_level: Optional[str] = Query(None, description="Filter by activity level"),
    sport: Optional[str] = Query(None, description="Filter by sport"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    # Sorting
    sort_by: str = Query("created_at", description="Sort by field"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    # Pagination
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """List clients with filters, sorting, and pagination."""
    query = db.query(User).filter(User.role == "client").join(ClientProfile)
    
    # Apply filters
    if gender:
        query = query.filter(ClientProfile.gender == gender)
    
    if activity_level:
        query = query.filter(ClientProfile.activity_level == activity_level)
    
    if sport:
        query = query.filter(ClientProfile.sport == sport)
    
    if priority:
        query = query.filter(ClientProfile.priority == priority)
    
    # Age filter
    if min_age is not None or max_age is not None:
        from datetime import date
        today = date.today()
        if max_age is not None:
            min_birth_year = today.year - max_age
            query = query.filter(ClientProfile.birthday >= f"{min_birth_year}-01-01")
        if min_age is not None:
            max_birth_year = today.year - min_age
            query = query.filter(ClientProfile.birthday <= f"{max_birth_year}-12-31")
    
    # Apply sorting
    if sort_by == "name":
        sort_field = User.full_name
    elif sort_by == "phone":
        sort_field = ClientProfile.phone
    elif sort_by == "id":
        sort_field = ClientProfile.display_id
    elif sort_by == "age":
        sort_field = ClientProfile.birthday
    else:
        sort_field = User.created_at
    
    if sort_order.lower() == "asc":
        query = query.order_by(sort_field.asc())
    else:
        query = query.order_by(sort_field.desc())
    
    # Pagination
    users = query.offset(skip).limit(limit).all()
    
    result = []
    for user in users:
        result.append(ClientListItem(
            id=user.id,
            display_id=user.client_profile.display_id,
            full_name=user.full_name,
            email=user.email,
            phone=user.client_profile.phone,
            gender=user.client_profile.gender,
            age=calculateAge(user.client_profile.birthday) if user.client_profile.birthday else None,
            activity_level=user.client_profile.activity_level,
            sport=user.client_profile.sport,
            priority=user.client_profile.priority,
            religion=user.client_profile.religion,
            created_source=_normalize_created_source(user.client_profile.created_source),
            created_at=user.created_at
        ))
    
    return result


@router.post("/clients/basic", response_model=BasicClientResponse)
async def create_basic_client(
    payload: BasicClientPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_doctor),
):
    _ = current_user
    normalized_email = str(payload.email).strip().lower()
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")

    display_id = _next_display_id(db)
    phone_country_code = payload.phone_country_code.strip() or "+20"
    if not phone_country_code.startswith("+"):
        phone_country_code = f"+{phone_country_code}"
    phone_e164 = f"{phone_country_code}{payload.phone_number}"

    user = User(
        email=normalized_email,
        full_name=payload.full_name.strip(),
        name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
        hashed_password=hash_password(payload.password),
        role="client",
        is_active=True,
    )
    db.add(user)
    db.flush()

    profile = ClientProfile(
        user_id=user.id,
        display_id=display_id,
        phone=phone_e164,
        birthday=payload.birthday,
        gender=payload.gender,
        country=payload.country,
        religion=payload.religion,
        club=payload.club,
        created_source="profile_setup" if payload.source == "profile_setup" else "add_client",
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    return BasicClientResponse(
        user_id=user.id,
        client_id=profile.id,
        display_id=profile.display_id,
        full_name=user.full_name,
        email=user.email,
        phone_country_code=phone_country_code,
        phone_number=payload.phone_number,
        gender=profile.gender,
        birthday=profile.birthday,
        country=profile.country,
        club=profile.club,
        religion=profile.religion,
    )


@router.get("/clients/{client_id}/basic", response_model=BasicClientResponse)
async def get_basic_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_doctor),
):
    _ = current_user
    user = db.query(User).filter(and_(User.id == client_id, User.role == "client")).first()
    if not user or not user.client_profile:
        raise HTTPException(status_code=404, detail="Client not found")

    phone_value = user.client_profile.phone or ""
    phone_country_code = "+20"
    phone_number = ""
    if phone_value.startswith("+") and len(phone_value) > 3:
        phone_country_code = phone_value[:3]
        phone_number = phone_value[3:]
    else:
        phone_number = phone_value

    return BasicClientResponse(
        user_id=user.id,
        client_id=user.client_profile.id,
        display_id=user.client_profile.display_id,
        full_name=user.full_name,
        email=user.email,
        phone_country_code=phone_country_code,
        phone_number=phone_number,
        gender=user.client_profile.gender,
        birthday=user.client_profile.birthday,
        country=user.client_profile.country,
        club=user.client_profile.club,
        religion=user.client_profile.religion,
    )


@router.put("/clients/{client_id}/basic", response_model=BasicClientResponse)
async def update_basic_client(
    client_id: int,
    payload: BasicClientUpdatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_doctor),
):
    _ = current_user
    user = db.query(User).filter(and_(User.id == client_id, User.role == "client")).first()
    if not user or not user.client_profile:
        raise HTTPException(status_code=404, detail="Client not found")

    normalized_email = str(payload.email).strip().lower()
    existing_user = db.query(User).filter(User.email == normalized_email, User.id != user.id).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")

    phone_country_code = payload.phone_country_code.strip() or "+20"
    if not phone_country_code.startswith("+"):
        phone_country_code = f"+{phone_country_code}"
    phone_e164 = f"{phone_country_code}{payload.phone_number}"

    user.full_name = payload.full_name.strip()
    user.name = payload.full_name.strip()
    user.email = normalized_email
    if payload.password:
        new_hash = hash_password(payload.password)
        user.password_hash = new_hash
        user.hashed_password = new_hash

    profile = user.client_profile
    profile.phone = phone_e164
    profile.birthday = payload.birthday
    profile.gender = payload.gender
    profile.country = payload.country
    profile.club = payload.club
    profile.religion = payload.religion
    profile.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(profile)

    return BasicClientResponse(
        user_id=user.id,
        client_id=profile.id,
        display_id=profile.display_id,
        full_name=user.full_name,
        email=user.email,
        phone_country_code=phone_country_code,
        phone_number=payload.phone_number,
        gender=profile.gender,
        birthday=profile.birthday,
        country=profile.country,
        club=profile.club,
        religion=profile.religion,
    )


@router.get("/clients/{client_id}/nutrition", response_model=NutritionProfileResponse)
async def get_nutrition_profile(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_doctor),
):
    _ = current_user
    user = db.query(User).filter(and_(User.id == client_id, User.role == "client")).first()
    if not user or not user.client_profile:
        raise HTTPException(status_code=404, detail="Client not found")

    profile = user.client_profile.nutrition_profile
    if not profile:
        return NutritionProfileResponse(client_id=user.client_profile.id)

    return NutritionProfileResponse(
        client_id=profile.client_id,
        height=profile.height,
        weight=profile.weight,
        bmi=profile.bmi,
        body_fat_percentage=profile.body_fat_percentage,
        skeletal_muscle=profile.skeletal_muscle,
        body_fat_mass=profile.body_fat_mass,
        muscle_percentage=profile.muscle_percentage,
        bmr=profile.bmr,
        activity_level=profile.activity_level,
        sport=profile.sport,
        position=profile.position,
        tdee=profile.tdee,
        progression_type=profile.progression_type,
        calories=profile.calories,
        protein_target=profile.protein_target,
        carbs_target=profile.carbs_target,
        fats_target=profile.fats_target,
        water_in_body=profile.water_in_body,
        water_intake=profile.water_intake,
        minerals=profile.minerals,
        test_record_notes=profile.test_record_notes,
        injuries=profile.injuries,
        mental_notes=profile.mental_notes,
        medical_allergies=profile.medical_allergies,
        food_allergies=profile.food_allergies,
        medical_notes=profile.medical_notes,
        food_likes=profile.food_likes,
        food_dislikes=profile.food_dislikes,
        competition_status=profile.competition_status,
        competition_date=profile.competition_date,
        days_left=profile.days_left,
        goal_weight=profile.goal_weight,
        additional_notes=profile.additional_notes,
        training_sessions=_parse_json(profile.training_sessions, []),
        supplements=_parse_json(profile.supplements, []),
    )


@router.put("/clients/{client_id}/nutrition", response_model=NutritionProfileResponse)
async def save_nutrition_profile(
    client_id: int,
    payload: NutritionProfilePayload,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(and_(User.id == client_id, User.role == "client")).first()
    if not user or not user.client_profile:
        raise HTTPException(status_code=404, detail="Client not found")

    profile = user.client_profile.nutrition_profile
    if not profile:
        profile = NutritionProfile(client_id=user.client_profile.id)
        db.add(profile)

    data = payload.model_dump(exclude_unset=True)
    training_sessions = data.pop("training_sessions", None)
    supplements = data.pop("supplements", None)

    for key, value in data.items():
        setattr(profile, key, value)

    if training_sessions is not None:
        profile.training_sessions = _serialize_json(training_sessions)
    if supplements is not None:
        profile.supplements = _serialize_json(supplements)

    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    return NutritionProfileResponse(
        client_id=profile.client_id,
        height=profile.height,
        weight=profile.weight,
        bmi=profile.bmi,
        body_fat_percentage=profile.body_fat_percentage,
        skeletal_muscle=profile.skeletal_muscle,
        body_fat_mass=profile.body_fat_mass,
        muscle_percentage=profile.muscle_percentage,
        bmr=profile.bmr,
        activity_level=profile.activity_level,
        sport=profile.sport,
        position=profile.position,
        tdee=profile.tdee,
        progression_type=profile.progression_type,
        calories=profile.calories,
        protein_target=profile.protein_target,
        carbs_target=profile.carbs_target,
        fats_target=profile.fats_target,
        water_in_body=profile.water_in_body,
        water_intake=profile.water_intake,
        minerals=profile.minerals,
        test_record_notes=profile.test_record_notes,
        injuries=profile.injuries,
        mental_notes=profile.mental_notes,
        medical_allergies=profile.medical_allergies,
        food_allergies=profile.food_allergies,
        medical_notes=profile.medical_notes,
        food_likes=profile.food_likes,
        food_dislikes=profile.food_dislikes,
        competition_status=profile.competition_status,
        competition_date=profile.competition_date,
        days_left=profile.days_left,
        goal_weight=profile.goal_weight,
        additional_notes=profile.additional_notes,
        training_sessions=_parse_json(profile.training_sessions, []),
        supplements=_parse_json(profile.supplements, []),
    )


@router.post("/clients/{client_id}/measurements", response_model=BodyMeasurementResponse)
async def create_body_measurement(
    client_id: int,
    measurement_data: BodyMeasurementCreate,
    db: Session = Depends(get_db)
):
    """Create a body measurement record for a client. (WARNING: No authentication for development purposes)"""
    # Verify client exists
    user = db.query(User).filter(and_(User.id == client_id, User.role == "client")).first()
    if not user or not user.client_profile:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Create measurement record
    measurement = BodyMeasurement(
        client_id=user.client_profile.id,
        height=measurement_data.height,
        weight=measurement_data.weight,
        bmi=measurement_data.bmi,
        body_fat_percentage=measurement_data.body_fat_percentage,
        skeletal_muscle=measurement_data.skeletal_muscle,
        water_percentage=measurement_data.water_percentage,
        minerals=measurement_data.minerals,
        bmr=measurement_data.bmr,
        tdee=measurement_data.tdee,
        body_fat_mass=measurement_data.body_fat_mass,
        muscle_percentage=measurement_data.muscle_percentage,
        recorded_at=datetime.utcnow()
    )
    
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    
    return BodyMeasurementResponse.model_validate(measurement, from_attributes=True)


@router.get("/clients/{client_id}", response_model=ClientDetailResponse)
async def get_client_detail(
    client_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Get detailed information for a specific client."""
    user = db.query(User).filter(and_(User.id == client_id, User.role == "client")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Client not found")

    if not user.client_profile:
        raise HTTPException(status_code=404, detail="Client profile not found")
    
    measurements = db.query(BodyMeasurement).filter(
        BodyMeasurement.client_id == user.client_profile.id
    ).all()
    
    nutrition_plans = db.query(NutritionPlan).filter(
        NutritionPlan.client_id == user.client_profile.id
    ).all()
    nutrition_profile = user.client_profile.nutrition_profile
    
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
        meal_swaps=_parse_json_object(user.client_profile.meal_swaps),
        measurements=[BodyMeasurementResponse.model_validate(m, from_attributes=True) for m in measurements],
        nutrition_plans=[NutritionPlanResponse.model_validate(p, from_attributes=True) for p in nutrition_plans],
        created_source=_normalize_created_source(user.client_profile.created_source),
        created_at=user.created_at
    )


@router.post("/clients", response_model=ClientDetailResponse)
async def create_client(
    client_data: ClientProfileCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Create a client profile for an existing client user."""
    # Check if user exists
    user = db.query(User).filter(User.id == client_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role != "client":
        raise HTTPException(status_code=400, detail="User must have client role")

    if user.client_profile:
        raise HTTPException(status_code=400, detail="Client profile already exists for this user")
    
    # Check if display ID is unique
    existing = db.query(ClientProfile).filter(ClientProfile.display_id == client_data.display_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Display ID already exists")
    
    # Create client profile
    profile_data = client_data.model_dump()
    if "training_details" in profile_data:
        profile_data["training_details"] = _serialize_training_details(profile_data.get("training_details"))
    if "meal_swaps" in profile_data:
        profile_data["meal_swaps"] = _serialize_json_object(profile_data.get("meal_swaps"))

    profile_data["created_source"] = "add_client"  # Mark as admin-created
    profile = ClientProfile(**profile_data)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return ClientDetailResponse(
        id=user.id,
        display_id=profile.display_id,
        full_name=user.full_name,
        email=user.email,
        phone=profile.phone,
        birthday=profile.birthday,
        gender=profile.gender,
        country=profile.country,
        religion=profile.religion,
        club=profile.club,
        sport=profile.sport,
        position=profile.position,
        activity_level=profile.activity_level,
        priority=profile.priority,
        competition_date=profile.competition_date,
        goal_weight=profile.goal_weight,
        training_details=_parse_training_details(profile.training_details),
        injuries=profile.injuries,
        medical=profile.medical,
        allergies=profile.allergies,
        food_allergies=profile.food_allergies,
        food_likes=profile.food_likes,
        food_dislikes=profile.food_dislikes,
        test_record_notes=profile.test_record_notes,
        additional_notes=profile.additional_notes,
        client_notes=profile.client_notes,
        mental_observation=profile.mental_observation,
        supplements=profile.supplements,
        competition_enabled=profile.competition_enabled,
        competition_status=profile.competition_status,
        progression_type=profile.progression_type,
        calories=profile.calories,
        protein_target=profile.protein_target,
        carbs_target=profile.carbs_target,
        fats_target=profile.fats_target,
        water_intake=profile.water_intake,
        days_left=profile.days_left,
        mental_obs_date=profile.mental_obs_date,
        wake_up_time=profile.wake_up_time,
        sleep_time=profile.sleep_time,
        injury_status=profile.injury_status,
        injury_description=profile.injury_description,
        original_protein=profile.original_protein,
        original_carbs=profile.original_carbs,
        original_fats=profile.original_fats,
        training_time=profile.training_time,
        meal_swaps=_parse_json_object(profile.meal_swaps),
        created_source=_normalize_created_source(profile.created_source),
        created_at=user.created_at
    )


@router.put("/clients/{client_id}", response_model=MessageResponse)
async def update_client(
    client_id: int,
    client_data: ClientProfileUpdate,
    db: Session = Depends(get_db),
):
    """Update client profile information (admin only)."""
    user = db.query(User).filter(and_(User.id == client_id, User.role == "client")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Client not found")

    if not user.client_profile:
        raise HTTPException(status_code=404, detail="Client profile not found")
    
    # Update client profile and linked user account fields
    update_data = client_data.model_dump(exclude_unset=True)
    user_full_name = update_data.pop("full_name", None)
    user_email = update_data.pop("email", None)
    new_password = update_data.pop("new_password", None)

    if user_full_name:
        normalized_name = str(user_full_name).strip()
        if normalized_name:
            user.full_name = normalized_name
            user.name = normalized_name

    if user_email:
        normalized_email = str(user_email).strip().lower()
        existing = db.query(User).filter(User.email == normalized_email, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        user.email = normalized_email

    if new_password:
        new_hash = hash_password(new_password)
        user.password_hash = new_hash
        user.hashed_password = new_hash

    if "training_details" in update_data:
        update_data["training_details"] = _serialize_training_details(update_data.get("training_details"))
    if "meal_swaps" in update_data:
        update_data["meal_swaps"] = _serialize_json_object(update_data.get("meal_swaps"))

    for key, value in update_data.items():
        if hasattr(user.client_profile, key):
            setattr(user.client_profile, key, value)
    
    user.client_profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user.client_profile)
    
    return {"message": "Client updated successfully"}


@router.delete("/clients/{client_id}", response_model=MessageResponse)
async def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Delete a client by user ID (admin only)."""
    _ = current_admin
    user = db.query(User).filter(and_(User.id == client_id, User.role == "client")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db.delete(user)
    db.commit()
    
    return {"message": "Client deleted successfully"}


@router.post("/nutrition-plans", response_model=NutritionPlanResponse)
async def create_nutrition_plan(
    plan_data: NutritionPlanCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Create and assign a nutrition plan to a client."""
    # Verify client exists
    client = db.query(ClientProfile).filter(ClientProfile.id == plan_data.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    plan = NutritionPlan(**plan_data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    
    return NutritionPlanResponse.model_validate(plan, from_attributes=True)


@router.get("/diet-templates", response_model=List[DietTemplateResponse])
async def list_diet_templates(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """List diet templates with pagination."""
    templates = db.query(DietTemplate).offset(skip).limit(limit).all()
    for template in templates:
        template.meal_plan = normalize_meal_plan_json(template.meal_plan)
    return [DietTemplateResponse.model_validate(t, from_attributes=True) for t in templates]


@router.post("/diet-templates", response_model=DietTemplateResponse)
async def create_diet_template(
    template_data: DietTemplateCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Create a new diet template."""
    payload = _enrich_template_metadata(template_data.model_dump())
    payload["meal_plan"] = normalize_meal_plan_json(payload.get("meal_plan"))
    template = DietTemplate(**payload)
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return DietTemplateResponse.model_validate(template, from_attributes=True)


@router.put("/diet-templates/{template_id}", response_model=DietTemplateResponse)
async def update_diet_template(
    template_id: int,
    template_data: DietTemplateCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Update a diet template by template ID."""
    template = db.query(DietTemplate).filter(DietTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = template_data.model_dump(exclude_unset=True)
    update_data = _enrich_template_metadata(update_data)
    if "meal_plan" in update_data:
        update_data["meal_plan"] = normalize_meal_plan_json(update_data.get("meal_plan"))
    for key, value in update_data.items():
        setattr(template, key, value)
    
    template.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(template)
    
    return DietTemplateResponse.model_validate(template, from_attributes=True)


@router.delete("/diet-templates/{template_id}", response_model=MessageResponse)
async def delete_diet_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Delete a diet template by template ID."""
    template = db.query(DietTemplate).filter(DietTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(template)
    db.commit()
    
    return {"message": "Template deleted successfully"}


def calculateAge(birthdate):
    """Calculate age from birthdate."""
    from datetime import date
    today = date.today()
    age = today.year - birthdate.year
    if (today.month, today.day) < (birthdate.month, birthdate.day):
        age -= 1
    return age


def _enrich_template_metadata(template_data: dict) -> dict:
    enriched = dict(template_data)
    name_hint = str(enriched.get("template_name") or "")
    if not enriched.get("schedule_type"):
        enriched["schedule_type"] = infer_schedule_from_text(name_hint)
    if not enriched.get("plan_type"):
        enriched["plan_type"] = enriched.get("schedule_type") or infer_schedule_from_text(name_hint)
    return enriched


@router.post("/diet-templates/recommend", response_model=DietTemplateRecommendationResponse)
async def recommend_diet_template(
    payload: DietTemplateRecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_doctor),
):
    """Recommend a diet template using TDEE and wake-up time."""
    _ = current_user
    templates = db.query(DietTemplate).all()
    selected, meta = select_diet_template(templates=templates, tdee=payload.tdee, wake_up_time=payload.wake_up_time)

    return DietTemplateRecommendationResponse(
        tdee=payload.tdee,
        wake_up_time=payload.wake_up_time,
        schedule_type=meta.get("schedule_type") or "summer",
        reason=meta.get("reason") or "no_match",
        calorie_bracket=meta.get("calorie_bracket"),
        recommended_template=(DietTemplateResponse.model_validate(selected, from_attributes=True) if selected else None),
    )


@router.get("/clients/{client_id}/recommended-diet-template", response_model=DietTemplateRecommendationResponse)
async def recommend_client_diet_template(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_doctor),
):
    """Recommend a diet template for a specific client profile."""
    _ = current_user
    profile = db.query(ClientProfile).filter(ClientProfile.id == client_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Client not found")

    nutrition_profile = db.query(NutritionProfile).filter(NutritionProfile.client_id == client_id).first()
    tdee = None
    wake_up_time = None
    if nutrition_profile:
        tdee = nutrition_profile.tdee
        wake_up_time = profile.wake_up_time or None
    if tdee is None:
        tdee = profile.tdee
    if wake_up_time is None:
        wake_up_time = profile.wake_up_time

    if tdee is None:
        raise HTTPException(status_code=400, detail="Client TDEE is required for automatic diet selection")

    templates = db.query(DietTemplate).all()
    selected, meta = select_diet_template(templates=templates, tdee=tdee, wake_up_time=wake_up_time)

    return DietTemplateRecommendationResponse(
        tdee=float(tdee),
        wake_up_time=wake_up_time,
        schedule_type=meta.get("schedule_type") or "summer",
        reason=meta.get("reason") or "no_match",
        calorie_bracket=meta.get("calorie_bracket"),
        recommended_template=(DietTemplateResponse.model_validate(selected, from_attributes=True) if selected else None),
    )
