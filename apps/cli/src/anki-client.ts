import axios from 'axios';
import {
  AnkiConnectRequest,
  AnkiConnectResponse,
  AnkiConnectError,
  ANKI_CONNECT,
} from '@ankiniki/shared';
import { loadConfig } from './config';

export class AnkiClient {
  private config = loadConfig();

  async request<T = any>(action: string, params: Record<string, any> = {}): Promise<T> {
    const requestData: AnkiConnectRequest = {
      action,
      version: ANKI_CONNECT.API_VERSION,
      params,
    };

    try {
      const response = await axios.post<AnkiConnectResponse>(
        this.config.ankiConnectUrl,
        requestData,
        {
          timeout: ANKI_CONNECT.DEFAULT_TIMEOUT,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const { result, error } = response.data;

      if (error) {
        throw new AnkiConnectError(`AnkiConnect error: ${error}`);
      }

      return result as T;
    } catch (error) {
      if (error instanceof AnkiConnectError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new AnkiConnectError(
            'Cannot connect to Anki. Make sure Anki is running and AnkiConnect addon is installed.'
          );
        }
        if (error.code === 'ECONNABORTED') {
          throw new AnkiConnectError('Request timed out');
        }
      }

      throw new AnkiConnectError('Failed to communicate with Anki');
    }
  }

  // Deck operations
  async getDeckNames(): Promise<string[]> {
    return this.request<string[]>('deckNames');
  }

  async createDeck(name: string): Promise<number> {
    return this.request<number>('createDeck', { deck: name });
  }

  // Note operations
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
    };

    return this.request<number>('addNote', { note });
  }

  async findNotes(query: string): Promise<number[]> {
    return this.request<number[]>('findNotes', { query });
  }

  async notesInfo(noteIds: number[]): Promise<any[]> {
    return this.request<any[]>('notesInfo', { notes: noteIds });
  }

  // Model operations
  async modelNames(): Promise<string[]> {
    return this.request<string[]>('modelNames');
  }

  async modelFieldNames(modelName: string): Promise<string[]> {
    return this.request<string[]>('modelFieldNames', { modelName });
  }

  // Utilities
  async ping(): Promise<boolean> {
    try {
      await this.request('version');
      return true;
    } catch {
      return false;
    }
  }

  async sync(): Promise<void> {
    return this.request<void>('sync');
  }
}