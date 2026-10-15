# Development guide

Use [the environment guide](docs/developer/environment.md) for installation,
verification and OS prerequisites. All Node/npm commands run through mise.

## Coding agent instructions

[AGENTS.md](AGENTS.md) is the common repository instruction source. Claude Code
supports it natively from v2.1.277; this repository relies on that support instead
of a separate Claude instruction file. With the default Project instructions
setting, a project or ancestor `CLAUDE.md`/`CLAUDE.local.md` takes precedence.
Check `/context` to confirm which instructions load; use `/config` to read both
formats if an ancestor file is needed. See the
[official loading rules](https://code.claude.com/docs/en/memory#agentsmd).

## Current structure

```text
packages/shared/         Types, parsers and AnkiConnect client
packages/backend/        Express API and import integrations
apps/cli/                Commander CLI; bundles into dist/index.js
apps/desktop/            React/Hozo frontend and Tauri Rust host
apps/vscode-extension/   VS Code extension
services/ml-service/     Optional Python service
```

Build shared first. `mise exec -- npm run build` handles build order, compiles
the VS Code extension and builds the desktop frontend. Use
`mise exec -- npm run ci` for the full implemented verification suite.

The desktop still depends on Express for card/deck/study operations. Its Rust
commands currently provide settings persistence; the planned shared Rust core
is not implemented yet. The project has no mobile app or independent collection.

## Scope and design

The first milestone is reliable Anki-compatible JSON import/export. Read:

- [Architecture and milestones](docs/design/local-first-architecture.md)
- [Exchange guarantees and limits](docs/design/anki-exchange.md)
- [Content, audio sessions and static article practice](docs/design/content-and-learning.md)
- [Next UI and authoring stages](docs/design/practice-ui-and-authoring.md)
- [Implemented v1 lesson format and offline validation](docs/reference/content-package.md)
- [Lesson APKG export and update rules](docs/reference/content-apkg.md)
- [Native Anki verification scope](docs/developer/content-apkg-verification.md)

Keep reusable content separate from personal progress. Public publishing uses
only explicitly approved content and media; private lesson sources and local
profiles stay outside this repository. A short browser/audio session does not
require an independent collection or scheduler.

Preserve raw Anki field values in the exchange path. Do not trim HTML, replace
newlines, merge fields into Front/Back, add tags implicitly, or treat external
note IDs as permission to overwrite existing notes. The authoring formats are a
separate path and can retain their documented transformations.

Use export/import fixtures to test fidelity without modifying a real Anki
collection. Claims about templates, media or review-state preservation need
explicit implementations and tests; a successful Basic note import is not a
complete collection round trip.

## Workflow

1. Inspect the relevant code and existing tests; create or reuse a GitHub Issue.
2. Create a branch, using `codex/issue-<number>_<topic>` for Codex work.
3. Keep each PR focused. Stacked PRs may target the preceding branch and must
   state the dependency and merge order.
4. Run relevant tests and the full checks when changing shared behavior.
5. Commit through mise and describe actual behavior, validation and limitations.
6. Push and open a PR. Do not merge without an explicit request.

Commit/PR titles use `#<issue> <description>`. Use truthful attribution if adding
an attribution footer; do not claim another tool produced the changes.

## Hozo

Hozo dependencies are used as published packages. Reproduce a suspected Hozo bug
with the installed version and the smallest meaningful example. Search existing
issues in `iray-tno/hozo`, then open an upstream issue with versions, expected and
actual behavior, reproduction steps and useful diagnostics. Link it from the
relevant Ankiniki work. Avoid local framework forks or unexplained workarounds.

The native UI integration needs its own device validation. A successful Vite
build does not prove that the same screen works on React Native.

## Testing conventions

Shared/backend/CLI use Vitest. Backend route tests use Supertest and mock Anki.
CLI builds with esbuild, so its type check must also be run separately.

Use class syntax for constructor mocks. Use module factories for ESM `fs`
exports rather than spying on read-only exports. Hoisted mock factories must
only reference values available at initialization. Resolve filesystem paths
with the platform path API rather than asserting Unix-only absolute paths.

Combine value and type imports from the same module; ESLint rejects duplicate
imports. AnkiConnect `addTags` and `removeTags` take a space-separated string.

## Local files

`temp/` is ignored. Use it for scratch files and test logs and stage explicit
paths. Never include generated output, local configuration or private working
notes in Issues/PRs. There is no reason to run a repository-wide formatting fix
as part of dependency installation.
