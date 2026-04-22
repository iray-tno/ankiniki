import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { BackendManager } from '../backend-manager';

// Mock dependencies
vi.mock('child_process');
vi.mock('axios');
vi.mock('fs');
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
  })),
}));

describe('BackendManager', () => {
  const mockServerUrl = 'http://localhost:3001';
  let manager: BackendManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new BackendManager(mockServerUrl);

    // Mock path functions
    vi.spyOn(path, 'resolve').mockImplementation((...args) => args.join('/'));
    vi.spyOn(path, 'join').mockImplementation((...args) => args.join('/'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isRunning', () => {
    it('returns true when health check returns 200', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ status: 200 });

      const result = await manager.isRunning();

      expect(result).toBe(true);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.anything()
      );
    });

    it('returns true when health check returns 503 (server up but Anki down)', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ status: 503 });

      const result = await manager.isRunning();

      expect(result).toBe(true);
    });

    it('returns false when health check fails', async () => {
      vi.mocked(axios.get).mockRejectedValueOnce(
        new Error('Connection refused')
      );

      const result = await manager.isRunning();

      expect(result).toBe(false);
    });

    it('returns true if axios error has a response (server is alive)', async () => {
      const error = { isAxiosError: true, response: { status: 500 } };
      vi.mocked(axios.get).mockRejectedValueOnce(error);
      vi.mocked(axios.isAxiosError).mockReturnValueOnce(true);

      const result = await manager.isRunning();

      expect(result).toBe(true);
    });
  });

  describe('start', () => {
    it('does nothing if already running', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ status: 200 });

      await manager.start();

      expect(spawn).not.toHaveBeenCalled();
    });

    it('spawns backend process and waits for ready', async () => {
      // 1. First isRunning check (before start)
      vi.mocked(axios.get).mockRejectedValueOnce(new Error('Down'));

      // 2. Mock fs.existsSync for path resolution
      vi.mocked(fs.existsSync).mockReturnValue(true);

      // 3. Mock spawn
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
        exitCode: null,
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      // 4. Mock subsequent isRunning checks (polling)
      // First poll fails, second succeeds
      vi.mocked(axios.get)
        .mockRejectedValueOnce(new Error('Still down'))
        .mockResolvedValueOnce({ status: 200 });

      // Use a shorter polling interval for tests if possible,
      // but here we just wait for the async calls.
      // We need to wrap the start call because it has a timeout/interval
      const startPromise = manager.start();

      await startPromise;

      expect(spawn).toHaveBeenCalled();
      expect(manager['wasStartedByCli']).toBe(true);
    });
  });

  describe('stop', () => {
    it('kills process only if started by CLI', () => {
      const mockProcess = { kill: vi.fn() };
      manager['backendProcess'] = mockProcess as any;
      manager['wasStartedByCli'] = true;

      manager.stop();

      expect(mockProcess.kill).toHaveBeenCalled();
      expect(manager['wasStartedByCli']).toBe(false);
    });

    it('does not kill process if not started by CLI', () => {
      const mockProcess = { kill: vi.fn() };
      manager['backendProcess'] = mockProcess as any;
      manager['wasStartedByCli'] = false;

      manager.stop();

      expect(mockProcess.kill).not.toHaveBeenCalled();
    });
  });

  describe('ensure', () => {
    it('starts backend and returns cleanup function if not running', async () => {
      // Mock isRunning to return false then true
      vi.spyOn(BackendManager.prototype, 'isRunning')
        .mockResolvedValueOnce(false) // for the initial check in ensure()
        .mockResolvedValueOnce(false) // for the check in start()
        .mockResolvedValueOnce(true); // for the polling in start()

      vi.spyOn(BackendManager.prototype, 'start').mockResolvedValueOnce();
      const stopSpy = vi.spyOn(BackendManager.prototype, 'stop');

      const cleanup = await BackendManager.ensure(mockServerUrl);

      expect(BackendManager.prototype.start).toHaveBeenCalled();

      cleanup();
      expect(stopSpy).toHaveBeenCalled();
    });

    it('does not start backend and cleanup does nothing if already running', async () => {
      vi.spyOn(BackendManager.prototype, 'isRunning').mockResolvedValue(true);
      vi.spyOn(BackendManager.prototype, 'start');
      const stopSpy = vi.spyOn(BackendManager.prototype, 'stop');

      const cleanup = await BackendManager.ensure(mockServerUrl);

      expect(BackendManager.prototype.start).not.toHaveBeenCalled();

      cleanup();
      expect(stopSpy).not.toHaveBeenCalled();
    });
  });
});
