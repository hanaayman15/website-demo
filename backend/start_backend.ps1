# ========================================
# Start Backend Server Script
# Starts FastAPI on port 8001
# ========================================

Write-Host "`nStarting FastAPI Backend Server..." -ForegroundColor Cyan
Write-Host "   Port: 8001" -ForegroundColor White
Write-Host "   Host: 127.0.0.1" -ForegroundColor White
Write-Host "   Mode: Development (with reload)" -ForegroundColor Yellow
Write-Host ""

# Navigate to backend directory
Set-Location $PSScriptRoot

# Kill any existing Python processes on port 8001
Write-Host "Checking for existing processes on port 8001..." -ForegroundColor Yellow
$conn = Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue
if ($conn) {
    $processId = $conn.OwningProcess | Select-Object -First 1
    Write-Host "   Found existing process (PID: $processId), stopping..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Start the server
Write-Host "Starting server..." -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Backend URLs:" -ForegroundColor Cyan
Write-Host "   • API Root: http://127.0.0.1:8001/" -ForegroundColor White
Write-Host "   • Health: http://127.0.0.1:8001/health" -ForegroundColor White
Write-Host "   • Swagger Docs: http://127.0.0.1:8001/docs" -ForegroundColor White
Write-Host "   • ReDoc: http://127.0.0.1:8001/redoc" -ForegroundColor White
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start uvicorn
$pythonCandidates = @(
    (Join-Path $PSScriptRoot ".venv\Scripts\python.exe"),
    (Join-Path $PSScriptRoot "venv\Scripts\python.exe"),
    (Join-Path (Split-Path $PSScriptRoot -Parent) ".venv\Scripts\python.exe")
)

$pythonExe = $pythonCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $pythonExe) {
    Write-Host "No Python executable found in expected virtualenv paths:" -ForegroundColor Red
    $pythonCandidates | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "Using Python: $pythonExe" -ForegroundColor White
Write-Host "Launching Uvicorn..." -ForegroundColor Green

& $pythonExe -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload

if ($LASTEXITCODE -ne 0) {
    Write-Host "" 
    Write-Host "Backend failed to start or exited unexpectedly (exit code: $LASTEXITCODE)." -ForegroundColor Red
    Write-Host "Check: 1) port 8001 conflicts 2) backend/.env values 3) Python dependencies." -ForegroundColor Yellow
    exit $LASTEXITCODE
}
