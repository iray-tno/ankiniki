# CLAUDE.md — ankiniki

Project conventions for Claude Code. The shared development workflow (issue → branch → PR, commit format, branch naming) is in **[GEMINI.md](GEMINI.md)** — follow that exactly.

---

## Running commands

This repo uses [mise](https://mise.jdx.dev/) to manage Node.js. Husky pre-commit hooks run inside the mise environment, so **all npm and git commit commands must be prefixed with `mise exec --`**:

```bash
mise exec -- npm run build
mise exec -- npm test
mise exec -- git commit -m "..."
```

Bare `npm` or `git commit` without the prefix will cause Husky hook failures.

---

## Monorepo structure

```
packages/shared      # Types, Zod schemas, AnkiConnectClient — source of truth
packages/backend     # Express API (AnkiConnect proxy + import routes)
apps/cli             # Commander.js CLI
apps/vscode-extension
apps/desktop         # Electron + React (Phase 2B — components are scaffolds)
services/ml-service  # FastAPI card generation (Python)
```

Build order: `shared` → `backend` → apps.

## CLI command structure

```
ankiniki note {add,list,edit,delete,generate,import,tag}
ankiniki deck {create,delete,list}
ankiniki {export,bundle,study,sync,stats,config,status}
```

New note-level operations go under `note`; deck-level operations go under `deck`.

---

## Testing gotchas (Vitest + ESM)

**Constructor mocks** — use class syntax, not arrow functions (Prettier breaks arrow-function constructors):

```typescript
vi.mock('./MyClass', () => ({
  MyClass: class {
    constructor() {
      return mockInstance;
    }
  },
}));
```

**`vi.mock` factory hoisting** — only variables whose names start with `mock` are accessible inside a hoisted factory. Use wrapper functions for inquirer:

```typescript
const mockInquirerPrompt = vi.fn();
vi.mock('inquirer', () => ({
  default: { prompt: (...args: unknown[]) => mockInquirerPrompt(...args) },
}));
```

**ESM `fs` mocking** — `vi.spyOn` does not work on ESM exports. Use a sync factory:

```typescript
vi.mock('fs', () => {
  const fsMock = { existsSync: vi.fn(), writeFileSync: vi.fn() };
  return { default: fsMock, ...fsMock };
});
```

---

## ESLint

**`no-duplicate-imports`**: value and type imports from the same module must be one statement:

```typescript
// correct
import { ANKI_MESSAGES, type NoteInfo } from '@ankiniki/shared';
```

---

## AnkiConnect

- `addTags` / `removeTags` expect tags as a **space-separated string**, not an array
- WSL2 users: see `docs/user-guides/wsl-ankiconnect/README.md`
