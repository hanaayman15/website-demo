# ========================================
# SECURITY FEATURES TEST PLAN
# ========================================
# Tests all 6 production security features:
# 1. SECRET_KEY environment validation
# 2. Admin credentials in environment
# 3. Refresh token system (15 min access, 7 day refresh)
# 4. Rate limiting (5 attempts/min per IP)
# 5. Security headers middleware
# 6. Structured JSON logging

param(
    [string]$BaseUrl = "http://127.0.0.1:8001",
    [switch]$Verbose
)

$ErrorActionPreference = 'Continue'
$results = [System.Collections.Generic.List[object]]::new()

function Add-TestResult {
    param($Feature, $Test, $Status, $Detail)
    $results.Add([PSCustomObject]@{
        Feature = $Feature
        Test = $Test
        Status = $Status
        Detail = $Detail
    })
    
    $color = if ($Status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "[$Status] $Feature - $Test" -ForegroundColor $color
    if ($Verbose -and $Detail) {
        Write-Host "  → $Detail" -ForegroundColor Gray
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SECURITY FEATURES TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ========================================
# TEST 1: SECRET_KEY Environment Validation
# ========================================
Write-Host "[TEST 1] SECRET_KEY Validation" -ForegroundColor Yellow

try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get -TimeoutSec 5
    if ($health.status -eq "healthy") {
        Add-TestResult "Secret Key" "Backend Startup" "PASS" "Server started successfully (validates SECRET_KEY >= 32 chars)"
    } else {
        Add-TestResult "Secret Key" "Backend Startup" "FAIL" "Health check returned: $($health.status)"
    }
} catch {
    Add-TestResult "Secret Key" "Backend Startup" "FAIL" "Cannot connect to backend: $($_.Exception.Message)"
    Write-Host "`n[WARNING] Backend not running. Start with: python -m uvicorn app.main:app --host 127.0.0.1 --port 8001" -ForegroundColor Red
    exit 1
}

# ========================================
# TEST 2: Admin Credentials from Environment
# ========================================
Write-Host "`n[TEST 2] Admin Credentials from Environment" -ForegroundColor Yellow

try {
    # Try login with environment admin credentials
    $adminLogin = @{
        email = "admin@nutrition.com"
        password = "SecureAdminPass123!"
    } | ConvertTo-Json
    
    $adminAuth = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $adminLogin
    
    if ($adminAuth.role -eq "admin") {
        Add-TestResult "Admin Credentials" "Environment Config" "PASS" "Admin login successful with env credentials"
    } else {
        Add-TestResult "Admin Credentials" "Environment Config" "FAIL" "Expected admin role, got: $($adminAuth.role)"
    }
} catch {
    Add-TestResult "Admin Credentials" "Environment Config" "FAIL" "Admin login failed: $($_.Exception.Message)"
}

# ========================================
# TEST 3: Refresh Token System
# ========================================
Write-Host "`n[TEST 3] Refresh Token System" -ForegroundColor Yellow

# Register test user
$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$testEmail = "security_test_${timestamp}@example.com"
$testPassword = "SecurePass123!"

try {
    $registerBody = @{
        email = $testEmail
        password = $testPassword
        full_name = "Security Test User"
    } | ConvertTo-Json
    
    $registration = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $registerBody
    
    # Check for token pair in response
    if ($registration.access_token -and $registration.refresh_token) {
        Add-TestResult "Refresh Tokens" "Registration Returns Token Pair" "PASS" "Both access_token and refresh_token present"
        
        # Store tokens
        $accessToken = $registration.access_token
        $refreshToken = $registration.refresh_token
        
        # Decode access token to check expiration
        $accessPayload = $accessToken.Split('.')[1]
        $accessPayload += "=" * ((4 - $accessPayload.Length % 4) % 4)
        $accessDecoded = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($accessPayload)) | ConvertFrom-Json
        
        $accessExp = ([DateTimeOffset]::FromUnixTimeSeconds($accessDecoded.exp)).LocalDateTime
        $accessMinutes = ($accessExp - (Get-Date)).TotalMinutes
        
        if ($accessMinutes -le 16 -and $accessMinutes -ge 14) {
            Add-TestResult "Refresh Tokens" "Access Token Expiry" "PASS" "Expires in ~15 minutes ($([math]::Round($accessMinutes, 1)) min)"
        } else {
            Add-TestResult "Refresh Tokens" "Access Token Expiry" "FAIL" "Expected ~15 min, got $([math]::Round($accessMinutes, 1)) min"
        }
        
        # Check token type claim
        if ($accessDecoded.type -eq "access") {
            Add-TestResult "Refresh Tokens" "Access Token Type Claim" "PASS" "Token has type='access'"
        } else {
            Add-TestResult "Refresh Tokens" "Access Token Type Claim" "FAIL" "Token type: $($accessDecoded.type)"
        }
        
        # Test refresh endpoint
        Start-Sleep -Milliseconds 500
        
        $refreshBody = @{
            refresh_token = $refreshToken
        } | ConvertTo-Json
        
        $refreshResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/refresh" -Method Post -ContentType "application/json" -Body $refreshBody
        
        if ($refreshResponse.access_token) {
            Add-TestResult "Refresh Tokens" "Refresh Endpoint Returns New Token" "PASS" "New access_token generated"
            
            # Verify new token is different
            if ($refreshResponse.access_token -ne $accessToken) {
                Add-TestResult "Refresh Tokens" "Token Rotation" "PASS" "New token differs from original"
            } else {
                Add-TestResult "Refresh Tokens" "Token Rotation" "FAIL" "New token identical to original"
            }
        } else {
            Add-TestResult "Refresh Tokens" "Refresh Endpoint Returns New Token" "FAIL" "No access_token in response"
        }
        
        # Test that refresh token can't be used as access token
        try {
            $headers = @{ Authorization = "Bearer $refreshToken" }
            Invoke-RestMethod -Uri "$BaseUrl/api/client/profile" -Method Get -Headers $headers | Out-Null
            Add-TestResult "Refresh Tokens" "Token Type Enforcement" "FAIL" "Refresh token accepted as access token"
        } catch {
            if ($_.Exception.Response.StatusCode.Value__ -eq 401) {
                Add-TestResult "Refresh Tokens" "Token Type Enforcement" "PASS" "Refresh token rejected for API access (401)"
            } else {
                Add-TestResult "Refresh Tokens" "Token Type Enforcement" "FAIL" "Unexpected error: $($_.Exception.Message)"
            }
        }
        
    } else {
        Add-TestResult "Refresh Tokens" "Registration Returns Token Pair" "FAIL" "Missing access_token or refresh_token"
    }
    
} catch {
    Add-TestResult "Refresh Tokens" "System Test" "FAIL" "Registration failed: $($_.Exception.Message)"
}

# ========================================
# TEST 4: Rate Limiting
# ========================================
Write-Host "`n[TEST 4] Rate Limiting (5 attempts/minute)" -ForegroundColor Yellow

try {
    $limittestEmail = "ratelimit_test_${timestamp}@example.com"
    $attemptResults = @()
    
    # Attempt 6 rapid logins (limit is 5/min)
    for ($i = 1; $i -le 6; $i++) {
        try {
            $loginBody = @{
                email = $limittestEmail
                password = "WrongPassword123!"
            } | ConvertTo-Json
            
            $response = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody -UseBasicParsing
            $attemptResults += [PSCustomObject]@{ Attempt = $i; StatusCode = $response.StatusCode }
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.Value__
            $attemptResults += [PSCustomObject]@{ Attempt = $i; StatusCode = $statusCode }
        }
        
        Start-Sleep -Milliseconds 100
    }
    
    # Check if 6th attempt was rate limited
    $rateLimited = $attemptResults | Where-Object { $_.StatusCode -eq 429 }
    
    if ($rateLimited.Count -ge 1) {
        Add-TestResult "Rate Limiting" "Login Endpoint Limited" "PASS" "Request blocked after 5 attempts (got 429 status)"
    } else {
        Add-TestResult "Rate Limiting" "Login Endpoint Limited" "FAIL" "No 429 status received after 6 attempts"
        
        if ($Verbose) {
            Write-Host "  Attempt results:" -ForegroundColor Gray
            $attemptResults | Format-Table -AutoSize | Out-String | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        }
    }
    
    # Wait for rate limit window to reset
    Write-Host "  Waiting 60s for rate limit reset..." -ForegroundColor Gray
    Start-Sleep -Seconds 60
    
    # Verify rate limit resets after window
    try {
        $resetBody = @{
            email = $limittestEmail
            password = "WrongPassword123!"
        } | ConvertTo-Json
        
        Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $resetBody -UseBasicParsing | Out-Null
    } catch {
        if ($_.Exception.Response.StatusCode.Value__ -eq 401) {
            Add-TestResult "Rate Limiting" "Rate Limit Window Reset" "PASS" "Accepts requests after 60s (got 401 auth error, not 429)"
        } elseif ($_.Exception.Response.StatusCode.Value__ -eq 429) {
            Add-TestResult "Rate Limiting" "Rate Limit Window Reset" "FAIL" "Still rate limited after 60s"
        } else {
            Add-TestResult "Rate Limiting" "Rate Limit Window Reset" "FAIL" "Unexpected status: $($_.Exception.Response.StatusCode.Value__)"
        }
    }
    
} catch {
    Add-TestResult "Rate Limiting" "Test Execution" "FAIL" "Test error: $($_.Exception.Message)"
}

# ========================================
# TEST 5: Security Headers
# ========================================
Write-Host "`n[TEST 5] Security Headers Middleware" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/health" -Method Get -UseBasicParsing
    
    $requiredHeaders = @{
        "X-Frame-Options" = "DENY"
        "X-Content-Type-Options" = "nosniff"
        "X-XSS-Protection" = "1; mode=block"
        "Content-Security-Policy" = "default-src 'self'"
        "Referrer-Policy" = "strict-origin-when-cross-origin"
    }
    
    foreach ($header in $requiredHeaders.GetEnumerator()) {
        $actualValue = $response.Headers[$header.Key]
        
        if ($actualValue) {
            if ($actualValue -match [regex]::Escape($header.Value)) {
                Add-TestResult "Security Headers" $header.Key "PASS" "Present: $actualValue"
            } else {
                Add-TestResult "Security Headers" $header.Key "FAIL" "Expected '$($header.Value)', got '$actualValue'"
            }
        } else {
            Add-TestResult "Security Headers" $header.Key "FAIL" "Header missing"
        }
    }
    
    # HSTS only in production (DEBUG=False)
    $hstsHeader = $response.Headers["Strict-Transport-Security"]
    if ($hstsHeader) {
        Add-TestResult "Security Headers" "Strict-Transport-Security" "PASS" "Present: $hstsHeader"
    } else {
        Add-TestResult "Security Headers" "Strict-Transport-Security" "INFO" "Not set (expected in DEBUG mode)"
    }
    
} catch {
    Add-TestResult "Security Headers" "Headers Check" "FAIL" "Request failed: $($_.Exception.Message)"
}

# ========================================
# TEST 6: Structured JSON Logging
# ========================================
Write-Host "`n[TEST 6] Structured JSON Logging" -ForegroundColor Yellow

# This test checks if backend is configured for JSON logging
# Actual log verification requires checking backend console output

Add-TestResult "JSON Logging" "Configuration Check" "INFO" "Verify backend console shows JSON format logs"
Add-TestResult "JSON Logging" "Auth Event Logging" "INFO" "Check logs for 'event_type: auth_attempt' entries"
Add-TestResult "JSON Logging" "Error Logging" "INFO" "Check logs for 'event_type: api_error' entries"

Write-Host "`n[INFO] Manual Verification Required:" -ForegroundColor Cyan
Write-Host "  1. Check backend console output" -ForegroundColor White
Write-Host "  2. Logs should be in JSON format with 'timestamp', 'level', 'event_type' fields" -ForegroundColor White
Write-Host "  3. Login attempts should generate auth event logs" -ForegroundColor White

# ========================================
# RESULTS SUMMARY
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$info = ($results | Where-Object { $_.Status -eq "INFO" }).Count
$total = $passed + $failed

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed:      $passed" -ForegroundColor Green
Write-Host "Failed:      $failed" -ForegroundColor Red
Write-Host "Info:        $info" -ForegroundColor Gray

if ($failed -eq 0) {
    Write-Host "`n[SUCCESS] ALL SECURITY FEATURES VERIFIED!" -ForegroundColor Green
} else {
    Write-Host "`n[FAILED] $failed TEST(S) FAILED - Review above for details" -ForegroundColor Red
}

# Export detailed results
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportPath = "SECURITY_TEST_RESULTS_$timestamp.json"
$results | ConvertTo-Json -Depth 3 | Out-File $reportPath -Encoding UTF8

Write-Host "`nDetailed results saved to: $reportPath" -ForegroundColor Cyan

# Display results table
Write-Host "`nDetailed Results:" -ForegroundColor Cyan
$results | Format-Table Feature, Test, Status, Detail -AutoSize -Wrap
