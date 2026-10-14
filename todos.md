# Roadmap

Updated 2026-10-14. This file separates existing features from planned milestones.

## Existing implementation

- TypeScript CLI with note/deck commands, import/export, offline APKG bundling,
  Anki-based study, statistics and AnkiWeb sync.
- Shared parsers, validation and AnkiConnect client.
- Express API and an optional Python processing/generation service.
- VS Code extension for selection/code creation and file generation.
- Tauri desktop with settings, menus and React screens backed by Express.
- Vitest suites for shared/backend/CLI; workspace build/type/lint/format checks.

## Milestone 1: compatible exchange

- [x] Reproducible mise-based development setup and current documentation.
- [ ] Import the JSON produced by CLI export without losing field names or values.
- [ ] Specify content guarantees, unsupported data and capability checks.
- [ ] Test custom fields, empty values, HTML, Cloze text, tags and invalid models.
- [ ] Define a versioned archive covering models, card/deck membership and media.
- [ ] Add previewable import plans and identity rules before update/merge modes.
- [ ] Restore native model/media data only through verified capabilities.
- [ ] Preserve/recover scheduling and review history through a verified native
      package or supported connector; never imply content JSON provides this.

## Milestone 2: shared Rust core and Hozo screens

- [ ] Implement a portable Rust exchange core using the same compatibility fixtures.
- [ ] Verify a minimal shared operation from CLI, Tauri and React Native.
- [ ] Move desktop data operations from Express to the shared core in stages.
- [ ] Share screens through Hozo; keep navigation and OS integration per platform.
- [ ] Validate Native behavior on devices and report reproducible Hozo bugs upstream.

## Milestone 3: independent learning

- [ ] Introduce a local collection only after reliable exchange and restore exist.
- [ ] Add SQLite persistence, review events, scheduler and daily study queues.
- [ ] Preserve the existing Anki workflows and distinguish content exchange,
      AnkiWeb sync and independent device sync.
- [ ] Add backup/transfer, then explicitly resolve multi-device conflicts.

## Later

AI integration improvements, broader card rendering, optional server-backed Web
access and collaboration. These are not prerequisites for the first milestone.

See [architecture](docs/design/local-first-architecture.md) and
[exchange contract](docs/design/anki-exchange.md) for decisions and validation gates.
