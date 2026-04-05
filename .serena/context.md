# Ankiniki Project Context

## Overview

Ankiniki is an Anki companion tool designed for engineers. It facilitates the creation and management of Anki flashcards directly from the development environment, including a CLI, a desktop application, and a VS Code extension.

## Core Goals

- **Seamless Integration**: Allow engineers to create flashcards during their normal development workflow.
- **Structured Data**: Support importing flashcards from structured formats like JSON and CSV.
- **AnkiConnect Support**: Leverage the AnkiConnect API for direct integration with the Anki desktop application.
- **Cross-Platform**: Provide tools that work on Windows, macOS, and Linux.

## Key Components

1. **CLI (`apps/cli`)**: Command-line interface for managing cards and decks.
2. **Desktop App (`apps/desktop`)**: Electron-based application with a React frontend.
3. **VS Code Extension (`apps/vscode-extension`)**: Integration for the most popular code editor.
4. **Backend (`packages/backend`)**: Express server for handling data processing and AnkiConnect communication.
5. **Shared Package (`packages/shared`)**: Common types and utilities used across the monorepo.
6. **ML Service (`services/ml-service`)**: Python-based service for card generation and content processing.

## Development Workflow

The project follows a structured GitHub flow with a focus on atomic commits and issue tracking. Automated quality checks and testing are integrated into the workflow.
