"""Client router for client-specific operations."""
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ClientProfile, NutritionPlan, WorkoutLog, MoodLog, WeightLog, SupplementLog, BodyMeasurement
from app.schemas import (
    ClientProfileResponse, ClientProfileUpdate, NutritionPlanResponse,
    WorkoutLogCreate, WorkoutLogResponse, MoodLogCreate, MoodLogUpdate, MoodLogResponse,
    WeightLogCreate, WeightLogUpdate, WeightLogResponse,
    SupplementLogCreate, SupplementLogUpdate, SupplementLogResponse,
    ConsultationPreferences, ConsultationSelectionRequest, HomeSummaryResponse, MessageResponse,
    TodayMacrosSyncRequest, TodayMacrosSyncResponse,
)
from app.services.mood_service import MoodService
from app.services.supplement_service import SupplementService
from app.services.weight_service import WeightService
from app.dependencies import get_current_client
from app.api.deps import get_mood_service, get_supplement_service, get_weight_service
from app.security import hash_password
from datetime import datetime

router = APIRouter(prefix="/api/client", tags=["Client"], dependencies=[Depends(get_current_client)])


def _parse_training_details(raw_value):
    """Decode training details JSON stored in DB text column."""
    if not raw_value:
        return None
    try:
        parsed = json.loads(raw_value)
        return parsed if isinstance(parsed, list) else None
    except (TypeError, ValueError):
        return None


def _serialize_training_details(value):
    """Encode training details list to JSON string for DB storage."""
    if value is None:
        return None
    if isinstance(value, str):
        return value
    try:
        return json.dumps(value)
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


def _serialize_json_object(value):
    """Encode JSON-serializable object to DB text column."""
    if value is None:
        return None
    if isinstance(value, str):
        return value
    try:
        return json.dumps(value)
    except (TypeError, ValueError):
        return None


def _get_latest_measurement(profile_id: int, db: Session):
    """Return latest body measurement row for profile if present."""
    return (
        db.query(BodyMeasurement)
        .filter(BodyMeasurement.client_id == profile_id)
        .order_by(BodyMeasurement.recorded_at.desc())
        .first()
    )


def _estimate_calories_target(profile: ClientProfile, measurement: Optional[BodyMeasurement]) -> Optional[float]:
    """Estimate daily calories target from profile macros or latest TDEE."""
    macro_total = 0.0
    has_macro_target = False

    if profile.protein_target:
        macro_total += profile.protein_target * 4
        has_macro_target = True
    if profile.carbs_target:
        macro_total += profile.carbs_target * 4
        has_macro_target = True
    if profile.fats_target:
        macro_total += profile.fats_target * 9
        has_macro_target = True

    if has_macro_target and macro_total > 0:
        return round(macro_total, 1)

    if measurement and measurement.tdee:
        return round(float(measurement.tdee), 1)

    return None


def _normalize_consultation_type(raw_value: Optional[str]) -> Optional[str]:
    """Normalize incoming consultation plan values to supported types."""
    if not raw_value:
        return None

    value = str(raw_value).strip().lower()
    mapping = {
        "once": "once",
        "monthly": "monthly",
        "annually": "annually",
        "annual": "annually",
    }
    return mapping.get(value, value)


def _normalize_meal_status(raw_value: Optional[str]) -> str:
    """Normalize incoming meal status values to supported states."""
    value = str(raw_value or "not-completed").strip().lower()
    if value in {"completed", "complete"}:
        return "completed"
    if value in {"not-completed", "not completed", "pending", "in-progress", "in progress"}:
        return "not-completed"
    return "not-completed"


def _derive_today_macro_status(total_meals: int, pending_meals: int, in_progress_meals: int, complete_meals: int) -> tuple[str, str]:
    """Apply deterministic macro status rules used by dashboard."""
    if total_meals == 0:
        return "Not Completed", "Meals are still not completed for today."
    if complete_meals == total_meals:
        return "Completed", "All tasks are completed for today."
    if pending_meals == total_meals or complete_meals < total_meals:
        return "Not Completed", "Meals are still not completed for today."
    return "Not Completed", "Meals are still not completed for today."


def _ensure_client_profile(current_user: User, db: Session) -> ClientProfile:
    """Ensure a client user always has a profile row with a valid display_id."""
    profile = current_user.client_profile

    if not profile:
        last_client = db.query(ClientProfile).order_by(ClientProfile.display_id.desc()).first()
        next_display_id = (last_client.display_id + 1) if last_client and last_client.display_id else 1
        profile = ClientProfile(
            user_id=current_user.id,
            display_id=next_display_id,
            created_source="profile_setup",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile

    if profile.display_id is None:
        last_client = db.query(ClientProfile).order_by(ClientProfile.display_id.desc()).first()
        next_display_id = (last_client.display_id + 1) if last_client and last_client.display_id else 1
        profile.display_id = next_display_id
        profile.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(profile)

    return profile


@router.get("/profile", response_model=ClientProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    """
    Get current client's profile.
    
    Args:
        current_user: Authenticated client user
        db: Database session
    
    Returns:
        Client profile information
    """
    profile = _ensure_client_profile(current_user, db)
    measurement = _get_latest_measurement(profile.id, db)

    return ClientProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        display_id=profile.display_id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=profile.phone,
        height=measurement.height if measurement else None,
        weight=measurement.weight if measurement else None,
        bmi=measurement.bmi if measurement else None,
        body_fat_percentage=measurement.body_fat_percentage if measurement else None,
        skeletal_muscle=measurement.skeletal_muscle if measurement else None,
        water_percentage=measurement.water_percentage if measurement else None,
        minerals=measurement.minerals if measurement else None,
        bmr=measurement.bmr if measurement else None,
        tdee=measurement.tdee if measurement else None,
        body_fat_mass=measurement.body_fat_mass if measurement else None,
        muscle_percentage=measurement.muscle_percentage if measurement else None,
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
        training_start_time=profile.training_time,
        training_time=profile.training_time,
        training_end_time=profile.training_end_time,
        consultation_type=profile.consultation_type,
        subscription_plan=profile.subscription_plan,
        anti_doping_focus=profile.anti_doping_focus,
        meal_swaps=_parse_json_object(profile.meal_swaps),
        created_source=profile.created_source,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.put("/profile", response_model=ClientProfileResponse)
async def update_profile(
    profile_data: ClientProfileUpdate,
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    """Update the authenticated client's profile."""
    import sys
    profile = _ensure_client_profile(current_user, db)

    update_data = profile_data.model_dump(exclude_unset=True)
    print(f"[PUT /api/client/profile] Received update_data keys: {list(update_data.keys())}", file=sys.stderr)
    print(f"[PUT /api/client/profile] protein_target={update_data.get('protein_target')}, carbs_target={update_data.get('carbs_target')}, fats_target={update_data.get('fats_target')}", file=sys.stderr)
    print(f"[PUT /api/client/profile] goal_weight={update_data.get('goal_weight')}, competition_date={update_data.get('competition_date')}, tdee={update_data.get('tdee')}", file=sys.stderr)

    # Accept training_start_time as an alias for persisted training_time.
    training_start_alias = update_data.pop("training_start_time", None)
    if "training_time" not in update_data and training_start_alias is not None:
        update_data["training_time"] = training_start_alias

    # Allow updating linked user account fields from full profile edit form.
    full_name_value = update_data.pop("full_name", None)
    if full_name_value:
        current_user.full_name = full_name_value

    email_value = update_data.pop("email", None)
    if email_value:
        normalized_email = str(email_value).strip().lower()
        if normalized_email != current_user.email:
            existing_user = (
                db.query(User)
                .filter(User.email == normalized_email, User.id != current_user.id)
                .first()
            )
            if existing_user:
                raise HTTPException(status_code=409, detail="Email already registered")
            current_user.email = normalized_email

    new_password = update_data.pop("new_password", None)
    if new_password:
        current_user.hashed_password = hash_password(new_password)

    # Extract measurement values and persist as a BodyMeasurement record.
    measurement_keys = {
        "height", "weight", "bmi", "body_fat_percentage", "skeletal_muscle",
        "water_percentage", "minerals", "bmr", "tdee", "body_fat_mass", "muscle_percentage"
    }
    measurement_payload = {key: update_data.pop(key, None) for key in measurement_keys if key in update_data}

    if "training_details" in update_data:
        update_data["training_details"] = _serialize_training_details(update_data.get("training_details"))
    if "meal_swaps" in update_data:
        update_data["meal_swaps"] = _serialize_json_object(update_data.get("meal_swaps"))

    import sys
    print(f"[PUT /api/client/profile] After measurement extraction, remaining update_data keys: {list(update_data.keys())}", file=sys.stderr)
    print(f"[PUT /api/client/profile] After extraction: protein_target={update_data.get('protein_target')}, carbs_target={update_data.get('carbs_target')}, fats_target={update_data.get('fats_target')}", file=sys.stderr)

    for key, value in update_data.items():
        setattr(profile, key, value)

    print(f"[PUT /api/client/profile] After setattr: protein_target={profile.protein_target}, carbs_target={profile.carbs_target}, fats_target={profile.fats_target}", file=sys.stderr)


    if any(value is not None for value in measurement_payload.values()):
        measurement = BodyMeasurement(
            client_id=profile.id,
            recorded_at=datetime.utcnow(),
            **measurement_payload,
        )
        db.add(measurement)

    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    latest_measurement = _get_latest_measurement(profile.id, db)

    import sys
    print(f"[PUT /api/client/profile] After DB commit/refresh: protein_target={profile.protein_target}, carbs_target={profile.carbs_target}, fats_target={profile.fats_target}", file=sys.stderr)
    print(f"[PUT /api/client/profile] After DB commit/refresh: goal_weight={profile.goal_weight}, competition_date={profile.competition_date}, activity_level={profile.activity_level}", file=sys.stderr)

    return ClientProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        display_id=profile.display_id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=profile.phone,
        height=latest_measurement.height if latest_measurement else None,
        weight=latest_measurement.weight if latest_measurement else None,
        bmi=latest_measurement.bmi if latest_measurement else None,
        body_fat_percentage=latest_measurement.body_fat_percentage if latest_measurement else None,
        skeletal_muscle=latest_measurement.skeletal_muscle if latest_measurement else None,
        water_percentage=latest_measurement.water_percentage if latest_measurement else None,
        minerals=latest_measurement.minerals if latest_measurement else None,
        bmr=latest_measurement.bmr if latest_measurement else None,
        tdee=latest_measurement.tdee if latest_measurement else None,
        body_fat_mass=latest_measurement.body_fat_mass if latest_measurement else None,
        muscle_percentage=latest_measurement.muscle_percentage if latest_measurement else None,
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
        training_start_time=profile.training_time,
        training_time=profile.training_time,
        training_end_time=profile.training_end_time,
        consultation_type=profile.consultation_type,
        subscription_plan=profile.subscription_plan,
        anti_doping_focus=profile.anti_doping_focus,
        meal_swaps=_parse_json_object(profile.meal_swaps),
        created_source=profile.created_source,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.get("/consultation", response_model=ConsultationPreferences)
async def get_consultation_preferences(
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db),
):
    """Get consultation and subscription preferences for the authenticated client."""
    profile = _ensure_client_profile(current_user, db)
    return ConsultationPreferences(
        consultation_type=profile.consultation_type,
        consultation_selected_at=profile.consultation_selected_at,
        subscription_plan=profile.subscription_plan,
        anti_doping_focus=profile.anti_doping_focus,
    )


@router.post("/consultation", response_model=ConsultationPreferences)
async def create_consultation_selection(
    payload: ConsultationSelectionRequest,
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db),
):
    """Persist consultation plan selection from subscription page."""
    profile = _ensure_client_profile(current_user, db)

    if payload.client_id != profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized client selection")

    normalized_type = _normalize_consultation_type(payload.consultation_type)
    if normalized_type not in {"once", "monthly", "annually"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid consultation type")

    profile.consultation_type = normalized_type
    profile.subscription_plan = normalized_type
    profile.consultation_selected_at = payload.timestamp
    profile.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(profile)

    return ConsultationPreferences(
        consultation_type=profile.consultation_type,
        consultation_selected_at=profile.consultation_selected_at,
        subscription_plan=profile.subscription_plan,
        anti_doping_focus=profile.anti_doping_focus,
    )


@router.put("/consultation", response_model=ConsultationPreferences)
async def update_consultation_preferences(
    payload: ConsultationPreferences,
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db),
):
    """Update consultation and subscription preferences for the authenticated client."""
    profile = _ensure_client_profile(current_user, db)
    data = payload.model_dump(exclude_unset=True)

    if "consultation_type" in data:
        normalized_type = _normalize_consultation_type(data.get("consultation_type"))
        data["consultation_type"] = normalized_type
        if normalized_type in {"once", "monthly", "annually"} and "subscription_plan" not in data:
            data["subscription_plan"] = normalized_type
        data["consultation_selected_at"] = datetime.utcnow()

    for key, value in data.items():
        setattr(profile, key, value)

    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    return ConsultationPreferences(
        consultation_type=profile.consultation_type,
        consultation_selected_at=profile.consultation_selected_at,
        subscription_plan=profile.subscription_plan,
        anti_doping_focus=profile.anti_doping_focus,
    )


@router.get("/home-summary", response_model=HomeSummaryResponse)
async def get_home_summary(
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db),
):
    """Return compact personalized summary data for the client home page."""
    profile = _ensure_client_profile(current_user, db)
    measurement = _get_latest_measurement(profile.id, db)

    return HomeSummaryResponse(
        full_name=current_user.full_name,
        current_weight=measurement.weight if measurement else None,
        target_weight=profile.goal_weight,
        calories_target=_estimate_calories_target(profile, measurement),
        supplements=profile.supplements,
        consultation_type=profile.consultation_type,
        consultation_selected_at=profile.consultation_selected_at,
        subscription_plan=profile.subscription_plan,
        anti_doping_focus=profile.anti_doping_focus,
    )


@router.post("/macros/today", response_model=TodayMacrosSyncResponse)
async def sync_today_macros(
    payload: TodayMacrosSyncRequest,
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db),
):
    """Persist and return today's macro progress status for the authenticated client."""
    profile = _ensure_client_profile(current_user, db)

    meal_rows = payload.meals or []
    pending_meals = 0
    in_progress_meals = 0
    complete_meals = 0
    consumed_calories = 0.0
    consumed_protein = 0.0
    consumed_carbs = 0.0
    consumed_fats = 0.0

    for meal in meal_rows:
        normalized = _normalize_meal_status(meal.status)
        if normalized == "completed":
            complete_meals += 1
            consumed_calories += float(meal.calories or 0)
            consumed_protein += float(meal.protein or 0)
            consumed_carbs += float(meal.carbs or 0)
            consumed_fats += float(meal.fats or 0)
        else:
            pending_meals += 1

    total_meals = len(meal_rows)
    status_value, status_message = _derive_today_macro_status(
        total_meals=total_meals,
        pending_meals=pending_meals,
        in_progress_meals=in_progress_meals,
        complete_meals=complete_meals,
    )

    tracking_date = payload.date or datetime.utcnow().date().isoformat()
    meal_swaps = _parse_json_object(profile.meal_swaps) or {}
    macro_tracking = meal_swaps.get("macro_tracking") if isinstance(meal_swaps.get("macro_tracking"), dict) else {}
    macro_tracking[tracking_date] = {
        "status": status_value,
        "status_message": status_message,
        "pending_meals": pending_meals,
        "in_progress_meals": in_progress_meals,
        "complete_meals": complete_meals,
        "total_meals": total_meals,
        "target_calories": float(payload.target_calories or 0),
        "target_protein": float(payload.target_protein or 0),
        "target_carbs": float(payload.target_carbs or 0),
        "target_fats": float(payload.target_fats or 0),
        "consumed_calories": consumed_calories,
        "consumed_protein": consumed_protein,
        "consumed_carbs": consumed_carbs,
        "consumed_fats": consumed_fats,
        "meals": [m.model_dump() for m in meal_rows],
        "updated_at": datetime.utcnow().isoformat(),
    }
    meal_swaps["macro_tracking"] = macro_tracking
    profile.meal_swaps = _serialize_json_object(meal_swaps)
    profile.updated_at = datetime.utcnow()
    db.commit()

    return TodayMacrosSyncResponse(
        status=status_value,
        status_message=status_message,
        pending_meals=pending_meals,
        in_progress_meals=in_progress_meals,
        complete_meals=complete_meals,
        total_meals=total_meals,
        target_calories=float(payload.target_calories or 0),
        target_protein=float(payload.target_protein or 0),
        target_carbs=float(payload.target_carbs or 0),
        target_fats=float(payload.target_fats or 0),
        consumed_calories=consumed_calories,
        consumed_protein=consumed_protein,
        consumed_carbs=consumed_carbs,
        consumed_fats=consumed_fats,
    )


@router.get("/nutrition-plans", response_model=List[NutritionPlanResponse])
async def get_nutrition_plans(
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db),
    active_only: bool = Query(True, description="Show only active plans")
):
    """Get nutrition plans for the authenticated client."""
    query = db.query(NutritionPlan).filter(
        NutritionPlan.client_id == current_user.client_profile.id
    )
    
    if active_only:
        query = query.filter(NutritionPlan.is_active == True)
    
    plans = query.all()
    return [NutritionPlanResponse.model_validate(p, from_attributes=True) for p in plans]


@router.get("/nutrition-plans/{plan_id}", response_model=NutritionPlanResponse)
async def get_nutrition_plan(
    plan_id: int,
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    """Get a specific nutrition plan for the authenticated client."""
    plan = db.query(NutritionPlan).filter(
        NutritionPlan.id == plan_id,
        NutritionPlan.client_id == current_user.client_profile.id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Nutrition plan not found")
    
    return NutritionPlanResponse.model_validate(plan, from_attributes=True)


# ==================== Workout Logging ====================

@router.post("/workouts", response_model=WorkoutLogResponse)
async def log_workout(
    workout_data: WorkoutLogCreate,
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    """Log a completed workout for the authenticated client."""
    # Verify client owns this log
    if workout_data.client_id != current_user.client_profile.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    workout = WorkoutLog(**workout_data.model_dump())
    db.add(workout)
    db.commit()
    db.refresh(workout)
    
    return WorkoutLogResponse.model_validate(workout, from_attributes=True)


@router.get("/workouts", response_model=List[WorkoutLogResponse])
async def get_workouts(
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db),
    days: int = Query(30, ge=1, le=365, description="Get workouts from last N days"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """Get workout logs for the authenticated client."""
    from datetime import datetime, timedelta
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    workouts = db.query(WorkoutLog).filter(
        WorkoutLog.client_id == current_user.client_profile.id,
        WorkoutLog.logged_at >= cutoff_date
    ).order_by(WorkoutLog.logged_at.desc()).offset(skip).limit(limit).all()
    
    return [WorkoutLogResponse.model_validate(w, from_attributes=True) for w in workouts]


# ==================== Mood Logging ====================

@router.post("/mood", response_model=MoodLogResponse)
async def log_mood(
    mood_data: MoodLogCreate,
    current_user: User = Depends(get_current_client),
    mood_service: MoodService = Depends(get_mood_service),
):
    """Log mood and mental state for the authenticated client."""
    mood = mood_service.create_mood_log(mood_data, current_user.client_profile.id)
    return MoodLogResponse.model_validate(mood, from_attributes=True)


@router.get("/mood", response_model=List[MoodLogResponse])
async def get_mood_logs(
    current_user: User = Depends(get_current_client),
    mood_service: MoodService = Depends(get_mood_service),
    days: int = Query(30, ge=1, le=365),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """Get mood logs for the authenticated client."""
    moods = mood_service.get_mood_logs(
        current_client_id=current_user.client_profile.id,
        days=days,
        skip=skip,
        limit=limit,
    )
    return [MoodLogResponse.model_validate(m, from_attributes=True) for m in moods]


@router.put("/mood/{mood_id}", response_model=MoodLogResponse)
async def update_mood_log(
    mood_id: int,
    mood_data: MoodLogUpdate,
    current_user: User = Depends(get_current_client),
    mood_service: MoodService = Depends(get_mood_service),
):
    """Update a mood log with ownership validation."""
    mood = mood_service.update_mood_log(
        mood_id=mood_id,
        payload=mood_data,
        current_client_id=current_user.client_profile.id,
    )
    return MoodLogResponse.model_validate(mood, from_attributes=True)


@router.delete("/mood/{mood_id}", response_model=MessageResponse)
async def delete_mood_log(
    mood_id: int,
    current_user: User = Depends(get_current_client),
    mood_service: MoodService = Depends(get_mood_service),
):
    """Delete a mood log with ownership validation."""
    result = mood_service.delete_mood_log(
        mood_id=mood_id,
        current_client_id=current_user.client_profile.id,
    )
    return MessageResponse(**result)


# ==================== Weight Tracking ====================

@router.post("/weight", response_model=WeightLogResponse)
async def log_weight(
    weight_data: WeightLogCreate,
    current_user: User = Depends(get_current_client),
    weight_service: WeightService = Depends(get_weight_service),
):
    """Log weight measurement for the authenticated client."""
    weight = weight_service.create_weight_log(weight_data, current_user.client_profile.id)
    return WeightLogResponse.model_validate(weight, from_attributes=True)


@router.get("/weight", response_model=List[WeightLogResponse])
async def get_weight_logs(
    current_user: User = Depends(get_current_client),
    weight_service: WeightService = Depends(get_weight_service),
    days: int = Query(90, ge=1, le=365),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """Get weight logs for the authenticated client."""
    weights = weight_service.get_weight_logs(
        current_client_id=current_user.client_profile.id,
        days=days,
        skip=skip,
        limit=limit,
    )
    return [WeightLogResponse.model_validate(w, from_attributes=True) for w in weights]


@router.put("/weight/{weight_id}", response_model=WeightLogResponse)
async def update_weight_log(
    weight_id: int,
    weight_data: WeightLogUpdate,
    current_user: User = Depends(get_current_client),
    weight_service: WeightService = Depends(get_weight_service),
):
    """Update a weight log with ownership validation."""
    weight = weight_service.update_weight_log(
        weight_id=weight_id,
        payload=weight_data,
        current_client_id=current_user.client_profile.id,
    )
    return WeightLogResponse.model_validate(weight, from_attributes=True)


@router.delete("/weight/{weight_id}", response_model=MessageResponse)
async def delete_weight_log(
    weight_id: int,
    current_user: User = Depends(get_current_client),
    weight_service: WeightService = Depends(get_weight_service),
):
    """Delete a weight log with ownership validation."""
    weight_service.delete_weight_log(
        weight_id=weight_id,
        current_client_id=current_user.client_profile.id,
    )
    return MessageResponse(message="Weight log deleted successfully")


# ==================== Supplement Tracking ====================

@router.post("/supplements", response_model=SupplementLogResponse)
async def log_supplement(
    supplement_data: SupplementLogCreate,
    current_user: User = Depends(get_current_client),
    supplement_service: SupplementService = Depends(get_supplement_service),
):
    """Log supplement intake for the authenticated client."""
    supplement = supplement_service.create_supplement_log(supplement_data, current_user.client_profile.id)
    return SupplementLogResponse.model_validate(supplement, from_attributes=True)


@router.get("/supplements", response_model=List[SupplementLogResponse])
async def get_supplements(
    current_user: User = Depends(get_current_client),
    supplement_service: SupplementService = Depends(get_supplement_service),
    days: int = Query(30, ge=1, le=365),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """Get the authenticated client's supplement logs."""
    supplements = supplement_service.get_supplement_logs(
        current_client_id=current_user.client_profile.id,
        days=days,
        skip=skip,
        limit=limit,
    )
    return [SupplementLogResponse.model_validate(s, from_attributes=True) for s in supplements]


@router.put("/supplements/{supplement_id}", response_model=SupplementLogResponse)
async def update_supplement_log(
    supplement_id: int,
    supplement_data: SupplementLogUpdate,
    current_user: User = Depends(get_current_client),
    supplement_service: SupplementService = Depends(get_supplement_service),
):
    """Update a supplement log with ownership validation."""
    supplement = supplement_service.update_supplement_log(
        supplement_id=supplement_id,
        payload=supplement_data,
        current_client_id=current_user.client_profile.id,
    )
    return SupplementLogResponse.model_validate(supplement, from_attributes=True)


@router.delete("/supplements/{supplement_id}", response_model=MessageResponse)
async def delete_supplement_log(
    supplement_id: int,
    current_user: User = Depends(get_current_client),
    supplement_service: SupplementService = Depends(get_supplement_service),
):
    """Delete a supplement log with ownership validation."""
    result = supplement_service.delete_supplement_log(
        supplement_id=supplement_id,
        current_client_id=current_user.client_profile.id,
    )
    return MessageResponse(**result)
