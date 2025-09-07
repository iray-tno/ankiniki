# AI Assistant Integration Guide

This document explains how to integrate and use AI assistants effectively with the Ankiniki project.

## Overview

Ankiniki includes comprehensive AI assistant configuration to provide contextually-aware development support. The configuration is designed to work with various AI tools including Claude, GPT-4, and other language models.

## Configuration Files

### `.serena/` Directory Structure
```
.serena/
├── config.json      # Project metadata and structure
├── context.md       # High-level project context
├── prompts.md       # Specialized development prompts
├── knowledge.md     # Deep technical knowledge base
└── README.md        # Configuration documentation
```

### `.claude.md`
Comprehensive project context specifically formatted for Claude Code integration.

## Setup and Validation

### Initial Setup
The Serena configuration is automatically available after cloning the repository. To validate the configuration:

```bash
npm run serena:validate
```

This checks for:
- All required configuration files
- Valid JSON structure
- Reasonable file sizes
- Key configuration elements

### Integration with Development Workflow
The AI assistant configuration integrates with:
- VS Code workspace settings
- Git hooks and quality checks
- npm development scripts
- TypeScript compilation
- ESLint and Prettier formatting

## Using AI Assistants Effectively

### For Development Tasks

#### Backend Development
When working on Express.js backend code:
- Reference AnkiConnect integration patterns
- Use established error handling classes
- Follow TypeScript strict mode guidelines
- Implement proper logging and validation

#### Frontend Development
When working on React/Electron frontend:
- Follow component patterns in `apps/desktop`
- Use TypeScript interfaces for props
- Implement secure IPC communication
- Maintain responsive design principles

#### CLI Development
When working on command-line interface:
- Use Commander.js established patterns
- Implement interactive prompts with Inquirer
- Follow the command structure: add, list, study, config
- Provide comprehensive help and examples

### For Code Reviews

Use the AI assistant to check:
- [ ] TypeScript strict mode compliance
- [ ] Proper error handling implementation
- [ ] Zod schema validation usage
- [ ] AnkiConnect integration patterns
- [ ] Security considerations
- [ ] Performance optimizations
- [ ] Code formatting and linting compliance

### For Architecture Decisions

Reference the knowledge base when:
- Planning cross-package integration
- Designing new API endpoints
- Implementing security measures
- Optimizing performance bottlenecks
- Planning future feature development

## Domain-Specific Knowledge

### Anki and Spaced Repetition
The AI assistant understands:
- Spaced repetition algorithms and principles
- Anki's card, deck, and model concepts
- AnkiConnect API patterns and limitations
- Educational technology best practices

### Developer Workflows
The assistant is configured for:
- Modern TypeScript development patterns
- Monorepo management with npm workspaces
- Cross-platform desktop application development
- Command-line interface design principles
- Educational software user experience

## Prompting Best Practices

### Effective Prompting
1. **Be Specific**: Reference specific files or components
2. **Provide Context**: Mention the package or app you're working on
3. **Reference Patterns**: Ask about established project patterns
4. **Include Error Details**: Provide full error messages and stack traces

### Example Prompts
```
// Good prompts
"How should I add a new AnkiConnect operation to the backend service?"
"What's the proper way to add a new CLI command in apps/cli?"
"How do I implement a new React component following the desktop app patterns?"

// Less effective prompts
"Help me with TypeScript"
"Fix this error"
"How do I make a card?"
```

### Code Review Prompts
```
"Review this backend API endpoint for AnkiConnect integration patterns"
"Check if this React component follows our established patterns"
"Validate this CLI command implementation against our standards"
```

## Customization and Extension

### Local Overrides
Create local configuration files that won't be tracked in git:
- `.serena/local.json` - Local project settings
- `.serena/*.local.md` - Personal notes and extensions

### Adding New Knowledge
When adding new features or patterns:
1. Update `knowledge.md` with new technical details
2. Add new prompts to `prompts.md` for the feature area
3. Update `context.md` if it affects project goals
4. Run `npm run serena:validate` to check configuration

### Integration with New Tools
To integrate with additional AI tools:
1. Reference the existing configuration structure
2. Adapt the context and prompts for the specific tool
3. Maintain consistency with established patterns
4. Document any tool-specific integration steps

## Troubleshooting

### Configuration Issues
```bash
# Validate configuration
npm run serena:validate

# Check file permissions
ls -la .serena/

# Verify JSON syntax
cat .serena/config.json | jq .
```

### Context Not Loading
1. Ensure all configuration files are present
2. Check file sizes are reasonable (>100 bytes)
3. Validate JSON syntax in config files
4. Verify git tracking of configuration files

### Inconsistent Responses
1. Update context with recent architectural changes
2. Add specific examples to knowledge base
3. Refine prompts for your specific use case
4. Ensure domain knowledge is current

## Maintenance

### Regular Updates
- Update project status in `context.md`
- Add new patterns to `knowledge.md`
- Refine prompts based on usage
- Validate configuration after major changes

### Version Control
- Track all configuration files in git
- Use local overrides for personal customization
- Document significant configuration changes
- Tag configuration updates with project releases

This comprehensive AI assistant integration enables more effective development assistance, code reviews, and architectural guidance tailored specifically to the Ankiniki project.