import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

vi.mock('../services/mlService', () => ({ default: {} }));
vi.stubEnv(
  'CORS_ORIGIN',
  'http://localhost:1420, http://tauri.localhost, tauri://localhost'
);
const { createApp } = await import('../app');
const app = createApp();

describe('Desktop CORS origins', () => {
  it.each([
    'http://localhost:1420',
    'http://tauri.localhost',
    'tauri://localhost',
  ])('allows the configured origin %s', async origin => {
    const response = await request(app)
      .options('/api/decks')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'GET');
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
  });

  it('does not grant CORS access to an unconfigured origin', async () => {
    const response = await request(app)
      .options('/api/decks')
      .set('Origin', 'https://unconfigured.example')
      .set('Access-Control-Request-Method', 'GET');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
