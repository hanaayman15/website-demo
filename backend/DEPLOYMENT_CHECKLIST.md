# Production Deployment Checklist for Render + Neon

## Pre-Deployment Checklist

### 1. Code Preparation ✅
- [x] PostgreSQL driver installed (`psycopg2-binary`)
- [x] Connection pooling configured
- [x] Environment variable validation added
- [x] CORS configured for production
- [x] Security headers configured
- [x] Rate limiting enabled
- [x] Structured logging enabled
- [x] Hardcoded URLs removed

### 2. Environment Variables (Set in Render)
- [ ] `DATABASE_URL` - Neon PostgreSQL connection string (Pooled)
- [ ] `SECRET_KEY` - 32+ character random string
- [ ] `ADMIN_EMAIL` - Your admin email
- [ ] `ADMIN_PASSWORD` - Strong password (8+ chars)
- [ ] `FRONTEND_URL` - Your Vercel deployment URL
- [ ] `DEBUG=False` - Production mode
- [ ] `TRUSTED_HOSTS=*` - Allow Render's hosts
- [ ] `DB_POOL_SIZE=5` - Connection pool size
- [ ] `DB_MAX_OVERFLOW=10` - Max overflow connections
- [ ] `LOG_LEVEL=INFO` - Production logging
- [ ] `LOG_FORMAT=json` - Structured logs

### 3. Neon PostgreSQL Setup
- [ ] Created Neon project
- [ ] Database created
- [ ] Connection string copied (Pooled, not Direct)
- [ ] SSL mode enabled (`?sslmode=require`)

### 4. Render Setup
- [ ] GitHub repository connected
- [ ] Root directory set to `backend`
- [ ] Build command configured
- [ ] Start command configured
- [ ] Environment variables added
- [ ] Service deployed successfully

### 5. Vercel Frontend Setup
- [ ] Frontend deployed to Vercel
- [ ] `VITE_API_URL` environment variable set
- [ ] Frontend URL copied

### 6. CORS Configuration
- [ ] `FRONTEND_URL` updated in Render with Vercel URL
- [ ] Render service redeployed
- [ ] CORS working (no errors in browser console)

### 7. Testing
- [ ] Health endpoint responds: `/health`
- [ ] API docs accessible: `/docs`
- [ ] User registration works
- [ ] User login works
- [ ] Protected routes work
- [ ] Data persistence verified
- [ ] No CORS errors in browser
- [ ] No startup errors in Render logs

---

## Validation Commands

### Test Backend Health
```bash
curl https://your-app.onrender.com/health
```

**Expected:** `{"status": "healthy"}`

### Test Registration
```bash
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "full_name": "Test User"
  }'
```

**Expected:** Returns `access_token`, `refresh_token`, `user_id`

### Test API Docs
Open in browser:
```
https://your-app.onrender.com/docs
```

**Expected:** FastAPI Swagger UI loads

---

## Environment Variables Quick Copy

```bash
# Required
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
SECRET_KEY=GENERATE_32_CHAR_STRING
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=STRONG_PASSWORD_HERE
FRONTEND_URL=https://your-app.vercel.app

# Optional (with defaults)
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600
DEBUG=False
LOG_LEVEL=INFO
LOG_FORMAT=json
TRUSTED_HOSTS=*
RATE_LIMIT_ENABLED=True
LOGIN_RATE_LIMIT=5 per minute
```

---

## Generate SECRET_KEY

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Render Configuration

**Build Command:**
```bash
pip install --upgrade pip && pip install -r requirements.txt
```

**Start Command:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## Common Issues & Solutions

### ❌ "SECRET_KEY too short"
**Fix:** Generate 32+ char key with command above

### ❌ "DATABASE_URL is missing"
**Fix:** Add DATABASE_URL to Render environment variables

### ❌ "Using SQLite not allowed in production"
**Fix:** DATABASE_URL must start with `postgresql://`

### ❌ CORS errors in frontend
**Fix:** Update FRONTEND_URL to match Vercel URL exactly (no trailing slash)

### ❌ "Connection refused" to database
**Fix:** Use Pooled connection string from Neon, ensure `?sslmode=require`

### ❌ First request takes 60 seconds
**Reason:** Render Free tier sleeps after 15 minutes
**Fix:** Upgrade to Starter plan ($7/month) or keep backend warm with cron job

---

## Post-Deployment

### Monitor Logs
```
Render Dashboard → Your Service → Logs
```

Look for:
- ✅ "Production configuration validated successfully"
- ✅ "PostgreSQL connection configured with pooling"
- ✅ "CORS origins configured"
- ✅ "Trusted hosts configured"

### Check Database
```
Neon Console → Your Project → Tables
```

Should see tables:
- `users`
- `client_profiles`
- `body_measurements`
- `nutrition_plans`
- `workout_logs`
- `mood_logs`
- `weight_logs`
- `supplement_logs`

---

## Success Criteria

✅ Backend responds to health checks  
✅ API docs accessible  
✅ User registration works  
✅ User login works  
✅ Frontend can communicate with backend  
✅ No CORS errors  
✅ Data persists across requests  
✅ Logs show no errors  

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Vercel Docs**: https://vercel.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com

---

*Last Updated: March 4, 2026*
