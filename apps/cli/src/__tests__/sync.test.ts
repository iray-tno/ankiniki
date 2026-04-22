import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSyncCommand } from '../commands/sync';

const mockClient = {
  ping: vi.fn().mockResolvedValue(true),
  sync: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../anki-client', () => ({
  AnkiClient: class {
    constructor() {
      return mockClient;
    }
  },
}));

vi.mock('ora', () => ({
  default: vi.fn(() => {
    return {
      start: vi.fn().mockReturnThis(),
      succeed: vi.fn().mockReturnThis(),
      fail: vi.fn().mockReturnThis(),
    };
  }),
}));

vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('sync command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.ping.mockResolvedValue(true);
    mockClient.sync.mockResolvedValue(undefined);
  });

  it('pings AnkiConnect then calls sync', async () => {
    const cmd = createSyncCommand();
    await cmd.parseAsync([], { from: 'user' });

    expect(mockClient.ping).toHaveBeenCalled();
    expect(mockClient.sync).toHaveBeenCalled();
  });

  it('exits when AnkiConnect is not reachable', async () => {
    mockClient.ping.mockResolvedValueOnce(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    const cmd = createSyncCommand();
    await expect(cmd.parseAsync([], { from: 'user' })).rejects.toThrow(
      'process.exit: 1'
    );

    expect(mockClient.sync).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it('exits when sync throws', async () => {
    mockClient.sync.mockRejectedValueOnce(new Error('AnkiWeb unreachable'));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    const cmd = createSyncCommand();
    await expect(cmd.parseAsync([], { from: 'user' })).rejects.toThrow(
      'process.exit: 1'
    );

    exitSpy.mockRestore();
  });
});
