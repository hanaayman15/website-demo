# Render Deployment Guide with Neon PostgreSQL

**Complete guide to deploy your FastAPI backend to Render with Neon PostgreSQL**

---

## Prerequisites

- GitHub account with your code pushed
- Render account (sign up at https://render.com)
- Neon account (sign up at https://neon.tech)

---

## Step 1: Create Neon PostgreSQL Database (5 minutes)

### 1.1 Sign up for Neon
1. Go to https://neon.tech
2. Click "Sign Up" and use GitHub auth
3. Verify your email if required

### 1.2 Create Database Project
1. Click "Create a project"
2. **Project Name**: `nutrition-app-db`
3. **Region**: Choose closest to your users (e.g., US East, EU West)
4. **PostgreSQL Version**: 16 (latest stable)
5. Click "Create Project"

### 1.3 Get Connection String
1. In Neon Console, click "Connection string"
2. **IMPORTANT**: Select **"Pooled connection"** (not Direct)
3. Copy the connection string - looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save this - you'll need it for Render**

### 1.4 Initialize Database (Optional - Render will do this)
You can skip this - Render will initialize tables on first startup.

---

## Step 2: Prepare Code for Deployment (2 minutes)

### 2.1 Verify Files Exist
Check your `backend/` directory has these files:

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── security.py
│   └── routers/
├── requirements.txt
├── .env.example
└── .env.production
```

✅ All files already configured for production!

### 2.2 Verify requirements.txt
Your `requirements.txt` should include:
```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.9  # ← PostgreSQL driver
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-dotenv>=1.0.0
slowapi>=0.1.9
python-json-logger>=2.0.7
pydantic[email]>=2.8.0
pydantic-settings>=2.4.0
python-multipart>=0.0.9
```

✅ Already configured!

---

## Step 3: Deploy to Render (10 minutes)

### 3.1 Create Render Account
1. Go to https://render.com
2. Click "Get Started"
3. Sign up with GitHub (easier for deployment)

### 3.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your repository: `your-username/nutrition-app`
4. Click **"Connect"**

### 3.3 Configure Service
Fill in these settings:

**Basic Settings:**
- **Name**: `nutrition-backend` (or your choice)
- **Region**: Same as Neon database (e.g., Oregon USA)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`

**Build Settings:**
- **Build Command**: 
  ```bash
  pip install --upgrade pip && pip install -r requirements.txt
  ```

**Start Command**:
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Instance Type:**
- Free tier: **Free** (512MB RAM, sleeps after 15 min inactivity)
- Paid tier: **Starter** ($7/month, 512MB RAM, no sleep)

### 3.4 Add Environment Variables
Scroll to **"Environment Variables"** section and add:

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | `postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require` | Copy from Neon (Step 1.3) |
| `SECRET_KEY` | Generate new 32+ char string | See below |
| `ADMIN_EMAIL` | `admin@yourcompany.com` | Your admin email |
| `ADMIN_PASSWORD` | Strong password | Min 8 chars |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Add after frontend deployment |
| `DB_POOL_SIZE` | `5` | Connection pool size |
| `DB_MAX_OVERFLOW` | `10` | Max additional connections |
| `DB_POOL_TIMEOUT` | `30` | Timeout in seconds |
| `DB_POOL_RECYCLE` | `3600` | Recycle after 1 hour |
| `DEBUG` | `False` | Production mode |
| `LOG_LEVEL` | `INFO` | Logging level |
| `LOG_FORMAT` | `json` | Structured logging |
| `TRUSTED_HOSTS` | `*` | Allow Render's hosts |
| `RATE_LIMIT_ENABLED` | `True` | Enable rate limiting |

**Generate SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Example output:**
```
xK8vN2mP9qR4sT5uW6yZ7aB8cD9eF0gH1iJ2kL3mN4oP
```

### 3.5 Deploy!
1. Click **"Create Web Service"**
2. Wait 2-5 minutes for build
3. Watch logs in Render Dashboard
4. Look for: ✅ "Production configuration validated successfully"

---

## Step 4: Initialize Database (1 minute)

### Option A: Automatic (Recommended)
Render will automatically initialize tables on first startup.

### Option B: Manual (If needed)
1. In Render Dashboard, click your service
2. Go to **"Shell"** tab
3. Run:
   ```bash
   python -c "from app.database import init_db; init_db()"
   ```

---

## Step 5: Test Backend (2 minutes)

### 5.1 Get Your Backend URL
Render provides a URL like:
```
https://nutrition-backend.onrender.com
```

### 5.2 Test Health Endpoint
```bash
curl https://nutrition-backend.onrender.com/health
```

**Expected response:**
```json
{"status": "healthy"}
```

### 5.3 Test API Docs
Open in browser:
```
https://nutrition-backend.onrender.com/docs
```

You should see the FastAPI Swagger UI.

### 5.4 Test Registration
```bash
curl -X POST https://nutrition-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "full_name": "Test User"
  }'
```

**Expected response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "user_id": 1,
  "role": "client"
}
```

✅ **If you get this, your backend is working!**

---

## Step 6: Deploy Frontend to Vercel (10 minutes)

### 6.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub

### 6.2 Create New Project
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Other (static site)
   - **Root Directory**: `frontend`
   - **Build Command**: (leave empty)
   - **Output Directory**: `.` (current directory)

### 6.3 Add Environment Variable
Add this in Vercel project settings:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://nutrition-backend.onrender.com` |

### 6.4 Update Frontend Config
Update `frontend/config.js`:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://nutrition-backend.onrender.com';
```

Commit and push:
```bash
git add frontend/config.js
git commit -m "Update API URL for production"
git push
```

Vercel will auto-deploy.

### 6.5 Get Frontend URL
Vercel provides a URL like:
```
https://nutrition-app.vercel.app
```

---

## Step 7: Update CORS Settings (2 minutes)

### 7.1 Update Render Environment Variable
1. Go to Render Dashboard → Your Service → Environment
2. Update `FRONTEND_URL` to your Vercel URL:
   ```
   https://nutrition-app.vercel.app
   ```
3. Save changes
4. Render will automatically redeploy (1-2 minutes)

---

## Step 8: Final Test (2 minutes)

### 8.1 Test Full Flow
1. Open `https://nutrition-app.vercel.app`
2. Register a new account
3. Login with credentials
4. Navigate to Dashboard
5. Add weight/mood/workout data
6. Verify data persists after refresh

### 8.2 Check Browser Console
Press F12 → Console tab
- **No CORS errors** → ✅ Success!
- **CORS error** → Update FRONTEND_URL in Render

---

## Troubleshooting

### Issue 1: "SECRET_KEY too short" error
**Solution**: Generate a 32+ character key
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Issue 2: "DATABASE_URL is missing" error
**Solution**: 
1. Check Render environment variables
2. Verify DATABASE_URL is set with Neon connection string
3. Must start with `postgresql://`

### Issue 3: CORS errors in browser console
**Solution**:
1. Check FRONTEND_URL in Render matches Vercel URL exactly
2. No trailing slash: `https://app.vercel.app` ✅
3. With trailing slash: `https://app.vercel.app/` ❌
4. Save and wait for Render to redeploy

### Issue 4: "Connection refused" to database
**Solution**:
1. Use **Pooled connection** string from Neon (not Direct)
2. Verify `?sslmode=require` is in connection string
3. Check Neon database is active (not suspended)

### Issue 5: Tables not created in database
**Solution**:
1. Go to Render → Shell
2. Run: `python -c "from app.database import init_db; init_db()"`

### Issue 6: Application starts but crashes after first request
**Solution**:
1. Check Render logs for errors
2. Verify all required environment variables are set
3. Check DB_POOL_SIZE is not too high (5 is recommended for Free tier)

---

## Cost Breakdown

### Free Tier (Total: $0/month)
- Neon PostgreSQL: Free (512MB storage, 0.5GB RAM)
- Render Web Service: Free (512MB RAM, sleeps after 15 min)
- Vercel Frontend: Free (100GB bandwidth)

**Limitations:**
- Backend sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- Good for personal projects and testing

### Production Tier (Total: ~$14/month)
- Neon PostgreSQL: $19/month (3GB storage, 1GB RAM, no sleep)
- Render Web Service: $7/month (512MB RAM, no sleep)
- Vercel Frontend: Free (or $20/month Pro for custom domain)

**Benefits:**
- No sleep time
- Instant responses
- Better performance
- Professional hosting

---

## Maintenance

### Daily
- Check Render logs for errors
- Monitor Neon database usage

### Weekly
- Review API response times in Render dashboard
- Check for security updates in dependencies

### Monthly
- Rotate SECRET_KEY (optional, for extra security)
- Update Python dependencies:
  ```bash
  pip list --outdated
  pip install --upgrade <package>
  ```

---

## Next Steps

### Add Custom Domain
1. Buy domain (Namecheap, GoDaddy, etc.)
2. Add to Vercel: Settings → Domains
3. Update DNS records as instructed
4. Update FRONTEND_URL in Render

### Enable HTTPS (Automatic)
- Render provides free SSL certificates
- Vercel provides free SSL certificates
- No configuration needed!

### Scale Up
When you outgrow free tier:
1. Upgrade Render to Starter plan ($7/month)
2. Upgrade Neon to Pro plan ($19/month)
3. Enjoy faster, always-on service

---

## Support

**Render Documentation**: https://render.com/docs  
**Neon Documentation**: https://neon.tech/docs  
**Vercel Documentation**: https://vercel.com/docs  

**Your backend is now production-ready! 🚀**

---

## Quick Reference

**Backend URL**: `https://nutrition-backend.onrender.com`  
**Frontend URL**: `https://nutrition-app.vercel.app`  
**API Docs**: `https://nutrition-backend.onrender.com/docs`  
**Database**: Neon PostgreSQL (managed by Neon)  

**Total Setup Time**: ~35 minutes  
**Monthly Cost**: Free tier or $14/month  

---

*Last Updated: March 4, 2026*
