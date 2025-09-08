# Getting Started with Ankiniki

Welcome to Ankiniki! This guide will walk you through setting up and using all components of the Ankiniki ecosystem to supercharge your technical learning with Anki flashcards.

## 🎯 What You'll Learn

By the end of this guide, you'll be able to:

- Set up Anki and AnkiConnect for integration
- Use the VS Code extension to create flashcards from code
- Leverage the CLI tool for quick card creation
- Use the desktop app for advanced card management
- Integrate Ankiniki into your daily development workflow

## 📋 Prerequisites

### Required Software

- **Anki Desktop**: Download from [ankisrs.net](https://apps.ankiweb.net/)
- **Node.js**: Version 18.0.0 or higher ([nodejs.org](https://nodejs.org/))
- **npm**: Version 9.0.0 or higher (comes with Node.js)

### Optional but Recommended

- **VS Code**: For the extension ([code.visualstudio.com](https://code.visualstudio.com/))
- **Git**: For cloning the repository ([git-scm.com](https://git-scm.com/))

### System Compatibility

- **Windows**: Windows 10/11
- **macOS**: macOS 10.15 (Catalina) or later
- **Linux**: Ubuntu 18.04+ or equivalent distributions

## 🚀 Step 1: Set Up Anki and AnkiConnect

### Install Anki Desktop

1. Download Anki from [ankisrs.net](https://apps.ankiweb.net/)
2. Install and launch Anki
3. Create an account or sign in
4. Create a test deck (optional)

### Install AnkiConnect Addon

1. In Anki, go to **Tools** → **Add-ons** → **Get Add-ons**
2. Enter addon code: **`2055492159`**
3. Click **OK** and wait for installation
4. **Restart Anki** (very important!)

### Verify AnkiConnect

1. Keep Anki running
2. Open a web browser or terminal
3. Test the connection:

**Browser method:**

```
http://localhost:8765
```

Should show: "AnkiConnect v.X"

**Terminal method:**

```bash
curl -X POST http://localhost:8765 \
  -H "Content-Type: application/json" \
  -d '{"action": "version", "version": 6}'
```

Should return: `{"result": 6, "error": null}`

## 🏗️ Step 2: Install Ankiniki

### Option A: Full Development Setup

```bash
# Clone the repository
git clone https://github.com/iray-tno/ankiniki.git
cd ankiniki

# Install all dependencies
npm install

# Build all components
npm run build
```

### Option B: Individual Components

Choose which components you want to use:

#### VS Code Extension Only

```bash
git clone https://github.com/iray-tno/ankiniki.git
cd ankiniki/apps/vscode-extension
npm install
npm run compile
# Press F5 in VS Code to load extension
```

#### CLI Tool Only

```bash
git clone https://github.com/iray-tno/ankiniki.git
cd ankiniki/apps/cli
npm install
npm run build
npm link  # Makes 'ankiniki' command globally available
```

#### Desktop App Only

```bash
git clone https://github.com/iray-tno/ankiniki.git
cd ankiniki/apps/desktop
npm install
npm run build
npm run dev  # Launch the desktop app
```

## 🔧 Step 3: Configure Your Tools

### Configure CLI Tool

```bash
# Configure connection and defaults
ankiniki config --edit

# Or set individual values
ankiniki config --set ankiConnectUrl=http://localhost:8765
ankiniki config --set defaultDeck="Programming"
ankiniki config --set defaultModel="Basic"

# Test the connection
ankiniki config --show
```

### Configure VS Code Extension

1. Open VS Code Settings (`Ctrl+,`)
2. Search for "Ankiniki"
3. Configure:
   - **AnkiConnect URL**: `http://localhost:8765`
   - **Default Deck**: Your preferred deck name
   - **Default Model**: Usually "Basic"
   - **Auto Detect Language**: `true` (recommended)
   - **Include File Path**: `true` (recommended)

### Configure Desktop App

1. Launch the desktop app
2. Go to Settings (gear icon)
3. Set AnkiConnect URL: `http://localhost:8765`
4. Select default deck and model
5. Test connection (should show green checkmark)

## 🎯 Step 4: Your First Flashcard

Let's create your first flashcard using each method:

### Method 1: VS Code Extension

1. Open a code file in VS Code
2. Select this code:

```javascript
const greeting = name => `Hello, ${name}!`;
```

3. Press `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac)
4. Enter question: "What does this function do?"
5. Select your target deck
6. Check Anki - your card should appear!

### Method 2: CLI Tool

```bash
# Quick add
ankiniki add "What is a JavaScript arrow function?" "A concise way to write functions using => syntax"

# Interactive mode
ankiniki add --interactive

# Add with tags
ankiniki add "What is React?" "A JavaScript library for building UIs" --tags "javascript,react,frontend"
```

### Method 3: Desktop App

1. Open the Ankiniki desktop app
2. Click "Create New Card"
3. Select your deck
4. Enter front: "What is Node.js?"
5. Enter back: "A JavaScript runtime built on Chrome's V8 engine"
6. Add tags: `javascript`, `backend`, `nodejs`
7. Click "Save Card"

## 📚 Step 5: Explore Core Workflows

### Workflow 1: Learning from Code Examples

**Scenario**: You're studying React components

1. **Find interesting code** in your project or tutorials
2. **Select the code** in VS Code
3. **Create flashcard** (`Ctrl+Shift+A`)
4. **Customize question** based on what you want to learn
5. **Study in Anki** using spaced repetition

**Example Code:**

```jsx
const UserProfile = ({ user, onEdit }) => {
  return (
    <div className='user-profile'>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={onEdit}>Edit</button>
    </div>
  );
};
```

**Generated Question:** "What does this React component do?"
**Your Edit:** "How do you create a functional component with props in React?"

### Workflow 2: Quick Concept Capture

**Scenario**: You learn something new in documentation

1. **Read documentation** or tutorial
2. **Press `Ctrl+Shift+Q`** in VS Code for quick add
3. **Enter concept** as question
4. **Enter explanation** as answer
5. **Let tags auto-generate** or add custom ones

### Workflow 3: Command Line Productivity

**Scenario**: Working in terminal, want to capture commands

```bash
# Learn a new git command
ankiniki add "How do you undo the last commit in git?" "git reset --soft HEAD~1" --tags "git,commands"

# Document an npm script
ankiniki add "How to run all tests in parallel?" "npm run test -- --parallel" --tags "npm,testing"

# Save a useful regex
ankiniki add "Regex to match email addresses" "/^[^\s@]+@[^\s@]+\.[^\s@]+$/" --tags "regex,validation"
```

### Workflow 4: Desktop App for Complex Cards

**Scenario**: Creating detailed explanation cards

1. Open desktop app for rich editing
2. Use markdown formatting in content
3. Add multiple tags for organization
4. Preview card before saving
5. Create related cards in same session

## 🔄 Step 6: Study and Review

### In Anki Desktop

1. Open Anki
2. Click on your deck
3. Click "Study Now"
4. Review cards using Anki's spaced repetition
5. Rate your recall (Again, Hard, Good, Easy)

### Study Tips

- **Consistent Daily Review**: 10-15 minutes daily
- **Quality over Quantity**: Focus on understanding, not memorization
- **Update Cards**: Improve questions and answers as you learn
- **Use Tags**: Filter cards by topic or difficulty
- **Regular Cleanup**: Archive outdated or duplicate cards

## 🛠️ Step 7: Customize Your Setup

### Advanced CLI Configuration

```bash
# Create custom configuration for different projects
ankiniki config --set defaultDeck="React Concepts"
ankiniki config --set debugMode=true

# View current configuration
ankiniki config --show
```

### VS Code Extension Customization

```json
// settings.json
{
  "ankiniki.defaultDeck": "Code Snippets",
  "ankiniki.autoDetectLanguage": true,
  "ankiniki.includeFilePath": true,
  "ankiniki.showNotifications": false // For quiet mode
}
```

### Desktop App Themes

- Light and dark themes available
- Syntax highlighting themes
- Custom CSS support (advanced)

## 📊 Step 8: Track Your Progress

### Anki Statistics

- View learning progress in Anki
- Track daily review streaks
- Monitor retention rates
- Identify difficult topics

### Deck Organization

```
📚 Programming/
  ├── 🟦 JavaScript Fundamentals
  ├── 🟦 React Patterns
  ├── 🟦 Node.js APIs
  ├── 🟦 TypeScript Types
  └── 🟦 Git Commands

📚 Computer Science/
  ├── 🟦 Algorithms
  ├── 🟦 Data Structures
  └── 🟦 System Design
```

## 🚨 Common Issues and Solutions

### Issue: "Cannot connect to AnkiConnect"

**Solution:**

1. Ensure Anki is running
2. Check AnkiConnect addon is installed
3. Restart Anki
4. Try different port if needed

### Issue: Cards not appearing in Anki

**Solution:**

1. Check target deck exists
2. Use Anki's Browse feature to search
3. Verify card model compatibility
4. Check for duplicate prevention settings

### Issue: VS Code extension not working

**Solution:**

1. Ensure VS Code version 1.74.0+
2. Reload VS Code window
3. Check extension is activated
4. Try reinstalling extension

### Issue: CLI command not found

**Solution:**

```bash
# Relink the CLI tool
cd apps/cli
npm run build
npm link
```

## 🎉 Next Steps

Congratulations! You now have a fully functional Ankiniki setup. Here's what to explore next:

### Immediate Actions

1. **Create 5-10 cards** using different methods
2. **Study them in Anki** to test the workflow
3. **Customize settings** based on your preferences
4. **Explore keyboard shortcuts** in VS Code

### Advanced Usage

- Set up different decks for different topics
- Experiment with card templates in Anki
- Create custom tags for better organization
- Integrate with your existing study routine

### Stay Updated

- Watch the GitHub repository for updates
- Check for new features and improvements
- Contribute feedback and suggestions
- Share your workflows with the community

## 📚 Additional Resources

- **[VS Code Extension Guide](../user-guides/vscode-extension/)**: Detailed extension usage
- **[CLI Reference](../reference/cli/)**: Complete command documentation
- **[Desktop App Guide](../user-guides/desktop-app/)**: GUI application features
- **[API Documentation](../reference/api/)**: For developers and integrations
- **[Troubleshooting Guide](../troubleshooting/)**: Solutions to common issues

---

**Ready to revolutionize your technical learning?** Start creating your first flashcards and let Anki's spaced repetition help you master new technologies faster than ever! 🚀
