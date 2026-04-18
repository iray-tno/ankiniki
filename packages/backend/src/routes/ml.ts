/**
 * ML Service Routes - AI-powered features
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { logger } from '../utils/logger';
import mlService from '../services/mlService';
import { ok, fail } from '../utils/response';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'text/html',
      'application/javascript',
      'text/javascript',
      'application/typescript',
      'text/typescript',
      'text/x-python',
      'application/json',
    ];

    const allowedExtensions = [
      '.txt',
      '.md',
      '.pdf',
      '.html',
      '.js',
      '.ts',
      '.py',
      '.json',
    ];
    const hasAllowedExtension = allowedExtensions.some(ext =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (allowedTypes.includes(file.mimetype) || hasAllowedExtension) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// Validation schemas
const generateCardsSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  content_type: z.enum(['code', 'markdown', 'text', 'html', 'pdf']),
  difficulty_level: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .optional()
    .default('intermediate'),
  max_cards: z.number().int().min(1).max(20).optional().default(5),
  focus_areas: z.array(z.string()).optional(),
  programming_language: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const processContentSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  content_type: z.enum(['code', 'markdown', 'text', 'html']),
  extract_code: z.boolean().optional().default(true),
  extract_concepts: z.boolean().optional().default(true),
  programming_language: z.string().optional(),
});

const enhanceQuestionSchema = z.object({
  original_question: z.string().min(1, 'Original question is required'),
  context: z.string().optional(),
  target_difficulty: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .optional()
    .default('intermediate'),
  question_type: z
    .enum(['definition', 'explanation', 'code_review', 'concept', 'practical'])
    .optional()
    .default('concept'),
  programming_language: z.string().optional(),
});

/**
 * @swagger
 * /api/ml/health:
 *   get:
 *     summary: Check ML service health
 *     tags: [ML Service]
 *     responses:
 *       200:
 *         description: ML service status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isAvailable = await mlService.checkHealth();
    const models = await mlService.getAvailableModels();

    res.json(
      ok({ available: isAvailable, base_url: mlService.getBaseURL(), models })
    );
  } catch (error) {
    logger.error('Error checking ML service health:', error);
    res.status(500).json(fail('Failed to check ML service health'));
  }
});

/**
 * @swagger
 * /api/ml/generate/cards:
 *   post:
 *     summary: Generate flashcards using AI
 *     tags: [ML Service]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content, content_type]
 *             properties:
 *               content:
 *                 type: string
 *               content_type:
 *                 type: string
 *                 enum: [code, markdown, text, html, pdf]
 *               difficulty_level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               max_cards:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *     responses:
 *       200:
 *         description: Generated flashcards
 */
router.post('/generate/cards', async (req: Request, res: Response) => {
  try {
    const validatedData = generateCardsSchema.parse(req.body);

    logger.info('Generating cards via ML service', {
      content_type: validatedData.content_type,
      max_cards: validatedData.max_cards,
      programming_language: validatedData.programming_language,
    });

    const result = await mlService.generateCards(validatedData);

    if (result.success) {
      res.json(ok(result));
    } else {
      res.status(500).json(fail(result.error || 'Failed to generate cards'));
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail('Invalid request data', error.errors));
    }

    logger.error('Error generating cards:', error);
    res.status(500).json(fail('Internal server error'));
  }
});

/**
 * @swagger
 * /api/ml/process/content:
 *   post:
 *     summary: Process content to extract learning materials
 *     tags: [ML Service]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content, content_type]
 *             properties:
 *               content:
 *                 type: string
 *               content_type:
 *                 type: string
 *                 enum: [code, markdown, text, html]
 *     responses:
 *       200:
 *         description: Processed content with extracted materials
 */
router.post('/process/content', async (req: Request, res: Response) => {
  try {
    const validatedData = processContentSchema.parse(req.body);

    logger.info('Processing content via ML service', {
      content_type: validatedData.content_type,
      extract_code: validatedData.extract_code,
      extract_concepts: validatedData.extract_concepts,
    });

    const result = await mlService.processContent(validatedData);

    if (result.success) {
      res.json(ok(result));
    } else {
      res.status(500).json(fail(result.error || 'Failed to process content'));
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail('Invalid request data', error.errors));
    }

    logger.error('Error processing content:', error);
    res.status(500).json(fail('Internal server error'));
  }
});

/**
 * @swagger
 * /api/ml/process/file:
 *   post:
 *     summary: Process uploaded file for content extraction
 *     tags: [ML Service]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Processed file content
 */
router.post(
  '/process/file',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json(fail('No file uploaded'));
      }

      const { buffer, originalname, mimetype } = req.file;

      logger.info('Processing file via ML service', {
        filename: originalname,
        size: buffer.length,
        mimetype,
      });

      const result = await mlService.processFile(
        buffer,
        originalname,
        mimetype
      );

      if (result.success) {
        res.json(ok({ ...result, filename: originalname }));
      } else {
        res.status(500).json(
          fail(result.error || 'Failed to process file', {
            filename: originalname,
          })
        );
      }
    } catch (error) {
      logger.error('Error processing file:', error);
      res
        .status(500)
        .json(
          fail(error instanceof Error ? error.message : 'Internal server error')
        );
    }
  }
);

/**
 * @swagger
 * /api/ml/enhance/question:
 *   post:
 *     summary: Enhance a question using AI
 *     tags: [ML Service]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [original_question]
 *             properties:
 *               original_question:
 *                 type: string
 *               context:
 *                 type: string
 *               target_difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *     responses:
 *       200:
 *         description: Enhanced question
 */
router.post('/enhance/question', async (req: Request, res: Response) => {
  try {
    const validatedData = enhanceQuestionSchema.parse(req.body);

    logger.info('Enhancing question via ML service', {
      target_difficulty: validatedData.target_difficulty,
      question_type: validatedData.question_type,
      has_context: !!validatedData.context,
    });

    const result = await mlService.enhanceQuestion(validatedData);

    if (result.success) {
      res.json(ok(result));
    } else {
      res.status(500).json(fail(result.error || 'Failed to enhance question'));
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail('Invalid request data', error.errors));
    }

    logger.error('Error enhancing question:', error);
    res.status(500).json(fail('Internal server error'));
  }
});

/**
 * @swagger
 * /api/ml/models:
 *   get:
 *     summary: Get available AI models
 *     tags: [ML Service]
 *     responses:
 *       200:
 *         description: List of available AI models and capabilities
 */
router.get('/models', async (req: Request, res: Response) => {
  try {
    const models = await mlService.getAvailableModels();

    res.json(ok(models));
  } catch (error) {
    logger.error('Error getting available models:', error);
    res.status(500).json(fail('Failed to get available models'));
  }
});

export default router;
