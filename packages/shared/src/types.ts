import { z } from 'zod';

// Card types
export const CardSchema = z.object({
  id: z.string(),
  deckId: z.string(),
  front: z.string(),
  back: z.string(),
  tags: z.array(z.string()).default([]),
  created: z.date(),
  modified: z.date(),
  due: z.date().optional(),
  interval: z.number().optional(),
  ease: z.number().optional(),
  reps: z.number().default(0),
});

export type Card = z.infer<typeof CardSchema>;

// Deck types
export const DeckSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  created: z.date(),
  modified: z.date(),
  cardCount: z.number().default(0),
  config: z
    .object({
      newCardsPerDay: z.number().default(20),
      reviewCardsPerDay: z.number().default(200),
    })
    .optional(),
});

export type Deck = z.infer<typeof DeckSchema>;

// AnkiConnect types
export const AnkiConnectRequestSchema = z.object({
  action: z.string(),
  version: z.number(),
  params: z.record(z.any()).optional(),
});

export type AnkiConnectRequest = z.infer<typeof AnkiConnectRequestSchema>;

export const AnkiConnectResponseSchema = z.object({
  result: z.any(),
  error: z.string().nullable(),
});

export type AnkiConnectResponse = z.infer<typeof AnkiConnectResponseSchema>;

// API Response types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & {
  data?: T;
};

// Configuration types
export const ConfigSchema = z.object({
  ankiConnectUrl: z.string().default('http://localhost:8765'),
  ankiConnectTimeout: z.number().default(5000),
  autoSync: z.boolean().default(true),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
});

export type Config = z.infer<typeof ConfigSchema>;

// Study session types
export const StudySessionSchema = z.object({
  id: z.string(),
  deckId: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  cardsStudied: z.number().default(0),
  correctAnswers: z.number().default(0),
});

export type StudySession = z.infer<typeof StudySessionSchema>;

// Content types for AI generation
export const ContentTypeSchema = z.enum([
  'markdown',
  'code',
  'pdf',
  'text',
  'url',
]);

export type ContentType = z.infer<typeof ContentTypeSchema>;

export const ContentInputSchema = z.object({
  type: ContentTypeSchema,
  content: z.string(),
  metadata: z
    .object({
      language: z.string().optional(),
      filename: z.string().optional(),
      title: z.string().optional(),
    })
    .optional(),
});

export type ContentInput = z.infer<typeof ContentInputSchema>;

// Error types
export class AnkinikiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AnkinikiError';
  }
}

export class AnkiConnectError extends AnkinikiError {
  constructor(message: string) {
    super(message, 'ANKI_CONNECT_ERROR', 502);
    this.name = 'AnkiConnectError';
  }
}

export class ValidationError extends AnkinikiError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}
