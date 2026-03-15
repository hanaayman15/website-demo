# Production Deployment Quick Reference Card

## Critical Command Sequence (Copy-Paste Ready)

### 1. Generate SECRET_KEY
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy output and paste into .env
```

### 2. Create .env File
```bash
# backend/.env
SECRET_KEY=<paste-from-above>
ADMIN_EMAIL=your-admin@company.com
ADMIN_PASSWORD=YourSecurePassword123!@#$%
DATABASE_URL=sqlite:///./nutrition_management.db
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
TRUSTED_HOSTS=localhost,127.0.0.1
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=debug
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3. Install Additional Packages
```bash
cd backend
pip install python-json-logger slowapi
```

### 4. Apply Code Changes
See PRODUCTION_ACTION_PLAN.md for exact line numbers and code.

### 5. Test Everything
```bash
# Test database
python -c "from app.database import engine; engine.connect()"

# Start server
python main.py

# In another terminal, test health
curl http://127.0.0.1:8001/health

# Run all tests
pytest test_integration.py -v
```

---

## Before/After Transition

### SQLite → PostgreSQL

**Before (Development):**
```
DATABASE_URL=sqlite:///./nutrition_management.db
```

**After (Production):**
```
DATABASE_URL=postgresql://admin:password@localhost:5432/nutrition_db
pip install psycopg2-binary
```

---

## Security Changes Summary

| Component | Before | After | Impact |
|-----------|--------|-------|--------|
| **SECRET_KEY** | Weak default in code | Strong secret from environment | CRITICAL |
| **Admin Creds** | Hardcoded in code | Environment variables | HIGH |
| **Database** | SQLite (not scalable) | PostgreSQL (production-ready) | CRITICAL |
| **Rate Limit** | None | 5 attempts/minute on login | HIGH |
| **Security Headers** | Missing | Full set (HSTS, CSP, X-Frame) | HIGH |
| **Logging** | None | Structured JSON logging | MEDIUM |
| **Password Rules** | Minimal | 12 char + uppercase + digit + special | MEDIUM |

---

## File Changes Checklist

- [ ] Create/update `backend/.env` with strong SECRET_KEY
- [ ] Update `backend/app/config.py` (require environment variables in production)
- [ ] Update `backend/app/main.py` (add security headers middleware)
- [ ] Create `backend/app/logger.py` (structured logging)
- [ ] Create `backend/app/rate_limit.py` (rate limiting)
- [ ] Update `backend/app/routers/auth.py` (add rate limits and logging)
- [ ] Update `backend/app/database.py` (PostgreSQL support)
- [ ] Update `backend/requirements.txt` (add new packages)
- [ ] Update `backend/app/schemas.py` (stronger password validation)

---

## Testing Sequence

```bash
# 1. Database Connection
python -c "from app.database import engine; engine.connect(); print('✓ Connected')"

# 2. Start Server
python main.py  # Should start without errors

# 3. Health Check
curl http://127.0.0.1:8001/health

# 4. Login Test (5 times - should fail on 6th)
for i in {1..6}; do
  curl -X POST http://127.0.0.1:8001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' 
  echo "Attempt $i"
  sleep 1
done

# 5. Run Full Test Suite
pytest test_integration.py -v

# 6. Check Security Headers
curl -I http://127.0.0.1:8001/
# Should see: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security
```

---

## Environment Variables Reference

### Development
```
SECRET_KEY=dev-key-only-for-testing-change-before-production
ADMIN_EMAIL=admin@test.local
ADMIN_PASSWORD=TestPassword123!@#
DATABASE_URL=sqlite:///./nutrition_management.db
ENVIRONMENT=development
DEBUG=true
```

### Production
```
SECRET_KEY=<generate-with-secrets-module>
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=<minimum-16-character-strong-password>
DATABASE_URL=postgresql://user:password@db.host:5432/nutrition_db
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://nutrition.com
TRUSTED_HOSTS=nutrition.com,www.nutrition.com
```

---

## Rollback Checklist

If something breaks, follow this order:

1. **Revert database** to SQLite (change DATABASE_URL)
2. **Revert security headers** (comment out middleware) 
3. **Revert SECRET_KEY** to development value
4. **Revert admin credentials** to hardcoded values
5. **Remove rate limiting** middleware
6. **Remove logging** imports

Then test again.

---

## Performance Expectations

**Before Changes:**
- Database queries: Fast but single-threaded
- Concurrent users: Limited (SQLite)
- API response time: ~50-100ms
- Rate limiting: None

**After Changes:**
- Database queries: Same or faster (PostgreSQL)
- Concurrent users: Unlimited (PostgreSQL)
- API response time: ~50-100ms
- Rate limiting: 5 attempts/minute login

---

## Deployment Verification

Once deployed, verify these 10 items:

1. **Health Check**
   ```bash
   curl https://your-domain.com/health
   # Should return: {"status":"healthy",...}
   ```

2. **Security Headers**
   ```bash
   curl -I https://your-domain.com/
   # Should include X-Frame-Options, Strict-Transport-Security, CSP
   ```

3. **HTTPS/SSL**
   ```bash
   curl -I https://your-domain.com/
   # Should return 200, not redirect
   ```

4. **Rate Limiting**
   ```bash
   # Test 6 failed logins - 6th should be rate-limited
   for i in {1..6}; do curl -X POST https://your-domain.com/api/auth/login; done
   ```

5. **Admin Login**
   ```bash
   curl -X POST https://your-domain.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@company.com","password":"your-password"}'
   ```

6. **Database Connection**
   - No connection errors in logs
   - Can create, read, update, delete data

7. **Logging Active**
   - Check logs for auth events
   - Check logs for errors

8. **CORS Working**
   - Frontend can communicate with backend
   - No CORS errors in browser console

9. **All Tests Passing**
   ```bash
   pytest test_integration.py -v
   # All 29 tests should pass
   ```

10. **No Errors in Logs**
    - Check application logs for errors
    - Check security logs for suspicious activity

---

## Estimated Deployment Timeline

| Phase | Time | Tasks |
|-------|------|-------|
| **Preparation** | 30 min | Environment setup, SECRET_KEY generation, .env creation |
| **Code Changes** | 60 min | Apply middleware, logging, rate limiting, password validation |
| **Database Setup** | 30 min | PostgreSQL setup, connection test, verify data |
| **Testing** | 30 min | Health check, integration tests, manual API testing |
| **Deployment** | 15 min | Deploy to production, verify health check |
| **Monitoring** | 15 min | Check logs, verify rate limiting, auth logging |
| **Total** | ~3 hours | Ready for production |

---

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| `SECRET_KEY not set` error | Set SECRET_KEY in .env file |
| `CORS error in browser` | Check CORS_ORIGINS environment variable |
| `Database connection failed` | Verify DATABASE_URL, check PostgreSQL running |
| `Rate limit errors` | This is expected - wait 1 minute and try again |
| `Security headers missing` | Restart server after code changes |
| `Logging not working` | Verify logger.py created, installed python-json-logger |
| `Admin login fails` | Verify ADMIN_EMAIL and ADMIN_PASSWORD match .env |
| `Tests fail` | Run `pytest test_integration.py -v` for details |

---

## Critical Password Requirements

Your ADMIN_PASSWORD and user passwords must be:
- [ ] Minimum 12 characters
- [ ] At least 1 uppercase letter (A-Z)
- [ ] At least 1 lowercase letter (a-z)
- [ ] At least 1 digit (0-9)
- [ ] At least 1 special character (!@#$%^&*...)

**Example Strong Password:**
```
ProductionAdmin123!@#2025
```

---

## Need Help?

1. **Read PRODUCTION_ACTION_PLAN.md** for detailed implementation steps
2. **Check PRODUCTION_READINESS_REVIEW.md** for full assessment
3. **Review Integration test results:** `pytest test_integration.py -v`
4. **Check application logs** for errors
5. **Verify .env file** has all required variables

**Key Files to Know:**
- `backend/.env` - Environment variables
- `backend/app/config.py` - Configuration settings
- `backend/app/main.py` - FastAPI application, middleware
- `backend/app/database.py` - Database connection
- `backend/app/logger.py` - Logging (NEW)
- `backend/app/rate_limit.py` - Rate limiting (NEW)

Good luck with your deployment! 🚀

