# Ankiniki CLI — Hands-On Guide

A practical guide to using the `ankiniki` command-line tool to create, study, and manage Anki flashcards from your terminal.

> **Japanese version:** [日本語版はこちら](../../ja/user-guides/cli/README.md)

---

## Prerequisites

Before using the CLI you need:

1. **Anki desktop** running on your machine
2. **AnkiConnect addon** installed in Anki (code: `2055492159`)
   - Anki → Tools → Add-ons → Get Add-ons → enter the code
3. **Ankiniki backend server** running (for `note import` and `note generate`)
   ```bash
   # From the project root
   npm run dev --workspace=@ankiniki/backend
   # Server starts at http://localhost:3001
   ```

---

## Installation

```bash
# From the project root, build the CLI
npm run build --workspace=@ankiniki/cli

# Run directly (dev mode, no build needed)
cd apps/cli
npm run dev -- <command>

# Or after build
node apps/cli/dist/index.js <command>
```

---

## Quick Start

```bash
# Check everything is working
ankiniki status
ankiniki config --show

# Add your first card
ankiniki note add "My Deck" "What is a closure?" "A function that captures its enclosing scope"

# List cards in a deck
ankiniki note list "My Deck"

# Study a deck
ankiniki study "My Deck"
```

---

## Command overview

Commands are grouped into two main areas — **`note`** for card operations and **`deck`** for deck management — plus standalone utility commands.

```
ankiniki note add        Create a new flashcard
ankiniki note list       List cards in a deck
ankiniki note edit       Edit a card in $EDITOR
ankiniki note delete     Delete a card by note ID
ankiniki note generate   AI-generate cards from a file or stdin
ankiniki note import     Bulk import from CSV / JSON / Markdown
ankiniki note tag        Bulk add/remove tags on matched notes

ankiniki deck list       List all decks with card counts
ankiniki deck create     Create a new deck
ankiniki deck delete     Delete a deck and its cards

ankiniki export          Export a deck to .apkg / CSV / JSON
ankiniki bundle          Build .apkg offline (no Anki required)
ankiniki study           In-terminal study session
ankiniki stats           Review statistics dashboard
ankiniki sync            Trigger AnkiWeb sync
ankiniki status          Check Anki + backend connections
ankiniki config          Manage settings
```

---

## `note add` — Create a flashcard

```bash
ankiniki note add [deck] [front] [back]
```

**Examples:**

```bash
# Positional arguments (fastest)
ankiniki note add "JavaScript" "What is hoisting?" "Moving declarations to the top of scope"

# With tags and model
ankiniki note add "Rust" "What is ownership?" "Each value has one owner" \
  --tags "rust,memory,ownership" \
  --model "Basic"

# Use default deck (set via config)
ankiniki note add "What is a monad?" "A monoid in the category of endofunctors"

# Interactive mode — prompts for everything
ankiniki note add --interactive
ankiniki note add -i
```

| Option            | Short | Description                        |
| ----------------- | ----- | ---------------------------------- |
| `--tags <tags>`   | `-t`  | Comma-separated tags               |
| `--model <model>` | `-m`  | Card model (default: Basic)        |
| `--interactive`   | `-i`  | Interactive prompts for all fields |

---

## `note list` — Browse cards in a deck

```bash
ankiniki note list <deck> [--limit <n>]
```

**Examples:**

```bash
ankiniki note list "JavaScript"
ankiniki note list "JavaScript" --limit 50
```

| Option        | Short | Description               |
| ------------- | ----- | ------------------------- |
| `--limit <n>` | `-l`  | Max results (default: 10) |

---

## `note edit` — Edit a card

Search for notes by query, pick from the results, then edit fields in `$EDITOR`.

```bash
ankiniki note edit <query> [--deck <name>] [--limit <n>]
```

**Examples:**

```bash
# Find by keyword
ankiniki note edit "hoisting"

# Scope to a deck
ankiniki note edit "tag:js" --deck "JavaScript"

# Cap results shown in picker
ankiniki note edit "added:1" --limit 5
```

---

## `note delete` — Remove a card

```bash
ankiniki note delete <noteId> [--force]
```

Note IDs are shown by `ankiniki note list <deck>`.

```bash
ankiniki note list "JavaScript"
# → 1. Card ID: 1700000001
#      Front: What is hoisting?

ankiniki note delete 1700000001
ankiniki note delete 1700000001 --force   # skip confirmation
```

---

## `note generate` — AI-generate cards

Generate flashcards from a file or piped content using the AI backend.

```bash
ankiniki note generate <file>   [options]
ankiniki note generate --stdin  [options]
```

**Examples:**

```bash
# Generate from a file (content type auto-detected from extension)
ankiniki note generate README.md --deck "Docs"
ankiniki note generate src/auth.ts --deck "Code" --lang typescript

# Pipe content in
cat CHANGELOG.md | ankiniki note generate --stdin --deck "Releases"
git diff HEAD~1 | ankiniki note generate --stdin --content-type code --deck "Review"

# Non-interactive
ankiniki note generate README.md --deck "Docs" --yes
```

| Option                  | Short | Description                                    |
| ----------------------- | ----- | ---------------------------------------------- |
| `--stdin`               |       | Read content from stdin                        |
| `--deck <deck>`         | `-d`  | Target deck                                    |
| `--content-type <type>` | `-t`  | `code` \| `markdown` \| `text` (auto-detected) |
| `--difficulty <level>`  |       | `beginner` \| `intermediate` \| `advanced`     |
| `--max-cards <n>`       | `-n`  | Max cards to generate (default: 5)             |
| `--lang <language>`     |       | Programming language hint (for code files)     |
| `--tags <tags>`         |       | Additional tags (comma-separated)              |
| `--yes`                 | `-y`  | Add all generated cards without confirmation   |

---

## `note import` — Bulk import from file

Format is **auto-detected from the file extension** (`.csv`, `.json`, `.md`).

```bash
ankiniki note import <file> [options]
```

### CSV

```bash
ankiniki note import cards.csv
ankiniki note import cards.csv --preview          # dry run
ankiniki note import cards.csv --deck "JavaScript" --tags "imported,js"
```

**CSV format:**

```csv
Front,Back,Deck,Tags,Model
"What is a closure?","A function capturing its enclosing scope","JavaScript","js,closures","Basic"
```

Custom column mapping:

```bash
ankiniki note import cards.csv \
  --mapping '{"front":"Question","back":"Answer","deck":"Subject"}'
```

### JSON

```bash
ankiniki note import cards.json
ankiniki note import cards.json --deck "Rust"
```

```json
[
  {
    "front": "What is ownership?",
    "back": "Each value in Rust has one owner.",
    "deck": "Rust",
    "tags": ["rust", "memory"]
  }
]
```

### Markdown

```bash
ankiniki note import cards.md
ankiniki note import cards.md --preview
```

```markdown
---
deck: Programming::TypeScript
tags: [typescript, types]
---

## What is a union type?

**Front:** What is a union type?
**Back:** A type that can be one of several types, written as `A | B`.
```

### Common options

| Option               | Short | Description                             |
| -------------------- | ----- | --------------------------------------- |
| `--format <fmt>`     | `-f`  | Force format: `csv`, `json`, `markdown` |
| `--deck <deck>`      |       | Default deck                            |
| `--model <model>`    |       | Card model (default: Basic)             |
| `--tags <tags>`      |       | Extra tags (comma-separated)            |
| `--preview`          | `-p`  | Dry run — show what would be imported   |
| `--delimiter <char>` | `-d`  | CSV delimiter (default: `,`)            |
| `--mapping <json>`   |       | Custom CSV column mapping               |

---

## `note tag` — Bulk tag management

Add or remove tags across all notes matching an AnkiConnect query.

```bash
ankiniki note tag <query> --add <tags> [--remove <tags>] [--deck <name>] [--yes]
```

**Examples:**

```bash
# Tag all notes in a deck
ankiniki note tag "deck:Japanese" --add "n+1,active"

# Rename a tag across all notes
ankiniki note tag "tag:old-tag" --remove "old-tag" --add "new-tag" --yes

# Tag this week's new notes
ankiniki note tag "added:7" --add "this-week" --yes
```

| Option            | Short | Description                     |
| ----------------- | ----- | ------------------------------- |
| `--add <tags>`    |       | Comma-separated tags to add     |
| `--remove <tags>` |       | Comma-separated tags to remove  |
| `--deck <name>`   | `-d`  | Scope search to a specific deck |
| `--yes`           | `-y`  | Skip confirmation prompt        |

---

## `deck` — Manage decks

```bash
ankiniki deck list
ankiniki deck create "Programming::TypeScript"
ankiniki deck delete "Old Deck"
ankiniki deck delete "Old Deck" --force    # skip confirmation
```

> `deck delete` removes the deck **and all its cards**. A confirmation prompt is shown by default.

---

## `export` — Export a deck

```bash
ankiniki export <deck> [output] [--format apkg|csv|json] [--query <query>] [--include-sched]
```

| Format | Description                                        |
| ------ | -------------------------------------------------- |
| `apkg` | Anki package — import directly into Anki (default) |
| `csv`  | Spreadsheet-friendly, all fields + tags            |
| `json` | Machine-readable array of note objects             |

**Examples:**

```bash
ankiniki export "JavaScript"                             # → JavaScript.apkg
ankiniki export "JavaScript" --format csv               # → JavaScript.csv
ankiniki export "JavaScript" --format json              # → JavaScript.json
ankiniki export "JavaScript" notes.apkg --include-sched
ankiniki export "JavaScript" --format csv --query "tag:hard"
```

---

## `stats` — Review statistics

```bash
ankiniki stats                     # full dashboard
ankiniki stats --brief             # one-line summary (e.g. for status bars)
ankiniki stats --deck "JavaScript" # scope to one deck
```

---

## `sync` — AnkiWeb sync

```bash
ankiniki sync
```

Triggers the same sync as Anki's built-in "Sync" button. Requires an AnkiWeb account configured in Anki.

---

## `config` — Settings

```bash
ankiniki config --show
ankiniki config --set defaultDeck=JavaScript
ankiniki config --set serverUrl=http://localhost:3001
ankiniki config --edit
ankiniki config --reset
```

| Key              | Default                 | Description                              |
| ---------------- | ----------------------- | ---------------------------------------- |
| `ankiConnectUrl` | `http://localhost:8765` | AnkiConnect API endpoint                 |
| `serverUrl`      | `http://localhost:3001` | Ankiniki backend (for import + generate) |
| `defaultDeck`    | `Default`               | Deck used when none is specified         |
| `defaultModel`   | `Basic`                 | Card model used when none is specified   |
| `debugMode`      | `false`                 | Verbose logging                          |

Config is saved at `~/.ankiniki.json`.

---

## Common workflows

### Capture while coding

```bash
ankiniki note add "Rust" \
  "What does \`Option::unwrap_or_else\` do?" \
  "Returns the value or calls a closure to compute a fallback" \
  --tags "rust,option"
```

### Batch import from study notes

```bash
ankiniki note import study-notes.md --preview
ankiniki note import study-notes.md
```

### AI-generate cards from a PR diff

```bash
git diff main | ankiniki note generate --stdin --content-type code --deck "Review" --yes
```

### Daily review

```bash
ankiniki study "Programming" --count 10 --random
```

### Back up a deck

```bash
ankiniki export "Programming::Rust" rust-deck.apkg --include-sched
```

### Rename a tag across a deck

```bash
ankiniki note tag "deck:Japanese" --remove "todo" --add "done" --yes
```

---

## Troubleshooting

| Problem                    | Fix                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `Cannot connect to Anki`   | Make sure Anki desktop is open and AnkiConnect is installed                            |
| `Deck does not exist`      | Create the deck with `ankiniki deck create "<name>"` or check spelling                 |
| `Import failed: API Error` | Check backend server is running (`npm run dev --workspace=@ankiniki/backend`)          |
| `Model does not exist`     | Use `ankiniki deck list` to see decks, then check model names in Anki desktop settings |

AnkiConnect status: open `http://localhost:8765` in a browser — it should return a version number.
