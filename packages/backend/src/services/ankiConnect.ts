import axios, { AxiosResponse } from 'axios';
import http from 'http';
import {
  AnkiConnectRequest,
  AnkiConnectResponse,
  AnkiConnectError,
  ANKI_CONNECT,
} from '@ankiniki/shared';
import { config } from '../config';
import { logger } from '../utils/logger';

export class AnkiConnectService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = config.ankiConnect.url;
    this.timeout = config.ankiConnect.timeout;
  }

  async request<T = any>(
    action: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    const requestData: AnkiConnectRequest = {
      action,
      version: ANKI_CONNECT.API_VERSION,
      params,
    };

    try {
      logger.debug('AnkiConnect request', { action, params });

      const response: AxiosResponse<AnkiConnectResponse> = await axios.post(
        this.baseURL,
        requestData,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
          // Disable keep-alive by using a new agent or explicitly setting headers
          httpAgent: new http.Agent({ keepAlive: false }),
        }
      );

      const { result, error } = response.data;

      if (error) {
        throw new AnkiConnectError(`AnkiConnect error: ${error}`);
      }

      logger.debug('AnkiConnect response', { action, result });
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
          throw new AnkiConnectError('AnkiConnect request timed out');
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error('AnkiConnect request failed', {
        action,
        error: errorMessage,
      });
      throw new AnkiConnectError(
        `Failed to communicate with Anki: ${errorMessage}`
      );
    }
  }

  // Deck operations
  async getDeckNames(): Promise<string[]> {
    return this.request<string[]>('deckNames');
  }

  async createDeck(name: string): Promise<number> {
    return this.request<number>('createDeck', { deck: name });
  }

  async deleteDeck(name: string, cardsToo: boolean = false): Promise<void> {
    return this.request<void>('deleteDecks', { decks: [name], cardsToo });
  }

  // Card operations
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

  async updateNoteFields(
    noteId: number,
    fields: Record<string, string>
  ): Promise<void> {
    const note = {
      id: noteId,
      fields,
    };

    return this.request<void>('updateNoteFields', { note });
  }

  async deleteNotes(noteIds: number[]): Promise<void> {
    return this.request<void>('deleteNotes', { notes: noteIds });
  }

  // Query operations
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

  // Health check
  async ping(): Promise<boolean> {
    try {
      await this.request('version');
      return true;
    } catch {
      return false;
    }
  }

  // Export
  async exportPackage(
    deck: string,
    path: string,
    includeSched: boolean = false
  ): Promise<boolean> {
    return this.request<boolean>('exportPackage', { deck, path, includeSched });
  }

  // Sync
  async sync(): Promise<void> {
    return this.request<void>('sync');
  }
}

export const ankiConnect = new AnkiConnectService();
