#!/usr/bin/env pwsh
# Token Rotation Security Test
# Verifies that old refresh tokens are properly invalidated after rotation

$ErrorActionPreference = 'Stop'
$base = "http://127.0.0.1:8001"

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "     TOKEN ROTATION SECURITY TEST" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Generate unique test user
$ts = [int][double]::Parse((Get-Date -UFormat %s))
$email = "sectest$ts@example.com"
$pass = "SecureTest1234!"

# Test 1: Register
Write-Host "[1/6] Register user..." -ForegroundColor Yellow
$regBody = @{email=$email; password=$pass; full_name="Security Test"} | ConvertTo-Json
$reg = Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType "application/json" -Body $regBody
$token1_refresh = $reg.refresh_token
$token1_access = $reg.access_token
Write-Host "      ✅ Registered (ID: $($reg.user_id))" -ForegroundColor Green

# Test 2: Access with token
Write-Host "`n[2/6] Test access token..." -ForegroundColor Yellow
$headers = @{Authorization = "Bearer $token1_access"}
$profile = Invoke-RestMethod -Uri "$base/api/client/profile" -Method Get -Headers $headers
Write-Host "      ✅ Access token valid" -ForegroundColor Green

# Test 3: Rotate tokens
Write-Host "`n[3/6] Rotate tokens (1st refresh)..." -ForegroundColor Yellow
$refreshBody = @{refresh_token = $token1_refresh} | ConvertTo-Json
$refresh1 = Invoke-RestMethod -Uri "$base/api/auth/refresh" -Method Post -ContentType "application/json" -Body $refreshBody
$token2_refresh = $refresh1.refresh_token
$token2_access = $refresh1.access_token
Write-Host "      ✅ Tokens rotated" -ForegroundColor Green

# Test 4: CRITICAL - Try old token (MUST FAIL)
Write-Host "`n[4/6] 🚨 SECURITY TEST: Use old token (must reject)..." -ForegroundColor Yellow
try {
    $oldBody = @{refresh_token = $token1_refresh} | ConvertTo-Json
    $badRefresh = Invoke-RestMethod -Uri "$base/api/auth/refresh" -Method Post -ContentType "application/json" -Body $oldBody -ErrorAction Stop
    Write-Host "      ❌ SECURITY FAILURE: Old token works!" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Message -match "401|Unauthorized|revoked") {
        Write-Host "      ✅ Old token rejected (401)" -ForegroundColor Green
    } else {
        Write-Host "      ❌ Unexpected error" -ForegroundColor Red
        exit 1
    }
}

# Test 5: New token works
Write-Host "`n[5/6] Test new access token..." -ForegroundColor Yellow
$headers2 = @{Authorization = "Bearer $token2_access"}
$profile2 = Invoke-RestMethod -Uri "$base/api/client/profile" -Method Get -Headers $headers2
Write-Host "      ✅ New token valid" -ForegroundColor Green

# Test 6: Second rotation
Write-Host "`n[6/6] Second rotation..." -ForegroundColor Yellow
$refreshBody2 = @{refresh_token = $token2_refresh} | ConvertTo-Json
$refresh2 = Invoke-RestMethod -Uri "$base/api/auth/refresh" -Method Post -ContentType "application/json" -Body $refreshBody2
Write-Host "      ✅ Second rotation OK" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "           ALL TESTS PASSED                     " -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host "  Token rotation security: VERIFIED" -ForegroundColor Green
Write-Host "  Old token rejection: WORKING" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Test user: $email" -ForegroundColor Gray
Write-Host ""

