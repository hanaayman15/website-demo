"""Database configuration and session management."""
from sqlalchemy import create_engine, pool, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings
import logging

logger = logging.getLogger(__name__)


def _ensure_client_profile_columns():
    """Add newly introduced client profile columns if they don't exist yet."""
    required_columns = {
        "training_details": "TEXT",
        "injuries": "TEXT",
        "medical": "TEXT",
        "religion": "VARCHAR(100)",
        "allergies": "TEXT",
        "food_allergies": "TEXT",
        "food_likes": "TEXT",
        "food_dislikes": "TEXT",
        "test_record_notes": "TEXT",
        "additional_notes": "TEXT",
        "client_notes": "TEXT",
        "mental_observation": "TEXT",
        "supplements": "TEXT",
        "competition_enabled": "BOOLEAN DEFAULT 0",
        "competition_status": "VARCHAR(100)",
        "progression_type": "VARCHAR(50)",
        "calories": "FLOAT",
        "protein_target": "FLOAT",
        "carbs_target": "FLOAT",
        "fats_target": "FLOAT",
        "water_intake": "FLOAT",
        "days_left": "INTEGER",
        "mental_obs_date": "DATETIME",
        "wake_up_time": "VARCHAR(20)",
        "sleep_time": "VARCHAR(20)",
        "injury_status": "BOOLEAN DEFAULT 0",
        "injury_description": "TEXT",
        "original_protein": "FLOAT",
        "original_carbs": "FLOAT",
        "original_fats": "FLOAT",
        "training_time": "VARCHAR(50)",
        "training_end_time": "VARCHAR(50)",
        "consultation_type": "VARCHAR(100)",
        "consultation_selected_at": "DATETIME",
        "subscription_plan": "VARCHAR(100)",
        "anti_doping_focus": "TEXT",
        "meal_swaps": "TEXT",
        "created_source": "VARCHAR(50) DEFAULT 'admin_added'",
    }

    inspector = inspect(engine)
    existing = {col["name"] for col in inspector.get_columns("client_profiles")}

    missing = [(name, col_type) for name, col_type in required_columns.items() if name not in existing]
    if not missing:
        return

    with engine.begin() as conn:
        for name, col_type in missing:
            conn.execute(text(f"ALTER TABLE client_profiles ADD COLUMN {name} {col_type}"))
            logger.info(f"Added missing column client_profiles.{name}")


def _ensure_body_measurement_columns():
    """Add newly introduced body measurement columns if they don't exist yet."""
    required_columns = {
        "muscle_mass": "FLOAT",
        "body_fat_mass": "FLOAT",
        "muscle_percentage": "FLOAT",
    }

    inspector = inspect(engine)
    existing = {col["name"] for col in inspector.get_columns("body_measurements")}

    missing = [(name, col_type) for name, col_type in required_columns.items() if name not in existing]
    if not missing:
        return

    with engine.begin() as conn:
        for name, col_type in missing:
            conn.execute(text(f"ALTER TABLE body_measurements ADD COLUMN {name} {col_type}"))
            logger.info(f"Added missing column body_measurements.{name}")


def _ensure_players_columns():
    """Add newly introduced team player columns if they don't exist yet."""
    inspector = inspect(engine)
    if "players" not in inspector.get_table_names():
        return

    required_columns = {
        "client_id": "VARCHAR(50)",
        "password_hash": "VARCHAR(255)",
        "phone_country_code": "VARCHAR(10)",
        "phone_number": "VARCHAR(30)",
        "medical_allergies": "TEXT",
        "medical_notes": "TEXT",
        "test_and_record": "TEXT",
        "mental_notes": "TEXT",
        "water_in_body": "FLOAT",
        "calories": "FLOAT",
        "age": "INTEGER",
    }

    existing = {col["name"] for col in inspector.get_columns("players")}
    missing = [(name, col_type) for name, col_type in required_columns.items() if name not in existing]
    if not missing:
        return

    with engine.begin() as conn:
        for name, col_type in missing:
            conn.execute(text(f"ALTER TABLE players ADD COLUMN {name} {col_type}"))
            logger.info(f"Added missing column players.{name}")


def _ensure_users_columns():
    """Add compatibility columns for user role model updates."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    required_columns = {
        "name": "VARCHAR(255)",
        "password_hash": "VARCHAR(255)",
    }

    existing = {col["name"] for col in inspector.get_columns("users")}
    missing = [(name, col_type) for name, col_type in required_columns.items() if name not in existing]
    if not missing:
        return

    with engine.begin() as conn:
        for name, col_type in missing:
            conn.execute(text(f"ALTER TABLE users ADD COLUMN {name} {col_type}"))
            logger.info(f"Added missing column users.{name}")


def _ensure_teams_columns():
    """Add ownership columns required for doctor-scoped teams."""
    inspector = inspect(engine)
    if "teams" not in inspector.get_table_names():
        return

    required_columns = {
        "doctor_id": "INTEGER",
    }

    existing = {col["name"] for col in inspector.get_columns("teams")}
    missing = [(name, col_type) for name, col_type in required_columns.items() if name not in existing]
    if not missing:
        return

    with engine.begin() as conn:
        for name, col_type in missing:
            conn.execute(text(f"ALTER TABLE teams ADD COLUMN {name} {col_type}"))
            logger.info(f"Added missing column teams.{name}")


def _ensure_diet_templates_columns():
    """Add structured diet template metadata columns if missing."""
    inspector = inspect(engine)
    if "diet_templates" not in inspector.get_table_names():
        return

    required_columns = {
        "min_kcal": "FLOAT",
        "max_kcal": "FLOAT",
        "plan_type": "VARCHAR(50)",
        "schedule_type": "VARCHAR(50)",
    }

    existing = {col["name"] for col in inspector.get_columns("diet_templates")}
    missing = [(name, col_type) for name, col_type in required_columns.items() if name not in existing]
    if not missing:
        return

    with engine.begin() as conn:
        for name, col_type in missing:
            conn.execute(text(f"ALTER TABLE diet_templates ADD COLUMN {name} {col_type}"))
            logger.info(f"Added missing column diet_templates.{name}")


def _ensure_nutrition_profile_columns():
    """Add nutrition profile compatibility columns if missing."""
    inspector = inspect(engine)
    if "nutrition_profiles" not in inspector.get_table_names():
        return

    required_columns = {
        "calories": "FLOAT",
    }

    existing = {col["name"] for col in inspector.get_columns("nutrition_profiles")}
    missing = [(name, col_type) for name, col_type in required_columns.items() if name not in existing]
    if not missing:
        return

    with engine.begin() as conn:
        for name, col_type in missing:
            conn.execute(text(f"ALTER TABLE nutrition_profiles ADD COLUMN {name} {col_type}"))
            logger.info(f"Added missing column nutrition_profiles.{name}")

# Determine if using PostgreSQL or SQLite
is_postgresql = settings.DATABASE_URL.startswith(("postgresql://", "postgresql+psycopg2://"))
is_sqlite = "sqlite" in settings.DATABASE_URL

# Configure engine based on database type
if is_postgresql:
    # PostgreSQL production configuration with connection pooling
    engine = create_engine(
        settings.DATABASE_URL,
        poolclass=pool.QueuePool,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
        pool_recycle=settings.DB_POOL_RECYCLE,
        pool_pre_ping=True,  # Enable connection health checks
        echo=settings.DEBUG,  # Log SQL queries in debug mode
    )
    logger.info(f"PostgreSQL engine configured: pool_size={settings.DB_POOL_SIZE}, max_overflow={settings.DB_MAX_OVERFLOW}")
elif is_sqlite:
    # SQLite development configuration
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=settings.DEBUG,
    )
    logger.warning("Using SQLite - NOT RECOMMENDED FOR PRODUCTION")
else:
    # Fallback for other database types
    engine = create_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
    )
    logger.info(f"Database engine configured for: {settings.DATABASE_URL.split(':')[0]}")

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables and seed demo data."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        _ensure_users_columns()
        _ensure_teams_columns()
        _ensure_client_profile_columns()
        _ensure_body_measurement_columns()
        _ensure_players_columns()
        _ensure_diet_templates_columns()
        _ensure_nutrition_profile_columns()
        
        # Seed demo users if they don't exist
        from app.models import User, ClientProfile
        from app.security import hash_password
        
        db = SessionLocal()
        try:
            # Check if demo client already exists
            demo_user = db.query(User).filter(User.email == "demo@client.com").first()
            if not demo_user:
                # Create demo client user with correct full name
                demo_user = User(
                    email="demo@client.com",
                    full_name="Abdelrhman Mohamed Ramdan",
                    hashed_password=hash_password("demo123"),
                    role="client",
                    is_active=True
                )
                db.add(demo_user)
                db.flush()
                
                # Create client profile for demo user with ID 101
                demo_profile = ClientProfile(
                    user_id=demo_user.id,
                    display_id=101
                )
                db.add(demo_profile)
                db.commit()
                logger.info("Demo client user created: demo@client.com (Abdelrhman Mohamed Ramdan)")
            else:
                # Update existing demo user to have correct full name
                if demo_user.full_name != "Abdelrhman Mohamed Ramdan":
                    demo_user.full_name = "Abdelrhman Mohamed Ramdan"
                    db.commit()
                    logger.info("Demo client user updated with correct full name")
                else:
                    logger.info("Demo client user already exists with correct name")
        except Exception as e:
            logger.error(f"Failed to seed demo users: {e}")
            db.rollback()
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise
