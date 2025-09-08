# Code Style and Conventions

## TypeScript Guidelines
- **Strict Mode**: All projects use strict TypeScript with `noEmit: true`
- **Type Safety**: Prefer `interface` over `type` for object definitions
- **No `any`**: Use proper typing, `unknown` for uncertain types
- **Explicit Returns**: Use explicit return types for public APIs
- **Zod Schemas**: Runtime validation with TypeScript type inference

## Code Formatting (Prettier)
- **Line Length**: 80 characters
- **Quotes**: Single quotes for strings and JSX
- **Semicolons**: Always required
- **Trailing Commas**: ES5 compatible (required)
- **Indentation**: 2 spaces, no tabs
- **Arrow Functions**: Avoid parentheses around single parameters
- **JSX**: Bracket on new line, single quotes

## ESLint Rules (Key Enforcements)
- **Unused Variables**: Error (prefix with `_` to ignore)
- **Console**: Warn in general code, allowed in CLI
- **Type Definitions**: Prefer interfaces over type aliases
- **Modern JS**: Prefer const, no var, template literals, arrow functions
- **Code Quality**: Always strict equality, curly braces, no debugger

## Naming Conventions
- **Files**: kebab-case (`card-editor.tsx`, `anki-connect.ts`)
- **Components**: PascalCase (`CardEditor`, `DeckList`)
- **Functions**: camelCase (`createCard`, `validateInput`)  
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`, `API_ENDPOINTS`)
- **Types/Interfaces**: PascalCase (`Card`, `ApiResponse`, `AnkiConnectRequest`)
- **Directories**: kebab-case (`anki-connect`, `card-editor`)

## File Organization Patterns
```
packages/shared/src/
├── types.ts          # Zod schemas + TypeScript types
├── utils.ts          # Utility functions  
└── constants.ts      # Application constants

packages/backend/src/
├── routes/           # API endpoint handlers
├── services/         # Business logic (AnkiConnect client)
├── middleware/       # Express middleware
├── config/          # Configuration management
└── utils/           # Backend utilities

apps/desktop/src/
├── main/            # Electron main process
└── renderer/        # React frontend components

apps/cli/src/
├── commands/        # CLI command implementations
├── utils/           # CLI-specific utilities
└── index.ts         # Main CLI entry point
```

## Import Organization
- External libraries first
- Internal workspace packages (`@ankiniki/shared`)  
- Relative imports last
- Type-only imports explicitly marked

## Error Handling
- Custom error classes extending base Error
- Zod validation for input sanitization
- Proper error boundaries in React components
- Graceful degradation for AnkiConnect connection failures