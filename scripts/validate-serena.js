#!/usr/bin/env node

/**
 * Serena Configuration Validator
 * Validates the AI assistant configuration for completeness and accuracy
 */

const fs = require('fs');
const path = require('path');

const SERENA_DIR = path.join(__dirname, '..', '.serena');
const REQUIRED_FILES = [
  'config.json',
  'context.md', 
  'prompts.md',
  'knowledge.md',
  'README.md'
];

function validateSerenaConfig() {
  console.log('🔍 Validating Serena configuration...\n');
  
  let hasErrors = false;

  // Check if .serena directory exists
  if (!fs.existsSync(SERENA_DIR)) {
    console.error('❌ .serena directory not found');
    return false;
  }

  // Check required files
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(SERENA_DIR, file);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing required file: ${file}`);
      hasErrors = true;
    } else {
      console.log(`✅ Found: ${file}`);
    }
  }

  // Validate config.json structure
  try {
    const configPath = path.join(SERENA_DIR, 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      const requiredKeys = ['project', 'architecture', 'tech_stack', 'development'];
      for (const key of requiredKeys) {
        if (!config[key]) {
          console.error(`❌ Missing required config key: ${key}`);
          hasErrors = true;
        } else {
          console.log(`✅ Config key found: ${key}`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Invalid JSON in config.json: ${error.message}`);
    hasErrors = true;
  }

  // Check file sizes (should not be empty)
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(SERENA_DIR, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size < 100) { // Minimum reasonable size
        console.warn(`⚠️  File seems too small: ${file} (${stats.size} bytes)`);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  
  if (hasErrors) {
    console.error('❌ Serena configuration has errors');
    return false;
  } else {
    console.log('✅ Serena configuration is valid');
    
    // Show summary
    console.log('\n📊 Configuration Summary:');
    const configPath = path.join(SERENA_DIR, 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    console.log(`   Project: ${config.project?.name || 'Unknown'}`);
    console.log(`   Version: ${config.project?.version || 'Unknown'}`);
    console.log(`   Type: ${config.project?.type || 'Unknown'}`);
    console.log(`   Packages: ${config.architecture?.packages?.length || 0}`);
    console.log(`   Languages: ${config.tech_stack?.languages?.join(', ') || 'Unknown'}`);
    
    return true;
  }
}

// Run validation
const isValid = validateSerenaConfig();
process.exit(isValid ? 0 : 1);