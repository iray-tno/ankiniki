# Development environment

Use mise for all Node.js and npm commands. The repository pins Node.js and npm
in `mise.toml`; local development and GitHub Actions use the same versions.

```sh
mise trust
mise install
mise exec -- npm run setup
```

`setup` installs the lockfile dependencies with `npm ci`, builds shared code
before its consumers, compiles the VS Code extension, builds the Tauri frontend
and type-checks the TypeScript workspaces. It works in PowerShell as well as
Unix shells, and does not automatically rewrite source files.

## Verification

```sh
mise exec -- npm run build
mise exec -- npm run type-check
mise exec -- npm test
mise exec -- npm run check
mise exec -- npm run ci
```

The root test command runs the implemented Vitest suites in shared, backend
and CLI. The extension has no runnable test harness yet; its TypeScript
compilation is checked by the build. Desktop frontend compilation is included,
but native Tauri packaging is a separate operation.

## Development

Run these in separate terminals when using the current desktop application:

```sh
mise exec -- npm run dev -w packages/backend
mise exec -- npm run dev -w apps/desktop
```

For a browser preview of the frontend:

```sh
mise exec -- npm run dev:frontend -w apps/desktop
```

For the CLI:

```sh
mise exec -- npm run build -w packages/shared
mise exec -- npm run build -w apps/cli
mise exec -- node apps/cli/dist/index.js --help
```

Native desktop development additionally requires Rust and the OS dependencies
listed in [Tauri's prerequisites](https://v2.tauri.app/start/prerequisites/).
On Windows this includes the C++ build tools and WebView2. A successful frontend
build does not establish that the native app has been packaged successfully.

The optional Python service is only needed for its document-processing and
generation endpoints. Anki with AnkiConnect is needed for actual Anki operations,
but the automated tests use mocks and do not modify a real collection.

## Git hooks and local work

Use `mise exec -- git commit ...` so hooks see the pinned runtime. Hooks format
and lint staged files. Full checks should also be run before opening a PR.

The root `temp/` directory is ignored by Git and formatting/lint tools. It is
for local scratch files, test logs and working notes; stage explicit file paths.
