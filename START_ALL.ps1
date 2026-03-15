# ========================================
# Start All Services
# Launches backend and frontend in separate windows
# ========================================

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "  Nutrition Management - Start All Services" -ForegroundColor Cyan
Write-Host "===========================================`n" -ForegroundColor Cyan

$projectRoot = $PSScriptRoot
$backendScript = Join-Path $projectRoot "backend\start_backend.ps1"
$frontendScript = Join-Path $projectRoot "start_frontend.ps1"

if (-not (Test-Path $backendScript)) {
	Write-Host "Backend starter not found: $backendScript" -ForegroundColor Red
	exit 1
}

if (-not (Test-Path $frontendScript)) {
	Write-Host "Frontend starter not found: $frontendScript" -ForegroundColor Red
	exit 1
}

Write-Host "Starting backend in a new PowerShell window..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
	"-NoExit",
	"-ExecutionPolicy", "Bypass",
	"-File", "`"$backendScript`""
)

Start-Sleep -Seconds 2

Write-Host "Starting frontend in a new PowerShell window..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
	"-NoExit",
	"-ExecutionPolicy", "Bypass",
	"-File", "`"$frontendScript`""
)

Write-Host ""
Write-Host "Services launched." -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000/" -ForegroundColor White
Write-Host "Backend:  http://127.0.0.1:8001/docs" -ForegroundColor White
Write-Host ""
Write-Host "Close the two service windows (or press CTRL+C inside them) to stop servers." -ForegroundColor Yellow
