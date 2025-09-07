# Ankiniki CLI

Command-line interface for quick flashcard management with Anki.

## Installation

```bash
# From the project root
npm install
npm run build

# Link globally (optional)
cd apps/cli
npm link
```

## Usage

### Basic Commands

```bash
# Show help
ankiniki --help

# Add a new card
ankiniki add "What is React?" "A JavaScript library for building user interfaces"

# Add card to specific deck
ankiniki add "JavaScript Basics" "What is a closure?" "A function that has access to outer function variables"

# Interactive card creation
ankiniki add --interactive

# List all decks
ankiniki list

# List cards in a deck
ankiniki list --cards "JavaScript Basics"

# Study cards
ankiniki study

# Study specific deck
ankiniki study "React Concepts"

# Configuration
ankiniki config --show
ankiniki config --edit
ankiniki config --set defaultDeck=MyDeck
```

### Options

#### Add Command
- `--tags <tags>`: Comma-separated tags
- `--model <model>`: Card model to use
- `--interactive`: Interactive mode with editor

#### List Command
- `--decks`: List all decks (default)
- `--cards <deck>`: List cards in specific deck
- `--limit <number>`: Limit results (default: 10)

#### Study Command
- `--count <number>`: Number of cards to study (default: 5)
- `--random`: Study in random order

#### Config Command
- `--show`: Show current configuration
- `--edit`: Edit configuration interactively
- `--set <key=value>`: Set a configuration value
- `--reset`: Reset to defaults

## Configuration

The CLI stores configuration in `~/.ankiniki.json`:

```json
{
  "ankiConnectUrl": "http://localhost:8765",
  "defaultDeck": "Default",
  "defaultModel": "Basic",
  "debugMode": false
}
```

## Examples

```bash
# Quick card addition
ankiniki add "JavaScript" "What is hoisting?" "Variable declarations are moved to the top"

# Add with tags
ankiniki add "React" "What is JSX?" "JavaScript XML syntax" --tags "react,jsx,syntax"

# Interactive mode with editor
ankiniki add -i

# Study session
ankiniki study "JavaScript Fundamentals" --count 10 --random

# List recent cards
ankiniki list --cards "React Concepts" --limit 5
```

## Requirements

- Node.js 18+
- Anki running with AnkiConnect addon
- AnkiConnect addon must allow requests from localhost