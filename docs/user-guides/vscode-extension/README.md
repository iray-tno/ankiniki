# VS Code Extension User Guide

The Ankiniki VS Code extension brings Anki flashcard creation directly into your development environment, making it seamless to capture and learn from code snippets, technical concepts, and programming knowledge.

## 🚀 Quick Start

### Prerequisites

- **VS Code**: Version 1.74.0 or higher
- **Anki Desktop**: Running with AnkiConnect addon
- **AnkiConnect**: Addon installed (code: `2055492159`)

### Installation

#### From VS Code Marketplace _(Coming Soon)_

1. Open VS Code Extensions (`Ctrl+Shift+X`)
2. Search for "Ankiniki"
3. Click "Install"

#### From Source

1. Clone the Ankiniki repository
2. Open `apps/vscode-extension` folder in VS Code
3. Press `F5` to launch Extension Development Host

### Initial Setup

1. **Configure Anki Connection**:
   - Open VS Code Settings (`Ctrl+,`)
   - Search for "Ankiniki"
   - Set AnkiConnect URL (default: `http://localhost:8765`)
   - Set default deck and card model

2. **Verify Connection**:
   - Open Command Palette (`Ctrl+Shift+P`)
   - Run "Ankiniki: Quick Add Flashcard"
   - Extension will show connection status

## 📖 Features Overview

### Core Commands

- **Add Selected Text as Flashcard** (`Ctrl+Shift+A`): Convert selected text to flashcard
- **Add Code Block as Flashcard** (`Ctrl+Shift+C`): Create code-focused flashcard
- **Quick Add Flashcard** (`Ctrl+Shift+Q`): Rapid card creation with prompts

### Smart Features

- **Language Detection**: Automatically detects programming language
- **Syntax Highlighting**: Preserves code formatting in Anki
- **Context Awareness**: Generates relevant questions based on code type
- **File Tracking**: Includes source file path and line numbers
- **Auto-Tagging**: Tags cards with language, file type, and project info

## 🎯 Usage Scenarios

### Scenario 1: Learning New Code Patterns

**When you encounter interesting code:**

1. Select the code snippet
2. Press `Ctrl+Shift+A` or right-click → "Add Selected Text as Flashcard"
3. Review the auto-generated question or customize it
4. Select target deck (or use default)
5. Card is created in Anki instantly

**Example:**

```javascript
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
```

_Auto-generated question: "What does this JavaScript function do?"_

### Scenario 2: Quick Code Snippet Reference

**For code you want to remember:**

1. Place cursor on line or select block
2. Press `Ctrl+Shift+C` for code-specific flashcard
3. Extension formats code with syntax highlighting
4. Includes file path: `src/utils/debounce.js (lines 15-25)`

### Scenario 3: Concept-Based Learning

**For general programming concepts:**

1. Press `Ctrl+Shift+Q` for quick add
2. Enter question: "What is event delegation?"
3. Enter answer: "A technique where..."
4. Card created with 'vscode' and 'quick-add' tags

## ⚙️ Configuration

### Available Settings

| Setting                       | Default                 | Description                        |
| ----------------------------- | ----------------------- | ---------------------------------- |
| `ankiniki.ankiConnectUrl`     | `http://localhost:8765` | AnkiConnect server URL             |
| `ankiniki.defaultDeck`        | `Default`               | Target deck for new cards          |
| `ankiniki.defaultModel`       | `Basic`                 | Card template (Basic, Cloze, etc.) |
| `ankiniki.autoDetectLanguage` | `true`                  | Auto-detect code language          |
| `ankiniki.includeFilePath`    | `true`                  | Include source file in cards       |
| `ankiniki.showNotifications`  | `true`                  | Show success/error messages        |

### Configuration Examples

#### Basic Setup

```json
{
  "ankiniki.defaultDeck": "Programming",
  "ankiniki.defaultModel": "Basic",
  "ankiniki.showNotifications": true
}
```

#### Advanced Setup

```json
{
  "ankiniki.ankiConnectUrl": "http://localhost:8765",
  "ankiniki.defaultDeck": "Code Snippets",
  "ankiniki.autoDetectLanguage": true,
  "ankiniki.includeFilePath": true
}
```

## 🎨 User Interface

### Command Palette Integration

Access via `Ctrl+Shift+P`:

- **Ankiniki: Add Selected Text as Flashcard**
- **Ankiniki: Add Code Block as Flashcard**
- **Ankiniki: Quick Add Flashcard**
- **Ankiniki: Open Ankiniki Sidebar**
- **Ankiniki: Open Settings**

### Context Menu Integration

Right-click in editor:

- **Add Selected Text as Flashcard** (when text selected)
- **Add Code Block as Flashcard** (when in code file)

### Sidebar Panel

- Access via Activity Bar or Command Palette
- Quick action buttons
- One-click settings access
- Connection status display

### Keyboard Shortcuts

| Shortcut                              | Command           | When Available   |
| ------------------------------------- | ----------------- | ---------------- |
| `Ctrl+Shift+A` (`Cmd+Shift+A` on Mac) | Add Selected Text | Text is selected |
| `Ctrl+Shift+C` (`Cmd+Shift+C` on Mac) | Add Code Block    | In any file      |
| `Ctrl+Shift+Q` (`Cmd+Shift+Q` on Mac) | Quick Add         | Always           |

## 🔧 Advanced Usage

### Smart Question Generation

The extension analyzes your code and generates contextually relevant questions:

**JavaScript Functions:**

```javascript
function calculateFibonacci(n) { ... }
```

_Generated: "What does this JavaScript function do?"_

**React Components:**

```jsx
const UserProfile = ({ user, onEdit }) => { ... }
```

_Generated: "What is the purpose of this React component?"_

**Type Definitions:**

```typescript
interface ApiResponse<T> { ... }
```

_Generated: "What does this TypeScript interface represent?"_

### Custom Tagging Strategy

Cards are automatically tagged with:

- `vscode` (always)
- Programming language (e.g., `javascript`, `python`)
- File extension (e.g., `ts`, `jsx`)
- Project folder (first folder in path)
- Custom tags (if specified)

**Example tags for `src/components/Button.tsx`:**
`vscode`, `typescript`, `tsx`, `src`, `components`

### File Path Integration

When enabled, cards include:

- **Front side**: Question + source file reference
- **Back side**: Code + full file path and line numbers
- **Format**: `src/utils/helpers.js (lines 42-58)`

### Deck Management

**Automatic Deck Creation:**

- Extension uses existing decks in Anki
- If default deck doesn't exist, prompts for selection
- No automatic deck creation (Anki handles this)

**Deck Selection Workflow:**

1. Extension queries available decks from Anki
2. Uses default deck if available
3. Shows picker if default not found
4. Remembers choice for session

## 🚨 Troubleshooting

### Common Issues

#### Cannot Connect to Anki

**Symptoms:** "Cannot connect to Anki" notification
**Solutions:**

1. Ensure Anki is running
2. Verify AnkiConnect addon installed (`2055492159`)
3. Check AnkiConnect is listening on port 8765
4. Try restarting Anki
5. Check firewall settings

#### Cards Not Appearing in Anki

**Symptoms:** Success message but no cards in Anki
**Solutions:**

1. Check target deck exists in Anki
2. Verify card model exists (usually "Basic")
3. Use Anki's Browse feature to search for recent cards
4. Check if cards were added to different deck

#### Extension Commands Not Available

**Symptoms:** Commands missing from Command Palette
**Solutions:**

1. Ensure VS Code version is 1.74.0+
2. Reload VS Code window (`Ctrl+Shift+P` → "Reload Window")
3. Check extension is installed and enabled
4. Try reinstalling extension

#### Syntax Highlighting Issues

**Symptoms:** Code appears without highlighting in Anki
**Solutions:**

1. Verify `autoDetectLanguage` setting is enabled
2. Check if Anki has syntax highlighting addon
3. Ensure card model supports HTML formatting
4. Try using different card template

### Debug Mode

**Enable detailed logging:**

1. Open VS Code Developer Console (`Help` → `Toggle Developer Tools`)
2. Look for Ankiniki-related messages
3. Check Network tab for AnkiConnect requests

**Manual AnkiConnect test:**

```bash
curl -X POST http://localhost:8765 \
  -H "Content-Type: application/json" \
  -d '{"action": "version", "version": 6}'
```

### Getting Help

1. **Check Documentation**: Review this guide and main README
2. **Search Issues**: GitHub repository issues section
3. **Report Bugs**: Create detailed issue with:
   - VS Code version
   - Extension version
   - Anki version
   - AnkiConnect version
   - Error messages
   - Steps to reproduce

## 💡 Tips and Best Practices

### Workflow Optimization

1. **Use Consistent Decks**: Create dedicated decks for different topics
2. **Review Generated Questions**: Edit auto-generated questions for clarity
3. **Leverage Tags**: Use tags for organization and filtering
4. **File Path Context**: Keep file paths enabled for reference

### Learning Strategy

1. **Immediate Capture**: Create cards when you learn something new
2. **Regular Review**: Use Anki's spaced repetition schedule
3. **Code Evolution**: Update cards as your understanding improves
4. **Cross-Reference**: Link cards to documentation and resources

### Performance Tips

1. **Batch Creation**: Create multiple cards before syncing
2. **Targeted Selection**: Select relevant code portions only
3. **Deck Organization**: Use specific decks to avoid clutter
4. **Regular Cleanup**: Archive or delete outdated cards

## 🔄 Integration with Other Tools

### Anki Desktop

- Cards appear immediately in Anki
- Use Anki's Browse feature to manage cards
- Export/import works with all Anki features
- Sync with AnkiWeb for mobile access

### Anki Mobile

- Cards created in VS Code sync to mobile
- Review cards on any device
- Offline study capability
- Statistics and progress tracking

### Development Workflow

- Fits into existing coding habits
- No context switching required
- Works with any programming language
- Integrates with existing VS Code shortcuts

---

_This guide covers the essential aspects of using the Ankiniki VS Code extension. For advanced configuration and development topics, see the Developer Guide._
