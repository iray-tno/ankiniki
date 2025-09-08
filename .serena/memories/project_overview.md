# Ankiniki Project Overview

## Purpose
Ankiniki is an Anki companion tool specifically designed for engineers' technical learning. It provides a modern flashcard experience that seamlessly integrates with developers' workflows while leveraging Anki's powerful spaced repetition algorithm.

### Key Problems Solved
- Manual card creation labor: Time-consuming card creation process for new technology
- Limited technical content support: Lack of native support for code blocks, diagrams, and markdown  
- Workflow fragmentation: Context switching between development environment and Anki

### Core Features
- AI-powered card generation from technical articles, code snippets, and PDFs
- Developer-focused content management (code blocks, diagrams, LaTeX, Markdown)
- Workflow integration (VS Code extension, CLI, keyboard shortcuts)
- Cross-platform support (Desktop Electron, Web React, Mobile React Native)

## Architecture Strategy
Ankiniki is a **companion tool**, not a replacement for Anki. It maintains full compatibility with existing Anki databases through the AnkiConnect API.

## Development Status
- **Phase 1 MVP**: ✅ Completed (Backend API, Desktop App, CLI Tool, Shared Types, Monorepo)
- **Phase 2 AI Integration**: 🔄 Planned (ML microservice, auto card generation, VS Code extension)
- **Phase 3 Full Features**: 📋 Future (Mobile app, Mermaid diagrams, advanced customization)

## Target Users
Engineers and technical professionals who want to efficiently learn and retain technical knowledge using spaced repetition without the friction of manual card creation.