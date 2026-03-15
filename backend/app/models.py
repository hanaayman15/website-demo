"""SQLAlchemy models for database tables."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    """User model for authentication."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="doctor")  # 'admin', 'doctor', or legacy 'client'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    client_profile = relationship("ClientProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(email={self.email}, role={self.role})>"


class RefreshToken(Base):
    """Refresh token tracking model for token rotation security."""
    
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_jti = Column(String(255), unique=True, index=True, nullable=False)  # JWT ID (unique token identifier)
    is_revoked = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    revoked_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="refresh_tokens")
    
    def __repr__(self):
        return f"<RefreshToken(user_id={self.user_id}, jti={self.token_jti[:8]}..., revoked={self.is_revoked})>"


class ClientProfile(Base):
    """Client profile model."""
    
    __tablename__ = "client_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    display_id = Column(Integer, unique=True, index=True)  # Display ID for clients
    phone = Column(String(20), nullable=True)
    birthday = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)  # Male, Female
    country = Column(String(100), nullable=True)
    religion = Column(String(100), nullable=True)
    club = Column(String(255), nullable=True)
    sport = Column(String(100), nullable=True)
    position = Column(String(100), nullable=True)
    activity_level = Column(String(50), nullable=True)  # sedentary, light, moderate, active, very-active, extremely-active
    priority = Column(String(20), default="medium")  # high, medium, low
    competition_date = Column(Date, nullable=True)
    goal_weight = Column(Float, nullable=True)
    training_details = Column(Text, nullable=True)  # JSON string of weekly training entries
    injuries = Column(Text, nullable=True)
    medical = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    food_allergies = Column(Text, nullable=True)
    food_likes = Column(Text, nullable=True)
    food_dislikes = Column(Text, nullable=True)
    test_record_notes = Column(Text, nullable=True)
    additional_notes = Column(Text, nullable=True)
    client_notes = Column(Text, nullable=True)
    mental_observation = Column(Text, nullable=True)
    supplements = Column(Text, nullable=True)
    competition_enabled = Column(Boolean, default=False)
    competition_status = Column(String(100), nullable=True)
    progression_type = Column(String(50), nullable=True)
    calories = Column(Float, nullable=True)
    protein_target = Column(Float, nullable=True)
    carbs_target = Column(Float, nullable=True)
    fats_target = Column(Float, nullable=True)
    water_intake = Column(Float, nullable=True)
    days_left = Column(Integer, nullable=True)
    mental_obs_date = Column(DateTime, nullable=True)
    wake_up_time = Column(String(20), nullable=True)
    sleep_time = Column(String(20), nullable=True)
    injury_status = Column(Boolean, default=False)
    injury_description = Column(Text, nullable=True)
    original_protein = Column(Float, nullable=True)
    original_carbs = Column(Float, nullable=True)
    original_fats = Column(Float, nullable=True)
    training_time = Column(String(50), nullable=True)
    training_end_time = Column(String(50), nullable=True)
    consultation_type = Column(String(100), nullable=True)
    consultation_selected_at = Column(DateTime, nullable=True)
    subscription_plan = Column(String(100), nullable=True)
    anti_doping_focus = Column(Text, nullable=True)
    meal_swaps = Column(Text, nullable=True)  # JSON string for client meal substitutions/day meal state
    created_source = Column(String(50), default="admin_added")  # admin_added or profile_setup
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="client_profile")
    measurements = relationship("BodyMeasurement", back_populates="client", cascade="all, delete-orphan")
    nutrition_plans = relationship("NutritionPlan", back_populates="client", cascade="all, delete-orphan")
    nutrition_profile = relationship("NutritionProfile", back_populates="client", uselist=False, cascade="all, delete-orphan")
    workout_logs = relationship("WorkoutLog", back_populates="client", cascade="all, delete-orphan")
    mood_logs = relationship("MoodLog", back_populates="client", cascade="all, delete-orphan")
    weight_logs = relationship("WeightLog", back_populates="client", cascade="all, delete-orphan")
    supplement_logs = relationship("SupplementLog", back_populates="client", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ClientProfile(user_id={self.user_id}, display_id={self.display_id})>"


class Team(Base):
    """Team model for grouped player management."""

    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    team_name = Column(String(255), nullable=False, index=True)
    sport_type = Column(String(100), nullable=True)
    coach_name = Column(String(255), nullable=True)
    start_date = Column(Date, nullable=True)
    package_size = Column(Integer, nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    players = relationship("Player", back_populates="team", cascade="all, delete-orphan")
    doctor = relationship("User")

    def __repr__(self):
        return f"<Team(id={self.id}, name={self.team_name}, size={self.package_size})>"


class Player(Base):
    """Player model that mirrors add-client style fields and links to a team."""

    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    player_number = Column(Integer, nullable=False)
    client_id = Column(String(50), nullable=True)

    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=True)
    phone_country_code = Column(String(10), nullable=True)
    phone_number = Column(String(30), nullable=True)
    phone = Column(String(50), nullable=True)
    birthday = Column(Date, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True)
    religion = Column(String(100), nullable=True)
    club = Column(String(255), nullable=True)  # sport club
    sport = Column(String(100), nullable=True)
    position = Column(String(100), nullable=True)
    activity_level = Column(String(50), nullable=True)
    priority = Column(String(20), nullable=True)
    competition_date = Column(Date, nullable=True)
    goal_weight = Column(Float, nullable=True)
    training_details = Column(Text, nullable=True)
    injuries = Column(Text, nullable=True)
    medical = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    medical_allergies = Column(Text, nullable=True)
    medical_notes = Column(Text, nullable=True)
    food_allergies = Column(Text, nullable=True)
    food_likes = Column(Text, nullable=True)
    food_dislikes = Column(Text, nullable=True)
    test_record_notes = Column(Text, nullable=True)
    test_and_record = Column(Text, nullable=True)
    additional_notes = Column(Text, nullable=True)
    client_notes = Column(Text, nullable=True)
    mental_notes = Column(Text, nullable=True)
    mental_observation = Column(Text, nullable=True)
    supplements = Column(Text, nullable=True)
    competition_enabled = Column(Boolean, default=False)
    competition_status = Column(String(100), nullable=True)
    progression_type = Column(String(50), nullable=True)
    calories = Column(Float, nullable=True)
    protein_target = Column(Float, nullable=True)
    carbs_target = Column(Float, nullable=True)
    fats_target = Column(Float, nullable=True)
    water_intake = Column(Float, nullable=True)
    water_in_body = Column(Float, nullable=True)
    days_left = Column(Integer, nullable=True)
    mental_obs_date = Column(DateTime, nullable=True)
    wake_up_time = Column(String(20), nullable=True)
    sleep_time = Column(String(20), nullable=True)
    injury_status = Column(Boolean, default=False)
    injury_description = Column(Text, nullable=True)
    original_protein = Column(Float, nullable=True)
    original_carbs = Column(Float, nullable=True)
    original_fats = Column(Float, nullable=True)
    training_time = Column(String(50), nullable=True)
    training_end_time = Column(String(50), nullable=True)
    consultation_type = Column(String(100), nullable=True)
    consultation_selected_at = Column(DateTime, nullable=True)
    subscription_plan = Column(String(100), nullable=True)
    anti_doping_focus = Column(Text, nullable=True)
    meal_swaps = Column(Text, nullable=True)
    created_source = Column(String(50), default="team_add")

    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    body_fat_percentage = Column(Float, nullable=True)
    skeletal_muscle = Column(Float, nullable=True)
    muscle_mass = Column(Float, nullable=True)
    water_percentage = Column(Float, nullable=True)
    minerals = Column(Float, nullable=True)
    bmr = Column(Float, nullable=True)
    tdee = Column(Float, nullable=True)
    body_fat_mass = Column(Float, nullable=True)
    muscle_percentage = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    team = relationship("Team", back_populates="players")
    training_sessions = relationship("TrainingSession", back_populates="player", cascade="all, delete-orphan")
    supplement_items = relationship("PlayerSupplement", back_populates="player", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Player(id={self.id}, team_id={self.team_id}, number={self.player_number})>"


class TrainingSession(Base):
    """Dynamic training sessions linked to a player."""

    __tablename__ = "training_sessions"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)
    session_info = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("Player", back_populates="training_sessions")


class PlayerSupplement(Base):
    """Dynamic supplements linked to a player."""

    __tablename__ = "supplements"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)
    supplement_info = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("Player", back_populates="supplement_items")


class BodyMeasurement(Base):
    """Body measurements model."""
    
    __tablename__ = "body_measurements"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("client_profiles.id"), nullable=False)
    height = Column(Float, nullable=True)  # cm
    weight = Column(Float, nullable=True)  # kg
    bmi = Column(Float, nullable=True)
    body_fat_percentage = Column(Float, nullable=True)
    skeletal_muscle = Column(Float, nullable=True)  # kg
    muscle_mass = Column(Float, nullable=True)  # kg - total muscle mass
    water_percentage = Column(Float, nullable=True)
    minerals = Column(Float, nullable=True)
    bmr = Column(Float, nullable=True)  # Basal Metabolic Rate
    tdee = Column(Float, nullable=True)  # Total Daily Energy Expenditure
    body_fat_mass = Column(Float, nullable=True)
    muscle_percentage = Column(Float, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    client = relationship("ClientProfile", back_populates="measurements")
    
    def __repr__(self):
        return f"<BodyMeasurement(client_id={self.client_id}, weight={self.weight}kg)>"


class NutritionPlan(Base):
    """Nutrition plan model."""
    
    __tablename__ = "nutrition_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("client_profiles.id"), nullable=False)
    plan_name = Column(String(255), nullable=False)
    plan_type = Column(String(50), nullable=True)  # bulk, cut, maintain
    tdee = Column(Float, nullable=True)
    daily_calories = Column(Float, nullable=True)
    protein_grams = Column(Float, nullable=True)
    carbs_grams = Column(Float, nullable=True)
    fats_grams = Column(Float, nullable=True)
    water_intake_liters = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    assigned_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    client = relationship("ClientProfile", back_populates="nutrition_plans")
    meals = relationship("Meal", back_populates="nutrition_plan", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<NutritionPlan(client_id={self.client_id}, plan_type={self.plan_type})>"


class NutritionProfile(Base):
    """Nutrition profile model linked 1:1 with client profile."""

    __tablename__ = "nutrition_profiles"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("client_profiles.id"), nullable=False, unique=True, index=True)

    # Physical Measurements
    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    body_fat_percentage = Column(Float, nullable=True)
    skeletal_muscle = Column(Float, nullable=True)
    body_fat_mass = Column(Float, nullable=True)
    muscle_percentage = Column(Float, nullable=True)

    # Metabolism & Activity
    bmr = Column(Float, nullable=True)
    activity_level = Column(String(50), nullable=True)
    sport = Column(String(100), nullable=True)
    position = Column(String(100), nullable=True)
    tdee = Column(Float, nullable=True)

    # Nutrition Plan
    progression_type = Column(String(50), nullable=True)
    calories = Column(Float, nullable=True)
    protein_target = Column(Float, nullable=True)
    carbs_target = Column(Float, nullable=True)
    fats_target = Column(Float, nullable=True)

    # Hydration
    water_in_body = Column(Float, nullable=True)
    water_intake = Column(Float, nullable=True)
    minerals = Column(Float, nullable=True)

    # Health & Observations
    test_record_notes = Column(Text, nullable=True)
    injuries = Column(Text, nullable=True)
    mental_notes = Column(Text, nullable=True)
    medical_allergies = Column(Text, nullable=True)
    food_allergies = Column(Text, nullable=True)
    medical_notes = Column(Text, nullable=True)

    # Food Preferences
    food_likes = Column(Text, nullable=True)
    food_dislikes = Column(Text, nullable=True)

    # Goals & Timeline
    competition_status = Column(String(100), nullable=True)
    competition_date = Column(Date, nullable=True)
    days_left = Column(Integer, nullable=True)
    goal_weight = Column(Float, nullable=True)
    additional_notes = Column(Text, nullable=True)

    # Dynamic sections serialized as JSON text
    training_sessions = Column(Text, nullable=True)
    supplements = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("ClientProfile", back_populates="nutrition_profile")

    def __repr__(self):
        return f"<NutritionProfile(client_id={self.client_id})>"


class Meal(Base):
    """Meals within nutrition plan."""
    
    __tablename__ = "meals"
    
    id = Column(Integer, primary_key=True, index=True)
    nutrition_plan_id = Column(Integer, ForeignKey("nutrition_plans.id"), nullable=False)
    meal_name = Column(String(255), nullable=False)
    meal_time = Column(String(20), nullable=True)  # breakfast, lunch, dinner, snack
    calories = Column(Float, nullable=True)
    protein = Column(Float, nullable=True)
    carbs = Column(Float, nullable=True)
    fats = Column(Float, nullable=True)
    ingredients = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    nutrition_plan = relationship("NutritionPlan", back_populates="meals")
    
    def __repr__(self):
        return f"<Meal(nutrition_plan_id={self.nutrition_plan_id}, meal_name={self.meal_name})>"


class WorkoutLog(Base):
    """Workout logging model."""
    
    __tablename__ = "workout_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("client_profiles.id"), nullable=False)
    workout_name = Column(String(255), nullable=False)
    workout_type = Column(String(50), nullable=True)  # cardio, strength, flexibility, etc.
    duration_minutes = Column(Integer, nullable=True)
    intensity = Column(String(20), nullable=True)  # low, moderate, high, intense
    calories_burned = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    logged_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    client = relationship("ClientProfile", back_populates="workout_logs")
    
    def __repr__(self):
        return f"<WorkoutLog(client_id={self.client_id}, workout_name={self.workout_name})>"


class MoodLog(Base):
    """Mood tracking model."""
    
    __tablename__ = "mood_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("client_profiles.id"), nullable=False)
    mood_level = Column(Integer, nullable=False)  # 1-10 scale
    energy_level = Column(Integer, nullable=True)  # 1-10 scale
    stress_level = Column(Integer, nullable=True)  # 1-10 scale
    sleep_hours = Column(Float, nullable=True)
    sleep_quality = Column(Integer, nullable=True)  # 1-10 scale
    notes = Column(Text, nullable=True)
    logged_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    client = relationship("ClientProfile", back_populates="mood_logs")
    
    def __repr__(self):
        return f"<MoodLog(client_id={self.client_id}, mood_level={self.mood_level})>"


class WeightLog(Base):
    """Weight tracking model."""
    
    __tablename__ = "weight_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("client_profiles.id"), nullable=False)
    weight = Column(Float, nullable=False)  # kg
    body_fat_percentage = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    logged_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    client = relationship("ClientProfile", back_populates="weight_logs")
    
    def __repr__(self):
        return f"<WeightLog(client_id={self.client_id}, weight={self.weight}kg)>"


class SupplementLog(Base):
    """Supplement intake tracking model."""
    
    __tablename__ = "supplement_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("client_profiles.id"), nullable=False)
    supplement_name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=True)
    time_taken = Column(String(20), nullable=True)  # morning, afternoon, evening, night
    notes = Column(Text, nullable=True)
    logged_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    client = relationship("ClientProfile", back_populates="supplement_logs")
    
    def __repr__(self):
        return f"<SupplementLog(client_id={self.client_id}, supplement_name={self.supplement_name})>"


class MentalCoachingPlan(Base):
    """Mental coaching plan model."""
    
    __tablename__ = "mental_coaching_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    exercises = Column(Text, nullable=True)  # JSON or formatted text
    duration_weeks = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<MentalCoachingPlan(plan_name={self.plan_name})>"


class DietTemplate(Base):
    """Default diet templates for quick plan creation."""
    
    __tablename__ = "diet_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    template_name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    min_kcal = Column(Float, nullable=True)
    max_kcal = Column(Float, nullable=True)
    plan_type = Column(String(50), nullable=True)
    schedule_type = Column(String(50), nullable=True)
    calories = Column(Float, nullable=True)
    protein_percentage = Column(Float, nullable=True)
    carbs_percentage = Column(Float, nullable=True)
    fats_percentage = Column(Float, nullable=True)
    meal_plan = Column(Text, nullable=True)  # JSON structure
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<DietTemplate(template_name={self.template_name})>"


class PasswordReset(Base):
    """Password reset token model for password recovery."""
    
    __tablename__ = "password_resets"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    verification_code = Column(String(6), nullable=False)  # 6-digit code
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)  # Code expires in 15 minutes
    
    def __repr__(self):
        return f"<PasswordReset(email={self.email}, used={self.is_used})>"
