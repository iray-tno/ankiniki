import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createListCommand } from '../commands/list';

const mockClient = {
  ping: vi.fn().mockResolvedValue(true),
  findNotes: vi.fn().mockResolvedValue([101, 102, 103]),
  notesInfo: vi.fn().mockResolvedValue([
    {
      noteId: 101,
      fields: {
        Front: { value: 'What is TypeScript?', order: 0 },
        Back: { value: 'A typed superset of JavaScript.', order: 1 },
      },
      tags: ['programming', 'typescript'],
    },
    {
      noteId: 102,
      fields: {
        Front: { value: 'What is a closure?', order: 0 },
        Back: {
          value: 'A function that captures variables from its outer scope.',
          order: 1,
        },
      },
      tags: [],
    },
  ]),
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
  })),
}));

const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('note list command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.ping.mockResolvedValue(true);
    mockClient.findNotes.mockResolvedValue([101, 102, 103]);
    mockClient.notesInfo.mockResolvedValue([
      {
        noteId: 101,
        fields: {
          Front: { value: 'What is TypeScript?', order: 0 },
          Back: { value: 'A typed superset of JavaScript.', order: 1 },
        },
        tags: ['programming', 'typescript'],
      },
      {
        noteId: 102,
        fields: {
          Front: { value: 'What is a closure?', order: 0 },
          Back: {
            value: 'A function that captures variables from its outer scope.',
            order: 1,
          },
        },
        tags: [],
      },
    ]);
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  it('lists cards in the specified deck', async () => {
    const cmd = createListCommand();
    await cmd.parseAsync(['Default'], { from: 'user' });

    expect(mockClient.findNotes).toHaveBeenCalledWith('deck:"Default"');
    expect(mockClient.notesInfo).toHaveBeenCalledWith([101, 102, 103]);

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('What is TypeScript?');
    expect(output).toContain('What is a closure?');
  });

  it('shows tags when present', async () => {
    const cmd = createListCommand();
    await cmd.parseAsync(['Default'], { from: 'user' });

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('programming');
    expect(output).toContain('typescript');
  });

  it('shows message when deck has no cards', async () => {
    mockClient.findNotes.mockResolvedValueOnce([]);

    const cmd = createListCommand();
    await cmd.parseAsync(['EmptyDeck'], { from: 'user' });

    expect(mockClient.notesInfo).not.toHaveBeenCalled();
  });

  it('respects --limit option', async () => {
    mockClient.findNotes.mockResolvedValueOnce([101, 102, 103, 104, 105]);
    mockClient.notesInfo.mockResolvedValueOnce([
      {
        noteId: 101,
        fields: {
          Front: { value: 'Q1', order: 0 },
          Back: { value: 'A1', order: 1 },
        },
        tags: [],
      },
    ]);

    const cmd = createListCommand();
    await cmd.parseAsync(['Default', '--limit', '1'], { from: 'user' });

    expect(mockClient.notesInfo).toHaveBeenCalledWith([101]);
  });

  it('shows truncation message when there are more cards than the limit', async () => {
    mockClient.findNotes.mockResolvedValueOnce([101, 102, 103, 104, 105]);

    const cmd = createListCommand();
    await cmd.parseAsync(['Default', '--limit', '2'], { from: 'user' });

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('more cards');
  });

  it('returns early when AnkiConnect is not reachable', async () => {
    mockClient.ping.mockResolvedValueOnce(false);

    const cmd = createListCommand();
    await cmd.parseAsync(['Default'], { from: 'user' });

    expect(mockClient.findNotes).not.toHaveBeenCalled();
  });
});
