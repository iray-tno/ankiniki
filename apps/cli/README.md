# Ankiniki CLI

Command-line interface for quick flashcard management with Anki.

## Installation

```bash
# From the project root
mise exec -- npm install
mise exec -- npm run build

# Link globally (optional)
cd apps/cli
mise exec -- npm link
```

## Usage

Use **`note`** for card operations, **`deck`** for deck management and **`content`** for reusable lesson validation, plus standalone utility commands.

```
ankiniki note <subcommand>   # card/note operations
ankiniki deck <subcommand>   # deck management
ankiniki content validate   # validate lesson content and audio offline
ankiniki export              # export to .apkg / CSV / JSON
ankiniki bundle              # build .apkg offline (no Anki needed)
ankiniki study               # in-terminal study session
ankiniki stats               # review statistics
ankiniki sync                # trigger AnkiWeb sync
ankiniki status              # check connections
ankiniki config              # manage settings
```

### Note commands

```bash
# Add a card
ankiniki note add "JavaScript" "What is hoisting?" "Moving declarations to the top"
ankiniki note add --interactive

# List cards in a deck
ankiniki note list "JavaScript"
ankiniki note list "JavaScript" --limit 20

# Edit a card
ankiniki note edit "hoisting"
ankiniki note edit "tag:js" --deck "JavaScript"

# Delete a card by note ID
ankiniki note delete <noteId>
ankiniki note delete <noteId> --force

# Generate cards with AI from a file
ankiniki note generate README.md --deck "Docs"
ankiniki note generate --stdin --deck "Code Review"

# Import cards from CSV, JSON, or Markdown
ankiniki note import cards.csv
ankiniki note import cards.md --preview

# Bulk-manage tags
ankiniki note tag "deck:JavaScript" --add "active" --remove "archived"
ankiniki note tag "added:7" --add "this-week" --yes
```

### Deck commands

```bash
ankiniki deck list
ankiniki deck create "Programming::TypeScript"
ankiniki deck delete "Old Deck"
ankiniki deck delete "Old Deck" --force
```

### Lesson content

```bash
ankiniki content validate docs/examples/content/basic-practice/content.json
ankiniki content validate docs/examples/content/basic-practice/content.json --public --json
```

Validation checks the v1 lesson schema, identities, audio references, local file
boundaries, byte lengths and SHA-256. `--public` additionally requires explicit
public declarations for the lesson and all assets. Nothing is uploaded and Anki
does not need to be running. Failure returns exit code 1.

This is separate from note import/export and does not yet create a lesson APKG
or play a session. See [the content contract](../../docs/reference/content-package.md).

### Export

```bash
ankiniki export "JavaScript"                             # → JavaScript.apkg
ankiniki export "JavaScript" --format csv               # → JavaScript.csv
ankiniki export "JavaScript" --format json              # → JavaScript.json
ankiniki export "JavaScript" notes.apkg --include-sched
ankiniki export "JavaScript" --format csv --query "tag:hard"
```

### Utility commands

```bash
ankiniki stats                        # review dashboard
ankiniki stats --brief                # one-line summary (useful in status bars)
ankiniki stats --deck "JavaScript"    # scoped to one deck

ankiniki sync                         # trigger AnkiWeb sync

ankiniki status                       # check Anki + backend connections

ankiniki config --show
ankiniki config --set defaultDeck=JavaScript
ankiniki config --edit

ankiniki study "JavaScript"
ankiniki study "JavaScript" --count 20 --random
```

## Configuration

Config is saved at `~/.ankiniki.json`:

```json
{
  "ankiConnectUrl": "http://localhost:8765",
  "defaultDeck": "Default",
  "defaultModel": "Basic",
  "debugMode": false
}
```

## Requirements

- Node.js 18+
- Anki running with AnkiConnect addon
- AnkiConnect addon must allow requests from localhost
