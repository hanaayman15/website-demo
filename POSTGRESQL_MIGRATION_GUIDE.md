# PostgreSQL Migration Guide
**FastAPI Client Nutrition Management System**

---

## Overview

Your FastAPI project has been migrated to support **PostgreSQL** with production-ready connection pooling. All existing SQLAlchemy models remain compatible.

---

## What Changed

### ✅ Files Modified

1. **requirements.txt** - Added `psycopg2-binary>=2.9.9`
2. **app/database.py** - PostgreSQL connection pooling with health checks
3. **app/config.py** - Added connection pool configuration
4. **.env** - Added PostgreSQL connection examples
5. **.env.example** - Added PostgreSQL configuration templates

### ✅ Backward Compatibility

- **SQLite still works** for development
- All existing models unchanged
- No breaking changes to API

---

## Quick Start

### Step 1: Install PostgreSQL Driver

```bash
cd backend
pip install -r requirements.txt
```

This installs `psycopg2-binary` (PostgreSQL adapter for Python).

### Step 2: Set Up PostgreSQL Database

#### Option A: Local Installation (Development)

**Install PostgreSQL:**
```bash
# Windows (using Chocolatey)
choco install postgresql

# Or download from: https://www.postgresql.org/download/windows/

# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**Create Database:**
```bash
# Switch to postgres user
sudo -u postgres psql

# Inside psql:
CREATE DATABASE nutrition_db;
CREATE USER nutrition_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE nutrition_db TO nutrition_user;

# Connect to database
\c nutrition_db

# Grant schema privileges
GRANT ALL ON SCHEMA public TO nutrition_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nutrition_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nutrition_user;

# Exit
\q
```

#### Option B: Cloud PostgreSQL (Production)

**Providers:**
- **AWS RDS** - Managed PostgreSQL
- **DigitalOcean** - Managed Databases
- **Heroku Postgres** - Simple setup
- **Azure Database** - Microsoft cloud
- **Supabase** - Free tier available

### Step 3: Update .env File

Edit `backend/.env`:

```env
# Comment out SQLite
# DATABASE_URL=sqlite:///./nutrition_management.db

# Add PostgreSQL connection
DATABASE_URL=postgresql://nutrition_user:your_secure_password@localhost:5432/nutrition_db

# Connection pool settings
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600
```

**Connection String Format:**
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**Examples:**
```env
# Local
DATABASE_URL=postgresql://nutrition_user:MyPass123@localhost:5432/nutrition_db

# Remote
DATABASE_URL=postgresql://user:pass@db.example.com:5432/nutrition_db

# With explicit driver
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/nutrition_db
```

### Step 4: Initialize Database Tables

```bash
cd backend
python -c "from app.database import init_db; init_db(); print('✓ Database initialized')"
```

This creates all tables defined in your SQLAlchemy models.

### Step 5: Verify Connection

```bash
# Start backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001

# Test health endpoint
curl http://127.0.0.1:8001/health
```

---

## Data Migration (SQLite → PostgreSQL)

If you have existing SQLite data to migrate:

### Method 1: Using Python Script

Create `migrate_data.py` in `backend/`:

```python
"""Migrate data from SQLite to PostgreSQL."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, User, ClientProfile, WeightLog, WorkoutLog, MoodLog, SupplementLog
import sys

# Source (SQLite)
sqlite_url = "sqlite:///./nutrition_management.db"
sqlite_engine = create_engine(sqlite_url)
SQLiteSession = sessionmaker(bind=sqlite_engine)

# Destination (PostgreSQL)
postgresql_url = input("Enter PostgreSQL URL: ")
postgresql_engine = create_engine(postgresql_url)
PostgreSQLSession = sessionmaker(bind=postgresql_engine)

def migrate():
    """Migrate all data from SQLite to PostgreSQL."""
    sqlite_session = SQLiteSession()
    postgresql_session = PostgreSQLSession()
    
    try:
        # Create tables in PostgreSQL
        Base.metadata.create_all(bind=postgresql_engine)
        print("✓ Tables created in PostgreSQL")
        
        # Migrate Users
        users = sqlite_session.query(User).all()
        for user in users:
            postgresql_session.merge(user)
        postgresql_session.commit()
        print(f"✓ Migrated {len(users)} users")
        
        # Migrate Client Profiles
        profiles = sqlite_session.query(ClientProfile).all()
        for profile in profiles:
            postgresql_session.merge(profile)
        postgresql_session.commit()
        print(f"✓ Migrated {len(profiles)} client profiles")
        
        # Migrate Weight Logs
        weight_logs = sqlite_session.query(WeightLog).all()
        for log in weight_logs:
            postgresql_session.merge(log)
        postgresql_session.commit()
        print(f"✓ Migrated {len(weight_logs)} weight logs")
        
        # Migrate Workout Logs
        workout_logs = sqlite_session.query(WorkoutLog).all()
        for log in workout_logs:
            postgresql_session.merge(log)
        postgresql_session.commit()
        print(f"✓ Migrated {len(workout_logs)} workout logs")
        
        # Migrate Mood Logs
        mood_logs = sqlite_session.query(MoodLog).all()
        for log in mood_logs:
            postgresql_session.merge(log)
        postgresql_session.commit()
        print(f"✓ Migrated {len(mood_logs)} mood logs")
        
        # Migrate Supplement Logs
        supplement_logs = sqlite_session.query(SupplementLog).all()
        for log in supplement_logs:
            postgresql_session.merge(log)
        postgresql_session.commit()
        print(f"✓ Migrated {len(supplement_logs)} supplement logs")
        
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        postgresql_session.rollback()
        sys.exit(1)
    finally:
        sqlite_session.close()
        postgresql_session.close()

if __name__ == "__main__":
    migrate()
```

**Run migration:**
```bash
python migrate_data.py
```

### Method 2: Using pgloader (Recommended)

```bash
# Install pgloader
sudo apt install pgloader  # Ubuntu
brew install pgloader      # macOS

# Create migration config
cat > migration.load << EOF
LOAD DATABASE
     FROM sqlite://nutrition_management.db
     INTO postgresql://nutrition_user:password@localhost/nutrition_db
     WITH data only
     SET work_mem to '16MB', maintenance_work_mem to '512 MB';
EOF

# Run migration
pgloader migration.load
```

---

## Connection Pool Configuration

### Recommended Settings

**Development:**
```env
DB_POOL_SIZE=2
DB_MAX_OVERFLOW=3
DB_POOL_TIMEOUT=10
DB_POOL_RECYCLE=1800
```

**Production (Low Traffic):**
```env
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600
```

**Production (High Traffic):**
```env
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30
DB_POOL_TIMEOUT=60
DB_POOL_RECYCLE=3600
```

### Parameter Explanations

| Parameter | Description | Default |
|-----------|-------------|---------|
| `DB_POOL_SIZE` | Number of persistent connections kept open | 5 |
| `DB_MAX_OVERFLOW` | Max additional connections when pool full | 10 |
| `DB_POOL_TIMEOUT` | Seconds to wait for connection before error | 30 |
| `DB_POOL_RECYCLE` | Recycle connections after N seconds (prevents stale connections) | 3600 |

### Features Enabled

✅ **pool_pre_ping=True** - Checks connection health before use  
✅ **pool_recycle** - Prevents stale connections  
✅ **QueuePool** - Production-grade connection pooling  
✅ **Auto-detection** - Automatically uses PostgreSQL settings when detected

---

## Troubleshooting

### Error: "psycopg2 not installed"

```bash
pip install psycopg2-binary
```

### Error: "FATAL: password authentication failed"

- Check username/password in DATABASE_URL
- Verify PostgreSQL user exists
- Check `pg_hba.conf` authentication method

### Error: "database does not exist"

```bash
sudo -u postgres psql
CREATE DATABASE nutrition_db;
```

### Error: "connection refused"

- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify port 5432 is open
- Check host/port in DATABASE_URL

### Error: "too many connections"

- Increase PostgreSQL max_connections
- Reduce DB_POOL_SIZE + DB_MAX_OVERFLOW

### Performance Issues

1. **Enable connection pooling** - Already configured
2. **Add database indexes** - Check models for index=True
3. **Use query optimization** - Add .options(joinedload()) for relationships
4. **Monitor slow queries** - Enable `echo=True` in debug mode

---

## Database Comparison

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| **Concurrent Writes** | ❌ Single writer | ✅ Multiple writers |
| **Production Ready** | ❌ No | ✅ Yes |
| **Scalability** | ❌ Limited | ✅ Excellent |
| **Data Types** | ⚠️ Basic | ✅ Advanced (JSON, Arrays, etc.) |
| **Connection Pooling** | ❌ N/A | ✅ Yes |
| **Remote Access** | ❌ File-based | ✅ Network-based |
| **Backup/Restore** | ⚠️ File copy | ✅ Robust tools |
| **Full-text Search** | ⚠️ Limited | ✅ Advanced |
| **Cost** | ✅ Free | ✅ Free (open source) |

---

## Testing Both Databases

Your code now supports **both** SQLite and PostgreSQL:

```bash
# Test with SQLite
DATABASE_URL=sqlite:///./nutrition_management.db python -m uvicorn app.main:app

# Test with PostgreSQL
DATABASE_URL=postgresql://user:pass@localhost/nutrition_db python -m uvicorn app.main:app
```

---

## Production Deployment

### 1. Security Checklist

- [ ] Use strong database password (16+ characters)
- [ ] Enable SSL/TLS for database connections
- [ ] Restrict PostgreSQL to specific IP addresses
- [ ] Use connection pooling (already configured)
- [ ] Enable PostgreSQL authentication logs
- [ ] Regular database backups

### 2. PostgreSQL SSL Connection

```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

SSL modes:
- `disable` - No SSL (not recommended)
- `require` - SSL required
- `verify-ca` - Verify server certificate
- `verify-full` - Verify server certificate and hostname

### 3. Environment-Specific Configs

**Development:**
```env
DATABASE_URL=postgresql://dev_user:dev_pass@localhost:5432/nutrition_dev
DEBUG=True
DB_POOL_SIZE=2
```

**Staging:**
```env
DATABASE_URL=postgresql://staging_user:staging_pass@staging-db:5432/nutrition_staging
DEBUG=False
DB_POOL_SIZE=5
```

**Production:**
```env
DATABASE_URL=postgresql://prod_user:prod_pass@prod-db:5432/nutrition_prod
DEBUG=False
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30
```

---

## Monitoring

### PostgreSQL Statistics

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check connection pool usage
SELECT datname, numbackends FROM pg_stat_database WHERE datname = 'nutrition_db';

-- Find slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Application Logs

With `echo=True` in debug mode, SQLAlchemy logs all queries:

```python
# In database.py (already configured)
engine = create_engine(DATABASE_URL, echo=settings.DEBUG)
```

---

## Rollback to SQLite

If needed, simply update `.env`:

```env
DATABASE_URL=sqlite:///./nutrition_management.db
```

Restart the backend - it will automatically use SQLite.

---

## Additional Resources

- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/
- **psycopg2 Docs**: https://www.psycopg.org/docs/
- **Connection Pooling**: https://docs.sqlalchemy.org/en/20/core/pooling.html

---

## Summary

✅ **PostgreSQL driver installed** (`psycopg2-binary`)  
✅ **Connection pooling configured** (production-ready)  
✅ **Environment variables added** (.env and .env.example)  
✅ **Backward compatible** (SQLite still works)  
✅ **Health checks enabled** (pool_pre_ping)  
✅ **Auto-detection** (automatically uses PostgreSQL when detected)

**Next Steps:**
1. Install PostgreSQL
2. Create database and user
3. Update DATABASE_URL in .env
4. Run `python -c "from app.database import init_db; init_db()"`
5. Test backend: `python -m uvicorn app.main:app --host 127.0.0.1 --port 8001`

---

**Migration Complete!** 🎉
