#!/bin/bash

# Ankiniki Serena MCP Setup Script
set -e

echo "🤖 Setting up Serena AI assistant for Ankiniki development..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo -e "${RED}❌ uv is not installed. Please install uv first:${NC}"
    echo "curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

echo -e "${GREEN}✅ uv is installed${NC}"

# Check if uvx is available
if ! command -v uvx &> /dev/null; then
    echo -e "${RED}❌ uvx is not available. Please update uv to the latest version${NC}"
    exit 1
fi

echo -e "${GREEN}✅ uvx is available${NC}"

# Test Serena installation
echo -e "${BLUE}ℹ️  Testing Serena installation...${NC}"
if uvx --from "git+https://github.com/oraios/serena" serena-mcp-server --help &> /dev/null; then
    echo -e "${GREEN}✅ Serena MCP server is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Installing Serena MCP server...${NC}"
    uvx --from "git+https://github.com/oraios/serena" serena-mcp-server --help > /dev/null
    echo -e "${GREEN}✅ Serena MCP server installed${NC}"
fi

# Get Claude Desktop config path
CLAUDE_CONFIG_DIR=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    CLAUDE_CONFIG_DIR="$APPDATA/Claude"
else
    # Linux
    CLAUDE_CONFIG_DIR="$HOME/.config/Claude"
fi

CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

echo -e "${BLUE}ℹ️  Claude Desktop config path: $CLAUDE_CONFIG_FILE${NC}"

# Create Claude config directory if it doesn't exist
mkdir -p "$CLAUDE_CONFIG_DIR"

# Check if Claude config exists
if [[ -f "$CLAUDE_CONFIG_FILE" ]]; then
    echo -e "${YELLOW}⚠️  Existing Claude Desktop configuration found${NC}"
    echo -e "${BLUE}ℹ️  Backing up existing configuration...${NC}"
    cp "$CLAUDE_CONFIG_FILE" "${CLAUDE_CONFIG_FILE}.backup.$(date +%s)"
    echo -e "${GREEN}✅ Backup created${NC}"
else
    echo -e "${BLUE}ℹ️  Creating new Claude Desktop configuration...${NC}"
fi

# Get the absolute path of the project directory
PROJECT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

# Read current .mcp.json
MCP_CONFIG_FILE="$PROJECT_DIR/.mcp.json"

if [[ ! -f "$MCP_CONFIG_FILE" ]]; then
    echo -e "${RED}❌ .mcp.json not found in project directory${NC}"
    exit 1
fi

echo -e "${BLUE}ℹ️  Reading MCP configuration...${NC}"

# Create or update Claude Desktop config
cat > "$CLAUDE_CONFIG_FILE" << EOF
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
        "$PROJECT_DIR"
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
EOF

echo -e "${GREEN}✅ Claude Desktop configuration updated${NC}"

# Validate the configuration
echo -e "${BLUE}ℹ️  Validating configuration...${NC}"

if command -v jq &> /dev/null; then
    if jq empty "$CLAUDE_CONFIG_FILE" 2>/dev/null; then
        echo -e "${GREEN}✅ Configuration is valid JSON${NC}"
    else
        echo -e "${RED}❌ Configuration contains invalid JSON${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  jq not found, skipping JSON validation${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Serena setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Restart Claude Desktop application"
echo "2. Open a new conversation in Claude Desktop"
echo "3. Serena should now be available with full Ankiniki project context"
echo ""
echo -e "${BLUE}🧪 Test commands:${NC}"
echo "- Ask: 'Can you help me understand the Ankiniki architecture?'"
echo "- Ask: 'How do I add a new CLI command to Ankiniki?'"
echo "- Ask: 'Show me the AnkiConnect integration patterns'"
echo ""
echo -e "${BLUE}📁 Configuration files:${NC}"
echo "- MCP Config: $MCP_CONFIG_FILE"
echo "- Claude Config: $CLAUDE_CONFIG_FILE"
echo "- Project Context: $PROJECT_DIR/.serena/"
echo ""
echo -e "${YELLOW}💡 Tip: Use 'npm run serena:validate' to check Serena configuration${NC}"