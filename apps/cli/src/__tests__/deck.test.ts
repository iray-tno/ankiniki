import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDeckCommand } from '../commands/deck';

const mockClient = {
  ping: vi.fn().mockResolvedValue(true),
  getDeckNames: vi
    .fn()
    .mockResolvedValue(['Default', 'Spanish', 'Programming']),
  findNotes: vi.fn().mockResolvedValue([1, 2, 3]),
  createDeck: vi.fn().mockResolvedValue(1),
  deleteDeck: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../anki-client', () => ({
  AnkiClient: vi.fn(() => {
    return mockClient;
  }),
}));

vi.mock('inquirer', () => ({
  default: { prompt: vi.fn() },
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

const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('deck command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.ping.mockResolvedValue(true);
    mockClient.getDeckNames.mockResolvedValue([
      'Default',
      'Spanish',
      'Programming',
    ]);
    mockClient.findNotes.mockResolvedValue([1, 2, 3]);
    mockClient.createDeck.mockResolvedValue(1);
    mockClient.deleteDeck.mockResolvedValue(undefined);
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  describe('deck list', () => {
    it('lists all decks with card counts', async () => {
      const cmd = createDeckCommand();
      await cmd.parseAsync(['list'], { from: 'user' });

      expect(mockClient.ping).toHaveBeenCalled();
      expect(mockClient.getDeckNames).toHaveBeenCalled();
      // findNotes called once per deck
      expect(mockClient.findNotes).toHaveBeenCalledTimes(3);

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Default');
      expect(output).toContain('Spanish');
      expect(output).toContain('Programming');
    });

    it('exits when AnkiConnect unreachable', async () => {
      mockClient.ping.mockResolvedValueOnce(false);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit: 1');
      });

      const cmd = createDeckCommand();
      await expect(cmd.parseAsync(['list'], { from: 'user' })).rejects.toThrow(
        'process.exit: 1'
      );

      exitSpy.mockRestore();
    });
  });

  describe('deck create', () => {
    it('creates a new deck', async () => {
      const cmd = createDeckCommand();
      await cmd.parseAsync(['create', 'NewDeck'], { from: 'user' });

      expect(mockClient.ping).toHaveBeenCalled();
      expect(mockClient.createDeck).toHaveBeenCalledWith('NewDeck');
    });

    it('exits when AnkiConnect unreachable', async () => {
      mockClient.ping.mockResolvedValueOnce(false);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit: 1');
      });

      const cmd = createDeckCommand();
      await expect(
        cmd.parseAsync(['create', 'NewDeck'], { from: 'user' })
      ).rejects.toThrow('process.exit: 1');

      exitSpy.mockRestore();
    });
  });

  describe('deck delete', () => {
    it('skips confirmation and deletes with --force flag', async () => {
      const inquirer = await import('inquirer');

      const cmd = createDeckCommand();
      await cmd.parseAsync(['delete', 'Spanish', '--force'], { from: 'user' });

      expect(mockClient.deleteDeck).toHaveBeenCalledWith('Spanish');
      expect(inquirer.default.prompt).not.toHaveBeenCalled();
    });

    it('prompts for confirmation without --force and deletes when confirmed', async () => {
      const inquirer = await import('inquirer');
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        confirmed: true,
      });

      const cmd = createDeckCommand();
      await cmd.parseAsync(['delete', 'Spanish'], { from: 'user' });

      expect(inquirer.default.prompt).toHaveBeenCalled();
      expect(mockClient.deleteDeck).toHaveBeenCalledWith('Spanish');
    });

    it('cancels without deleting when user declines confirmation', async () => {
      const inquirer = await import('inquirer');
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        confirmed: false,
      });

      const cmd = createDeckCommand();
      await cmd.parseAsync(['delete', 'Spanish'], { from: 'user' });

      expect(mockClient.deleteDeck).not.toHaveBeenCalled();
    });

    it('exits when deck not found', async () => {
      mockClient.getDeckNames.mockResolvedValueOnce(['Default']);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit: 1');
      });

      const cmd = createDeckCommand();
      await expect(
        cmd.parseAsync(['delete', 'NonExistentDeck', '--force'], {
          from: 'user',
        })
      ).rejects.toThrow('process.exit: 1');

      expect(mockClient.deleteDeck).not.toHaveBeenCalled();
      exitSpy.mockRestore();
    });
  });
});
