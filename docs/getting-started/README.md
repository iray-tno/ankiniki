# Getting started

## Install the development toolchain

From the repository root:

```sh
mise trust
mise install
mise exec -- npm run setup
mise exec -- node apps/cli/dist/index.js --help
```

See [development environment](../developer/environment.md) for native desktop
requirements. The checked-in `mise.toml` selects Node and npm.

## Connect Anki

Install AnkiConnect in Anki with add-on code `2055492159`, restart Anki and keep
it running. AnkiConnect normally listens on `http://localhost:8765`.

```sh
mise exec -- node apps/cli/dist/index.js status
mise exec -- node apps/cli/dist/index.js config --show
```

Use `config --edit` to change connection settings. WSL users should also read
[the connection guide](../user-guides/wsl-ankiconnect/README.md).

## Use the CLI

Optionally link it:

```sh
mise exec -- npm link -w apps/cli
ankiniki deck create "Programming"
ankiniki note add "Programming" "What is a closure?" "Access to an enclosing scope"
ankiniki export "Programming" programming.json --format json
ankiniki note import programming.json --preview
ankiniki study "Programming" --due
ankiniki sync
```

Preview before importing into a real collection. JSON is a note-content format,
not a full backup of models, media and review history. Read the
[exchange contract](../design/anki-exchange.md) for preservation limits and the
[CLI reference](../../apps/cli/README.md) for all command groups.

## Run the desktop

In separate terminals:

```sh
mise exec -- npm run dev -w packages/backend
mise exec -- npm run dev -w apps/desktop
```

The desktop uses Tauri and still obtains card/deck/study data from Express.
The [architecture](../design/local-first-architecture.md) describes the planned
shared core and mobile integration.
