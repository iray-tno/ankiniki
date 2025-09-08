# Development Workflow

## Daily Development Process

### 1. Start Development Environment
```bash
# Option A: Start everything at once
npm run dev

# Option B: Start components individually (preferred for focused work)
cd packages/backend && npm run dev    # API server (port 3001)
cd apps/desktop && npm run dev        # Electron app
cd apps/cli && npm run build && npm link  # CLI development
```

### 2. Development Cycle
1. **Write Code**: Follow TypeScript strict mode and established patterns
2. **Live Testing**: Use hot reload for backend/frontend, rebuild CLI as needed
3. **Quality Check**: Run `npm run check` frequently during development
4. **Commit**: Git hooks automatically enforce quality standards

### 3. Pre-Commit Validation
Git hooks automatically run:
- ESLint with auto-fixing
- Prettier formatting  
- Type checking validation
- Only on staged files (performance optimized)

## Testing Integration with Anki

### AnkiConnect Setup Required
1. **Anki Application**: Must be running during development
2. **AnkiConnect Addon**: Install with code `2055492159`
3. **CORS Configuration**: May need to configure for local development
4. **Port 8765**: Default AnkiConnect port (configurable in backend)

### Development Testing Flow
```bash
# 1. Ensure Anki is running with AnkiConnect
# 2. Start backend API server
cd packages/backend && npm run dev

# 3. Test API connectivity
curl http://localhost:3001/health
curl http://localhost:3001/api/decks

# 4. Test desktop app with live backend
cd apps/desktop && npm run dev

# 5. Test CLI with built version
cd apps/cli && npm run build && npm link
ankiniki config --show
ankiniki list
```

## Debugging Workflow

### Backend API Debugging
- **Logs**: Check console output from `npm run dev`
- **API Testing**: Use curl, Postman, or browser dev tools
- **AnkiConnect**: Verify Anki connection with direct API calls
- **Environment**: Check `.env` file in `packages/backend/`

### Desktop App Debugging  
- **Electron DevTools**: Available in development mode
- **React DevTools**: Browser extension works in Electron renderer
- **Main Process**: Console logs in terminal running `npm run dev`
- **Renderer Process**: DevTools in Electron window

### CLI Debugging
- **Verbose Output**: Use debug flags if implemented
- **Global Link**: `npm link` for testing without reinstallation
- **Configuration**: Check CLI config files for connection settings

## Build and Distribution

### Development Builds
```bash
npm run build                    # Build all packages in dependency order
cd packages/shared && npm run build    # Individual package build
```

### Production Distribution
```bash
# Desktop app distributables
cd apps/desktop
npm run build                    # Build renderer and main
npm run dist                     # Create platform-specific installers

# CLI global installation  
cd apps/cli
npm run build                    # Build to JavaScript
npm link                         # Link globally for testing
# Or: npm publish for registry distribution
```

## Code Quality Integration

### Continuous Quality Enforcement
- **Pre-commit**: Automatic linting and formatting
- **IDE Integration**: VS Code settings for real-time feedback
- **Type Checking**: Continuous TypeScript validation
- **Import Organization**: Automatic import sorting

### Manual Quality Checks
```bash
npm run check           # Complete quality pipeline
npm run lint:fix        # Fix auto-correctable issues
npm run format          # Apply consistent formatting
npm run type-check      # Validate TypeScript compilation
```

## Monorepo Development Best Practices

### Workspace Dependencies
- Use `"*"` for internal package references in package.json
- Build shared packages before dependent packages
- Leverage TypeScript project references for type checking

### Cross-Package Development
- Changes to shared package require rebuilding dependent packages
- Use `npm run build` from root to build in dependency order
- Test changes across all consuming applications

### Version Management
- Coordinate version bumps across related packages
- Maintain compatibility between internal package versions
- Use semantic versioning for public API changes