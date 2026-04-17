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
    debug: (message: string, meta?: unknown) => void;
    info: (message: string, meta?: unknown) => void;
    warn: (message: string, meta?: unknown) => void;
    error: (message: string, meta?: unknown) => void;
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

  async request<T = unknown>(
    action: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    const requestData: AnkiConnectRequest = {
      action,
      version: ANKI_CONNECT.API_VERSION,
      params,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      this.logger?.debug('AnkiConnect request', { action, params });

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        signal: controller.signal,
      });

      const data = (await response.json()) as AnkiConnectResponse;

      if (data.error) {
        throw new AnkiConnectError(`AnkiConnect error: ${data.error}`);
      }

      this.logger?.debug('AnkiConnect response', {
        action,
        result: data.result,
      });
      return data.result as T;
    } catch (error) {
      if (error instanceof AnkiConnectError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        const msg = 'AnkiConnect request timed out';
        this.logger?.error(msg, { action });
        throw new AnkiConnectError(msg);
      }

      if (error instanceof TypeError) {
        const cause = (
          error as NodeJS.ErrnoException & { cause?: NodeJS.ErrnoException }
        ).cause;
        if (
          cause?.code === 'ECONNREFUSED' ||
          error.message.includes('ECONNREFUSED')
        ) {
          const msg =
            'Cannot connect to Anki. Make sure Anki is running and AnkiConnect addon is installed.';
          this.logger?.error(msg, { action });
          throw new AnkiConnectError(msg);
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger?.error('AnkiConnect request failed', {
        action,
        error: errorMessage,
      });
      throw new AnkiConnectError(
        `Failed to communicate with Anki: ${errorMessage}`
      );
    } finally {
      clearTimeout(timeoutId);
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
    return this.request<number>('addNote', {
      note: { deckName, modelName, fields, tags },
    });
  }

  async updateNoteFields(
    noteId: number,
    fields: Record<string, string>
  ): Promise<void> {
    return this.request<void>('updateNoteFields', {
      note: { id: noteId, fields },
    });
  }

  async deleteNotes(noteIds: number[]): Promise<void> {
    return this.request<void>('deleteNotes', { notes: noteIds });
  }

  async canAddNotes(notes: Record<string, unknown>[]): Promise<boolean[]> {
    return this.request<boolean[]>('canAddNotes', { notes });
  }

  // Query operations
  async findNotes(query: string): Promise<number[]> {
    return this.request<number[]>('findNotes', { query });
  }

  async notesInfo(noteIds: number[]): Promise<unknown[]> {
    return this.request<unknown[]>('notesInfo', { notes: noteIds });
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
