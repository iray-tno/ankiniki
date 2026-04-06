import axios, { AxiosResponse } from 'axios';
import {
  AnkiConnectRequest,
  AnkiConnectResponse,
  AnkiConnectError,
  ANKI_CONNECT,
} from './index';

export interface AnkiConnectClientOptions {
  baseURL?: string;
  timeout?: number;
  logger?: {
    debug: (message: string, meta?: any) => void;
    info: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    error: (message: string, meta?: any) => void;
  };
}

export class AnkiConnectClient {
  private baseURL: string;
  private timeout: number;
  private logger?: AnkiConnectClientOptions['logger'];

  constructor(options: AnkiConnectClientOptions = {}) {
    this.baseURL = options.baseURL || ANKI_CONNECT.DEFAULT_URL;
    this.timeout = options.timeout || ANKI_CONNECT.DEFAULT_TIMEOUT;
    this.logger = options.logger;
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
      this.logger?.debug('AnkiConnect request', { action, params });

      const response: AxiosResponse<AnkiConnectResponse> = await axios.post(
        this.baseURL,
        requestData,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { result, error } = response.data;

      if (error) {
        throw new AnkiConnectError(`AnkiConnect error: ${error}`);
      }

      this.logger?.debug('AnkiConnect response', { action, result });
      return result as T;
    } catch (error) {
      if (error instanceof AnkiConnectError) {
        throw error;
      }

      let errorMessage = error instanceof Error ? error.message : String(error);

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          errorMessage = 'Cannot connect to Anki. Make sure Anki is running and AnkiConnect addon is installed.';
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'AnkiConnect request timed out';
        }
      }

      this.logger?.error('AnkiConnect request failed', {
        action,
        error: errorMessage,
      });
      
      throw new AnkiConnectError(errorMessage);
    }
  }

  // Deck operations
  async getDeckNames(): Promise<string[]> {
    return this.request<string[]>('deckNames');
  }

  async createDeck(name: string): Promise<number> {
    return this.request<number>('createDeck', { deck: name });
  }

  async deleteDeck(name: string, cardsToo: boolean = true): Promise<void> {
    return this.request<void>('deleteDecks', { decks: [name], cardsToo });
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

  async exportPackage(
    deck: string,
    path: string,
    includeSched: boolean = false
  ): Promise<boolean> {
    return this.request<boolean>('exportPackage', { deck, path, includeSched });
  }
}
