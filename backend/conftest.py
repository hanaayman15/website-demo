"""Pytest bootstrap configuration for isolated test environment."""
import os

test_db_path = "./test_integration.db"
if os.path.exists(test_db_path):
	os.remove(test_db_path)

# Ensure tests run with deterministic, local-safe settings before app import
os.environ["TESTING"] = "True"
os.environ["DEBUG"] = "False"
os.environ["DATABASE_URL"] = "sqlite:///./test_integration.db"
os.environ["SECRET_KEY"] = "test-secret-key-32-characters-minimum-length-required"
os.environ["ADMIN_EMAIL"] = "admin@nutrition.com"
os.environ["ADMIN_PASSWORD"] = "admin123secure!"
os.environ["FRONTEND_URL"] = "http://127.0.0.1:5500"
os.environ["RATE_LIMIT_ENABLED"] = "False"
os.environ["LOGIN_RATE_LIMIT"] = "100000 per minute"
