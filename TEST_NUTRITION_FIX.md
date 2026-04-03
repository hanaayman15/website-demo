# Quick Test Guide: Nutrition Data Persistence

## What Was Fixed
The Add Client Details form now **pre-loads existing profile data** instead of showing blank fields. This prevents accidentally overwriting nutrition data when you save.

## How to Test the Fix

### Step 1: Start the Backend
```bash
cd backend
python main.py
```

### Step 2: Start the Frontend
```bash
cd react-frontend
npm run dev
```
Open browser to: http://localhost:5173

### Step 3: Login or Create Account
- Already have an account? Login at /login
- New account? Visit /client-signup

### Step 4: Test Data Persistence

**Test Case A: Save Nutrition Data**
1. Navigate to `/add-client-details`
2. Fill in these fields:
   - Full Name: "Test User Four Five Six" (at least 4 names required)
   - Weight: `80`
   - Height: `175`
   - Activity Level: `Moderate`
   - Goal Weight: `75`
   - Competition Date: `2026-06-15`
   - Protein Target: `140`
   - Carbs Target: `200`
   - Fats Target: `65`
3. Click "Save Profile & Continue"
4. Wait for "Successfully saved" message
5. Navigate to `/dashboard`
6. **Expected**: Dashboard shows Weight: 80 kg, Goal: 75 kg, etc. (NOT zeros!)

**Test Case B: Pre-load Existing Data**
1. From dashboard, navigate to `/add-client-details`
2. **Expected**: All previously filled fields should appear (NOT blank!)
3. Modify one field (e.g., change Weight to 81)
4. Click "Save Profile & Continue"
5. Go back to `/add-client-details`
6. **Expected**: Weight now shows 81 (your change was persisted)

**Test Case C: Verify via Diagnostics**
1. Navigate to `/diagnostics`
2. Look at the nutrition fields table
3. All non-zero fields should show ✅ OK (green)
4. Any zero fields show ❌ MISSING/ZERO (red)
5. Save data from Add Client Details, then reload `/diagnostics`
6. **Expected**: More fields should now show ✅ OK

## Expected Behavior Before Fix
- Form showed blank fields (empty strings)
- Saving would overwrite previous nutrition data with zeros
- Dashboard would show N/A or 0 values

## Expected Behavior After Fix
- Form shows previously saved data
- Saving preserves fields you didn't modify
- Dashboard shows the actual nutrition data
- You can navigate between Add Client Details and Dashboard without data loss

## If Tests Don't Pass
1. **Check browser console** (F12) for errors
2. **Check network tab** - verify `/api/client/profile` GET request returns your data
3. **Check backend logs** for any API errors
4. **Clear localStorage** if you're seeing stale cached data:
   ```javascript
   // In browser console:
   localStorage.clear()
   location.reload()
   ```

## Files Modified
- `react-frontend/src/hooks/useAddClientDetails.js` - Added profile loading on mount
- `react-frontend/src/pages/DiagnosticsPage.jsx` - New diagnostic page
- `react-frontend/src/routes.jsx` - Added /diagnostics route
- `backend/app/routers/clients.py` - Added console logging for debugging

## Validation Checklist
- ✅ Frontend builds without errors
- ✅ Form pre-loads existing data
- ✅ Nutrition fields persist after save
- ✅ Dashboard displays correct values
- ✅ Can navigate between pages without data loss
- ✅ All form validation still works
- ✅ Auto-calculations (BMI, TDEE, macros) still work
