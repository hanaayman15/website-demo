# Integration Testing - Quick Start Guide

## Overview

Three comprehensive test suites verify your frontend correctly communicates with your FastAPI backend:

1. **PyTest Integration Tests** (29 tests) - API-level testing
2. **Cypress E2E Tests** (21 tests) - Browser-level testing  
3. **Test Runners** - Convenient scripts to run all tests

**Status: 50+ integration tests covering authentication, CRUD operations, error handling, and complete user workflows.**

---

## Files Created

### Test Files

| File | Purpose | Tests |
|------|---------|-------|
| `backend/test_integration.py` | PyTest integration tests | 29 |
| `backend/cypress_e2e_tests.js` | Cypress E2E browser tests | 21 |
| `cypress.config.js` | Cypress configuration | - |

### Documentation

| File | Purpose |
|------|---------|
| `INTEGRATION_TESTING_GUIDE.md` | Comprehensive testing guide (500+ lines) |
| `TEST_QUICK_START.md` | This quick start guide |

### Test Runners

| File | OS | Purpose |
|------|----|----|
| `run_tests.sh` | Linux/macOS | Bash test runner with menu |
| `run_tests.ps1` | Windows | PowerShell test runner with menu |

---

## Quick Start (5 minutes)

### Step 1: Start Backend

```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Backend will be available at `http://127.0.0.1:8001`

### Step 2: Run PyTest Tests

```bash
cd backend
python -m pytest test_integration.py -v -s
```

**Expected:** All 29 tests pass in ~45 seconds

```
======================== 29 passed in 45.23s =========================
```

### Step 3 (Optional): Run Cypress Tests

```bash
# First, install Cypress if not already installed
npm install cypress

# Then run in interactive mode
npx cypress open

# Or run in headless mode
npx cypress run
```

**Expected:** All 21 tests pass in ~8 seconds

---

## Using Test Runners

### Windows Users

```powershell
# Interactive menu (recommended)
.\run_tests.ps1

# Run all PyTest tests
.\run_tests.ps1 pytest

# Run specific test class
.\run_tests.ps1 pytest-class TestLoginFlow

# Check if services are running
.\run_tests.ps1 status

# Generate coverage report
.\run_tests.ps1 pytest-coverage
```

### Linux/macOS Users

```bash
# Make script executable
chmod +x run_tests.sh

# Interactive menu (recommended)
./run_tests.sh

# Run all PyTest tests
./run_tests.sh pytest

# Run specific test class
./run_tests.sh pytest TestLoginFlow

# Check service status
./run_tests.sh status
```

---

## Test Coverage Summary

### 1. Authentication (7 tests)
- ✅ User registration with validation
- ✅ User login
- ✅ Invalid credentials handling
- ✅ Token generation and expiration
- ✅ Password strength validation
- ✅ Duplicate email prevention

### 2. Client Profile (5 tests)
- ✅ Profile creation
- ✅ Profile retrieval
- ✅ Profile updates (all fields)
- ✅ Partial updates
- ✅ Fitness fields

### 3. Health Logging (8 tests)
- ✅ Weight tracking
- ✅ Workout logging
- ✅ Mood tracking (with sleep data)
- ✅ Supplement logging
- ✅ Data retrieval with pagination
- ✅ Query parameter validation

### 4. Error Handling (9 tests)
- ✅ Missing authentication
- ✅ Invalid token rejection
- ✅ Expired token handling
- ✅ Malformed JSON
- ✅ Missing required fields
- ✅ Invalid field types
- ✅ Duplicate prevention
- ✅ Unauthorized access

### 5. Complete Workflows (2 tests)
- ✅ PyTest end-to-end journey
- ✅ Cypress complete user workflow

---

## Test File Locations & Descriptions

### PyTest Tests (`backend/test_integration.py`)

```python
class TestLoginFlow:           # 6 tests
  - test_register_user_success
  - test_register_invalid_email
  - test_register_weak_password
  - test_login_success
  - test_login_invalid_credentials
  - test_token_expiration

class TestCreateClient:        # 2 tests
  - test_signup_flow_creates_profile
  - test_initial_profile_data

class TestUpdateClient:        # 3 tests
  - test_update_profile_basic_fields
  - test_update_profile_fitness_fields
  - test_update_partial_fields

class TestLogData:             # 8 tests
  - test_log_workout
  - test_get_workouts_with_pagination
  - test_log_mood
  - test_get_mood_data
  - test_log_weight
  - test_get_weight_data
  - test_log_supplement
  - test_get_supplements

class TestErrorHandling:       # 9 tests
  - test_missing_auth_token
  - test_invalid_auth_token
  - test_expired_auth_token
  - test_malformed_json_request
  - test_missing_required_fields
  - test_invalid_field_types
  - test_duplicate_email_registration
  - test_invalid_query_parameters
  - test_unauthorized_access

class TestCompleteWorkflow:    # 1 test
  - test_full_user_journey
```

### Cypress Tests (`cypress_e2e_tests.js`)

```javascript
describe('Login Flow', () => {              // 6 tests
  - should load login page
  - should register new user
  - should login with credentials
  - should show error for invalid creds
  - should show error for empty fields
  - should persist token after refresh

describe('Client Profile Management', () => { // 3 tests
  - should display profile
  - should update profile
  - should validate fields

describe('Log Health Metrics', () => {      // 5 tests
  - should log weight
  - should log workout
  - should log mood
  - should log supplements
  - should show charts

describe('Logout', () => {                  // 2 tests
  - should logout and clear auth
  - should prevent access after logout

describe('Error Handling', () => {          // 4 tests
  - should handle network errors
  - should handle 401 responses
  - should show validation errors
  - should handle timeouts

describe('Complete User Journey', () => {   // 1 test
  - signup → profile → log data → logout
```

---

## Running Individual Tests

### Run Specific PyTest Class

```bash
cd backend

# Authentication tests only
python -m pytest test_integration.py::TestLoginFlow -v -s

# Client profile tests
python -m pytest test_integration.py::TestUpdateClient -v -s

# Error handling tests
python -m pytest test_integration.py::TestErrorHandling -v -s

# Complete workflow test
python -m pytest test_integration.py::TestCompleteWorkflow -v -s
```

### Run Specific PyTest Method

```bash
# Single test
python -m pytest test_integration.py::TestLoginFlow::test_login_success -v -s
```

### Run Cypress Tests Selectively

```bash
# Interactive - select individual tests
npx cypress open

# Run single spec file
npx cypress run --spec "cypress/e2e/integration.cy.js"

# Run with specific browser
npx cypress run --browser chrome
```

---

## Interpreting Results

### ✅ Successful Test Run

```
============================= test session starts ==============================
collected 29 items

test_integration.py::TestLoginFlow::test_register_user_success PASSED [ 3%]
test_integration.py::TestLoginFlow::test_login_success PASSED [ 7%]
...

============================= 29 passed in 45.23s ==============================
```

**What this means:**
- All 29 tests passed
- No failures or errors
- Frontend-backend integration is working correctly
- Ready for deployment

### ❌ Failed Test

```
test_integration.py::TestLoginFlow::test_login_success FAILED

AssertionError: assert 401 == 200
  Unauthorized
```

**Debugging steps:**
1. Check backend is running: `curl http://127.0.0.1:8001/health`
2. Check CORS settings in `backend/app/main.py`
3. Check token format in request headers
4. Review error message for details
5. Run individual test: `python -m pytest test_integration.py::TestLoginFlow::test_login_success -v -s`

---

## Common Scenarios

### Scenario 1: Run All Tests After Code Changes

```bash
# Make your changes, then run everything
.\run_tests.ps1 all

# Or manually:
cd backend
python -m pytest test_integration.py -v
npx cypress run
```

### Scenario 2: Test Only Authentication Changes

```bash
.\run_tests.ps1 pytest-class TestLoginFlow
```

### Scenario 3: Debug Failing Test

```bash
# Run with more verbose output
python -m pytest test_integration.py::TestLoginFlow::test_login_success -vv -s

# Or use Cypress interactive mode
npx cypress open
# Then click the test to debug step-by-step
```

### Scenario 4: Generate Coverage Report

```bash
# Windows
.\run_tests.ps1 pytest-coverage

# Linux/macOS
./run_tests.sh coverage

# Manual
cd backend
pip install pytest-cov
python -m pytest test_integration.py --cov=app --cov-report=html
```

---

## Troubleshooting

### "Connection refused" Error

**Problem:** Backend not running

**Solution:**
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

### "CORS error" in Cypress

**Problem:** Frontend/backend not on allowed CORS origins

**Solution:** Check `backend/app/main.py` includes:
```python
"http://127.0.0.1:5500"
```

### "401 Unauthorized" in Tests

**Problem:** Token not being sent correctly

**Solution:** Verify header format:
```
✓ Authorization: Bearer {token}
✗ Authorization: {token}
```

### Tests Pass Individually but Fail Together

**Problem:** Database state conflicts

**Solution:** Tests use unique emails with timestamps - clear database:
```bash
rm backend/app.db
# Or tests will automatically clean up data
```

### Cypress "Element not found"

**Problem:** HTML selector doesn't exist

**Solution:** 
1. Add `data-cy` attributes to HTML elements
2. Update test selector to match

---

## Next Steps After Testing

✅ **All tests passing?** You're ready to:

1. **Deploy to Production**
   - Set environment variables for CORS_ORIGINS
   - Update SECRET_KEY
   - Deploy backend to production server
   - Deploy frontend to production domain

2. **Monitor Performance**
   - Set up error tracking
   - Monitor API response times
   - Track authentication failures

3. **Security Hardening**
   - Enable HTTPS/SSL
   - Review CORS whitelist
   - Implement rate limiting
   - Set up security headers

4. **User Testing**
   - Real user acceptance testing
   - Load testing
   - Browser compatibility testing

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `.\run_tests.ps1` | Interactive menu (Windows) |
| `./run_tests.sh` | Interactive menu (Linux/macOS) |
| `python -m pytest test_integration.py -v -s` | Run all tests |
| `npx cypress open` | Browser test UI |
| `npx cypress run` | Headless browser tests |
| `.\run_tests.ps1 status` | Check service status |
| `.\run_tests.ps1 pytest-coverage` | Generate coverage report |

---

## Documentation Files

For more detailed information, see:

- **[INTEGRATION_TESTING_GUIDE.md](INTEGRATION_TESTING_GUIDE.md)** - Complete 500+ line guide with:
  - Detailed setup instructions
  - Test descriptions
  - CI/CD integration examples
  - Best practices
  - Advanced debugging

- **[API_COMPARISON_REPORT.md](API_COMPARISON_REPORT.md)** - API endpoint verification

- **[INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md)** - Project integration overview

---

## Support

If tests fail:
1. Check backend is running: `http://127.0.0.1:8001`
2. Check frontend is running: `http://127.0.0.1:5500` (for Cypress)
3. Review error message carefully
4. Run single test in verbose mode: `pytest ...::test_name -vv -s`
5. Check [INTEGRATION_TESTING_GUIDE.md](INTEGRATION_TESTING_GUIDE.md) troubleshooting section

---

## Summary

✅ **29 PyTest integration tests** - API-level verification
✅ **21 Cypress E2E tests** - Browser-level verification
✅ **Test runners** - Easy execution on Windows/Linux/macOS
✅ **Comprehensive documentation** - 500+ lines of guides

**Total:** 50+ tests covering all critical paths from user signup through data logging and logout.

**Time to run:** ~60 seconds for all tests
**Coverage:** Authentication, profiles, logging, errors, complete workflows

Get started:
```bash
cd backend && python -m pytest test_integration.py -v -s
```

Enjoy! 🚀

