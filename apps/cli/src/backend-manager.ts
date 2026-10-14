import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import ora from 'ora';
import { SERVER } from '@ankiniki/shared';
import { loadConfig } from './config';

export class BackendManager {
  private serverUrl: string;
  private backendProcess: ChildProcess | null = null;
  private wasStartedByCli: boolean = false;
  private startupError: Error | null = null;

  constructor(serverUrl: string = SERVER.DEFAULT_URL) {
    this.serverUrl = serverUrl;
  }

  /**
   * Check if the backend is already running
   */
  async isRunning(): Promise<boolean> {
    try {
      const healthUrl = `${this.serverUrl}/health`.replace(
        /([^:]\/)\/+/g,
        '$1'
      );
      const response = await axios.get(healthUrl, { timeout: 1000 });
      // 200 is healthy, 503 means server is up but Anki is not connected
      return response.status === 200 || response.status === 503;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // If we got a response at all, the server is running
        return true;
      }
      return false;
    }
  }

  /**
   * Start the backend server
   */
  async start(): Promise<void> {
    if (await this.isRunning()) {
      return;
    }

    const spinner = ora('Starting backend server...').start();

    try {
      const url = new URL(this.serverUrl);
      if (
        url.protocol !== 'http:' ||
        !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      ) {
        throw new Error(
          'The configured backend is unavailable. Start remote or HTTPS backends separately.'
        );
      }
      // Find project root
      // apps/cli/src/backend-manager.ts -> apps/cli/src -> apps/cli -> apps -> root
      const rootDir = path.resolve(__dirname, '..', '..', '..');
      const backendDir = path.join(rootDir, 'packages', 'backend');

      if (!fs.existsSync(backendDir)) {
        spinner.fail('Could not find backend directory');
        throw new Error(`Backend directory not found at ${backendDir}`);
      }

      // Use the same mise-selected Node process. Avoid a shell/npm wrapper:
      // Windows cannot spawn npm.cmd directly, and watchers leave child servers.
      const isDev = fs.existsSync(path.join(backendDir, 'src', 'index.ts'));

      const args = isDev
        ? [
            '--import',
            pathToFileURL(require.resolve('tsx')).href,
            path.join(backendDir, 'src', 'index.ts'),
          ]
        : [path.join(backendDir, 'dist', 'index.js')];

      this.startupError = null;
      this.backendProcess = spawn(process.execPath, args, {
        cwd: rootDir,
        stdio: 'pipe',
        windowsHide: true,
        env: {
          ...process.env,
          PORT: url.port || '80',
          ANKI_CONNECT_URL: loadConfig().ankiConnectUrl,
        },
      });
      this.backendProcess.once('error', error => {
        this.startupError = error;
      });
      this.backendProcess.stdout?.resume();
      this.backendProcess.stderr?.resume();

      this.wasStartedByCli = true;

      // Wait for server to be ready
      const isReady = await this.waitForReady();

      if (isReady) {
        spinner.succeed('Backend server started successfully');
      } else {
        spinner.fail('Backend server failed to start in time');
        this.stop();
        throw this.startupError ?? new Error('Backend server failed to start');
      }
    } catch (error) {
      spinner.fail(
        `Failed to start backend: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Wait for the backend to respond to health checks
   */
  private async waitForReady(timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    const interval = 1000;

    while (Date.now() - startTime < timeoutMs) {
      if (this.startupError) {
        return false;
      }
      if (await this.isRunning()) {
        return true;
      }

      // Check if process is still alive
      if (this.backendProcess && this.backendProcess.exitCode !== null) {
        return false;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    return false;
  }

  /**
   * Stop the backend if it was started by the CLI
   */
  stop(): void {
    if (this.backendProcess && this.wasStartedByCli) {
      this.backendProcess.kill();
      this.backendProcess = null;
      this.wasStartedByCli = false;
    }
  }

  /**
   * Ensure backend is running and return a cleanup function
   */
  static async ensure(serverUrl: string): Promise<() => void> {
    const manager = new BackendManager(serverUrl);
    const alreadyRunning = await manager.isRunning();

    if (!alreadyRunning) {
      await manager.start();
    }

    return () => {
      if (!alreadyRunning) {
        manager.stop();
      }
    };
  }
}
