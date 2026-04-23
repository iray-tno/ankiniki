import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createExportCommand } from '../commands/export';

// ── Fixtures ───────────────────────────────────────────────────────────────

const NOTES = [
  {
    noteId: 101,
    modelName: 'Basic',
    tags: ['ts', 'beginner'],
    fields: {
      Front: { value: 'What is TypeScript?', order: 0 },
      Back: { value: 'A typed superset of JavaScript', order: 1 },
    },
    cards: [1001],
  },
  {
    noteId: 102,
    modelName: 'Basic',
    tags: [],
    fields: {
      Front: { value: 'What is a union type?', order: 0 },
      Back: { value: 'A | B', order: 1 },
    },
    cards: [1002],
  },
];

// ── fs mock ────────────────────────────────────────────────────────────────

const mockExistsSync = vi.fn().mockReturnValue(true);
const mockWriteFileSync = vi.fn();
const mockStatSync = vi.fn().mockReturnValue({ size: 2048 });

vi.mock('fs', () => {
  const fsMock = {
    existsSync: (...args: unknown[]) => mockExistsSync(...args),
    writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
    statSync: (...args: unknown[]) => mockStatSync(...args),
  };
  return { default: fsMock, ...fsMock };
});

// ── path mock (keep dirname real) ──────────────────────────────────────────
// path is not mocked — we let it run naturally

// ── Client mock ────────────────────────────────────────────────────────────

const mockClient = {
  ping: vi.fn().mockResolvedValue(true),
  getDeckNames: vi.fn().mockResolvedValue(['TypeScript', 'Japanese']),
  exportPackage: vi.fn().mockResolvedValue(true),
  findNotes: vi.fn().mockResolvedValue([101, 102]),
  notesInfo: vi.fn().mockResolvedValue(NOTES),
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

// ── Helpers ────────────────────────────────────────────────────────────────

async function run(args: string[]) {
  const cmd = createExportCommand();
  await cmd.parseAsync(args, { from: 'user' });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('export command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.ping.mockResolvedValue(true);
    mockClient.getDeckNames.mockResolvedValue(['TypeScript', 'Japanese']);
    mockClient.exportPackage.mockResolvedValue(true);
    mockClient.findNotes.mockResolvedValue([101, 102]);
    mockClient.notesInfo.mockResolvedValue(NOTES);
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ size: 2048 });
    consoleSpy.mockImplementation(() => {});
  });

  // ── apkg ──────────────────────────────────────────────────────────────────

  describe('--format apkg (default)', () => {
    it('calls exportPackage with the deck and resolved path', async () => {
      await run(['TypeScript', '/tmp/out.apkg']);

      expect(mockClient.exportPackage).toHaveBeenCalledWith(
        'TypeScript',
        '/tmp/out.apkg',
        false
      );
    });

    it('passes includeSched when --include-sched is set', async () => {
      await run(['TypeScript', '/tmp/out.apkg', '--include-sched']);

      expect(mockClient.exportPackage).toHaveBeenCalledWith(
        'TypeScript',
        '/tmp/out.apkg',
        true
      );
    });

    it('does not call findNotes for apkg format', async () => {
      await run(['TypeScript', '/tmp/out.apkg']);

      expect(mockClient.findNotes).not.toHaveBeenCalled();
    });

    it('exits when deck is not found', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit: 1');
      });

      await expect(run(['NonExistent', '/tmp/out.apkg'])).rejects.toThrow(
        'process.exit: 1'
      );

      expect(mockClient.exportPackage).not.toHaveBeenCalled();
      exitSpy.mockRestore();
    });
  });

  // ── csv ───────────────────────────────────────────────────────────────────

  describe('--format csv', () => {
    it('queries deck notes and writes a CSV file', async () => {
      await run(['TypeScript', '/tmp/out.csv', '--format', 'csv']);

      expect(mockClient.findNotes).toHaveBeenCalledWith('deck:"TypeScript"');
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/tmp/out.csv',
        expect.stringContaining('noteId'),
        'utf8'
      );
    });

    it('CSV contains field values', async () => {
      await run(['TypeScript', '/tmp/out.csv', '--format', 'csv']);

      const csv: string = mockWriteFileSync.mock.calls[0][1] as string;
      expect(csv).toContain('What is TypeScript?');
      expect(csv).toContain('A typed superset of JavaScript');
    });

    it('CSV has a header row with field names', async () => {
      await run(['TypeScript', '/tmp/out.csv', '--format', 'csv']);

      const csv: string = mockWriteFileSync.mock.calls[0][1] as string;
      const firstLine = csv.split('\n')[0];
      expect(firstLine).toContain('noteId');
      expect(firstLine).toContain('Front');
      expect(firstLine).toContain('Back');
      expect(firstLine).toContain('tags');
    });

    it('scopes query with --query flag', async () => {
      await run([
        'TypeScript',
        '/tmp/out.csv',
        '--format',
        'csv',
        '--query',
        'tag:beginner',
      ]);

      expect(mockClient.findNotes).toHaveBeenCalledWith(
        'deck:"TypeScript" tag:beginner'
      );
    });

    it('does not call exportPackage for csv format', async () => {
      await run(['TypeScript', '/tmp/out.csv', '--format', 'csv']);

      expect(mockClient.exportPackage).not.toHaveBeenCalled();
    });
  });

  // ── json ──────────────────────────────────────────────────────────────────

  describe('--format json', () => {
    it('queries deck notes and writes a JSON file', async () => {
      await run(['TypeScript', '/tmp/out.json', '--format', 'json']);

      expect(mockClient.findNotes).toHaveBeenCalledWith('deck:"TypeScript"');
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/tmp/out.json',
        expect.stringContaining('"noteId"'),
        'utf8'
      );
    });

    it('JSON is valid and contains note data', async () => {
      await run(['TypeScript', '/tmp/out.json', '--format', 'json']);

      const raw: string = mockWriteFileSync.mock.calls[0][1] as string;
      const parsed = JSON.parse(raw);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toMatchObject({
        noteId: 101,
        modelName: 'Basic',
        tags: ['ts', 'beginner'],
        fields: {
          Front: 'What is TypeScript?',
          Back: 'A typed superset of JavaScript',
        },
      });
    });

    it('does not call exportPackage for json format', async () => {
      await run(['TypeScript', '/tmp/out.json', '--format', 'json']);

      expect(mockClient.exportPackage).not.toHaveBeenCalled();
    });
  });

  // ── shared error paths ────────────────────────────────────────────────────

  it('exits on unknown format', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    await expect(
      run(['TypeScript', '/tmp/out.xyz', '--format', 'xlsx'])
    ).rejects.toThrow('process.exit: 1');

    exitSpy.mockRestore();
  });

  it('exits when AnkiConnect is unreachable', async () => {
    mockClient.ping.mockResolvedValue(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit: 1');
    });

    await expect(run(['TypeScript', '/tmp/out.apkg'])).rejects.toThrow(
      'process.exit: 1'
    );

    expect(mockClient.getDeckNames).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});
