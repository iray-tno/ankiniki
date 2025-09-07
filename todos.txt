# Ankiniki Phase 1 MVP Implementation Plan

## Phase 1 Goals (MVP - Minimum Viable Product)
Based on strategy.md analysis, Phase 1 focuses on:
- Desktop-first approach with Electron app
- VS Code extension for IDE integration  
- CLI tool for power users
- Basic markdown and syntax highlighting
- AnkiConnect integration

## Implementation Tasks

### 1. Project Setup & Architecture
[ ] Initialize monorepo structure with workspaces
[ ] Set up TypeScript configuration
[ ] Configure ESLint, Prettier, and pre-commit hooks
[ ] Set up build scripts and CI/CD pipeline
[ ] Create shared types and utilities package

### 2. Core Backend (Node.js)
[ ] Set up Express.js server with TypeScript
[ ] Implement AnkiConnect client wrapper
[ ] Create card management API endpoints
[ ] Add basic authentication/session management
[ ] Implement error handling and logging
[ ] Add configuration management system

### 3. Electron Desktop App
[ ] Initialize Electron app with React frontend
[ ] Set up main process and renderer communication
[ ] Implement basic UI layout with sidebar navigation
[ ] Create markdown editor with live preview
[ ] Add syntax highlighting for code blocks
[ ] Implement card creation and editing forms
[ ] Add deck management interface
[ ] Create review interface with Anki-style card display
[ ] Add settings/preferences screen
[ ] Implement auto-updater functionality

### 4. VS Code Extension
[ ] Set up VS Code extension project structure
[ ] Create extension manifest and configuration
[ ] Implement command palette commands:
  - "Add selected text as flashcard"
  - "Add code block as flashcard"
  - "Quick card creation"
[ ] Add keyboard shortcuts for common actions
[ ] Create sidebar webview for card management
[ ] Implement inline card review within VS Code
[ ] Add status bar integration
[ ] Create extension settings and configuration

### 5. CLI Tool
[ ] Set up CLI project with Commander.js
[ ] Implement core commands:
  - `ankiniki add [deck-name] "question" "answer"`
  - `ankiniki study [deck-name]`
  - `ankiniki list-decks`
  - `ankiniki import [file-path]`
[ ] Add interactive mode for card creation
[ ] Implement configuration file support
[ ] Add help documentation and examples
[ ] Create install/setup scripts

### 6. Shared Components & Libraries
[ ] Create React component library for cards
[ ] Build markdown parser with syntax highlighting
[ ] Implement card templates system
[ ] Create utilities for AnkiConnect communication
[ ] Build shared validation schemas
[ ] Add internationalization (i18n) support

### 7. AnkiConnect Integration
[ ] Test AnkiConnect API connectivity
[ ] Implement deck creation and management
[ ] Add card CRUD operations
[ ] Implement media file handling
[ ] Add sync status monitoring
[ ] Create fallback/offline mode handling

### 8. Testing & Quality Assurance
[ ] Set up Jest testing framework
[ ] Write unit tests for core functions
[ ] Add integration tests for AnkiConnect
[ ] Create E2E tests for Electron app
[ ] Test VS Code extension functionality
[ ] Perform CLI tool testing across platforms
[ ] Add performance benchmarking

### 9. Documentation & Deployment
[ ] Create API documentation
[ ] Write user guides for each component
[ ] Set up GitHub releases and versioning
[ ] Create installation instructions
[ ] Add troubleshooting guides
[ ] Prepare demo content and examples

### 10. Security & Performance
[ ] Implement input sanitization
[ ] Add rate limiting for API calls
[ ] Optimize bundle sizes for Electron
[ ] Add error reporting and analytics
[ ] Implement data backup strategies
[ ] Security audit and vulnerability scanning

## Priority Order for Development

### Week 1-2: Foundation
1. Project setup and monorepo structure
2. Core Node.js backend with AnkiConnect
3. Basic Electron app skeleton

### Week 3-4: Core Functionality  
4. Markdown editor and syntax highlighting
5. Card creation and management UI
6. AnkiConnect integration and testing

### Week 5-6: Extensions
7. VS Code extension development
8. CLI tool implementation
9. Cross-platform testing

### Week 7-8: Polish & Release
10. Documentation and user guides
11. Testing and bug fixes
12. First release preparation

## Technical Considerations

### Risk Mitigation
- AnkiConnect dependency: Test early and implement fallbacks
- Cross-platform compatibility: Use established libraries
- Performance: Profile early, optimize bundle sizes

### Success Metrics for MVP
- Successfully create and sync cards with Anki
- VS Code extension works with basic commands
- CLI tool handles common workflows
- Electron app provides better UX than native Anki for card creation

## Future Phase 2 Considerations
- Keep architecture modular for AI integration
- Design APIs with ML pipeline integration in mind
- Plan for Python microservice communication patterns