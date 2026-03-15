# End-to-End Integration Testing Guide

Complete guide for testing frontend-backend integration of the Client Nutrition Management system.

## Overview

Two test suites are provided:

1. **PyTest Integration Tests** (`test_integration.py`) - Python-based API tests
2. **Cypress E2E Tests** (`cypress_e2e_tests.js`) - Browser-based UI tests

Both verify that your frontend correctly communicates with your FastAPI backend.

---

## Setup Requirements

### Prerequisites

- FastAPI backend running on `http://127.0.0.1:8001`
- Frontend running on `http://127.0.0.1:5500`
- Python virtual environment configured
- Node.js and npm installed (for Cypress only)

### Installation

#### For PyTest Integration Tests

```bash
# Navigate to backend directory
cd backend

# Install test dependencies (already in requirements-dev.txt)
pip install pytest httpx

# Optional: Install additional packages
pip install python-jose[cryptography] pydantic pytest-asyncio
```

#### For Cypress E2E Tests

```bash
# Navigate to project root
cd c:\Users\HP\Downloads\client nutrition management

# Install Cypress and dependencies
npm install cypress --save-dev
npm install @cypress/webpack-dev-server --save-dev

# Optional: Install Cypress plugins
npm install cy-verify-dom-exist --save-dev
```

---

## Running Tests

### Option 1: PyTest Integration Tests (Recommended for CI/CD)

#### Run All Tests

```bash
cd backend
python -m pytest test_integration.py -v -s
```

#### Run Specific Test Class

```bash
# Login flow tests
python -m pytest test_integration.py::TestLoginFlow -v -s

# Client profile tests
python -m pytest test_integration.py::TestUpdateClient -v -s

# Error handling tests
python -m pytest test_integration.py::TestErrorHandling -v -s

# Complete workflow test
python -m pytest test_integration.py::TestCompleteWorkflow -v -s
```

#### Run with Coverage Report

```bash
pip install pytest-cov
python -m pytest test_integration.py --cov=app --cov-report=html
# Open htmlcov/index.html to view coverage
```

#### Run with Detailed Output

```bash
python -m pytest test_integration.py -v -s --tb=short
```

**Options:**
- `-v` : Verbose output
- `-s` : Show print statements
- `--tb=short` : Short traceback format
- `-k "test_name"` : Run specific test by name
- `--maxfail=3` : Stop after 3 failures

---

### Option 2: Cypress E2E Tests (Browser-based)

#### Interactive Mode (Cypress UI)

```bash
npx cypress open
```

This opens the Cypress test runner where you can:
- Select individual tests to run
- Watch tests execute in real-time
- Inspect elements and network requests
- Re-run specific tests
- View detailed error messages and screenshots

#### Headless Mode (CLI)

```bash
# Run all E2E tests
npx cypress run

# Run specific spec file
npx cypress run --spec "cypress/e2e/integration.cy.js"

# Run with specific browser
npx cypress run --browser chrome
npx cypress run --browser firefox

# Generate video recordings
npx cypress run --record  # Requires Cypress Cloud account or local setup
```

---

## Test Coverage

### PyTest Integration Tests

#### 1. **Login Flow Tests** (6 tests)
- ✅ User registration success
- ✅ Invalid email rejection
- ✅ Weak password rejection
- ✅ Successful login
- ✅ Invalid credentials rejection
- ✅ Token expiration validation

**What it verifies:**
- Registration API endpoint works correctly
- Email validation is enforced
- Password strength requirements are met
- Login returns valid JWT token
- Token contains expiration time
- Invalid credentials are rejected

**Run with:**
```bash
python -m pytest test_integration.py::TestLoginFlow -v -s
```

---

#### 2. **Create Client Tests** (2 tests)
- ✅ Signup flow creates profile
- ✅ Initial profile data validation

**What it verifies:**
- Registration automatically creates client profile
- Profile has all required fields
- Default values are set correctly
- Profile can be retrieved immediately after signup

**Run with:**
```bash
python -m pytest test_integration.py::TestCreateClient -v -s
```

---

#### 3. **Update Client Tests** (3 tests)
- ✅ Update basic profile fields
- ✅ Update fitness-specific fields
- ✅ Partial field updates

**What it verifies:**
- All profile fields can be updated
- Fitness-related fields are stored correctly
- Partial updates don't require all fields
- GET /api/client/nutrition-plans works

**Run with:**
```bash
python -m pytest test_integration.py::TestUpdateClient -v -s
```

---

#### 4. **Log Data Tests** (8 tests)
- ✅ Log workout with all fields
- ✅ Retrieve workouts with pagination
- ✅ Log mood and sleep data
- ✅ Retrieve mood data
- ✅ Log weight and body metrics
- ✅ Retrieve weight data
- ✅ Log supplements
- ✅ Retrieve supplements

**What it verifies:**
- POST endpoints accept correct data structure
- Query parameters (days, skip, limit) work
- Response format matches expectations
- Pagination returns list type
- All required fields are validated

**Run with:**
```bash
python -m pytest test_integration.py::TestLogData -v -s
```

---

#### 5. **Error Handling Tests** (9 tests)
- ✅ Missing authentication token
- ✅ Invalid token rejection
- ✅ Expired token rejection
- ✅ Malformed JSON handling
- ✅ Missing required fields
- ✅ Invalid field types
- ✅ Duplicate email rejection
- ✅ Invalid query parameters
- ✅ Unauthorized access prevention

**What it verifies:**
- 403/401 status codes for auth failures
- 422 validation errors for bad input
- Proper error messages in responses
- Type validation for numeric fields
- Duplicate prevention logic
- Query parameter bounds checking

**Run with:**
```bash
python -m pytest test_integration.py::TestErrorHandling -v -s
```

---

#### 6. **Complete Workflow Test** (1 integration test)
- ✅ Full user journey: signup → profile → logging data

**What it verifies:**
- User can signup
- Can immediately access profile
- Can update profile
- Can log weight, workout, mood, supplement
- Can retrieve all logged data
- Complete flow works end-to-end

**Run with:**
```bash
python -m pytest test_integration.py::TestCompleteWorkflow::test_full_user_journey -v -s
```

---

### Cypress E2E Tests

#### 1. **Login Flow Tests** (5 tests)
- ✅ Load login page
- ✅ Register new user
- ✅ Login with valid credentials
- ✅ Show error for invalid credentials
- ✅ Show error for empty fields
- ✅ Persist token after page refresh

**What it tests in browser:**
- UI elements are visible and clickable
- Form validation works
- Errors display to user
- Authentication state persists

---

#### 2. **Client Profile Management** (3 tests)
- ✅ Display client profile
- ✅ Update profile with new data
- ✅ Validate profile fields

**What it tests:**
- Profile information displays correctly
- Update form submits successfully
- Backend receives updates
- Validation messages show for bad input

---

#### 3. **Log Health Metrics** (5 tests)
- ✅ Log weight data
- ✅ Log workout data
- ✅ Log mood data
- ✅ Log supplements
- ✅ Show progress charts

**What it tests:**
- Forms for each metric work
- Data is sent to backend correctly
- Success messages display
- Charts render with data

---

#### 4. **Logout Functionality** (2 tests)
- ✅ Logout clears auth data
- ✅ Prevent access to protected pages after logout

**What it tests:**
- localStorage is cleared
- Redirect to login works
- Protected pages are inaccessible

---

#### 5. **Error Handling** (4 tests)
- ✅ Handle network errors gracefully
- ✅ Handle 401 unauthorized responses
- ✅ Show validation errors
- ✅ Handle API timeout errors

**What it tests:**
- Error messages display to user
- App handles network failures
- 401 responses trigger logout
- Timeouts don't crash the app

---

#### 6. **Complete User Journey** (1 integration test)
- ✅ Signup → Profile Update → Log Metrics → Logout

**What it tests:**
- Entire user flow in browser
- All pages work together
- Navigation between pages works
- Data persists across page loads

---

## Understanding Test Output

### PyTest Output Example

```bash
test_integration.py::TestLoginFlow::test_register_user_success PASSED ✓ User registered: test_123456@test.com
test_integration.py::TestLoginFlow::test_login_success PASSED ✓ User logged in: test_654321@test.com
test_integration.py::TestUpdateClient::test_update_profile_basic_fields PASSED ✓ Basic profile fields updated
...

======================== 29 passed in 45.23s =========================
```

**Key information:**
- `PASSED` ✓ - Test succeeded
- `FAILED` ✗ - Test failed, see assertion error
- `SKIPPED` - Test was skipped
- Total time at bottom

### Cypress Output Example

```bash
Authentication
  Login Flow
    ✓ should load login page (523ms)
    ✓ should register new user successfully (1200ms)
    ✓ should login with valid credentials (950ms)
    ✓ should show error for invalid credentials (800ms)

Dashboard
  Profile Management
    ✓ should display client profile (450ms)
    ✓ should update profile with new data (1100ms)

  29 passing (8s)
```

---

## Debugging Tests

### PyTest Debugging

#### Print Debug Information

```python
# In test file
def test_something(client):
    response = client.get("/api/endpoint")
    print(f"Status: {response.status_code}")
    print(f"Body: {response.json()}")
    assert response.status_code == 200
```

Run with `-s` flag to see print output:
```bash
python -m pytest test_integration.py -s
```

#### Use PyTest Debugger

```bash
python -m pytest test_integration.py --pdb
# Drops into Python debugger on failure
```

#### Run Single Test

```bash
python -m pytest test_integration.py::TestLoginFlow::test_login_success -v -s
```

### Cypress Debugging

#### Debug Mode

```bash
cd client nutrition management
DEBUG=cypress:* npx cypress run
```

#### Use Cypress UI for Step-Through

```bash
npx cypress open
```

Click on specific test to run it and inspect step-by-step:
- Hover over steps to see assertions
- Click to revisit state at that step
- Use browser DevTools (F12) alongside Cypress UI
- View network requests in Network tab

#### View Screenshots/Videos

After running tests:
```bash
# Screenshots saved to:
cypress/screenshots/

# Videos saved to:
cypress/videos/
```

---

## Common Issues & Solutions

### Issue: "Connection refused" error

**Cause:** Backend not running on port 8001

**Solution:**
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

### Issue: "CORS error" in Cypress tests

**Cause:** Frontend and backend not on allowed CORS origins

**Solution:** Verify `backend/app/main.py` CORS settings include:
```python
CORS_ORIGINS = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    ...
]
```

### Issue: "401 Unauthorized" in test

**Cause:** Token not being sent with request

**Solution:** Check `Authorization` header format:
```
Authorization: Bearer {token}  ✓ Correct
Authorization: {token}         ✗ Wrong
Bearer {token}                 ✗ Wrong
```

### Issue: Tests pass individually but fail together

**Cause:** Database state conflicts or missing cleanup

**Solution:** 
- Tests create unique emails with timestamp
- Database should be reset between test runs
- Or clear test data: `rm app.db` or use in-memory DB for tests

### Issue: Cypress "element not found"

**Cause:** Frontend elements use different selectors than test expects

**Solution:** 
1. Add `data-cy` attributes to HTML elements:
   ```html
   <button data-cy="logout-button">Logout</button>
   ```
2. Update cypress test to match:
   ```javascript
   cy.get('[data-cy=logout-button]').click()
   ```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9
      
      - name: Install backend dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest httpx
      
      - name: Start backend
        run: |
          cd backend
          python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 &
          sleep 2
      
      - name: Run PyTest integration tests
        run: |
          cd backend
          python -m pytest test_integration.py -v
      
      - name: Set up Node
        uses: actions/setup-node@v2
        with:
          node-version: 16
      
      - name: Install Cypress
        run: npm install cypress
      
      - name: Run Cypress tests
        run: npx cypress run --headless
```

---

## Best Practices

### 1. Test Organization

✅ Group related tests using `describe` blocks
✅ Use clear, descriptive test names
✅ One assertion per test (when possible)
✅ Create fixtures for common setup

### 2. Test Data

✅ Use unique test emails with timestamps
✅ Clean up after tests complete
✅ Don't rely on test order
✅ Use fresh data for each test

### 3. Assertions

✅ Check status codes
✅ Verify response structure
✅ Check field values
✅ Validate error messages

### 4. Error Handling

✅ Test both success and failure paths
✅ Verify error messages are helpful
✅ Check HTTP status codes
✅ Test boundary conditions

### 5. Performance

✅ Set reasonable timeouts
✅ Don't test UI speed
✅ Focus on functionality
✅ Use appropriate assertion timing

---

## Test Execution Flow

### Complete Test Cycle

```
1. Start Backend
   └─> http://127.0.0.1:8001

2. Run PyTest Tests
   ├─> Authentication (6 tests)
   ├─> Create Client (2 tests)
   ├─> Update Client (3 tests)
   ├─> Log Data (8 tests)
   ├─> Error Handling (9 tests)
   └─> Complete Workflow (1 test)
       = 29 tests total

3. Start Frontend (if not running)
   └─> http://127.0.0.1:5500

4. Run Cypress Tests
   ├─> Login Flow (6 tests)
   ├─> Profile Management (3 tests)
   ├─> Log Metrics (5 tests)
   ├─> Logout (2 tests)
   ├─> Error Handling (4 tests)
   └─> Complete Journey (1 test)
       = 21 tests total

TOTAL: 50 integration tests covering:
  ✅ Authentication
  ✅ User registration
  ✅ Profile management
  ✅ Data logging (4 types)
  ✅ Error handling
  ✅ Complete user workflows
  ✅ UI interactions
  ✅ Browser persistence
```

---

## Expected Results

### Successful Test Run

```
PyTest Summary:
  29 passed in 45.23s
  
Cypress Summary:
  21 passing (8s)

Total Coverage:
  ✅ All authentication flows working
  ✅ All CRUD operations functional
  ✅ All error cases handled
  ✅ Complete workflows verified
  ✅ Frontend-backend integration confirmed
  ✅ Ready for production deployment
```

---

## Next Steps

After successful testing:

1. **Code Review** - Review test results and coverage
2. **Performance Testing** - Run load tests under expected user load
3. **Security Testing** - Run OWASP top 10 security tests
4. **Production Deployment** - Deploy with confidence
5. **Monitoring** - Set up error tracking and monitoring

---

## Support & Resources

- **PyTest Docs:** https://docs.pytest.org/
- **Cypress Docs:** https://docs.cypress.io/
- **FastAPI Testing:** https://fastapi.tiangolo.com/advanced/testing-dependencies/
- **API Comparison Report:** See `API_COMPARISON_REPORT.md`
- **Integration Summary:** See `INTEGRATION_SUMMARY.md`

---

## Test Checklist

Before deploying to production:

- [ ] PyTest integration tests all passing
- [ ] Cypress E2E tests all passing
- [ ] No console errors in browser
- [ ] All HTTP status codes correct
- [ ] Error messages user-friendly
- [ ] Authentication token persists
- [ ] Logout clears all data
- [ ] Invalid input rejected properly
- [ ] Large dataset pagination works
- [ ] Network errors handled gracefully
- [ ] CORS working correctly
- [ ] Database queries optimized
- [ ] Performance acceptable
- [ ] Code coverage > 80%
- [ ] Security requirements met

