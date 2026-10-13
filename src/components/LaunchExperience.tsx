import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, Animated, AppState, Easing, Image, Platform,
  Pressable, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SAPPHIRE = '#0B132B';
const GOLD = '#F0CF91';
const IMAGE_SIZE = 240;
// Same coordinates as splash-emblem.svg, centered on the native icon canvas.
const BEADS = [
  [512, 276], [630, 308], [716, 394], [748, 512],
  [716, 630], [630, 716], [512, 748], [394, 716],
  [308, 630], [276, 512], [308, 394], [394, 308],
];

type Props = { ready: boolean; dismissed: boolean };

/** Decoration over an already laid-out, interactive home; never a loading gate. */
export function LaunchExperience({ ready, dismissed }: Props) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  // Unknown/failed preference means static, rather than risking unwanted motion.
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const started = useRef(false);
  const skipped = useRef(false);
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [opacity] = useState(() => new Animated.Value(1));
  const [emblem] = useState(() => new Animated.Value(0.82));
  const [glow] = useState(() => new Animated.Value(0));
  const [word] = useState(() => new Animated.Value(0));
  const [beads] = useState(() => BEADS.map(() => new Animated.Value(0)));

  const finish = useCallback(() => {
    skipped.current = true;
    const running = animation.current;
    animation.current = null;
    if (watchdog.current) clearTimeout(watchdog.current);
    try { running?.stop(); } catch { /* Static fallback still dismisses. */ }
    opacity.setValue(0);
    setVisible(false);
  }, [opacity]);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => { if (active) setReduceMotion(value); },
      () => { if (active) setReduceMotion(true); },
    );
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      setReduceMotion(value);
      if (value && started.current) finish();
    });
    const appState = AppState.addEventListener('change', (value) => {
      setForeground(value === 'active');
      // Also dismiss before readiness if a launch was interrupted. No replay.
      if (value !== 'active') finish();
    });
    return () => {
      active = false;
      motion.remove();
      appState.remove();
      if (watchdog.current) clearTimeout(watchdog.current);
      animation.current?.stop();
    };
  }, [finish]);

  useEffect(() => {
    if (dismissed) {
      skipped.current = true;
      animation.current?.stop();
    }
  }, [dismissed]);

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    // Home's onLayout has fired with theme + counter restored. No animation or
    // image decode is awaited by the native handoff, even on slow devices.
    SplashScreen.hideAsync().catch(() => undefined);
    if (skipped.current || reduceMotion !== false || !foreground || !imageReady || imageFailed) {
      opacity.setValue(0);
      queueMicrotask(finish);
      return;
    }
    const timing = (value: Animated.Value, toValue: number, duration: number, delay = 0) =>
      Animated.timing(value, {
        toValue, duration, delay, easing: Easing.inOut(Easing.quad),
        useNativeDriver: true, isInteraction: false,
      });
    try {
      animation.current = Animated.parallel([
        timing(emblem, 1, 200),
        timing(glow, 1, 380, 100),
        ...beads.map((value, index) => timing(value, 1, 140, 60 + index * 28)),
        timing(word, 1, 240, 260),
        timing(opacity, 0, 180, 640),
      ]);
      animation.current.start(({ finished }) => { if (finished) finish(); });
    } catch {
      opacity.setValue(0);
      queueMicrotask(finish);
    }
    // Bound the decoration if native animation completion is lost. This never
    // delays the home or its input; it only removes the non-blocking overlay.
    watchdog.current = setTimeout(finish, 1000);
  }, [beads, emblem, finish, foreground, glow, imageFailed, imageReady, opacity, ready, reduceMotion, word]);

  if (!visible || dismissed) return null;

  return (
    <Animated.View pointerEvents="box-none" style={[styles.overlay, { opacity }]}>
      <StatusBar style="light" />
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.artwork}
      >
        <View style={styles.emblemFrame}>
          <Animated.View style={[styles.glow, { opacity: glow }]}>
            <View style={styles.glowCore} />
          </Animated.View>
          <Animated.View style={{ opacity: emblem }}>
            <Image
              source={require('../../assets/splash-emblem.png')}
              style={styles.emblem}
              resizeMode="contain"
              fadeDuration={0}
              onLoad={() => setImageReady(true)}
              onError={() => { setImageFailed(true); setImageReady(true); }}
            />
          </Animated.View>
          {BEADS.map(([x, y], index) => (
            <Animated.View
              key={index}
              style={[styles.bead, {
                left: x * IMAGE_SIZE / 1024 - 7,
                top: y * IMAGE_SIZE / 1024 - 7,
                opacity: beads[index],
                transform: [{ scale: beads[index].interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
              }]}
            />
          ))}
          <Animated.View style={[styles.word, {
            opacity: word,
            transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [5, 0] }) }],
          }]}>
            <Text style={styles.title}>ذِكْر</Text>
          </Animated.View>
        </View>
      </View>
      {ready && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="تخطي المقدمة"
          hitSlop={12}
          onPress={finish}
          style={[styles.skip, { bottom: insets.bottom + 16 }]}
        >
          <Text style={styles.skipText}>تخطي</Text>
        </Pressable>
      )}
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
