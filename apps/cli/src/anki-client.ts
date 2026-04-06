import { AnkiConnectClient } from '@ankiniki/shared';
import { loadConfig } from './config';

export class AnkiClient extends AnkiConnectClient {
  constructor() {
    const config = loadConfig();
    super({
      baseURL: config.ankiConnectUrl,
    });
  }
}
