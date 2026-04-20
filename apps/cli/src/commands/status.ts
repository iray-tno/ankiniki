/**
 * Status command - Health dashboard for the entire Ankiniki ecosystem
 */

import { Command } from 'commander';
import chalk from 'chalk';
import axios from 'axios';
import { ANKI_CONNECT, SERVER } from '@ankiniki/shared';
import { AnkiClient } from '../anki-client';
import { loadConfig } from '../config';

// ── Symbols ───────────────────────────────────────────────────────────────────

const OK = chalk.green('✓');
const WARN = chalk.yellow('⚠');
const FAIL = chalk.red('✗');

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServiceStatus {
  name: string;
  url: string;
  ok: boolean;
  detail?: string;
  hint?: string;
}

// ── Checks ────────────────────────────────────────────────────────────────────

async function checkAnkiConnect(url: string): Promise<ServiceStatus> {
  const client = new AnkiClient();
  try {
    const ok = await client.ping();
    return {
      name: 'AnkiConnect',
      url,
      ok,
      detail: ok ? undefined : 'ping returned false',
      hint: ok
        ? undefined
        : 'Make sure Anki is running and the AnkiConnect addon is installed.',
    };
  } catch (error) {
    return {
      name: 'AnkiConnect',
      url,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
      hint: 'Make sure Anki is running and the AnkiConnect addon is installed.',
    };
  }
}

async function checkBackend(
  serverUrl: string
): Promise<ServiceStatus & { version?: string; ankiConnected?: boolean }> {
  const healthUrl = `${serverUrl}/health`.replace(/([^:]\/)\/+/g, '$1');
  try {
    const response = await axios.get<{
      success: boolean;
      data: {
        status: string;
        version: string;
        ankiConnect: { connected: boolean; url: string };
      };
    }>(healthUrl, { timeout: 3000 });

    const data = response.data.data;
    const running = response.status === 200 || response.status === 503;
    return {
      name: 'Backend server',
      url: serverUrl,
      ok: running,
      version: data?.version,
      ankiConnected: data?.ankiConnect?.connected,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Got a response — server is up but returned an error code
      const data = error.response.data?.data;
      return {
        name: 'Backend server',
        url: serverUrl,
        ok: true,
        version: data?.version,
        ankiConnected: data?.ankiConnect?.connected,
      };
    }
    return {
      name: 'Backend server',
      url: serverUrl,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
      hint: `Start the backend with: npm run dev -w @ankiniki/backend`,
    };
  }
}

async function checkMlService(
  mlUrl: string
): Promise<ServiceStatus & { models?: string[] }> {
  // ML health is exposed through the backend proxy
  const healthUrl = `${mlUrl}/api/ml/health`.replace(/([^:]\/)\/+/g, '$1');
  try {
    const response = await axios.get<{
      success: boolean;
      data: { available: boolean; base_url: string; models: unknown };
    }>(healthUrl, { timeout: 5000 });

    const data = response.data.data;
    const available = data?.available === true;
    const models =
      data?.models && typeof data.models === 'object'
        ? Object.keys(data.models as Record<string, unknown>)
        : [];

    return {
      name: 'ML service',
      url: data?.base_url ?? mlUrl,
      ok: available,
      models,
      detail: available ? undefined : 'Service reported as unavailable',
      hint: available
        ? undefined
        : 'ML service is optional — template-based fallback is active. To enable AI: cd services/ml-service && uvicorn main:app',
    };
  } catch (error) {
    return {
      name: 'ML service',
      url: mlUrl,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
      hint: 'ML service is optional — template-based card generation will be used as fallback.',
    };
  }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderService(s: ServiceStatus): void {
  const icon = s.ok ? OK : FAIL;
  const nameStr = s.ok ? chalk.white(s.name) : chalk.red(s.name);
  const urlStr = chalk.gray(s.url);
  console.log(`  ${icon}  ${nameStr}  ${urlStr}`);
  if (s.detail) {
    console.log(`     ${chalk.red(s.detail)}`);
  }
  if (s.hint) {
    console.log(`     ${chalk.yellow('→')} ${chalk.gray(s.hint)}`);
  }
}

// ── Command ───────────────────────────────────────────────────────────────────

export function createStatusCommand(): Command {
  const command = new Command('status');

  command
    .description('Show health status of all Ankiniki services')
    .action(async () => {
      const config = loadConfig();

      const ankiUrl = config.ankiConnectUrl ?? ANKI_CONNECT.DEFAULT_URL;
      const serverUrl = config.serverUrl ?? SERVER.DEFAULT_URL;
      // ML health is proxied through the backend — we query via the backend URL
      const mlProxyUrl = serverUrl;

      console.log(chalk.bold('\n📊 Ankiniki status\n'));

      // Run all checks in parallel
      const [anki, backend, ml] = await Promise.all([
        checkAnkiConnect(ankiUrl),
        checkBackend(serverUrl),
        checkMlService(mlProxyUrl),
      ]);

      // ── Services ──────────────────────────────────────────────────────
      console.log(chalk.bold('Services'));
      renderService(anki);

      // Backend has an extra note about AnkiConnect visibility from the server side
      renderService(backend);
      if (backend.ok && backend.ankiConnected === false) {
        console.log(
          `     ${WARN}  ${chalk.gray("Backend can't reach AnkiConnect — start Anki before importing.")}`
        );
      }
      if (backend.ok && backend.version) {
        console.log(`     ${chalk.gray(`version ${backend.version}`)}`);
      }

      // ML service — only warn, never hard-fail
      const mlIcon = ml.ok ? OK : WARN;
      const mlName = ml.ok
        ? chalk.white(ml.name)
        : chalk.yellow(`${ml.name} (optional)`);
      console.log(`  ${mlIcon}  ${mlName}  ${chalk.gray(ml.url)}`);
      if (!ml.ok && ml.hint) {
        console.log(`     ${chalk.yellow('→')} ${chalk.gray(ml.hint)}`);
      }

      // ── Configuration ─────────────────────────────────────────────────
      console.log(chalk.bold('\nConfiguration'));
      console.log(`  ${chalk.gray('AnkiConnect URL:')} ${chalk.cyan(ankiUrl)}`);
      console.log(
        `  ${chalk.gray('Backend URL:    ')} ${chalk.cyan(serverUrl)}`
      );
      console.log(
        `  ${chalk.gray('Default deck:   ')} ${chalk.cyan(config.defaultDeck)}`
      );
      console.log(
        `  ${chalk.gray('Default model:  ')} ${chalk.cyan(config.defaultModel)}`
      );

      // ── Overall verdict ───────────────────────────────────────────────
      const coreOk = anki.ok;
      const allOk = anki.ok && backend.ok;

      console.log();
      if (allOk) {
        console.log(
          chalk.green('✓ All core services are reachable — ready to use.')
        );
      } else if (coreOk) {
        console.log(
          chalk.yellow(
            '⚠ AnkiConnect is reachable. Start the backend for import/generate commands.'
          )
        );
      } else {
        console.log(
          chalk.red('✗ AnkiConnect is not reachable — start Anki to begin.')
        );
      }
      console.log();
    });

  return command;
}
