import { useState } from 'react';
import { Button, Text, View } from '@hozo/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PracticeCard, type PracticeCardProps } from '@ankiniki/learning-ui';
import { firstItem, lesson } from './fixtures';

const meta = {
  title: 'Learning/PracticeCard',
  component: PracticeCard,
  argTypes: { appearance: { control: false } },
  args: {
    content: lesson,
    item: firstItem,
    activityId: firstItem.activities[0].activityId,
  },
} satisfies Meta<typeof PracticeCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Question: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(firstItem.prompt)).toBeVisible();
    await expect(canvas.queryByText(firstItem.answer)).not.toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: '答えを見る' })
    ).toBeVisible();
  },
};

export const RevealAnswer: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: '答えを見る' });
    await userEvent.click(button);
    await expect(canvas.getByText(firstItem.answer)).toBeVisible();
    await expect(canvas.getByText(firstItem.explanation!)).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: '答えを閉じる' })
    ).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.queryByText(firstItem.answer)).not.toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: '答えを見る' })
    ).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(canvas.getByText(firstItem.answer)).toBeVisible();
  },
};

export const LiteralText: Story = {
  args: {
    item: {
      ...firstItem,
      prompt:
        '  **plain text**\n<script>alert("example")</script>\n[sound:example.wav]\n日本語 / English  ',
      answer: '  const greeting = "hello";\n\n    return greeting;  ',
      explanation: undefined,
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const text = canvas.getByText('**plain text**', { exact: false });
    await expect(text.textContent).toBe(args.item.prompt);
    await expect(text.querySelector('script, strong, audio')).toBeNull();
    await expect(getComputedStyle(text).whiteSpace).toBe('pre-wrap');
    await userEvent.click(canvas.getByRole('button', { name: '答えを見る' }));
    await expect(
      canvas.getByText('const greeting', { exact: false }).textContent
    ).toBe(args.item.answer);
    await expect(
      canvas.queryByRole('heading', { name: '解説' })
    ).not.toBeInTheDocument();
  },
};

export const NarrowAndLong: Story = {
  args: {
    item: {
      ...firstItem,
      prompt: `  keep whitespace\n${'long_identifier_'.repeat(24)}`,
      answer: 'Original answer\n'.repeat(15),
    },
  },
  decorators: [
    Story => (
      <div style={{ width: 280, maxWidth: '100%', minWidth: 0 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '答えを見る' }));
    const card = canvas.getByRole('group', { name: lesson.title });
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth + 1);
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '答えを見る' }));
    await expect(
      canvasElement.querySelector('[data-theme="dark"]')
    ).not.toBeNull();
    await expect(
      getComputedStyle(canvas.getByRole('group', { name: lesson.title }))
        .backgroundColor
    ).toBe('rgb(30, 43, 36)');
  },
};

function ChangingItem({ appearance }: Pick<PracticeCardProps, 'appearance'>) {
  const [index, setIndex] = useState(0);
  const [revision, setRevision] = useState(lesson.revision);
  const [activityId, setActivityId] = useState('recall');
  const item = lesson.items[index];
  return (
    <View className='flex w-full min-w-0 max-w-2xl flex-col gap-4'>
      <View className='flex flex-row flex-wrap gap-3'>
        <Button onPress={() => setIndex(value => (value === 0 ? 1 : 0))}>
          項目を切り替える
        </Button>
        <Button onPress={() => setRevision(value => value + 1)}>
          教材を改訂する
        </Button>
        <Button
          onPress={() =>
            setActivityId(value => (value === 'recall' ? 'repeat' : 'recall'))
          }
        >
          練習を切り替える
        </Button>
      </View>
      <PracticeCard
        appearance={appearance}
        content={{ ...lesson, revision }}
        item={item}
        activityId={activityId}
      />
    </View>
  );
}

export const ChangeIdentity: Story = {
  render: args => <ChangingItem appearance={args.appearance} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const label of [
      '項目を切り替える',
      '教材を改訂する',
      '練習を切り替える',
    ]) {
      await userEvent.click(canvas.getByRole('button', { name: '答えを見る' }));
      await userEvent.click(canvas.getByRole('button', { name: label }));
      await expect(
        canvas.getByRole('button', { name: '答えを見る' })
      ).toBeVisible();
      await expect(
        canvas.queryByRole('heading', { name: '答え' })
      ).not.toBeInTheDocument();
    }
  },
};

export const IndependentCards: Story = {
  render: args => (
    <>
      <PracticeCard {...args} />
      <PracticeCard {...args} item={lesson.items[1]} />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole('button', { name: '答えを見る' });
    await userEvent.click(buttons[0]);
    await expect(canvas.getByText(firstItem.answer)).toBeVisible();
    await expect(
      canvas.queryByText(lesson.items[1].answer)
    ).not.toBeInTheDocument();
    await userEvent.click(buttons[1]);
    await expect(canvas.getByText(lesson.items[1].answer)).toBeVisible();
  },
};

export const SourceAction: Story = {
  args: {
    item: { ...firstItem, sourceUrl: 'https://example.org/lesson' },
    onOpenSource: fn(),
  },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: '出典を開く' })
    );
    await expect(args.onOpenSource).toHaveBeenCalledWith(
      'https://example.org/lesson'
    );
  },
};

const audioStates = {
  loading: '音声を読み込んでいます',
  ready: '問題音声を再生できます',
  playing: '問題音声を再生中',
  waiting: '声に出して応答してください（3秒）',
  stopped: '音声練習を停止しました',
  error: '音声を再生できません。再試行できます。',
};

function audioStory(state: keyof typeof audioStates): Story {
  return {
    args: {
      item: lesson.items[3],
      activityId: 'spoken-response',
      audio: (
        <View className='flex flex-col gap-3 rounded-xl border p-4'>
          <Text className='text-sm'>{audioStates[state]}</Text>
          <Text className='text-xs'>
            音声状態の表示例です。このプレビューでは再生しません。
          </Text>
        </View>
      ),
    },
    play: async ({ canvasElement }) => {
      await expect(
        within(canvasElement).getByText(audioStates[state])
      ).toBeVisible();
    },
  };
}

export const AudioLoading = audioStory('loading');
export const AudioReady = audioStory('ready');
export const AudioPlaying = audioStory('playing');
export const AudioWaiting = audioStory('waiting');
export const AudioStopped = audioStory('stopped');
export const AudioError = audioStory('error');
