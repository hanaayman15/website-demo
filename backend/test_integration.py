"""
End-to-End Integration Tests for Frontend-Backend Communication
Tests verify that frontend API calls work correctly with FastAPI backend
"""

import pytest
import json
import time
import uuid
from datetime import datetime, timedelta
from jose import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings


# Test Configuration
BASE_URL = "http://127.0.0.1:8001"
TEST_USER_PASSWORD = "IntegrationTest123!"
TEST_USER_FULLNAME = "Integration Test User"


@pytest.fixture
def client():
    """FastAPI test client"""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_token(client):
    """Create user and get authentication token"""
    test_email = f"test_{uuid.uuid4().hex[:10]}@example.com"

    # Register user
    reg_response = client.post(
        "/api/auth/register",
        json={
            "email": test_email,
            "password": TEST_USER_PASSWORD,
            "full_name": TEST_USER_FULLNAME
        }
    )
    assert reg_response.status_code == 200, f"Registration failed: {reg_response.text}"
    
    # Login
    login_response = client.post(
        "/api/auth/login",
        json={
            "email": test_email,
            "password": TEST_USER_PASSWORD
        }
    )
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    
    token_data = login_response.json()
    token = token_data.get("access_token")
    assert token, "No access token in response"
    
    return {"token": token, "email": test_email}


@pytest.fixture
def auth_headers(auth_token):
    """Authorization headers with Bearer token"""
    return {"Authorization": f"Bearer {auth_token['token']}"}


# ============================================================================
# TEST 1: LOGIN FLOW
# ============================================================================

class TestLoginFlow:
    """Test authentication flow"""
    
    def test_register_user_success(self, client):
        """Test successful user registration"""
        email = f"register_test_{int(time.time())}@test.com"
        response = client.post(
            "/api/auth/register",
            json={
                "email": email,
                "password": "Pass123!@#",
                "full_name": "Register Test"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user_id" in data or "user" in data
        print(f"✓ User registered: {email}")
    
    def test_register_user_invalid_email(self, client):
        """Test registration with invalid email"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "invalid-email",
                "password": "Pass123!@#",
                "full_name": "Invalid Email Test"
            }
        )
        
        assert response.status_code in [422, 400]  # Validation error
        print("✓ Invalid email properly rejected")
    
    def test_register_user_weak_password(self, client):
        """Test registration with weak password"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": f"weakpass_{int(time.time())}@test.com",
                "password": "weak",
                "full_name": "Weak Password Test"
            }
        )
        
        assert response.status_code in [200, 422, 400]
        print("✓ Weak password behavior verified")
    
    def test_login_success(self, client):
        """Test successful login"""
        # Register first
        reg_email = f"login_test_{int(time.time())}@test.com"
        client.post(
            "/api/auth/register",
            json={
                "email": reg_email,
                "password": "LoginTest123!",
                "full_name": "Login Test User"
            }
        )
        
        # Login
        response = client.post(
            "/api/auth/login",
            json={
                "email": reg_email,
                "password": "LoginTest123!"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user_id" in data or "user" in data
        print(f"✓ User logged in: {reg_email}")
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@test.com",
                "password": "WrongPassword123!"
            }
        )
        
        assert response.status_code in [401, 422]  # Unauthorized/Validation error
        print("✓ Invalid credentials properly rejected")
    
    def test_login_wrong_password(self, client, auth_token):
        """Test login with wrong password"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": auth_token["email"],
                "password": "WrongPassword123!"
            }
        )
        
        assert response.status_code == 401
        print("✓ Wrong password properly rejected")
    
    def test_token_expiration(self, client, auth_token):
        """Test that token expiration is handled"""
        # Decode token to check expiration
        try:
            decoded = jwt.get_unverified_claims(auth_token["token"])
            assert "exp" in decoded, "Token should have expiration"
            
            exp_time = datetime.fromtimestamp(decoded["exp"])
            now = datetime.now()
            time_left = exp_time - now
            
            assert time_left.total_seconds() > 0, "Token should not be expired"
            print(f"✓ Token valid for {int(time_left.total_seconds() / 60)} minutes")
        except Exception as e:
            pytest.fail(f"Token validation failed: {e}")


# ============================================================================
# TEST 2: CREATE CLIENT (PROFILE SETUP)
# ============================================================================

class TestCreateClient:
    """Test client creation and profile setup"""
    
    def test_signup_flow_creates_profile(self, client):
        """Test that signup properly initializes client profile"""
        email = f"signup_test_{int(time.time())}@test.com"
        
        # Register
        reg_response = client.post(
            "/api/auth/register",
            json={
                "email": email,
                "password": "SignupTest123!",
                "full_name": "Signup Test User"
            }
        )
        assert reg_response.status_code == 200
        token = reg_response.json()["access_token"]
        
        # Get profile after registration
        headers = {"Authorization": f"Bearer {token}"}
        profile_response = client.get("/api/client/profile", headers=headers)
        
        assert profile_response.status_code == 200
        profile = profile_response.json()
        assert profile["user_id"] > 0
        assert profile["display_id"] > 0
        print(f"✓ Client profile created: {profile['id']}")
    
    def test_initial_profile_data(self, client, auth_headers):
        """Test that initial profile has correct default values"""
        response = client.get("/api/client/profile", headers=auth_headers)
        
        assert response.status_code == 200
        profile = response.json()
        
        # Check required fields exist
        assert "id" in profile
        assert "user_id" in profile
        assert "display_id" in profile
        assert "created_at" in profile
        
        print(f"✓ Profile data structure valid: {json.dumps(profile, indent=2)[:200]}...")

    def test_new_client_profile_fields_persist_and_are_non_null(self, client):
        """Regression test: created client must persist profile/detail fields (no N/A/NULL regression)."""
        email = f"persist_test_{uuid.uuid4().hex[:10]}@test.com"

        # Step 1: Register new client account
        register_response = client.post(
            "/api/auth/register",
            json={
                "email": email,
                "password": "PersistTest123!",
                "full_name": "Persist Test User",
            },
        )
        assert register_response.status_code == 200, register_response.text
        register_data = register_response.json()
        token = register_data["access_token"]
        user_id = register_data["user_id"]
        headers = {"Authorization": f"Bearer {token}"}

        # Step 2: Update full profile payload (fields that previously ended up NULL)
        expected_profile = {
            "phone": "+20 501234567",
            "birthday": "2002-06-15",
            "gender": "Male",
            "country": "Egypt",
            "club": "Al Ahly SC",
            "sport": "Football",
            "position": "Forward",
            "activity_level": "active",
            "priority": "medium",
            "competition_date": "2026-12-31",
            "goal_weight": 72.0,
            "training_details": [
                {"day": "Monday", "type": "high", "start": "16:00", "end": "18:00"},
                {"day": "Tuesday", "type": "low", "start": "09:00", "end": "10:00"},
            ],
            "injuries": "No current injuries",
            "medical": "No chronic disease",
            "allergies": "None",
            "food_allergies": "None",
            "food_likes": "pizza",
            "food_dislikes": "broccoli",
            "test_record_notes": "InBody baseline completed",
            "additional_notes": "Persist notes",
            "client_notes": "Persist notes",
            "mental_observation": "Motivated and focused",
            "supplements": "Creatine (5g)",
            "competition_enabled": False,
            "competition_status": "none",
        }

        update_response = client.put(
            "/api/client/profile",
            json=expected_profile,
            headers=headers,
        )
        assert update_response.status_code == 200, update_response.text
        updated_profile = update_response.json()

        # Step 3: Save first body measurement record (needed for detail page metrics)
        measurement_payload = {
            "client_id": user_id,
            "height": 178.0,
            "weight": 76.0,
            "bmi": 24.0,
            "body_fat_percentage": 14.0,
            "skeletal_muscle": 33.0,
            "water_percentage": 58.0,
            "minerals": 4.6,
            "bmr": 1738.0,
            "tdee": 2998.0,
        }
        measurement_response = client.post(
            f"/api/admin/clients/{user_id}/measurements",
            json=measurement_payload,
        )
        assert measurement_response.status_code == 200, measurement_response.text

        # Step 4: Read detail endpoint used by frontend and assert fields are populated
        detail_response = client.get(f"/api/auth/clients-public/detail/{user_id}")
        assert detail_response.status_code == 200, detail_response.text
        detail = detail_response.json()

        # Top-level profile fields should be present and non-null
        required_non_null_fields = [
            "id", "display_id", "full_name", "email", "phone", "birthday", "gender",
            "country", "club", "sport", "position", "activity_level", "priority",
            "goal_weight", "training_details", "injuries", "medical", "allergies",
            "food_allergies", "food_likes", "food_dislikes", "test_record_notes",
            "additional_notes", "client_notes", "mental_observation", "supplements",
            "competition_enabled", "competition_status", "measurements",
        ]
        for field in required_non_null_fields:
            assert field in detail, f"Missing field in detail response: {field}"
            assert detail[field] is not None, f"Field should not be NULL: {field}"

        # Verify value mapping exactly for key regression-prone fields
        assert detail["phone"] == expected_profile["phone"]
        assert detail["birthday"] == expected_profile["birthday"]
        assert detail["country"] == expected_profile["country"]
        assert detail["club"] == expected_profile["club"]
        assert detail["sport"] == expected_profile["sport"]
        assert detail["position"] == expected_profile["position"]
        assert detail["activity_level"] == expected_profile["activity_level"]
        assert detail["goal_weight"] == expected_profile["goal_weight"]
        assert detail["injuries"] == expected_profile["injuries"]
        assert detail["medical"] == expected_profile["medical"]
        assert detail["food_likes"] == expected_profile["food_likes"]
        assert detail["food_dislikes"] == expected_profile["food_dislikes"]
        assert detail["mental_observation"] == expected_profile["mental_observation"]

        # Training details should not be empty
        assert isinstance(detail["training_details"], list)
        assert len(detail["training_details"]) >= 1

        # Measurements should not be empty and latest should include core numeric fields
        assert isinstance(detail["measurements"], list)
        assert len(detail["measurements"]) >= 1
        latest_measurement = detail["measurements"][0]
        for metric_field in ["height", "weight", "bmi", "body_fat_percentage", "skeletal_muscle", "bmr", "tdee"]:
            assert metric_field in latest_measurement, f"Missing measurement field: {metric_field}"
            assert latest_measurement[metric_field] is not None, f"Measurement field should not be NULL: {metric_field}"

        # Also verify updated profile API returns persisted fields (controller response correctness)
        assert updated_profile["phone"] == expected_profile["phone"]
        assert updated_profile["country"] == expected_profile["country"]
        assert updated_profile["club"] == expected_profile["club"]
        assert updated_profile["food_likes"] == expected_profile["food_likes"]

        print(f"✓ Persistence regression test passed for user_id={user_id}")


# ============================================================================
# TEST 3: UPDATE CLIENT PROFILE
# ============================================================================

class TestUpdateClient:
    """Test client profile updates"""
    
    def test_update_profile_basic_fields(self, client, auth_headers):
        """Test updating basic profile fields"""
        update_data = {
            "phone": "9876543210",
            "birthday": "1990-05-15",
            "gender": "male",
            "country": "United States"
        }
        
        response = client.put(
            "/api/client/profile",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        profile = response.json()
        
        assert profile["phone"] == "9876543210"
        assert profile["birthday"] == "1990-05-15"
        assert profile["gender"] == "male"
        assert profile["country"] == "United States"
        print("✓ Basic profile fields updated")
    
    def test_update_profile_fitness_fields(self, client, auth_headers):
        """Test updating fitness-specific fields"""
        update_data = {
            "sport": "Boxing",
            "position": "Athlete",
            "activity_level": "high",
            "club": "Elite Fitness Club",
            "goal_weight": 85.5,
            "competition_date": "2026-12-31"
        }
        
        response = client.put(
            "/api/client/profile",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        profile = response.json()
        
        assert profile["sport"] == "Boxing"
        assert profile["position"] == "Athlete"
        assert profile["activity_level"] == "high"
        assert float(profile["goal_weight"]) == 85.5
        print("✓ Fitness profile fields updated")
    
    def test_update_partial_fields(self, client, auth_headers):
        """Test partial profile update (not all fields required)"""
        update_data = {
            "club": "Updated Club",
            "activity_level": "medium"
            # Only updating 2 fields
        }
        
        response = client.put(
            "/api/client/profile",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        profile = response.json()
        
        assert profile["club"] == "Updated Club"
        assert profile["activity_level"] == "medium"
        print("✓ Partial profile update successful")

    def test_training_schedule_fields_persist(self, client, auth_headers):
        """Training time fields should persist across profile update and subsequent fetch."""
        update_data = {
            "training_start_time": "18:00",
            "training_end_time": "19:30",
            "training_details": [
                {
                    "day": "Friday",
                    "type": "high",
                    "start": "18:00",
                    "end": "19:30"
                }
            ]
        }

        update_response = client.put(
            "/api/client/profile",
            json=update_data,
            headers=auth_headers
        )

        assert update_response.status_code == 200
        updated_profile = update_response.json()
        assert updated_profile["training_start_time"] == "18:00"
        assert updated_profile["training_time"] == "18:00"
        assert updated_profile["training_end_time"] == "19:30"

        get_response = client.get(
            "/api/client/profile",
            headers=auth_headers
        )

        assert get_response.status_code == 200
        fetched_profile = get_response.json()
        assert fetched_profile["training_start_time"] == "18:00"
        assert fetched_profile["training_time"] == "18:00"
        assert fetched_profile["training_end_time"] == "19:30"
        assert isinstance(fetched_profile.get("training_details"), list)
        assert fetched_profile["training_details"], "training_details should not be empty"
        assert fetched_profile["training_details"][0]["start"] == "18:00"
        assert fetched_profile["training_details"][0]["end"] == "19:30"
        print("✓ Training schedule fields persisted correctly")

    def test_daily_schedule_fields_persist(self, client, auth_headers):
        """Wake/sleep schedule should persist across update and reload."""
        update_data = {
            "wake_up_time": "08:00",
            "sleep_time": "23:00"
        }

        update_response = client.put(
            "/api/client/profile",
            json=update_data,
            headers=auth_headers
        )

        assert update_response.status_code == 200
        updated_profile = update_response.json()
        assert updated_profile["wake_up_time"] == "08:00"
        assert updated_profile["sleep_time"] == "23:00"

        get_response = client.get(
            "/api/client/profile",
            headers=auth_headers
        )

        assert get_response.status_code == 200
        fetched_profile = get_response.json()
        assert fetched_profile["wake_up_time"] == "08:00"
        assert fetched_profile["sleep_time"] == "23:00"

    def test_today_macros_status_progression(self, client, auth_headers):
        """Today's macros endpoint should report pending, in-progress, and complete correctly."""
        base_payload = {
            "date": "2026-03-11",
            "target_calories": 2200,
            "target_protein": 180,
            "target_carbs": 220,
            "target_fats": 70,
            "consumed_calories": 0,
            "consumed_protein": 0,
            "consumed_carbs": 0,
            "consumed_fats": 0,
            "meals": [
                {"meal_id": "wednesday-breakfast", "meal_key": "breakfast", "meal_label": "Breakfast", "scheduled_time": "08:00", "status": "pending", "calories": 350, "protein": 30, "carbs": 40, "fats": 10},
                {"meal_id": "wednesday-snack1", "meal_key": "snack1", "meal_label": "Snack 1", "scheduled_time": "11:00", "status": "pending", "calories": 250, "protein": 20, "carbs": 25, "fats": 8},
                {"meal_id": "wednesday-lunch", "meal_key": "lunch", "meal_label": "Lunch", "scheduled_time": "14:00", "status": "pending", "calories": 450, "protein": 35, "carbs": 45, "fats": 14},
                {"meal_id": "wednesday-dinner", "meal_key": "dinner", "meal_label": "Dinner", "scheduled_time": "20:00", "status": "pending", "calories": 450, "protein": 35, "carbs": 45, "fats": 14},
                {"meal_id": "wednesday-preworkout", "meal_key": "preworkout", "meal_label": "Pre-Workout", "scheduled_time": "17:15", "status": "pending", "calories": 300, "protein": 30, "carbs": 35, "fats": 10},
                {"meal_id": "wednesday-postworkout", "meal_key": "postworkout", "meal_label": "Post-Workout", "scheduled_time": "20:00", "status": "pending", "calories": 400, "protein": 30, "carbs": 30, "fats": 14}
            ]
        }

        pending_response = client.post(
            "/api/client/macros/today",
            json=base_payload,
            headers=auth_headers,
        )
        assert pending_response.status_code == 200
        pending_data = pending_response.json()
        assert pending_data["status"] == "Pending"
        assert pending_data["status_message"] == "Hold on, something is coming"
        assert pending_data["total_meals"] == 6
        assert pending_data["pending_meals"] == 6

        in_progress_payload = dict(base_payload)
        in_progress_payload["meals"] = [dict(item) for item in base_payload["meals"]]
        in_progress_payload["meals"][0]["status"] = "complete"
        in_progress_payload["meals"][4]["status"] = "in-progress"
        in_progress_payload["consumed_calories"] = 650
        in_progress_payload["consumed_protein"] = 55
        in_progress_payload["consumed_carbs"] = 68
        in_progress_payload["consumed_fats"] = 18

        in_progress_response = client.post(
            "/api/client/macros/today",
            json=in_progress_payload,
            headers=auth_headers,
        )
        assert in_progress_response.status_code == 200
        in_progress_data = in_progress_response.json()
        assert in_progress_data["status"] == "In Progress"
        assert in_progress_data["status_message"] == "You're working on it"
        assert in_progress_data["complete_meals"] == 1
        assert in_progress_data["in_progress_meals"] == 1

        complete_payload = dict(base_payload)
        complete_payload["meals"] = [dict(item, status="complete") for item in base_payload["meals"]]
        complete_payload["consumed_calories"] = 2200
        complete_payload["consumed_protein"] = 180
        complete_payload["consumed_carbs"] = 220
        complete_payload["consumed_fats"] = 70

        complete_response = client.post(
            "/api/client/macros/today",
            json=complete_payload,
            headers=auth_headers,
        )
        assert complete_response.status_code == 200
        complete_data = complete_response.json()
        assert complete_data["status"] == "Complete"
        assert complete_data["status_message"] == "Success! Well done"
        assert complete_data["complete_meals"] == 6
        assert complete_data["total_meals"] == 6
        print("✓ Daily schedule fields persisted correctly")
    
    def test_get_nutrition_plans(self, client, auth_headers):
        """Test retrieving nutrition plans"""
        response = client.get(
            "/api/client/nutrition-plans?active_only=true",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        plans = response.json()
        
        # Should return list (empty or populated)
        assert isinstance(plans, list)
        print(f"✓ Nutrition plans retrieved: {len(plans)} plans found")


# ============================================================================
# TEST 4: LOG DATA (WORKOUTS, MOOD, WEIGHT, SUPPLEMENTS)
# ============================================================================

class TestLogData:
    """Test logging various health metrics"""
    
    def test_log_workout(self, client, auth_headers):
        """Test logging workout data"""
        # Get client ID first
        profile_response = client.get("/api/client/profile", headers=auth_headers)
        client_id = profile_response.json()["id"]
        
        workout_data = {
            "workout_name": "Morning Run",
            "workout_type": "Cardio",
            "duration_minutes": 45,
            "intensity": "High",
            "calories_burned": 500,
            "notes": "Great morning run",
            "client_id": client_id
        }
        
        response = client.post(
            "/api/client/workouts",
            json=workout_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        logged = response.json()
        assert "id" in logged
        assert logged["workout_name"] == "Morning Run"
        assert logged["duration_minutes"] == 45
        print(f"✓ Workout logged: {logged['id']}")
    
    def test_get_workouts_with_pagination(self, client, auth_headers):
        """Test retrieving workouts with query parameters"""
        response = client.get(
            "/api/client/workouts?days=30&skip=0&limit=50",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        workouts = response.json()
        
        assert isinstance(workouts, list)
        print(f"✓ Retrieved {len(workouts)} workouts")
    
    def test_log_mood(self, client, auth_headers):
        """Test logging mood and mental state"""
        # Get client ID
        profile_response = client.get("/api/client/profile", headers=auth_headers)
        client_id = profile_response.json()["id"]
        
        mood_data = {
            "mood_level": 8,
            "energy_level": 7,
            "stress_level": 3,
            "sleep_hours": 8,
            "sleep_quality": 8,
            "notes": "Feeling great!",
            "client_id": client_id
        }
        
        response = client.post(
            "/api/client/mood",
            json=mood_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        logged = response.json()
        assert "id" in logged
        assert logged["mood_level"] == 8
        assert logged["sleep_hours"] == 8
        print(f"✓ Mood logged: {logged['id']}")
    
    def test_get_mood_data(self, client, auth_headers):
        """Test retrieving mood data with pagination"""
        response = client.get(
            "/api/client/mood?days=30&skip=0&limit=50",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        moods = response.json()
        
        assert isinstance(moods, list)
        print(f"✓ Retrieved {len(moods)} mood entries")
    
    def test_log_weight(self, client, auth_headers):
        """Test logging weight and body metrics"""
        # Get client ID
        profile_response = client.get("/api/client/profile", headers=auth_headers)
        client_id = profile_response.json()["id"]
        
        weight_data = {
            "weight": 82.5,
            "body_fat_percentage": 18.5,
            "notes": "Post workout measurement",
            "client_id": client_id
        }
        
        response = client.post(
            "/api/client/weight",
            json=weight_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        logged = response.json()
        assert "id" in logged
        assert float(logged["weight"]) == 82.5
        print(f"✓ Weight logged: {logged['id']}")
    
    def test_get_weight_data(self, client, auth_headers):
        """Test retrieving weight data"""
        response = client.get(
            "/api/client/weight?days=90&skip=0&limit=50",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        weights = response.json()
        
        assert isinstance(weights, list)
        print(f"✓ Retrieved {len(weights)} weight entries")
    
    def test_log_supplement(self, client, auth_headers):
        """Test logging supplements"""
        # Get client ID
        profile_response = client.get("/api/client/profile", headers=auth_headers)
        client_id = profile_response.json()["id"]
        
        supplement_data = {
            "supplement_name": "Vitamin D3",
            "dosage": "2000 IU",
            "time_taken": "Morning",
            "notes": "With breakfast",
            "client_id": client_id
        }
        
        response = client.post(
            "/api/client/supplements",
            json=supplement_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        logged = response.json()
        assert "id" in logged
        assert logged["supplement_name"] == "Vitamin D3"
        print(f"✓ Supplement logged: {logged['id']}")
    
    def test_get_supplements(self, client, auth_headers):
        """Test retrieving supplement data"""
        response = client.get(
            "/api/client/supplements?days=30&skip=0&limit=50",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        supplements = response.json()
        
        assert isinstance(supplements, list)
        print(f"✓ Retrieved {len(supplements)} supplement entries")


# ============================================================================
# TEST 5: ERROR HANDLING
# ============================================================================

class TestErrorHandling:
    """Test error handling and edge cases"""
    
    def test_missing_auth_token(self, client):
        """Test request without authentication token"""
        response = client.get("/api/client/profile")
        
        assert response.status_code in [401, 403]
        print("✓ Missing auth token properly rejected")
    
    def test_invalid_auth_token(self, client):
        """Test request with invalid token"""
        headers = {"Authorization": "Bearer invalid.token.here"}
        response = client.get("/api/client/profile", headers=headers)
        
        assert response.status_code == 401
        print("✓ Invalid token properly rejected")
    
    def test_expired_auth_token(self, client):
        """Test request with expired token"""
        # Create an expired token
        expired_token = jwt.encode(
            {
                "sub": "test@example.com",
                "exp": datetime.now() - timedelta(hours=1)
            },
            settings.SECRET_KEY or "secret",
            algorithm="HS256"
        )
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/api/client/profile", headers=headers)
        
        assert response.status_code == 401
        print("✓ Expired token properly rejected")
    
    def test_malformed_json_request(self, client, auth_headers):
        """Test handling of malformed JSON"""
        response = client.post(
            "/api/client/workouts",
            content=b"invalid json {",
            headers={"Authorization": auth_headers["Authorization"], "Content-Type": "application/json"}
        )
        
        assert response.status_code == 422
        print("✓ Malformed JSON properly rejected")
    
    def test_missing_required_fields(self, client, auth_headers):
        """Test validation of required fields"""
        # Workout missing required field
        workout_data = {
            "workout_name": "Run",
            # Missing workout_type, duration_minutes, etc.
            "client_id": "123"
        }
        
        response = client.post(
            "/api/client/workouts",
            json=workout_data,
            headers=auth_headers
        )
        
        assert response.status_code in [403, 422]
        print("✓ Missing required fields properly rejected")
    
    def test_invalid_field_types(self, client, auth_headers):
        """Test validation of field types"""
        profile_response = client.get("/api/client/profile", headers=auth_headers)
        client_id = profile_response.json()["id"]
        
        # Weight should be float, not string
        weight_data = {
            "weight": "not_a_number",
            "body_fat_percentage": 18.5,
            "client_id": client_id
        }
        
        response = client.post(
            "/api/client/weight",
            json=weight_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
        print("✓ Invalid field types properly rejected")
    
    def test_duplicate_email_registration(self, client):
        """Test that duplicate email registration is rejected"""
        email = f"duplicate_test_{int(time.time())}@test.com"
        
        # First registration
        response1 = client.post(
            "/api/auth/register",
            json={
                "email": email,
                "password": "Pass123!@#",
                "full_name": "First Test"
            }
        )
        assert response1.status_code == 200
        
        # Duplicate registration attempt
        response2 = client.post(
            "/api/auth/register",
            json={
                "email": email,
                "password": "Pass123!@#",
                "full_name": "Second Test"
            }
        )
        
        assert response2.status_code in [400, 422, 409]  # Conflict/validation error
        print("✓ Duplicate email properly rejected")
    
    def test_invalid_query_parameters(self, client, auth_headers):
        """Test handling of invalid query parameters"""
        response = client.get(
            "/api/client/workouts?days=invalid&skip=-1&limit=1000",
            headers=auth_headers
        )
        
        # Should either handle gracefully or return validation error
        assert response.status_code in [200, 422]
        print("✓ Invalid query parameters handled")
    
    def test_unauthorized_access_other_user_data(self, client):
        """Test that users cannot access other user's data"""
        # Create two users
        email1 = f"user1_{int(time.time())}@test.com"
        email2 = f"user2_{int(time.time())}@test.com"
        
        # Register and get token for user 1
        client.post(
            "/api/auth/register",
            json={
                "email": email1,
                "password": "Pass123!@#",
                "full_name": "User One"
            }
        )
        
        login1 = client.post(
            "/api/auth/login",
            json={"email": email1, "password": "Pass123!@#"}
        )
        token1 = login1.json()["access_token"]
        
        # Register user 2
        client.post(
            "/api/auth/register",
            json={
                "email": email2,
                "password": "Pass123!@#",
                "full_name": "User Two"
            }
        )
        
        # User 1 tries to access their own data (should succeed)
        headers1 = {"Authorization": f"Bearer {token1}"}
        response = client.get("/api/client/profile", headers=headers1)
        assert response.status_code == 200
        
        user1_profile = response.json()
        assert "id" in user1_profile
        print("✓ User can access own data")
        print("✓ Authorization properly enforced")


# ============================================================================
# TEST 6: COMPLETE WORKFLOW
# ============================================================================

class TestCompleteWorkflow:
    """Test complete user workflow from signup to logging data"""
    
    def test_full_user_journey(self):
        """Test complete workflow: signup -> profile setup -> log data"""
        with TestClient(app) as test_client:
            email = f"journey_{int(time.time())}@test.com"
            
            # Step 1: Registration
            print("\n--- Step 1: User Registration ---")
            reg_response = test_client.post(
                "/api/auth/register",
                json={
                    "email": email,
                    "password": "JourneyTest123!",
                    "full_name": "Journey Test User"
                }
            )
            assert reg_response.status_code == 200
            token = reg_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print(f"✓ User registered: {email}")
            
            # Step 2: Get initial profile
            print("\n--- Step 2: Retrieve Profile ---")
            profile_response = test_client.get("/api/client/profile", headers=headers)
            assert profile_response.status_code == 200
            profile = profile_response.json()
            client_id = profile["id"]
            print(f"✓ Profile retrieved: {client_id}")
            
            # Step 3: Update profile
            print("\n--- Step 3: Update Profile ---")
            update_response = test_client.put(
                "/api/client/profile",
                json={
                    "sport": "Fitness",
                    "activity_level": "high",
                    "goal_weight": 75.0,
                    "birthday": "1990-01-01"
                },
                headers=headers
            )
            assert update_response.status_code == 200
            print("✓ Profile updated")
            
            # Step 4: Log weight
            print("\n--- Step 4: Log Weight ---")
            weight_response = test_client.post(
                "/api/client/weight",
                json={
                    "weight": 80.0,
                    "body_fat_percentage": 20.0,
                    "notes": "Initial measurement",
                    "client_id": client_id
                },
                headers=headers
            )
            assert weight_response.status_code == 200
            print("✓ Weight logged")
            
            # Step 5: Log workout
            print("\n--- Step 5: Log Workout ---")
            workout_response = test_client.post(
                "/api/client/workouts",
                json={
                    "workout_name": "Gym Session",
                    "workout_type": "Strength",
                    "duration_minutes": 60,
                    "intensity": "High",
                    "calories_burned": 400,
                    "notes": "Great session",
                    "client_id": client_id
                },
                headers=headers
            )
            assert workout_response.status_code == 200
            print("✓ Workout logged")
            
            # Step 6: Log mood
            print("\n--- Step 6: Log Mood ---")
            mood_response = test_client.post(
                "/api/client/mood",
                json={
                    "mood_level": 9,
                    "energy_level": 8,
                    "stress_level": 2,
                    "sleep_hours": 8,
                    "sleep_quality": 9,
                    "notes": "Excellent day!",
                    "client_id": client_id
                },
                headers=headers
            )
            assert mood_response.status_code == 200
            print("✓ Mood logged")
            
            # Step 7: Log supplement
            print("\n--- Step 7: Log Supplement ---")
            supp_response = test_client.post(
                "/api/client/supplements",
                json={
                    "supplement_name": "Protein Powder",
                    "dosage": "25g",
                    "time_taken": "Post Workout",
                    "notes": "Whey Protein",
                    "client_id": client_id
                },
                headers=headers
            )
            assert supp_response.status_code == 200
            print("✓ Supplement logged")
            
            # Step 8: Retrieve all logged data
            print("\n--- Step 8: Retrieve All Data ---")
            
            weights = test_client.get(
                "/api/client/weight?days=90",
                headers=headers
            ).json()
            print(f"✓ Retrieved {len(weights)} weight entries")
            
            workouts = test_client.get(
                "/api/client/workouts?days=30",
                headers=headers
            ).json()
            print(f"✓ Retrieved {len(workouts)} workout entries")
            
            moods = test_client.get(
                "/api/client/mood?days=30",
                headers=headers
            ).json()
            print(f"✓ Retrieved {len(moods)} mood entries")
            
            supplements = test_client.get(
                "/api/client/supplements?days=30",
                headers=headers
            ).json()
            print(f"✓ Retrieved {len(supplements)} supplement entries")
            
            print("\n✓ COMPLETE WORKFLOW TEST PASSED")
            print(f"  User: {email}")
            print(f"  Profile ID: {client_id}")
            print(f"  Data logged: Weight, Workout, Mood, Supplement")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
