# Technology Stack

## Core Technologies
- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 18+
- **Package Manager**: npm 9+
- **Architecture**: Monorepo with npm workspaces

## Frontend Stack
- **Framework**: React 18+ with React 17+ JSX transform
- **Desktop**: Electron (main + renderer processes)
- **Mobile**: React Native (planned Phase 3)
- **Web**: React SPA (planned)
- **Styling**: CSS Modules/Styled Components (TBD)

## Backend Stack
- **Framework**: Express.js
- **API Integration**: AnkiConnect API
- **Validation**: Zod schemas for runtime type validation
- **HTTP Client**: Fetch/Axios (for AnkiConnect)
- **Process Management**: PM2/nodemon for development

## CLI Stack
- **Framework**: Commander.js
- **Interactive Prompts**: Inquirer.js (likely)
- **Terminal UI**: Chalk for colors

## Development Tools
- **Type Checking**: TypeScript 5.1+
- **Code Quality**: ESLint with TypeScript plugin
- **Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged
- **Build System**: Native TypeScript compiler + bundlers
- **Testing**: Jest (implied by test scripts)

## AI/ML Stack (Planned Phase 2)
- **ML Backend**: Python microservice
- **Content Processing**: NLP libraries for text extraction
- **API Communication**: REST/GraphQL between services

## Platform Compatibility
- **OS**: Windows, macOS, Linux (WSL2)
- **Node Versions**: 18+ (with engines specification)
- **Browser**: Modern ES2022 compatible browsers