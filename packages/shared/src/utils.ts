// ID generation
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Card utilities
export function sanitizeCardContent(content: string): string {
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
    .replace(/javascript:/gi, '') // Remove javascript: links
    .trim();
}

// Array utilities
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Async retry utility
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxAttempts) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw new Error(
    `Failed after ${maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`
  );
}
