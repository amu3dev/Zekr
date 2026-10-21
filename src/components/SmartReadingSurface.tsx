import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { toArabicDigits } from '../arabic';
import { useReadingSafety } from '../hooks/useReadingSafety';
import { measuredReadingPages, READING_SPEEDS, segmentDhikr, type ReadingLine, type ReadingPreferences } from '../smartReading';
import { useTheme } from '../theme';
import { ReadingText } from './ReadingText';

export function ReadingControl({ label, onPress, disabled = false, selected = false, choice = false }: {
  label: string; onPress: () => void; disabled?: boolean; selected?: boolean; choice?: boolean;
}) {
  const { theme } = useTheme();
  return <Pressable accessibilityRole={choice ? 'radio' : 'button'} accessibilityLabel={label}
    aria-checked={choice ? selected : undefined} aria-disabled={disabled}
    accessibilityState={{ disabled, ...(choice ? { checked: selected } : {}) }}
    disabled={disabled} onPress={onPress} style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 10,
      justifyContent: 'center', borderRadius: 10, opacity: disabled ? 0.5 : 1,
      backgroundColor: selected ? theme.warmSurface : undefined }}>
    <Text style={{ color: theme.text, textAlign: 'center', writingDirection: 'rtl', fontSize: 13, lineHeight: 22 }}>{label}</Text>
  </Pressable>;
}

/** Mounted with phrase/layout key by the owner: changing count never remounts it. */
export function SmartReadingSurface({ phrase, preferences, preview = false }: {
  phrase: string; preferences: ReadingPreferences; preview?: boolean;
}) {
  const { theme } = useTheme();
  const { height, fontScale } = useWindowDimensions();
  const { canAnimate: allowed, staticReading: staticText } = useReadingSafety();
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [lines, setLines] = useState<ReadingLine[]>([]);
  const [width, setWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const [ended, setEnded] = useState(false);
  const [translation] = useState(() => new Animated.Value(0));
  const segments = useMemo(() => segmentDhikr(phrase), [phrase]);
  // Reserve space for scaled controls; page boundaries still use measured lines.
  const available = Math.max(100, Math.min(preview ? 150 : height * 0.25, 220) / (fontScale > 1.5 ? 1.5 : 1));
  const pages = useMemo(() => measuredReadingPages(lines, available), [lines, available]);
  const page = pages[Math.min(index, pages.length - 1)];
  const oversizedLine = pages.some(page => page.height > available + 0.1);
  const { mode, speed, progression } = preferences;
  const count = mode === 'segments' ? segments.length : pages.length;
  const auto = allowed && !oversizedLine && playing && (mode === 'ticker' || progression === 'automatic');
  const travel = Math.max(0, textWidth - width);
  const styles = StyleSheet.create({
    phrase: { color: theme.text, fontSize: 23, lineHeight: 44, includeFontPadding: true, textAlign: 'right', writingDirection: 'rtl' },
    controls: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 2 },
    note: { color: theme.textMuted, fontSize: 12, lineHeight: 22, textAlign: 'center', writingDirection: 'rtl' },
  });
  // Losing safety permission requires a fresh explicit start, never a silent resume.
  const playbackKey = `${allowed}:${progression}`;
  const [previousPlaybackKey, setPreviousPlaybackKey] = useState(playbackKey);
  if (previousPlaybackKey !== playbackKey) {
    setPreviousPlaybackKey(playbackKey);
    setPlaying(false);
  }
  useEffect(() => {
    if (!auto || mode === 'ticker' || mode === 'full' || count < 2) return;
    const pageLines = page ? lines.filter(line => line.y >= page.offset && line.y < page.offset + page.height).length : 1;
    const delay = READING_SPEEDS[speed].delay * (mode === 'segments' ? Math.max(1, (segments[index]?.length ?? 0) / 65) : Math.max(1, pageLines));
    const timer = setTimeout(() => {
      if (index >= count - 1) { setPlaying(false); setEnded(true); }
      else setIndex(index + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [auto, mode, speed, index, count, segments, lines, page]);
  useEffect(() => {
    if (mode !== 'ticker') return;
    if (!auto || !travel) return;
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    // Native stopAnimation returns the actual driver position asynchronously.
    // Derive duration inside that callback so live speed changes cannot use a
    // stale JS-side position, and ignore callbacks from an abandoned effect.
    translation.stopAnimation(value => {
      if (!active) return;
      animation = Animated.timing(translation, { toValue: travel,
        duration: Math.max(1, (travel - value) / READING_SPEEDS[speed].pixelsPerSecond * 1000),
        easing: Easing.linear, useNativeDriver: true, isInteraction: false });
      animation.start(({ finished }) => { if (active && finished) { setPlaying(false); setEnded(true); } });
    });
    return () => { active = false; animation?.stop(); translation.stopAnimation(); };
  }, [auto, mode, speed, travel, translation]);
  const restart = () => { setPlaying(false); setIndex(0); setEnded(false); translation.setValue(0); };
  const move = (delta: number) => {
    setPlaying(false); setEnded(false);
    if (mode === 'ticker') {
      translation.stopAnimation(value => {
        translation.setValue(Math.max(0, Math.min(travel, value + delta * width * 0.75)));
      });
    } else setIndex(value => Math.max(0, Math.min(count - 1, value + delta)));
  };
  // Screen readers always receive one complete, static canonical text node.
  return <View testID={`smart-reader-${mode}`} style={{ gap: 8, minHeight: 0, flexShrink: 1 }}>
    {staticText ? <ScrollView style={{ maxHeight: available }} removeClippedSubviews={false}>
      <Text selectable testID="smart-accessible-phrase" style={[styles.phrase, { paddingVertical: 8 }]}>{phrase}</Text>
    </ScrollView> : mode === 'ticker' ? <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ overflow: 'hidden', direction: 'ltr', paddingVertical: 12 }}>
      <ScrollView horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false} style={{ opacity: textWidth ? 1 : 0 }}
        contentContainerStyle={{ width: textWidth ? Math.max(width, textWidth) : undefined }}>
        <Animated.View style={{ width: textWidth || undefined, transform: [{ translateX: Animated.subtract(translation, travel) }] }}>
          <ReadingText testID="ticker-phrase" style={[styles.phrase, { flexShrink: 0, paddingVertical: 6 }]}
            onMeasure={lines => {
              const measured = Math.ceil(Math.max(0, ...lines.map(line => line.width))) + 4;
              if (measured !== textWidth) setTextWidth(measured);
            }}>{phrase}</ReadingText>
        </Animated.View>
      </ScrollView>
    </View> : mode === 'segments' ? <ScrollView style={{ maxHeight: available }} removeClippedSubviews={false} key={index}>
      <Text testID="segment-phrase" selectable style={[styles.phrase, { paddingVertical: 8 }]}>{segments[index]}</Text>
    </ScrollView> : <View style={{ paddingVertical: 12 }}>
      <View testID="vertical-window" style={{ overflow: 'hidden', height: page?.height ?? available }}>
        <View style={{ transform: [{ translateY: -(page?.offset ?? 0) }] }}>
          <ReadingText testID="vertical-phrase" style={styles.phrase} onMeasure={lines => {
            const measured = lines.map(({ y, height }) => ({ y, height }));
            setLines(old => JSON.stringify(old) === JSON.stringify(measured) ? old : measured);
          }}>{phrase}</ReadingText>
        </View>
      </View>
    </View>}
    {!staticText && mode !== 'ticker' && <Text style={styles.note}>{toArabicDigits(index + 1)} / {toArabicDigits(Math.max(1, count))}</Text>}
    {!allowed && <Text style={styles.note}>قراءة ثابتة وآمنة — الحركة التلقائية متوقفة</Text>}
    <View style={styles.controls}>
      {!staticText && <ReadingControl label="السابق" disabled={mode !== 'ticker' && index === 0} onPress={() => move(-1)} />}
      {!staticText && allowed && (mode === 'ticker' || progression === 'automatic') && <ReadingControl label={playing ? 'إيقاف مؤقت' : 'تشغيل القراءة'}
        disabled={ended || oversizedLine || (mode === 'ticker' ? travel === 0 : !playing && index >= count - 1)} onPress={() => setPlaying(value => !value)} />}
      {!staticText && <ReadingControl label="التالي" disabled={mode !== 'ticker' && index >= count - 1} onPress={() => move(1)} />}
      {!staticText && <ReadingControl label="من البداية" onPress={restart} />}
    </View>
    {ended && <Text accessibilityLiveRegion="polite" style={styles.note}>اكتملت القراءة</Text>}
  </View>;
}
