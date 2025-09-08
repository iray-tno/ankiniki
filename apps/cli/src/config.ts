import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs-extra';
import { CLI, ANKI_CONNECT } from '@ankiniki/shared';

export interface CliConfig {
  ankiConnectUrl: string;
  defaultDeck: string;
  defaultModel: string;
  debugMode: boolean;
}

const CONFIG_FILE = join(homedir(), CLI.CONFIG_FILE);

const DEFAULT_CONFIG: CliConfig = {
  ankiConnectUrl: ANKI_CONNECT.DEFAULT_URL,
  defaultDeck: 'Default',
  defaultModel: 'Basic',
  debugMode: false,
};

export function loadConfig(): CliConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      const data = readFileSync(CONFIG_FILE, 'utf8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (error) {
    // Fall back to default config
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config: Partial<CliConfig>): void {
  const currentConfig = loadConfig();
  const newConfig = { ...currentConfig, ...config };

  try {
    writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
  } catch (error) {
    throw new Error(`Failed to save config: ${error}`);
  }
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
