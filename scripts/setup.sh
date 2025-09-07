#!/bin/bash

# Ankiniki Development Setup Script
set -e

echo "🚀 Setting up Ankiniki development environment..."

# Check Node.js version
NODE_VERSION=$(node --version | cut -c2-)
REQUIRED_VERSION="18.0.0"

if ! [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js $REQUIRED_VERSION or higher is required. Current: $NODE_VERSION"
    exit 1
fi

echo "✅ Node.js version check passed ($NODE_VERSION)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build shared packages first
echo "🔨 Building shared packages..."
cd packages/shared && npm run build && cd ../..

# Set up git hooks
echo "🪝 Setting up git hooks..."
npx husky install

# Run initial linting and formatting
echo "🧹 Running initial code formatting..."
npm run format
npm run lint:fix

# Type checking
echo "🔍 Running type checks..."
npm run type-check

echo "✅ Setup complete!"
echo ""
echo "🎯 Available commands:"
echo "  npm run dev      - Start development servers"
echo "  npm run build    - Build all packages"
echo "  npm run lint     - Check code quality"
echo "  npm run format   - Format code"
echo "  npm run test     - Run tests"
echo ""
echo "📚 Next steps:"
echo "  1. Make sure Anki is running with AnkiConnect addon"
echo "  2. Run 'cd packages/backend && npm run dev' to start the API server"
echo "  3. Run 'cd apps/desktop && npm run dev' to start the desktop app"
echo "  4. Run 'cd apps/cli && npm run build && npm link' to set up CLI"