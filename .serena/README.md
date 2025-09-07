# Serena AI Assistant for Ankiniki

This directory contains configuration and context files for Serena, the AI development assistant specialized for the Ankiniki project.

## What is Serena?

Serena is an AI-powered development assistant that understands your project's architecture, coding patterns, and domain-specific knowledge. It provides contextually-aware help for development tasks, code reviews, troubleshooting, and architectural decisions.

## Files in this Directory

### `config.json`
Project metadata and configuration including:
- Project structure and package information
- Technology stack details
- Development commands and workflows
- Quality assurance setup

### `context.md`
High-level project context including:
- Mission statement and goals
- Current development status
- Architectural principles and decisions
- Domain knowledge about Anki and spaced repetition
- Future roadmap and planned features

### `prompts.md`
Specialized prompts for different types of development work:
- Component-specific development guidelines
- Code review checklists
- Problem-solving frameworks
- Feature development patterns

### `knowledge.md`
Deep technical knowledge base covering:
- Detailed architecture documentation
- Code patterns and best practices
- API integration details
- Development workflows
- Security considerations
- Performance optimizations

## Using Serena

### For Development Tasks
When working on Ankiniki, reference these files to:
- Understand the project structure and conventions
- Get contextually relevant code suggestions
- Follow established architectural patterns
- Maintain consistency across the monorepo

### For Code Reviews
Use the prompts and checklists to:
- Ensure TypeScript and code quality standards
- Verify AnkiConnect integration patterns
- Check security and performance considerations
- Maintain architectural consistency

### For Problem Solving
Reference the knowledge base when:
- Debugging AnkiConnect integration issues
- Troubleshooting build or development problems
- Working across package boundaries
- Planning new features or architectural changes

## Key Concepts for AI Assistance

### Project Philosophy
- **Companion Tool**: Enhances Anki, doesn't replace it
- **Developer-First**: Optimized for programmer workflows
- **Type Safety**: Strict TypeScript with runtime validation
- **Quality**: ESLint, Prettier, and comprehensive testing

### Architecture Patterns
- **Monorepo**: npm workspaces with shared packages
- **AnkiConnect**: All data operations through official API
- **Cross-Platform**: Electron for desktop, CLI for power users
- **Modern Stack**: TypeScript, React, Express.js

### Domain Knowledge
- **Spaced Repetition**: Core learning algorithm
- **Flashcards**: Question/answer pairs with metadata
- **Decks**: Organized collections of related cards
- **AnkiConnect**: Third-party API addon for integration

## Integration with Development Tools

This Serena configuration integrates with:
- **VS Code**: Workspace settings and extensions
- **Git Hooks**: Pre-commit quality checks
- **npm Scripts**: Development and build workflows
- **TypeScript**: Strict type checking and validation
- **ESLint/Prettier**: Code quality and formatting

## Updating Serena Configuration

As the project evolves, update these files to:
- Reflect new architectural decisions
- Document new patterns and conventions  
- Add domain knowledge for new features
- Update development workflows and processes

The goal is to maintain an AI assistant that deeply understands the Ankiniki project and can provide expert-level guidance for all development tasks.