import { Request, Response, NextFunction } from 'express';
import { AnkinikiError } from '@ankiniki/shared';
import { logger } from '../utils/logger';
import { sendProblem, PROBLEM_TYPES } from '../utils/response';

const ERROR_CODE_TO_PROBLEM_TYPE: Record<string, string> = {
  VALIDATION_ERROR: PROBLEM_TYPES.VALIDATION,
  ANKI_CONNECT_ERROR: PROBLEM_TYPES.ANKI_CONNECT,
};

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  if (error instanceof AnkinikiError) {
    const type =
      ERROR_CODE_TO_PROBLEM_TYPE[error.code] ?? PROBLEM_TYPES.INTERNAL;
    return sendProblem(res, error.statusCode, error.message, {
      type,
      instance: req.path,
    });
  }

  sendProblem(res, 500, 'An unexpected error occurred', {
    type: PROBLEM_TYPES.INTERNAL,
    instance: req.path,
  });
}

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  sendProblem(res, 404, `Route ${req.method} ${req.path} not found`, {
    type: PROBLEM_TYPES.NOT_FOUND,
    instance: req.path,
  });
}
