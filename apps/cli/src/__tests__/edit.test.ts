import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEditCommand } from '../commands/edit';

// ── Fixtures ───────────────────────────────────────────────────────────────

const NOTE_1 = {
  noteId: 101,
  modelName: 'Basic',
  tags: ['ts'],
  fields: {
    Front: { value: 'What is TypeScript?', order: 0 },
    Back: { value: 'A typed superset of JavaScript', order: 1 },
  },
  cards: [1001],
};

const NOTE_2 = {
  noteId: 102,
  modelName: 'Basic',
  tags: [],
  fields: {
    Front: { value: 'What is a union type?', order: 0 },
    Back: { value: 'A type that can be one of several types', order: 1 },
  },
  cards: [1002],
};

// ── Client mock ────────────────────────────────────────────────────────────

const mockClient = {
  ping: vi.fn().mockResolvedValue(true),
  findNotes: vi.fn().mockResolvedValue([101]),
  notesInfo: vi.fn().mockResolvedValue([NOTE_1]),
  updateNoteFields: vi.fn().mockResolvedValue(undefined),
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

// inquirer mock — overridden per test via mockInquirerPrompt
const mockInquirerPrompt = vi.fn();
vi.mock('inquirer', () => ({
  default: {
    prompt: (...args: unknown[]) => mockInquirerPrompt(...args),
  },
}));

const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// ── Helpers ────────────────────────────────────────────────────────────────

async function run(args: string[]) {
  const cmd = createEditCommand();
  await cmd.parseAsync(args, { from: 'user' });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('edit command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.ping.mockResolvedValue(true);
    mockClient.findNotes.mockResolvedValue([101]);
    mockClient.notesInfo.mockResolvedValue([NOTE_1]);
    mockClient.updateNoteFields.mockResolvedValue(undefined);
    consoleSpy.mockImplementation(() => {});
  });

  it('searches with the provided query', async () => {
    mockInquirerPrompt.mockResolvedValue({
      value: 'A typed superset of JavaScript',
    });

    await run(['TypeScript']);

    expect(mockClient.findNotes).toHaveBeenCalledWith('TypeScript');
  });

  it('scopes search to deck when --deck is set', async () => {
    mockInquirerPrompt.mockResolvedValue({
      value: 'A typed superset of JavaScript',
    });

    await run(['TypeScript', '--deck', 'Japanese']);

    expect(mockClient.findNotes).toHaveBeenCalledWith(
      'deck:"Japanese" TypeScript'
    );
  });

  it('skips picker and goes straight to edit when only one result', async () => {
    // Single note → prompt called only for field editing (once per field)
    mockInquirerPrompt.mockResolvedValue({ value: 'Updated answer' });

    await run(['TypeScript']);

    // Should NOT call a list prompt — only editor prompts (one per field = 2)
    const listCalls = mockInquirerPrompt.mock.calls.filter(
      call => call[0]?.[0]?.type === 'list'
    );
    expect(listCalls).toHaveLength(0);
    expect(mockInquirerPrompt).toHaveBeenCalledTimes(2); // Front + Back
  });

  it('shows picker when multiple notes are returned', async () => {
    mockClient.findNotes.mockResolvedValue([101, 102]);
    mockClient.notesInfo.mockResolvedValue([NOTE_1, NOTE_2]);

    // First prompt: list picker → pick NOTE_1; then editor for each field
    mockInquirerPrompt
      .mockResolvedValueOnce({ noteId: 101 })
      .mockResolvedValue({ value: 'unchanged' });

    await run(['type']);

    const listCalls = mockInquirerPrompt.mock.calls.filter(
      call => call[0]?.[0]?.type === 'list'
    );
    expect(listCalls).toHaveLength(1);
  });

  it('saves updated fields via updateNoteFields', async () => {
    mockInquirerPrompt
      .mockResolvedValueOnce({ value: 'Edited front' })
      .mockResolvedValueOnce({ value: 'Edited back' });

    await run(['TypeScript']);

    expect(mockClient.updateNoteFields).toHaveBeenCalledWith(101, {
      Front: 'Edited front',
      Back: 'Edited back',
    });
  });

  it('skips save when nothing changed', async () => {
    // Return the exact original values
    mockInquirerPrompt
      .mockResolvedValueOnce({ value: 'What is TypeScript?' })
      .mockResolvedValueOnce({ value: 'A typed superset of JavaScript' });

    await run(['TypeScript']);

    expect(mockClient.updateNoteFields).not.toHaveBeenCalled();
    const output = consoleSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(output).toContain('No changes');
  });

  it('respects --limit and slices results', async () => {
    const ids = [101, 102, 103, 104, 105];
    mockClient.findNotes.mockResolvedValue(ids);
    mockClient.notesInfo.mockResolvedValue([NOTE_1]);
    mockInquirerPrompt.mockResolvedValue({ value: 'x' });

    await run(['tag:js', '--limit', '1']);

    // Only the first id should be fetched
    expect(mockClient.notesInfo).toHaveBeenCalledWith([101]);
  });

  it('exits when no notes are found', async () => {
    mockClient.findNotes.mockResolvedValue([]);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    await expect(run(['nonexistent'])).rejects.toThrow('process.exit: 1');

    expect(mockClient.updateNoteFields).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it('exits when AnkiConnect is unreachable', async () => {
    mockClient.ping.mockResolvedValue(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    await expect(run(['anything'])).rejects.toThrow('process.exit: 1');

    expect(mockClient.findNotes).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});

describe('edit command — non-interactive (--field)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.ping.mockResolvedValue(true);
    mockClient.findNotes.mockResolvedValue([101]);
    mockClient.notesInfo.mockResolvedValue([NOTE_1]);
    mockClient.updateNoteFields.mockResolvedValue(undefined);
    consoleSpy.mockImplementation(() => {});
  });

  it('updates fields without prompts when --field is provided', async () => {
    await run([
      'TypeScript',
      '--field',
      'Front=Updated front',
      '--field',
      'Back=Updated back',
    ]);

    expect(mockInquirerPrompt).not.toHaveBeenCalled();
    expect(mockClient.updateNoteFields).toHaveBeenCalledWith(101, {
      Front: 'Updated front',
      Back: 'Updated back',
    });
  });

  it('treats a bare integer query as nid: search', async () => {
    await run(['1234567890', '--field', 'Back=new value']);

    expect(mockClient.findNotes).toHaveBeenCalledWith('nid:1234567890');
  });

  it('uses deck-scoped query for non-numeric queries', async () => {
    await run(['しかし', '--deck', 'Japanese', '--field', 'Back=new']);

    expect(mockClient.findNotes).toHaveBeenCalledWith('deck:"Japanese" しかし');
  });

  it('exits with error when --field query matches multiple notes', async () => {
    mockClient.findNotes.mockResolvedValue([101, 102]);
    mockClient.notesInfo.mockResolvedValue([NOTE_1, NOTE_2]);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    await expect(run(['type', '--field', 'Back=x'])).rejects.toThrow(
      'process.exit: 1'
    );
    expect(mockClient.updateNoteFields).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it('exits with error when --field specifies an unknown field name', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    await expect(
      run(['TypeScript', '--field', 'NonExistent=x'])
    ).rejects.toThrow('process.exit: 1');
    expect(mockClient.updateNoteFields).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it('exits when no notes found in non-interactive mode', async () => {
    mockClient.findNotes.mockResolvedValue([]);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    await expect(run(['missing', '--field', 'Back=x'])).rejects.toThrow(
      'process.exit: 1'
    );
    expect(mockClient.updateNoteFields).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});
