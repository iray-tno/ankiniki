'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ValidationError =
  exports.AnkiConnectError =
  exports.AnkinikiError =
  exports.ContentInputSchema =
  exports.ContentTypeSchema =
  exports.StudySessionSchema =
  exports.ConfigSchema =
  exports.ApiResponseSchema =
  exports.AnkiConnectResponseSchema =
  exports.AnkiConnectRequestSchema =
  exports.DeckSchema =
  exports.CardSchema =
    void 0;
const zod_1 = require('zod');
// Card types
exports.CardSchema = zod_1.z.object({
  id: zod_1.z.string(),
  deckId: zod_1.z.string(),
  front: zod_1.z.string(),
  back: zod_1.z.string(),
  tags: zod_1.z.array(zod_1.z.string()).default([]),
  created: zod_1.z.date(),
  modified: zod_1.z.date(),
  due: zod_1.z.date().optional(),
  interval: zod_1.z.number().optional(),
  ease: zod_1.z.number().optional(),
  reps: zod_1.z.number().default(0),
});
// Deck types
exports.DeckSchema = zod_1.z.object({
  id: zod_1.z.string(),
  name: zod_1.z.string(),
  description: zod_1.z.string().optional(),
  created: zod_1.z.date(),
  modified: zod_1.z.date(),
  cardCount: zod_1.z.number().default(0),
  config: zod_1.z
    .object({
      newCardsPerDay: zod_1.z.number().default(20),
      reviewCardsPerDay: zod_1.z.number().default(200),
    })
    .optional(),
});
// AnkiConnect types
exports.AnkiConnectRequestSchema = zod_1.z.object({
  action: zod_1.z.string(),
  version: zod_1.z.number(),
  params: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.AnkiConnectResponseSchema = zod_1.z.object({
  result: zod_1.z.any(),
  error: zod_1.z.string().nullable(),
});
// API Response types
exports.ApiResponseSchema = zod_1.z.object({
  success: zod_1.z.boolean(),
  data: zod_1.z.any().optional(),
  error: zod_1.z.string().optional(),
  message: zod_1.z.string().optional(),
});
// Configuration types
exports.ConfigSchema = zod_1.z.object({
  ankiConnectUrl: zod_1.z.string().default('http://localhost:8765'),
  ankiConnectTimeout: zod_1.z.number().default(5000),
  autoSync: zod_1.z.boolean().default(true),
  theme: zod_1.z.enum(['light', 'dark', 'system']).default('system'),
});
// Study session types
exports.StudySessionSchema = zod_1.z.object({
  id: zod_1.z.string(),
  deckId: zod_1.z.string(),
  startTime: zod_1.z.date(),
  endTime: zod_1.z.date().optional(),
  cardsStudied: zod_1.z.number().default(0),
  correctAnswers: zod_1.z.number().default(0),
});
// Content types for AI generation
exports.ContentTypeSchema = zod_1.z.enum([
  'markdown',
  'code',
  'pdf',
  'text',
  'url',
]);
exports.ContentInputSchema = zod_1.z.object({
  type: exports.ContentTypeSchema,
  content: zod_1.z.string(),
  metadata: zod_1.z
    .object({
      language: zod_1.z.string().optional(),
      filename: zod_1.z.string().optional(),
      title: zod_1.z.string().optional(),
    })
    .optional(),
});
// Error types
class AnkinikiError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'AnkinikiError';
  }
}
exports.AnkinikiError = AnkinikiError;
class AnkiConnectError extends AnkinikiError {
  constructor(message) {
    super(message, 'ANKI_CONNECT_ERROR', 502);
    this.name = 'AnkiConnectError';
  }
}
exports.AnkiConnectError = AnkiConnectError;
class ValidationError extends AnkinikiError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=types.js.map
