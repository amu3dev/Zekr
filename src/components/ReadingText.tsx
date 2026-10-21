import { Text, type TextProps } from 'react-native';

import type { ReadingLine } from '../smartReading';

export type ReadingTextProps = TextProps & { onMeasure: (lines: (ReadingLine & { width: number })[]) => void };
export function ReadingText({ onMeasure, ...props }: ReadingTextProps) {
  return <Text {...props} onTextLayout={event => onMeasure(event.nativeEvent.lines)} />;
}
