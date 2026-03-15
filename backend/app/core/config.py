"""Core config facade used by the phased architecture."""
from app.config import Settings, settings, validate_settings


def get_settings() -> Settings:
    """Return validated global settings instance."""
    return settings


__all__ = ["Settings", "get_settings", "settings", "validate_settings"]
