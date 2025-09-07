# Ankiniki Knowledge Base for AI Assistant

## Project Architecture Deep Dive

### Monorepo Structure
```
ankiniki/
├── .serena/                 # AI assistant configuration
├── packages/
│   ├── shared/             # Common types and utilities
│   │   ├── src/
│   │   │   ├── types.ts    # Zod schemas and TypeScript types
│   │   │   ├── utils.ts    # Helper functions
│   │   │   ├── constants.ts # Project constants
│   │   │   └── index.ts    # Package exports
│   │   └── package.json
│   └── backend/            # Express.js API server
│       ├── src/
│       │   ├── app.ts      # Express app configuration
│       │   ├── index.ts    # Server entry point
│       │   ├── config/     # Environment configuration
│       │   ├── middleware/ # Express middleware
│       │   ├── routes/     # API route handlers
│       │   ├── services/   # Business logic
│       │   └── utils/      # Backend utilities
│       └── package.json
├── apps/
│   ├── desktop/            # Electron desktop application
│   │   ├── src/
│   │   │   ├── main/       # Electron main process
│   │   │   │   ├── main.ts # Main process entry
│   │   │   │   ├── preload.ts # Preload script
│   │   │   │   └── utils.ts # Main process utils
│   │   │   └── renderer/   # React frontend
│   │   │       ├── App.tsx
│   │   │       ├── components/
│   │   │       └── styles/
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── cli/                # Command-line interface
│       ├── src/
│       │   ├── index.ts    # CLI entry point
│       │   ├── commands/   # Command implementations
│       │   ├── config.ts   # CLI configuration
│       │   └── anki-client.ts # AnkiConnect client
│       └── package.json
├── scripts/                # Development and build scripts
├── docs/                   # Project documentation
└── package.json           # Root package.json with workspaces
```

## Technology Stack Details

### Core Technologies
- **TypeScript 5+**: Strict typing across all packages
- **Node.js 18+**: Runtime environment
- **npm Workspaces**: Monorepo package management
- **Zod**: Runtime schema validation
- **ESLint + Prettier**: Code quality and formatting

### Backend Stack (`packages/backend`)
- **Express.js**: Web server framework
- **Winston**: Logging library
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing
- **Axios**: HTTP client for AnkiConnect

### Desktop Stack (`apps/desktop`)
- **Electron**: Cross-platform desktop framework
- **React 18**: Frontend UI framework
- **Vite**: Build tool and dev server
- **CSS Modules**: Scoped styling

### CLI Stack (`apps/cli`)
- **Commander.js**: CLI framework
- **Inquirer.js**: Interactive prompts
- **Chalk**: Terminal colors
- **Ora**: Loading spinners

## API Integration Patterns

### AnkiConnect Communication
```typescript
// Core client pattern used throughout the project
export class AnkiConnectService {
  async request<T>(action: string, params: object = {}): Promise<T> {
    const response = await axios.post(this.baseURL, {
      action,
      version: 6,
      params
    });
    
    if (response.data.error) {
      throw new AnkiConnectError(response.data.error);
    }
    
    return response.data.result;
  }
}
```

### Key AnkiConnect Actions
```typescript
// Deck operations
await client.request('deckNames');
await client.request('createDeck', { deck: 'DeckName' });

// Note operations
await client.request('addNote', {
  note: {
    deckName: 'Target Deck',
    modelName: 'Basic',
    fields: { Front: 'Question', Back: 'Answer' },
    tags: ['tag1', 'tag2']
  }
});

// Query operations
await client.request('findNotes', { query: 'deck:"DeckName"' });
await client.request('notesInfo', { notes: [noteId1, noteId2] });
```

## Data Models and Types

### Core Types (from `packages/shared/src/types.ts`)
```typescript
// Card representation
export const CardSchema = z.object({
  id: z.string(),
  deckId: z.string(),
  front: z.string(),
  back: z.string(),
  tags: z.array(z.string()).default([]),
  created: z.date(),
  modified: z.date(),
  // Spaced repetition metadata
  due: z.date().optional(),
  interval: z.number().optional(),
  ease: z.number().optional(),
  reps: z.number().default(0),
});

// Deck representation
export const DeckSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  created: z.date(),
  modified: z.date(),
  cardCount: z.number().default(0),
});
```

### Configuration Types
```typescript
// Application configuration
export const ConfigSchema = z.object({
  ankiConnectUrl: z.string().default('http://localhost:8765'),
  ankiConnectTimeout: z.number().default(5000),
  autoSync: z.boolean().default(true),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
});
```

## Development Workflows

### Package Development Order
1. **Shared Package First**: All type definitions and utilities
2. **Backend Package**: API server with AnkiConnect integration
3. **CLI Package**: Command-line interface
4. **Desktop Package**: Electron application

### Build Process
```bash
# Install dependencies for all packages
npm install

# Build shared package (required by others)
cd packages/shared && npm run build

# Build all packages
npm run build

# Development mode
npm run dev  # Starts all dev servers in parallel
```

### Testing Strategy
```bash
# Unit tests for shared utilities
packages/shared/src/*.test.ts

# Backend API integration tests
packages/backend/src/**/*.test.ts

# CLI command tests
apps/cli/src/**/*.test.ts

# Electron app component tests
apps/desktop/src/**/*.test.ts
```

## Common Development Patterns

### Error Handling
```typescript
// Custom error classes for different failure modes
export class AnkiConnectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnkiConnectError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Usage in API routes
try {
  const result = await ankiConnect.addNote(...);
  res.json({ success: true, data: result });
} catch (error) {
  if (error instanceof AnkiConnectError) {
    res.status(502).json({ 
      success: false, 
      error: 'Anki connection failed' 
    });
  } else {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
```

### Configuration Management
```typescript
// Centralized config loading with environment overrides
export function loadConfig(): Config {
  return ConfigSchema.parse({
    ankiConnectUrl: process.env.ANKI_CONNECT_URL,
    ankiConnectTimeout: process.env.ANKI_CONNECT_TIMEOUT,
    // ... other env vars with defaults
  });
}
```

### CLI Command Pattern
```typescript
// Standard CLI command structure
export function createAddCommand(): Command {
  return new Command('add')
    .description('Add a new flashcard')
    .argument('[deck]', 'Deck name')
    .argument('[front]', 'Card front side')
    .argument('[back]', 'Card back side')
    .option('-t, --tags <tags>', 'Comma-separated tags')
    .action(async (deck, front, back, options) => {
      try {
        // Validation
        const cardData = validateCardInput({ deck, front, back, ...options });
        
        // AnkiConnect operation
        const noteId = await client.addNote(...);
        
        // Success feedback
        console.log(chalk.green(`Card added successfully! ID: ${noteId}`));
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}
```

## Security Considerations

### Electron Security
```typescript
// Secure preload script pattern
contextBridge.exposeInMainWorld('electronAPI', {
  // Only expose specific, sanitized APIs
  onMenuAction: (callback: () => void) => {
    ipcRenderer.on('menu-action', callback);
  },
  // Never expose raw ipcRenderer or Node.js APIs
});
```

### Input Sanitization
```typescript
// Sanitize user content before sending to Anki
export function sanitizeCardContent(content: string): string {
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
    .replace(/javascript:/gi, '') // Remove javascript: links
    .trim();
}
```

### CORS Configuration
```typescript
// Backend CORS setup for frontend communication
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
```

## Performance Optimizations

### Efficient Package Building
- Shared package built once, used by others
- TypeScript compilation with project references
- Vite for fast frontend development builds
- Electron builder for optimized distributables

### AnkiConnect Optimization
- Connection pooling and reuse
- Batch operations where possible
- Graceful degradation for offline mode
- Health check monitoring

### CLI Performance
- Lazy loading of heavy dependencies
- Streaming output for large operations
- Progress indicators for long-running tasks
- Efficient file processing

## Future Architecture Considerations

### AI/ML Integration Points
- Python microservice for content processing
- gRPC or REST API communication
- Queue system for batch processing
- Vector database for content similarity

### Mobile App Architecture
- React Native with shared business logic
- Offline-first data synchronization
- Platform-specific UI adaptations
- Background sync capabilities

### Scalability Patterns
- Microservice decomposition ready
- Database abstraction layer prepared
- Event-driven architecture foundations
- Cloud deployment configurations

This knowledge base provides the technical foundation needed to understand and contribute to the Ankiniki project effectively.