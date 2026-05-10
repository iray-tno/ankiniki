import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { loadConfig, saveConfig, getConfigPath } from '../config';
import { AnkiClient } from '../anki-client';
import {
  ANKI_CONNECT,
  ANKI_MODELS,
  ANKI_MESSAGES,
  SERVER,
} from '@ankiniki/shared';

export function createConfigCommand(): Command {
  const command = new Command('config');

  command
    .description('Manage CLI configuration')
    .option('-s, --show', 'Show current configuration')
    .option('-e, --edit', 'Edit configuration interactively')
    .option('--set <key=value>', 'Set a configuration value')
    .option('--reset', 'Reset to default configuration')
    .action(async options => {
      try {
        if (options.show) {
          await showConfig();
        } else if (options.edit) {
          await editConfig();
        } else if (options.set) {
          await setConfig(options.set);
        } else if (options.reset) {
          await resetConfig();
        } else {
          // Default: show config
          await showConfig();
        }
      } catch (error) {
        console.error(
          chalk.red(
            `Error: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    });

  return command;
}

async function showConfig(): Promise<void> {
  const config = loadConfig();

  console.log(chalk.bold('⚙️  Current Configuration:'));
  console.log(`   Config file: ${chalk.gray(getConfigPath())}`);
  console.log(`   AnkiConnect URL: ${chalk.cyan(config.ankiConnectUrl)}`);
  console.log(`   Server URL:      ${chalk.cyan(config.serverUrl)}`);
  console.log(`   Default Deck: ${chalk.cyan(config.defaultDeck)}`);
  console.log(`   Default Model: ${chalk.cyan(config.defaultModel)}`);
  console.log(
    `   Debug Mode: ${config.debugMode ? chalk.green('enabled') : chalk.gray('disabled')}`
  );

  // Test connection
  const client = new AnkiClient();
  const isConnected = await client.ping();
  console.log(
    `   Connection: ${isConnected ? chalk.green('✓ Connected') : chalk.red('✗ Not connected')}`
  );
}

async function editConfig(): Promise<void> {
  const config = loadConfig();
  const client = new AnkiClient();

  try {
    // Get available decks and models
    const decks = await client.getDeckNames();
    const models = await client.modelNames();

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'ankiConnectUrl',
        message: 'AnkiConnect URL:',
        default: config.ankiConnectUrl,
        validate: (input: string) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        },
      },
      {
        type: 'input',
        name: 'serverUrl',
        message: 'Ankiniki server URL (for import commands):',
        default: config.serverUrl,
        validate: (input: string) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        },
      },
      {
        type: 'list',
        name: 'defaultDeck',
        message: 'Default deck:',
        choices: decks,
        default: config.defaultDeck,
      },
      {
        type: 'list',
        name: 'defaultModel',
        message: 'Default model:',
        choices: models,
        default: config.defaultModel,
      },
      {
        type: 'confirm',
        name: 'debugMode',
        message: 'Enable debug mode:',
        default: config.debugMode,
      },
    ]);

    saveConfig(answers);
    console.log(chalk.green('✓ Configuration saved successfully'));
  } catch (error) {
    // If we can't connect to Anki, allow basic config editing
    console.log(
      chalk.yellow(
        `⚠ ${ANKI_MESSAGES.CANNOT_CONNECT}. Editing basic configuration only.`
      )
    );

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'ankiConnectUrl',
        message: 'AnkiConnect URL:',
        default: config.ankiConnectUrl,
      },
      {
        type: 'input',
        name: 'serverUrl',
        message: 'Ankiniki server URL (for import commands):',
        default: config.serverUrl,
      },
      {
        type: 'input',
        name: 'defaultDeck',
        message: 'Default deck:',
        default: config.defaultDeck,
      },
      {
        type: 'input',
        name: 'defaultModel',
        message: 'Default model:',
        default: config.defaultModel,
      },
      {
        type: 'confirm',
        name: 'debugMode',
        message: 'Enable debug mode:',
        default: config.debugMode,
      },
    ]);

    saveConfig(answers);
    console.log(chalk.green('✓ Configuration saved successfully'));
  }
}

async function setConfig(keyValue: string): Promise<void> {
  const [key, ...valueParts] = keyValue.split('=');
  const value = valueParts.join('=');

  if (!key || !value) {
    throw new Error('Invalid format. Use: --set key=value');
  }

  const _config = loadConfig();
  const validKeys = [
    'ankiConnectUrl',
    'serverUrl',
    'defaultDeck',
    'defaultModel',
    'debugMode',
  ];

  if (!validKeys.includes(key)) {
    throw new Error(
      `Invalid key "${key}". Valid keys: ${validKeys.join(', ')}`
    );
  }

  // Type conversion for boolean
  const parsedValue =
    key === 'debugMode' ? value.toLowerCase() === 'true' : value;

  saveConfig({ [key]: parsedValue });
  console.log(chalk.green(`✓ Set ${key} = ${parsedValue}`));
}

async function resetConfig(): Promise<void> {
  const confirm = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'reset',
      message: 'Are you sure you want to reset configuration to defaults?',
      default: false,
    },
  ]);

  if (confirm.reset) {
    saveConfig({
      ankiConnectUrl: ANKI_CONNECT.DEFAULT_URL,
      serverUrl: SERVER.DEFAULT_URL,
      defaultDeck: 'Default',
      defaultModel: ANKI_MODELS.BASIC,
      debugMode: false,
    });
    console.log(chalk.green('✓ Configuration reset to defaults'));
  } else {
    console.log(chalk.gray('Configuration reset cancelled'));
  }
}
