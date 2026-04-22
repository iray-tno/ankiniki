import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { createStatusCommand } from '../commands/status';

// mockPing starts with 'mock' so vi.mock hoisting can access it
const mockPing = vi.fn().mockResolvedValue(true);

vi.mock('axios');
vi.mock('../anki-client', () => ({
  AnkiClient: class {
    ping = mockPing;
  },
}));
vi.mock('../config', () => ({
  loadConfig: vi.fn().mockReturnValue({
    ankiConnectUrl: 'http://localhost:8765',
    serverUrl: 'http://localhost:3001',
    defaultDeck: 'Default',
    defaultModel: 'Basic',
  }),
}));

const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('status command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPing.mockResolvedValue(true);
    consoleSpy.mockImplementation(() => {});
  });

  async function runStatus() {
    const cmd = createStatusCommand();
    await cmd.parseAsync([], { from: 'user' });
  }

  it('reports all-ok when AnkiConnect and backend are up', async () => {
    vi.mocked(axios.get)
      .mockResolvedValueOnce({
        status: 200,
        data: {
          success: true,
          data: {
            status: 'ok',
            version: '1.2.3',
            ankiConnect: { connected: true, url: 'http://localhost:8765' },
          },
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          success: true,
          data: {
            available: true,
            base_url: 'http://localhost:8000',
            models: { gpt: {} },
          },
        },
      });

    await runStatus();

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('All core services are reachable');
  });

  it('reports anki-only when backend is down', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('ECONNREFUSED'));
    vi.mocked(axios.isAxiosError).mockReturnValue(false);

    await runStatus();

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('AnkiConnect is reachable');
    expect(output).toContain('Start the backend');
  });

  it('reports fully-down when AnkiConnect ping fails', async () => {
    mockPing.mockResolvedValueOnce(false);

    vi.mocked(axios.get).mockRejectedValue(new Error('ECONNREFUSED'));
    vi.mocked(axios.isAxiosError).mockReturnValue(false);

    await runStatus();

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('AnkiConnect is not reachable');
  });

  it('shows backend version when available', async () => {
    vi.mocked(axios.get)
      .mockResolvedValueOnce({
        status: 200,
        data: {
          success: true,
          data: {
            status: 'ok',
            version: '2.0.0',
            ankiConnect: { connected: true, url: 'http://localhost:8765' },
          },
        },
      })
      .mockRejectedValueOnce(new Error('ML down'));
    vi.mocked(axios.isAxiosError).mockReturnValue(false);

    await runStatus();

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('2.0.0');
  });

  it('shows backend AnkiConnect warning when backend is up but cannot reach Anki', async () => {
    vi.mocked(axios.get)
      .mockResolvedValueOnce({
        status: 200,
        data: {
          success: true,
          data: {
            status: 'degraded',
            version: '1.0.0',
            ankiConnect: { connected: false, url: 'http://localhost:8765' },
          },
        },
      })
      .mockRejectedValueOnce(new Error('ML down'));
    vi.mocked(axios.isAxiosError).mockReturnValue(false);

    await runStatus();

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain("Backend can't reach AnkiConnect");
  });

  it('outputs configured URLs and deck/model', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('down'));
    vi.mocked(axios.isAxiosError).mockReturnValue(false);

    await runStatus();

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('http://localhost:8765');
    expect(output).toContain('http://localhost:3001');
    expect(output).toContain('Default');
    expect(output).toContain('Basic');
  });
});
