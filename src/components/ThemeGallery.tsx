import { useId, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { toArabicDigits } from '../arabic';
import { getActiveBeadCount, TOTAL_BEADS } from '../beads';
import { THEME_OPTIONS, useTheme, type ThemeTokens } from '../theme';
import { CheckIcon } from './Icons';

/** Static sample, not a second counter: no gestures, effects, or session state. */
function TasbeehPreview({ theme, size = 116 }: { theme: ThemeTokens; size?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { count, target } = theme.preview;
  const activeBeads = getActiveBeadCount(count);
  const circumference = 2 * Math.PI * 34;

  return (
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none"
      style={[styles.preview, { backgroundColor: theme.background }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <RadialGradient id={`${id}active`} cx="30%" cy="28%" r="70%">
            <Stop offset="0%" stopColor={theme.beadActiveHighlight} />
            <Stop offset="46%" stopColor={theme.beadActiveBase} />
            <Stop offset="100%" stopColor={theme.beadActiveShadow} />
          </RadialGradient>
          <RadialGradient id={`${id}inactive`} cx="32%" cy="30%" r="68%">
            <Stop offset="0%" stopColor={theme.beadInactiveHighlight} />
            <Stop offset="55%" stopColor={theme.beadInactiveBase} />
            <Stop offset="100%" stopColor={theme.beadInactiveShadow} />
          </RadialGradient>
        </Defs>
        <Circle cx="60" cy="60" r="47" fill="none" stroke={theme.beadString} />
        <Circle cx="60" cy="60" r="38" fill={theme.ringInner} stroke={theme.surfaceBorder} />
        <Circle cx="60" cy="60" r="34" fill="none" stroke={theme.track} strokeWidth="3" />
        <Circle cx="60" cy="60" r="34" fill="none" stroke={theme.warm} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - Math.min(count / target, 1))} transform="rotate(-90 60 60)" />
        {Array.from({ length: TOTAL_BEADS }, (_, index) => {
          const angle = index / TOTAL_BEADS * 2 * Math.PI - Math.PI / 2;
          return <Circle key={index} cx={60 + 47 * Math.cos(angle)} cy={60 + 47 * Math.sin(angle)} r="2.4"
            fill={`url(#${id}${index < activeBeads ? 'active' : 'inactive'})`}
            opacity={index < activeBeads ? 1 : 0.65} />;
        })}
      </Svg>
      <View style={styles.previewCopy}>
        <Text allowFontScaling={false} style={[styles.previewCount, { color: theme.warm }]}>{toArabicDigits(count)}</Text>
        <Text allowFontScaling={false} style={[styles.previewTarget, { color: theme.textMuted }]}>من {toArabicDigits(target)}</Text>
      </View>
    </View>
  );
}

export function CurrentThemeCard({ compact }: { compact: boolean }) {
  const { theme } = useTheme();
  return (
    <View accessible accessibilityLabel={`المظهر الحالي: ${theme.displayName}، ${theme.subtitle}، مفعّل`}
      style={[styles.currentCard, { backgroundColor: theme.background, borderColor: theme.surfaceBorderActive },
        compact && styles.currentCardCompact]}>
      <TasbeehPreview theme={theme} size={100} />
      <View style={styles.currentCopy}>
        <Text style={[styles.name, { color: theme.text }]}>{theme.displayName}</Text>
        <Text style={[styles.description, { color: theme.textMuted }]}>{theme.subtitle}</Text>
        <SelectionBadge theme={theme} selected />
      </View>
    </View>
  );
}

function SelectionBadge({ theme, selected }: { theme: ThemeTokens; selected: boolean }) {
  return (
    <View style={styles.badge}>
      {selected && <CheckIcon size={15} color={theme.warm} />}
      <Text style={[styles.badgeText, { color: selected ? theme.warm : theme.textMuted }]}>
        {selected ? 'مفعّل' : 'اختيار المظهر'}
      </Text>
    </View>
  );
}

export function ThemeGallery() {
  const { themeId, setThemeId, theme } = useTheme();
  const { fontScale } = useWindowDimensions();
  const [contentWidth, setContentWidth] = useState(0);
  // Measure the modal's actual content width, including tablets and safe-area padding.
  const columns = contentWidth >= 292 && fontScale < 1.3 ? 2 : 1;
  const rows = Array.from({ length: Math.ceil(THEME_OPTIONS.length / columns) }, (_, index) =>
    THEME_OPTIONS.slice(index * columns, (index + 1) * columns));

  return (
    <ScrollView style={styles.galleryScroll} contentContainerStyle={styles.galleryContent}
      indicatorStyle={theme.statusBarStyle === 'dark' ? 'black' : 'white'}>
      <View onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)} style={styles.grid}>
        {rows.map((row) => (
          <View key={`${columns}-${row[0].id}`} style={styles.gridRow}>
            {row.map((option) => {
              const selected = option.id === themeId;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityLabel={`مظهر ${option.displayName}، ${option.subtitle}`}
                  accessibilityHint="يُطبّق فورًا، ويمكنك متابعة استعراض المظاهر"
                  accessibilityState={{ checked: selected, selected }}
                  onPress={() => setThemeId(option.id)}
                  style={({ pressed }) => [
                    styles.galleryCard,
                    { backgroundColor: option.background, borderColor: selected ? theme.warm : theme.surfaceBorder },
                    pressed && styles.pressed,
                  ]}
                >
                  <TasbeehPreview theme={option} />
                  <View style={styles.cardCopy}>
                    <Text style={[styles.name, { color: option.text }]}>{option.displayName}</Text>
                    <Text style={[styles.description, { color: option.textMuted }]}>{option.subtitle}</Text>
                    <SelectionBadge theme={option} selected={selected} />
                  </View>
                </Pressable>
              );
            })}
            {columns === 2 && row.length === 1 && <View style={styles.emptyCell} />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  preview: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: 16 },
  previewCopy: { position: 'absolute', alignItems: 'center' },
  previewCount: { fontSize: 22, fontWeight: '700' },
  previewTarget: { fontSize: 9, marginTop: 1 },
  currentCard: { borderWidth: 1, borderRadius: 18, padding: 12, gap: 12, direction: 'rtl' },
  currentCardCompact: { flexDirection: 'row', alignItems: 'center' },
  currentCopy: { flex: 1, flexShrink: 1, gap: 6 },
  name: { fontSize: 15, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
  description: { fontSize: 12, textAlign: 'right', writingDirection: 'rtl', marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  badgeText: { fontSize: 12, fontWeight: '600', textAlign: 'right', writingDirection: 'rtl', flexShrink: 1 },
  galleryScroll: { maxHeight: 510, flexShrink: 1 },
  galleryContent: { paddingBottom: 4 },
  grid: { gap: 12, direction: 'rtl' },
  gridRow: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  emptyCell: { flex: 1 },
  galleryCard: { flex: 1, borderWidth: 2, borderRadius: 18, padding: 8, minHeight: 220 },
  cardCopy: { padding: 4, flex: 1 },
  pressed: { opacity: 0.8 },
});
