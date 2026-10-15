import { Text } from '@hozo/core';

export interface CardBodyProps {
  text: string;
}

/** Content v1 is literal text, including whitespace and Markdown/HTML syntax. */
export function CardBody({ text }: CardBodyProps) {
  return (
    <Text className='block whitespace-pre-wrap wrap-anywhere text-lg leading-relaxed'>
      {text}
    </Text>
  );
}
