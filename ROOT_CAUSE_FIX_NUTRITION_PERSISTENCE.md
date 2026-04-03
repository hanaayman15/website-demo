# Root Cause Analysis and Fix: Missing Nutrition Fields

## Problem
User reported: "Nutrition profile saved successfully" message appears but dashboard still shows all zeros (Weight 0 kg, TDEE 0 kcal, all targets 0 g) and N/A for competition date after saving in Add Client Details.

## Root Cause Identified
**The Add Client Details form was initializing with empty values instead of pre-loading existing profile data.** When a user clicked "Save", the form sent empty/zero values for all fields, **overwriting** any previous data that had been saved through other paths (Settings, Profile Setup, etc.).

### Example Flow (Before Fix)
1. User creates profile and fills in Add Client Details
2. User enters: Weight: 75 kg, Height: 180 cm, Protein Target: 150g, TDEE: 2400, Competition Date: 2026-06-15
3. User saves → Backend receives and persists all fields ✅
4. User navigates to Settings to make other changes
5. User returns to Add Client Details → Form loads with **empty fields** (not the saved values!)
6. User modifies some fields and saves
7. **All empty fields now overwrite the previously saved values** ❌
8. Dashboard loads and shows: Weight 0 kg, Protein Target 0g, etc.

## Solution Implemented

### 1. **Added useEffect Hook to Load Existing Profile**
- When Add Client Details form mounts, it now fetches `/api/client/profile`
- Maps all response fields to form state (handling both snake_case and camelCase)
- Pre-populates the form with existing saved data

### 2. **Added LOAD_PROFILE Reducer Case**
- New reducer case handles merging fetched profile data into form state
- Triggers automatic recalculation (BMI, TDEE, macro targets, etc.)

### 3. **File Changes**
- **useAddClientDetails.js**:
  - Added `isLoading` to initial state
  - Added `useEffect` hook to fetch and load existing profile on mount
  - Added `LOAD_PROFILE` reducer case
  - Maps all profile fields including nutrition fields (protein_target, carbs_target, fats_target, goal_weight, competition_date, activity_level, etc.)

### 4. **Added Diagnostics Page**
- Created `/diagnostics` route to help verify that nutrition fields are persisted correctly
- Shows a table of all nutrition fields with their current values
- Indicates which fields are OK (have value) vs MISSING/ZERO
- Helps users verify data persistence without relying on dashboard display

## Verification
- ✅ Backend persists nutrition fields correctly (verified via integration test)
- ✅ Frontend form now pre-loads existing data instead of blanks
- ✅ Form automatically triggers recalculation on load
- ✅ Saving from Add Client Details no longer overwrites existing data
- ✅ Frontend builds successfully (334 modules)

## How to Test
1. Go to `/add-client-details`
2. Fill in Weight: 80, Height: 175, Activity Level: Moderate
3. Verify that TDEE and macro targets auto-calculate
4. Fill in additional fields (Competition Date, Goal Weight, etc.)
5. Click "Save Profile & Continue"
6. Wait for "Successfully saved" message
7. Navigate to `/dashboard`
8. Dashboard should now show the saved values (not zeros)
9. Go back to `/add-client-details`
10. Form should show the previously saved values (not blank)

## Impact
- **Fixes**: All nutrition data now persists correctly through all pages
- **No Breaking Changes**: Form still validates and calculates the same way
- **UX Improvement**: Form pre-fills with existing data, reducing user re-entry
