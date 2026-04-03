# ========================================
# Start Backend Server Script
# Starts FastAPI on port 8001
# ========================================

Write-Host "`nStarting FastAPI Backend Server..." -ForegroundColor Cyan
Write-Host "   Port: 8011" -ForegroundColor White
Write-Host "   Host: 0.0.0.0 (all interfaces)" -ForegroundColor White
Write-Host "   Mode: Development" -ForegroundColor Yellow
Write-Host ""

# Navigate to backend directory
Set-Location $PSScriptRoot

# Kill any existing uvicorn backend processes first (covers stale reloader pairs)
Write-Host "Checking for existing backend uvicorn processes..." -ForegroundColor Yellow
$uvicornTargets = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object {
        $_.Name -match 'python' -and
        $_.CommandLine -match 'uvicorn app.main:app'
    }

if ($uvicornTargets) {
    $uvicornTargets | ForEach-Object {
        Write-Host "   Stopping uvicorn PID: $($_.ProcessId)" -ForegroundColor Yellow
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
}

# Also clear any remaining process that still owns port 8011
$conn = Get-NetTCPConnection -LocalPort 8011 -ErrorAction SilentlyContinue
if ($conn) {
    $conn.OwningProcess | Select-Object -Unique | ForEach-Object {
        Write-Host "   Releasing port 8011 from PID: $_" -ForegroundColor Yellow
        Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
}

# Start the server
Write-Host "Starting server..." -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Backend URLs:" -ForegroundColor Cyan
Write-Host "   • API Root: http://127.0.0.1:8011/" -ForegroundColor White
Write-Host "   • Health: http://127.0.0.1:8011/health" -ForegroundColor White
Write-Host "   • Swagger Docs: http://127.0.0.1:8011/docs" -ForegroundColor White
Write-Host "   • ReDoc: http://127.0.0.1:8011/redoc" -ForegroundColor White

$lanIp = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
        $_.IPAddress -notlike '127.*' -and
        $_.IPAddress -notlike '169.254*' -and
        $_.ValidLifetime -gt 0
    } |
    Select-Object -First 1 -ExpandProperty IPAddress

if ($lanIp) {
    Write-Host "   • Mobile/LAN: http://$lanIp:8011/" -ForegroundColor White
}
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

& $pythonExe -m uvicorn app.main:app --host 0.0.0.0 --port 8011

if ($LASTEXITCODE -ne 0) {
    Write-Host "" 
    Write-Host "Backend failed to start or exited unexpectedly (exit code: $LASTEXITCODE)." -ForegroundColor Red
    Write-Host "Check: 1) port 8011 conflicts 2) backend/.env values 3) Python dependencies." -ForegroundColor Yellow
    exit $LASTEXITCODE
}
