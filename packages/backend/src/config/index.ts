import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const ConfigSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ANKI_CONNECT_URL: z.string().default('http://localhost:8765'),
  ANKI_CONNECT_TIMEOUT: z.string().default('5000'),
  LOG_LEVEL: z.string().default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const env = ConfigSchema.parse(process.env);

export const config = {
  port: parseInt(env.PORT),
  nodeEnv: env.NODE_ENV,
  ankiConnect: {
    url: env.ANKI_CONNECT_URL,
    timeout: parseInt(env.ANKI_CONNECT_TIMEOUT),
  },
  logging: {
    level: env.LOG_LEVEL,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
} as const;