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

### Phase 1: MVP (Minimum Viable Product)
- [ ] VS Code extension
- [ ] Basic Electron desktop app
- [ ] CLI interface
- [ ] Markdown and code highlighting features

### Phase 2: AI Integration
- [ ] Python ML microservice
- [ ] Automatic card generation
- [ ] Content ingestion pipeline

### Phase 3: Full Feature Set
- [ ] React Native mobile app
- [ ] Mermaid diagram support
- [ ] Advanced customization features

## 🛠️ Development Setup

```bash
# Clone the repository
git clone https://github.com/your-username/ankiniki.git
cd ankiniki

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🤝 Contributing

We welcome contributions to the project! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

This project is released under the [MIT License](LICENSE).

## 📚 Documentation

For detailed design philosophy and market analysis, please refer to the [strategy document](strategy.md).

---

**Made with ❤️ for engineers who want to learn efficiently**