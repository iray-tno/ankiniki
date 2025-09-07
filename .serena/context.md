# Ankiniki - Project Context for AI Assistant

## Project Overview

Ankiniki is an Anki companion tool specifically designed for engineers and developers. It eliminates the manual effort of flashcard creation while providing modern UI/UX and seamless workflow integration.

### Mission Statement
Transform Anki from a manual, labor-intensive tool into an automated, integrated part of the developer learning workflow.

## Current Status (Phase 1 MVP - Completed)

### ✅ Completed Components
1. **Backend API Server** (`packages/backend`)
   - Express.js server with TypeScript
   - Complete AnkiConnect integration
   - REST API for cards and decks management
   - Health checks and error handling

2. **Electron Desktop App** (`apps/desktop`)
   - React-based modern UI
   - Card editor with syntax highlighting
   - Study interface with flashcard review
   - Settings management and deck organization

3. **CLI Tool** (`apps/cli`)
   - Commander.js-based CLI
   - Interactive card creation
   - Terminal-based study sessions
   - Configuration management

4. **Shared Infrastructure** (`packages/shared`)
   - TypeScript types and Zod schemas
   - Utility functions and constants
   - Error handling classes

## Architecture Principles

### 1. Companion Tool Strategy
- **NOT** an Anki replacement
- Uses AnkiConnect API for all data operations
- Maintains full compatibility with existing Anki installations
- Enhances workflow without disrupting user data

### 2. Developer-First Design
- Code syntax highlighting
- Markdown support with live preview
- IDE integration (planned)
- CLI for power users
- Cross-platform compatibility

### 3. Monorepo Structure
- Shared types and utilities
- Independent deployable packages
- Consistent development workflow
- Type-safe inter-package communication

## Key Technical Decisions

### AnkiConnect Integration
- All card data stored in Anki's database
- Real-time synchronization
- Health monitoring and connection testing
- Graceful error handling for offline scenarios

### TypeScript-First
- Strict type checking across all packages
- Zod runtime validation
- Shared type definitions
- Comprehensive error types

### Modern Development Stack
- ESLint + Prettier for code quality
- Husky git hooks
- VS Code integration
- Automated setup scripts

## Domain Knowledge

### Anki Concepts
- **Cards**: Question/answer pairs with scheduling metadata
- **Decks**: Collections of related cards
- **Models**: Card templates (Basic, Cloze, etc.)
- **Spaced Repetition**: Algorithm for optimal review timing
- **AnkiConnect**: Third-party addon enabling API access

### Developer Pain Points We Solve
1. **Manual Card Creation**: Time-consuming, interrupts flow
2. **Limited Tech Content Support**: Poor code/markdown rendering
3. **Workflow Fragmentation**: Context switching between tools
4. **Batch Processing**: No efficient way to process multiple sources

### Success Metrics
- Reduce card creation time from minutes to seconds
- Enable batch processing of technical content
- Maintain 100% Anki compatibility
- Provide better UX than native Anki for content creation

## Future Roadmap

### Phase 2 - AI Integration (Planned)
- Python ML microservice for content processing
- Automatic flashcard generation from documents
- VS Code extension for IDE integration
- Batch import from multiple sources

### Phase 3 - Advanced Features (Future)
- React Native mobile app
- Collaborative deck sharing
- Advanced analytics and insights
- Custom spaced repetition algorithms

## Development Guidelines

### Code Patterns
- Use Zod schemas for validation
- Implement proper error boundaries
- Follow React best practices for UI components
- Use async/await for all API calls
- Comprehensive TypeScript typing

### Testing Strategy
- Unit tests for utility functions
- Integration tests for AnkiConnect
- E2E tests for user workflows
- Mock Anki responses for reliable testing

### Security Considerations
- Input sanitization for card content
- Secure IPC in Electron app
- CORS configuration for API
- No secrets in client-side code

## Common Patterns & Utilities

### API Communication
```typescript
// Use the AnkiClient class for all AnkiConnect operations
const client = new AnkiClient();
await client.addNote(deckName, modelName, fields, tags);
```

### Error Handling
```typescript
// Use custom error classes from shared package
throw new AnkiConnectError('Connection failed');
throw new ValidationError('Invalid card data');
```

### Configuration Management
```typescript
// Centralized config with environment-specific overrides
const config = loadConfig();
```

### Type Definitions
```typescript
// All types defined with Zod for runtime validation
export const CardSchema = z.object({
  id: z.string(),
  front: z.string(),
  back: z.string(),
  // ...
});
```

## External Dependencies & Integrations

### Required External Services
- **Anki Desktop**: Must be running with AnkiConnect addon
- **AnkiConnect Addon**: Code 2055492159

### Development Tools
- Node.js 18+
- npm 9+
- TypeScript 5+
- VS Code (recommended)

### API Endpoints
- AnkiConnect: http://localhost:8765 (default)
- Backend API: http://localhost:3001 (development)

## Troubleshooting Common Issues

### AnkiConnect Connection
- Verify Anki is running
- Check AnkiConnect addon installation
- Test connection with health endpoint
- Review CORS configuration if needed

### Development Environment
- Run `npm run setup` for automated setup
- Use `npm run check` for quality validation
- Check Node.js version compatibility
- Verify workspace dependencies are resolved

This context should help you understand the project's goals, architecture, and current state when providing development assistance.