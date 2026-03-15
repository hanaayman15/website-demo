# Backend Setup & Launch Guide

## Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Run the Server
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server will start at: **http://localhost:8000**

### Step 3: Access the API Documentation
- **Interactive Swagger UI**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc

---

## Complete Setup Instructions

### Prerequisites
- Python 3.8 or higher
- pip package manager

### 1. Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

**Production:**
```bash
pip install -r requirements.txt
```

**Development (includes testing tools):**
```bash
pip install -r requirements-dev.txt
```

### 3. Configure Environment

**Copy environment template:**
```bash
cp .env.example .env
```

**Edit `.env` file:**
- Change `SECRET_KEY` to a secure random string (at least 32 characters)
- Optionally change `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- Adjust other settings as needed

### 4. Run the Server

**Development Mode (with auto-reload):**
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Production Mode:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## API Usage Examples

### 1. Register a New Client

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "full_name": "John Doe",
    "password": "secure_password_123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user_id": 1,
  "role": "client"
}
```

### 2. Admin Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nutrition.com",
    "password": "admin123secure!"
  }'
```

### 3. Use Token in Requests

```bash
curl -X GET http://localhost:8000/api/admin/clients \
  -H "Authorization: Bearer your_token_here"
```

### 4. Get Client's Nutrition Plans

```bash
curl -X GET "http://localhost:8000/api/client/nutrition-plans?active_only=true" \
  -H "Authorization: Bearer your_token_here"
```

### 5. Log a Workout

```bash
curl -X POST http://localhost:8000/api/client/workouts \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "workout_name": "Morning Run",
    "workout_type": "cardio",
    "duration_minutes": 30,
    "intensity": "high",
    "calories_burned": 350
  }'
```

### 6. Log Weight

```bash
curl -X POST http://localhost:8000/api/client/weight \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "weight": 75.5,
    "body_fat_percentage": 18.2
  }'
```

---

## API Endpoints Summary

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new client | Public |
| POST | `/api/auth/login` | Login (admin/client) | Public |
| GET | `/api/public/` | Home page info | Public |
| GET | `/api/admin/clients` | List all clients | Admin |
| GET | `/api/admin/clients/{id}` | Get client details | Admin |
| POST | `/api/admin/clients` | Create client | Admin |
| PUT | `/api/admin/clients/{id}` | Update client | Admin |
| DELETE | `/api/admin/clients/{id}` | Delete client | Admin |
| POST | `/api/admin/nutrition-plans` | Create nutrition plan | Admin |
| GET | `/api/client/profile` | Get own profile | Client |
| PUT | `/api/client/profile` | Update own profile | Client |
| GET | `/api/client/nutrition-plans` | Get assigned plans | Client |
| POST | `/api/client/workouts` | Log workout | Client |
| GET | `/api/client/workouts` | Get workout history | Client |
| POST | `/api/client/mood` | Log mood | Client |
| GET | `/api/client/mood` | Get mood history | Client |
| POST | `/api/client/weight` | Log weight | Client |
| GET | `/api/client/weight` | Get weight history | Client |

---

## Troubleshooting

### Issue: "Module not found" error
**Solution:** Ensure virtual environment is activated
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### Issue: Port 8000 already in use
**Solution:** Use a different port
```bash
python -m uvicorn app.main:app --reload --port 8001
```

### Issue: Database errors
**Solution:** Delete the database file and restart
```bash
# Remove database
rm nutrition_management.db

# Restart server - new database will be created
```

### Issue: JWT token errors
**Solution:** Update `SECRET_KEY` in `.env` and regenerate tokens
```
SECRET_KEY=your-new-secure-key-at-least-32-chars
```

---

## Development Tips

### Using Swagger UI for Testing
1. Go to http://localhost:8000/docs
2. Click "Authorize" and enter your token
3. Try endpoints directly in the UI

### View Logs
Check terminal where server is running for detailed logs

### Debug Mode
Set `DEBUG=true` in `.env` for detailed error messages

### Run Tests
```bash
# Install dev dependencies first
pip install -r requirements-dev.txt

# Run tests
pytest
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Change `SECRET_KEY` in `.env`
- [ ] Change admin email and password
- [ ] Update CORS origins in `app/main.py`
- [ ] Update `TrustedHostMiddleware` allowed_hosts
- [ ] Set `DEBUG=false` in `.env`
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable HTTPS
- [ ] Set up proper logging
- [ ] Add rate limiting
- [ ] Configure backup strategy
- [ ] Set up monitoring/alerts
- [ ] Review security headers

---

## Support

For documentation, visit http://localhost:8000/docs while server is running

For issues or questions, refer to README.md in the backend directory
