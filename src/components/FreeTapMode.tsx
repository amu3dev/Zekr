import { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { toArabicDigits } from '../arabic';
import type { DhikrOption } from '../counter';
import { useTheme } from '../theme';
import type { ThemeTokens } from '../theme';
import { CloseIcon, NextCycleIcon } from './Icons';

const VIEWBOX = 320;
const CENTER = VIEWBOX / 2;
const RADIUS = 118;
const STROKE = 7;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Props = {
  count: number;
  target: number;
  cycle: number;
  dhikr: DhikrOption;
  effectsEnabled: boolean;
  topInset: number;
  bottomInset: number;
  onTap: () => void;
  onNextCycle: () => void;
  onExit: () => void;
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

function getPhraseStyle(phraseLength: number) {
  if (phraseLength > 180) return { fontSize: 15.5, lineHeight: 25 };
  if (phraseLength > 105) return { fontSize: 17.5, lineHeight: 28 };
  if (phraseLength > 65) return { fontSize: 20, lineHeight: 32 };
  return { fontSize: 23, lineHeight: 36 };
}

export function FreeTapMode({
  count,
  target,
  cycle,
  dhikr,
  effectsEnabled,
  topInset,
  bottomInset,
  onTap,
  onNextCycle,
  onExit,
}: Props) {
  const { height, width } = useWindowDimensions();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const reduceMotion = useReducedMotion();
  const [rippleAnim] = useState(() => new Animated.Value(0));
  const [countPulse] = useState(() => new Animated.Value(1));

  const isComplete = count >= target;
  const progress = Math.min(count / Math.max(target, 1), 1);
  const safeHeight = Math.max(360, height - topInset - bottomInset);
  const ringSize = Math.round(Math.max(194, Math.min(width - 48, 300, safeHeight * 0.42)));
  const countDigits = String(count).length;
  const countFontSize = ringSize * (countDigits <= 2 ? 0.25 : countDigits === 3 ? 0.21 : countDigits === 4 ? 0.17 : 0.13);
  const phraseStyle = getPhraseStyle(dhikr.phrase.length);
  const progressDashOffset = CIRCUMFERENCE * (1 - progress);

  useEffect(() => {
    if (reduceMotion || !effectsEnabled) {
      rippleAnim.stopAnimation();
      rippleAnim.setValue(0);
      countPulse.stopAnimation();
      countPulse.setValue(1);
    }
  }, [countPulse, effectsEnabled, reduceMotion, rippleAnim]);

  useEffect(
    () => () => {
      rippleAnim.stopAnimation();
      countPulse.stopAnimation();
    },
    [countPulse, rippleAnim],
  );

  const runTapFeedback = () => {
    if (reduceMotion || !effectsEnabled) return;

    rippleAnim.stopAnimation();
    rippleAnim.setValue(0);
    Animated.timing(rippleAnim, {
      duration: 320,
      isInteraction: false,
      toValue: 1,
      useNativeDriver: true,
    }).start();

    countPulse.stopAnimation();
    countPulse.setValue(1.035);
    Animated.timing(countPulse, {
      duration: 140,
      isInteraction: false,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleTap = () => {
    onTap();
    runTapFeedback();
  };

  return (
    <View accessibilityViewIsModal style={styles.overlay}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="النقر الحر"
        accessibilityHint="اضغط في أي مكان لزيادة العدّ"
        accessibilityValue={{ text: `${toArabicDigits(count)} من ${toArabicDigits(target)}` }}
        onPress={handleTap}
        style={({ pressed }) => [styles.tapSurface, effectsEnabled && pressed && styles.tapSurfacePressed]}
      />

      <View pointerEvents="box-none" style={styles.hud}>
        <View
          accessible
          accessibilityLabel={`الذكر الحالي: ${dhikr.phrase}`}
          pointerEvents="none"
          style={[styles.phraseSection, { paddingTop: Math.max(16, topInset + 10) }]}
        >
          <Text style={styles.modeLabel}>النقر الحر</Text>
          <Text style={styles.dhikrTitle}>{dhikr.title}</Text>
          <Text
            adjustsFontSizeToFit
            allowFontScaling
            minimumFontScale={0.62}
            numberOfLines={10}
            style={[styles.dhikrPhrase, phraseStyle]}
          >
            {dhikr.phrase}
          </Text>
        </View>

        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={styles.counterSection}
        >
          <View style={[styles.progressRing, { height: ringSize, width: ringSize }]}>
            <View pointerEvents="none" style={styles.ringArtwork}>
              <Svg height={ringSize} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} width={ringSize}>
                <Defs>
                  <LinearGradient id="freeTapProgress" x1="0" x2="1" y1="0" y2="1">
                    <Stop offset="0%" stopColor={theme.warmBright} />
                    <Stop offset="58%" stopColor={theme.warm} />
                    <Stop offset="100%" stopColor={theme.warmDeep} />
                  </LinearGradient>
                </Defs>
                <Circle
                  cx={CENTER}
                  cy={CENTER}
                  fill="none"
                  r={RADIUS + 8}
                  stroke={theme.surfaceBorder}
                  strokeWidth={1}
                />
                <Circle
                  cx={CENTER}
                  cy={CENTER}
                  fill="none"
                  r={RADIUS}
                  stroke={theme.track}
                  strokeWidth={STROKE}
                />
                <Circle
                  cx={CENTER}
                  cy={CENTER}
                  fill="none"
                  r={RADIUS}
                  stroke={theme.trackGlow}
                  strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  strokeDashoffset={progressDashOffset}
                  strokeLinecap="round"
                  strokeWidth={STROKE + 6}
                  transform={`rotate(-90 ${CENTER} ${CENTER})`}
                />
                <Circle
                  cx={CENTER}
                  cy={CENTER}
                  fill="none"
                  r={RADIUS}
                  stroke="url(#freeTapProgress)"
                  strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  strokeDashoffset={progressDashOffset}
                  strokeLinecap="round"
                  strokeWidth={STROKE}
                  transform={`rotate(-90 ${CENTER} ${CENTER})`}
                />
              </Svg>
            </View>

            <Animated.View
              pointerEvents="none"
              style={[
                styles.ripple,
                {
                  height: ringSize * 0.66,
                  opacity: rippleAnim.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0.32, 0.14, 0],
                  }),
                  transform: [
                    {
                      scale: rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.2] }),
                    },
                  ],
                  width: ringSize * 0.66,
                },
              ]}
            />

            <Animated.View
              pointerEvents="none"
              style={[styles.counterCopy, { transform: [{ scale: countPulse }] }]}
            >
              <Text
                adjustsFontSizeToFit
                allowFontScaling
                minimumFontScale={0.65}
                numberOfLines={1}
                style={[styles.count, { fontSize: countFontSize, lineHeight: countFontSize * 1.1 }]}
              >
                {toArabicDigits(count)}
              </Text>
              <Text style={styles.progressText}>
                {toArabicDigits(count)} <Text style={styles.progressSeparator}>من</Text>{' '}
                {toArabicDigits(target)}
              </Text>
              <Text style={styles.cycleText}>الدورة {toArabicDigits(cycle)}</Text>
            </Animated.View>
          </View>
        </View>

        <View
          pointerEvents="box-none"
          style={[styles.bottomSection, { paddingBottom: Math.max(16, bottomInset + 12) }]}
        >
          {isComplete ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="بدء الدورة التالية"
              onPress={onNextCycle}
              style={({ pressed }) => [styles.nextCycleButton, pressed && styles.pressed]}
            >
              <Text style={styles.nextCycleText}>الدورة التالية</Text>
              <NextCycleIcon size={15} color={theme.onWarm} />
            </Pressable>
          ) : (
            <Text
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.tapHint}
            >
              المس أي مكان لزيادة العدّ
            </Text>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="إنهاء وضع النقر الحر"
            hitSlop={8}
            onPress={onExit}
            style={({ pressed }) => [styles.exitButton, pressed && styles.pressed]}
          >
            <CloseIcon size={15} color={theme.warm} />
            <Text style={styles.exitText}>إنهاء الوضع</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.background,
      zIndex: 100,
    },
    tapSurface: {
      ...StyleSheet.absoluteFill,
    },
    tapSurfacePressed: {
      backgroundColor: theme.warmSurface,
    },
    hud: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    phraseSection: {
      alignItems: 'center',
      flexShrink: 1,
      maxWidth: 440,
      width: '100%',
    },
    modeLabel: {
      color: theme.textDim,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    dhikrTitle: {
      color: theme.warm,
      fontSize: 13,
      fontWeight: '800',
      marginBottom: 10,
    },
    dhikrPhrase: {
      color: theme.text,
      fontWeight: '700',
      includeFontPadding: false,
      maxWidth: 420,
      textAlign: 'center',
      width: '100%',
    },
    counterSection: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      maxHeight: 340,
      minHeight: 194,
      width: '100%',
    },
    progressRing: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    ringArtwork: {
      ...StyleSheet.absoluteFill,
    },
    ripple: {
      borderColor: theme.warm,
      borderRadius: 999,
      borderWidth: 1.4,
      position: 'absolute',
    },
    counterCopy: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    count: {
      color: theme.warmBright,
      fontWeight: '800',
      includeFontPadding: false,
      letterSpacing: -1.5,
      textAlign: 'center',
    },
    progressText: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: '700',
      marginTop: 6,
    },
    progressSeparator: {
      color: theme.textDim,
      fontSize: 12,
      fontWeight: '500',
    },
    cycleText: {
      color: theme.textDim,
      fontSize: 11,
      marginTop: 7,
    },
    bottomSection: {
      alignItems: 'center',
      gap: 10,
      width: '100%',
    },
    tapHint: {
      color: theme.textDim,
      fontSize: 12,
    },
    nextCycleButton: {
      alignItems: 'center',
      backgroundColor: theme.warm,
      borderRadius: 18,
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 9,
    },
    nextCycleText: {
      color: theme.onWarm,
      fontSize: 12,
      fontWeight: '800',
    },
    exitButton: {
      alignItems: 'center',
      backgroundColor: theme.surfaceSoft,
      borderColor: theme.surfaceBorder,
      borderRadius: 22,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 7,
      paddingHorizontal: 20,
      paddingVertical: 11,
    },
    exitText: {
      color: theme.warm,
      fontSize: 13,
      fontWeight: '700',
    },
    pressed: {
      opacity: 0.72,
      transform: [{ scale: 0.98 }],
    },
  });
}
