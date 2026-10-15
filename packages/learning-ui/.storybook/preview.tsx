import type { Preview } from '@storybook/react-vite';
import './preview.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: '表示テーマ',
      toolbar: {
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
  },
  decorators: [
    (Story, context) => (
      <main className='practice-canvas' data-theme={context.globals.theme}>
        <Story args={{ ...context.args, appearance: context.globals.theme }} />
      </main>
    ),
  ],
};
export default preview;
