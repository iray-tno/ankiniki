import {
  AnkiConnectRequest,
  AnkiConnectResponse,
  ANKI_CONNECT,
} from '@ankiniki/shared';
import { ConfigurationManager } from './configuration';
import * as https from 'https';
import * as http from 'http';

export class AnkiConnectClient {
  constructor(private config: ConfigurationManager) {}

  async request<T = any>(
    action: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    const requestData: AnkiConnectRequest = {
      action,
      version: ANKI_CONNECT.API_VERSION,
      params,
    };

    const url = this.config.getAnkiConnectUrl();

    try {
      const data = await this.httpRequest(url, requestData);

      if (data.error) {
        throw new Error(`AnkiConnect Error: ${data.error}`);
      }

      return data.result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        throw new Error(
          'Cannot connect to AnkiConnect. Make sure Anki is running.'
        );
      }
      throw error;
    }
  }

  private httpRequest(url: string, data: any): Promise<AnkiConnectResponse> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const postData = JSON.stringify(data);

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = client.request(options, res => {
        let body = '';

        res.on('data', chunk => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            resolve(result);
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${body}`));
          }
        });
      });

      req.on('error', error => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  async ping(): Promise<boolean> {
    try {
      await this.request('version');
      return true;
    } catch {
      return false;
    }
  }

  async getDeckNames(): Promise<string[]> {
    return this.request<string[]>('deckNames');
  }

  async getModelNames(): Promise<string[]> {
    return this.request<string[]>('modelNames');
  }

  async getModelFieldNames(modelName: string): Promise<string[]> {
    return this.request<string[]>('modelFieldNames', { modelName });
  }

  async addNote(
    deckName: string,
    modelName: string,
    fields: Record<string, string>,
    tags: string[] = []
  ): Promise<number> {
    const note = {
      deckName,
      modelName,
      fields,
      tags,
      options: {
        allowDuplicate: false,
        duplicateScope: 'deck',
      },
    };

    return this.request<number>('addNote', { note });
  }

  async canAddNotes(notes: any[]): Promise<boolean[]> {
    return this.request<boolean[]>('canAddNotes', { notes });
  }

  async findNotes(query: string): Promise<number[]> {
    return this.request<number[]>('findNotes', { query });
  }

  async notesInfo(noteIds: number[]): Promise<any[]> {
    return this.request<any[]>('notesInfo', { notes: noteIds });
  }
}
