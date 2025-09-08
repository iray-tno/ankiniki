#!/usr/bin/env node

/**
 * Serena MCP Connection Test
 * Tests the MCP server configuration and connection
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const MCP_CONFIG_PATH = path.join(__dirname, '..', '.mcp.json');

function testSerenaConnection() {
  console.log('🧪 Testing Serena MCP connection...\n');
  
  let hasErrors = false;

  // Check if .mcp.json exists
  if (!fs.existsSync(MCP_CONFIG_PATH)) {
    console.error('❌ .mcp.json configuration file not found');
    return false;
  }

  console.log('✅ Found .mcp.json configuration');

  // Validate MCP configuration
  try {
    const mcpConfig = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf8'));
    
    if (!mcpConfig.mcpServers || !mcpConfig.mcpServers.serena) {
      console.error('❌ Invalid MCP configuration: missing serena server');
      return false;
    }
    
    console.log('✅ Valid MCP configuration structure');
    
    const serenaConfig = mcpConfig.mcpServers.serena;
    console.log(`   Command: ${serenaConfig.command}`);
    console.log(`   Args: ${serenaConfig.args.join(' ')}`);
    
    if (serenaConfig.env) {
      console.log('   Environment variables:');
      Object.entries(serenaConfig.env).forEach(([key, value]) => {
        console.log(`     ${key}=${value}`);
      });
    }
    
  } catch (error) {
    console.error(`❌ Invalid JSON in .mcp.json: ${error.message}`);
    return false;
  }

  // Check if uvx is available
  console.log('\n🔍 Checking uvx availability...');
  
  return new Promise((resolve) => {
    const uvxCheck = spawn('uvx', ['--version'], { stdio: 'pipe' });
    
    uvxCheck.on('close', (code) => {
      if (code === 0) {
        console.log('✅ uvx is available');
        
        // Test Serena installation
        console.log('\n🤖 Testing Serena MCP server...');
        
        const serenaTest = spawn('uvx', [
          '--from',
          'git+https://github.com/oraios/serena',
          'serena-mcp-server',
          '--help'
        ], { stdio: 'pipe' });
        
        serenaTest.on('close', (serenaCode) => {
          if (serenaCode === 0) {
            console.log('✅ Serena MCP server is accessible');
            console.log('\n🎉 All tests passed!');
            console.log('\n📋 Next steps:');
            console.log('1. Run: npm run serena:setup');
            console.log('2. Restart Claude Desktop');
            console.log('3. Start using Serena in Claude Desktop');
            resolve(true);
          } else {
            console.error('❌ Serena MCP server not accessible');
            console.error('   Run: npm run serena:setup');
            resolve(false);
          }
        });
        
        serenaTest.on('error', (error) => {
          console.error(`❌ Error testing Serena: ${error.message}`);
          resolve(false);
        });
        
      } else {
        console.error('❌ uvx not found');
        console.error('   Please install uv: curl -LsSf https://astral.sh/uv/install.sh | sh');
        resolve(false);
      }
    });
    
    uvxCheck.on('error', (error) => {
      console.error(`❌ Error checking uvx: ${error.message}`);
      console.error('   Please install uv: curl -LsSf https://astral.sh/uv/install.sh | sh');
      resolve(false);
    });
  });
}

// Check Claude Desktop config paths
function checkClaudeConfig() {
  console.log('\n🔍 Checking Claude Desktop configuration...');
  
  let claudeConfigDir;
  const platform = process.platform;
  
  if (platform === 'darwin') {
    claudeConfigDir = path.join(process.env.HOME, 'Library', 'Application Support', 'Claude');
  } else if (platform === 'win32') {
    claudeConfigDir = path.join(process.env.APPDATA, 'Claude');
  } else {
    claudeConfigDir = path.join(process.env.HOME, '.config', 'Claude');
  }
  
  const claudeConfigFile = path.join(claudeConfigDir, 'claude_desktop_config.json');
  
  console.log(`   Config directory: ${claudeConfigDir}`);
  console.log(`   Config file: ${claudeConfigFile}`);
  
  if (fs.existsSync(claudeConfigFile)) {
    console.log('✅ Claude Desktop config file exists');
    
    try {
      const config = JSON.parse(fs.readFileSync(claudeConfigFile, 'utf8'));
      
      if (config.mcpServers && Object.keys(config.mcpServers).length > 0) {
        console.log('✅ MCP servers configured:');
        Object.keys(config.mcpServers).forEach(serverName => {
          console.log(`     - ${serverName}`);
        });
        
        if (config.mcpServers['ankiniki-serena'] || config.mcpServers['serena']) {
          console.log('✅ Ankiniki Serena server configured');
        } else {
          console.log('⚠️  Ankiniki Serena server not found in config');
          console.log('   Run: npm run serena:setup');
        }
      } else {
        console.log('⚠️  No MCP servers configured');
        console.log('   Run: npm run serena:setup');
      }
      
    } catch (error) {
      console.error(`❌ Invalid Claude Desktop config: ${error.message}`);
    }
    
  } else {
    console.log('⚠️  Claude Desktop config file not found');
    console.log('   Run: npm run serena:setup to create it');
  }
}

// Run tests
async function runTests() {
  const connectionTest = await testSerenaConnection();
  checkClaudeConfig();
  
  console.log('\n' + '='.repeat(50));
  
  if (connectionTest) {
    console.log('🎉 Serena is ready for use!');
    process.exit(0);
  } else {
    console.log('💥 Serena setup needs attention');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});