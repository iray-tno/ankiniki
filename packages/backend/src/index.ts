import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { ankiConnect } from './services/ankiConnect';
import { ANKI_MESSAGES } from '@ankiniki/shared';

async function startServer() {
  try {
    const app = createApp();

    // Check AnkiConnect connection
    const isAnkiConnected = await ankiConnect.ping();
    if (!isAnkiConnected) {
      logger.warn(ANKI_MESSAGES.NOT_AVAILABLE_HINT);
    } else {
      logger.info('Successfully connected to AnkiConnect');
    }

    const server = app.listen(config.port, () => {
      logger.info(`🚀 Ankiniki backend server started`);
      logger.info(`📡 Server running on port ${config.port}`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 AnkiConnect URL: ${config.ankiConnect.url}`);
      logger.info(`✅ Health check: http://localhost:${config.port}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
