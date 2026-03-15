"""Basic tests for FastAPI backend."""
import pytest
import time
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine

# Create test database tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)


class TestPublicEndpoints:
    """Test public endpoints."""
    
    def test_root(self):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        assert "app_name" in response.json()
    
    def test_health_check(self):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    def test_public_home(self):
        """Test public home endpoint."""
        response = client.get("/api/public/")
        assert response.status_code == 200
        assert "title" in response.json()
    
    def test_public_about(self):
        """Test public about endpoint."""
        response = client.get("/api/public/about")
        assert response.status_code == 200
        assert "title" in response.json()


class TestAuth:
    """Test authentication endpoints."""
    
    def test_admin_login(self):
        """Test admin login."""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "admin@nutrition.com",
                "password": "admin123secure!"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"
        assert "access_token" in data
    
    def test_invalid_login(self):
        """Test invalid login."""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "admin@nutrition.com",
                "password": "wrong_password"
            }
        )
        assert response.status_code == 401
    
    def test_register_client(self):
        """Test client registration."""
        unique_email = f"newclient_{int(time.time() * 1000)}@example.com"
        response = client.post(
            "/api/auth/register",
            json={
                "email": unique_email,
                "full_name": "Test Client",
                "password": "test_password_123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "client"
        assert "access_token" in data
    
    def test_register_duplicate_email(self):
        """Test registration with duplicate email."""
        client.post(
            "/api/auth/register",
            json={
                "email": "duplicate@example.com",
                "full_name": "First User",
                "password": "password123"
            }
        )
        
        response = client.post(
            "/api/auth/register",
            json={
                "email": "duplicate@example.com",
                "full_name": "Second User",
                "password": "password123"
            }
        )
        assert response.status_code == 400


class TestAdminRoutes:
    """Test admin routes."""
    
    def get_admin_token(self):
        """Get admin token for testing."""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "admin@nutrition.com",
                "password": "admin123secure!"
            }
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_list_clients_requires_auth(self):
        """Test that client list requires authentication."""
        response = client.get("/api/admin/clients")
        assert response.status_code in [401, 403]
    
    def test_list_clients_with_auth(self):
        """Test list clients with proper authentication."""
        token = self.get_admin_token()
        response = client.get(
            "/api/admin/clients",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestClientLogCrud:
    """Integration test examples for weight, mood, and supplement CRUD."""

    def _register_and_get_headers(self, prefix: str):
        ts = int(time.time() * 1000)
        email = f"{prefix}_{ts}@example.com"
        password = "Pass1234!"

        register_response = client.post(
            "/api/auth/register",
            json={
                "email": email,
                "full_name": f"{prefix} user",
                "password": password,
            },
        )
        assert register_response.status_code == 200

        login_response = client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
        )
        assert login_response.status_code == 200

        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        profile_response = client.get("/api/client/profile", headers=headers)
        assert profile_response.status_code == 200
        client_id = profile_response.json()["id"]

        return headers, client_id

    def test_weight_put_delete_with_403_404(self):
        owner_headers, owner_client_id = self._register_and_get_headers("weight_owner")
        other_headers, _ = self._register_and_get_headers("weight_other")

        create_response = client.post(
            "/api/client/weight",
            headers=owner_headers,
            json={
                "weight": 76.2,
                "body_fat_percentage": 19.1,
                "notes": "initial",
                "client_id": owner_client_id,
            },
        )
        assert create_response.status_code == 200
        weight_id = create_response.json()["id"]

        update_response = client.put(
            f"/api/client/weight/{weight_id}",
            headers=owner_headers,
            json={"weight": 75.8, "body_fat_percentage": 18.9, "notes": "updated"},
        )
        assert update_response.status_code == 200
        assert update_response.json()["weight"] == 75.8

        forbidden_update = client.put(
            f"/api/client/weight/{weight_id}",
            headers=other_headers,
            json={"weight": 70.0, "body_fat_percentage": 15.0, "notes": "hijack"},
        )
        assert forbidden_update.status_code == 403

        not_found_update = client.put(
            "/api/client/weight/99999999",
            headers=owner_headers,
            json={"weight": 74.0, "body_fat_percentage": 18.0, "notes": "missing"},
        )
        assert not_found_update.status_code == 404

        delete_response = client.delete(f"/api/client/weight/{weight_id}", headers=owner_headers)
        assert delete_response.status_code == 200

    def test_mood_put_delete_with_403_404(self):
        owner_headers, owner_client_id = self._register_and_get_headers("mood_owner")
        other_headers, _ = self._register_and_get_headers("mood_other")

        create_response = client.post(
            "/api/client/mood",
            headers=owner_headers,
            json={
                "mood_level": 7,
                "energy_level": 6,
                "stress_level": 4,
                "sleep_hours": 7.5,
                "sleep_quality": 8,
                "notes": "initial",
                "client_id": owner_client_id,
            },
        )
        assert create_response.status_code == 200
        mood_id = create_response.json()["id"]

        update_response = client.put(
            f"/api/client/mood/{mood_id}",
            headers=owner_headers,
            json={
                "mood_level": 8,
                "energy_level": 7,
                "stress_level": 3,
                "sleep_hours": 8.0,
                "sleep_quality": 9,
                "notes": "updated",
            },
        )
        assert update_response.status_code == 200
        assert update_response.json()["mood_level"] == 8

        forbidden_delete = client.delete(f"/api/client/mood/{mood_id}", headers=other_headers)
        assert forbidden_delete.status_code == 403

        not_found_delete = client.delete("/api/client/mood/99999999", headers=owner_headers)
        assert not_found_delete.status_code == 404

        delete_response = client.delete(f"/api/client/mood/{mood_id}", headers=owner_headers)
        assert delete_response.status_code == 200

    def test_supplement_put_delete_with_403_404(self):
        owner_headers, owner_client_id = self._register_and_get_headers("supp_owner")
        other_headers, _ = self._register_and_get_headers("supp_other")

        create_response = client.post(
            "/api/client/supplements",
            headers=owner_headers,
            json={
                "supplement_name": "Vitamin D",
                "dosage": "2000 IU",
                "time_taken": "Morning",
                "notes": "initial",
                "client_id": owner_client_id,
            },
        )
        assert create_response.status_code == 200
        supplement_id = create_response.json()["id"]

        update_response = client.put(
            f"/api/client/supplements/{supplement_id}",
            headers=owner_headers,
            json={
                "supplement_name": "Magnesium",
                "dosage": "400 mg",
                "time_taken": "Night",
                "notes": "updated",
            },
        )
        assert update_response.status_code == 200
        assert update_response.json()["supplement_name"] == "Magnesium"

        forbidden_update = client.put(
            f"/api/client/supplements/{supplement_id}",
            headers=other_headers,
            json={
                "supplement_name": "Zinc",
                "dosage": "30 mg",
                "time_taken": "Evening",
                "notes": "hijack",
            },
        )
        assert forbidden_update.status_code == 403

        not_found_update = client.put(
            "/api/client/supplements/99999999",
            headers=owner_headers,
            json={
                "supplement_name": "Omega 3",
                "dosage": "1000 mg",
                "time_taken": "Morning",
                "notes": "missing",
            },
        )
        assert not_found_update.status_code == 404

        delete_response = client.delete(f"/api/client/supplements/{supplement_id}", headers=owner_headers)
        assert delete_response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
