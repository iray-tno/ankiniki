import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  core: { disableTelemetry: true },
  stories: ['../stories/**/*.stories.tsx'],
  addons: [
    { name: '@hozo/storybook', options: { css: 'src/theme.css' } },
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
  ],
};
export default config;
