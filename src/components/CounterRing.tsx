import { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { getCycleText, toArabicDigits } from '../arabic';
import { colors } from '../theme';

const VIEWBOX = 360;
const CENTER = VIEWBOX / 2;
const RADIUS = 114;
const STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const BEAD_RADIUS = 138;
const TOTAL_BEADS = 33;
const BEAD_SIZE = 7.5; // Radius of each spherical bead

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

  // Stable Animated Values
  const [pressScale] = useState(() => new Animated.Value(1));
  const [countPop] = useState(() => new Animated.Value(1));
  const [rippleAnim] = useState(() => new Animated.Value(0));
  const [completePulse] = useState(() => new Animated.Value(1));

  // Pulse when target is reached
  useEffect(() => {
    if (!isComplete) {
      completePulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(completePulse, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(completePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
      completePulse.setValue(1);
    };
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
    countPop.setValue(1.16);
    Animated.spring(countPop, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 160,
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

  // Generate 33 spherical bead coordinates around the perimeter
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
          {/* 3D Jade Bead Spherical Gradient (Inactive) */}
          <RadialGradient id="jadeBeadSphere" cx="35%" cy="35%" r="65%">
            <Stop offset="0%" stopColor={colors.beadJadeHighlight} />
            <Stop offset="55%" stopColor={colors.beadJadeBase} />
            <Stop offset="100%" stopColor={colors.beadJadeShadow} />
          </RadialGradient>

          {/* 3D Gold Pearl Spherical Gradient (Active) */}
          <RadialGradient id="goldBeadSphere" cx="32%" cy="32%" r="68%">
            <Stop offset="0%" stopColor={colors.beadGoldHighlight} />
            <Stop offset="45%" stopColor={colors.beadGoldBase} />
            <Stop offset="85%" stopColor={colors.beadGoldDeep} />
            <Stop offset="100%" stopColor={colors.beadGoldShadow} />
          </RadialGradient>

          {/* Golden Progress Stroke Gradient */}
          <LinearGradient id="goldStrokeGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={colors.goldBright} />
            <Stop offset="50%" stopColor={colors.gold} />
            <Stop offset="100%" stopColor={colors.goldDeep} />
          </LinearGradient>

          {/* Inner Disc Ambient Gradient */}
          <RadialGradient id="innerDiscShade" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#0F281E" />
            <Stop offset="75%" stopColor="#081812" />
            <Stop offset="100%" stopColor="#040C08" />
          </RadialGradient>
        </Defs>

        {/* Outer Circular String Thread linking the beads */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={BEAD_RADIUS}
          fill="none"
          stroke={colors.beadString}
          strokeWidth={1.5}
        />

        {/* Inner Disc Bevel */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS + 6}
          fill="url(#innerDiscShade)"
          stroke="rgba(224, 194, 128, 0.22)"
          strokeWidth={1.2}
        />

        {/* Track Base */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={colors.track}
          strokeWidth={STROKE}
        />

        {/* Luminous Active Progress Arc */}
        {progress > 0 && (
          <>
            {/* Soft Glow Under-stroke */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={colors.trackGlow}
              strokeWidth={STROKE + 6}
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />

            {/* Main Crisp Gold Stroke */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="url(#goldStrokeGrad)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />
          </>
        )}

        {/* 33 Spherical Prayer Beads */}
        <G>
          {beads.map((bead) => (
            <G key={bead.id}>
              {/* Subtle bead glow if active */}
              {bead.isBeadActive && (
                <Circle
                  cx={bead.bx}
                  cy={bead.by}
                  r={BEAD_SIZE + 2}
                  fill={colors.goldLight}
                  opacity={0.25}
                />
              )}
              {/* 3D Sphere Bead */}
              <Circle
                cx={bead.bx}
                cy={bead.by}
                r={BEAD_SIZE}
                fill={bead.isBeadActive ? 'url(#goldBeadSphere)' : 'url(#jadeBeadSphere)'}
                stroke={bead.isBeadActive ? colors.goldLight : 'rgba(42, 114, 88, 0.4)'}
                strokeWidth={0.6}
              />
            </G>
          ))}
        </G>

        {/* Top Bead Finial Ornament (Shahid / Head Finial at 12 o'clock) */}
        <G transform={`translate(${CENTER}, ${CENTER - BEAD_RADIUS})`}>
          <Circle cx={0} cy={-BEAD_SIZE - 2} r={3} fill={colors.goldBright} />
          <Path
            d="M -2,-8 L 0,-13 L 2,-8 Z"
            fill={colors.gold}
            stroke={colors.goldLight}
            strokeWidth={0.6}
          />
        </G>

        {/* Glowing Head Bead Marker on the Progress Arc */}
        {progress > 0 && progress < 1 && (
          <G>
            <Circle cx={headX} cy={headY} r={7} fill={colors.goldBright} opacity={0.35} />
            <Circle cx={headX} cy={headY} r={4.5} fill={colors.goldBright} />
            <Circle cx={headX} cy={headY} r={2} fill="#FFFFFF" />
          </G>
        )}
      </Svg>

      {/* Ripple Wave on Tap */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ripple,
          {
            width: size * 0.68,
            height: size * 0.68,
            borderRadius: (size * 0.68) / 2,
            opacity: rippleAnim.interpolate({
              inputRange: [0, 0.4, 1],
              outputRange: [0.65, 0.28, 0],
            }),
            transform: [
              {
                scale: rippleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.85, 1.3],
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
            { width: size * 0.62, height: size * 0.62, borderRadius: size * 0.31 },
            pressed && styles.pressed,
          ]}
        >
          {/* Cycle Badge (Champagne Gold Pill matching mockup) */}
          <View style={styles.cyclePill}>
            <Text style={styles.cyclePillText}>{getCycleText(cycle)}</Text>
          </View>

          {/* Animated Big Count Number in Radiant Gold */}
          <Animated.View style={{ transform: [{ scale: countPop }] }}>
            <Text
              style={[
                styles.countText,
                {
                  fontSize: countFontSize,
                  lineHeight: countFontSize * 1.18,
                },
              ]}
              numberOfLines={1}
            >
              {toArabicDigits(count)}
            </Text>
          </Animated.View>

          {/* Target Fraction Indicator */}
          <Text style={styles.targetText}>
            الهدف: <Text style={styles.targetNumber}>{toArabicDigits(target)}</Text>
          </Text>

          {/* Status Badge */}
          {isComplete && (
            <View style={styles.completeStatusBadge}>
              <Text style={styles.completeStatusText}>تم الورد بحمد الله ✓</Text>
            </View>
          )}
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
    backgroundColor: 'transparent',
    justifyContent: 'center',
    padding: 8,
  },
  pressed: {
    backgroundColor: 'rgba(223, 186, 107, 0.05)',
  },
  ripple: {
    borderColor: colors.goldLight,
    borderWidth: 1.8,
    position: 'absolute',
  },
  cyclePill: {
    backgroundColor: colors.goldPill,
    borderRadius: 14,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 3.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  cyclePillText: {
    color: colors.onGold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  countText: {
    color: colors.goldLight,
    fontWeight: '800',
    includeFontPadding: false,
    letterSpacing: -1.5,
    textAlign: 'center',
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(232, 201, 126, 0.55)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
      },
      android: {},
    }),
  },
  targetText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  targetNumber: {
    color: colors.goldText,
    fontWeight: '700',
  },
  completeStatusBadge: {
    backgroundColor: 'rgba(223, 186, 107, 0.16)',
    borderColor: colors.goldBadgeBorder,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 2.5,
  },
  completeStatusText: {
    color: colors.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
});
