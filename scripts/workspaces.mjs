import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const npmCli = process.env.npm_execpath;

if (!npmCli) {
  throw new Error('Run this script through mise exec -- npm run <command>.');
}

function npm(args) {
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function build() {
  // Dependencies must exist before consumers compile. The extension calls its
  // build command "compile"; the desktop build includes the Vite frontend.
  for (const workspace of ['packages/shared', 'packages/backend', 'apps/cli']) {
    npm(['run', 'build', '-w', workspace]);
  }
  npm(['run', 'compile', '-w', 'apps/vscode-extension']);
  npm(['run', 'build', '-w', 'apps/desktop']);
}

function typeCheck() {
  npm(['run', 'build', '-w', 'packages/shared']);
  for (const workspace of [
    'packages/backend',
    'apps/cli',
    'apps/vscode-extension',
    'apps/desktop',
  ]) {
    npm(['exec', '--', 'tsc', '-p', workspace, '--noEmit']);
  }
}

switch (process.argv[2]) {
  case 'build':
    build();
    break;
  case 'type-check':
    typeCheck();
    break;
  case 'test':
    npm(['run', 'build', '-w', 'packages/shared']);
    for (const workspace of [
      'packages/shared',
      'packages/backend',
      'apps/cli',
    ]) {
      npm(['test', '-w', workspace]);
    }
    break;
  case 'setup':
    npm(['ci']);
    build();
    typeCheck();
    break;
  case 'check':
    build();
    typeCheck();
    npm(['run', 'lint']);
    npm(['run', 'format:check']);
    break;
  default:
    throw new Error('Expected build, type-check, test, setup or check.');
}
