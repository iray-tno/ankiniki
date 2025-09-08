# Serena AI Assistant Setup for Ankiniki

This guide will help you set up Serena, an AI development assistant that understands the Ankiniki project deeply and can provide contextual help during development.

## What is Serena?

Serena is an AI assistant specifically configured for the Ankiniki project. It understands:
- Ankiniki's architecture and codebase patterns
- AnkiConnect integration details  
- TypeScript/React/Electron development workflows
- Project-specific conventions and best practices

## Prerequisites

### 1. Install uv (Python package manager)
```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Verify installation
uv --version
uvx --version
```

### 2. Install Claude Desktop
Download and install Claude Desktop from [claude.ai](https://claude.ai/desktop)

## Quick Setup

### Automated Setup (Recommended)
```bash
# Run the automated setup script
npm run serena:setup

# Test the configuration
npm run serena:test
```

### Manual Setup

#### 1. Test Serena Availability
```bash
# Test if Serena MCP server is accessible
uvx --from "git+https://github.com/oraios/serena" serena-mcp-server --help
```

#### 2. Configure Claude Desktop
Find your Claude Desktop configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`  
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Add the Ankiniki Serena configuration:

```json
{
  "mcpServers": {
    "ankiniki-serena": {
      "type": "stdio",
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena-mcp-server",
        "--context",
        "ide-assistant",
        "--project",
        "/path/to/your/ankiniki/project"
      ],
      "env": {
        "SERENA_PROJECT_NAME": "Ankiniki",
        "SERENA_PROJECT_TYPE": "monorepo",
        "SERENA_TECH_STACK": "typescript,react,electron,nodejs,express",
        "SERENA_DOMAIN": "educational-technology",
        "SERENA_FOCUS": "anki-integration"
      }
    }
  }
}
```

**Important**: Replace `/path/to/your/ankiniki/project` with your actual project path.

#### 3. Restart Claude Desktop
Close and reopen Claude Desktop to load the new configuration.

## Verification

### Test Commands
```bash
# Validate Serena configuration
npm run serena:validate

# Test MCP connection
npm run serena:test
```

### Test in Claude Desktop
Open a new conversation in Claude Desktop and try these test prompts:

```
Can you help me understand the Ankiniki architecture?
How do I add a new CLI command to Ankiniki?
Show me the AnkiConnect integration patterns in the codebase
What's the proper way to create a new React component for the desktop app?
```

If Serena is working correctly, you should get detailed, project-specific responses.

## Using Serena for Development

### Code Review and Analysis
```
Can you review this React component for Ankiniki patterns?
[paste your code]

Is this AnkiConnect integration following our established patterns?
[paste your code]
```

### Architecture Guidance
```
How should I structure a new CLI command for importing cards?
What's the best way to add a new API endpoint to the backend?
How do I properly integrate with the shared types package?
```

### Problem Solving
```
I'm getting an AnkiConnect connection error, how should I debug this?
The Electron app won't build, what could be wrong?
How do I properly handle errors in the CLI tool?
```

### Documentation Help
```
Can you help me write documentation for this new feature?
What should I include in the user guide for the card editor?
How do I structure the Japanese translation for this section?
```

## Advanced Configuration

### Environment Variables
You can customize Serena's behavior with environment variables:

```json
{
  "env": {
    "SERENA_PROJECT_NAME": "Ankiniki",
    "SERENA_PROJECT_TYPE": "monorepo",
    "SERENA_TECH_STACK": "typescript,react,electron,nodejs,express",
    "SERENA_DOMAIN": "educational-technology",
    "SERENA_FOCUS": "anki-integration",
    "SERENA_LOG_LEVEL": "debug",
    "SERENA_CONTEXT_SIZE": "large"
  }
}
```

### Context Files
Serena automatically loads context from these files:
- `.serena/context.md` - Project overview and goals
- `.serena/knowledge.md` - Technical architecture details
- `.serena/prompts.md` - Development guidelines
- `.claude.md` - Claude-specific context
- `README.md` - Project documentation
- `DEVELOPMENT.md` - Development workflows

## Troubleshooting

### Common Issues

#### 1. "uvx command not found"
```bash
# Reinstall uv
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc  # or restart terminal
```

#### 2. "Serena MCP server not accessible"
```bash
# Test Serena installation
uvx --from "git+https://github.com/oraios/serena" serena-mcp-server --help

# If it fails, try clearing uv cache
uv cache clean
```

#### 3. "Claude Desktop doesn't show Serena"
- Check that Claude Desktop is fully closed and reopened
- Verify the JSON configuration is valid
- Check Claude Desktop logs for errors
- Ensure the project path in the configuration is correct

#### 4. "Serena responses seem generic"
- Verify the project path in the MCP configuration
- Check that all context files exist in `.serena/`
- Run `npm run serena:validate` to check configuration
- Restart Claude Desktop after making changes

### Debug Mode
Enable debug logging by setting the environment variable:
```json
{
  "env": {
    "SERENA_LOG_LEVEL": "debug"
  }
}
```

### Getting Help
If you encounter issues:
1. Run `npm run serena:test` for diagnostic information
2. Check the [Serena GitHub repository](https://github.com/oraios/serena) for updates
3. Create an issue in the Ankiniki repository with the `serena` label

## Best Practices

### Effective Prompting
- **Be specific**: Mention the exact component or file you're working with
- **Provide context**: Include relevant code snippets or error messages
- **Ask for patterns**: Request examples that follow Ankiniki conventions
- **Iterate**: Build on previous responses for complex tasks

### Development Workflow
1. **Planning**: Ask Serena about architecture decisions before coding
2. **Implementation**: Get help with specific patterns and code structure
3. **Review**: Have Serena review your code for consistency
4. **Documentation**: Get assistance writing clear documentation

### Example Workflow
```
# Planning phase
"I need to add a feature for exporting cards to JSON. How should I structure this in the Ankiniki architecture?"

# Implementation phase  
"Here's my CLI command for export. Does this follow our Commander.js patterns?"
[paste code]

# Review phase
"Can you review this export functionality for error handling and TypeScript compliance?"
[paste implementation]

# Documentation phase
"Help me write user documentation for the new export feature"
```

This setup gives you a powerful AI development assistant that understands Ankiniki intimately and can significantly accelerate your development workflow.