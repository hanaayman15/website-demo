# Runtime Integration Validation Checklist

**Generated:** March 3, 2026  
**Status:** Comprehensive validation checklist for full-stack integration  
**Execution Time:** ~45 minutes (automated + manual testing)

---

## Critical Issues Identified ⚠️

### 1. **POTENTIAL PORT MISMATCH** 🔴
**Status:** HIGH PRIORITY
- **Frontend Config:** `http://127.0.0.1:8001`
- **CORS Allow Origins:** Includes `http://localhost:8000,http://localhost:8001`
- **Issue:** Backend being started on different ports in terminal history (8000, 8001, 8004)
- **Impact:** Frontend may fail to connect if backend runs on wrong port
- **Fix BEFORE Testing:**
  ```bash
  # Use consistent port
  python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
  ```

### 2. **WEAK SECRET_KEY** 🔴
**Status:** CRITICAL
- **Current:** `"your-secret-key-change-in-production-12345678901234567890"`
- **Issue:** JWT tokens are compromised
- **Impact:** Any token can be forged; authentication bypass
- **Test:** Token created with weak key cannot be trusted
- **Fix:** Generate strong SECRET_KEY before any validation

### 3. **HARDCODED ADMIN CREDENTIALS** 🔴
**Status:** CRITICAL
- **Admin Email:** `admin@nutrition.com`
- **Admin Password:** `admin123secure!`
- **Issue:** Credentials visible in code repository
- **Impact:** Anyone with code access can login as admin
- **Test:** Admin login should work with hardcoded credentials initially

---

## Part 1: Pre-Flight Checks (5 minutes)

### 1.1 Backend Server Configuration
```bash
# BEFORE STARTING:
# ✓ Check port 8001 is available (not in use)
# ✓ Verify Python virtual environment activated
# ✓ Confirm all dependencies installed (pip list)
# ✓ Database file exists at: backend/nutrition_management.db
```

**Validation Steps:**
```powershell
# Check if port 8001 is in use
Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue | Select-Object State, OwningProcess

# Check virtual environment
python -c "import sys; print(f'Python: {sys.executable}')"

# Check required packages
python -c "import fastapi, sqlalchemy, pydantic; print('✓ Core deps installed')"

# Check database
Test-Path backend/nutrition_management.db
```

**Expected Results:**
- ✓ Port 8001 is free
- ✓ Python executable path contains `.venv`
- ✓ All imports successful
- ✓ Database file exists

---

### 1.2 Frontend Configuration Check
```bash
# Check frontend config.js
# Expected:
# ✓ API_BASE_URL: http://127.0.0.1:8001
# ✓ ENABLE_DEBUG: true (for initial testing)
# ✓ REQUEST_TIMEOUT: 15000
# ✓ RETRY_ATTEMPTS: 2
```

**Validation:**
```javascript
// Open browser console and check:
console.log(CONFIG.API_BASE_URL);  // Should print: http://127.0.0.1:8001
console.log(CONFIG.ENABLE_DEBUG);   // Should print: true
```

**Expected Results:**
- ✓ API_BASE_URL matches backend port
- ✓ Debug logging enabled (shows API calls in console)

---

## Part 2: Server Startup Validation (5 minutes)

### 2.1 Backend Server Start
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

**Expected Output:**
```
INFO:     Application startup complete
INFO:     Uvicorn running on http://127.0.0.1:8001
```

**Failure Points:**
- ❌ "Address already in use" → Port 8001 taken, kill process or use different port
- ❌ "No module named app" → Virtual environment not activated
- ❌ "Import error" → Missing dependencies, run `pip install -r requirements.txt`
- ❌ "Database error" → SQLite file corrupted, delete and restart
- ❌ "SECRET_KEY error" → Check config.py for weak key warning

**Recovery:**
```bash
# Kill existing process on port 8001
Get-NetTCPConnection -LocalPort 8001 | Where-Object {$_.State -eq 'Established'} | Stop-Process -Force

# Clear database (WARNING: deletes all data)
Remove-Item backend/nutrition_management.db
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

### 2.2 Health Check Endpoint
```bash
curl http://127.0.0.1:8001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-03T12:00:00.000000"
}
```

**Failure Points:**
- ❌ Connection refused → Backend not running
- ❌ 404 Not Found → Wrong URL or endpoint missing
- ❌ 500 Internal Server Error → Check backend logs for traceback
- ❌ Timeout → Backend is hanging, check logs

### 2.3 OpenAPI Documentation
```bash
curl http://127.0.0.1:8001/docs
# Or open in browser: http://127.0.0.1:8001/docs
```

**Expected:**
- ✓ Interactive API documentation loads
- ✓ All endpoints listed (50+ endpoints)
- ✓ Authentication (@token) visible in required endpoints
- ✓ Request/response schemas shown

**Failure Points:**
- ❌ 404 → Swagger UI disabled in code
- ❌ CSS/JS not loading → CDN issue (offline environment)
- ❌ Endpoints missing → Router imports incomplete

---

## Part 3: CORS Configuration Validation (5 minutes)

### 3.1 CORS Headers Check
```bash
# Test preflight request (OPTIONS)
curl -i -X OPTIONS http://127.0.0.1:8001/api/auth/login \
  -H "Origin: http://127.0.0.1:5500" \
  -H "Access-Control-Request-Method: POST"
```

**Expected Response Headers:**
```
Access-Control-Allow-Origin: http://127.0.0.1:5500
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

**Failure Points:**
- ❌ Missing CORS headers → Frontend blocked by browser
- ❌ Wrong origin in response → CORS_ORIGINS environment variable incorrect
- ❌ Allow-Credentials: false → Tokens won't be sent with requests
- ❌ Authorization header missing → JWT auth won't work

### 3.2 Frontend-Backend CORS Test
```html
<!-- Run in browser console -->
<script>
fetch('http://127.0.0.1:8001/health')
  .then(r => r.json())
  .then(d => console.log('✓ CORS Working:', d))
  .catch(e => console.error('✗ CORS Failed:', e));
</script>
```

**Expected Result:**
```
✓ CORS Working: {status: 'healthy', timestamp: '...'}
```

**Failure Points:**
- ❌ `CORS policy: Response to preflight request` → CORS not configured
- ❌ `Failed to fetch` → Network unreachable
- ❌ Browser console shows red X → Check CORS headers above

---

## Part 4: JWT Token Flow Validation (10 minutes)

### 4.1 Registration Endpoint
```bash
$email = "testuser_$(Get-Random)@example.com"
curl -X POST http://127.0.0.1:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d @{
    "email": "$email",
    "password": "Test1234!@#",
    "full_name": "Test User"
  } | ConvertTo-Json
```

**Expected Response:**
```json
{
  "id": 1,
  "email": "testuser_*@example.com",
  "full_name": "Test User",
  "role": "client"
}
```

**Failure Points:**
- ❌ 400 Bad Request → Validation error (check password strength, email format)
- ❌ 409 Conflict → Email already registered
- ❌ 500 Internal Server Error → Database write failed
- ❌ Missing fields in response → Schema mismatch

**Test Variations:**
```bash
# Test weak password (should fail)
curl -X POST http://127.0.0.1:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"weak","full_name":"User"}'
# Expected: 400 Validation error about password strength

# Test invalid email (should fail)
curl -X POST http://127.0.0.1:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","password":"Test1234!@#","full_name":"User"}'
# Expected: 400 Invalid email format

# Test duplicate email (should fail)
curl -X POST http://127.0.0.1:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"same@email.com","password":"Test1234!@#","full_name":"User"}'
# Then try again with same email
# Expected: 409 Email already registered
```

### 4.2 Login Endpoint & Token Generation
```bash
$loginResp = curl -X POST http://127.0.0.1:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d @{
    "email": "$email",
    "password": "Test1234!@#"
  }
$loginResp | ConvertTo-Json
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user_id": 1,
  "role": "client"
}
```

**Failure Points:**
- ❌ 401 Unauthorized → Wrong password or user not found
- ❌ Missing access_token → Token generation failed
- ❌ wrong_password error → Password hashing issue
- ❌ 500 Error → JWT configuration issue (SECRET_KEY)

**Token Validation:**
```javascript
// Parse JWT in browser console
const token = 'eyJhbGc...'; // from response above
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Token Payload:', payload);
// Expected: {sub: 1, email: "...", role: "client", exp: ...}
```

**Critical Token Properties:**
- ✓ `sub` (subject): User ID matches login user
- ✓ `email`: Matches login email
- ✓ `role`: Matches user role (client/admin)
- ✓ `exp` (expiration): > current time (30 minutes from issue)

### 4.3 Token Expiration Test
```javascript
// Check token expiration
const token = localStorage.getItem('authToken');
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
const exp = new Date(payload.exp * 1000);
console.log('Token expires at:', exp);
console.log('Minutes until expiration:', (exp - Date.now()) / 60000);
```

**Failure Points:**
- ❌ Token expires immediately → Expiration time logic wrong
- ❌ Token never expires → Security issue
- ❌ Expiration time in past → Clock sync issue between frontend/backend

### 4.4 Token Refresh Scenario
```bash
# Wait 30+ minutes or manually test expired token
$oldToken = "eyJhbGc..." # from earlier login

curl -X POST http://127.0.0.1:8001/api/client/profile \
  -H "Authorization: Bearer $oldToken"
```

**Expected Response (if token expired):**
```json
{
  "detail": "Invalid authentication credentials"
}
```

**Status Code:** 401 Unauthorized

**Failure Points:**
- ❌ 200 OK with stale data → Token not validated
- ❌ No expiration enforcement → Security vulnerability
- ❌ Server doesn't reject expired token → JWT verification broken

---

## Part 5: Protected Routes Security (10 minutes)

### 5.1 Unauthenticated Access Test
```bash
# Try accessing protected endpoint WITHOUT token
curl -X GET http://127.0.0.1:8001/api/client/profile
```

**Expected Response:**
```json
{
  "detail": "Not authenticated"
}
```

**Status Code:** 403 Forbidden (or 401 Unauthorized)

**Failure Points:**
- ❌ 200 OK with data → Authentication not enforced (CRITICAL SECURITY ISSUE)
- ❌ 404 Not Found → Wrong endpoint path
- ❌ 500 Error → Dependency injection broken

### 5.2 Malformed Token Test
```bash
curl -X GET http://127.0.0.1:8001/api/client/profile \
  -H "Authorization: Bearer invalid.token.here"
```

**Expected Response:**
```json
{
  "detail": "Invalid authentication credentials"
}
```

**Status Code:** 401 Unauthorized

**Failure Points:**
- ❌ 200 OK → Token validation bypassed
- ❌ 5xx Error → Token parsing crashed (unhandled exception)

### 5.3 Client-Only Endpoint Protection
```bash
# Get admin token
$adminToken = $(curl -X POST http://127.0.0.1:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nutrition.com","password":"admin123secure!"}' | jq -r '.access_token')

# Try accessing CLIENT endpoint with ADMIN token
curl -X GET http://127.0.0.1:8001/api/client/profile \
  -H "Authorization: Bearer $adminToken"
```

**Expected Response:**
```json
{
  "detail": "Only client users can access this resource"
}
```

**Status Code:** 403 Forbidden

**Failure Points:**
- ❌ 200 OK → Role checking not enforced
- ❌ 401 Error → Token validation failed
- ❌ Missing detail message → Error message not returned

### 5.4 Admin-Only Endpoint Protection
```bash
# Get client token
$clientToken = "bearer_token_from_client_login"

# Try accessing ADMIN endpoint with CLIENT token
curl -X GET http://127.0.0.1:8001/api/admin/clients \
  -H "Authorization: Bearer $clientToken"
```

**Expected Response:**
```json
{
  "detail": "Only admin users can access this resource"
}
```

**Status Code:** 403 Forbidden

**Failure Points:**
- ❌ 200 OK with admin data → Authorization not enforced
- ❌ Wrong error message → Auth error handling broken

---

## Part 6: Database Transaction Validation (10 minutes)

### 6.1 Create Operation (Test)
```bash
$token = "bearer_token_from_login"

# Create a weight log entry
curl -X POST http://127.0.0.1:8001/api/client/weight \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d @{
    "weight": 75.5,
    "body_fat_percentage": 18.5,
    "notes": "Post-workout measurement"
  }
```

**Expected Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "weight": 75.5,
  "body_fat_percentage": 18.5,
  "notes": "Post-workout measurement",
  "created_at": "2026-03-03T12:00:00"
}
```

**Failure Points:**
- ❌ 401 Unauthorized → Token not passed or invalid
- ❌ 500 Database Error → SQLAlchemy session broken
- ❌ Missing created_at → Database trigger not working
- ❌ Wrong user_id → Authentication context not captured

### 6.2 Read Operation (Test)
```bash
curl -X GET http://127.0.0.1:8001/api/client/weight?days=90 \
  -H "Authorization: Bearer $token"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "weight": 75.5,
    "body_fat_percentage": 18.5,
    "created_at": "2026-03-03T12:00:00"
  }
]
```

**Failure Points:**
- ❌ Empty array when data exists → Query filtering wrong
- ❌ 500 Error → Database connection lost
- ❌ Returns other users' data → Data isolation not enforced (SECURITY ISSUE)
- ❌ Wrong date filtering → Query parameters not applied

### 6.3 Update Operation (Test)
```bash
# Get the weight log ID from create above (id=1)
curl -X PUT http://127.0.0.1:8001/api/client/weight/1 \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d @{
    "weight": 75.0,
    "body_fat_percentage": 18.0,
    "notes": "Updated measurement"
  }
```

**Expected Response:**
```json
{
  "id": 1,
  "weight": 75.0,
  "body_fat_percentage": 18.0,
  "notes": "Updated measurement",
  "updated_at": "2026-03-03T12:05:00"
}
```

**Failure Points:**
- ❌ 404 Not Found → Record ID wrong or route doesn't exist
- ❌ 409 Conflict → Concurrent update conflict
- ❌ Missing updated_at → Update timestamp not recorded
- ❌ Returns old data → Update not committed to database

### 6.4 Delete Operation (Test)
```bash
curl -X DELETE http://127.0.0.1:8001/api/client/weight/1 \
  -H "Authorization: Bearer $token"
```

**Expected Response:**
```json
{
  "message": "Weight log deleted successfully"
}
```

**Status Code:** 200 OK

**Failure Points:**
- ❌ 404 Not Found → Record already deleted or wrong ID
- ❌ 403 Forbidden → Authorization failed (someone else's data)
- ❌ 500 Error → Foreign key constraint violation
- ❌ Record still exists after delete → Transaction not committed

## Part 7: UI-to-API Endpoint Mapping (15 minutes)

### 7.1 Login Flow
**UI File:** [frontend/client-login.html](frontend/client-login.html)
**Required API:** `POST /api/auth/login`

**Test Steps:**
```
1. Load: http://127.0.0.1:5500/frontend/client-login.html
2. Clear localStorage: localStorage.clear()
3. Enter email: test_user_1@example.com
4. Enter password: Test1234!@#
5. Click "Login to Dashboard"
Expected: Redirect to dashboard, token in localStorage
```

**Browser Console Check:**
```javascript
// After login, should show:
console.log(localStorage.getItem('authToken')); // Should print token
console.log(localStorage.getItem('currentClientId')); // Should print user ID
```

**Failure Points:**
- ❌ Alert: "Invalid email or password" → Credentials wrong or API not responding
- ❌ No redirect → Frontend not calling API or response parsing failed
- ❌ Console errors → API_BASE_URL wrong or CORS blocked
- ❌ Network tab shows 0 requests → Frontend not making request

### 7.2 Dashboard Profile Load
**UI File:** [frontend/client-dashboard.html](frontend/client-dashboard.html)
**Required API:** `GET /api/client/profile`

**Test Steps:**
```
1. After login, should auto-redirect to dashboard
2. Page loads and displays user profile
3. Check Network tab (F12): Request to /api/client/profile
Expected: 200 response with user data
```

**Failure Points:**
- ❌ "Unauthorized" error → Token not sent with request
- ❌ 401 Response → Token invalid or expired
- ❌ Blank user information → Response parsing failed
- ❌ CORS error in console → Backend not accepting frontend origin

### 7.3 Weight Tracking Endpoint
**UI File:** [frontend/progress-tracking.html](frontend/progress-tracking.html) or [frontend/client-dashboard.html](frontend/client-dashboard.html)
**Required API:** `POST /api/client/weight`, `GET /api/client/weight`

**Test Steps:**
```
1. Navigate to Progress/Weight section
2. Add weight entry: 75.5 kg, 18% body fat
3. Click Save
4. Entry should appear in list below
Expected: New weight logged and displayed
```

**Network Request (from browser dev tools):**
- Request URL: `http://127.0.0.1:8001/api/client/weight`
- Method: `POST`
- Headers: `Authorization: Bearer <token>`
- Body: `{"weight": 75.5, "body_fat_percentage": 18, ...}`

**Failure Points:**
- ❌ 401 Error → Token missing or invalid
- ❌ 400 Bad Request → Validation error (check console for details)
- ❌ 500 Internal Server Error → Database issue
- ❌ Entry doesn't appear → GET request not called after POST

### 7.4 Mood Logging Endpoint
**UI File:** [frontend/client-dashboard.html](frontend/client-dashboard.html)
**Required API:** `POST /api/client/mood`, `GET /api/client/mood`

**Test Steps:**
```
1. Find mood logging section
2. Select mood level: 8/10, Energy: 7/10, Stress: 3/10
3. Click Submit
Expected: Mood logged and displayed in history
```

**Failure Points:**
- ❌ Form doesn't submit → JavaScript error (check console)
- ❌ 400 Bad Request → Field validation (check error message)
- ❌ Entry not saved → API not responding as expected

### 7.5 Workout Logging Endpoint
**UI File:** [frontend/progress-tracking.html](frontend/progress-tracking.html) or [frontend/diet-management.html](frontend/diet-management.html)
**Required API:** `POST /api/client/workouts`, `GET /api/client/workouts`

**Test Steps:**
```
1. Find workout logging section
2. Add workout: "Running", 30 minutes, High intensity, 400 calories
3. Click Save
Expected: Workout appears in history
```

**Failure Points:**
- ❌ Missing fields fail validation
- ❌ API returns 500 → Database schema issue
- ❌ Data not persisted → Transaction rollback happening

### 7.6 Supplement Tracking Endpoint
**UI File:** [frontend/supplements.html](frontend/supplements.html)
**Required API:** `POST /api/client/supplements`, `GET /api/client/supplements`

**Test Steps:**
```
1. Navigate to Supplements
2. Add supplement: Vitamin D, 2000 IU, Morning
3. Click Save
Expected: Supplement appears in history
```

**Failure Points:**
- ❌ 400 Bad Request → Field validation
- ❌ Duplicate entries saved → No deduplication
- ❌ Wrong dosage units → Schema mismatch

### 7.7 Profile Update Endpoint
**UI File:** [frontend/profile-setup.html](frontend/profile-setup.html) or [frontend/settings.html](frontend/settings.html)
**Required API:** `PUT /api/client/profile`

**Test Steps:**
```
1. Navigate to Settings/Profile
2. Update: Goal weight, Activity level, Competition date
3. Click Save
Expected: Changes persisted
```

**Failure Points:**
- ❌ 400 Bad Request → Date format issue (should be YYYY-MM-DD)
- ❌ Fields don't update → PUT endpoint not wired
- ❌ 403 Forbidden → Authorization check failing

---

## Part 8: Complete End-to-End Integration Test (10 minutes)

### 8.1 Automated E2E Test Sequence

```powershell
# PowerShell: Run complete flow
$base = 'http://127.0.0.1:8001'
$ts = [int][double]::Parse((Get-Date -UFormat %s))
$email = "e2e_test_$ts@example.com"
$password = "Test1234!@#"

Write-Host "=== INTEGRATION TEST SEQUENCE ===" -ForegroundColor Cyan

# 1. Register
Write-Host "`n[1/6] Register User..." -ForegroundColor Yellow
$reg = Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post `
  -ContentType 'application/json' `
  -Body (@{email=$email; password=$password; full_name="E2E Test"} | ConvertTo-Json)
if ($reg.id) {
    Write-Host "✓ Registered: user_id=$($reg.id)" -ForegroundColor Green
} else {
    Write-Host "✗ Registration failed" -ForegroundColor Red
    exit
}

# 2. Login
Write-Host "`n[2/6] Login User..." -ForegroundColor Yellow
$login = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post `
  -ContentType 'application/json' `
  -Body (@{email=$email; password=$password} | ConvertTo-Json)
if ($login.access_token) {
    $token = $login.access_token
    Write-Host "✓ Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Green
} else {
    Write-Host "✗ Login failed" -ForegroundColor Red
    exit
}

# 3. Get Profile
Write-Host "`n[3/6] Fetch Profile..." -ForegroundColor Yellow
$headers = @{Authorization="Bearer $token"}
$profile = Invoke-RestMethod -Uri "$base/api/client/profile" -Method Get -Headers $headers
if ($profile.id) {
    Write-Host "✓ Profile loaded: client_id=$($profile.id)" -ForegroundColor Green
} else {
    Write-Host "✗ Profile not found" -ForegroundColor Red
    exit
}

# 4. Log Weight
Write-Host "`n[4/6] Log Weight Data..." -ForegroundColor Yellow
$weight = Invoke-RestMethod -Uri "$base/api/client/weight" -Method Post `
  -Headers $headers -ContentType 'application/json' `
  -Body (@{weight=75.5; body_fat_percentage=18.5; notes="E2E test"} | ConvertTo-Json)
if ($weight.id) {
    Write-Host "✓ Weight logged: weight_id=$($weight.id)" -ForegroundColor Green
} else {
    Write-Host "✗ Weight logging failed" -ForegroundColor Red
}

# 5. Fetch Weight History
Write-Host "`n[5/6] Fetch Weight History..." -ForegroundColor Yellow
$weights = Invoke-RestMethod -Uri "$base/api/client/weight?days=90" -Method Get -Headers $headers
$count = if ($null -eq $weights) { 0 } else { @($weights).Count }
Write-Host "✓ Retrieved $count weight entries" -ForegroundColor Green

# 6. Verify Token Security
Write-Host "`n[6/6] Verify Security..." -ForegroundColor Yellow
# Try with wrong token
try {
    Invoke-RestMethod -Uri "$base/api/client/profile" -Method Get `
      -Headers @{Authorization="Bearer invalid_token"} -ErrorAction Stop
    Write-Host "✗ SECURITY ISSUE: Accepted invalid token!" -ForegroundColor Red
} catch {
    Write-Host "✓ Correctly rejected invalid token" -ForegroundColor Green
}

Write-Host "`n=== INTEGRATION TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host "✓ All core flows working" -ForegroundColor Green
```

**Expected Output:**
```
=== INTEGRATION TEST SEQUENCE ===

[1/6] Register User...
✓ Registered: user_id=42

[2/6] Login User...
✓ Token obtained: eyJhbGciOiJIUzI1NiIsInR5...

[3/6] Fetch Profile...
✓ Profile loaded: client_id=42

[4/6] Log Weight Data...
✓ Weight logged: weight_id=1

[5/6] Fetch Weight History...
✓ Retrieved 1 weight entries

[6/6] Verify Security...
✓ Correctly rejected invalid token

=== INTEGRATION TEST COMPLETE ===
✓ All core flows working
```

---

## Part 9: Critical Validation Checklist

### Network & Communication ✓
- [ ] Backend server starts on port 8001 without errors
- [ ] Health endpoint (`/health`) returns 200 OK
- [ ] API documentation loads at `/docs`
- [ ] CORS headers present in responses
- [ ] Frontend can reach backend (no CORS errors)

### Authentication Flow ✓
- [ ] User can register with valid credentials
- [ ] Registration rejects weak/invalid password
- [ ] Registration rejects invalid email format
- [ ] User can login and receives JWT token
- [ ] Token contains correct user_id, email, role
- [ ] Token expiration time is 30 minutes in future
- [ ] Protected endpoints reject requests without token
- [ ] Protected endpoints reject invalid/malformed tokens
- [ ] Expired tokens are rejected after 30+ minutes

### Authorization & Role-Based Access ✓
- [ ] Client tokens cannot access admin endpoints
- [ ] Admin tokens cannot access client-only endpoints
- [ ] `get_current_client()` enforces client role
- [ ] `get_current_admin()` enforces admin role
- [ ] Attempting to access admin resource as client returns 403
- [ ] Attempting to access client resource as admin returns 403

### Database Transactions ✓
- [ ] CREATE operations save data to database
- [ ] READ operations return correct filtered data
- [ ] UPDATE operations modify existing records
- [ ] DELETE operations remove records
- [ ] Timestamps (created_at, updated_at) are recorded
- [ ] User data isolation enforced (cannot see other users' data)
- [ ] Data persists after API restart
- [ ] Foreign key relationships maintained

### Frontend-Backend Integration ✓
- [ ] Login form submits to correct endpoint
- [ ] Token stored in localStorage after login
- [ ] Token sent in Authorization header on requests
- [ ] Invalid credentials show error message
- [ ] Dashboard loads user profile data after login
- [ ] Weight tracking CRUD operations connected
- [ ] Mood logging CRUD operations connected
- [ ] Workout tracking CRUD operations connected
- [ ] Supplement tracking CRUD operations connected
- [ ] Profile update operations connected

### Error Handling ✓
- [ ] 400 errors show validation details
- [ ] 401 errors for unauthenticated access
- [ ] 403 errors for unauthorized access
- [ ] 404 errors for non-existent resources
- [ ] 500 errors show in logs (not exposed to frontend)
- [ ] Network errors handled gracefully
- [ ] Timeout errors handled with retry

### Security ✓
- [ ] Secret key is strong (not default)
- [ ] Passwords hashed (not plaintext in database)
- [ ] Admin credentials not in repository
- [ ] CORS configured for specific origins
- [ ] TrustedHost middleware active
- [ ] No sensitive data in error messages
- [ ] Token expiration enforced
- [ ] Invalid tokens rejected consistently

### Performance ✓
- [ ] API responses under 500ms
- [ ] Database queries optimized (no N+1)
- [ ] No SQL injection vulnerabilities
- [ ] Request size limits enforced
- [ ] Rate limiting on auth endpoints working
- [ ] Memory usage stable (no leaks)

---

## Part 10: Failure Recovery Procedures

### Backend Server Crashes
```bash
# 1. Check logs
tail -f backend.log

# 2. Restart server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001

# 3. If database corrupted
Remove-Item backend/nutrition_management.db
# Server will recreate on startup

# 4. If port stuck
Get-NetTCPConnection -LocalPort 8001 | Stop-Process -Force
```

### Database Locked/Corrupted
```bash
# SQLite: Close all connections
Remove-Item backend/nutrition_management.db

# PostgreSQL: Clear specific table
psql -U admin -d nutrition_db -c "DELETE FROM weight_logs;"
```

### Authentication Not Working
```bash
# 1. Check SECRET_KEY is set
python -c "from app.config import settings; print(settings.SECRET_KEY)"

# 2. Verify token not expired
# Check created_at in database

# 3. Check dependency injection
python -c "from app.dependencies import security; print('✓ Security imported')"
```

### CORS Blocked
```bash
# 1. Check frontend origin matches CORS configuration
# In backend/app/main.py, verify allow_origins includes frontend

# 2. Check frontend is running on correct port
# Frontend MUST be on 127.0.0.1:5500 (or update CORS_ORIGINS)

# 3. Test with curl
curl -i -X OPTIONS http://127.0.0.1:8001/api/auth/login \
  -H "Origin: http://127.0.0.1:5500"
# Should have Access-Control-Allow-Origin header
```

---

## Summary Table

| Component | Status | Pass/Fail | Notes |
|-----------|--------|-----------|-------|
| **Backend Server** | Starting | Must verify | Port 8001 |
| **Health Endpoint** | Connectivity | Must verify | `/health` |
| **CORS Configuration** | Network | Must verify | Allow 127.0.0.1:5500, 8001 |
| **JWT Token Flow** | Auth | Must verify | 30-min expiry |
| **Protected Routes** | Security | Must verify | 401/403 enforcement |
| **Database CRUD** | Data | Must verify | All 4 operations |
| **UI Integration** | Frontend | Must verify | All forms → API |
| **Admin vs Client** | Authorization | Must verify | Role separation |
| **Error Handling** | Resilience | Must verify | 4xx/5xx codes |
| **Performance** | Speed | Should verify | <500ms responses |

---

## Quick Test Commands

```bash
# Health check
curl http://127.0.0.1:8001/health

# Register
curl -X POST http://127.0.0.1:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!@#","full_name":"User"}'

# Login & get token
curl -X POST http://127.0.0.1:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!@#"}'

# Use token for protected endpoint
curl -X GET http://127.0.0.1:8001/api/client/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Check API docs
http://127.0.0.1:8001/docs
```

---

**Next Steps:**
1. Run Part 1-3 (Pre-flight, Server, CORS)
2. Run Part 4-5 (JWT, Protected Routes)
3. Run Part 6-7 (Database, UI Mapping)
4. Run Part 8 (E2E Test)
5. Verify all items in Part 9 checklist
6. Use Part 10 for troubleshooting as needed

**Estimated Time:** ~45 minutes for first complete run, ~10 minutes for subsequent validation runs.
