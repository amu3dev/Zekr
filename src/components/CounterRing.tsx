import { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { getCycleText, toArabicDigits } from '../arabic';
import { useTheme } from '../theme';
import type { ThemeTokens } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const VIEWBOX = 360;
const CENTER = VIEWBOX / 2;
const RADIUS = 113;
const STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const BEAD_RADIUS = 139;
const TOTAL_BEADS = 36;
const BEAD_SIZE = 7.2;

type Props = {
  size: number;
  count: number;
  target: number;
  title: string;
  cycle: number;
  disabled?: boolean;
  onPress: () => void;
};

function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

export function CounterRing({ size, count, target, title, cycle, disabled, onPress }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const reduceMotion = useReducedMotion();
  const isComplete = count >= target;
  const progress = Math.min(count / target, 1);
  const [pressScale] = useState(() => new Animated.Value(1));
  const [countPop] = useState(() => new Animated.Value(1));
  const [rippleAnim] = useState(() => new Animated.Value(0));
  const [completePulse] = useState(() => new Animated.Value(1));
  const [progressAnim] = useState(() => new Animated.Value(progress));

  useEffect(() => {
    if (reduceMotion) {
      progressAnim.setValue(progress);
      return;
    }

    const animation = Animated.timing(progressAnim, {
      duration: 240,
      toValue: progress,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, progressAnim, reduceMotion]);

  useEffect(() => {
    if (!isComplete || reduceMotion) {
      completePulse.stopAnimation();
      completePulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(completePulse, { toValue: 1.025, duration: 1000, useNativeDriver: true }),
        Animated.timing(completePulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    );

    animation.start();
    return () => {
      animation.stop();
      completePulse.setValue(1);
    };
  }, [completePulse, isComplete, reduceMotion]);

  const runPressAnimation = () => {
    if (reduceMotion) return;
    Animated.spring(pressScale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 40,
      bounciness: 3,
    }).start();
  };

  const runReleaseAnimation = () => {
    if (reduceMotion) return;
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 130,
    }).start();
  };

  const handlePress = () => {
    if (!reduceMotion) {
      countPop.setValue(1.08);
      Animated.spring(countPop, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 150,
      }).start();

      rippleAnim.setValue(0);
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }).start();
    }

    onPress();
  };

  // The beads are a compact, scalable view of the selected goal. The exact
  // count remains in the animated arc and center label, while the 36 beads
  // stay legible for both 33 and 1000-count goals.
  const activeBeads = count === 0 ? 0 : Math.min(TOTAL_BEADS, Math.ceil(progress * TOTAL_BEADS));
  const beads = Array.from({ length: TOTAL_BEADS }, (_, id) => {
    const beadAngle = (id / TOTAL_BEADS) * 2 * Math.PI - Math.PI / 2;
    return {
      id,
      bx: CENTER + BEAD_RADIUS * Math.cos(beadAngle),
      by: CENTER + BEAD_RADIUS * Math.sin(beadAngle),
      isActive: id < activeBeads,
    };
  });

  const digits = String(count).length;
  const countFontSize = size * (digits <= 2 ? 0.23 : digits === 3 ? 0.19 : 0.15);
  const progressDashOffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });
  const angle = progress * 2 * Math.PI;
  const headX = CENTER + RADIUS * Math.sin(angle);
  const headY = CENTER - RADIUS * Math.cos(angle);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
        <Defs>
          <RadialGradient id="inactiveBeadSphere" cx="32%" cy="30%" r="68%">
            <Stop offset="0%" stopColor={theme.beadInactiveHighlight} />
            <Stop offset="55%" stopColor={theme.beadInactiveBase} />
            <Stop offset="100%" stopColor={theme.beadInactiveShadow} />
          </RadialGradient>
          <RadialGradient id="activeBeadSphere" cx="30%" cy="28%" r="70%">
            <Stop offset="0%" stopColor={theme.beadActiveHighlight} />
            <Stop offset="46%" stopColor={theme.beadActiveBase} />
            <Stop offset="84%" stopColor={theme.beadActiveDeep} />
            <Stop offset="100%" stopColor={theme.beadActiveShadow} />
          </RadialGradient>
          <LinearGradient id="progressStroke" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={theme.warmBright} />
            <Stop offset="54%" stopColor={theme.warm} />
            <Stop offset="100%" stopColor={theme.warmDeep} />
          </LinearGradient>
          <RadialGradient id="ringDiscShade" cx="50%" cy="44%" rx="58%" ry="58%">
            <Stop offset="0%" stopColor={theme.surfaceElevated} />
            <Stop offset="76%" stopColor={theme.ringInner} />
            <Stop offset="100%" stopColor={theme.ringOuter} />
          </RadialGradient>
        </Defs>

        <Circle
          cx={CENTER}
          cy={CENTER}
          r={BEAD_RADIUS}
          fill="none"
          stroke={theme.beadString}
          strokeWidth={1.4}
        />

        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS + 7}
          fill="url(#ringDiscShade)"
          stroke={theme.surfaceBorder}
          strokeWidth={1.2}
        />

        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={theme.track}
          strokeWidth={STROKE}
        />

        <AnimatedCircle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={theme.trackGlow}
          strokeWidth={STROKE + 6}
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={progressDashOffset}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
        <AnimatedCircle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="url(#progressStroke)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={progressDashOffset}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />

        <G>
          {beads.map((bead) => (
            <G key={bead.id} opacity={bead.isActive ? 1 : 0.52}>
              {bead.isActive && (
                <Circle
                  cx={bead.bx}
                  cy={bead.by}
                  r={BEAD_SIZE + 2.4}
                  fill={theme.warm}
                  opacity={0.2}
                />
              )}
              <Circle
                cx={bead.bx}
                cy={bead.by}
                r={BEAD_SIZE}
                fill={bead.isActive ? 'url(#activeBeadSphere)' : 'url(#inactiveBeadSphere)'}
                stroke={bead.isActive ? theme.warmBright : theme.accentMuted}
                strokeWidth={0.6}
              />
            </G>
          ))}
        </G>

        <G transform={`translate(${CENTER}, ${CENTER - BEAD_RADIUS})`}>
          <Circle cx={0} cy={-BEAD_SIZE - 2} r={3} fill={theme.warmBright} />
          <Path d="M -2,-8 L 0,-13 L 2,-8 Z" fill={theme.warm} stroke={theme.warmBright} strokeWidth={0.6} />
        </G>

        {progress > 0 && progress < 1 && (
          <G>
            <Circle cx={headX} cy={headY} r={7} fill={theme.warmBright} opacity={0.28} />
            <Circle cx={headX} cy={headY} r={4.5} fill={theme.warmBright} />
            <Circle cx={headX} cy={headY} r={2} fill={theme.text} />
          </G>
        )}
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.ripple,
          {
            width: size * 0.68,
            height: size * 0.68,
            borderRadius: (size * 0.68) / 2,
            opacity: rippleAnim.interpolate({
              inputRange: [0, 0.35, 1],
              outputRange: [0.42, 0.18, 0],
            }),
            transform: [
              {
                scale: rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.22] }),
              },
            ],
          },
        ]}
      />

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
          onPressIn={runPressAnimation}
          onPressOut={runReleaseAnimation}
          onPress={handlePress}
          style={({ pressed }) => [
            styles.touchArea,
            { width: size * 0.64, height: size * 0.64, borderRadius: size * 0.32 },
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.cyclePill}>
            <View style={styles.cycleDot} />
            <Text style={styles.cyclePillText}>{getCycleText(cycle)}</Text>
          </View>

          <Animated.View style={{ transform: [{ scale: countPop }] }}>
            <Text
              style={[
                styles.countText,
                { fontSize: countFontSize, lineHeight: countFontSize * 1.14 },
              ]}
              numberOfLines={1}
            >
              {toArabicDigits(count)}
            </Text>
          </Animated.View>

          <Text style={styles.targetText}>
            {toArabicDigits(count)} <Text style={styles.targetSeparator}>من</Text> {toArabicDigits(target)}
          </Text>

          {isComplete && (
            <View style={styles.completeStatusBadge}>
              <Text style={styles.completeStatusText}>اكتمل الورد</Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
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
      backgroundColor: theme.ringInner,
      borderColor: theme.surfaceBorder,
      borderWidth: 1,
      justifyContent: 'center',
      padding: 8,
    },
    pressed: {
      backgroundColor: theme.surfaceElevated,
    },
    ripple: {
      borderColor: theme.warm,
      borderWidth: 1.6,
      position: 'absolute',
    },
    cyclePill: {
      alignItems: 'center',
      backgroundColor: theme.warmSurface,
      borderColor: theme.warmBorder,
      borderRadius: 14,
      flexDirection: 'row',
      gap: 5,
      marginBottom: 7,
      paddingHorizontal: 11,
      paddingVertical: 4,
    },
    cycleDot: {
      backgroundColor: theme.warm,
      borderRadius: 4,
      height: 5,
      width: 5,
    },
    cyclePillText: {
      color: theme.warm,
      fontSize: 11,
      fontWeight: '800',
    },
    countText: {
      color: theme.warmBright,
      fontWeight: '800',
      includeFontPadding: false,
      letterSpacing: -1.5,
      textAlign: 'center',
      ...Platform.select({
        ios: {
          textShadowColor: theme.trackGlow,
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 9,
        },
        android: {},
      }),
    },
    targetText: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: '600',
      marginTop: 7,
    },
    targetSeparator: {
      color: theme.textDim,
      fontSize: 12,
      fontWeight: '500',
    },
    completeStatusBadge: {
      backgroundColor: theme.successSurface,
      borderColor: theme.successBorder,
      borderRadius: 10,
      borderWidth: 1,
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    completeStatusText: {
      color: theme.success,
      fontSize: 10.5,
      fontWeight: '800',
    },
  });
}
