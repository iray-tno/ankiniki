import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import { createGenerateCommand } from '../commands/generate';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockAnkiClient = {
  ping: vi.fn().mockResolvedValue(true),
  getDeckNames: vi.fn().mockResolvedValue(['Default']),
  createDeck: vi.fn().mockResolvedValue(1),
  addNote: vi.fn().mockResolvedValue(12345),
};

vi.mock('../anki-client', () => ({
  AnkiClient: class {
    constructor() {
      return mockAnkiClient;
    }
  },
}));

vi.mock('../backend-manager', () => ({
  BackendManager: {
    ensure: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../config', () => ({
  loadConfig: vi.fn().mockReturnValue({
    defaultDeck: 'Default',
    serverUrl: 'http://localhost:3001',
  }),
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
  })),
}));

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn().mockResolvedValue({ selected: [0] }),
  },
}));

vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: {
          success: true,
          cards: [
            {
              front: 'What is TypeScript?',
              back: 'A typed superset of JavaScript',
              tags: ['typescript'],
              difficulty: 'beginner',
              confidence_score: 0.9,
            },
          ],
        },
      },
    }),
    isAxiosError: vi.fn().mockReturnValue(false),
  },
}));

const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// ── Helpers ────────────────────────────────────────────────────────────────

function makeStdin(text: string): EventEmitter & { setEncoding: () => void } {
  const emitter = new EventEmitter() as EventEmitter & {
    setEncoding: () => void;
  };
  emitter.setEncoding = vi.fn() as unknown as () => void;
  // Emit asynchronously so the listener is registered first
  setImmediate(() => {
    emitter.emit('data', text);
    emitter.emit('end');
  });
  return emitter;
}

async function run(args: string[] = []) {
  const cmd = createGenerateCommand();
  await cmd.parseAsync(args, { from: 'user' });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('generate --stdin', () => {
  let originalStdin: NodeJS.ReadStream;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAnkiClient.ping.mockResolvedValue(true);
    mockAnkiClient.getDeckNames.mockResolvedValue(['Default']);
    mockAnkiClient.addNote.mockResolvedValue(12345);
    consoleSpy.mockImplementation(() => {});
    consoleErrorSpy.mockImplementation(() => {});
    originalStdin = process.stdin;
  });

  afterEach(() => {
    Object.defineProperty(process, 'stdin', {
      value: originalStdin,
      writable: true,
    });
  });

  function setStdin(text: string) {
    Object.defineProperty(process, 'stdin', {
      value: makeStdin(text),
      writable: true,
    });
  }

  it('reads content from stdin and generates cards', async () => {
    setStdin('# TypeScript Guide\n\nTypeScript is a typed language.');

    await run(['--stdin', '--yes']);

    const { default: axios } = await import('axios');
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/ml/generate/cards'),
      expect.objectContaining({
        content: expect.stringContaining('TypeScript'),
      }),
      expect.any(Object)
    );
  });

  it('shows <stdin> as the source label', async () => {
    setStdin('# Hello\n\nSome content');

    await run(['--stdin', '--yes']);

    const output = consoleSpy.mock.calls.map(c => String(c[0])).join('\n');
    expect(output).toContain('<stdin>');
  });

  it('auto-detects markdown from content starting with #', async () => {
    setStdin('# Markdown heading\n\nSome content here.');

    await run(['--stdin', '--yes']);

    const { default: axios } = await import('axios');
    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ content_type: 'markdown' }),
      expect.any(Object)
    );
  });

  it('auto-detects code from content with function keyword', async () => {
    setStdin('function hello() { return "world"; }');

    await run(['--stdin', '--yes']);

    const { default: axios } = await import('axios');
    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ content_type: 'code' }),
      expect.any(Object)
    );
  });

  it('falls back to text when no code or markdown markers', async () => {
    setStdin('This is plain prose about something interesting.');

    await run(['--stdin', '--yes']);

    const { default: axios } = await import('axios');
    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ content_type: 'text' }),
      expect.any(Object)
    );
  });

  it('--content-type overrides auto-detection', async () => {
    setStdin('function foo() {}');

    await run(['--stdin', '--content-type', 'markdown', '--yes']);

    const { default: axios } = await import('axios');
    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ content_type: 'markdown' }),
      expect.any(Object)
    );
  });

  it('exits when neither file nor --stdin is provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    await expect(run([])).rejects.toThrow('process.exit: 1');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('--stdin')
    );
    exitSpy.mockRestore();
  });

  it('exits when both file and --stdin are provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    await expect(run(['somefile.md', '--stdin'])).rejects.toThrow(
      'process.exit: 1'
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Cannot use both')
    );
    exitSpy.mockRestore();
  });

  it('exits when stdin content is empty', async () => {
    setStdin('   \n  ');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    await expect(run(['--stdin'])).rejects.toThrow('process.exit: 1');

    exitSpy.mockRestore();
  });
});
