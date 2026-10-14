# Ankiniki

Ankiniki helps create, manage and study Anki notes from the terminal, VS Code
and a Tauri desktop application. The current collection and review scheduling
are managed by Anki through AnkiConnect.

The next milestone is **compatible import/export**: preserve Anki note fields,
HTML, tags and model names when exchanging JSON. Independent local collections,
shared mobile screens and scheduling come after the exchange format is reliable.

## Current components

| Component  | Implementation                  | Current role                                             |
| ---------- | ------------------------------- | -------------------------------------------------------- |
| CLI        | TypeScript, Commander           | Note/deck management, import/export, study, AnkiWeb sync |
| Shared     | TypeScript, Zod                 | AnkiConnect client, parsers, types and validation        |
| Backend    | Express                         | Import, AI integration and desktop API                   |
| Desktop    | Tauri 2, Rust, React, Hozo/Vite | Decks, card creation, study and settings                 |
| VS Code    | TypeScript extension            | Selection/code cards and file generation                 |
| ML service | Python, FastAPI                 | Optional content processing and generation               |
| Mobile     | Planned React Native + Hozo     | Shared screens; no mobile application exists yet         |

Tauri's Rust layer currently handles settings and menus. Desktop data operations
still call the Express backend. Most screens still use DOM elements; installing
Hozo's build plugin alone does not make them reusable on React Native.

## Setup

Install [mise](https://mise.jdx.dev/) and Git, then run from the repository root:

```sh
mise trust
mise install
mise exec -- npm run setup
```

The pinned versions are in `mise.toml`. Native desktop development also needs
Rust and [Tauri's OS prerequisites](https://v2.tauri.app/start/prerequisites/).
See [development environment](docs/developer/environment.md).

For real Anki operations, install AnkiConnect (Anki add-on code `2055492159`)
and keep Anki running. Automated tests use mocks and do not require Anki.

## CLI

After building, use `mise exec -- node apps/cli/dist/index.js ...` or optionally
link the CLI with `mise exec -- npm link -w apps/cli` to use `ankiniki` directly.

```sh
ankiniki note add "Programming" "What is a closure?" "A function with access to its enclosing scope"
ankiniki note import cards.json --preview
ankiniki export "Programming" programming.json --format json
ankiniki bundle cards.json cards.apkg
ankiniki study "Programming" --due
ankiniki sync
```

`sync` triggers Anki's AnkiWeb sync. `bundle` creates an APKG from source files
without running Anki. JSON currently represents note content, not a full
collection backup; use Anki's native package export when scheduling or full
collection fidelity is required.

See [CLI commands](apps/cli/README.md), [JSON import](docs/user-guides/json-import/README.md)
and the [exchange design](docs/design/anki-exchange.md) for the current limits.

## Desktop development

Run in separate terminals:

```sh
mise exec -- npm run dev -w packages/backend
mise exec -- npm run dev -w apps/desktop
```

`mise exec -- npm run dev:frontend -w apps/desktop` opens a frontend development
server on port 1420. The backend defaults to port 3001 and AnkiConnect to 8765.
The native app and browser preview have different origins; configure backend
CORS for the origin being used.

## Verification

```sh
mise exec -- npm run ci
```

This builds the TypeScript packages, extension and desktop frontend, type-checks,
lints, checks formatting and runs shared/backend/CLI tests. Native app packaging
is separate: `mise exec -- npm run build:app -w apps/desktop`.

## Direction and documentation

- [Documentation index](docs/README.md)
- [Development guide](DEVELOPMENT.md)
- [Compatibility-first architecture](docs/design/local-first-architecture.md)
- [Anki exchange contract](docs/design/anki-exchange.md)
- [Current roadmap](todos.md)

The original [strategy](strategy.md) is historical context, not a description of
current features. This project is distributed under the [MIT License](LICENSE).
