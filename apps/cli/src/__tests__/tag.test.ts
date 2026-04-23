import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTagCommand } from '../commands/tag';

// ── Client mock ────────────────────────────────────────────────────────────

const mockClient = {
  ping: vi.fn().mockResolvedValue(true),
  findNotes: vi.fn().mockResolvedValue([101, 102, 103]),
  addTags: vi.fn().mockResolvedValue(undefined),
  removeTags: vi.fn().mockResolvedValue(undefined),
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

// inquirer is dynamically imported inside the action; mock via the module registry
const mockInquirerPrompt = vi.fn().mockResolvedValue({ ok: true });
vi.mock('inquirer', () => ({
  default: {
    prompt: (...args: unknown[]) => mockInquirerPrompt(...args),
  },
}));

const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// ── Helpers ────────────────────────────────────────────────────────────────

async function run(args: string[]) {
  const cmd = createTagCommand();
  await cmd.parseAsync(args, { from: 'user' });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('tag command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.ping.mockResolvedValue(true);
    mockClient.findNotes.mockResolvedValue([101, 102, 103]);
    mockClient.addTags.mockResolvedValue(undefined);
    mockClient.removeTags.mockResolvedValue(undefined);
    mockInquirerPrompt.mockResolvedValue({ ok: true });
    consoleSpy.mockImplementation(() => {});
    consoleErrorSpy.mockImplementation(() => {});
  });

  it('adds tags to all matched notes', async () => {
    await run(['deck:Japanese', '--add', 'n+1,review', '--yes']);

    expect(mockClient.addTags).toHaveBeenCalledWith(
      [101, 102, 103],
      'n+1 review'
    );
    expect(mockClient.removeTags).not.toHaveBeenCalled();
  });

  it('removes tags from all matched notes', async () => {
    await run(['deck:Japanese', '--remove', 'old-tag', '--yes']);

    expect(mockClient.removeTags).toHaveBeenCalledWith(
      [101, 102, 103],
      'old-tag'
    );
    expect(mockClient.addTags).not.toHaveBeenCalled();
  });

  it('adds and removes in the same call', async () => {
    await run([
      'tag:js',
      '--add',
      'typescript',
      '--remove',
      'javascript',
      '--yes',
    ]);

    expect(mockClient.addTags).toHaveBeenCalledWith(
      [101, 102, 103],
      'typescript'
    );
    expect(mockClient.removeTags).toHaveBeenCalledWith(
      [101, 102, 103],
      'javascript'
    );
  });

  it('scopes search to deck when --deck is set', async () => {
    await run(['type:note', '--add', 'x', '--deck', 'Spanish', '--yes']);

    expect(mockClient.findNotes).toHaveBeenCalledWith(
      'deck:"Spanish" type:note'
    );
  });

  it('shows a confirmation prompt without --yes', async () => {
    mockInquirerPrompt.mockResolvedValueOnce({ ok: true });

    await run(['deck:Japanese', '--add', 'n+1']);

    expect(mockInquirerPrompt).toHaveBeenCalled();
    expect(mockClient.addTags).toHaveBeenCalled();
  });

  it('aborts when user declines confirmation', async () => {
    mockInquirerPrompt.mockResolvedValueOnce({ ok: false });

    await run(['deck:Japanese', '--add', 'n+1']);

    expect(mockClient.addTags).not.toHaveBeenCalled();
    const output = consoleSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(output).toContain('Aborted');
  });

  it('exits when neither --add nor --remove is provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    await expect(run(['deck:Japanese'])).rejects.toThrow('process.exit: 1');

    expect(mockClient.findNotes).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it('exits when no notes are found', async () => {
    mockClient.findNotes.mockResolvedValue([]);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    await expect(run(['deck:Empty', '--add', 'x', '--yes'])).rejects.toThrow(
      'process.exit: 1'
    );

    expect(mockClient.addTags).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it('exits when AnkiConnect is unreachable', async () => {
    mockClient.ping.mockResolvedValue(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    await expect(run(['deck:Japanese', '--add', 'x'])).rejects.toThrow(
      'process.exit: 1'
    );

    expect(mockClient.findNotes).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});
