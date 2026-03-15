/**
 * Token Refresh Manager
 * 
 * Handles automatic refresh of JWT access tokens using refresh tokens.
 * Integrates with existing authentication system.
 * 
 * Features:
 * - Stores access_token and refresh_token separately in localStorage
 * - Automatically refreshes access token 1 minute before expiration
 * - Handles token rotation and updates
 * - Logs user out if refresh fails
 */

const TokenRefreshManager = {
    // Storage keys
    ACCESS_TOKEN_KEY: 'access_token',
    REFRESH_TOKEN_KEY: 'refresh_token',
    TOKEN_EXPIRY_KEY: 'token_expiry',
    
    // Refresh token 1 minute before expiration
    REFRESH_BUFFER_SECONDS: 60,
    
    // Timer for automatic refresh
    refreshTimer: null,
    
    /**
     * Initialize the token manager after login/registration
     * @param {Object} tokenData - Response from login/register containing access_token, refresh_token
     */
    init(tokenData) {
        console.log('[TokenRefreshManager] Initializing with new tokens');
        
        if (!tokenData.access_token || !tokenData.refresh_token) {
            console.error('[TokenRefreshManager] Missing required tokens');
            return false;
        }
        
        // Store tokens
        this.setAccessToken(tokenData.access_token);
        this.setRefreshToken(tokenData.refresh_token);
        
        // Calculate and store expiry time
        const expiryTime = this.calculateExpiryTime(tokenData.access_token);
        this.setTokenExpiry(expiryTime);
        
        // Schedule automatic refresh
        this.scheduleRefresh();
        
        console.log('[TokenRefreshManager] Initialized successfully');
        return true;
    },
    
    /**
     * Calculate token expiry time from JWT
     * @param {string} token - JWT access token
     * @returns {number} - Unix timestamp in milliseconds
     */
    calculateExpiryTime(token) {
        try {
            const payload = this.decodeJWT(token);
            if (payload && payload.exp) {
                return payload.exp * 1000; // Convert to milliseconds
            }
        } catch (error) {
            console.error('[TokenRefreshManager] Error decoding token:', error);
        }
        
        // Default: assume 15 minute expiry from now
        return Date.now() + (15 * 60 * 1000);
    },
    
    /**
     * Decode JWT payload (no verification, just parsing)
     * @param {string} token - JWT token
     * @returns {Object} - Decoded payload
     */
    decodeJWT(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid JWT format');
            }
            
            const payload = parts[1];
            const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            return JSON.parse(decoded);
        } catch (error) {
            console.error('[TokenRefreshManager] JWT decode error:', error);
            return null;
        }
    },
    
    /**
     * Schedule automatic token refresh before expiration
     */
    scheduleRefresh() {
        // Clear existing timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        
        const expiryTime = this.getTokenExpiry();
        if (!expiryTime) {
            console.warn('[TokenRefreshManager] No expiry time set, cannot schedule refresh');
            return;
        }
        
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;
        const refreshTime = Math.max(0, timeUntilExpiry - (this.REFRESH_BUFFER_SECONDS * 1000));
        
        console.log(`[TokenRefreshManager] Scheduling refresh in ${Math.round(refreshTime / 1000)}s`);
        
        this.refreshTimer = setTimeout(() => {
            this.refreshAccessToken();
        }, refreshTime);
    },
    
    /**
     * Refresh the access token using the refresh token
     * @returns {Promise<boolean>} - Success status
     */
    async refreshAccessToken() {
        console.log('[TokenRefreshManager] Attempting to refresh access token');
        
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            console.error('[TokenRefreshManager] No refresh token available');
            this.handleRefreshFailure();
            return false;
        }
        
        try {
            const response = await fetch(`${window.API_BASE_URL || 'http://127.0.0.1:8001'}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh_token: refreshToken })
            });
            
            if (!response.ok) {
                throw new Error(`Refresh failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.access_token) {
                throw new Error('No access token in refresh response');
            }
            
            // Update access token
            this.setAccessToken(data.access_token);
            
            // Update expiry time
            const newExpiry = this.calculateExpiryTime(data.access_token);
            this.setTokenExpiry(newExpiry);
            
            // Schedule next refresh
            this.scheduleRefresh();
            
            console.log('[TokenRefreshManager] Access token refreshed successfully');
            return true;
            
        } catch (error) {
            console.error('[TokenRefreshManager] Token refresh failed:', error);
            this.handleRefreshFailure();
            return false;
        }
    },
    
    /**
     * Handle refresh failure by logging out user
     */
    handleRefreshFailure() {
        console.warn('[TokenRefreshManager] Refresh failed, logging out user');
        
        // Clear all tokens
        this.clearTokens();
        
        // Redirect to login page
        if (window.location.pathname !== '/client-login.html') {
            window.location.href = 'client-login.html?session_expired=true';
        }
    },
    
    /**
     * Check if a token refresh is needed now
     * @returns {boolean}
     */
    needsRefresh() {
        const expiryTime = this.getTokenExpiry();
        if (!expiryTime) return true;
        
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;
        
        return timeUntilExpiry < (this.REFRESH_BUFFER_SECONDS * 1000);
    },
    
    /**
     * Get current valid access token (refreshes if needed)
     * @returns {Promise<string|null>}
     */
    async getValidAccessToken() {
        const token = this.getAccessToken();
        if (!token) return null;
        
        if (this.needsRefresh()) {
            const refreshed = await this.refreshAccessToken();
            if (!refreshed) return null;
            return this.getAccessToken();
        }
        
        return token;
    },
    
    // === Storage Methods ===
    
    setAccessToken(token) {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    },
    
    getAccessToken() {
        return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    },
    
    setRefreshToken(token) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    },
    
    getRefreshToken() {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    },
    
    setTokenExpiry(timestamp) {
        localStorage.setItem(this.TOKEN_EXPIRY_KEY, timestamp.toString());
    },
    
    getTokenExpiry() {
        const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
        return expiry ? parseInt(expiry, 10) : null;
    },
    
    clearTokens() {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
        
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    },
    
    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!this.getAccessToken() && !!this.getRefreshToken();
    }
};

// Initialize token manager on page load if tokens exist
document.addEventListener('DOMContentLoaded', () => {
    if (TokenRefreshManager.isAuthenticated()) {
        console.log('[TokenRefreshManager] Found existing tokens, initializing automatic refresh');
        
        // Reconstruct token data from storage
        const tokenData = {
            access_token: TokenRefreshManager.getAccessToken(),
            refresh_token: TokenRefreshManager.getRefreshToken()
        };
        
        TokenRefreshManager.init(tokenData);
    }
});

// Expose to global scope for easy integration
window.TokenRefreshManager = TokenRefreshManager;

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. Include this script in HTML pages:
 *    <script src="assets/js/token-refresh.js"></script>
 * 
 * 2. After successful login/registration:
 *    ```javascript
 *    const response = await fetch('/api/auth/login', {...});
 *    const data = await response.json();
 *    
 *    // Initialize token manager with both tokens
 *    TokenRefreshManager.init(data);
 *    
 *    // Old code still works (backward compatible)
 *    localStorage.setItem('access_token', data.access_token);
 *    ```
 * 
 * 3. For API calls, use getValidAccessToken():
 *    ```javascript
 *    const token = await TokenRefreshManager.getValidAccessToken();
 *    const headers = { 'Authorization': `Bearer ${token}` };
 *    ```
 * 
 * 4. On logout:
 *    ```javascript
 *    TokenRefreshManager.clearTokens();
 *    window.location.href = 'client-login.html';
 *    ```
 */
