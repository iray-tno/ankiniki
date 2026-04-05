# Specialized Development Prompts for Ankiniki

## Backend Development

When working on the Express.js backend code:

- Reference AnkiConnect integration patterns in `packages/backend/src/services/AnkiConnect.ts`.
- Use established error handling classes and Zod schema validation.
- Follow TypeScript strict mode and use shared types from `@ankiniki/shared`.

## Frontend Development

When working on the React/Electron frontend:

- Follow component patterns in `apps/desktop/src/renderer/components`.
- Use TypeScript interfaces for all props and state.
- Implement secure IPC communication between main and renderer processes.

## CLI Development

When working on the command-line interface:

- Use Commander.js patterns in `apps/cli/src/commands`.
- Implement interactive prompts with Inquirer for better UX.
- Follow the command structure: add, list, study, config, export, delete.

## Code Review Checklist

Check the following when reviewing code:

- [ ] TypeScript strict mode compliance
- [ ] Proper error handling implementation
- [ ] Zod schema validation usage
- [ ] AnkiConnect integration patterns
- [ ] Security considerations
- [ ] Performance optimizations
- [ ] Code formatting and linting compliance

## Example Prompts

- "How should I add a new AnkiConnect operation to the backend service?"
- "What's the proper way to add a new CLI command in apps/cli?"
- "How do I implement a new React component following the desktop app patterns?"
- "Review this backend API endpoint for AnkiConnect integration patterns"
