# Roadmap

Updated 2026-10-14. This file separates existing features from planned milestones.

## Existing implementation

- TypeScript CLI with note/deck commands, import/export, offline APKG bundling,
  Anki-based study, statistics and AnkiWeb sync.
- Shared parsers, validation and AnkiConnect client.
- A v1 reusable lesson contract and offline CLI validation of declarations,
  identities, references and local audio integrity; self-authored fixtures.
- Express API and an optional Python processing/generation service.
- VS Code extension for selection/code creation and file generation.
- Tauri desktop with settings, menus and React screens backed by Express.
- Vitest suites for shared/backend/CLI; workspace build/type/lint/format checks.

## Milestone 1: compatible exchange

- [x] Reproducible mise-based development setup and current documentation.
- [x] Import the JSON produced by CLI export without losing field names or values.
- [x] Specify note-content guarantees, unsupported data and existing-model checks.
- [x] Test custom fields, empty values, HTML, Cloze text, tags and invalid models.
- [ ] Define a versioned archive covering models, card/deck membership and media.
- [ ] Add previewable import plans and identity rules before update/merge modes.
- [ ] Restore native model/media data only through verified capabilities.
- [ ] Preserve/recover scheduling and review history through a verified native
      package or supported connector; never imply content JSON provides this.

## Milestone 2: content sessions, shared core and Hozo screens

Before the full migration, deliver a small content session using the
[content and learning design](docs/design/content-and-learning.md):

- [x] Specify stable package/item/activity identities and revisioned content.
- [x] Validate self-authored question and audio fixtures with resolved media.
- [ ] Generate public Web data and an Anki APKG from the same approved source;
      exclude personal progress and private inputs from public output.
- [ ] Verify first import, repeated import and updates after user edits/reviews
      in a dedicated Anki collection, including models and media.
- [ ] Build a short static article widget with no account or application server.
- [ ] Add a local Tauri audio session: playback, response wait, repeat and self-rating.

These sessions do not require full review-history restoration or an independent
scheduler. The shared-core migration can use their fixtures and screen contracts:

- [ ] Implement a portable Rust exchange core using the same compatibility fixtures.
- [ ] Verify a minimal shared operation from CLI, Tauri and React Native.
- [ ] Move desktop data operations from Express to the shared core in stages.
- [ ] Share screens through Hozo; keep navigation and OS integration per platform.
- [ ] Validate Native behavior on devices and report reproducible Hozo bugs upstream.
- [ ] Verify audio interruption/recovery and the same session on React Native devices.
- [ ] Expose browser-needed pure Rust logic through WASM when required; keep
      Native storage and FFI outside the static widget.

## Milestone 3: independent learning

- [ ] Introduce a local collection only after reliable exchange and restore exist.
- [ ] Add SQLite persistence, review events, scheduler and daily study queues.
- [ ] Preserve the existing Anki workflows and distinguish content exchange,
      AnkiWeb sync and independent device sync.
- [ ] Add backup/transfer, then explicitly resolve multi-device conflicts.

## Later

AI integration improvements, recording/automatic speech assessment, broader card
rendering, optional server-backed Web access and collaboration. Static article
practice belongs to the earlier content milestone and does not require a server.

See [architecture](docs/design/local-first-architecture.md) and
[exchange contract](docs/design/anki-exchange.md) for decisions and validation gates.
