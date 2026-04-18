/**
 * Response shape helpers — enforces a consistent API contract across all routes.
 *
 * Success: { success: true, data: T, message?: string }
 * Error:   RFC 7807 Problem Details (application/problem+json)
 *           { type, title, status, detail, instance? }
 */

import { Response } from 'express';
import { ProblemDetails } from '@ankiniki/shared';

export function ok<T>(data: T, message?: string) {
  return {
    success: true as const,
    data,
    ...(message !== undefined ? { message } : {}),
  };
}

// ─── RFC 7807 Problem Details ─────────────────────────────────────────────────

export const PROBLEM_TYPES = {
  VALIDATION: '/problems/validation-error',
  NOT_FOUND: '/problems/not-found',
  CONFLICT: '/problems/conflict',
  ANKI_CONNECT: '/problems/anki-connect-unavailable',
  INTERNAL: '/problems/internal-error',
} as const;

const PROBLEM_TITLES: Record<string, string> = {
  [PROBLEM_TYPES.VALIDATION]: 'Validation Error',
  [PROBLEM_TYPES.NOT_FOUND]: 'Not Found',
  [PROBLEM_TYPES.CONFLICT]: 'Conflict',
  [PROBLEM_TYPES.ANKI_CONNECT]: 'AnkiConnect Unavailable',
  [PROBLEM_TYPES.INTERNAL]: 'Internal Server Error',
};

const STATUS_TITLES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
};

/**
 * Send an RFC 7807 Problem Details response.
 * Sets Content-Type to application/problem+json automatically.
 *
 * @param res     Express Response
 * @param status  HTTP status code
 * @param detail  Human-readable explanation specific to this occurrence
 * @param opts    Optional: type URI, title override, instance URI, and any
 *                RFC 7807 extension members (spread into the body)
 */
export function sendProblem(
  res: Response,
  status: number,
  detail: string,
  opts?: {
    type?: string;
    title?: string;
    instance?: string;
    [key: string]: unknown;
  }
): void {
  const {
    type: optType,
    title: optTitle,
    instance,
    ...extensions
  } = opts ?? {};
  const type = optType ?? 'about:blank';
  const title =
    optTitle ?? PROBLEM_TITLES[type] ?? STATUS_TITLES[status] ?? 'Error';

  const body: ProblemDetails = { type, title, status, detail };
  if (instance) {
    body.instance = instance;
  }
  Object.assign(body, extensions);

  res.status(status).type('application/problem+json').json(body);
}
