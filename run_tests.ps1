# Integration Test Runner Script for Windows PowerShell
# Run all frontend-backend integration tests
# Usage: .\run_tests.ps1

param(
    [string]$action = "",
    [string]$class = ""
)

$SCRIPT_ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

# Configuration
$BACKEND_URL = "http://127.0.0.1:8001"
$FRONTEND_URL = "http://127.0.0.1:5500"
$BACKEND_HEALTH = "$BACKEND_URL/health"

# Color functions
function Write-Header {
    param([string]$text)
    Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $text" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
}

function Write-Section {
    param([string]$text)
    Write-Host "`n┌─────────────────────────────────────────────────────────┐" -ForegroundColor Blue
    Write-Host "│ $text" -ForegroundColor Blue
    Write-Host "└─────────────────────────────────────────────────────────┘`n" -ForegroundColor Blue
}

function Write-Success {
    param([string]$text)
    Write-Host "✓ $text" -ForegroundColor Green
}

function Write-Error {
    param([string]$text)
    Write-Host "✗ $text" -ForegroundColor Red
}

function Write-Warning {
    param([string]$text)
    Write-Host "⚠ $text" -ForegroundColor Yellow
}

function Get-PythonExecutable {
    $venvPython = Join-Path $SCRIPT_ROOT ".venv\Scripts\python.exe"
    if (Test-Path $venvPython) {
        return $venvPython
    }
    return "python"
}

# Check if service is running
function Check-Service {
    param(
        [string]$url,
        [string]$name
    )
    
    try {
        $null = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 8 -ErrorAction Stop
        Write-Success "$name is running at $url"
        return $true
    } catch {
        # Try without /health endpoint
        if ($url -like "*health*") {
            $baseUrl = $url -replace "/health", ""
            try {
                $null = Invoke-RestMethod -Uri $baseUrl -Method Get -TimeoutSec 8 -ErrorAction Stop
                Write-Success "$name is running at $baseUrl"
                return $true
            } catch {
                Write-Error "$name is NOT running at $baseUrl"
                return $false
            }
        } else {
            Write-Error "$name is NOT running at $url"
            return $false
        }
    }
    return $false
}

# Run PyTest tests
function Run-PyTest {
    param([string]$testClass = "")
    
    Write-Section "Running PyTest Integration Tests"
    
    Push-Location backend
    
    if ($testClass) {
        Write-Host "Running: $testClass`n" -ForegroundColor Yellow
        & python -m pytest "test_integration.py::$testClass" -v -s
    } else {
        Write-Host "Running all tests...`n" -ForegroundColor Yellow
        & python -m pytest test_integration.py -v -s
    }
    
    Pop-Location
}

# Run Cypress tests
function Run-Cypress {
    param([string]$mode = "interactive")
    
    Write-Section "Running Cypress E2E Tests"
    
    if ($mode -eq "interactive") {
        Write-Host "Opening Cypress interactive mode...`n" -ForegroundColor Yellow
        & npx cypress open
    } else {
        Write-Host "Running Cypress in headless mode...`n" -ForegroundColor Yellow
        & npx cypress run
    }
}

# Run with coverage
function Run-Coverage {
    Write-Section "Running Tests with Coverage Report"
    
    Push-Location backend
    
    Write-Host "Installing pytest-cov..." -ForegroundColor Yellow
    & pip install pytest-cov -q
    
    Write-Host "Running tests with coverage...`n" -ForegroundColor Yellow
    & python -m pytest test_integration.py --cov=app --cov-report=html --cov-report=term
    
    Write-Host "`nCoverage report generated: .\htmlcov\index.html" -ForegroundColor Green
    Pop-Location
}

function Run-DashboardCoreValidation {
    Write-Host "`n================ Client Dashboard Core Validation ================`n" -ForegroundColor Blue

    Write-Host "[STEP 1/5] Backend health check" -ForegroundColor Cyan
    if (-not (Check-Service $BACKEND_HEALTH "Backend")) {
        Write-Error "Backend health check failed. Ensure backend is running on $BACKEND_URL"
        return $false
    }

    Write-Host "[STEP 2/5] API endpoint checks" -ForegroundColor Cyan
    try {
        $openApi = Invoke-RestMethod -Uri "$BACKEND_URL/openapi.json" -Method Get -TimeoutSec 10 -ErrorAction Stop
        $paths = $openApi.paths.PSObject.Properties.Name
        if ($paths -notcontains "/api/client/home-summary") {
            Write-Error "API endpoint check failed: '/api/client/home-summary' is missing from OpenAPI"
            return $false
        }
        if ($paths -notcontains "/api/client/consultation") {
            Write-Error "API endpoint check failed: '/api/client/consultation' is missing from OpenAPI"
            return $false
        }
        Write-Success "API endpoint checks passed (home-summary + consultation routes available)"
    } catch {
        Write-Error "API endpoint checks failed: $($_.Exception.Message)"
        return $false
    }

    Write-Host "[STEP 3/5-5/5] Home summary, consultation save, persistence reload" -ForegroundColor Cyan
    $pythonExe = Get-PythonExecutable
    $sanityScript = Join-Path $SCRIPT_ROOT "backend\client_dashboard_sanity_test.py"

    if (-not (Test-Path $sanityScript)) {
        Write-Error "Sanity script not found: $sanityScript"
        return $false
    }

    Push-Location (Join-Path $SCRIPT_ROOT "backend")
    try {
        & $pythonExe $sanityScript
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Dashboard core sanity validation failed. Review the [FAIL] line above for the exact step."
            return $false
        }
    } catch {
        Write-Error "Failed to execute dashboard sanity script: $($_.Exception.Message)"
        return $false
    } finally {
        Pop-Location
    }

    Write-Success "Client dashboard core validation passed"
    return $true
}

# Main menu if no arguments provided
if (-not $action) {
    while ($true) {
        Write-Header "Client Nutrition Management - Integration Test Suite"
        
        Write-Host @"
What would you like to do?

  1) Check service status
  2) Run all PyTest tests
  3) Run specific PyTest class
  4) Run Cypress tests (interactive)
  5) Run Cypress tests (headless)
  6) Run all tests (PyTest + Cypress)
  7) Run with coverage report
  8) Run dashboard sanity validation
  0) Exit

"@ -ForegroundColor Cyan
        
        $choice = Read-Host "Enter option (0-8)"
        
        switch ($choice) {
            "1" {
                Write-Host "`nChecking services...`n" -ForegroundColor Yellow
                Check-Service $BACKEND_HEALTH "Backend"
                Check-Service $FRONTEND_URL "Frontend"
            }
            "2" {
                Run-PyTest
            }
            "3" {
                Write-Host @"
Available test classes:

  - TestLoginFlow
  - TestCreateClient
  - TestUpdateClient
  - TestLogData
  - TestErrorHandling
  - TestCompleteWorkflow

"@ -ForegroundColor Cyan
                
                $class = Read-Host "Enter class name"
                Run-PyTest $class
            }
            "4" {
                Run-Cypress "interactive"
            }
            "5" {
                Run-Cypress "headless"
            }
            "6" {
                Write-Host "`nChecking services first...`n" -ForegroundColor Yellow
                
                if (Check-Service $BACKEND_HEALTH "Backend") {
                    if (-not (Run-DashboardCoreValidation)) {
                        Write-Error "Main validation flow stopped because dashboard core checks failed."
                    } else {
                        Run-PyTest
                        
                        $runCypress = Read-Host "`nPyTest complete. Run Cypress tests? (y/n)"
                        if ($runCypress -eq "y") {
                            Run-Cypress "headless"
                        }
                    }
                } else {
                    Write-Error "Please start backend first:"
                    Write-Host "  cd backend" -ForegroundColor Yellow
                    Write-Host "  python -m uvicorn app.main:app --host 127.0.0.1 --port 8001`n" -ForegroundColor Yellow
                }
            }
            "7" {
                Run-Coverage
            }
            "8" {
                if (-not (Run-DashboardCoreValidation)) {
                    Write-Error "Dashboard sanity validation failed."
                }
            }
            "0" {
                break
            }
            default {
                Write-Error "Invalid option"
            }
        }

        if ($choice -ne "0") {
            Write-Host "`nPress Enter to return to the main menu..." -ForegroundColor DarkGray
            Read-Host | Out-Null
            Clear-Host
        }
    }
} else {
    # Command line arguments
    switch ($action.ToLower()) {
        "status" {
            Write-Host "`nChecking services...`n" -ForegroundColor Yellow
            Check-Service $BACKEND_HEALTH "Backend"
            Check-Service $FRONTEND_URL "Frontend"
        }
        "pytest" {
            Run-PyTest $class
        }
        "pytest-class" {
            if (-not $class) {
                Write-Error "Please specify class name: .\run_tests.ps1 pytest-class TestLoginFlow"
                exit 1
            }
            Run-PyTest $class
        }
        "pytest-coverage" {
            Run-Coverage
        }
        "cypress-interactive" {
            Run-Cypress "interactive"
        }
        "cypress-headless" {
            Run-Cypress "headless"
        }
        "dashboard-sanity" {
            if (-not (Run-DashboardCoreValidation)) {
                exit 1
            }
        }
        "all" {
            if (-not (Run-DashboardCoreValidation)) {
                Write-Error "Main validation flow stopped because dashboard core checks failed."
                exit 1
            }
            Run-PyTest
            
            $runCypress = Read-Host "`nPyTest complete. Run Cypress tests? (y/n)"
            if ($runCypress -eq "y") {
                Run-Cypress "headless"
            }
        }
        default {
            Write-Host @"
Usage: .\run_tests.ps1 [action] [arguments]

Actions:
  status                          Check if backend and frontend are running
  pytest                          Run all PyTest tests
  pytest-class [ClassName]        Run specific test class
  pytest-coverage                 Run tests with coverage report
  cypress-interactive             Open Cypress interactive mode
  cypress-headless                Run Cypress in headless mode
    dashboard-sanity                Run client dashboard core flow validation
  all                            Run all tests (PyTest + Cypress)

Examples:
  .\run_tests.ps1                               # Interactive menu
  .\run_tests.ps1 status                        # Check services
  .\run_tests.ps1 pytest                        # Run all PyTest tests
  .\run_tests.ps1 pytest-class TestLoginFlow    # Run specific test class
  .\run_tests.ps1 pytest-coverage               # Run with coverage
  .\run_tests.ps1 cypress-interactive           # Open Cypress UI
    .\run_tests.ps1 dashboard-sanity              # Run core dashboard flow checks
  .\run_tests.ps1 all                          # Run all tests

"@ -ForegroundColor Cyan
            exit 1
        }
    }
}

Write-Host "`nDone!`n" -ForegroundColor Green
