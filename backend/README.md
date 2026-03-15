# Client Nutrition Management System - Backend API

A production-ready FastAPI backend for managing nutrition plans, client profiles, and fitness tracking with role-based access control.

## Features

### 🔐 Security
- JWT-based authentication
- Role-based access control (Admin/Client)
- Password hashing with bcrypt
- Secure credentials management
- CORS protection
- Host header validation

### 👥 User Management
- Client registration and login
- Admin authentication
- Role-based permissions
- User profile management
- Account activation/deactivation

### 📊 Admin Dashboard
- View all clients with advanced filtering:
  - Filter by gender, age, activity level, sport, priority
  - Sort by name, phone, ID, age
  - Pagination support
- Create, edit, delete clients
- Assign nutrition plans
- Assign mental coaching plans
- Manage supplement assignments
- Create and manage diet templates
- Generate reports (extensible)

### 💪 Client Dashboard
- View assigned nutrition plans
- Track weight and body metrics
- Log workouts with intensity and duration
- Track mood, energy, and stress levels
- Log sleep patterns
- Track supplement intake
- Update personal information
- View mental coaching exercises

### 🗄️ Database
- SQLite with SQLAlchemy ORM
- Relational schema with proper relationships
- Data persistence and integrity
- Extensible for future databases

### 📁 Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app initialization
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database setup
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── security.py          # JWT and password utilities
│   ├── dependencies.py      # Dependency injection
│   └── routers/
│       ├── __init__.py
│       ├── auth.py          # Authentication endpoints
│       ├── admin.py         # Admin-only endpoints
│       ├── clients.py       # Client-only endpoints
│       └── public.py        # Public endpoints
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Setup Instructions

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Setup Environment Variables
```bash
# Copy example to .env
cp .env.example .env

# Edit .env and update values (especially SECRET_KEY)
```

### 4. Initialize Database
```bash
# Database tables will be created automatically on first run
# Or manually initialize:
python -c "from app.database import init_db; init_db()"
```

### 5. Run the Server
```bash
# Development mode with auto-reload
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new client
- `POST /login` - Login (admin or client)
- `GET /me` - Get current user info

### Admin Routes (`/api/admin`) [Requires admin role]
- `GET /clients` - List all clients with filters
- `GET /clients/{client_id}` - Get client details
- `POST /clients` - Create new client
- `PUT /clients/{client_id}` - Update client
- `DELETE /clients/{client_id}` - Delete client
- `POST /nutrition-plans` - Create nutrition plan
- `GET /diet-templates` - List diet templates
- `POST /diet-templates` - Create diet template
- `PUT /diet-templates/{template_id}` - Update diet template
- `DELETE /diet-templates/{template_id}` - Delete diet template

### Client Routes (`/api/client`) [Requires client role]
- `GET /profile` - Get client profile
- `PUT /profile` - Update client profile
- `GET /nutrition-plans` - Get assigned plans
- `GET /nutrition-plans/{plan_id}` - Get plan details
- `POST /workouts` - Log workout
- `GET /workouts` - Get workout history
- `POST /mood` - Log mood
- `GET /mood` - Get mood history
- `POST /weight` - Log weight
- `GET /weight` - Get weight history
- `POST /supplements` - Log supplement
- `GET /supplements` - Get supplement history

### Public Routes (`/api/public`)
- `GET /` - Home information
- `GET /about` - About page
- `GET /features` - Features list
- `GET /clinic` - Clinic information
- `GET /success-stories` - Success stories
- `GET /contact` - Contact information
- `GET /system-info` - API information

## Authentication

### Admin Login
```json
{
  "email": "admin@nutrition.com",
  "password": "admin123secure!"
}
```

### Response
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user_id": 0,
  "role": "admin"
}
```

### Using Token
Include in requests:
```
Authorization: Bearer <access_token>
```

## Database Models

### Users
- Email (unique)
- Full name
- Hashed password
- Role (admin/client)
- Active status
- Timestamps

### ClientProfiles
- Display ID (unique)
- Personal info (phone, birthday, gender, country, etc.)
- Physical measurements
- Competition date
- Goal weight
- Relationships to measurements, plans, logs

### BodyMeasurements
- Height, weight, BMI
- Body fat percentage
- Skeletal muscle mass
- Water and mineral percentages
- BMR, TDEE

### NutritionPlans
- Plan name and type
- Macro targets (protein, carbs, fats)
- Daily calories
- Water intake target
- Meal associations

### Meals
- Meal name and timing
- Calories and macros
- Ingredients

### Workout Logs
- Workout name and type
- Duration and intensity
- Calories burned
- Notes

### Mood Logs
- Mood level (1-10)
- Energy and stress levels
- Sleep hours and quality
- Notes

### Weight Logs
- Weight and body fat
- Notes and timestamp

### SupplementLogs
- Supplement name
- Dosage and timing
- Notes

### MentalCoachingPlans
- Plan name and description
- Exercises
- Duration

### DietTemplates
- Template name
- Macro percentages
- Meal plan structure

## Error Handling

All errors return consistent JSON response:
```json
{
  "status": "error",
  "status_code": 400,
  "detail": "Error message"
}
```

## Security Considerations

### In Production:
1. Change `SECRET_KEY` to a strong random string
2. Change admin credentials
3. Update CORS origins to specific domains
4. Update TrustedHostMiddleware allowed_hosts
5. Use environment variables for all sensitive data
6. Enable HTTPS
7. Set `DEBUG=false`
8. Use PostgreSQL instead of SQLite
9. Implement rate limiting
10. Add request validation and sanitization

## Testing

Run tests:
```bash
pytest
```

## Extending the Backend

### Adding New Endpoints
1. Create router in `app/routers/`
2. Include router in `app/main.py`
3. Use existing models/schemas or create new ones
4. Add Authentication dependency as needed

### Adding New Models
1. Define SQLAlchemy model in `app/models.py`
2. Create corresponding Pydantic schema in `app/schemas.py`
3. Update relationships in `Base.metadata.create_all()`
4. Create router with CRUD operations

### Adding New Roles
1. Update role values in models
2. Create new dependency in `app/dependencies.py`
3. Apply dependency to route decorator

## Performance Optimization

- Database indexes on frequently filtered fields
- Pagination for list endpoints
- Lazy loading of relationships
- Query optimization with joins
- Caching with Redis (future enhancement)

## License

Proprietary - All Rights Reserved

## Support

For issues and feature requests, contact: support@nutrition.com
