import winston from 'winston';
import util from 'util';
import { config } from '../config';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.simple(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    const metaEntries = Object.keys(meta);
    if (metaEntries.length > 0) {
      // Use util.inspect to handle circular structures safely
      log += `\n${util.inspect(meta, { depth: 5, colors: true, compact: false })}`;
    }
    return log;
  })
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: config.nodeEnv === 'production' ? logFormat : consoleFormat,
    }),
  ],
});

if (config.nodeEnv === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  );
}
