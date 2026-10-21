import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { usePersistentState } from '../hooks/usePersistentState';
import { readingPersistence } from '../storage';
import { ReadingPreferences } from './ReadingPreferences';
import { SmartReadingSurface } from './SmartReadingSurface';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getDhikrExcerpt, getReadingEndPadding, getReadingViewport } from '../reading';
import type { Routine } from '../routines';
import { useTheme } from '../theme';
import { BookIcon, UndoIcon } from './Icons';
import { ModalShell } from './Modals';
import { SourceBadge } from './SourceBadge';

export type ReadingCounter = {
  value: string; progress?: string; disabled?: boolean; canUndo: boolean;
  onTap: () => void; onUndo: () => void;
};

/** A labelled clause preview opens the full wording without interrupting counting. */
export function DhikrReader({ phrase, title, source, details, counter, testID = 'routine-phrase' }: {
  phrase: string; title: string; source?: Routine['source']; details?: string; counter?: ReadingCounter; testID?: string;
}) {
  const { theme } = useTheme();
  const { value: preferences } = usePersistentState(readingPersistence);
  const { width, height, fontScale } = useWindowDimensions();
  const layoutKey = `${phrase}:${width}:${height}:${fontScale}`;
  const [reading, setReading] = useState(false);
  const [lineLayout, setLineLayout] = useState({ phrase: '', pitch: 0 });
  const [readingLayout, setReadingLayout] = useState({ key: '', height: 0 });
  const [contentHeight, setContentHeight] = useState(0);
  const linePitch = lineLayout.phrase === phrase ? lineLayout.pitch : 0;
  const readingHeight = readingLayout.key === layoutKey ? readingLayout.height : 0;
  const viewport = getReadingViewport(readingHeight, linePitch);
  const endPadding = getReadingEndPadding(contentHeight, viewport, linePitch);
  const reduceMotion = useReducedMotion() !== false;
  const long = phrase.length > 80;
  const excerpt = getDhikrExcerpt(phrase);
  const styles = useMemo(() => StyleSheet.create({
    short: { justifyContent: 'center' },
    inlineRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    excerpt: { flex: 1, minWidth: 0, gap: 2 },
    phrase: { color: theme.text, fontSize: long ? 20 : 25, fontWeight: '700',
      lineHeight: long ? 36 : 42, paddingVertical: 4, includeFontPadding: true, textAlign: 'center', writingDirection: 'rtl' },
    readButton: { minHeight: 44, width: 66, gap: 4, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: theme.warmSurface },
    readLabel: { color: theme.textMuted, fontSize: 11.5, textAlign: 'center', writingDirection: 'rtl' },
    excerptLabel: { color: theme.textMuted, fontSize: 11.5, lineHeight: 18, textAlign: 'center', writingDirection: 'rtl' },
    readingArea: { flexShrink: 1, minHeight: 0, paddingVertical: 12 },
    content: { gap: 18, paddingHorizontal: 4 },
    full: { color: theme.text, fontSize: 23, lineHeight: 42, includeFontPadding: true, textAlign: 'center', writingDirection: 'rtl' },
    detail: { color: theme.textMuted, fontSize: 14, lineHeight: 24, textAlign: 'right', writingDirection: 'rtl' },
    counterDock: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10,
      borderTopWidth: 1, borderTopColor: theme.surfaceBorder },
    count: { flex: 1, minHeight: 48, padding: 8, backgroundColor: theme.warmSurface, borderRadius: 14,
      borderWidth: 1, borderColor: theme.warmBorder, justifyContent: 'center' },
    countText: { color: theme.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
    undo: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  }), [long, theme]);
  return <View>
    {long ? <View style={styles.inlineRow}>
      <View style={styles.excerpt}>
        <Text testID={`${testID}-excerpt-label`} style={styles.excerptLabel}>{excerpt.isExcerpt ? 'مقتطف من الذكر' : 'نص الذكر'}</Text>
        <Text testID={testID} style={styles.phrase}>{excerpt.text}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="قراءة نص الذكر كاملًا"
        accessibilityHint="يفتح النص كاملًا مع استمرار إمكانية العدّ والتراجع" onPress={() => setReading(true)} style={styles.readButton}>
        <BookIcon size={18} color={theme.iconAccent} />
        <Text style={styles.readLabel}>النص كاملًا</Text>
      </Pressable>
    </View> : <View style={styles.short}><Text testID={testID} style={styles.phrase}>{phrase}</Text></View>}
    <ModalShell visible={reading} title="نص الذكر" subtitle={counter?.progress ?? title} closeLabel="إغلاق نص الذكر"
      onClose={() => setReading(false)} animationType={reduceMotion ? 'none' : 'fade'} textScaleLimit={2}>
      {reading && preferences.mode === 'full' && <ReadingPreferences compact phrase={phrase} />}
      {reading && preferences.mode !== 'full' ? <ScrollView key={layoutKey} style={styles.readingArea} removeClippedSubviews={false}>
        <ReadingPreferences compact phrase={phrase} />
        <SmartReadingSurface key={`${layoutKey}:${preferences.mode}`} phrase={phrase} preferences={preferences} />
        {source && <SourceBadge source={source} />}
      </ScrollView> : <View style={styles.readingArea}><ScrollView key={layoutKey} testID="expanded-reading-scroll" removeClippedSubviews={false}
        onLayout={({ nativeEvent }) => setReadingLayout({ key: layoutKey, height: nativeEvent.layout.height })}
        onContentSizeChange={(_, height) => setContentHeight(height - endPadding)}
        snapToInterval={linePitch || undefined} decelerationRate="fast"
        style={{ flexShrink: 1, minHeight: 0, maxHeight: viewport || undefined }}
        contentContainerStyle={[styles.content, { paddingBottom: endPadding }]}>
        <Text testID="expanded-dhikr-phrase" selectable style={styles.full}
          onTextLayout={({ nativeEvent }) => {
            const lines = nativeEvent.lines;
            const pitch = lines.length > 1 ? lines[1].y - lines[0].y : 0;
            setLineLayout(previous => previous.phrase === phrase && previous.pitch === pitch ? previous : { phrase, pitch });
          }}>{phrase}</Text>
        {details && <Text style={styles.detail}>{details}</Text>}
        {source && <SourceBadge source={source} />}
      </ScrollView></View>}
      {counter && <View style={styles.counterDock}>
        <Pressable accessibilityRole="button" accessibilityLabel="تراجع في وضع القراءة" accessibilityState={{ disabled: !counter.canUndo }}
          disabled={!counter.canUndo} onPress={counter.onUndo} style={styles.undo}>
          <UndoIcon size={20} color={theme.iconAccent} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="تسجيل تسبيحة في وضع القراءة"
          accessibilityValue={{ text: counter.value }} accessibilityState={{ disabled: counter.disabled }}
          disabled={counter.disabled} onPress={counter.onTap} style={styles.count}>
          <Text style={styles.readLabel}>تسجيل تسبيحة</Text>
          <Text testID="reading-counter" style={styles.countText}>{counter.value}</Text>
        </Pressable>
      </View>}
    </ModalShell>
  </View>;
}
