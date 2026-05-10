import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAddCommand } from '../commands/add';

// ── Client mock ────────────────────────────────────────────────────────────

const mockClient = {
  ping: vi.fn().mockResolvedValue(true),
  getDeckNames: vi.fn().mockResolvedValue(['Default']),
  modelNames: vi.fn().mockResolvedValue(['Basic']),
  modelFieldNames: vi.fn().mockResolvedValue(['Front', 'Back']),
  addNote: vi.fn().mockResolvedValue(12345),
};

vi.mock('../anki-client', () => ({
  AnkiClient: class {
    constructor() {
      return mockClient;
    }
  },
}));

vi.mock('../config', () => ({
  loadConfig: () => ({ defaultDeck: 'Default', defaultModel: 'Basic' }),
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
  })),
}));

const mockInquirerPrompt = vi.fn();
vi.mock('inquirer', () => ({
  default: {
    prompt: (...args: unknown[]) => mockInquirerPrompt(...args),
  },
}));

vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// ── Helpers ────────────────────────────────────────────────────────────────

async function run(args: string[]) {
  const cmd = createAddCommand();
  await cmd.parseAsync(args, { from: 'user' });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('add command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.ping.mockResolvedValue(true);
    mockClient.getDeckNames.mockResolvedValue(['Default']);
    mockClient.modelNames.mockResolvedValue(['Basic']);
    mockClient.modelFieldNames.mockResolvedValue(['Front', 'Back']);
    mockClient.addNote.mockResolvedValue(12345);
  });

  it('converts \\n to <br> in front and back fields', async () => {
    await run([
      'Default',
      'line1\nline2',
      'answer1\nanswer2',
      '--model',
      'Basic',
    ]);

    expect(mockClient.addNote).toHaveBeenCalledWith(
      'Default',
      'Basic',
      { Front: 'line1<br>line2', Back: 'answer1<br>answer2' },
      []
    );
  });

  it('passes plain text unchanged when no newlines', async () => {
    await run([
      'Default',
      'What is TypeScript?',
      'A typed superset of JS',
      '--model',
      'Basic',
    ]);

    expect(mockClient.addNote).toHaveBeenCalledWith(
      'Default',
      'Basic',
      { Front: 'What is TypeScript?', Back: 'A typed superset of JS' },
      []
    );
  });

  it('converts multiple newlines in a single field', async () => {
    await run(['Default', 'a\nb\nc', 'answer', '--model', 'Basic']);

    const [, , fields] = mockClient.addNote.mock.calls[0];
    expect(fields.Front).toBe('a<br>b<br>c');
  });

  it('uses model field names from AnkiConnect', async () => {
    mockClient.modelFieldNames.mockResolvedValue(['Question', 'Answer']);

    await run(['Default', 'q\ntext', 'a\ntext', '--model', 'Basic']);

    const [, , fields] = mockClient.addNote.mock.calls[0];
    expect(fields).toEqual({ Question: 'q<br>text', Answer: 'a<br>text' });
  });

  it('falls back to Front/Back when model has fewer than 2 fields', async () => {
    mockClient.modelFieldNames.mockResolvedValue(['OnlyField']);

    await run(['Default', 'front\nvalue', 'back\nvalue', '--model', 'Basic']);

    const [, , fields] = mockClient.addNote.mock.calls[0];
    expect(fields).toEqual({ Front: 'front<br>value', Back: 'back<br>value' });
  });
});
