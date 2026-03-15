"""
Cypress E2E Integration Tests Configuration
Run with: npm run cypress:open or npm run cypress:run
"""

// Tests for frontend-backend integration
// This configuration file needs cypress.json or cypress.config.js in root


describe('Frontend-Backend Integration Tests', () => {
  const API_BASE = 'http://127.0.0.1:8001'
  const FRONTEND_BASE = 'http://127.0.0.1:5500'
  const TEST_EMAIL = `test_${Math.random().toString(36).substr(2, 9)}@integration.test`
  const TEST_PASSWORD = 'Test123!@#'
  const TEST_FULLNAME = 'E2E Test User'

  // Hook to visit frontend before tests
  beforeEach(() => {
    // Clear localStorage to start fresh
    cy.window().then(win => {
      win.localStorage.clear()
    })
  })

  // ========================================================================
  // TEST 1: LOGIN FLOW
  // ========================================================================

  describe('Login Flow', () => {
    it('should load login page', () => {
      cy.visit(`${FRONTEND_BASE}/client-login.html`)
      cy.get('form').should('be.visible')
      cy.contains('Login').should('be.visible')
    })

    it('should register new user successfully', () => {
      cy.visit(`${FRONTEND_BASE}/client-signup.html`)
      
      // Fill signup form
      cy.get('input[type="email"]').type(TEST_EMAIL)
      cy.get('input[name="password"]').first().type(TEST_PASSWORD)
      cy.get('input[name="password"]').last().type(TEST_PASSWORD)
      cy.get('input[name="full_name"]').type(TEST_FULLNAME)
      
      // Submit form
      cy.get('button[type="submit"]').click()
      
      // Should redirect to dashboard after successful registration
      cy.url().should('include', 'client-dashboard.html')
      cy.get('[data-cy=user-fullname]').should('contain', TEST_FULLNAME)
    })

    it('should login with valid credentials', () => {
      // Register user first via API
      cy.request('POST', `${API_BASE}/api/auth/register`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        full_name: TEST_FULLNAME
      }).then(response => {
        expect(response.status).to.equal(200)
        expect(response.body).to.have.property('access_token')
      })

      // Now test login via frontend
      cy.visit(`${FRONTEND_BASE}/client-login.html`)
      
      cy.get('input[type="email"]').type(TEST_EMAIL)
      cy.get('input[type="password"]').type(TEST_PASSWORD)
      cy.get('button[type="submit"]').click()
      
      // Should redirect to dashboard
      cy.url().should('include', 'client-dashboard.html')
      cy.get('h1').should('contain', 'Dashboard')
    })

    it('should show error for invalid credentials', () => {
      cy.visit(`${FRONTEND_BASE}/client-login.html`)
      
      cy.get('input[type="email"]').type('nonexistent@test.com')
      cy.get('input[type="password"]').type('WrongPassword123!')
      cy.get('button[type="submit"]').click()
      
      // Should show error message
      cy.get('[data-cy=error-message]', { timeout: 5000 }).should('be.visible')
      cy.get('[data-cy=error-message]').should('contain', 'Invalid credentials')
      
      // Should stay on login page
      cy.url().should('include', 'client-login.html')
    })

    it('should show error for empty fields', () => {
      cy.visit(`${FRONTEND_BASE}/client-login.html`)
      
      // Try to submit without filling fields
      cy.get('button[type="submit"]').click()
      
      // Should show validation error
      cy.get('[data-cy=error-message]').should('be.visible')
    })

    it('should persist token after page refresh', () => {
      // Register and login
      cy.request('POST', `${API_BASE}/api/auth/register`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        full_name: TEST_FULLNAME
      })

      cy.visit(`${FRONTEND_BASE}/client-login.html`)
      cy.get('input[type="email"]').type(TEST_EMAIL)
      cy.get('input[type="password"]').type(TEST_PASSWORD)
      cy.get('button[type="submit"]').click()

      cy.url().should('include', 'client-dashboard.html')
      
      // Check token in localStorage
      cy.window().then(win => {
        expect(win.localStorage.getItem('authToken')).to.exist
      })
      
      // Refresh page
      cy.reload()
      
      // Should still be logged in
      cy.url().should('include', 'client-dashboard.html')
      cy.window().then(win => {
        expect(win.localStorage.getItem('authToken')).to.exist
      })
    })
  })

  // ========================================================================
  // TEST 2: CLIENT PROFILE MANAGEMENT
  // ========================================================================

  describe('Client Profile Management', () => {
    beforeEach(() => {
      // Register and login before each test
      cy.request('POST', `${API_BASE}/api/auth/register`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        full_name: TEST_FULLNAME
      }).then(response => {
        const token = response.body.access_token
        cy.window().then(win => {
          win.localStorage.setItem('authToken', token)
          win.localStorage.setItem('authTokenType', 'bearer')
          win.localStorage.setItem('clientFullName', TEST_FULLNAME)
        })
      })
    })

    it('should display client profile', () => {
      cy.visit(`${FRONTEND_BASE}/client-dashboard.html`)
      
      cy.get('[data-cy=profile-section]').should('be.visible')
      cy.get('[data-cy=user-fullname]').should('contain', TEST_FULLNAME)
      cy.get('[data-cy=profile-email]').should('contain', TEST_EMAIL)
    })

    it('should update profile with new data', () => {
      cy.visit(`${FRONTEND_BASE}/settings.html`)
      
      // Fill profile update form
      cy.get('input[name="phone"]').clear().type('9876543210')
      cy.get('input[name="sport"]').clear().type('Basketball')
      cy.get('select[name="activity_level"]').select('high')
      cy.get('input[name="club"]').clear().type('Elite Sports Club')
      
      // Submit form
      cy.get('button[type="submit"]').contains('Update Profile').click()
      
      // Should show success message
      cy.get('[data-cy=success-message]').should('be.visible')
      cy.get('[data-cy=success-message]').should('contain', 'updated')
    })

    it('should validate profile fields', () => {
      cy.visit(`${FRONTEND_BASE}/settings.html`)
      
      // Try invalid email
      cy.get('input[name="email"]').clear().type('invalid-email')
      cy.get('button[type="submit"]').click()
      
      // Should show validation error
      cy.get('[data-cy=error-message]').should('be.visible')
    })
  })

  // ========================================================================
  // TEST 3: LOG HEALTH METRICS
  // ========================================================================

  describe('Log Health Metrics', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.request('POST', `${API_BASE}/api/auth/register`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        full_name: TEST_FULLNAME
      }).then(response => {
        const token = response.body.access_token
        cy.window().then(win => {
          win.localStorage.setItem('authToken', token)
          win.localStorage.setItem('authTokenType', 'bearer')
          win.localStorage.setItem('clientFullName', TEST_FULLNAME)
        })
      })
    })

    it('should log weight data', () => {
      cy.visit(`${FRONTEND_BASE}/progress-tracking.html`)
      
      // Find and click weight logging section
      cy.contains('Log Weight').click()
      
      cy.get('input[name="weight"]').type('75.5')
      cy.get('input[name="body_fat"]').type('19.5')
      cy.get('textarea[name="notes"]').type('Morning measurement')
      
      cy.get('button[type="submit"]').contains('Log Weight').click()
      
      // Should show success, then display in list
      cy.get('[data-cy=success-message]').should('be.visible')
      cy.get('[data-cy=weight-list]').should('contain', '75.5')
    })

    it('should log workout data', () => {
      cy.visit(`${FRONTEND_BASE}/progress-tracking.html`)
      
      cy.contains('Log Workout').click()
      
      cy.get('input[name="workout_name"]').type('Morning Run')
      cy.get('select[name="workout_type"]').select('Cardio')
      cy.get('input[name="duration"]').type('45')
      cy.get('select[name="intensity"]').select('High')
      cy.get('input[name="calories"]').type('450')
      
      cy.get('button[type="submit"]').contains('Log Workout').click()
      
      cy.get('[data-cy=success-message]').should('be.visible')
      cy.get('[data-cy=workout-list]').should('contain', 'Morning Run')
    })

    it('should log mood data', () => {
      cy.visit(`${FRONTEND_BASE}/progress-tracking.html`)
      
      cy.contains('Log Mood').click()
      
      cy.get('input[name="mood_level"]').type('8')
      cy.get('input[name="energy_level"]').type('7')
      cy.get('input[name="stress_level"]').type('3')
      cy.get('input[name="sleep_hours"]').type('8')
      cy.get('select[name="sleep_quality"]').select('Good')
      
      cy.get('button[type="submit"]').contains('Log Mood').click()
      
      cy.get('[data-cy=success-message]').should('be.visible')
      cy.get('[data-cy=mood-list]').should('be.visible')
    })

    it('should log supplements', () => {
      cy.visit(`${FRONTEND_BASE}/supplements.html`)
      
      cy.get('button[data-cy=add-supplement]').click()
      
      cy.get('input[name="supplement_name"]').type('Vitamin D3')
      cy.get('input[name="dosage"]').type('2000 IU')
      cy.get('input[name="time_taken"]').type('Morning')
      cy.get('textarea[name="notes"]').type('With breakfast')
      
      cy.get('button[type="submit"]').contains('Add').click()
      
      cy.get('[data-cy=success-message]').should('be.visible')
      cy.get('[data-cy=supplement-list]').should('contain', 'Vitamin D3')
    })

    it('should show progress charts', () => {
      cy.visit(`${FRONTEND_BASE}/progress-tracking.html`)
      
      // Log some data first
      cy.request({
        method: 'POST',
        url: `${API_BASE}/api/client/weight`,
        headers: {
          'Authorization': `Bearer ${cy.window().then(w => w.localStorage.getItem('authToken'))}`
        },
        body: {
          weight: 75.0,
          body_fat_percentage: 19.0,
          client_id: 'test'
        }
      })
      
      // Verify chart container exists
      cy.get('[data-cy=progress-chart]').should('exist')
      cy.get('[data-cy=chart-canvas]').should('exist')
    })
  })

  // ========================================================================
  // TEST 4: LOGOUT FUNCTIONALITY
  // ========================================================================

  describe('Logout', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.request('POST', `${API_BASE}/api/auth/register`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        full_name: TEST_FULLNAME
      }).then(response => {
        const token = response.body.access_token
        cy.window().then(win => {
          win.localStorage.setItem('authToken', token)
          win.localStorage.setItem('authTokenType', 'bearer')
          win.localStorage.setItem('clientFullName', TEST_FULLNAME)
        })
      })
    })

    it('should logout and clear auth data', () => {
      cy.visit(`${FRONTEND_BASE}/client-dashboard.html`)
      
      // Verify logged in
      cy.window().then(win => {
        expect(win.localStorage.getItem('authToken')).to.exist
      })
      
      // Click logout
      cy.get('[data-cy=logout-button]').click()
      
      // Should redirect to login
      cy.url().should('include', 'client-login.html')
      
      // Auth data should be cleared
      cy.window().then(win => {
        expect(win.localStorage.getItem('authToken')).to.be.null
        expect(win.localStorage.getItem('clientFullName')).to.be.null
        expect(win.localStorage.getItem('currentClientId')).to.be.null
      })
    })

    it('should prevent access to protected pages after logout', () => {
      cy.visit(`${FRONTEND_BASE}/client-dashboard.html`)
      
      cy.get('[data-cy=logout-button]').click()
      cy.url().should('include', 'client-login.html')
      
      // Try to access dashboard directly
      cy.visit(`${FRONTEND_BASE}/client-dashboard.html`)
      
      // Should redirect to login because no auth token
      cy.url().should('include', 'client-login.html')
    })
  })

  // ========================================================================
  // TEST 5: ERROR HANDLING
  // ========================================================================

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Intercept API and return error
      cy.intercept('POST', `${API_BASE}/api/auth/login`, {
        statusCode: 500,
        body: { detail: 'Server error' }
      })

      cy.visit(`${FRONTEND_BASE}/client-login.html`)
      cy.get('input[type="email"]').type('test@test.com')
      cy.get('input[type="password"]').type('password')
      cy.get('button[type="submit"]').click()

      cy.get('[data-cy=error-message]').should('be.visible')
      cy.get('[data-cy=error-message]').should('contain', 'error')
    })

    it('should handle 401 unauthorized responses', () => {
      // Set invalid token
      cy.window().then(win => {
        win.localStorage.setItem('authToken', 'invalid.token.here')
      })

      cy.visit(`${FRONTEND_BASE}/client-dashboard.html`)

      // Should redirect to login on 401
      cy.url({ timeout: 5000 }).should('include', 'client-login.html')
    })

    it('should show validation errors for bad input', () => {
      cy.visit(`${FRONTEND_BASE}/client-signup.html`)

      // Try registering with weak password
      cy.get('input[type="email"]').type('test@test.com')
      cy.get('input[name="password"]').first().type('weak')
      cy.get('input[name="password"]').last().type('weak')
      cy.get('input[name="full_name"]').type('Test')

      cy.get('button[type="submit"]').click()

      cy.get('[data-cy=error-message]').should('contain', 'password')
    })

    it('should handle API timeout errors', () => {
      // Delay the response
      cy.intercept('GET', `${API_BASE}/api/client/profile`, req => {
        req.destroy()
      })

      cy.window().then(win => {
        win.localStorage.setItem('authToken', 'valid.token.here')
      })

      cy.visit(`${FRONTEND_BASE}/client-dashboard.html`)

      cy.get('[data-cy=error-message]', { timeout: 20000 }).should('be.visible')
    })
  })

  // ========================================================================
  // TEST 6: COMPLETE USER JOURNEY
  // ========================================================================

  describe('Complete User Journey', () => {
    it('should complete signup -> profile -> log data -> logout', () => {
      // Step 1: Signup
      cy.visit(`${FRONTEND_BASE}/client-signup.html`)
      cy.get('input[type="email"]').type(TEST_EMAIL)
      cy.get('input[name="password"]').first().type(TEST_PASSWORD)
      cy.get('input[name="password"]').last().type(TEST_PASSWORD)
      cy.get('input[name="full_name"]').type(TEST_FULLNAME)
      cy.get('button[type="submit"]').click()
      cy.url().should('include', 'client-dashboard.html')
      cy.get('h1').should('contain', 'Dashboard')

      // Step 2: Update profile
      cy.visit(`${FRONTEND_BASE}/settings.html`)
      cy.get('input[name="sport"]').clear().type('Tennis')
      cy.get('select[name="activity_level"]').select('medium')
      cy.get('button[type="submit"]').contains('Update Profile').click()
      cy.get('[data-cy=success-message]').should('be.visible')

      // Step 3: Log metrics
      cy.visit(`${FRONTEND_BASE}/progress-tracking.html`)
      cy.contains('Log Weight').click()
      cy.get('input[name="weight"]').type('75')
      cy.get('input[name="body_fat"]').type('20')
      cy.get('button[type="submit"]').click()
      cy.get('[data-cy=success-message]').should('be.visible')

      // Step 4: View supplements
      cy.visit(`${FRONTEND_BASE}/supplements.html`)
      cy.get('[data-cy=supplement-list]').should('exist')

      // Step 5: Logout
      cy.visit(`${FRONTEND_BASE}/client-dashboard.html`)
      cy.get('[data-cy=logout-button]').click()
      cy.url().should('include', 'client-login.html')
      cy.window().then(win => {
        expect(win.localStorage.getItem('authToken')).to.be.null
      })
    })
  })
})
