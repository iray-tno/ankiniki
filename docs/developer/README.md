# Developer Guide

This comprehensive guide covers everything you need to know about developing, contributing to, and extending Ankiniki.

## 🚀 Quick Development Setup

### Prerequisites

- **Node.js**: 18.0.0+ ([nodejs.org](https://nodejs.org/))
- **npm**: 9.0.0+ (comes with Node.js)
- **Git**: Latest version ([git-scm.com](https://git-scm.com/))
- **Anki Desktop**: With AnkiConnect addon (code: `2055492159`)
- **VS Code**: Recommended for development

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/iray-tno/ankiniki.git
cd ankiniki

# Install dependencies for all workspaces
npm install

# Build all packages and apps
npm run build

# Run quality checks
npm run check

# Start development servers
npm run dev
```

## 🏗️ Architecture Overview

### Monorepo Structure

```
ankiniki/
├── packages/
│   ├── shared/          # Common types, utilities, constants
│   └── backend/         # Express.js API server
├── apps/
│   ├── desktop/         # Electron application
│   ├── cli/             # Command-line tool
│   └── vscode-extension/# VS Code extension
├── docs/                # Documentation
├── scripts/             # Build and utility scripts
└── tools/               # Development tooling
```

### Technology Stack

#### Core Technologies

- **Language**: TypeScript (strict mode)
- **Package Manager**: npm with workspaces
- **Build System**: Native TypeScript compiler
- **Quality Tools**: ESLint, Prettier, Husky

#### Frontend Stack

- **Desktop**: Electron + React + TypeScript
- **Extension**: VS Code Extension API + TypeScript

#### Backend Stack

- **API Server**: Express.js + TypeScript
- **CLI Tool**: Commander.js + TypeScript
- **Data Layer**: AnkiConnect API integration

#### Shared Components

- **Types**: Zod schemas with TypeScript inference
- **Utilities**: Common functions and helpers
- **Constants**: API endpoints, configuration defaults

## 🛠️ Development Workflow

### Setting Up Your Environment

#### 1. IDE Configuration

**VS Code (Recommended):**

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

**Recommended Extensions:**

- ESLint (`ms-vscode.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- TypeScript (`ms-vscode.vscode-typescript-next`)
- Auto Rename Tag (`formulahendry.auto-rename-tag`)

#### 2. Environment Variables

```bash
# packages/backend/.env
PORT=3001
ANKI_CONNECT_URL=http://localhost:8765
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Development Commands

#### Root Level Commands

```bash
npm run dev            # Start all development servers
npm run build          # Build all packages and apps
npm run test           # Run all tests
npm run lint           # Lint all code
npm run lint:fix       # Fix auto-correctable linting issues
npm run format         # Format all code with Prettier
npm run type-check     # Run TypeScript compilation check
npm run clean          # Clean all build artifacts and dependencies
npm run check          # Run complete quality check pipeline
```

#### Package-Specific Commands

```bash
# Backend API Development
cd packages/backend
npm run dev            # Start with nodemon hot reload
npm run build          # Build TypeScript to JavaScript
npm run start          # Start production server

# Desktop App Development
cd apps/desktop
npm run dev            # Start Electron in development mode
npm run build          # Build main and renderer processes
npm run dist           # Create distributable packages

# CLI Development
cd apps/cli
npm run dev            # Build and link for development
npm run build          # Build TypeScript
npm link               # Link globally for testing

# VS Code Extension Development
cd apps/vscode-extension
npm run compile        # Compile TypeScript
npm run watch          # Watch mode for development
npm run package        # Create .vsix package
```

### Git Workflow

#### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/\***: Individual feature branches
- **hotfix/\***: Emergency fixes

#### Commit Convention

```bash
# Format: type(scope): description
feat(cli): add interactive card creation mode
fix(desktop): resolve sidebar navigation issue
docs(api): update AnkiConnect integration guide
style(shared): apply prettier formatting
refactor(backend): extract validation middleware
test(cli): add unit tests for config commands
```

#### Pre-commit Hooks

Automated quality checks run before each commit:

- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Lint-staged**: Only check staged files

```bash
# Manual pre-commit check
npm run precommit

# Skip hooks (not recommended)
git commit --no-verify
```

## 🔧 Component Development

### Shared Package Development

**Location**: `packages/shared/`
**Purpose**: Types, utilities, constants shared across all components

#### Adding New Types

```typescript
// packages/shared/src/types.ts
import { z } from 'zod';

// Define Zod schema for runtime validation
export const NewFeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean().default(true),
  config: z.record(z.any()).optional(),
});

// Infer TypeScript type
export type NewFeature = z.infer<typeof NewFeatureSchema>;
```

#### Adding Utilities

```typescript
// packages/shared/src/utils.ts
export function formatTimestamp(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### Backend Development

**Location**: `packages/backend/`
**Stack**: Express.js + TypeScript + AnkiConnect integration

#### Adding New API Endpoints

```typescript
// packages/backend/src/routes/newFeature.ts
import { Router } from 'express';
import { z } from 'zod';
import { NewFeatureSchema } from '@ankiniki/shared';

const router = Router();

router.post('/new-feature', async (req, res) => {
  try {
    // Validate request body
    const data = NewFeatureSchema.parse(req.body);

    // Process the data
    const result = await processNewFeature(data);

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
```

#### Adding Middleware

```typescript
// packages/backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  // Validate token logic here
  next();
}
```

### Desktop App Development

**Location**: `apps/desktop/`
**Stack**: Electron + React + TypeScript

#### Main Process Development

```typescript
// apps/desktop/src/main/newFeature.ts
import { ipcMain } from 'electron';

export function setupNewFeature() {
  ipcMain.handle('new-feature:action', async (_event, data) => {
    try {
      // Process data in main process
      const result = await processInMainProcess(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
```

#### Renderer Process (React)

```typescript
// apps/desktop/src/renderer/components/NewFeature.tsx
import React, { useState, useEffect } from 'react';

interface NewFeatureProps {
  onAction: (data: any) => void;
}

export function NewFeature({ onAction }: NewFeatureProps) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Access Electron API through preload
    window.electronAPI?.onNewFeature((featureData) => {
      setData(featureData);
    });
  }, []);

  const handleAction = async () => {
    const result = await window.electronAPI?.newFeatureAction(data);
    onAction(result);
  };

  return (
    <div className="new-feature">
      {/* Component UI */}
      <button onClick={handleAction}>Execute Action</button>
    </div>
  );
}
```

### CLI Development

**Location**: `apps/cli/`  
**Stack**: Commander.js + TypeScript

#### Adding New Commands

```typescript
// apps/cli/src/commands/newCommand.ts
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

export function createNewCommand(): Command {
  const command = new Command('new-command');

  command
    .description('Description of the new command')
    .argument('[required-arg]', 'Description of required argument')
    .option('-f, --flag', 'Description of optional flag')
    .option('-v, --value <value>', 'Description of value option')
    .action(async (requiredArg, options) => {
      const spinner = ora('Processing...').start();

      try {
        // Command logic here
        const result = await executeCommand(requiredArg, options);

        spinner.succeed('Command completed successfully');
        console.log(chalk.green('Result:'), result);
      } catch (error) {
        spinner.fail('Command failed');
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  return command;
}
```

### VS Code Extension Development

**Location**: `apps/vscode-extension/`
**Stack**: VS Code Extension API + TypeScript

#### Adding New Commands

```typescript
// apps/vscode-extension/src/commands/newCommand.ts
import * as vscode from 'vscode';

export async function registerNewCommand(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('ankiniki.newCommand', async () => {
    try {
      // Command logic
      const result = await executeNewCommand();

      vscode.window.showInformationMessage(`Command completed: ${result}`);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

  context.subscriptions.push(command);
}
```

#### Adding Configuration Options

```json
// apps/vscode-extension/package.json
{
  "contributes": {
    "configuration": {
      "title": "Ankiniki",
      "properties": {
        "ankiniki.newSetting": {
          "type": "boolean",
          "default": true,
          "description": "Description of the new setting"
        }
      }
    }
  }
}
```

## 🧪 Testing Strategy

### Test Structure

```
packages/shared/
├── src/
│   ├── types.test.ts       # Type validation tests
│   └── utils.test.ts       # Utility function tests
├── __tests__/              # Integration tests
└── __mocks__/              # Test mocks

apps/cli/
├── src/
│   └── commands/
│       └── add.test.ts     # Command tests
└── __tests__/              # E2E CLI tests
```

### Unit Testing

```typescript
// packages/shared/src/utils.test.ts
import { formatTimestamp, validateEmail } from './utils';

describe('Utility Functions', () => {
  describe('formatTimestamp', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-12-08T10:30:00Z');
      expect(formatTimestamp(date)).toBe('2024-12-08');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });
  });
});
```

### Integration Testing

```typescript
// apps/cli/__tests__/integration.test.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('CLI Integration Tests', () => {
  it('should show help when no command provided', async () => {
    const { stdout } = await execAsync('ankiniki --help');
    expect(stdout).toContain('Usage:');
  });

  it('should handle config commands', async () => {
    const { stdout } = await execAsync('ankiniki config --show');
    expect(stdout).toContain('Configuration:');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific package
cd packages/shared && npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 🚀 Building and Deployment

### Build Process

#### Development Builds

```bash
# Build all packages in dependency order
npm run build

# Build specific package
cd packages/shared && npm run build

# Watch mode for development
npm run build -- --watch
```

#### Production Builds

```bash
# Clean build from scratch
npm run clean
npm install
npm run build

# Create desktop app distributables
cd apps/desktop
npm run build
npm run dist

# Package VS Code extension
cd apps/vscode-extension
npm run compile
npm run package  # Creates .vsix file
```

### Release Process

#### 1. Version Management

```bash
# Update version in all packages
npm version patch   # Bug fixes
npm version minor   # New features
npm version major   # Breaking changes
```

#### 2. Create Release

```bash
# Build everything
npm run build

# Run quality checks
npm run check

# Run all tests
npm test

# Create git tag
git tag -a v0.2.0 -m "Release version 0.2.0"
git push origin v0.2.0
```

#### 3. Publish Components

```bash
# Publish CLI to npm (when ready)
cd apps/cli
npm publish

# Submit VS Code extension to marketplace
cd apps/vscode-extension
vsce publish

# Create desktop app releases (manual)
cd apps/desktop
npm run dist
# Upload artifacts to GitHub Releases
```

## 🔍 Debugging

### Backend Debugging

```bash
# Start with debug logging
NODE_ENV=development npm run dev

# Use VS Code debugger
# Add breakpoints and use F5 debug configuration
```

### Desktop App Debugging

```typescript
// Enable DevTools in development
// apps/desktop/src/main/main.ts
if (isDev) {
  mainWindow.webContents.openDevTools();
}
```

### VS Code Extension Debugging

1. Open `apps/vscode-extension` in VS Code
2. Press `F5` to launch Extension Development Host
3. Set breakpoints in TypeScript code
4. Use Debug Console for logging

### CLI Debugging

```bash
# Add debug flag to commands
ankiniki add --debug "test" "test"

# Use Node.js debugger
node --inspect apps/cli/dist/index.js config --show
```

## 🤝 Contributing

### Code Style Guidelines

#### TypeScript Style

- Use `interface` over `type` for object definitions
- Prefer explicit return types for public APIs
- Use `const` assertions where appropriate
- Avoid `any` - use `unknown` for uncertain types

#### Naming Conventions

- **Files**: `kebab-case` (`user-service.ts`)
- **Functions**: `camelCase` (`getUserData`)
- **Classes**: `PascalCase` (`UserService`)
- **Constants**: `UPPER_SNAKE_CASE` (`API_ENDPOINTS`)
- **Interfaces**: `PascalCase` (`UserData`)

#### Import Organization

```typescript
// 1. Node modules
import express from 'express';
import chalk from 'chalk';

// 2. Internal packages
import { Card, Deck } from '@ankiniki/shared';

// 3. Relative imports
import { validateInput } from '../utils/validation';
import { logger } from './logger';
```

### Pull Request Process

#### 1. Before Starting

- Check existing issues and PRs
- Discuss major changes in GitHub Issues
- Fork the repository
- Create feature branch from `develop`

#### 2. Development

```bash
# Create feature branch
git checkout -b feature/new-awesome-feature

# Make changes with descriptive commits
git commit -m "feat(cli): add interactive deck selection"

# Keep branch updated
git rebase develop
```

#### 3. Quality Checks

```bash
# Run all quality checks
npm run check

# Fix any issues
npm run lint:fix
npm run format

# Ensure tests pass
npm test

# Build successfully
npm run build
```

#### 4. Pull Request

- **Title**: Clear, descriptive summary
- **Description**: Detailed explanation of changes
- **Testing**: How to test the changes
- **Screenshots**: For UI changes
- **Breaking Changes**: Document any breaking changes

### Code Review Guidelines

#### For Authors

- Keep PRs focused and small
- Write clear commit messages
- Add tests for new functionality
- Update documentation
- Respond to feedback promptly

#### For Reviewers

- Check code quality and consistency
- Verify tests cover new functionality
- Test changes locally when possible
- Provide constructive feedback
- Approve when ready

## 📚 Advanced Topics

### Custom AnkiConnect Extensions

```typescript
// packages/shared/src/ankiConnect.ts
export interface CustomAnkiAction {
  action: string;
  params: Record<string, any>;
}

export class CustomAnkiConnectClient extends AnkiConnectClient {
  async customAction(params: any): Promise<any> {
    return this.request('customAction', params);
  }
}
```

### Plugin Architecture (Future)

```typescript
// Define plugin interface
interface AnkinikiPlugin {
  name: string;
  version: string;
  activate(context: PluginContext): void;
  deactivate(): void;
}

// Plugin example
class MarkdownPlugin implements AnkinikiPlugin {
  name = 'markdown-support';
  version = '1.0.0';

  activate(context: PluginContext) {
    context.registerCommand('convertMarkdown', this.convertMarkdown);
  }

  deactivate() {
    // Cleanup
  }

  private convertMarkdown(content: string): string {
    // Convert markdown to HTML
    return content;
  }
}
```

### Performance Optimization

- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Cache AnkiConnect responses
- Optimize bundle sizes with code splitting
- Profile memory usage in long-running processes

## 🔗 Resources

### Documentation

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Electron Documentation](https://www.electronjs.org/docs)
- [AnkiConnect API](https://github.com/FooSoft/anki-connect)

### Tools and Libraries

- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Zod](https://github.com/colinhacks/zod) - Schema validation
- [Chalk](https://github.com/chalk/chalk) - Terminal styling
- [Ora](https://github.com/sindresorhus/ora) - Terminal spinners

### Community

- [GitHub Issues](https://github.com/iray-tno/ankiniki/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/iray-tno/ankiniki/discussions) - Community discussions
- [Anki Community](https://www.reddit.com/r/Anki/) - General Anki discussions

---

This developer guide provides a comprehensive foundation for contributing to Ankiniki. For specific questions or clarifications, please open a GitHub Issue or Discussion. Happy coding! 🚀
