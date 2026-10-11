import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

import { getCycleText, toArabicDigits } from '../arabic';
import { colors } from '../theme';

const VIEWBOX = 340;
const CENTER = VIEWBOX / 2;
const RADIUS = 118;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const BEAD_RADIUS = 144;
const TOTAL_BEADS = 33;

type Props = {
  size: number;
  count: number;
  target: number;
  title: string;
  cycle: number;
  disabled?: boolean;
  onPress: () => void;
};

export function CounterRing({ size, count, target, title, cycle, disabled, onPress }: Props) {
  const isComplete = count >= target;
  const progress = Math.min(count / target, 1);
  const angle = progress * 2 * Math.PI;
  const headX = CENTER + RADIUS * Math.sin(angle);
  const headY = CENTER - RADIUS * Math.cos(angle);

  // Animations
  const pressScale = useRef(new Animated.Value(1)).current;
  const countPop = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const completePulse = useRef(new Animated.Value(1)).current;

  // Pulse when target is reached
  useEffect(() => {
    if (isComplete) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(completePulse, { toValue: 1.05, duration: 900, useNativeDriver: true }),
          Animated.timing(completePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      completePulse.setValue(1);
    }
  }, [isComplete, completePulse]);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 120,
    }).start();
  };

  const handlePress = () => {
    // Pop count animation
    countPop.setValue(1.14);
    Animated.spring(countPop, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 150,
    }).start();

    // Trigger ripple
    rippleAnim.setValue(0);
    Animated.timing(rippleAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();

    onPress();
  };

  // 33 beads positions around the perimeter
  const beads = [];
  for (let i = 0; i < TOTAL_BEADS; i++) {
    const beadAngle = (i / TOTAL_BEADS) * 2 * Math.PI - Math.PI / 2;
    const bx = CENTER + BEAD_RADIUS * Math.cos(beadAngle);
    const by = CENTER + BEAD_RADIUS * Math.sin(beadAngle);
    const isBeadActive = progress >= (i + 1) / TOTAL_BEADS;
    beads.push({ id: i, bx, by, isBeadActive });
  }

  const digits = String(count).length;
  const countFontSize = size * (digits <= 2 ? 0.23 : digits === 3 ? 0.20 : 0.16);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
        <Defs>
          <LinearGradient id="goldStroke" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={colors.goldBright} />
            <Stop offset="50%" stopColor={colors.gold} />
            <Stop offset="100%" stopColor={colors.goldDeep} />
          </LinearGradient>
          <RadialGradient id="innerSurfaceGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#122A21" />
            <Stop offset="70%" stopColor="#0B1A14" />
            <Stop offset="100%" stopColor="#06120D" />
          </RadialGradient>
          <RadialGradient id="headGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="40%" stopColor={colors.goldBright} />
            <Stop offset="100%" stopColor={colors.goldDeep} />
          </RadialGradient>
        </Defs>

        {/* Outer decorative ring border */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={158}
          fill="none"
          stroke="rgba(223, 186, 107, 0.15)"
          strokeWidth={1}
          strokeDasharray="4 8"
        />

        {/* 33 Prayer Beads perimeter track */}
        <G>
          {beads.map((bead) => (
            <Circle
              key={bead.id}
              cx={bead.bx}
              cy={bead.by}
              r={bead.isBeadActive ? 3.8 : 2.2}
              fill={bead.isBeadActive ? colors.goldLight : colors.ringBeadInactive}
              opacity={bead.isBeadActive ? 0.95 : 0.45}
            />
          ))}
        </G>

        {/* Outer and Inner Ring Frames */}
        <Circle cx={CENTER} cy={CENTER} r={134} fill="url(#innerSurfaceGlow)" stroke="#19372B" strokeWidth={1.5} />
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke={colors.track} strokeWidth={STROKE} />

        {/* Luminous progress track */}
        {progress > 0 && (
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="url(#goldStroke)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        )}

        {/* Glowing Head Bead */}
        {progress > 0 && (
          <>
            <Circle cx={headX} cy={headY} r={8} fill={colors.goldBright} opacity={0.3} />
            <Circle cx={headX} cy={headY} r={5} fill="url(#headGlow)" />
            <Circle cx={headX} cy={headY} r={2} fill="#FFFFFF" />
          </>
        )}
      </Svg>

      {/* Ripple Wave on Tap */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ripple,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: (size * 0.72) / 2,
            opacity: rippleAnim.interpolate({
              inputRange: [0, 0.4, 1],
              outputRange: [0.6, 0.3, 0],
            }),
            transform: [
              {
                scale: rippleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.25],
                }),
              },
            ],
          },
        ]}
      />

      {/* Core Interactive Disc */}
      <Animated.View
        style={[
          styles.interactiveDiscWrapper,
          {
            transform: [
              { scale: pressScale },
              { scale: isComplete ? completePulse : 1 },
            ],
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`عدّاد ${title}`}
          accessibilityValue={{ text: `${toArabicDigits(count)} من ${toArabicDigits(target)}` }}
          accessibilityHint="اضغط للتسبيح"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={({ pressed }) => [
            styles.touchArea,
            { width: size * 0.68, height: size * 0.68, borderRadius: size * 0.34 },
            pressed && styles.pressed,
          ]}
        >
          {/* Cycle Badge */}
          <View style={[styles.cyclePill, isComplete && styles.cyclePillComplete]}>
            <Text style={[styles.cyclePillText, isComplete && styles.cyclePillTextComplete]}>
              {getCycleText(cycle)}
            </Text>
          </View>

          {/* Animated Big Count Number */}
          <Animated.View style={{ transform: [{ scale: countPop }] }}>
            <Text
              style={[
                styles.countText,
                {
                  fontSize: countFontSize,
                  lineHeight: countFontSize * 1.2,
                  color: isComplete ? colors.goldLight : colors.text,
                },
              ]}
              numberOfLines={1}
            >
              {toArabicDigits(count)}
            </Text>
          </Animated.View>

          {/* Target and Completion Indicator */}
          <Text style={styles.targetText}>
            الهدف: <Text style={styles.targetNumber}>{toArabicDigits(target)}</Text>
          </Text>

          {/* Bottom Prompt / Complete message */}
          <View style={[styles.statusBadge, isComplete && styles.statusBadgeComplete]}>
            <Text style={[styles.statusText, isComplete && styles.statusTextComplete]}>
              {isComplete ? 'تم الورد بحمد الله ✓' : 'المس للشروع في الذكر'}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  interactiveDiscWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  touchArea: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    justifyContent: 'center',
    padding: 12,
  },
  pressed: {
    backgroundColor: 'rgba(223, 186, 107, 0.06)',
  },
  ripple: {
    borderColor: colors.goldLight,
    borderWidth: 2,
    position: 'absolute',
  },
  cyclePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(210, 230, 218, 0.18)',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  cyclePillComplete: {
    backgroundColor: colors.goldBadge,
    borderColor: colors.goldBadgeBorder,
  },
  cyclePillText: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  cyclePillTextComplete: {
    color: colors.goldText,
  },
  countText: {
    fontWeight: '800',
    includeFontPadding: false,
    letterSpacing: -1,
    textAlign: 'center',
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(223, 186, 107, 0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
      },
      android: {},
    }),
  },
  targetText: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 2,
  },
  targetNumber: {
    color: colors.goldText,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: 10,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeComplete: {
    backgroundColor: 'rgba(223, 186, 107, 0.14)',
  },
  statusText: {
    color: colors.textFaint,
    fontSize: 11,
  },
  statusTextComplete: {
    color: colors.goldText,
    fontWeight: '700',
  },
});
