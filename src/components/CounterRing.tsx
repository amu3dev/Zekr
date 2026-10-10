import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { toArabicDigits } from '../arabic';
import { colors } from '../theme';

const VIEWBOX = 300;
const CENTER = VIEWBOX / 2;
const RADIUS = 118;
const STROKE = 11;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Props = {
  size: number;
  count: number;
  target: number;
  title: string;
  disabled?: boolean;
  onPress: () => void;
};

export function CounterRing({ size, count, target, title, disabled, onPress }: Props) {
  const progress = Math.min(count / target, 1);
  const angle = progress * 2 * Math.PI;
  const headX = CENTER + RADIUS * Math.sin(angle);
  const headY = CENTER - RADIUS * Math.cos(angle);
  const isComplete = count >= target;

  const digits = String(count).length;
  const countFontSize = size * (digits <= 3 ? 0.22 : digits === 4 ? 0.18 : 0.15);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
        <Defs>
          <LinearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.goldLight} />
            <Stop offset="0.5" stopColor={colors.gold} />
            <Stop offset="1" stopColor={colors.goldDeep} />
          </LinearGradient>
        </Defs>
        <Circle cx={CENTER} cy={CENTER} r={148} fill={colors.ringOuter} fillOpacity={0.56} stroke="#355443" strokeOpacity={0.44} />
        <Circle cx={CENTER} cy={CENTER} r={134} fill={colors.ringInner} stroke="#203B31" strokeWidth={1} />
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke={colors.track} strokeWidth={STROKE} />
        {progress > 0 && (
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="url(#gold)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        )}
        <Circle cx={headX} cy={headY} r={4} fill="#FFF3C7" opacity={progress > 0 ? 1 : 0.45} />
      </Svg>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`عدّاد ${title}`}
        accessibilityValue={{ text: `${toArabicDigits(count)} من ${toArabicDigits(target)}` }}
        accessibilityHint="اضغط مرتين لزيادة العدد"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.hitArea,
          { width: size * 0.74, height: size * 0.74, borderRadius: size },
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={[styles.count, { fontSize: countFontSize, lineHeight: countFontSize * 1.25 }]} numberOfLines={1}>
          {toArabicDigits(count)}
        </Text>
        <Text style={styles.target}>من {toArabicDigits(target)}</Text>
        <Text style={[styles.hint, isComplete && styles.hintComplete]}>
          {isComplete ? 'اكتمل الهدف' : 'اضغط للعدّ'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: '13%',
  },
  pressed: { backgroundColor: 'rgba(242,214,151,0.07)', transform: [{ scale: 0.97 }] },
  title: { color: '#A9C8B6', fontSize: 16, maxWidth: '90%' },
  count: { color: colors.text, fontWeight: '700', includeFontPadding: false, textAlign: 'center' },
  target: { color: colors.textMuted, fontSize: 14 },
  hint: { color: '#6F9180', fontSize: 11, marginTop: 12 },
  hintComplete: { color: colors.goldText },
});
