# Project Structure

## Monorepo Layout
```
ankiniki/
├── packages/                    # Shared packages
│   ├── shared/                 # Common types and utilities
│   │   ├── src/
│   │   │   ├── types.ts       # Zod schemas + TypeScript interfaces
│   │   │   ├── utils.ts       # Utility functions
│   │   │   └── constants.ts   # Application constants  
│   │   └── package.json
│   └── backend/               # Express.js API server
│       ├── src/
│       │   ├── app.ts         # Express app configuration
│       │   ├── index.ts       # Server entry point
│       │   ├── routes/        # API endpoints (health, cards, decks)
│       │   ├── services/      # Business logic (AnkiConnect client)
│       │   ├── middleware/    # Express middleware (error handling)
│       │   ├── config/        # Configuration management  
│       │   └── utils/         # Backend utilities (logger)
│       └── package.json
├── apps/                       # Application entry points
│   ├── desktop/               # Electron desktop application
│   │   ├── src/
│   │   │   ├── main/          # Electron main process
│   │   │   └── renderer/      # React frontend components
│   │   └── package.json
│   ├── cli/                   # Command-line interface tool
│   │   ├── src/
│   │   │   ├── commands/      # CLI command implementations
│   │   │   ├── utils/         # CLI-specific utilities
│   │   │   └── index.ts       # Commander.js entry point
│   │   └── package.json
│   └── vscode-extension/      # VS Code extension (future)
├── docs/                      # Documentation
│   ├── en/                    # English documentation
│   └── ja/                    # Japanese documentation  
├── scripts/                   # Development and build scripts
├── .husky/                    # Git hooks configuration
├── .serena/                   # Serena MCP configuration
└── Configuration Files:
    ├── package.json           # Monorepo root configuration
    ├── tsconfig.json          # TypeScript project references
    ├── .eslintrc.js          # ESLint configuration with overrides
    ├── .prettierrc.js        # Prettier formatting rules
    ├── .mcp.json             # Serena MCP server setup
    └── DEVELOPMENT.md        # Developer workflow guide
```

## Dependency Architecture
- **Shared Package**: Core types, utilities, Zod schemas (foundation layer)
- **Backend Package**: Depends on shared, provides API server
- **Desktop App**: Depends on shared, consumes backend API  
- **CLI App**: Depends on shared, consumes backend API
- **External Integration**: AnkiConnect API (all apps communicate through this)

## Key Design Patterns
- **Monorepo**: npm workspaces for code sharing and coordinated development
- **Companion Tool**: Extends Anki rather than replacing it
- **API-First**: Backend provides REST API consumed by all frontend applications
- **Type Safety**: Zod schemas provide runtime validation + TypeScript types
- **Modular Architecture**: Clear separation between packages and applications

## Entry Points
- **Backend Server**: `packages/backend/src/index.ts`
- **Desktop App**: `apps/desktop/src/main/main.ts` (Electron main)
- **CLI Tool**: `apps/cli/src/index.ts` (Commander.js)
- **Shared Library**: `packages/shared/src/index.ts` (exports)

## Development Configuration
- **TypeScript**: Project references enable cross-package type checking
- **ESLint**: Package-specific rule overrides (React for desktop, console allowed in CLI)
- **Build Order**: Shared → Backend → Apps (dependency-driven)
- **Hot Reload**: Individual package development servers with file watching