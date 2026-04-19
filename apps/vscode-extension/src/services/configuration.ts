import * as vscode from 'vscode';
import { ANKI_CONNECT, ANKI_MODELS } from '@ankiniki/shared';

export interface AnkinikiConfig {
  ankiConnectUrl: string;
  defaultDeck: string;
  defaultModel: string;
  autoDetectLanguage: boolean;
  includeFilePath: boolean;
  showNotifications: boolean;
}

export class ConfigurationManager {
  private static readonly CONFIG_SECTION = 'ankiniki';

  getConfiguration(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(
      ConfigurationManager.CONFIG_SECTION
    );
  }

  getAnkiConnectUrl(): string {
    return this.getConfiguration().get(
      'ankiConnectUrl',
      ANKI_CONNECT.DEFAULT_URL
    );
  }

  getDefaultDeck(): string {
    return this.getConfiguration().get('defaultDeck', 'Default');
  }

  getDefaultModel(): string {
    return this.getConfiguration().get('defaultModel', ANKI_MODELS.BASIC);
  }

  getAutoDetectLanguage(): boolean {
    return this.getConfiguration().get('autoDetectLanguage', true);
  }

  getIncludeFilePath(): boolean {
    return this.getConfiguration().get('includeFilePath', true);
  }

  getShowNotifications(): boolean {
    return this.getConfiguration().get('showNotifications', true);
  }

  getAllConfig(): AnkinikiConfig {
    return {
      ankiConnectUrl: this.getAnkiConnectUrl(),
      defaultDeck: this.getDefaultDeck(),
      defaultModel: this.getDefaultModel(),
      autoDetectLanguage: this.getAutoDetectLanguage(),
      includeFilePath: this.getIncludeFilePath(),
      showNotifications: this.getShowNotifications(),
    };
  }

  async updateConfig(key: keyof AnkinikiConfig, value: any): Promise<void> {
    await this.getConfiguration().update(
      key,
      value,
      vscode.ConfigurationTarget.Global
    );
  }

  onConfigurationChanged(
    callback: (e: vscode.ConfigurationChangeEvent) => void
  ): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration(ConfigurationManager.CONFIG_SECTION)) {
        callback(e);
      }
    });
  }
}
