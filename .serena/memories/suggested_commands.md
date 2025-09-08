# Essential Development Commands

## Initial Setup
```bash
# Full automated setup (preferred)
npm run setup

# Manual setup alternative
npm install
npx husky install
npm run build
```

## Daily Development Workflow
```bash
# Start all development servers (parallel)
npm run dev

# Start individual components
cd packages/backend && npm run dev    # API server on :3001
cd apps/desktop && npm run dev        # Electron app
cd apps/cli && npm run build          # CLI tool build
```

## Code Quality (Run Before Every Commit)
```bash
# Complete quality check pipeline
npm run check                         # Lint + format + typecheck

# Individual quality checks
npm run lint                          # Check code quality
npm run lint:fix                      # Auto-fix ESLint issues
npm run format                        # Format all code with Prettier
npm run format:check                  # Check formatting without fixing
npm run type-check                    # TypeScript compilation check
```

## Build and Testing
```bash
# Build all packages in dependency order
npm run build

# Run all tests across monorepo
npm run test

# Clean build artifacts and dependencies
npm run clean
```

## Git and CI/CD
```bash
# Pre-commit quality validation (automatic via hooks)
npm run precommit

# Full CI pipeline (what runs in CI/CD)
npm run ci
```

## Monorepo Management
```bash
# Install dependencies for all workspaces
npm install

# Run script across all workspaces
npm run build --workspaces --if-present
npm run test --workspaces --if-present

# Work in specific package
cd packages/backend && npm run dev
cd apps/cli && npm run build && npm link
```

## Troubleshooting Commands
```bash
# Reset everything (nuclear option)
npm run clean && npm install && npm run build

# Check git hooks are working
npm run precommit

# Validate dependencies and security
npm audit
npm outdated
```

## Production Deployment
```bash
# Desktop app distributables  
cd apps/desktop && npm run build && npm run dist

# CLI tool global installation
cd apps/cli && npm run build && npm link

# Backend server production
cd packages/backend && npm run build && npm start
```

## System Requirements Check
- Node.js 18+ (`node --version`)
- npm 9+ (`npm --version`)
- Anki desktop application running
- AnkiConnect addon installed (code: 2055492159)