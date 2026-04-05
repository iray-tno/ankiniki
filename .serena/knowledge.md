# Ankiniki Technical Knowledge Base

## Anki and Spaced Repetition

- **Spaced Repetition (SRS)**: The core principle behind Anki for efficient memory retention.
- **Anki Concepts**:
  - **Cards**: Single flashcards with a front and back.
  - **Decks**: Groups of cards.
  - **Notes**: Templates for cards, allowing for multiple card types (e.g., forward and reverse).
  - **AnkiConnect**: The API that enables external applications to communicate with Anki.

## Monorepo Architecture

- **Workspaces**: Managed via npm, allowing shared dependencies and easy package linking.
- **`packages/shared`**: Contains the Zod schemas and TypeScript interfaces that define the data model for the entire project.
- **`packages/backend`**:
  - Uses Express.js with a service-oriented architecture.
  - Integrates with AnkiConnect via `AnkiClient`.
  - Handles card creation, deck management, and data import.
- **`apps/cli`**:
  - Built with Commander.js and Inquirer.
  - Communicates directly with the backend or AnkiConnect depending on the command.
- **`apps/desktop`**:
  - Electron-based app with a Vite-powered React frontend.
  - Uses IPC for communication between the main process and the renderer.

## Integration Patterns

- **AnkiConnect Integration**:
  - Default address: `http://localhost:8765`.
  - Core operations: `addNote`, `createDeck`, `deckNames`, `findNotes`.
- **Zod Validation**:
  - All incoming data in the backend and CLI should be validated using Zod schemas from `@ankiniki/shared`.
- **Error Handling**:
  - Consistent error responses with status codes and descriptive messages.
  - Use custom `AppError` classes for internal error management.

## Machine Learning Integration

- **`services/ml-service`**:
  - Python-based service using FastAPI.
  - Designed for content processing and card generation using language models.
  - Integrates via HTTP requests from the backend or CLI.
