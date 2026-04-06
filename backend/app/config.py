"""Configuration settings for the application."""
import os
import sys
from datetime import timedelta
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    """Application settings with production-grade security."""
    
    # ==================== REQUIRED SETTINGS (FAIL IF MISSING) ====================
    # SECRET KEY for JWT signing - MUST be at least 32 characters
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    
    # Admin credentials - MUST be set via environment
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "")
    
    # ==================== DATABASE ====================
    # Read from environment first; fallback to SQLite is applied in app.database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "").strip()
    
    # PostgreSQL Connection Pool Settings (only used with PostgreSQL)
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "5"))  # Number of persistent connections
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))  # Max additional connections
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))  # Seconds to wait for connection
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "3600"))  # Recycle connections after N seconds
    
    # ==================== JWT SETTINGS ====================
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # ==================== APPLICATION ====================
    APP_NAME: str = os.getenv("APP_NAME", "Client Nutrition Management System")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")
    TESTING: bool = os.getenv("TESTING", "False").lower() in ("true", "1", "yes")
    
    # ==================== SECURITY ====================
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "True").lower() in ("true", "1", "yes")
    LOGIN_RATE_LIMIT: str = os.getenv("LOGIN_RATE_LIMIT", "5 per minute")  # Format: "5 per minute"
    
    # ==================== LOGGING ====================
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()
    LOG_FORMAT: str = os.getenv("LOG_FORMAT", "json")  # json or text

    # ==================== EMAIL (SMTP) ====================
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "True").lower() in ("true", "1", "yes")
    
    # ==================== CORS ====================
    # Frontend URL for production (GitHub Pages frontend)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://hanaayman15.github.io")
    # Fallback CORS origins (development only)
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "")
    
    # ==================== DEPLOYMENT ====================
    # Trusted hosts (comma-separated, supports wildcards)
    TRUSTED_HOSTS: str = os.getenv("TRUSTED_HOSTS", "*")  # "*" allows all in production
    
    class Config:
        env_file = ".env"


def validate_settings() -> Settings:
    """Validate required settings and fail fast if missing."""
    settings = Settings()

    if settings.TESTING:
        print("[INFO] TESTING mode enabled - skipping production validation")
        return settings

    errors = []
    
    # Check SECRET_KEY
    if not settings.SECRET_KEY or len(settings.SECRET_KEY) < 32:
        errors.append("[ERROR] SECRET_KEY is missing or less than 32 characters!")
        errors.append("   Generate with: python -c \"import secrets; print(secrets.token_urlsafe(32))\"")
    
    database_url = settings.DATABASE_URL
    is_sqlite = not database_url or database_url.startswith("sqlite:///")
    is_postgresql = database_url.startswith(("postgresql://", "postgresql+psycopg2://", "postgres://"))
    is_render_env = bool(os.getenv("RENDER") or os.getenv("RENDER_SERVICE_ID"))

    # Allow local development fallback to SQLite when DATABASE_URL is unset.
    # Require PostgreSQL only for deployed environments (e.g., Render).
    if is_render_env and not is_postgresql:
        errors.append("[ERROR] Render deployment requires PostgreSQL DATABASE_URL!")
        errors.append("   Set DATABASE_URL to PostgreSQL connection string")
        errors.append("   Example: postgresql://user:pass@host:5432/dbname?sslmode=require")

    if database_url and not is_sqlite and not is_postgresql:
        errors.append("[ERROR] DATABASE_URL must be PostgreSQL, postgres://, or sqlite:/// format")
        errors.append(f"   Current: {database_url[:40]}...")

    # Validate SSL mode for production PostgreSQL (remote databases)
    if is_postgresql:
        normalized_db_url = database_url.replace("postgres://", "postgresql://", 1)
        is_remote_db = "localhost" not in normalized_db_url and "127.0.0.1" not in normalized_db_url
        if is_remote_db and "sslmode=" not in normalized_db_url:
            errors.append("[ERROR] Production PostgreSQL must use SSL!")
            errors.append("   Add ?sslmode=require to DATABASE_URL")
            errors.append("   Example: postgresql://user:pass@host:5432/db?sslmode=require")

        # Enforce DEBUG=False for remote PostgreSQL
        if is_remote_db and settings.DEBUG:
            errors.append("[ERROR] DEBUG=True is not allowed with remote PostgreSQL!")
            errors.append("   Set DEBUG=False in production environment")
    
    # Check ADMIN_EMAIL
    if not settings.ADMIN_EMAIL or "@" not in settings.ADMIN_EMAIL:
        errors.append("[ERROR] ADMIN_EMAIL is missing or invalid!")
    
    # Check ADMIN_PASSWORD
    if not settings.ADMIN_PASSWORD or len(settings.ADMIN_PASSWORD) < 8:
        errors.append("[ERROR] ADMIN_PASSWORD is missing or less than 8 characters!")

    # Validate JWT access token window
    if not 15 <= settings.ACCESS_TOKEN_EXPIRE_MINUTES <= 60:
        errors.append("[ERROR] ACCESS_TOKEN_EXPIRE_MINUTES must be between 15 and 60 minutes!")
        errors.append(f"   Current: {settings.ACCESS_TOKEN_EXPIRE_MINUTES}")

    if settings.REFRESH_TOKEN_EXPIRE_DAYS < 1:
        errors.append("[ERROR] REFRESH_TOKEN_EXPIRE_DAYS must be at least 1 day!")
    
    # Check CORS configuration
    if not settings.FRONTEND_URL and not settings.CORS_ORIGINS:
        errors.append("[WARNING] Neither FRONTEND_URL nor CORS_ORIGINS is set!")
        errors.append("   Set FRONTEND_URL for production deployment")
    
    # If any errors, print them and exit
    if errors:
        print("\n" + "="*70)
        print("[FATAL] PRODUCTION DEPLOYMENT VALIDATION FAILED")
        print("="*70)
        for error in errors:
            print(error)
        print("="*70)
        print("\nSet all required environment variables and try again.")
        print("See .env.example for configuration template.\n")
        sys.exit(1)
    
    # Success message
    print("[SUCCESS] Production configuration validated successfully")
    if is_postgresql:
        db_type = "PostgreSQL"
        ssl_status = "with SSL" if "sslmode=" in settings.DATABASE_URL else "no SSL"
    else:
        db_type = "SQLite (local fallback)"
        ssl_status = "n/a"
    print(f"   Database: {db_type} ({ssl_status})")
    print(f"   Debug mode: {settings.DEBUG}")
    print(f"   CORS: {settings.FRONTEND_URL or settings.CORS_ORIGINS[:50]}...")
    print(f"   Pool size: {settings.DB_POOL_SIZE}")
    
    return settings


# Initialize settings with validation
settings = validate_settings()

