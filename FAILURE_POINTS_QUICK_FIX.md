# Runtime Failure Points & Quick Fix Guide

**Critical Issues to Check FIRST**

---

## 🔴 ISSUE #1: Port Mismatch (MOST LIKELY FAILURE)

### Problem
Frontend configured for port 8001, but backend might start on different port.

### Where It Breaks
- User logs in → Frontend sends request to `http://127.0.0.1:8001/api/auth/login`
- Backend actually running on `http://127.0.0.1:8000` 
- Request fails with "Failed to fetch" or "Connection refused"

### Quick Fix
```bash
# MUST use consistent port
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
                                                      ^^^^
                                                      MUST be 8001
```

### Verification
```powershell
# Verify port
Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue | 
  Where-Object {$_.State -eq 'Listen'}
# Should output: State=Listen, OwningProcess=<python-pid>

# Check from browser
Invoke-RestMethod http://127.0.0.1:8001/health
# Should return: {status: 'healthy'}
```

---

## 🔴 ISSUE #2: Weak SECRET_KEY (SECURITY CRITICAL)

### Problem
```python
SECRET_KEY = "your-secret-key-change-in-production-12345678901234567890"
```
This is visible in `backend/app/config.py` and can be used to forge JWT tokens.

### Where It Breaks
- Any JWT token can be forged without server verification
- Anyone reading the code can impersonate any user
- Production databases will have compromised authentication

### Quick Fix
```bash
# Generate new strong key
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Output: N8kqQvXpYzJ_-5mLbRgHsW8tU9dqYfXzX9qJmKlNoPq

# Create .env file in backend/
# backend/.env
SECRET_KEY=N8kqQvXpYzJ_-5mLbRgHsW8tU9dqYfXzX9qJmKlNoPq

# Update backend/app/config.py:
SECRET_KEY: str = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY not set!")
```

### Verification
```python
from app.config import settings
print(settings.SECRET_KEY)  # Should NOT be the default value
```

---

## 🔴 ISSUE #3: Hardcoded Admin Credentials

### Problem
```python
ADMIN_EMAIL: str = "admin@nutrition.com"
ADMIN_PASSWORD: str = "admin123secure!"
```
Anyone with code access knows admin credentials.

### Where It Breaks
- Admin endpoints unprotected (password hardcoded in code)
- Admins can be spoofed using these exact credentials
- No way to rotate admin password without code change

### Quick Fix
```bash
# Create .env in backend/
ADMIN_EMAIL=your-admin@yourdomain.com
ADMIN_PASSWORD=YourSecurePassword123!@#

# Update config.py:
ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@nutrition.com")
ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123secure!")

# For production, verify in startup:
if os.getenv("ENVIRONMENT") == "production":
    if settings.ADMIN_PASSWORD == "admin123secure!":
        raise ValueError("ERROR: Using default admin password in production!")
```

---

## 🟠 ISSUE #4: CORS Configuration Mismatches

### Problem
Frontend origin might not match backend CORS allowed origins.

### Where It Breaks
- Frontend on `http://127.0.0.1:5500`
- Backend CORS allows: `["localhost:5500", "127.0.0.1:8000", ...]`
- Preflight request fails → Browser blocks actual request
- User sees: `CORS policy: Response to preflight request doesn't pass access control check`

### Current CORS Settings (in backend/app/main.py, line ~223)
```python
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000,http://localhost:8001"
).split(",")
```

### Quick Verification
```bash
# Test preflight request
curl -i -X OPTIONS http://127.0.0.1:8001/api/auth/login \
  -H "Origin: http://127.0.0.1:5500" \
  -H "Access-Control-Request-Method: POST"

# Should include in response:
# Access-Control-Allow-Origin: http://127.0.0.1:5500
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# Access-Control-Allow-Headers: Authorization, Content-Type
```

### If Test Fails
```bash
# Set correct CORS
set CORS_ORIGINS=http://127.0.0.1:5500,http://127.0.0.1:8001
# Then restart backend
```

---

## 🟠 ISSUE #5: JWT Token Not Being Sent

### Problem
Frontend generates token but doesn't send it in request headers.

### Where It Breaks
- Login works ✓ (token received)
- Token stored in localStorage ✓
- Dashboard request fails → "Not authenticated" error
- Network tab shows request to `/api/client/profile` but NO Authorization header

### Quick Debug (in Browser Console)
```javascript
// Check if token exists
console.log(localStorage.getItem('authToken'));
// Should print: eyJhbGciOiJIUzI1NiIsInR5...

// Check if token is sent in requests
fetch('http://127.0.0.1:8001/api/client/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
})
.then(r => r.json())
.then(d => console.log('Profile:', d))
.catch(e => console.error('Error:', e))
```

### If Token Not in localStorage
- Login endpoint not called → Frontend calling wrong URL
- Response not parsed → `access_token` field missing
- Storage cleared → Check sessions/privacy settings

### If Token Not Sent in Headers
- Check `getAuthHeaders()` function in config.js
- Verify all fetch calls include `headers: getAuthHeaders()`
- Clear browser cache → Old JavaScript cached

---

## 🟠 ISSUE #6: Database Not Initialized

### Problem
Database file doesn't exist or is corrupted.

### Where It Breaks
- Register endpoint → 500 Internal Server Error
- Login endpoint → Cannot query users table
- Any data operation → SQLAlchemy SessionLocal() fails

### Quick Fix
```bash
# Delete corrupted database
Remove-Item backend/nutrition_management.db -ErrorAction SilentlyContinue

# Restart backend (recreates tables automatically)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001

# Verify tables created
python -c "from app.database import Base, engine; Base.metadata.create_all(engine); print('✓ Tables created')"
```

### Verification
```bash
# Check database exists
Test-Path backend/nutrition_management.db

# Check can write
python -c "from app.database import SessionLocal; db = SessionLocal(); print('✓ Connected')"
```

---

## 🟠 ISSUE #7: Token Validation Bypass

### Problem
Protected endpoints accepting invalid/expired tokens.

### Where It Breaks
- Unauthenticated request to `/api/client/profile` → Returns 200 OK (CRITICAL BUG)
- Malformed token accepted
- Expired token still works

### Quick Test
```bash
# Test without token (should fail)
curl http://127.0.0.1:8001/api/client/profile
# Expected: 403 Forbidden

# Test with bad token (should fail)
curl -H "Authorization: Bearer invalid.token.here" \
  http://127.0.0.1:8001/api/client/profile
# Expected: 401 Unauthorized

# Test with expired token (wait 31 minutes after login)
# Expected: 401 Unauthorized
```

### If Tests Pass But Endpoints Return 200
**CRITICAL SECURITY ISSUE** - Authentication is bypassed!

Check:
```python
# In backend/app/dependencies.py
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    ...
)
# Should raise HTTPException if credentials invalid
```

---

## 🟡 ISSUE #8: Character Encoding Issues

### Problem
Non-ASCII characters (accents, emoji, special languages) not handled.

### Where It Breaks
- User with email "José@example.com" → Registration fails
- User with full name "李明" → Profile update fails
- Note with emoji "💪 Great workout!" → Database error

### Quick Test
```bash
curl -X POST http://127.0.0.1:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"josé@example.com","password":"Test1234!@#","full_name":"José"}'
# Should succeed with proper UTF-8 handling
```

### Fix (if fails)
```python
# In database.py, ensure:
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    # Add encoding for SQLite:
    echo=False,
    json_serializer=lambda x: x.isoformat() if hasattr(x, 'isoformat') else x
)
```

---

## 🟡 ISSUE #9: Concurrent Request Race Conditions

### Problem
Multiple rapid requests to same endpoint cause conflicts.

### Where It Breaks
- Rapidly adding weight entries → Last one gets lost
- Updating profile while fetching → Old data returned
- Database row locked

### Symptom
- Data missing or reverted after operation
- Rare, hard to reproduce bugs

### Prevention
```python
# Backend should use transactions
from sqlalchemy import text
db.execute(text("BEGIN TRANSACTION"))
# ... operations ...
db.commit()  # Auto-happens with SessionLocal
```

### Test
```bash
# Rapid requests (should all succeed)
for ($i=0; $i -lt 5; $i++) {
  curl -X POST http://127.0.0.1:8001/api/client/weight \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d '{"weight":75,'body_fat_percentage":18}'
}
# Check database - all 5 entries should exist
```

---

## 🟡 ISSUE #10: API Response Schema Mismatch

### Problem
Frontend expects different response structure than API returns.

### Where It Breaks
```javascript
// Frontend expects:
const profile = await fetch('/api/client/profile')
const data = await profile.json()
console.log(data.client_id)  // Frontend expects 'client_id'

// But API returns:
{ "id": 1, "user_id": 1 }  // Returns 'id' not 'client_id'
// Result: undefined, UI blank
```

### Verify Schema
```bash
# Get actual schema
curl http://127.0.0.1:8001/openapi.json | \
  jq '.paths."/api/client/profile".get.responses."200".content."application/json".schema'

# Should show all fields returned by endpoint
```

### Common Mismatches
- `id` vs `user_id` vs `client_id`
- `created_at` vs `createdAt` (snake_case vs camelCase)
- Missing fields in response
- Extra fields not documented

---

## Quick Diagnostic Scripts

### Test Everything at Once
```powershell
Write-Host "=== RUNTIME INTEGRITY CHECK ===" -ForegroundColor Cyan

# 1. Port check
$port8001 = Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue | 
  Where-Object {$_.State -eq 'Listen'}
Write-Host "Backend on 8001: $(if($port8001){'✓'}else{'✗'})" -ForegroundColor $(if($port8001){'Green'}else{'Red'})

# 2. Health check
try {
  $health = Invoke-RestMethod http://127.0.0.1:8001/health -TimeoutSec 3
  Write-Host "Health endpoint: ✓" -ForegroundColor Green
} catch {
  Write-Host "Health endpoint: ✗" -ForegroundColor Red
}

# 3. CORS test
try {
  $cors = Invoke-WebRequest -Uri http://127.0.0.1:8001/api/auth/login `
    -Method OPTIONS `
    -Headers @{'Origin'='http://127.0.0.1:5500'} `
    -UseBasicParsing
  Write-Host "CORS configured: ✓" -ForegroundColor Green
} catch {
  Write-Host "CORS issue: ✗" -ForegroundColor Red
}

# 4. Auth test
try {
  $reg = Invoke-RestMethod -Uri http://127.0.0.1:8001/api/auth/register -Method Post `
    -ContentType 'application/json' `
    -Body (@{email="test_$(Get-Random)@test.com"; password="Test1234!@#"; full_name="Test"} | ConvertTo-Json)
  Write-Host "Registration working: ✓" -ForegroundColor Green
} catch {
  Write-Host "Registration broken: ✗" -ForegroundColor Red
}

Write-Host "`nTo fix critical issues:" -ForegroundColor Yellow
Write-Host "1. Ensure port 8001 (not 8000)" -ForegroundColor White
Write-Host "2. Generate strong SECRET_KEY" -ForegroundColor White
Write-Host "3. Set CORS_ORIGINS=http://127.0.0.1:5500,http://127.0.0.1:8001" -ForegroundColor White
```

---

## Common Error Messages & Solutions

### "Failed to fetch" (Frontend Console)
**Likely Cause:** Backend not running, wrong port, or CORS blocked
```bash
# Check backend
curl http://127.0.0.1:8001/health
# Check frontend config
console.log(CONFIG.API_BASE_URL)
```

### "Invalid authentication credentials" (After Login)
**Likely Cause:** Token validation failed, SECRET_KEY changed, or token expired
```bash
# Check SECRET_KEY
python -c "from app.config import settings; print('KEY:', settings.SECRET_KEY[:50])"
# Check token not expired
# Check Authorization header sent
```

### "CORS policy: Response to preflight request doesn't pass access control check"
**Likely Cause:** Origin not in CORS_ORIGINS, or preflight failed
```bash
# Check CORS config
curl -i -X OPTIONS http://127.0.0.1:8001/api/auth/login \
  -H "Origin: http://127.0.0.1:5500"
# Should include: Access-Control-Allow-Origin header
```

### "Only admin users can access this resource"
**Likely Cause:** Token has wrong role, or using client token for admin endpoint
```bash
# Verify token role
jwt=$(curl -X POST http://127.0.0.1:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nutrition.com","password":"admin123secure!"}' \
  | jq -r '.access_token')
echo $jwt | cut -d'.' -f2 | base64 -d | jq
# Check "role": "admin" in payload
```

### "User not found or inactive"
**Likely Cause:** User deleted, disabled, or token references deleted user
```bash
# Check user exists in database
sqlite3 backend/nutrition_management.db "SELECT id, email, is_active FROM user LIMIT 5;"
```

---

## Test Execution Order

```
START HERE ↓
├─ Check Port (8001 available?)
├─ Start Backend (python -m uvicorn...)
├─ Verify Health (/health endpoint)
├─ Check CORS (OPTIONS request)
│
├─ Register Test User
├─ Login Test User
├─ Check Token in localStorage
├─ Fetch Protected Resource (/api/client/profile)
│
├─ Create Data (weight, mood, workout)
├─ Read Data (GET all entries)
├─ Update Data (modify one entry)
├─ Delete Data (remove entry)
│
├─ Test Frontend Form (login page)
├─ Test Dashboard (profile load)
├─ Test Data Entry Forms (weight, mood)
│
└─ RUN FULL E2E TEST (all together)
```

---

**Key Takeaway:**

The 3 most common failures are:
1. ❌ Port mismatch (frontend expects 8001, backend on 8000)
2. ❌ CORS blocked (origin not in allow list)
3. ❌ Token not sent (Authorization header missing)

Fix these first, then everything else usually works! 🚀
