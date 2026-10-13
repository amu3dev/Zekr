import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path, Polygon } from 'react-native-svg';

import { useReducedMotion } from '../hooks/useReducedMotion';

const SAPPHIRE = '#0B132B';
const GOLD = '#F0CF91';
const IMAGE_SIZE = 240;
const DURATION = 820;
// Same centered geometry as the native splash-emblem.svg; no JS image decode.
const BEADS = [
  [512, 276], [630, 308], [716, 394], [748, 512],
  [716, 630], [630, 716], [512, 748], [394, 716],
  [308, 630], [276, 512], [308, 394], [394, 308],
];

type Props = { ready: boolean; onFinish: () => void };

/** Home is already prepared. The first launch gesture only dismisses decoration. */
export function LaunchExperience({ ready, onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const readyAt = useRef<number | null>(null);
  const started = useRef(false);
  const completed = useRef(false);
  const pressing = useRef(false);
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [opacity] = useState(() => new Animated.Value(1));
  const [emblem] = useState(() => new Animated.Value(1));
  const [glow] = useState(() => new Animated.Value(0));
  const [word] = useState(() => new Animated.Value(0));
  const [beads] = useState(() => BEADS.map(() => new Animated.Value(0)));

  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    const running = animation.current;
    animation.current = null;
    if (watchdog.current) clearTimeout(watchdog.current);
    try { running?.stop(); } catch { /* Dismiss even if the animation driver fails. */ }
    opacity.setValue(0);
    onFinish();
  }, [onFinish, opacity]);

  const holdForSkip = () => {
    // Keep the same responder alive until finger-up, even if the intro would
    // otherwise finish mid-gesture and expose the home button underneath.
    pressing.current = true;
    if (watchdog.current) clearTimeout(watchdog.current);
    try { animation.current?.stop(); } catch { /* The press still skips. */ }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (value) => {
      setForeground(value === 'active');
      if (value !== 'active') finish();
    });
    return () => {
      completed.current = true;
      subscription.remove();
      if (watchdog.current) clearTimeout(watchdog.current);
      try { animation.current?.stop(); } catch { /* Already unmounted. */ }
    };
  }, [finish]);

  useEffect(() => {
    if (!ready || completed.current || pressing.current) return;
    if (readyAt.current === null) {
      readyAt.current = Date.now();
      // Native handoff is owned by home, independently of this bounded intro.
      watchdog.current = setTimeout(finish, DURATION + 80);
    }
    if (reduced === true) {
      opacity.setValue(0);
      queueMicrotask(finish);
      return;
    }
    // A delayed OS preference does not permanently skip the intro, extend its
    // deadline, or hold the native splash. No motion runs while it is unknown.
    if (reduced === null || !foreground || started.current) return;
    started.current = true;
    const remaining = Math.max(0, DURATION - (Date.now() - readyAt.current));
    const scale = remaining / DURATION;
    const timing = (value: Animated.Value, toValue: number, duration: number, delay = 0) =>
      Animated.timing(value, {
        toValue, duration: duration * scale, delay: delay * scale,
        easing: Easing.inOut(Easing.quad), useNativeDriver: true, isInteraction: false,
      });
    try {
      emblem.setValue(0.82);
      animation.current = remaining <= 180
        ? Animated.timing(opacity, { toValue: 0, duration: remaining, useNativeDriver: true, isInteraction: false })
        : Animated.parallel([
          timing(emblem, 1, 200),
          timing(glow, 1, 380, 100),
          ...beads.map((value, index) => timing(value, 1, 140, 60 + index * 28)),
          timing(word, 1, 240, 260),
          timing(opacity, 0, 180, 640),
        ]);
      animation.current.start(({ finished }) => { if (finished) finish(); });
    } catch {
      // An unavailable emblem sequence can still dissolve into the saved theme.
      try {
        animation.current = Animated.timing(opacity, {
          toValue: 0, duration: Math.min(180, remaining), useNativeDriver: true, isInteraction: false,
        });
        animation.current.start(({ finished }) => { if (finished) finish(); });
      } catch {
        opacity.setValue(0);
        queueMicrotask(finish);
      }
    }
  }, [beads, emblem, finish, foreground, glow, opacity, ready, reduced, word]);

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <StatusBar style="light" />
      <Pressable
        disabled={!ready}
        accessibilityRole="button"
        accessibilityLabel="تخطي المقدمة"
        accessibilityHint="يفتح العداد دون تغيير عدد التسبيحات"
        onPressIn={holdForSkip}
        onPressOut={() => { pressing.current = false; watchdog.current = setTimeout(finish, 80); }}
        onPress={finish}
        style={{ flex: 1 }}
      >
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.artwork}>
          <View style={styles.emblemFrame}>
            <Animated.View style={[styles.glow, { opacity: glow }]}><View style={styles.glowCore} /></Animated.View>
            <Animated.View style={{ opacity: emblem }}>
              <Svg width={IMAGE_SIZE} height={IMAGE_SIZE} viewBox="0 0 1024 1024">
                <Circle cx="512" cy="512" r="236" fill="none" stroke="#5369AD" strokeWidth="12" opacity="0.82" />
                <Path d="M512 276v20M748 512h-20M512 748v-20M276 512h20" stroke={GOLD} strokeWidth="8" strokeLinecap="round" opacity="0.9" />
                <G fill={GOLD} stroke="#FFE9B9" strokeWidth="5">
                  {BEADS.map(([x, y], index) => <Circle key={index} cx={x} cy={y} r="27" />)}
                </G>
                <G transform="translate(0 88)">
                  <Polygon points="512,298 541,360 601,335 576,396 638,424 576,452 601,513 541,488 512,550 483,488 423,513 448,452 386,424 448,396 423,335 483,360" fill={SAPPHIRE} stroke={GOLD} strokeWidth="10" strokeLinejoin="round" />
                  <Circle cx="512" cy="424" r="24" fill={GOLD} stroke="#FFE9B9" strokeWidth="6" />
                </G>
              </Svg>
            </Animated.View>
            {BEADS.map(([x, y], index) => (
              <Animated.View key={index} style={[styles.bead, {
                left: x * IMAGE_SIZE / 1024 - 7, top: y * IMAGE_SIZE / 1024 - 7,
                opacity: beads[index],
                transform: [{ scale: beads[index].interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
              }]} />
            ))}
            <Animated.View style={[styles.word, {
              opacity: word,
              transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [5, 0] }) }],
            }]}><Text style={styles.title}>ذِكْر</Text></Animated.View>
          </View>
        </View>
        {ready && <View pointerEvents="none" style={[styles.skip, { bottom: insets.bottom + 16 }]}><Text style={styles.skipText}>تخطي</Text></View>}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: SAPPHIRE, zIndex: 100 },
  artwork: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emblemFrame: { width: IMAGE_SIZE, height: IMAGE_SIZE },
  emblem: { width: IMAGE_SIZE, height: IMAGE_SIZE },
  glow: { position: 'absolute', left: 76, top: 76, width: 88, height: 88, borderRadius: 44, backgroundColor: '#F0CF9108', alignItems: 'center', justifyContent: 'center' },
  glowCore: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#F0CF910A' },
  bead: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFE9B9', borderWidth: 2, borderColor: GOLD },
  word: { position: 'absolute', top: 196, left: -40, right: -40, alignItems: 'center' },
  title: { color: '#F7F3E9', fontSize: 42, lineHeight: 68, fontWeight: '600', textAlign: 'center', writingDirection: 'rtl', fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : 'serif' },
  skip: { position: 'absolute', alignSelf: 'center', minHeight: 48, minWidth: 72, alignItems: 'center', justifyContent: 'center' },
  skipText: { color: '#C0C8E0', fontSize: 14, writingDirection: 'rtl' },
});
