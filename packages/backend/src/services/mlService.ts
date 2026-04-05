/**
 * ML Service Client - Interface to the Python ML microservice
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface GenerateCardsRequest {
  content: string;
  content_type: 'code' | 'markdown' | 'text' | 'html' | 'pdf';
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  max_cards?: number;
  focus_areas?: string[];
  programming_language?: string;
  tags?: string[];
}

export interface GeneratedCard {
  front: string;
  back: string;
  tags: string[];
  difficulty: string;
  confidence_score: number;
  metadata?: Record<string, unknown>;
}

export interface GenerateCardsResponse {
  success: boolean;
  cards: GeneratedCard[];
  total_generated: number;
  processing_time?: number;
  error?: string;
}

export interface ProcessContentRequest {
  content: string;
  content_type: 'code' | 'markdown' | 'text' | 'html';
  extract_code?: boolean;
  extract_concepts?: boolean;
  programming_language?: string;
}

export interface ProcessedContent {
  main_concepts: string[];
  code_blocks: Array<{
    language: string;
    code: string;
    explanation: string;
  }>;
  key_terms: string[];
  summary: string;
  difficulty_estimate: string;
  metadata: Record<string, unknown>;
}

export interface ProcessContentResponse {
  success: boolean;
  processed_content: ProcessedContent;
  processing_time?: number;
  error?: string;
}

export interface EnhanceQuestionRequest {
  original_question: string;
  context?: string;
  target_difficulty?: 'beginner' | 'intermediate' | 'advanced';
  question_type?:
    | 'definition'
    | 'explanation'
    | 'code_review'
    | 'concept'
    | 'practical';
  programming_language?: string;
}

export interface EnhancedQuestion {
  original_question: string;
  enhanced_question: string;
  improvements: string[];
  suggested_answer: string;
  confidence_score: number;
}

export interface EnhanceQuestionResponse {
  success: boolean;
  enhanced_question: EnhancedQuestion;
  processing_time?: number;
  error?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  services: Record<string, string>;
  uptime?: number;
}

class MLServiceClient {
  private client: AxiosInstance;
  private baseURL: string;
  private isAvailable: boolean = false;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30000, // 30 second timeout for ML operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      config => {
        logger.info(
          `ML Service Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      error => {
        logger.error('ML Service Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and error handling
    this.client.interceptors.response.use(
      response => {
        logger.info(
          `ML Service Response: ${response.status} ${response.config.url}`
        );
        return response;
      },
      error => {
        logger.error('ML Service Response Error:', error.message);
        if (error.response) {
          logger.error(
            `Status: ${error.response.status}, Data:`,
            error.response.data
          );
        }
        return Promise.reject(error);
      }
    );

    // Check availability on initialization
    this.checkHealth();
  }

  /**
   * Check if ML service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get<HealthResponse>('/health');
      this.isAvailable = response.data.status === 'healthy';
      logger.info(
        `ML Service health check: ${this.isAvailable ? 'healthy' : 'unhealthy'}`
      );
      return this.isAvailable;
    } catch (error) {
      this.isAvailable = false;
      logger.warn(
        'ML Service is not available:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return false;
    }
  }

  /**
   * Generate flashcards from content using AI
   */
  async generateCards(
    request: GenerateCardsRequest
  ): Promise<GenerateCardsResponse> {
    try {
      if (!this.isAvailable) {
        await this.checkHealth();
      }

      if (!this.isAvailable) {
        return {
          success: false,
          cards: [],
          total_generated: 0,
          error: 'ML Service is not available',
        };
      }

      const response = await this.client.post<GenerateCardsResponse>(
        '/generate/cards',
        request
      );
      return response.data;
    } catch (error) {
      logger.error('Error generating cards with ML service:', error);
      return {
        success: false,
        cards: [],
        total_generated: 0,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error in ML service',
      };
    }
  }

  /**
   * Process content to extract learning materials
   */
  async processContent(
    request: ProcessContentRequest
  ): Promise<ProcessContentResponse> {
    try {
      if (!this.isAvailable) {
        await this.checkHealth();
      }

      if (!this.isAvailable) {
        throw new Error('ML Service is not available');
      }

      const response = await this.client.post<ProcessContentResponse>(
        '/process/content',
        request
      );
      return response.data;
    } catch (error) {
      logger.error('Error processing content with ML service:', error);
      return {
        success: false,
        processed_content: {
          main_concepts: [],
          code_blocks: [],
          key_terms: [],
          summary: 'Processing failed',
          difficulty_estimate: 'unknown',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error in ML service',
      };
    }
  }

  /**
   * Enhance a question using AI
   */
  async enhanceQuestion(
    request: EnhanceQuestionRequest
  ): Promise<EnhanceQuestionResponse> {
    try {
      if (!this.isAvailable) {
        await this.checkHealth();
      }

      if (!this.isAvailable) {
        return {
          success: false,
          enhanced_question: {
            original_question: request.original_question,
            enhanced_question: request.original_question,
            improvements: ['ML Service not available - no enhancement applied'],
            suggested_answer: 'Enhancement not available',
            confidence_score: 0.0,
          },
          error: 'ML Service is not available',
        };
      }

      const response = await this.client.post<EnhanceQuestionResponse>(
        '/enhance/question',
        request
      );
      return response.data;
    } catch (error) {
      logger.error('Error enhancing question with ML service:', error);
      return {
        success: false,
        enhanced_question: {
          original_question: request.original_question,
          enhanced_question: request.original_question,
          improvements: ['Enhancement failed'],
          suggested_answer: 'Enhancement not available',
          confidence_score: 0.0,
        },
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error in ML service',
      };
    }
  }

  /**
   * Process uploaded file
   */
  async processFile(
    file: Buffer,
    filename: string,
    contentType?: string
  ): Promise<ProcessContentResponse> {
    try {
      if (!this.isAvailable) {
        await this.checkHealth();
      }

      if (!this.isAvailable) {
        throw new Error('ML Service is not available');
      }

      const formData = new FormData();
      const blob = new Blob([new Uint8Array(file)], {
        type: contentType || 'application/octet-stream',
      });
      formData.append('file', blob, filename);

      const response = await this.client.post<ProcessContentResponse>(
        '/process/file',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error processing file with ML service:', error);
      return {
        success: false,
        processed_content: {
          main_concepts: [],
          code_blocks: [],
          key_terms: [],
          summary: 'File processing failed',
          difficulty_estimate: 'unknown',
          metadata: {
            filename,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error in ML service',
      };
    }
  }

  /**
   * Get available AI models
   */
  async getAvailableModels(): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.get('/models/available');
      return response.data;
    } catch (error) {
      logger.error('Error getting available models:', error);
      return {};
    }
  }

  /**
   * Check if ML service is currently available
   */
  getAvailability(): boolean {
    return this.isAvailable;
  }

  /**
   * Get the base URL of the ML service
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

// Export singleton instance
export const mlService = new MLServiceClient(
  process.env.ML_SERVICE_URL || 'http://localhost:8000'
);
export default mlService;
