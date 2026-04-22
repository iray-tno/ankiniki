import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStatsCommand } from '../commands/stats';

const mockDeckStats = {
  '1': {
    deck_id: 1,
    name: 'Default',
    new_count: 5,
    learn_count: 2,
    review_count: 8,
    total_in_deck: 100,
  },
  '2': {
    deck_id: 2,
    name: 'Spanish',
    new_count: 0,
    learn_count: 1,
    review_count: 3,
    total_in_deck: 50,
  },
};

const mockClient = {
  ping: vi.fn().mockResolvedValue(true),
  getDeckNames: vi.fn().mockResolvedValue(['Default', 'Spanish']),
  getDeckStats: vi.fn().mockResolvedValue(mockDeckStats),
  findCards: vi.fn().mockResolvedValue([101, 102, 103]),
  findNotes: vi.fn().mockResolvedValue([201, 202]),
};

vi.mock('../anki-client', () => ({
  AnkiClient: class {
    constructor() {
      return mockClient;
    }
  },
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
  })),
}));

const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('stats command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.ping.mockResolvedValue(true);
    mockClient.getDeckNames.mockResolvedValue(['Default', 'Spanish']);
    mockClient.getDeckStats.mockResolvedValue(mockDeckStats);
    mockClient.findCards.mockResolvedValue([101, 102, 103]);
    mockClient.findNotes.mockResolvedValue([201, 202]);
    consoleSpy.mockImplementation(() => {});
  });

  async function run(args: string[] = []) {
    const cmd = createStatsCommand();
    await cmd.parseAsync(args, { from: 'user' });
  }

  it('fetches deck stats, reviewed today, and added this week in parallel', async () => {
    await run();

    expect(mockClient.getDeckStats).toHaveBeenCalledWith([
      'Default',
      'Spanish',
    ]);
    expect(mockClient.findCards).toHaveBeenCalledWith('rated:1');
    expect(mockClient.findNotes).toHaveBeenCalledWith('added:7');
  });

  it('outputs deck names and due counts in full mode', async () => {
    await run();

    const output = consoleSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(output).toContain('Default');
    expect(output).toContain('Spanish');
  });

  it('shows nothing-due message when all decks are at zero', async () => {
    mockClient.getDeckStats.mockResolvedValue({
      '1': {
        deck_id: 1,
        name: 'Default',
        new_count: 0,
        learn_count: 0,
        review_count: 0,
        total_in_deck: 50,
      },
    });

    await run();

    const output = consoleSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(output).toContain('Nothing due');
  });

  it('--brief outputs a single summary line', async () => {
    await run(['--brief']);

    const output = consoleSpy.mock.calls.map(c => String(c[0])).join('\n');
    // total due = 5+2+8 + 0+1+3 = 19
    expect(output).toContain('19 due');
    expect(output).toContain('3 reviewed today');
    expect(output).toContain('2 added this week');
  });

  it('--deck scopes stats to a single deck', async () => {
    mockClient.getDeckStats.mockResolvedValue({
      '1': {
        deck_id: 1,
        name: 'Default',
        new_count: 5,
        learn_count: 2,
        review_count: 8,
        total_in_deck: 100,
      },
    });

    await run(['--deck', 'Default']);

    expect(mockClient.getDeckStats).toHaveBeenCalledWith(['Default']);
  });

  it('exits when --deck names a deck that does not exist', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    await expect(run(['--deck', 'NonExistent'])).rejects.toThrow(
      'process.exit: 1'
    );

    expect(mockClient.getDeckStats).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it('exits when AnkiConnect is not reachable', async () => {
    mockClient.ping.mockResolvedValueOnce(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    await expect(run()).rejects.toThrow('process.exit: 1');

    expect(mockClient.getDeckStats).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});
