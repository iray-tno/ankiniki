import { Request, Response, NextFunction } from 'express';
import { AnkinikiError, ApiResponse } from '@ankiniki/shared';
import { logger } from '../utils/logger';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) {
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  if (error instanceof AnkinikiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      message: error.message,
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
}

export function notFoundHandler(
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
}