# Quick Start Guide - Client Nutrition Management System

## Problem Fixed ✅

**Issues Resolved:**
1. ✅ Login/Signup connection errors - CORS now allows file:// protocol
2. ✅ Sign out button now works correctly
3. ✅ Backend startup script fixed (emoji encoding issue)

---

## Option 1: Use HTTP Server (RECOMMENDED) 🌟

This eliminates all CORS and file:// protocol issues.

### Start Everything (Easiest):
```powershell
# From project root directory:
.\START_ALL.ps1
```
This opens two windows:
- Backend: `http://127.0.0.1:8001`
- Frontend: `http://localhost:3000`

### Start Individually:

**Backend:**
```powershell
cd backend
.\start_backend.ps1
```

**Frontend:**
```powershell
cd frontend
.\start_frontend.ps1
```

### Access the Application:
- **Frontend:** http://localhost:3000/client-login.html
- **Backend API Docs:** http://127.0.0.1:8001/docs
- **Test Connection:** http://localhost:3000/test-connection.html

---

## Option 2: Open Files Directly (Requires CORS Fix)

If you prefer opening HTML files directly:

1. **Start Backend:**
   ```powershell
   cd backend
   .\start_backend.ps1
   ```

2. **Open in Browser:**
   - Right-click `frontend/client-login.html`
   - Select "Open with Browser"

3. **Hard Refresh** (Clear Cache):
   - Press `Ctrl+Shift+R` or `Ctrl+F5`
   - This ensures old cached files are not used

---

## Demo Accounts

### Client Account:
- **Email:** demo@client.com
- **Password:** demo123

### Admin Account:
- **Email:** admin@demo.com
- **Password:** admin123

---

## Testing the Fix

### 1. Test Backend Connection
Open: http://localhost:3000/test-connection.html (if using HTTP server)

Or open: `frontend/test-connection.html` directly

Click "Test Backend Connection" - should show ✅ SUCCESS

### 2. Test Login
1. Go to login page
2. Enter demo credentials
3. Should login successfully without connection error

### 3. Test Sign Out
1. After logging in, click "Logout" button
2. Should return to login page
3. Local storage should be cleared

---

## Troubleshooting

### Still getting "Unable to connect" error?

1. **Check Backend is Running:**
   ```powershell
   Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue
   ```
   Should show `State: Listen`

2. **Clear Browser Cache:**
   - `Ctrl+Shift+R` (hard refresh)
   - Or clear browser cache in settings

3. **Check Browser Console:**
   - Press `F12`
   - Look for CORS or network errors
   - Share the error message

4. **Try Different Browser:**
   - Chrome, Firefox, or Edge
   - Some browsers have stricter CORS policies

### Sign Out Not Working?

1. **Check Browser Console (F12):**
   - Look for JavaScript errors
   - Check if `clearAllAuthData` function exists

2. **Try Manual Clear:**
   - Open Browser Console (F12)
   - Type: `localStorage.clear()`
   - Press Enter

3. **Verify config.js is loaded:**
   - View page source
   - Check if `<script src="config.js"></script>` is present

---

## Technical Details

### What Was Fixed:

1. **Backend CORS Configuration:**
   - Added "null" origin for file:// protocol support
   - Allows wildcard "*" in DEBUG mode
   - File: `backend/app/core/middleware.py`

2. **Frontend URL Resolution:**
   - Fixed API_BASE_URL for file:// protocol
   - Now correctly points to `http://127.0.0.1:8001`
   - File: `frontend/config.js`

3. **Backend Startup Script:**
   - Removed problematic emoji encoding
   - Fixed PowerShell parse errors
   - File: `backend/start_backend.ps1`

4. **Logout Functionality:**
   - Already working correctly
   - Calls `clearAllAuthData()` from config.js
   - Redirects to login page

---

## Port Information

- **Backend API:** Port 8001
- **Frontend Server:** Port 3000 (when using HTTP server)
- **Database:** SQLite (local development)

---

## Need Help?

1. **Test with diagnostic pages:**
   - `test-connection.html` - Test backend API
   - `test-input.html` - Test if typing works

2. **Check terminal output:**
   - Backend should show "Uvicorn running on http://127.0.0.1:8001"
   - No red error messages

3. **Verify environment:**
   - `.env` file exists in `backend/` directory
   - `DEBUG=True` in `.env` file

---

## Next Steps

After successful login, you can:
- View client dashboard
- Track progress and body metrics
- Log workouts and mood
- View nutrition plans
- Access mental coaching resources

Enjoy! 🎉
