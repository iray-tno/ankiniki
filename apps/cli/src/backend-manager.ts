import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { SERVER } from '@ankiniki/shared';

export class BackendManager {
  private serverUrl: string;
  private backendProcess: ChildProcess | null = null;
  private wasStartedByCli: boolean = false;

  constructor(serverUrl: string = SERVER.DEFAULT_URL) {
    this.serverUrl = serverUrl;
  }

  /**
   * Check if the backend is already running
   */
  async isRunning(): Promise<boolean> {
    try {
      const healthUrl = `${this.serverUrl}/health`.replace(/([^:]\/)\/+/g, '$1');
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
      // Find project root
      // apps/cli/src/backend-manager.ts -> apps/cli/src -> apps/cli -> apps -> root
      const rootDir = path.resolve(__dirname, '..', '..', '..');
      const backendDir = path.join(rootDir, 'packages', 'backend');
      
      if (!fs.existsSync(backendDir)) {
        spinner.fail('Could not find backend directory');
        throw new Error(`Backend directory not found at ${backendDir}`);
      }

      // Determine the best way to start the backend
      // In development, we use tsx. In production, we'd use the built dist/index.js
      const isDev = fs.existsSync(path.join(backendDir, 'src', 'index.ts'));
      
      let command: string;
      let args: string[];

      if (isDev) {
        // Use npm run dev -w @ankiniki/backend from root
        command = 'npm';
        args = ['run', 'dev', '-w', '@ankiniki/backend'];
      } else {
        // Use node on built file
        command = 'node';
        args = [path.join(backendDir, 'dist', 'index.js')];
      }

      this.backendProcess = spawn(command, args, {
        cwd: rootDir,
        stdio: 'pipe', // Pipe output to monitor it
        env: { ...process.env, PORT: String(SERVER.DEFAULT_PORT) },
      });

      this.wasStartedByCli = true;

      // Wait for server to be ready
      const isReady = await this.waitForReady();
      
      if (isReady) {
        spinner.succeed('Backend server started successfully');
      } else {
        spinner.fail('Backend server failed to start in time');
        this.stop();
        throw new Error('Backend server startup timeout');
      }
    } catch (error: any) {
      spinner.fail(`Failed to start backend: ${error.message}`);
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
