import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

export default defineConfig({
  plugins: [
    storybookTest({
      configDir: fileURLToPath(new URL('./.storybook', import.meta.url)),
    }),
  ],
  test: {
    name: 'learning-ui',
    browser: {
      enabled: true,
      provider: playwright({ launchOptions: { channel: 'chromium' } }),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
