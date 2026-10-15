import { useState, type ReactNode } from 'react';
import { Button, Heading, Text, View } from '@hozo/core';
import type { ContentPackage } from '@ankiniki/shared';
import { CardBody } from './CardBody';

export interface PracticeCardProps {
  appearance?: 'light' | 'dark';
  content: Pick<ContentPackage, 'packageId' | 'revision' | 'title' | 'license'>;
  item: ContentPackage['items'][number];
  activityId: string;
  /** A host-owned audio/status presentation. This card does not play media. */
  audio?: ReactNode;
  /** The host owns navigation; no source URL is fetched by this component. */
  onOpenSource?: (url: string) => void;
}

export function PracticeCard(props: PracticeCardProps) {
  const { content, item, activityId } = props;
  const key = JSON.stringify([
    content.packageId,
    content.revision,
    item.itemId,
    activityId,
  ]);
  return <PracticeCardContent key={key} {...props} />;
}

function PracticeCardContent({
  content,
  item,
  appearance = 'light',
  audio,
  onOpenSource,
}: PracticeCardProps) {
  const [revealed, setRevealed] = useState(false);
  const dark = appearance === 'dark';
  return (
    <View
      role='group'
      accessibilityLabel={content.title}
      className={
        dark
          ? 'flex w-full min-w-0 max-w-2xl flex-col gap-6 rounded-2xl border border-line-night bg-surface-night p-6 text-ink-night shadow-sm sm:p-8'
          : 'flex w-full min-w-0 max-w-2xl flex-col gap-6 rounded-2xl border border-line bg-surface p-6 text-ink shadow-sm sm:p-8'
      }
    >
      <View className='flex flex-col gap-2'>
        <Text
          className={
            dark
              ? 'text-xs font-semibold uppercase tracking-widest text-muted-night'
              : 'text-xs font-semibold uppercase tracking-widest text-muted'
          }
        >
          Practice
        </Text>
        <Heading
          level={2}
          className={
            dark
              ? 'text-base font-medium text-muted-night'
              : 'text-base font-medium text-muted'
          }
        >
          {content.title}
        </Heading>
      </View>
      <View className='flex flex-col gap-3'>
        <Heading
          level={3}
          className={
            dark
              ? 'text-sm font-semibold text-muted-night'
              : 'text-sm font-semibold text-muted'
          }
        >
          問題
        </Heading>
        <CardBody text={item.prompt} />
        {audio}
      </View>
      <Button
        className={
          dark
            ? 'min-h-12 w-full rounded-xl bg-accent-night px-5 py-3 text-base font-semibold text-on-accent-night hover:bg-accent-hover-night focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-night'
            : 'min-h-12 w-full rounded-xl bg-accent px-5 py-3 text-base font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent'
        }
        onPress={() => setRevealed(value => !value)}
      >
        {revealed ? '答えを閉じる' : '答えを見る'}
      </Button>
      {revealed && (
        <View
          className={
            dark
              ? 'flex flex-col gap-5 border-t border-line-night pt-6'
              : 'flex flex-col gap-5 border-t border-line pt-6'
          }
        >
          <View className='flex flex-col gap-3'>
            <Heading
              level={3}
              className={
                dark
                  ? 'text-sm font-semibold text-accent-night'
                  : 'text-sm font-semibold text-accent'
              }
            >
              答え
            </Heading>
            <CardBody text={item.answer} />
          </View>
          {item.explanation && (
            <View
              className={
                dark
                  ? 'flex flex-col gap-3 rounded-xl bg-inset-night p-4'
                  : 'flex flex-col gap-3 rounded-xl bg-inset p-4'
              }
            >
              <Heading
                level={3}
                className={
                  dark
                    ? 'text-sm font-semibold text-muted-night'
                    : 'text-sm font-semibold text-muted'
                }
              >
                解説
              </Heading>
              <CardBody text={item.explanation} />
            </View>
          )}
        </View>
      )}
      <View
        className={
          dark
            ? 'flex flex-col gap-2 border-t border-line-night pt-4'
            : 'flex flex-col gap-2 border-t border-line pt-4'
        }
      >
        <Text
          className={dark ? 'text-xs text-muted-night' : 'text-xs text-muted'}
        >
          {content.packageId} · revision {content.revision}
        </Text>
        {content.license && (
          <Text
            className={dark ? 'text-xs text-muted-night' : 'text-xs text-muted'}
          >
            配布条件：{content.license}
          </Text>
        )}
        {item.sourceUrl &&
          (onOpenSource ? (
            <Button
              className={
                dark
                  ? 'min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-accent-night underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-night'
                  : 'min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
              }
              onPress={() => onOpenSource(item.sourceUrl!)}
            >
              出典を開く
            </Button>
          ) : (
            <Text
              className={
                dark
                  ? 'wrap-anywhere text-xs text-muted-night'
                  : 'wrap-anywhere text-xs text-muted'
              }
            >
              {item.sourceUrl}
            </Text>
          ))}
      </View>
    </View>
  );
}
