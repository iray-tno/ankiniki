/**
 * Response shape helpers — enforces a consistent API contract across all routes.
 *
 * Success: { success: true,  data: T,      message?: string  }
 * Error:   { success: false, error: string, details?: unknown }
 */

export function ok<T>(data: T, message?: string) {
  return {
    success: true as const,
    data,
    ...(message !== undefined ? { message } : {}),
  };
}

export function fail(error: string, details?: unknown) {
  return {
    success: false as const,
    error,
    ...(details !== undefined ? { details } : {}),
  };
}
