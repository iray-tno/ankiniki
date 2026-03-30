# Development Guide

This document outlines the development workflow, code quality standards, and best practices for contributing to Ankiniki.

## 🚀 Quick Start

### Initial Setup

```bash
# Clone and setup
git clone https://github.com/iray-tno/ankiniki.git
cd ankiniki

# Run automated setup
npm run setup

# Or manual setup
npm install
npx husky install
npm run build
```

### Development Workflow

```bash
# Start all development servers
npm run dev

# Or start individual components
cd packages/backend && npm run dev    # API server
cd apps/desktop && npm run dev        # Electron app
cd apps/cli && npm run build          # CLI tool
```

## 🧹 Code Quality

### Automated Tools

- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Git hooks for quality checks

### Available Commands

```bash
# Quality checks
npm run lint          # Check code quality
npm run lint:fix      # Fix auto-fixable issues
npm run format        # Format all code
npm run format:check  # Check formatting
npm run type-check    # TypeScript compilation
npm run check         # Run all quality checks

# Development
npm run build         # Build all packages
npm run dev          # Start development servers
npm run test         # Run tests
npm run clean        # Clean build artifacts
```

### Pre-commit Hooks

Git hooks automatically run before each commit:

- ESLint auto-fixes
- Prettier formatting
- Type checking
- Staged files only

## 📝 Code Standards

### TypeScript Guidelines

- **Strict Mode**: All projects use strict TypeScript
- **Type Safety**: Prefer `interface` over `type` for object definitions
- **No `any`**: Use proper typing, `unknown` for uncertain types
- **Explicit Returns**: Use explicit return types for public APIs

### Code Style

- **Formatting**: Prettier with 80 character line limit
- **Imports**: Organize imports automatically
- **Quotes**: Single quotes for strings, JSX
- **Semicolons**: Always required
- **Trailing Commas**: ES5 compatible

### File Organization

```
packages/
├── shared/           # Common types and utilities
│   ├── src/
│   │   ├── types.ts  # Zod schemas and TypeScript types
│   │   ├── utils.ts  # Utility functions
│   │   └── constants.ts
│   └── package.json
└── backend/          # Express.js API server
    ├── src/
    │   ├── routes/   # API endpoints
    │   ├── services/ # Business logic
    │   ├── middleware/
    │   └── config/
    └── package.json

apps/
├── desktop/          # Electron application
│   ├── src/
│   │   ├── main/     # Electron main process
│   │   └── renderer/ # React frontend
│   └── package.json
└── cli/              # Command-line tool
    ├── src/
    │   └── commands/ # CLI command implementations
    └── package.json
```

### Naming Conventions

- **Files**: kebab-case (`card-editor.tsx`)
- **Components**: PascalCase (`CardEditor`)
- **Functions**: camelCase (`createCard`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`)
- **Types/Interfaces**: PascalCase (`Card`, `ApiResponse`)

## 🔧 IDE Configuration

### VS Code Setup

The project includes VS Code workspace settings:

- Auto-format on save
- ESLint integration
- TypeScript language server
- Recommended extensions

### Recommended Extensions

- ESLint
- Prettier
- TypeScript
- Auto Rename Tag
- GitLens
- TODO Tree

## 🧪 Testing Strategy

### Test Structure

```bash
# Unit tests
packages/shared/src/*.test.ts
packages/backend/src/**/*.test.ts

# Integration tests
apps/cli/src/**/*.test.ts
apps/desktop/src/**/*.test.ts

# E2E tests
tests/e2e/
```

### Testing Commands

```bash
npm run test                    # All tests
cd packages/backend && npm test # Package-specific
```

## 📦 Build Process

### Development Builds

```bash
npm run build                   # All packages
cd packages/shared && npm run build # Individual package
```

### Production Builds

```bash
# Desktop app distributables
cd apps/desktop
npm run build
npm run dist

# CLI tool
cd apps/cli
npm run build
npm link
```

## 🚨 Troubleshooting

### Common Issues

1. **TypeScript Errors**

   ```bash
   npm run type-check
   # Fix errors in reported files
   ```

2. **Linting Errors**

   ```bash
   npm run lint:fix     # Auto-fix
   npm run lint         # Manual review
   ```

3. **Format Issues**

   ```bash
   npm run format       # Fix all formatting
   ```

4. **Build Failures**

   ```bash
   npm run clean        # Clean everything
   npm install          # Reinstall deps
   npm run build        # Rebuild
   ```

5. **Git Hook Failures**

   ```bash
   # Manually run pre-commit checks
   npm run precommit

   # Skip hooks if needed (not recommended)
   git commit --no-verify
   ```

### Development Environment

- **Node.js**: 18+ required
- **npm**: 9+ required
- **OS**: Windows, macOS, Linux supported
- **Anki**: Required for testing AnkiConnect integration

## 🎯 Quality Gates

### Definition of Done

Before marking work complete:

- [ ] All TypeScript compilation errors resolved
- [ ] ESLint passes without warnings
- [ ] Code formatted with Prettier
- [ ] Relevant tests added/updated
- [ ] Documentation updated
- [ ] Manual testing completed
- [ ] Git hooks pass

### CI/CD Pipeline

```bash
npm run ci    # Runs complete quality check + tests
```

This validates:

- TypeScript compilation
- Linting rules
- Code formatting
- Unit tests
- Build processes
- Security audit

## 🤝 Contributing Workflow

1. **Setup**: Run `npm run setup` for initial development environment
2. **Branch**: Create feature branch from `main`
3. **Develop**: Write code following established patterns
4. **Quality**: Run `npm run check` before committing
5. **Test**: Ensure all tests pass
6. **Commit**: Git hooks ensure quality standards
7. **PR**: Submit pull request with clear description

## 📊 Monitoring

### Performance Metrics

- **Build Times**: Monitor with `npm run build`
- **Bundle Sizes**: Check Electron app size
- **Type Check Speed**: Track TypeScript performance

### Quality Metrics

- **ESLint Warnings**: Aim for zero warnings
- **Test Coverage**: Maintain high coverage
- **Security Vulns**: Regular `npm audit`
