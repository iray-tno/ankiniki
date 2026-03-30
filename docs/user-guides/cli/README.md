# Ankiniki CLI — Hands-On Guide

A practical guide to using the `ankiniki` command-line tool to create, study, and manage Anki flashcards from your terminal.

> **Japanese version:** [日本語版はこちら](../../ja/user-guides/cli/README.md)

---

## Prerequisites

Before using the CLI you need:

1. **Anki desktop** running on your machine
2. **AnkiConnect addon** installed in Anki (code: `2055492159`)
   - Anki → Tools → Add-ons → Get Add-ons → enter the code
3. **Ankiniki backend server** running (for import commands)
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
ankiniki config --show

# Add your first card
ankiniki add "My Deck" "What is a closure?" "A function that captures its enclosing scope"

# List your decks
ankiniki list

# Study a deck
ankiniki study "My Deck"
```

---

## Commands

### `add` — Create a flashcard

**One-liner:**

```bash
ankiniki add [deck] [front] [back]
```

**Examples:**

```bash
# Positional arguments (fastest)
ankiniki add "JavaScript" "What is hoisting?" "Moving declarations to the top of scope"

# With tags and model
ankiniki add "Rust" "What is ownership?" "Each value has one owner" \
  --tags "rust,memory,ownership" \
  --model "Basic"

# Use default deck (set via config)
ankiniki add "What is a monad?" "A monoid in the category of endofunctors"

# Interactive mode — prompts for everything
ankiniki add --interactive
ankiniki add -i
```

**Options:**

| Option            | Short | Description                        |
| ----------------- | ----- | ---------------------------------- |
| `--tags <tags>`   | `-t`  | Comma-separated tags               |
| `--model <model>` | `-m`  | Card model (default: Basic)        |
| `--interactive`   | `-i`  | Interactive prompts for all fields |

**Interactive mode** opens your `$EDITOR` for front/back content — useful for multi-line code snippets.

---

### `study` — Quick study session

Starts an in-terminal study session: shows the front, waits for Enter, reveals the back, asks you to rate 1–4.

```bash
ankiniki study [deck]
```

**Examples:**

```bash
# Study a specific deck (5 cards by default)
ankiniki study "JavaScript"

# Study 20 cards in random order
ankiniki study "JavaScript" --count 20 --random
ankiniki study "JavaScript" -n 20 --random

# Omit deck to pick from a list
ankiniki study
```

**Options:**

| Option        | Short | Description                           |
| ------------- | ----- | ------------------------------------- |
| `--count <n>` | `-n`  | Number of cards to study (default: 5) |
| `--random`    |       | Shuffle cards                         |

**Rating scale:**

| Choice   | Meaning               |
| -------- | --------------------- |
| ❌ Again | Didn't know it        |
| 🔶 Hard  | Got it, but difficult |
| ✅ Good  | Knew it               |
| 🚀 Easy  | Too easy              |

> **Note:** This mode picks cards from the deck regardless of Anki's scheduling. To use Anki's spaced repetition schedule, review cards in Anki desktop as usual.

---

### `list` — Browse decks and cards

```bash
ankiniki list                        # list all decks (default)
ankiniki list --decks                # same as above
ankiniki list --cards "My Deck"      # list cards in a deck
ankiniki list --cards "My Deck" --limit 50
```

**Examples:**

```bash
# See all decks with card counts
ankiniki list

# Browse cards in a deck (first 10)
ankiniki list --cards "JavaScript"

# See more cards
ankiniki list --cards "JavaScript" --limit 50
```

**Options:**

| Option           | Short | Description               |
| ---------------- | ----- | ------------------------- |
| `--decks`        | `-d`  | List all decks            |
| `--cards <deck>` | `-c`  | List cards in deck        |
| `--limit <n>`    | `-l`  | Max results (default: 10) |

---

### `config` — Manage settings

```bash
ankiniki config               # show current config (default)
ankiniki config --show
ankiniki config --edit        # interactive editor
ankiniki config --set key=value
ankiniki config --reset       # restore defaults
```

**Configuration keys:**

| Key              | Default                 | Description                            |
| ---------------- | ----------------------- | -------------------------------------- |
| `ankiConnectUrl` | `http://localhost:8765` | AnkiConnect API endpoint               |
| `serverUrl`      | `http://localhost:3001` | Ankiniki backend (used for import)     |
| `defaultDeck`    | `Default`               | Deck used when none is specified       |
| `defaultModel`   | `Basic`                 | Card model used when none is specified |
| `debugMode`      | `false`                 | Verbose logging                        |

**Examples:**

```bash
# Show current settings and connection status
ankiniki config --show

# Set default deck
ankiniki config --set defaultDeck=JavaScript

# Change backend URL
ankiniki config --set serverUrl=http://localhost:3001

# Interactive edit (opens prompts with live deck/model selection)
ankiniki config --edit

# Reset everything to defaults
ankiniki config --reset
```

Config is saved at `~/.ankiniki.json`.

---

### `import` — Bulk import from file

Import multiple cards at once from CSV, JSON, or Markdown. Format is **auto-detected from the file extension**.

```bash
ankiniki import <file> [options]
```

#### CSV import

```bash
# Auto-detected from .csv extension
ankiniki import cards.csv

# Preview first (no cards created)
ankiniki import cards.csv --preview

# Override default deck and tags
ankiniki import cards.csv --deck "JavaScript" --tags "imported,js"
```

**CSV format:**

```csv
Front,Back,Deck,Tags,Model
"What is a closure?","A function capturing its enclosing scope","JavaScript","js,closures","Basic"
"What is hoisting?","Moving declarations to the top","JavaScript","js","Basic"
```

Minimal (deck/tags from CLI flags):

```csv
Front,Back
"What is a closure?","A function capturing its enclosing scope"
```

Custom column names:

```bash
ankiniki import cards.csv \
  --mapping '{"front":"Question","back":"Answer","deck":"Subject","tags":"Topics"}'
```

---

#### JSON import

```bash
# Auto-detected from .json extension
ankiniki import cards.json

ankiniki import cards.json --preview
ankiniki import cards.json --deck "Rust" --tags "rust"
```

**JSON format (array):**

```json
[
  {
    "front": "What is ownership?",
    "back": "Each value in Rust has one owner.",
    "deck": "Rust",
    "tags": ["rust", "memory"]
  },
  {
    "front": "What is borrowing?",
    "back": "Temporarily using a value without taking ownership.",
    "deck": "Rust",
    "tags": ["rust", "memory"]
  }
]
```

**JSON format (object with defaults):**

```json
{
  "deck_name": "Rust",
  "default_tags": ["rust"],
  "default_model": "Basic",
  "cards": [
    { "front": "What is ownership?", "back": "Each value has one owner." },
    { "front": "What is borrowing?", "back": "Temporarily using without owning." }
  ]
}
```

---

#### Markdown import

```bash
# Auto-detected from .md extension
ankiniki import cards.md

ankiniki import cards.md --preview
ankiniki import cards.md --deck "TypeScript"
```

**Markdown format:**

```markdown
---
deck: Programming::TypeScript
tags: [typescript, types]
---

## What is a type assertion?

**Front:** What is a type assertion in TypeScript?
**Back:** Telling the compiler to treat a value as a specific type using `as` or `<Type>`.

## What is a union type?

**Front:** What is a union type?
**Back:** A type that can be one of several types, written as `A | B`.
```

- The frontmatter (`---` block) sets the default deck and tags
- Each `##` section is one card
- `**Front:**` and `**Back:**` are required in each section

---

#### Common import options

| Option               | Short | Description                             |
| -------------------- | ----- | --------------------------------------- |
| `--format <fmt>`     | `-f`  | Force format: `csv`, `json`, `markdown` |
| `--deck <deck>`      |       | Default deck (overrides file content)   |
| `--model <model>`    |       | Card model (default: Basic)             |
| `--tags <tags>`      |       | Extra tags (comma-separated)            |
| `--preview`          | `-p`  | Dry run — show what would be imported   |
| `--dry-run`          |       | Same as `--preview`                     |
| `--delimiter <char>` | `-d`  | CSV delimiter (default: `,`)            |
| `--mapping <json>`   |       | Custom CSV column mapping               |

---

### `import mapping` — Show format examples

```bash
ankiniki import mapping
```

---

## Common Workflows

### Engineer workflow: capture while coding

```bash
# Just learned something in Rust — add it immediately
ankiniki add "Rust" \
  "What does \`Option::unwrap_or_else\` do?" \
  "Returns the value or calls a closure to compute a fallback"  \
  --tags "rust,option,error-handling"

# Check it was added
ankiniki list --cards "Rust"
```

### Batch import from study notes

```bash
# Write cards in Markdown while reading docs, then import all at once
ankiniki import study-notes.md --preview   # check first
ankiniki import study-notes.md
```

### Daily review in terminal

```bash
# 10 random cards from your main deck
ankiniki study "Programming" --count 10 --random
```

### Sync config on a new machine

```bash
ankiniki config --edit   # set ankiConnectUrl, serverUrl, defaultDeck
ankiniki config --show   # verify connection is green
```

---

## Troubleshooting

| Problem                    | Fix                                                                           |
| -------------------------- | ----------------------------------------------------------------------------- |
| `Cannot connect to Anki`   | Make sure Anki desktop is open and AnkiConnect is installed                   |
| `Deck does not exist`      | Create the deck in Anki first, or check the name spelling                     |
| `Import failed: API Error` | Check backend server is running (`npm run dev --workspace=@ankiniki/backend`) |
| `Model does not exist`     | Use `ankiniki list` to see model names, or use `Basic`                        |

AnkiConnect status: open `http://localhost:8765` in a browser — it should return a version number.
