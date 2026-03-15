# ========================================
# Start Frontend HTTP Server
# Serves frontend on http://localhost:3000
# ========================================

Write-Host "`nStarting Frontend Server..." -ForegroundColor Cyan
Write-Host "   Port: 3000" -ForegroundColor White
Write-Host "   Host: localhost" -ForegroundColor White
Write-Host ""

# Navigate to frontend directory
Set-Location $PSScriptRoot

# Kill any existing Python processes on port 3000
Write-Host "Checking for existing processes on port 3000..." -ForegroundColor Yellow
$conn = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
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
Write-Host "Frontend URLs:" -ForegroundColor Cyan
Write-Host "   • Home: http://localhost:3000/" -ForegroundColor White
Write-Host "   • Client Login: http://localhost:3000/client-login.html" -ForegroundColor White
Write-Host "   • Client Signup: http://localhost:3000/client-signup.html" -ForegroundColor White
Write-Host "   • Test Connection: http://localhost:3000/test-connection.html" -ForegroundColor White
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start Python HTTP server using workspace virtualenv when available.
$projectRoot = Split-Path $PSScriptRoot -Parent
$pythonCandidates = @(
    (Join-Path $PSScriptRoot ".venv\Scripts\python.exe"),
    (Join-Path $PSScriptRoot "venv\Scripts\python.exe"),
    (Join-Path $projectRoot ".venv\Scripts\python.exe"),
    (Join-Path $projectRoot "venv\Scripts\python.exe")
)

$pythonExe = $pythonCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($pythonExe) {
    Write-Host "Using Python: $pythonExe" -ForegroundColor White
    & $pythonExe -m http.server 3000
} else {
    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pythonCmd) {
        Write-Host "No Python executable found." -ForegroundColor Red
        Write-Host "Create or activate .venv, or install Python and retry." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "Using system Python: $($pythonCmd.Source)" -ForegroundColor White
    python -m http.server 3000
}
