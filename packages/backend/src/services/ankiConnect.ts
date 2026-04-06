import { AnkiConnectClient } from '@ankiniki/shared';
import { config } from '../config';
import { logger } from '../utils/logger';

export class AnkiConnectService extends AnkiConnectClient {
  constructor() {
    super({
      baseURL: config.ankiConnect.url,
      timeout: config.ankiConnect.timeout,
      logger: {
        debug: (msg, meta) => logger.debug(msg, meta),
        info: (msg, meta) => logger.info(msg, meta),
        warn: (msg, meta) => logger.warn(msg, meta),
        error: (msg, meta) => logger.error(msg, meta),
      },
    });
  }

  /**
   * Ensure a deck exists, creating it if necessary
   * @returns true if deck exists or was created, false otherwise
   */
  async ensureDeckExists(
    deckName: string,
    existingDecks: Set<string>
  ): Promise<boolean> {
    if (existingDecks.has(deckName)) {
      return true;
    }

    try {
      logger.info(`Creating missing deck: ${deckName}`);
      await this.createDeck(deckName);
      existingDecks.add(deckName);
      return true;
    } catch (error) {
      logger.error(`Failed to create deck: ${deckName}`, error);
      return false;
    }
  }
}

export const ankiConnect = new AnkiConnectService();
