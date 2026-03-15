# 🧪 Quick Integration Testing Guide

**How to verify the frontend-backend integration is working correctly**

---

## ✅ Pre-Test Checklist

Make sure both services are running:

### Terminal 1: Start Backend
```bash
cd c:\Users\HP\Downloads\client nutrition management\backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8001
```

### Terminal 2: Start Frontend (New Terminal)
```bash
cd c:\Users\HP\Downloads\client nutrition management\frontend
python -m http.server 5500
```

Expected output:
```
Serving HTTP on 127.0.0.1:5500
```

---

## 🧪 Test 1: Health Check (Backend)

**What:** Verify backend is running and responding

**How:**
```bash
# In PowerShell
Invoke-RestMethod -Uri "http://127.0.0.1:8001/health" -Method Get
```

**Expected Result:**
```json
{
  "status": "healthy",
  "app_name": "Client Nutrition Management System"
}
```

**Status:**
- ✅ If you see JSON above → Backend is working
- ❌ If connection refused → Backend not running on port 8001

---

## 🧪 Test 2: CORS Headers (Browser Developer Tools)

**What:** Verify CORS is properly configured

**How:**
1. Open Firefox or Chrome
2. Go to **http://127.0.0.1:5500/frontend/client-login.html**
3. Press **F12** to open Developer Tools
4. Click **Network** tab
5. The page will auto-load and make requests
6. Look at any request and click on it
7. Scroll to **Response Headers** section

**Expected Response Headers:**
```
access-control-allow-origin: http://localhost:5500  ✅
access-control-allow-credentials: true              ✅
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS  ✅
access-control-allow-headers: Authorization, Content-Type  ✅
```

**Status:**
- ✅ If all headers above are present → CORS configured correctly
- ❌ If you see `access-control-allow-origin: *` → Using wildcard (less secure)
- ❌ If headers missing → CORS error likely

---

## 🧪 Test 3: Login Fails = Good (Test NETWORK)

**What:** Verify frontend can reach backend API

**How:**
1. On same page (http://127.0.0.1:5500/frontend/client-login.html)
2. Keep Network tab open
3. Open **Console** tab (still in F12)
4. Paste this and run:

```javascript
// Test if frontend can reach backend
fetch('http://127.0.0.1:8001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
    })
})
.then(response => {
    console.log('✅ Request reached backend! Status:', response.status);
    return response.json();
})
.then(data => console.log('Response:', data))
.catch(error => console.log('❌ Network error:', error));
```

**Expected Result in Console:**
```
✅ Request reached backend! Status: 401
Response: {detail: "Incorrect email or password"}
```

**Status:**
- ✅ If you see status 401 → Backend is reachable, API working
- ❌ If you see network error → Backend not reachable on port 8001
- ❌ If CORS error → CORS configuration issue

**What the 401 Status Means:**
- 401 = "Unauthorized" = Backend received request and rejected bad credentials
- This is GOOD! It means the connection works (bad credentials = expected)

---

## 🧪 Test 4: Successful Login (Full Test)

**What:** Complete authentication flow end-to-end

**How:**
1. Go to: **http://127.0.0.1:5500/frontend/client-login.html**
2. Use these credentials:
   - **Email:** `admin@nutrition.com`
   - **Password:** `admin123secure!`
3. Click **Login**
4. Keep browser console (F12) open to see any errors

**Expected Result:**
```
✅ "Welcome back!" popup appears
✅ Redirected to client-dashboard.html
✅ Dashboard displays with your info
```

**What to Check:**
1. **Network Tab (F12):**
   - POST to `/api/auth/login` → Status **200** ✅
   - GET to `/api/client/profile` → Status **200** ✅

2. **Console Tab (F12):**
   - No red error messages ✅
   - No CORS errors ✅

3. **Storage Tab (F12):**
   - Go to **Storage** → **Local Storage** → http://127.0.0.1:5500
   - You should see:
     ```
     authToken: eyJhbGc...  ✅
     currentClientId: 1      ✅
     clientEmail: admin@nutrition.com  ✅
     ```

**Status:**
- ✅ If all above pass → Integration is working!
- ❌ If login fails → Check console for specific error

---

## 🧪 Test 5: Data Operations

**What:** Verify CRUD operations work (Create, Read, Update, Delete)

**How:** After successful login on dashboard

### 5a. Log Weight
1. Click **Update Measurements** button
2. Enter weight: `75.5`
3. Enter body fat: `19.2`
4. Click **Save**

**Expected:** ✅ Success message appears

**Check:** Network tab should show POST to `/api/client/weight` with status 200

### 5b. Log Mood
1. Click **Log Mood** button
2. Rate your mood: `8` (1-10 scale)
3. Click OK

**Expected:** ✅ "Mood logged successfully!" message

**Check:** Network tab should show POST to `/api/client/mood` with status 200

### 5c. Log Workout
1. Scroll to workout section
2. Enter workout name: `Morning Run`
3. Select type: `Cardio`
4. Duration: `30` minutes
5. Intensity: `High`
6. Click **Log Workout**

**Expected:** ✅ "Workout logged successfully!" message

---

## 🧪 Test 6: Session Persistence

**What:** Verify auth token persists across page refresh

**How:**
1. Login successfully (Test 4)
2. Press **F5** to refresh the page
3. Dashboard should reload without asking to login again

**Expected:**
- ✅ Dashboard loads immediately
- ✅ Your data is still there
- ✅ No redirect to login page

**What's Happening:**
- Token is stored in localStorage
- Page refresh doesn't clear localStorage
- Backend validates token on each API call

---

## 🧪 Test 7: Session Expiration

**What:** Verify 401 errors redirect to login

**How:**
1. Login successfully
2. In browser console, manually clear the auth token:

```javascript
localStorage.removeItem('authToken');
```

3. Try to navigate to Progress page or click any button

**Expected:**
- ✅ Error message appears
- ✅ Automatic redirect to login page
- ✅ You must login again

---

## ❌ Troubleshooting

### Problem: "Connection Refused" when accessing frontend page

**Cause:** Frontend server not running on port 5500

**Fix:**
```bash
cd frontend
python -m http.server 5500
```

### Problem: "Unable to connect to server" error in browser

**Causes:**
1. Backend not running on port 8001
2. Frontend still has hardcoded port 8000 (should be 8001 after our fixes)

**Fix:**
```bash
# Terminal 1 - Start backend on 8001
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001

# Verify by checking this passes
curl http://127.0.0.1:8001/health
```

### Problem: CORS error in browser console

**Typical Error:**
```
Access to XMLHttpRequest at 'http://127.0.0.1:8001/api/auth/login' from origin 
'http://localhost:5500' has been blocked by CORS policy
```

**Cause:** CORS not properly configured

**Fix:** Check that [backend/app/main.py](backend/app/main.py#L223) has correct CORS config with `http://localhost:5500` and `http://127.0.0.1:5500`

### Problem: 401 Unauthorized on login

**Causes:**
1. Wrong email/password
2. User doesn't exist
3. Token expired

**Fix:** Use admin credentials:
- Email: `admin@nutrition.com`
- Password: `admin123secure!`

Or create a new account on signup page

---

## 📊 Integration Status Summary

Based on test results, here's what's working:

| Component | Status | Evidence |
|-----------|--------|----------|
| **Backend Startup** | ✅ PASS | GET /health returns 200 |
| **Frontend Server** | ✅ PASS | Can load login page |
| **Network Connectivity** | ✅ PASS | API requests reach backend |
| **CORS Configuration** | ✅ PASS | Response headers correct |
| **Authentication** | ✅ PASS | Login with admin credentials works |
| **Token Management** | ✅ PASS | Token stored in localStorage |
| **API Endpoints** | ✅ PASS | GET/POST requests return 200 |
| **Error Handling** | ✅ PASS | 401 errors redirect properly |

---

## 🎉 Success Criteria

You have successfully integrated the frontend and backend when:

1. ✅ Can login with admin credentials
2. ✅ Dashboard loads after login
3. ✅ No CORS errors in browser console
4. ✅ Can log weight, mood, and workouts
5. ✅ Token persists across page refresh
6. ✅ 401 errors automatically redirect to login
7. ✅ Network requests show status 200/201

---

## 📞 Still Having Issues?

**Check these files for configuration:**

1. **Frontend API URL:**
   - [frontend/config.js](frontend/config.js) - If using this
   - Or search for `API_BASE_URL` in HTML files - should be `http://127.0.0.1:8001`

2. **Backend CORS:**
   - [backend/app/main.py lines 220-235](backend/app/main.py#L220-L235)
   - Should include `http://localhost:5500` and `http://127.0.0.1:5500`

3. **Backend Port:**
   - Should be running on `http://127.0.0.1:8001` (not 8000)

4. **Frontend Port:**
   - Should be running on `http://localhost:5500` or `http://127.0.0.1:5500`
