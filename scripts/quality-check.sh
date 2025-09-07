#!/bin/bash

# Comprehensive code quality check script
set -e

echo "🔍 Running comprehensive code quality checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track if any checks failed
FAILED=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        FAILED=1
    fi
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "============================================"
echo "🎯 Code Quality Checks"
echo "============================================"

# 1. TypeScript compilation check
print_info "Checking TypeScript compilation..."
if npm run type-check > /dev/null 2>&1; then
    print_status 0 "TypeScript compilation"
else
    print_status 1 "TypeScript compilation"
    echo "Run 'npm run type-check' for details"
fi

# 2. ESLint check
print_info "Running ESLint..."
if npm run lint > /dev/null 2>&1; then
    print_status 0 "ESLint checks"
else
    print_status 1 "ESLint checks"
    echo "Run 'npm run lint' for details or 'npm run lint:fix' to auto-fix"
fi

# 3. Prettier formatting check
print_info "Checking code formatting..."
if npm run format:check > /dev/null 2>&1; then
    print_status 0 "Code formatting"
else
    print_status 1 "Code formatting"
    echo "Run 'npm run format' to fix formatting issues"
fi

# 4. Package build check
print_info "Testing package builds..."
if npm run build > /dev/null 2>&1; then
    print_status 0 "Package builds"
else
    print_status 1 "Package builds"
    echo "Run 'npm run build' for details"
fi

# 5. Dependency audit (optional)
print_info "Running security audit..."
if npm audit --audit-level=moderate > /dev/null 2>&1; then
    print_status 0 "Security audit"
else
    print_warning "Security vulnerabilities found"
    echo "Run 'npm audit' for details and 'npm audit fix' to resolve"
fi

# 6. Check for TODO/FIXME comments
print_info "Checking for TODO/FIXME comments..."
TODO_COUNT=$(grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build . | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
    print_warning "$TODO_COUNT TODO/FIXME comments found"
else
    print_status 0 "No TODO/FIXME comments"
fi

echo "============================================"

# Summary
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All quality checks passed!${NC}"
    echo ""
    echo "📊 Summary:"
    echo "  ✅ TypeScript compilation"
    echo "  ✅ ESLint checks"  
    echo "  ✅ Code formatting"
    echo "  ✅ Package builds"
    echo "  ✅ Security audit"
    if [ "$TODO_COUNT" -gt 0 ]; then
        echo -e "  ⚠️  $TODO_COUNT TODO/FIXME comments"
    else
        echo "  ✅ No TODO/FIXME comments"
    fi
    exit 0
else
    echo -e "${RED}💥 Some quality checks failed!${NC}"
    echo ""
    echo "🛠️  Quick fixes:"
    echo "  npm run lint:fix  - Fix ESLint issues"
    echo "  npm run format    - Fix formatting"
    echo "  npm run type-check - Check TypeScript errors"
    echo "  npm audit fix     - Fix security issues"
    exit 1
fi