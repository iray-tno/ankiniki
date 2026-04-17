import { AnkiConnectClient as BaseAnkiConnectClient } from '@ankiniki/shared';
import { ConfigurationManager } from './configuration';

export class AnkiConnectClient extends BaseAnkiConnectClient {
  constructor(config: ConfigurationManager) {
    super({ baseURL: config.getAnkiConnectUrl() });
  }

  // Override addNote to include duplicate-prevention options used by the extension
  async addNote(
    deckName: string,
    modelName: string,
    fields: Record<string, string>,
    tags: string[] = []
  ): Promise<number> {
    return this.request<number>('addNote', {
      note: {
        deckName,
        modelName,
        fields,
        tags,
        options: {
          allowDuplicate: false,
          duplicateScope: 'deck',
        },
      },
    });
  }

  // Alias kept for callers that use the get-prefixed name
  async getModelFieldNames(modelName: string): Promise<string[]> {
    return this.modelFieldNames(modelName);
  }
}
