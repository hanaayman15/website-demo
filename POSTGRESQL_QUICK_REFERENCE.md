# PostgreSQL Migration - Quick Reference

## Exact Code Diffs

### 1. requirements.txt
```diff
  python-dotenv>=1.0.0
  slowapi>=0.1.9
  python-json-logger>=2.0.7
+ psycopg2-binary>=2.9.9
  pytest>=8.0.0
```

### 2. app/database.py
```diff
- from sqlalchemy import create_engine
+ from sqlalchemy import create_engine, pool
+ import logging
+ logger = logging.getLogger(__name__)

+ # Determine if using PostgreSQL or SQLite
+ is_postgresql = settings.DATABASE_URL.startswith(("postgresql://", "postgresql+psycopg2://"))
+ is_sqlite = "sqlite" in settings.DATABASE_URL

- engine = create_engine(
-     settings.DATABASE_URL,
-     connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
- )

+ if is_postgresql:
+     # PostgreSQL with connection pooling
+     engine = create_engine(
+         settings.DATABASE_URL,
+         poolclass=pool.QueuePool,
+         pool_size=settings.DB_POOL_SIZE,
+         max_overflow=settings.DB_MAX_OVERFLOW,
+         pool_timeout=settings.DB_POOL_TIMEOUT,
+         pool_recycle=settings.DB_POOL_RECYCLE,
+         pool_pre_ping=True,
+         echo=settings.DEBUG,
+     )
+ elif is_sqlite:
+     # SQLite for development
+     engine = create_engine(
+         settings.DATABASE_URL,
+         connect_args={"check_same_thread": False},
+         echo=settings.DEBUG,
+     )
```

### 3. app/config.py
```diff
  # ==================== DATABASE ====================
  DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nutrition_management.db")
  
+ # PostgreSQL Connection Pool Settings
+ DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "5"))
+ DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))
+ DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))
+ DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "3600"))
```

### 4. .env
```diff
  # DATABASE
- DATABASE_URL=sqlite:///./nutrition_management.db
+ # SQLite (Development only)
+ DATABASE_URL=sqlite:///./nutrition_management.db
+ # PostgreSQL (Production)
+ # DATABASE_URL=postgresql://nutrition_user:password@localhost:5432/nutrition_db

+ # Connection Pool Settings
+ DB_POOL_SIZE=5
+ DB_MAX_OVERFLOW=10
+ DB_POOL_TIMEOUT=30
+ DB_POOL_RECYCLE=3600
```

---

## Installation Commands

```bash
# 1. Install PostgreSQL driver
cd backend
pip install psycopg2-binary

# Or install all dependencies
pip install -r requirements.txt

# 2. Install PostgreSQL (if not already)
# Windows
choco install postgresql

# macOS
brew install postgresql

# Ubuntu
sudo apt install postgresql postgresql-contrib

# 3. Create database
sudo -u postgres psql
```

```sql
-- In PostgreSQL shell
CREATE DATABASE nutrition_db;
CREATE USER nutrition_user WITH PASSWORD 'SecurePass123!';
GRANT ALL PRIVILEGES ON DATABASE nutrition_db TO nutrition_user;
\c nutrition_db
GRANT ALL ON SCHEMA public TO nutrition_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nutrition_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nutrition_user;
\q
```

```bash
# 4. Update .env
# Edit backend/.env and change:
DATABASE_URL=postgresql://nutrition_user:SecurePass123!@localhost:5432/nutrition_db

# 5. Initialize tables
cd backend
python -c "from app.database import init_db; init_db(); print('✓ Database ready')"

# 6. Start backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

---

## Connection String Examples

```env
# Local PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/database_name

# Remote PostgreSQL
DATABASE_URL=postgresql://user:password@db.example.com:5432/database_name

# AWS RDS
DATABASE_URL=postgresql://user:password@mydb.abc123.us-east-1.rds.amazonaws.com:5432/nutrition_db

# DigitalOcean
DATABASE_URL=postgresql://user:password@db-postgresql-nyc1-12345-do-user-67890-0.db.ondigitalocean.com:25060/nutrition_db?sslmode=require

# Heroku
DATABASE_URL=postgres://user:password@ec2-xx-xxx-xxx-xxx.compute-1.amazonaws.com:5432/dbname

# With SSL
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

---

## Connection Pool Settings

| Environment | Pool Size | Max Overflow | Timeout | Recycle |
|-------------|-----------|--------------|---------|---------|
| **Development** | 2 | 3 | 10 | 1800 |
| **Staging** | 5 | 10 | 30 | 3600 |
| **Production (Low)** | 5 | 10 | 30 | 3600 |
| **Production (High)** | 20 | 30 | 60 | 3600 |

---

## Testing

```bash
# Test with SQLite (development)
DATABASE_URL=sqlite:///./test.db python -m uvicorn app.main:app

# Test with PostgreSQL (production)
DATABASE_URL=postgresql://user:pass@localhost/nutrition_db python -m uvicorn app.main:app

# Run security tests
powershell -ExecutionPolicy Bypass -File SECURITY_TEST_PLAN.ps1 -BaseUrl "http://127.0.0.1:8001"
```

---

## Verification Checklist

- [ ] `psycopg2-binary` installed (`pip list | grep psycopg2`)
- [ ] PostgreSQL running (`sudo systemctl status postgresql`)
- [ ] Database created (`sudo -u postgres psql -l`)
- [ ] User has permissions (test connection with psql)
- [ ] DATABASE_URL updated in `.env`
- [ ] Tables created (`python -c "from app.database import init_db; init_db()"`)
- [ ] Backend starts without errors
- [ ] Health endpoint returns 200 (`curl http://127.0.0.1:8001/health`)
- [ ] Can register new user
- [ ] Can login and access protected routes

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `No module named 'psycopg2'` | `pip install psycopg2-binary` |
| `password authentication failed` | Check username/password in DATABASE_URL |
| `database does not exist` | Create database: `CREATE DATABASE nutrition_db;` |
| `connection refused` | Start PostgreSQL: `sudo systemctl start postgresql` |
| `too many connections` | Reduce `DB_POOL_SIZE` + `DB_MAX_OVERFLOW` |

---

## Key Features Added

✅ **Production-ready connection pooling** (QueuePool)  
✅ **Health checks** (pool_pre_ping=True)  
✅ **Auto-detection** (PostgreSQL vs SQLite)  
✅ **Configurable pool settings** (via environment variables)  
✅ **Connection recycling** (prevents stale connections)  
✅ **Backward compatible** (SQLite still works)  
✅ **No model changes required** (all existing models work)

---

## Production Deployment

```env
# production .env
DATABASE_URL=postgresql://prod_user:StrongPassword123!@prod-db.example.com:5432/nutrition_prod
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30
DB_POOL_TIMEOUT=60
DB_POOL_RECYCLE=3600
DEBUG=False
```

**Important:**
1. Use strong database passwords
2. Enable SSL (`?sslmode=require`)
3. Restrict database access by IP
4. Regular backups (`pg_dump`)
5. Monitor connection pool usage

---

For detailed migration instructions, see: **POSTGRESQL_MIGRATION_GUIDE.md**
