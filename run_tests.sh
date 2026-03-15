#!/usr/bin/env bash
# Integration Test Runner Script
# Run all frontend-backend integration tests
# Usage: ./run_tests.sh

set -e

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BACKEND_URL="http://127.0.0.1:8001"
FRONTEND_URL="http://127.0.0.1:5500"

echo -e "${BLUE}═════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Client Nutrition Management - Integration Test Suite${NC}"
echo -e "${BLUE}═════════════════════════════════════════════════════════${NC}\n"

# Function to check if service is running
check_service() {
    local url=$1
    local name=$2
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name is running at $url"
        return 0
    else
        echo -e "${RED}✗${NC} $name is NOT running at $url"
        return 1
    fi
}

# Function to run tests
run_pytest_tests() {
    echo -e "\n${BLUE}┌─────────────────────────────────────────────────────────┐${NC}"
    echo -e "${BLUE}│ Running PyTest Integration Tests${NC}"
    echo -e "${BLUE}└─────────────────────────────────────────────────────────┘${NC}\n"
    
    cd backend
    
    if [ $# -eq 0 ]; then
        echo "Running all tests..."
        python -m pytest test_integration.py -v -s
    else
        echo "Running: $1"
        python -m pytest "test_integration.py::$1" -v -s
    fi
    
    cd ..
}

run_cypress_tests() {
    echo -e "\n${BLUE}┌─────────────────────────────────────────────────────────┐${NC}"
    echo -e "${BLUE}│ Running Cypress E2E Tests${NC}"
    echo -e "${BLUE}└─────────────────────────────────────────────────────────┘${NC}\n"
    
    if [ $# -eq 0 ]; then
        echo "Opening Cypress interactive mode..."
        npx cypress open
    else
        echo "Running Cypress in headless mode..."
        npx cypress run
    fi
}

# Menu for which tests to run
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}What would you like to do?${NC}\n"
    echo "1) Check service status"
    echo "2) Run all PyTest tests"
    echo "3) Run specific PyTest class"
    echo "4) Run Cypress tests (interactive)"
    echo "5) Run Cypress tests (headless)"
    echo "6) Run all tests (PyTest + Cypress)"
    echo "7) Run with coverage report"
    echo ""
    read -p "Enter option (1-7): " choice
    
    case $choice in
        1)
            echo -e "\n${YELLOW}Checking services...${NC}\n"
            check_service "$BACKEND_URL/health" "Backend"
            check_service "$FRONTEND_URL" "Frontend"
            ;;
        2)
            run_pytest_tests
            ;;
        3)
            echo -e "\nAvailable test classes:"
            echo "  - TestLoginFlow"
            echo "  - TestCreateClient"
            echo "  - TestUpdateClient"
            echo "  - TestLogData"
            echo "  - TestErrorHandling"
            echo "  - TestCompleteWorkflow"
            echo ""
            read -p "Enter class name: " class_name
            run_pytest_tests "$class_name"
            ;;
        4)
            run_cypress_tests "interactive"
            ;;
        5)
            run_cypress_tests "headless"
            ;;
        6)
            echo -e "\n${YELLOW}Checking services first...${NC}\n"
            check_service "$BACKEND_URL/health" "Backend" && BACKEND_OK=1 || BACKEND_OK=0
            
            if [ $BACKEND_OK -eq 1 ]; then
                run_pytest_tests
                read -p "PyTest complete. Run Cypress tests? (y/n): " run_cypress
                if [ "$run_cypress" = "y" ]; then
                    run_cypress_tests "headless"
                fi
            else
                echo -e "${RED}Please start backend first: python -m uvicorn app.main:app --host 127.0.0.1 --port 8001${NC}"
            fi
            ;;
        7)
            echo -e "\n${YELLOW}Running tests with coverage...${NC}\n"
            cd backend
            pip install pytest-cov 2>/dev/null || true
            python -m pytest test_integration.py --cov=app --cov-report=html --cov-report=term
            echo -e "\n${GREEN}Coverage report generated: backend/htmlcov/index.html${NC}"
            cd ..
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            exit 1
            ;;
    esac
else
    # Command line arguments
    case $1 in
        status)
            echo -e "\n${YELLOW}Checking services...${NC}\n"
            check_service "$BACKEND_URL/health" "Backend"
            check_service "$FRONTEND_URL" "Frontend"
            ;;
        pytest)
            shift
            run_pytest_tests "$@"
            ;;
        cypress-interactive)
            run_cypress_tests "interactive"
            ;;
        cypress-headless)
            run_cypress_tests "headless"
            ;;
        all)
            run_pytest_tests
            read -p "PyTest complete. Run Cypress tests? (y/n): " run_cypress
            if [ "$run_cypress" = "y" ]; then
                run_cypress_tests "headless"
            fi
            ;;
        coverage)
            cd backend
            pip install pytest-cov 2>/dev/null || true
            python -m pytest test_integration.py --cov=app --cov-report=html --cov-report=term
            echo -e "\n${GREEN}Coverage report generated: backend/htmlcov/index.html${NC}"
            cd ..
            ;;
        *)
            echo -e "${RED}Usage: $0 [status|pytest|cypress-interactive|cypress-headless|all|coverage]${NC}"
            exit 1
            ;;
    esac
fi

echo -e "\n${GREEN}Done!${NC}\n"
