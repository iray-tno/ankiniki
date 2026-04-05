# Serena AI Assistant Configuration for Ankiniki

This directory contains the configuration files and knowledge base for the Serena AI assistant within the Ankiniki project.

## Directory Structure

- `config.json`: Project metadata and structure.
- `context.md`: High-level project overview and goals.
- `prompts.md`: Specialized development prompts.
- `knowledge.md`: Deep technical knowledge base.
- `project.yml`: The core configuration for the Serena MCP server.
- `memories/`: Persistent storage for the assistant's context across sessions.

## Purpose

The Serena configuration is designed to provide AI assistants with:

- **Architectural Context**: Understanding the monorepo structure and how packages relate to each other.
- **Project Goals**: High-level objectives to align with during development and design.
- **Established Patterns**: Reference implementations for backend, frontend, and CLI tasks.
- **Deep Technical Knowledge**: Domain-specific information about Anki and spaced repetition.

## Maintenance

When making significant architectural changes or adding new features:

1. Update `knowledge.md` with new technical details.
2. Add new prompts to `prompts.md` for the new feature area.
3. Update `context.md` if the change affects high-level goals.
4. Run `npm run serena:validate` to ensure the configuration remains valid.

For more information, see the [AI Assistant Integration Guide](../docs/AI_ASSISTANT_INTEGRATION.md).
