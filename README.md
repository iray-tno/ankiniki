# Ankiniki - Anki Companion Tool for Engineers

Ankiniki is an Anki companion tool specifically designed for engineers' technical learning. It provides a modern flashcard experience that seamlessly integrates with developers' workflows while leveraging Anki's powerful spaced repetition algorithm.

## 🚀 Project Vision

Eliminate Anki's biggest barrier - the manual effort of card creation - allowing engineers to focus on mastering technical knowledge.

### Problems We Solve

- ❌ **Manual Card Creation Labor**: Time-consuming card creation process every time you learn new technology
- ❌ **Limited Technical Content Support**: Lack of native support for code blocks, diagrams, and markdown
- ❌ **Workflow Fragmentation**: Context switching between development environment and Anki

## ✨ Key Features

### 🤖 AI-Powered Card Generation
- Automatic flashcard generation from technical articles, code snippets, and PDFs
- Efficient knowledge extraction through incremental reading
- Support for multiple input formats (Markdown, code, PDF, etc.)

### 💻 Developer-Focused Content Management
- **Code Blocks**: Native syntax highlighting
- **Diagrams**: Built-in Mermaid diagram support
- **LaTeX**: Mathematical formula rendering
- **Markdown**: Rich markdown editor with live preview

### 🔧 Workflow Integration
- **VS Code Extension**: Card creation and review within your IDE
- **CLI**: Quick card addition from terminal
- **Keyboard Shortcuts**: Instantly convert selected code to flashcards

### 🌐 Cross-Platform
- Desktop (Electron)
- Web (React)
- Mobile (React Native)

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React, TypeScript
- **Desktop**: Electron
- **Mobile**: React Native
- **Backend**: Node.js
- **AI/ML**: Python (microservice)
- **Data**: AnkiConnect API (integrates with existing Anki)

### Companion Tool Strategy
Ankiniki is not a replacement for Anki but a companion tool with full compatibility with existing Anki databases. All data is managed within Anki through the AnkiConnect API.

## 📈 Development Roadmap

### Phase 1: MVP (Minimum Viable Product) ✅
- [x] **Backend API**: Express.js server with AnkiConnect integration
- [x] **Electron Desktop App**: React-based GUI with card editor and study interface
- [x] **CLI Tool**: Command-line interface for quick card creation
- [x] **Shared Types**: TypeScript definitions and utilities
- [x] **Monorepo Setup**: Workspace-based project structure

### Phase 2: AI Integration (Planned)
- [ ] Python ML microservice
- [ ] Automatic card generation
- [ ] Content ingestion pipeline
- [ ] VS Code extension

### Phase 3: Full Feature Set (Future)
- [ ] React Native mobile app
- [ ] Mermaid diagram support
- [ ] Advanced customization features

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm 9+
- **Anki** desktop application
- **AnkiConnect** addon installed in Anki

### Installation

1. **Clone and setup the project**:
```bash
git clone https://github.com/iray-tno/ankiniki.git
cd ankiniki
npm install
```

2. **Install AnkiConnect addon**:
   - Open Anki → Tools → Add-ons → Get Add-ons
   - Enter code: `2055492159`
   - Restart Anki

3. **Build all packages**:
```bash
npm run build
```

## 🛠️ Development

### Project Structure
```
ankiniki/
├── packages/
│   ├── shared/          # Shared types and utilities
│   └── backend/         # Express.js API server
├── apps/
│   ├── desktop/         # Electron desktop app
│   └── cli/             # Command-line tool
├── docs/                # Documentation
└── tools/               # Build and development tools
```

### Available Scripts

#### Root Level
```bash
npm run build          # Build all packages and apps
npm run dev            # Start all development servers
npm run test           # Run all tests
npm run lint           # Lint all code
npm run clean          # Clean all build artifacts
```

#### Backend Server (`packages/backend`)
```bash
cd packages/backend
npm run dev            # Start development server with hot reload
npm run build          # Build TypeScript to JavaScript
npm run start          # Start production server
```

#### Desktop App (`apps/desktop`)
```bash
cd apps/desktop
npm run dev            # Start Electron in development mode
npm run build          # Build renderer and main process
npm run dist           # Create distributable packages
```

#### CLI Tool (`apps/cli`)
```bash
cd apps/cli
npm run build          # Build CLI executable
npm link               # Link globally for development
ankiniki --help        # Test CLI commands
```

### Development Workflow

1. **Start the backend server**:
```bash
cd packages/backend
npm run dev
```

2. **Start the desktop app** (in another terminal):
```bash
cd apps/desktop
npm run dev
```

3. **Test the CLI** (after building):
```bash
cd apps/cli
npm run build
npm link
ankiniki config --show
```

## 🎯 Usage Examples

### CLI Quick Start
```bash
# Configure AnkiConnect connection
ankiniki config --edit

# Add a quick flashcard
ankiniki add "What is React?" "A JavaScript library for building user interfaces"

# Interactive card creation
ankiniki add --interactive

# Study cards from terminal
ankiniki study "JavaScript Fundamentals" --count 5

# List all decks
ankiniki list
```

### Desktop App
1. Launch the desktop app
2. Configure AnkiConnect URL in Settings
3. Create or select a deck
4. Use the card editor to create flashcards with syntax highlighting
5. Study cards with the built-in review interface

### API Server
```bash
# Start the backend server
cd packages/backend
npm run dev

# Test API endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/decks
```

## 🔧 Configuration

### AnkiConnect Setup
Ensure AnkiConnect is properly configured in Anki:

1. **Install the addon** (code: 2055492159)
2. **Configure CORS** (if needed):
   - Anki → Tools → Add-ons → AnkiConnect → Config
   - Add your domain to webCorsOriginList

### Environment Variables
Create a `.env` file in `packages/backend/`:
```env
PORT=3001
ANKI_CONNECT_URL=http://localhost:8765
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Test specific package
cd packages/backend && npm test
cd packages/shared && npm test
```

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot connect to Anki"**:
   - Make sure Anki is running
   - Verify AnkiConnect addon is installed
   - Check if Anki is listening on port 8765

2. **"Permission denied" errors**:
   - Check AnkiConnect CORS configuration
   - Ensure firewall isn't blocking connections

3. **Build errors**:
   - Delete `node_modules` and reinstall: `npm run clean && npm install`
   - Ensure you're using Node.js 18+

### Debug Mode
Enable debug logging:
```bash
# CLI
ankiniki config --set debugMode=true

# Backend
NODE_ENV=development npm run dev
```

## 🤝 Contributing

We welcome contributions to the project! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

This project is released under the [MIT License](LICENSE).

## 📚 Documentation

For detailed design philosophy and market analysis, please refer to the [strategy document](strategy.md).

---

**Made with ❤️ for engineers who want to learn efficiently**