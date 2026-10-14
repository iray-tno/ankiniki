# Repository instructions

Read DEVELOPMENT.md and docs/developer/environment.md before changing code.

- Run every Node/npm command and Git commit through `mise exec --`.
- Build shared before its consumers. Use the root scripts for ordered builds,
  TypeScript checking and the implemented Vitest suites.
- The current desktop host is Tauri, not Electron. Mobile and an independent
  collection are not implemented. Do not describe planned features as complete.
- Prioritize Anki-compatible exchange before introducing independent storage
  or scheduling. See docs/design/anki-exchange.md and the architecture proposal.
- Preserve raw fields in the exchange path. Keep authoring transformations
  separate, and test fidelity with fixtures and mocked Anki operations.
- Keep lesson sources separate from personal progress. Use self-authored public
  fixtures; private lesson text/media and local profiles stay outside this repo.
  See docs/design/content-and-learning.md for audio and static Web session plans.
- Track work in Issues and focused PRs. Codex branches use
  `codex/issue-<number>_<topic>`; commit/PR titles use `#<issue> <description>`.
- Stacked PRs may target the preceding branch; describe the dependency and merge
  order. Do not merge without an explicit request.
- Reproduce Hozo failures and search/open Issues in iray-tno/hozo. Avoid local
  framework forks and speculative upstream bug reports.
- Stage explicit paths. The root temp/ directory is ignored and must not be
  uploaded or quoted in Issues/PRs. Keep local configuration and generated output
  out of commits.
- Attribute work truthfully if including attribution. Do not add another
  assistant's name solely to match an old template.
