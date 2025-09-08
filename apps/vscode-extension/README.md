# Ankiniki VS Code Extension

Create Anki flashcards directly from VS Code with intelligent code understanding and seamless workflow integration.

## Features

### 🚀 Quick Card Creation

- **Add Selected Text**: Convert any selected text into a flashcard
- **Add Code Block**: Create code-focused flashcards with syntax highlighting
- **Quick Add**: Rapid card creation with prompts for question and answer

### 🎯 Smart Code Understanding

- **Language Detection**: Automatically detects programming language
- **Context Awareness**: Generates relevant questions based on code type
- **File Path Tracking**: Includes source file information in cards
- **Syntax Highlighting**: Properly formatted code blocks in Anki

### ⚡ Seamless Integration

- **Keyboard Shortcuts**:
  - `Ctrl+Shift+A` (Mac: `Cmd+Shift+A`) - Add selected text
  - `Ctrl+Shift+C` (Mac: `Cmd+Shift+C`) - Add code block
  - `Ctrl+Shift+Q` (Mac: `Cmd+Shift+Q`) - Quick add
- **Context Menu**: Right-click to create cards from selections
- **Command Palette**: All commands available via `Ctrl+Shift+P`
- **Sidebar Panel**: Dedicated Ankiniki panel for quick access

## Requirements

- **Anki Desktop**: Must be running with AnkiConnect addon
- **AnkiConnect**: Install addon code `2055492159`
- **VS Code**: Version 1.74.0 or higher

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "Ankiniki"
4. Click Install

### From Source

1. Clone the Ankiniki repository
2. Navigate to `apps/vscode-extension`
3. Run `npm install && npm run compile`
4. Press `F5` to open Extension Development Host

## Setup

### 1. Install AnkiConnect

1. Open Anki
2. Go to Tools → Add-ons → Get Add-ons
3. Enter code: `2055492159`
4. Restart Anki

### 2. Configure Extension

1. Open VS Code Settings (`Ctrl+,`)
2. Search for "Ankiniki"
3. Configure your preferences:
   - **AnkiConnect URL**: Default `http://localhost:8765`
   - **Default Deck**: Target deck for new cards
   - **Default Model**: Card template (usually "Basic")

## Usage

### Creating Cards from Code

1. **Select Code**: Highlight the code you want to turn into a flashcard
2. **Add Card**: Use `Ctrl+Shift+A` or right-click → "Add Selected Text as Flashcard"
3. **Add Question**: Enter a question that describes what the code does
4. **Choose Deck**: Select target deck (or use default)
5. **Done**: Card is automatically created in Anki

### Quick Card Creation

1. **Quick Add**: Press `Ctrl+Shift+Q` or use Command Palette
2. **Enter Question**: Type the front side of your card
3. **Enter Answer**: Type the back side of your card
4. **Choose Deck**: Select target deck
5. **Done**: Card appears in Anki immediately

### Code Block Cards

1. **Position Cursor**: Place cursor on the line you want to capture
2. **Add Code Block**: Press `Ctrl+Shift+C` or use context menu
3. **Describe Function**: Enter what the code does
4. **Auto-Format**: Code is automatically formatted with syntax highlighting

## Settings

| Setting                       | Default                 | Description                                |
| ----------------------------- | ----------------------- | ------------------------------------------ |
| `ankiniki.ankiConnectUrl`     | `http://localhost:8765` | AnkiConnect server URL                     |
| `ankiniki.defaultDeck`        | `Default`               | Default deck for new cards                 |
| `ankiniki.defaultModel`       | `Basic`                 | Default card model/template                |
| `ankiniki.autoDetectLanguage` | `true`                  | Auto-detect code language for highlighting |
| `ankiniki.includeFilePath`    | `true`                  | Include source file path in cards          |
| `ankiniki.showNotifications`  | `true`                  | Show success/error notifications           |

## Keyboard Shortcuts

| Shortcut       | Command                    | Description                    |
| -------------- | -------------------------- | ------------------------------ |
| `Ctrl+Shift+A` | `ankiniki.addSelectedText` | Add selected text as flashcard |
| `Ctrl+Shift+C` | `ankiniki.addCodeBlock`    | Add code block as flashcard    |
| `Ctrl+Shift+Q` | `ankiniki.quickAdd`        | Quick add flashcard            |

_On Mac, use `Cmd` instead of `Ctrl`_

## Commands

Access all commands via Command Palette (`Ctrl+Shift+P`):

- **Ankiniki: Add Selected Text as Flashcard**
- **Ankiniki: Add Code Block as Flashcard**
- **Ankiniki: Quick Add Flashcard**
- **Ankiniki: Open Ankiniki Sidebar**
- **Ankiniki: Open Settings**

## Troubleshooting

### Cannot Connect to Anki

1. Make sure Anki is running
2. Verify AnkiConnect addon is installed (code: `2055492159`)
3. Check if Anki is listening on port 8765
4. Try restarting Anki

### Cards Not Appearing

1. Check the target deck exists in Anki
2. Verify the card model exists (usually "Basic")
3. Look in Anki's "Browse" to find recently added cards

### Permission Errors

1. Check AnkiConnect CORS settings
2. Ensure firewall isn't blocking localhost connections
3. Try different AnkiConnect URL if using remote Anki

## Development

### Building from Source

```bash
cd apps/vscode-extension
npm install
npm run compile
```

### Running Tests

```bash
npm run test
```

### Packaging Extension

```bash
npm run package
```

## Contributing

Contributions are welcome! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## Links

- [Ankiniki Main Project](https://github.com/iray-tno/ankiniki)
- [AnkiConnect](https://github.com/FooSoft/anki-connect)
- [VS Code Extension API](https://code.visualstudio.com/api)
