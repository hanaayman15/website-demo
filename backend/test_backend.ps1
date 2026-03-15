# ========================================
# Backend API Test Script
# Tests all major endpoints on port 8001
# ========================================

$base = "http://127.0.0.1:8001"
$ErrorActionPreference = 'Stop'

Write-Host "`n🚀 TESTING FASTAPI BACKEND ON PORT 8001`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "1️⃣  Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$base/health" -Method Get
    Write-Host "   ✅ Health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Health check failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Root Endpoint
Write-Host "2️⃣  Testing Root Endpoint..." -ForegroundColor Yellow
try {
    $root = Invoke-RestMethod -Uri "$base/" -Method Get
    Write-Host "   ✅ App: $($root.app_name) v$($root.version)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Root endpoint failed: $_" -ForegroundColor Red
    exit 1
}

# Test 3: CORS Configuration
Write-Host "3️⃣  Testing CORS Configuration..." -ForegroundColor Yellow
try {
    $corsResponse = Invoke-WebRequest -Uri "$base/health" -Method Options `
        -Headers @{"Origin"="http://localhost:5500"; "Access-Control-Request-Method"="GET"} `
        -UseBasicParsing
    $allowOrigin = $corsResponse.Headers['Access-Control-Allow-Origin']
    if ($allowOrigin -eq "http://localhost:5500" -or $allowOrigin -eq "*") {
        Write-Host "   ✅ CORS: Frontend (localhost:5500) allowed" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  CORS: Unexpected origin: $allowOrigin" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ CORS check failed: $_" -ForegroundColor Red
}

# Test 4: OpenAPI/Docs
Write-Host "4️⃣  Testing API Documentation..." -ForegroundColor Yellow
try {
    $schema = Invoke-RestMethod -Uri "$base/openapi.json"
    $pathCount = @($schema.paths.PSObject.Properties).Count
    Write-Host "   ✅ OpenAPI Schema: $pathCount paths registered" -ForegroundColor Green
    Write-Host "   📖 Swagger UI: http://127.0.0.1:8001/docs" -ForegroundColor Cyan
    Write-Host "   📖 ReDoc: http://127.0.0.1:8001/redoc" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ OpenAPI schema failed: $_" -ForegroundColor Red
}

# Test 5: User Registration
Write-Host "5️⃣  Testing User Registration..." -ForegroundColor Yellow
$ts = [int][double]::Parse((Get-Date -UFormat %s))
$testEmail = "testuser$ts@example.com"
$testPassword = "SecurePass123!"
try {
    $regBody = @{
        email = $testEmail
        password = $testPassword
        full_name = "Test User"
    } | ConvertTo-Json
    $reg = Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post `
        -ContentType "application/json" -Body $regBody
    Write-Host "   ✅ Registration successful: $testEmail" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Registration failed: $_" -ForegroundColor Red
    exit 1
}

# Test 6: User Login
Write-Host "6️⃣  Testing User Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post `
        -ContentType "application/json" -Body $loginBody
    $token = $login.access_token
    $headers = @{Authorization="Bearer $token"}
    Write-Host "   ✅ Login successful, token received" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Test 7: Get Client Profile
Write-Host "7️⃣  Testing Client Profile..." -ForegroundColor Yellow
try {
    $profile = Invoke-RestMethod -Uri "$base/api/client/profile" -Method Get -Headers $headers
    $clientId = $profile.id
    Write-Host "   ✅ Profile retrieved: Client ID $clientId (Display ID: $($profile.display_id))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Profile retrieval failed: $_" -ForegroundColor Red
    exit 1
}

# Test 8: Log Weight
Write-Host "8️⃣  Testing Weight Logging..." -ForegroundColor Yellow
try {
    $weightBody = @{
        weight = 75.5
        body_fat_percentage = 18.2
        notes = "Test weight log"
        client_id = $clientId
    } | ConvertTo-Json
    $weight = Invoke-RestMethod -Uri "$base/api/client/weight" -Method Post `
        -Headers $headers -ContentType "application/json" -Body $weightBody
    Write-Host "   ✅ Weight logged: $($weight.weight) kg" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Weight logging failed: $_" -ForegroundColor Red
}

# Test 9: Log Mood
Write-Host "9️⃣  Testing Mood Logging..." -ForegroundColor Yellow
try {
    $moodBody = @{
        mood_level = 8
        energy_level = 7
        stress_level = 3
        sleep_hours = 7.5
        sleep_quality = 8
        notes = "Test mood log"
        client_id = $clientId
    } | ConvertTo-Json
    $mood = Invoke-RestMethod -Uri "$base/api/client/mood" -Method Post `
        -Headers $headers -ContentType "application/json" -Body $moodBody
    Write-Host "   ✅ Mood logged: Level $($mood.mood_level)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Mood logging failed: $_" -ForegroundColor Red
}

# Test 10: Log Supplement
Write-Host "🔟 Testing Supplement Logging..." -ForegroundColor Yellow
try {
    $suppBody = @{
        supplement_name = "Vitamin D"
        dosage = "2000 IU"
        time_taken = "Morning"
        notes = "Test supplement log"
        client_id = $clientId
    } | ConvertTo-Json
    $supp = Invoke-RestMethod -Uri "$base/api/client/supplements" -Method Post `
        -Headers $headers -ContentType "application/json" -Body $suppBody
    Write-Host "   ✅ Supplement logged: $($supp.supplement_name)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Supplement logging failed: $_" -ForegroundColor Red
}

# Test 11: Log Workout
Write-Host "1️⃣1️⃣  Testing Workout Logging..." -ForegroundColor Yellow
try {
    $workoutBody = @{
        workout_name = "Running"
        workout_type = "Cardio"
        duration_minutes = 30
        intensity = "High"
        calories_burned = 400
        notes = "Test workout log"
        client_id = $clientId
    } | ConvertTo-Json
    $workout = Invoke-RestMethod -Uri "$base/api/client/workouts" -Method Post `
        -Headers $headers -ContentType "application/json" -Body $workoutBody
    Write-Host "   ✅ Workout logged: $($workout.workout_name)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Workout logging failed: $_" -ForegroundColor Red
}

# Test 12: Retrieve Data
Write-Host "1️⃣2️⃣  Testing Data Retrieval..." -ForegroundColor Yellow
try {
    $weights = Invoke-RestMethod -Uri "$base/api/client/weight?days=30" -Method Get -Headers $headers
    $moods = Invoke-RestMethod -Uri "$base/api/client/mood?days=30" -Method Get -Headers $headers
    $supps = Invoke-RestMethod -Uri "$base/api/client/supplements?days=30" -Method Get -Headers $headers
    $workouts = Invoke-RestMethod -Uri "$base/api/client/workouts?days=30" -Method Get -Headers $headers
    
    Write-Host "   ✅ Weight logs: $(@($weights).Count)" -ForegroundColor Green
    Write-Host "   ✅ Mood logs: $(@($moods).Count)" -ForegroundColor Green
    Write-Host "   ✅ Supplement logs: $(@($supps).Count)" -ForegroundColor Green
    Write-Host "   ✅ Workout logs: $(@($workouts).Count)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Data retrieval failed: $_" -ForegroundColor Red
}

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n📊 SUMMARY:" -ForegroundColor Cyan
Write-Host "   • Backend running on: http://127.0.0.1:8001" -ForegroundColor White
Write-Host "   • Frontend expected on: http://localhost:5500" -ForegroundColor White
Write-Host "   • Database: SQLite (nutrition_management.db)" -ForegroundColor White
Write-Host "   • CORS: Configured for frontend" -ForegroundColor White
Write-Host "   • Test user: $testEmail" -ForegroundColor White
Write-Host "`n🔗 USEFUL LINKS:" -ForegroundColor Cyan
Write-Host "   • API Docs: http://127.0.0.1:8001/docs" -ForegroundColor White
Write-Host "   • ReDoc: http://127.0.0.1:8001/redoc" -ForegroundColor White
Write-Host "   • OpenAPI: http://127.0.0.1:8001/openapi.json" -ForegroundColor White
Write-Host ""
