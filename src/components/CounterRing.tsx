import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { getCycleText, toArabicDigits } from '../arabic';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { getActiveBeadCount, getBeadCycle, TOTAL_BEADS } from '../beads';
import { getMilestoneProgress } from '../counter';
import type { RoutineProgress } from '../routines';
import { useTheme } from '../theme';
import type { ThemeTokens } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const VIEWBOX = 360;
const CENTER = VIEWBOX / 2;
const RADIUS = 157;
const STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const BEAD_RADIUS = 139;
const BEAD_SIZE = 7.2;

type Props = {
  size: number;
  count: number;
  target: number;
  title: string;
  completion: string | null;
  effectsEnabled: boolean;
  disabled?: boolean;
  guided?: RoutineProgress;
  decorative?: boolean;
  onPress: () => void;
};


export function CounterRing({ size, count, target, title, completion, effectsEnabled, disabled, guided, decorative, onPress }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const reduceMotion = useReducedMotion() !== false || !effectsEnabled;
  const { activeMilestone, intervalCount, progress } = guided
    ? { activeMilestone: target, intervalCount: count, progress: count / target }
    : getMilestoneProgress(count, target);
  const countingDisabled = disabled || guided?.completed;
  const cycle = getBeadCycle(count);
  const [pressScale] = useState(() => new Animated.Value(1));
  const [rippleAnim] = useState(() => new Animated.Value(0));
  const [progressAnim] = useState(() => new Animated.Value(progress));
  const previousInterval = useRef({ activeMilestone, target });

  useEffect(() => {
    const intervalChanged = previousInterval.current.activeMilestone !== activeMilestone ||
      previousInterval.current.target !== target;
    previousInterval.current = { activeMilestone, target };
    if (reduceMotion || intervalChanged) {
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
  }, [activeMilestone, target, progress, progressAnim, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      pressScale.stopAnimation();
      pressScale.setValue(1);
      rippleAnim.stopAnimation();
      rippleAnim.setValue(0);
    }
    return () => {
      pressScale.stopAnimation();
      rippleAnim.stopAnimation();
    };
  }, [reduceMotion, pressScale, rippleAnim]);

  const runPressAnimation = () => {
    if (reduceMotion) return;
    pressScale.stopAnimation();
    Animated.spring(pressScale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 40,
      bounciness: 3,
    }).start();
  };

  const runReleaseAnimation = () => {
    if (reduceMotion) return;
    pressScale.stopAnimation();
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 130,
    }).start();
  };

  const handlePress = () => {
    if (!reduceMotion) {
      rippleAnim.stopAnimation();
      rippleAnim.setValue(0);
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }).start();
    }

    onPress();
  };

  // The bead loop is always 33 taps; the goal arc remains an independent view
  // of progress within the current milestone interval.
  const activeBeads = getActiveBeadCount(count);
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
  const countFontSize = size * (digits <= 2 ? 0.23 : digits === 3 ? 0.19 : Math.min(0.15, 0.54 / (digits * 0.8)));
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
          r={120}
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
            <G key={bead.id} opacity={bead.isActive ? 1 : (theme.beadInactiveOpacity ?? 0.52)}>
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
                stroke={theme.beadOutline ?? (bead.isActive ? theme.warmBright : theme.accentMuted)}
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
            ],
          },
        ]}
      >
        <Pressable
          accessible={!decorative}
          accessibilityRole={decorative ? undefined : 'button'}
          accessibilityLabel={decorative ? undefined : `عدّاد ${title}`}
          accessibilityValue={{ text: guided
            ? `المرحلة ${toArabicDigits(guided.stepIndex + 1)} من ${toArabicDigits(guided.routine.steps.length)}، ${toArabicDigits(count)} من ${toArabicDigits(target)}، التقدم الكلي ${toArabicDigits(guided.overall)} من ${toArabicDigits(guided.routine.total)}`
            : `${toArabicDigits(count)} تسبيحة، ${toArabicDigits(count)} من ${toArabicDigits(activeMilestone)} في الهدف الحالي` }}
          accessibilityHint={`اضغط للتسبيح، ${getCycleText(cycle)}، ${toArabicDigits(getActiveBeadCount(count))} من ٣٣ حبة، تقدّم الحلقة في الفترة الحالية: ${toArabicDigits(intervalCount)} من ${toArabicDigits(target)}`}
          accessibilityState={{ disabled: countingDisabled }}
          disabled={countingDisabled || decorative}
          onPressIn={runPressAnimation}
          onPressOut={runReleaseAnimation}
          onPress={handlePress}
          style={({ pressed }) => [
            styles.touchArea,
            { width: size * 0.64, height: size * 0.64, borderRadius: size * 0.32 },
            pressed && styles.pressed,
          ]}
        >
          <View pointerEvents="none" style={styles.cycleBadgeSlot}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.cyclePill}>
              <View style={styles.cycleDot} />
              <Text numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.25} style={styles.cyclePillText}>{getCycleText(cycle)}</Text>
            </View>
          </View>

          {/* A bounded slot lets native auto-fit use both width and height. The
              numeral run stays untransformed so Android fallback glyphs are stable. */}
          <View style={{ width: size * 0.64 - 18, height: '43%', top: '28%', position: 'absolute', direction: 'ltr' }}>
            <Text
              style={[
                styles.countText,
                { fontSize: countFontSize, width: '100%', height: '100%' },
              ]}
              testID="central-counter-text"
              maxFontSizeMultiplier={1.3}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {toArabicDigits(count)}
            </Text>
          </View>

          <Text numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.3} style={styles.targetText}>
            {toArabicDigits(count)} <Text style={styles.targetSeparator}>من</Text> {toArabicDigits(activeMilestone)}
          </Text>

          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.completionSlot}>
            <Text numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.3} style={styles.completeStatusText}>{completion ?? ' '}</Text>
          </View>
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
    cycleBadgeSlot: {
      position: 'absolute',
      top: '8.5%',
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cyclePill: {
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      backgroundColor: theme.warmSurface,
      borderColor: theme.warmBorder,
      borderWidth: 1,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 3,
      maxWidth: '68%',
    },
    cycleDot: {
      backgroundColor: theme.warm,
      borderRadius: 3,
      height: 5,
      width: 5,
      flexShrink: 0,
    },
    cyclePillText: {
      flexShrink: 1,
      minWidth: 0,
      textAlign: 'center',
      textAlignVertical: 'center',
      color: theme.warm,
      fontSize: 11,
      fontWeight: '700',
      includeFontPadding: false,
    },
    countText: {
      color: theme.warmBright,
      fontWeight: '800',
      includeFontPadding: true,
      letterSpacing: 0,
      textAlignVertical: 'center',
      writingDirection: 'ltr',
      textAlign: 'center',
      ...Platform.select({
        ios: {
          textShadowColor: theme.trackGlow,
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 9,
        },
        android: { fontFamily: 'sans-serif' },
      }),
    },
    targetText: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: '600',
      position: 'absolute',
      bottom: '14%',
      height: '13%',
      textAlignVertical: 'center',
      textAlign: 'center',
      width: '100%',
    },
    targetSeparator: {
      color: theme.textDim,
      fontSize: 12,
      fontWeight: '500',
    },
    completionSlot: {
      position: 'absolute',
      bottom: '3%',
      height: '9%',
      width: '90%',
      justifyContent: 'center',
    },
    completeStatusText: {
      height: '100%',
      textAlign: 'center',
      textAlignVertical: 'center',
      color: theme.success,
      fontSize: 10.5,
      fontWeight: '800',
    },
  });
}
