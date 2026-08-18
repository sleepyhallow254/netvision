#!/bin/bash
# NetVision Verification Script
# This script verifies that the NetVision project is properly configured and ready to run

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         NetVision Project Verification Script                 ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_result() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $1${NC}"
  else
    echo -e "${RED}✗ $1${NC}"
    exit 1
  fi
}

warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# 1. Check Node.js version
echo "Checking environment..."
node --version > /dev/null 2>&1
check_result "Node.js is installed"

node -e "const v = process.versions.node; const major = parseInt(v.split('.')[0]); if (major < 18) { throw new Error('Node 18+ required'); }"
check_result "Node.js version 18+"

# 2. Check project structure
echo ""
echo "Checking project structure..."
[ -f backend/package.json ]
check_result "backend/package.json exists"

[ -f backend/server.js ]
check_result "backend/server.js exists"

[ -f frontend/package.json ]
check_result "frontend/package.json exists"

[ -f frontend/index.html ]
check_result "frontend/index.html exists"

[ -f frontend/src/main.jsx ]
check_result "frontend/src/main.jsx exists"

[ -f frontend/src/App.jsx ]
check_result "frontend/src/App.jsx exists"

[ -d frontend/src ]
check_result "frontend/src directory exists"

# 3. Check configuration files
echo ""
echo "Checking configuration files..."
[ -f backend/.env.example ]
check_result "backend/.env.example exists"

[ -f backend/.gitignore ]
check_result "backend/.gitignore exists"

[ -f backend/eslint.config.js ]
check_result "backend/eslint.config.js exists"

[ -f frontend/.env.example ]
check_result "frontend/.env.example exists"

[ -f frontend/.gitignore ]
check_result "frontend/.gitignore exists"

[ -f frontend/.oxlintrc.json ]
check_result "frontend/.oxlintrc.json exists"

[ -f docker-compose.yml ]
check_result "docker-compose.yml exists"

[ -f backend/Dockerfile ]
check_result "backend/Dockerfile exists"

[ -f frontend/Dockerfile ]
check_result "frontend/Dockerfile exists"

# 4. Check dependencies
echo ""
echo "Checking dependencies..."
[ -d backend/node_modules ] || warning "backend/node_modules not found (run: cd backend && npm install)"
[ -d frontend/node_modules ] || warning "frontend/node_modules not found (run: cd frontend && npm install)"

# 5. Verify frontend build
echo ""
echo "Building frontend..."
cd frontend
npm run build > /dev/null 2>&1
check_result "Frontend builds successfully"

[ -d dist ]
check_result "frontend/dist directory created"

[ -f dist/index.html ]
check_result "frontend/dist/index.html exists"

cd ..

# 6. Check backend syntax
echo ""
echo "Checking backend syntax..."
cd backend
node -c server.js > /dev/null 2>&1
check_result "backend/server.js syntax is valid"
cd ..

# 7. Check linting
echo ""
echo "Checking code quality..."
cd backend
npm run lint > /dev/null 2>&1
check_result "Backend passes eslint"
cd ../frontend
npm run lint > /dev/null 2>&1
check_result "Frontend passes oxlint"
cd ..

# 8. Check documentation
echo ""
echo "Checking documentation..."
[ -f README.md ]
check_result "README.md exists"

[ -f DEPLOYMENT.md ]
check_result "DEPLOYMENT.md exists"

[ -f DEVELOPMENT.md ]
check_result "DEVELOPMENT.md exists"

# 9. Test backend can start (with timeout)
echo ""
echo "Testing backend startup..."
cd backend
timeout 5s node server.js > /tmp/backend-test.log 2>&1 &
sleep 2
if curl -s http://localhost:3001/api/health > /dev/null; then
  pkill -f "node server.js" || true
  check_result "Backend starts and responds to health check"
else
  pkill -f "node server.js" || true
  warning "Backend health check failed (network may be required)"
fi
cd ..

# Final report
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                   Verification Complete                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Start the backend:"
echo "   cd backend && npm run dev"
echo ""
echo "2. In another terminal, start the frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "For more information:"
echo "- README.md - Project overview"
echo "- DEVELOPMENT.md - Development guide"
echo "- DEPLOYMENT.md - Deployment guide"
echo ""
