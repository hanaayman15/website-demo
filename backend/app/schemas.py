"""Pydantic schemas for request/response validation."""
from datetime import datetime, date
import re
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator, ConfigDict


# ==================== User & Auth Schemas ====================

class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    """User creation schema."""
    password: str


class UserLogin(BaseModel):
    """User login schema."""
    email: EmailStr
    password: str


class PasswordChange(BaseModel):
    """Password change schema."""
    current_password: str
    new_password: str = Field(..., min_length=6, description="New password (minimum 6 characters)")


class PasswordResetRequest(BaseModel):
    """Request password reset code."""
    email: EmailStr


class PasswordResetVerify(BaseModel):
    """Verify password reset code."""
    email: EmailStr
    verification_code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")


class PasswordResetComplete(BaseModel):
    """Complete password reset with new password."""
    email: EmailStr
    verification_code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")
    new_password: str = Field(..., min_length=6, description="New password (minimum 6 characters)")


class PasswordResetResponse(BaseModel):
    """Password reset response."""
    success: bool = True
    message: str
    email_sent: bool = False


class Token(BaseModel):
    """JWT authentication token response."""
    access_token: str
    token_type: str
    user_id: int
    role: str


class TokenPair(BaseModel):
    """Token pair response with refresh token (enhanced security)."""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    access_token_expires: int  # seconds
    user_id: int
    role: str


class RefreshTokenRequest(BaseModel):
    """Request to refresh access token using refresh token."""
    refresh_token: Optional[str] = None


class TokenData(BaseModel):
    """Decoded token data."""
    user_id: int
    email: str
    role: str


# ==================== Public Page Schemas ====================

class SuccessStory(BaseModel):
    """Success story item schema."""
    id: int
    client_name: str
    transformation: str
    duration: str
    achievement: str


class SuccessStoriesResponse(BaseModel):
    """Success stories list response schema."""
    success_stories: List[SuccessStory]
    total: int


# ==================== Client Profile Schemas ====================

E164_PHONE_PATTERN = re.compile(r"^\+\d{8,15}$")

class ClientProfileBase(BaseModel):
    """Base client profile schema."""
    phone: Optional[str] = None
    birthday: Optional[date] = None
    gender: Optional[str] = None
    country: Optional[str] = None
    religion: Optional[str] = None
    club: Optional[str] = None
    sport: Optional[str] = None
    position: Optional[str] = None
    activity_level: Optional[str] = None
    priority: Optional[str] = "medium"
    competition_date: Optional[date] = None
    goal_weight: Optional[float] = None
    training_details: Optional[List[Dict[str, Any]]] = None
    injuries: Optional[str] = None
    medical: Optional[str] = None
    allergies: Optional[str] = None
    food_allergies: Optional[str] = None
    food_likes: Optional[str] = None
    food_dislikes: Optional[str] = None
    test_record_notes: Optional[str] = None
    additional_notes: Optional[str] = None
    client_notes: Optional[str] = None
    mental_observation: Optional[str] = None
    supplements: Optional[str] = None
    competition_enabled: Optional[bool] = None
    competition_status: Optional[str] = None
    progression_type: Optional[str] = None
    protein_target: Optional[float] = None
    carbs_target: Optional[float] = None
    fats_target: Optional[float] = None
    water_intake: Optional[float] = None
    days_left: Optional[int] = None
    mental_obs_date: Optional[datetime] = None
    wake_up_time: Optional[str] = None
    sleep_time: Optional[str] = None
    injury_status: Optional[bool] = None
    injury_description: Optional[str] = None
    original_protein: Optional[float] = None
    original_carbs: Optional[float] = None
    original_fats: Optional[float] = None
    training_start_time: Optional[str] = None
    training_time: Optional[str] = None
    training_end_time: Optional[str] = None
    consultation_type: Optional[str] = None
    subscription_plan: Optional[str] = None
    anti_doping_focus: Optional[str] = None
    meal_swaps: Optional[Dict[str, Any]] = None
    created_source: Optional[str] = "admin_added"  # admin_added or profile_setup

    @field_validator("phone")
    @classmethod
    def validate_phone_e164(cls, value: Optional[str]) -> Optional[str]:
        """Normalize and validate phone numbers in strict E.164 format."""
        if value is None:
            return None

        raw = str(value).strip()
        if not raw:
            return None

        if not raw.startswith('+'):
            raise ValueError("Phone must start with '+' and include country code (E.164 format)")

        digits_only = ''.join(ch for ch in raw if ch.isdigit())
        normalized = f"+{digits_only}"

        if not E164_PHONE_PATTERN.fullmatch(normalized):
            raise ValueError("Phone must be valid international format, e.g. +201234567890")

        return normalized

    @model_validator(mode="after")
    def normalize_training_start_alias(self):
        """Keep training_start_time and training_time in sync for compatibility."""
        if self.training_start_time and not self.training_time:
            self.training_time = self.training_start_time
        elif self.training_time and not self.training_start_time:
            self.training_start_time = self.training_time
        return self


class ClientProfileCreate(ClientProfileBase):
    """Create client profile schema."""
    user_id: int
    display_id: int


class ClientProfileUpdate(ClientProfileBase):
    """Update client profile schema."""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    new_password: Optional[str] = Field(default=None, min_length=6, description="Optional new password")
    height: Optional[float] = None
    weight: Optional[float] = None
    bmi: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    skeletal_muscle: Optional[float] = None
    water_percentage: Optional[float] = None
    minerals: Optional[float] = None
    bmr: Optional[float] = None
    tdee: Optional[float] = None
    body_fat_mass: Optional[float] = None
    muscle_percentage: Optional[float] = None


class ClientProfileResponse(ClientProfileBase):
    """Client profile response schema."""
    id: int
    user_id: int
    display_id: int
    full_name: Optional[str] = None  # User's full name
    email: Optional[str] = None  # User's email
    height: Optional[float] = None
    weight: Optional[float] = None
    bmi: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    skeletal_muscle: Optional[float] = None
    water_percentage: Optional[float] = None
    minerals: Optional[float] = None
    bmr: Optional[float] = None
    tdee: Optional[float] = None
    body_fat_mass: Optional[float] = None
    muscle_percentage: Optional[float] = None
    created_source: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Teams & Players Schemas ====================

class TrainingSessionItem(BaseModel):
    """Dynamic training session payload item."""
    session_info: str


class SupplementItem(BaseModel):
    """Dynamic supplement payload item."""
    supplement_info: str

class TeamPlayerBase(ClientProfileBase):
    """Base payload for a player under a team."""
    full_name: str
    email: Optional[EmailStr] = None
    client_id: Optional[str] = None
    age: Optional[int] = None
    phone_country_code: Optional[str] = "+20"
    phone_number: Optional[str] = None
    password: Optional[str] = None
    test_and_record: Optional[str] = None
    mental_notes: Optional[str] = None
    medical_allergies: Optional[str] = None
    medical_notes: Optional[str] = None
    water_in_body: Optional[float] = None
    training_sessions: List[TrainingSessionItem] = Field(default_factory=list)
    supplements_list: List[SupplementItem] = Field(default_factory=list)

    # Measurement fields commonly used in add-client workflows.
    height: Optional[float] = None
    weight: Optional[float] = None
    bmi: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    skeletal_muscle: Optional[float] = None
    muscle_mass: Optional[float] = None
    water_percentage: Optional[float] = None
    minerals: Optional[float] = None
    bmr: Optional[float] = None
    tdee: Optional[float] = None
    calories: Optional[float] = None
    body_fat_mass: Optional[float] = None
    muscle_percentage: Optional[float] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name_min_parts(cls, value: str) -> str:
        parts = [p for p in str(value or "").strip().split() if p]
        if len(parts) < 4:
            raise ValueError("full_name must contain at least 4 names")
        return " ".join(parts)


class TeamPlayerCreate(TeamPlayerBase):
    """Create payload for a player row."""
    player_number: Optional[int] = None


class TeamCreateRequest(BaseModel):
    """Create payload for team + dynamic players."""
    team_name: str
    sport_type: Optional[str] = None
    coach_name: Optional[str] = None
    start_date: Optional[date] = None
    package_size: int = Field(..., ge=1, le=200)
    doctor_id: Optional[int] = None
    players: List[TeamPlayerCreate]


class TeamPlayerResponse(TeamPlayerBase):
    """Player response schema."""
    id: int
    team_id: int
    player_number: int
    phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TeamListItem(BaseModel):
    """Compact team list row for clients page table."""
    id: int
    team_name: str
    package_size: int
    players_count: int
    coach_name: Optional[str] = None
    doctor_id: Optional[int] = None


class TeamDetailResponse(BaseModel):
    """Detailed team response including all players."""
    id: int
    team_name: str
    sport_type: Optional[str] = None
    coach_name: Optional[str] = None
    start_date: Optional[date] = None
    package_size: int
    doctor_id: Optional[int] = None
    players_count: int
    players: List[TeamPlayerResponse]
    created_at: datetime
    updated_at: datetime


class TeamCreateResponse(BaseModel):
    """Response for successful team creation."""
    message: str
    team_id: int
    players_count: int


class TeamDeleteResponse(BaseModel):
    """Response for successful team deletion."""
    message: str
    team_id: int


# ==================== Body Measurement Schemas ====================

class BodyMeasurementBase(BaseModel):
    """Base body measurement schema."""
    height: Optional[float] = None
    weight: Optional[float] = None
    bmi: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    skeletal_muscle: Optional[float] = None
    muscle_mass: Optional[float] = None
    water_percentage: Optional[float] = None
    minerals: Optional[float] = None
    bmr: Optional[float] = None
    tdee: Optional[float] = None
    body_fat_mass: Optional[float] = None
    muscle_percentage: Optional[float] = None


class BodyMeasurementCreate(BodyMeasurementBase):
    """Create body measurement schema."""
    client_id: int


class BodyMeasurementResponse(BodyMeasurementBase):
    """Body measurement response schema."""
    id: int
    client_id: int
    recorded_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Meal Schemas ====================

class MealBase(BaseModel):
    """Base meal schema."""
    meal_name: str
    meal_time: Optional[str] = None
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fats: Optional[float] = None
    ingredients: Optional[str] = None


class MealCreate(MealBase):
    """Create meal schema."""
    nutrition_plan_id: int


class MealResponse(MealBase):
    """Meal response schema."""
    id: int
    nutrition_plan_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Nutrition Plan Schemas ====================

class NutritionPlanBase(BaseModel):
    """Base nutrition plan schema."""
    plan_name: str
    plan_type: Optional[str] = None
    tdee: Optional[float] = None
    daily_calories: Optional[float] = None
    protein_grams: Optional[float] = None
    carbs_grams: Optional[float] = None
    fats_grams: Optional[float] = None
    water_intake_liters: Optional[float] = None
    notes: Optional[str] = None
    is_active: bool = True


class NutritionPlanCreate(NutritionPlanBase):
    """Create nutrition plan schema."""
    client_id: int


class NutritionPlanUpdate(NutritionPlanBase):
    """Update nutrition plan schema."""
    pass


class NutritionPlanResponse(NutritionPlanBase):
    """Nutrition plan response schema."""
    id: int
    client_id: int
    meals: List[MealResponse] = []
    assigned_date: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Workout Log Schemas ====================

class WorkoutLogBase(BaseModel):
    """Base workout log schema."""
    workout_name: str
    workout_type: Optional[str] = None
    duration_minutes: Optional[int] = None
    intensity: Optional[str] = None
    calories_burned: Optional[float] = None
    notes: Optional[str] = None


class WorkoutLogCreate(WorkoutLogBase):
    """Create workout log schema."""
    client_id: int


class WorkoutLogResponse(WorkoutLogBase):
    """Workout log response schema."""
    id: int
    client_id: int
    logged_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Mood Log Schemas ====================

class MoodLogBase(BaseModel):
    """Base mood log schema."""
    mood_level: int = Field(..., ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = None


class MoodLogCreate(MoodLogBase):
    """Create mood log schema."""
    client_id: int


class MoodLogUpdate(MoodLogBase):
    """Update mood log schema."""
    pass


class MoodLogResponse(MoodLogBase):
    """Mood log response schema."""
    id: int
    client_id: int
    logged_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Weight Log Schemas ====================

class WeightLogBase(BaseModel):
    """Base weight log schema."""
    weight: float
    body_fat_percentage: Optional[float] = None
    notes: Optional[str] = None


class WeightLogCreate(WeightLogBase):
    """Create weight log schema."""
    client_id: int


class WeightLogUpdate(WeightLogBase):
    """Update weight log schema."""
    pass


class WeightLogResponse(WeightLogBase):
    """Weight log response schema."""
    id: int
    client_id: int
    logged_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Supplement Log Schemas ====================

class SupplementLogBase(BaseModel):
    """Base supplement log schema."""
    supplement_name: str
    dosage: Optional[str] = None
    time_taken: Optional[str] = None
    notes: Optional[str] = None


class SupplementLogCreate(SupplementLogBase):
    """Create supplement log schema."""
    client_id: int


class SupplementLogUpdate(SupplementLogBase):
    """Update supplement log schema."""
    pass


class SupplementLogResponse(SupplementLogBase):
    """Supplement log response schema."""
    id: int
    client_id: int
    logged_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Mental Coaching Schemas ====================

class MentalCoachingPlanBase(BaseModel):
    """Base mental coaching plan schema."""
    plan_name: str
    description: Optional[str] = None
    exercises: Optional[str] = None
    duration_weeks: Optional[int] = None


class MentalCoachingPlanCreate(MentalCoachingPlanBase):
    """Create mental coaching plan schema."""
    pass


class MentalCoachingPlanResponse(MentalCoachingPlanBase):
    """Mental coaching plan response schema."""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Diet Template Schemas ====================

class DietTemplateBase(BaseModel):
    """Base diet template schema."""
    template_name: str
    description: Optional[str] = None
    min_kcal: Optional[float] = None
    max_kcal: Optional[float] = None
    plan_type: Optional[str] = None
    schedule_type: Optional[str] = None
    calories: Optional[float] = None
    protein_percentage: Optional[float] = None
    carbs_percentage: Optional[float] = None
    fats_percentage: Optional[float] = None
    meal_plan: Optional[str] = None


class DietTemplateCreate(DietTemplateBase):
    """Create diet template schema."""
    pass


class DietTemplateUpdate(DietTemplateBase):
    """Update diet template schema."""
    pass


class DietTemplateResponse(DietTemplateBase):
    """Diet template response schema."""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DietTemplateRecommendationRequest(BaseModel):
    """Payload for automatic diet template selection."""
    tdee: float
    wake_up_time: Optional[str] = None


class DietTemplateRecommendationResponse(BaseModel):
    """Automatic diet template selection response."""
    tdee: float
    wake_up_time: Optional[str] = None
    schedule_type: str
    reason: str
    calorie_bracket: Optional[Dict[str, Optional[float]]] = None
    recommended_template: Optional[DietTemplateResponse] = None


# ==================== Client List Response ====================

class ClientListItem(BaseModel):
    """Client list item schema."""
    id: int
    display_id: int
    full_name: str
    email: str
    phone: Optional[str]
    gender: Optional[str]
    age: Optional[int]
    activity_level: Optional[str]
    sport: Optional[str]
    priority: Optional[str]
    religion: Optional[str] = None
    created_source: Optional[str] = None
    created_at: datetime


class ClientDetailResponse(BaseModel):
    """Detailed client response schema."""
    id: int
    display_id: int
    full_name: str
    email: str
    phone: Optional[str]
    birthday: Optional[date]
    gender: Optional[str]
    country: Optional[str]
    religion: Optional[str]
    club: Optional[str]
    sport: Optional[str]
    position: Optional[str]
    activity_level: Optional[str]
    priority: Optional[str]
    competition_date: Optional[date]
    goal_weight: Optional[float]
    training_details: Optional[List[Dict[str, Any]]] = None
    injuries: Optional[str] = None
    medical: Optional[str] = None
    allergies: Optional[str] = None
    food_allergies: Optional[str] = None
    food_likes: Optional[str] = None
    food_dislikes: Optional[str] = None
    test_record_notes: Optional[str] = None
    additional_notes: Optional[str] = None
    client_notes: Optional[str] = None
    mental_observation: Optional[str] = None
    supplements: Optional[str] = None
    competition_enabled: Optional[bool] = None
    competition_status: Optional[str] = None
    progression_type: Optional[str] = None
    calories: Optional[float] = None
    protein_target: Optional[float] = None
    carbs_target: Optional[float] = None
    fats_target: Optional[float] = None
    water_intake: Optional[float] = None
    water_in_body: Optional[float] = None
    minerals: Optional[float] = None
    days_left: Optional[int] = None
    mental_obs_date: Optional[datetime] = None
    wake_up_time: Optional[str] = None
    sleep_time: Optional[str] = None
    injury_status: Optional[bool] = None
    injury_description: Optional[str] = None
    original_protein: Optional[float] = None
    original_carbs: Optional[float] = None
    original_fats: Optional[float] = None
    training_start_time: Optional[str] = None
    training_time: Optional[str] = None
    training_end_time: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    bmi: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    skeletal_muscle: Optional[float] = None
    body_fat_mass: Optional[float] = None
    muscle_percentage: Optional[float] = None
    medical_allergies: Optional[str] = None
    medical_notes: Optional[str] = None
    mental_notes: Optional[str] = None
    training_sessions: Optional[List[Dict[str, Any]]] = None
    supplements_list: Optional[List[Dict[str, Any]]] = None
    consultation_type: Optional[str] = None
    subscription_plan: Optional[str] = None
    anti_doping_focus: Optional[str] = None
    meal_swaps: Optional[Dict[str, Any]] = None
    created_source: Optional[str] = None
    measurements: List[BodyMeasurementResponse] = []
    nutrition_plans: List[NutritionPlanResponse] = []
    created_at: datetime


class ConsultationPreferences(BaseModel):
    """Consultation and subscription preferences for authenticated clients."""
    consultation_type: Optional[str] = None
    consultation_selected_at: Optional[datetime] = None
    subscription_plan: Optional[str] = None
    anti_doping_focus: Optional[str] = None


class ConsultationSelectionRequest(BaseModel):
    """Consultation selection payload from subscription page."""
    client_id: int
    consultation_type: str
    timestamp: datetime


class HomeSummaryResponse(BaseModel):
    """Compact payload for personalized client home page blocks."""
    full_name: str
    current_weight: Optional[float] = None
    target_weight: Optional[float] = None
    calories_target: Optional[float] = None
    supplements: Optional[str] = None
    consultation_type: Optional[str] = None
    consultation_selected_at: Optional[datetime] = None
    subscription_plan: Optional[str] = None
    anti_doping_focus: Optional[str] = None


class MessageResponse(BaseModel):
    """Generic success message response schema."""
    message: str


class MacroMealEntry(BaseModel):
    """Single meal payload for macro status sync."""
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    meal_id: str
    meal_key: str
    meal_label: str
    scheduled_time: Optional[str] = None
    status: Optional[str] = None
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fats: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_meal_aliases(cls, value):
        if not isinstance(value, dict):
            return value

        data = dict(value)
        if "meal_id" not in data and "mealId" in data:
            data["meal_id"] = data.get("mealId")
        if "meal_key" not in data and "mealKey" in data:
            data["meal_key"] = data.get("mealKey")
        if "meal_label" not in data and "mealLabel" in data:
            data["meal_label"] = data.get("mealLabel")
        if "scheduled_time" not in data and "scheduledTime" in data:
            data["scheduled_time"] = data.get("scheduledTime")

        return data


class TodayMacrosSyncRequest(BaseModel):
    """Client payload for syncing today's macro progress."""
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    date: Optional[str] = None
    target_calories: Optional[float] = None
    target_protein: Optional[float] = None
    target_carbs: Optional[float] = None
    target_fats: Optional[float] = None
    consumed_calories: Optional[float] = None
    consumed_protein: Optional[float] = None
    consumed_carbs: Optional[float] = None
    consumed_fats: Optional[float] = None
    meals: List[MacroMealEntry] = []
    meal_statuses: Optional[Dict[str, str]] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_payload_variants(cls, value):
        if not isinstance(value, dict):
            return value

        data = dict(value)

        # Accept legacy/nested payloads: { target: {...}, consumed: {...} }
        target = data.get("target") if isinstance(data.get("target"), dict) else {}
        consumed = data.get("consumed") if isinstance(data.get("consumed"), dict) else {}

        data.setdefault("target_calories", data.get("targetCalories") or target.get("calories"))
        data.setdefault("target_protein", data.get("targetProtein") or target.get("protein"))
        data.setdefault("target_carbs", data.get("targetCarbs") or target.get("carbs"))
        data.setdefault("target_fats", data.get("targetFats") or target.get("fats"))

        data.setdefault("consumed_calories", data.get("consumedCalories") or consumed.get("calories"))
        data.setdefault("consumed_protein", data.get("consumedProtein") or consumed.get("protein"))
        data.setdefault("consumed_carbs", data.get("consumedCarbs") or consumed.get("carbs"))
        data.setdefault("consumed_fats", data.get("consumedFats") or consumed.get("fats"))

        status_map = data.get("meal_statuses") or data.get("mealStatuses")
        if isinstance(status_map, dict) and isinstance(data.get("meals"), list):
            normalized_meals = []
            for meal in data["meals"]:
                if isinstance(meal, dict):
                    row = dict(meal)
                    meal_id = row.get("meal_id") or row.get("mealId")
                    if "status" not in row and meal_id in status_map:
                        row["status"] = status_map.get(meal_id)
                    normalized_meals.append(row)
                else:
                    normalized_meals.append(meal)
            data["meals"] = normalized_meals

        return data


class TodayMacrosSyncResponse(BaseModel):
    """Authoritative status and aggregate totals for today's macros."""
    status: str
    status_message: str
    pending_meals: int
    in_progress_meals: int
    complete_meals: int
    total_meals: int
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fats: float
    consumed_calories: float
    consumed_protein: float
    consumed_carbs: float
    consumed_fats: float
