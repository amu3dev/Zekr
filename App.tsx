import { isRunningInExpoGo } from 'expo';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  AppState,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { toArabicDigits } from './src/arabic';
import { CounterRing } from './src/components/CounterRing';
import { FreeTapMode } from './src/components/FreeTapMode';
import { LaunchExperience } from './src/components/LaunchExperience';
import {
  BookIcon,
  ChevronDownIcon,
  FullScreenIcon,
  MenuIcon,
  ResetIcon,
  RosetteClasp,
  SettingsIcon,
  SparkleIcon,
  UndoIcon,
} from './src/components/Icons';
import { IslamicGeometryBackground } from './src/components/IslamicGeometry';
import {
  ConfirmModal,
  CustomTargetModal,
  DhikrPickerModal,
  SettingsModal,
} from './src/components/Modals';
import {
  counterReducer,
  type CounterAction,
  DhikrOption,
  getDhikr,
  getMilestoneProgress,
  initialCounterState,
  PRESET_TARGETS,
} from './src/counter';
import { ThemeProvider } from './src/ThemeProvider';
import { useTheme } from './src/theme';
import type { ThemeTokens } from './src/theme';
import { loadCounterState, saveCounterState } from './src/storage';

// Keep the native Midnight Sapphire launch identity in place until both the
// persisted theme and the counter state are ready to render the first frame.
// All motion lives in the skippable JS layer, including reduced-motion handling.
// Expo Go owns its native splash and does not support custom exit options.
if ((Platform.OS === 'android' || Platform.OS === 'ios') && !isRunningInExpoGo()) {
  SplashScreen.setOptions({ duration: 0, fade: false });
}
SplashScreen.preventAutoHideAsync().catch(() => undefined);

type OpenModal =
  | 'settings'
  | 'customTarget'
  | 'dhikrPicker'
  | 'resetConfirm'
  | 'resetStatsConfirm'
  | null;

function playHaptic(kind: 'tap' | 'success' | 'warning', enabled: boolean) {
  if (!enabled) return;
  if (kind === 'success') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  } else if (kind === 'warning') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }
}

function CounterScreen() {
  const { isReady: isThemeReady, theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [state, dispatch] = useReducer(counterReducer, initialCounterState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHomeLaidOut, setIsHomeLaidOut] = useState(false);
  const [launchVisible, setLaunchVisible] = useState(true);
  const finishLaunch = useCallback(() => setLaunchVisible(false), []);
  const nativeHidden = useRef(false);
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [pendingDhikr, setPendingDhikr] = useState<DhikrOption | null>(null);

  const [completion, setCompletion] = useState<string | null>(null);
  const stateRef = useRef(state);
  // Track queued actions with the same reducer, so feedback and background
  // flushes see every tap even before React commits a batch.
  const dispatchCounter = useCallback((action: CounterAction) => {
    setCompletion(null);
    const next = counterReducer(stateRef.current, action);
    stateRef.current = next;
    dispatch(action);
    return next;
  }, []);

  useEffect(() => {
    if (!completion) return;
    const timer = setTimeout(() => setCompletion(null), 900);
    return () => clearTimeout(timer);
  }, [completion]);

  useEffect(() => {
    loadCounterState().then((saved) => {
      if (saved) dispatchCounter({ type: 'restore', state: saved });
      setIsLoaded(true);
    });
  }, [dispatchCounter]);

  useEffect(() => {
    if (isLoaded && isThemeReady && isHomeLaidOut && !nativeHidden.current) {
      nativeHidden.current = true;
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [isHomeLaidOut, isLoaded, isThemeReady]);

  // Debounce writes to AsyncStorage to prevent disk thrashing on rapid taps.
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      void saveCounterState(state);
    }, 400);
    return () => clearTimeout(timer);
  }, [isLoaded, state]);

  // Flush the latest state when the app leaves the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState.match(/inactive|background/) && isLoaded) {
        void saveCounterState(stateRef.current);
      }
    });
    return () => subscription.remove();
  }, [isLoaded]);

  const dhikr = getDhikr(state.dhikrId);
  const isPresetTarget = (PRESET_TARGETS as readonly number[]).includes(state.target);
  const availableHeight = height - insets.top - insets.bottom;
  const ringSize = Math.round(Math.max(200, Math.min(width - 28, availableHeight * 0.44, 350)));
  const geometrySize = ringSize * 1.16;
  const canUndo = state.count > 0;

  const handleIncrement = () => {
    const previousCount = stateRef.current.count;
    const next = dispatchCounter({ type: 'increment' });
    if (next.count === previousCount) return;
    const { isMilestone, activeMilestone } = getMilestoneProgress(next.count, next.target);
    // A one-count goal completes on every tap; keep its feedback quiet.
    const celebrate = isMilestone && next.target > 1;
    if (celebrate) {
      const message = `اكتمل الهدف ${toArabicDigits(activeMilestone)}`;
      setCompletion(message);
      AccessibilityInfo.announceForAccessibility(message);
    }
    playHaptic(celebrate ? 'success' : 'tap', next.hapticsEnabled);
  };

  const handleUndo = () => {
    if (!canUndo) return;
    dispatchCounter({ type: 'undo' });
    playHaptic('tap', state.hapticsEnabled);
  };

  const handleSelectDhikr = (option: DhikrOption) => {
    if (option.id === state.dhikrId) {
      setOpenModal(null);
      return;
    }
    if (state.count > 0) {
      setPendingDhikr(option);
      setOpenModal('resetConfirm');
    } else {
      dispatchCounter({ type: 'setDhikr', dhikrId: option.id });
      setOpenModal(null);
    }
  };

  const handleConfirmReset = () => {
    if (pendingDhikr) {
      dispatchCounter({ type: 'setDhikr', dhikrId: pendingDhikr.id });
      setPendingDhikr(null);
    } else {
      dispatchCounter({ type: 'reset' });
    }
    setOpenModal(null);
  };

  const handleExitFullScreenTap = () => {
    dispatchCounter({ type: 'setFullScreenTap', enabled: false });
    playHaptic('tap', state.hapticsEnabled);
  };

  return (
    <LinearGradient
      colors={[theme.backgroundStart, theme.backgroundMid, theme.backgroundEnd]}
      locations={[0, 0.52, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.screen}
    >
      <StatusBar style={theme.statusBarStyle} />
      <View pointerEvents="none" style={styles.backgroundOrb} />

      {isLoaded && isThemeReady && (
        <View
          accessibilityElementsHidden={launchVisible}
          importantForAccessibility={launchVisible ? 'no-hide-descendants' : 'auto'}
          onLayout={() => setIsHomeLaidOut(true)}
          style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        >
          <View
            accessibilityElementsHidden={state.fullScreenTap}
            importantForAccessibility={state.fullScreenTap ? 'no-hide-descendants' : 'auto'}
            style={styles.topBar}
          >
            <View style={styles.headerSpacer} />
            <View style={styles.titleSection}>
              <Text style={styles.appTitle} accessibilityRole="header">
                ذِكْر
              </Text>
              <Text style={styles.appSubtitle}>وردك في سكينة</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="القائمة والإعدادات"
              hitSlop={8}
              onPress={() => setOpenModal('settings')}
              style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
            >
              <MenuIcon size={20} color={theme.warm} />
            </Pressable>
          </View>

          <ScrollView
            accessibilityElementsHidden={state.fullScreenTap}
            bounces={false}
            contentContainerStyle={styles.scrollContainer}
            importantForAccessibility={state.fullScreenTap ? 'no-hide-descendants' : 'auto'}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.scrollContent}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`الذكر الحالي: ${dhikr.phrase}، اضغط لتغيير الذكر`}
                onPress={() => setOpenModal('dhikrPicker')}
                style={({ pressed }) => [styles.dhikrCard, pressed && styles.pressed]}
              >
                <View style={styles.rosetteWrapper} pointerEvents="none">
                  <RosetteClasp size={28} />
                </View>

                <View style={styles.dhikrCardTop}>
                  <View style={styles.dhikrCategoryBadge}>
                    <Text style={styles.dhikrCategoryText}>{dhikr.category}</Text>
                  </View>
                  <View style={styles.changeDhikrHint}>
                    <Text style={styles.changeDhikrText}>تغيير الذكر</Text>
                    <ChevronDownIcon size={13} color={theme.warm} />
                  </View>
                </View>

                <Text style={[styles.dhikrPhraseText, dhikr.phrase.length > 80 && styles.dhikrPhraseLong]}>
                  {dhikr.phrase}
                </Text>

                {dhikr.virtue ? (
                  <View style={styles.virtueSnippet}>
                    <SparkleIcon size={12} color={theme.warm} />
                    <Text style={styles.virtueSnippetText} numberOfLines={1}>
                      {dhikr.virtue}
                    </Text>
                  </View>
                ) : null}
              </Pressable>

              <View style={styles.ringSection}>
                <View pointerEvents="none" style={styles.geometryWrapper}>
                  <IslamicGeometryBackground size={geometrySize} opacity={0.72} />
                </View>
                <CounterRing
                  size={ringSize}
                  count={state.count}
                  target={state.target}
                  title={dhikr.title}
                  completion={completion}
                  effectsEnabled={state.visualEffectsEnabled}
                  onPress={handleIncrement}
                />
              </View>

              <View style={styles.targetSection} accessibilityRole="radiogroup" accessibilityLabel="الهدف">
                <View style={styles.targetHeading}>
                  <Text style={styles.targetTitle}>الهدف</Text>
                  <Text style={styles.targetHint}>اختر مقدار الورد</Text>
                </View>
                <View style={styles.targetRow}>
                  {PRESET_TARGETS.map((target) => {
                    const isSelected = state.target === target;
                    return (
                      <Pressable
                        key={target}
                        accessibilityRole="radio"
                        accessibilityLabel={`الهدف ${toArabicDigits(target)}`}
                        accessibilityState={{ checked: isSelected }}
                        onPress={() => {
                          dispatchCounter({ type: 'setTarget', target });
                          playHaptic('tap', state.hapticsEnabled);
                        }}
                        style={({ pressed }) => [
                          styles.targetChip,
                          isSelected && styles.targetChipSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.targetChipText, isSelected && styles.targetChipTextSelected]}>
                          {toArabicDigits(target)}
                        </Text>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    accessibilityRole="radio"
                    accessibilityLabel={
                      isPresetTarget
                        ? 'هدف مخصص'
                        : `هدف مخصص، الحالي ${toArabicDigits(state.target)}`
                    }
                    accessibilityState={{ checked: !isPresetTarget }}
                    onPress={() => setOpenModal('customTarget')}
                    style={({ pressed }) => [
                      styles.targetChip,
                      styles.customChip,
                      !isPresetTarget && styles.targetChipSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.targetChipText, !isPresetTarget && styles.targetChipTextSelected]}>
                      {!isPresetTarget ? `${toArabicDigits(state.target)} ✎` : 'مخصص'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.bottomDock}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="تراجع"
                  accessibilityState={{ disabled: !canUndo }}
                  disabled={!canUndo}
                  onPress={handleUndo}
                  style={({ pressed }) => [styles.dockItem, !canUndo && styles.disabled, pressed && styles.pressed]}
                >
                  <UndoIcon size={19} color={canUndo ? theme.iconAccent : theme.textFaint} />
                  <Text style={[styles.dockItemLabel, !canUndo && styles.disabledText]}>تراجع</Text>
                </Pressable>

                <View style={styles.dockDivider} />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="إعادة تعيين"
                  accessibilityState={{ disabled: !canUndo }}
                  disabled={!canUndo}
                  onPress={() => setOpenModal('resetConfirm')}
                  style={({ pressed }) => [styles.dockItem, !canUndo && styles.disabled, pressed && styles.pressed]}
                >
                  <ResetIcon size={19} color={canUndo ? theme.iconAccent : theme.textFaint} />
                  <Text style={[styles.dockItemLabel, !canUndo && styles.disabledText]}>إعادة تعيين</Text>
                </Pressable>

                <View style={styles.dockDivider} />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="مكتبة الأذكار"
                  onPress={() => setOpenModal('dhikrPicker')}
                  style={({ pressed }) => [styles.dockItem, pressed && styles.pressed]}
                >
                  <BookIcon size={19} color={theme.iconAccent} />
                  <Text style={styles.dockItemLabel}>الأذكار</Text>
                </Pressable>

                <View style={styles.dockDivider} />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="النقر الحر"
                  onPress={() => {
                    dispatchCounter({ type: 'setFullScreenTap', enabled: true });
                    playHaptic('tap', state.hapticsEnabled);
                  }}
                  style={({ pressed }) => [styles.dockItem, pressed && styles.pressed]}
                >
                  <FullScreenIcon size={19} color={theme.iconAccent} />
                  <Text style={styles.dockItemLabel}>النقر الحر</Text>
                </Pressable>

                <View style={styles.dockDivider} />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="الإعدادات"
                  onPress={() => setOpenModal('settings')}
                  style={({ pressed }) => [styles.dockItem, pressed && styles.pressed]}
                >
                  <SettingsIcon size={19} color={theme.iconAccent} />
                  <Text style={styles.dockItemLabel}>الإعدادات</Text>
                </Pressable>
              </View>

              <Text style={styles.privacyNote}>بياناتك محفوظة على جهازك فقط</Text>
            </View>
          </ScrollView>

          {state.fullScreenTap ? (
            <FreeTapMode
              bottomInset={insets.bottom}
              count={state.count}
              completion={completion}
              dhikr={dhikr}
              effectsEnabled={state.visualEffectsEnabled}
              onExit={handleExitFullScreenTap}
              onTap={handleIncrement}
              target={state.target}
              topInset={insets.top}
            />
          ) : null}
        </View>
      )}

      <DhikrPickerModal
        visible={openModal === 'dhikrPicker'}
        selectedId={state.dhikrId}
        onClose={() => setOpenModal(null)}
        onSelect={handleSelectDhikr}
      />

      <CustomTargetModal
        visible={openModal === 'customTarget'}
        currentTarget={state.target}
        onClose={() => setOpenModal(null)}
        onSave={(target) => {
          dispatchCounter({ type: 'setTarget', target });
          setOpenModal(null);
        }}
      />

      <SettingsModal
        visible={openModal === 'settings'}
        hapticsEnabled={state.hapticsEnabled}
        visualEffectsEnabled={state.visualEffectsEnabled}
        fullScreenTap={state.fullScreenTap}
        totalSessionCount={state.totalSessionCount}
        onClose={() => setOpenModal(null)}
        onToggleHaptics={(enabled) => dispatchCounter({ type: 'setHaptics', enabled })}
        onToggleVisualEffects={(enabled) => dispatchCounter({ type: 'setVisualEffects', enabled })}
        onToggleFullScreenTap={(enabled) => dispatchCounter({ type: 'setFullScreenTap', enabled })}
        onResetStats={() => setOpenModal('resetStatsConfirm')}
      />

      <ConfirmModal
        visible={openModal === 'resetStatsConfirm'}
        title="تصفير الإحصائيات"
        message="سيؤدي هذا الإجراء إلى حذف إجمالي التسبيحات والعداد نهائيًا. هل تريد المتابعة؟"
        confirmLabel="نعم، حذف وتصفير"
        onClose={() => setOpenModal('settings')}
        onConfirm={() => {
          dispatchCounter({ type: 'resetAll' });
          playHaptic('warning', state.hapticsEnabled);
          setOpenModal('settings');
        }}
      />

      <ConfirmModal
        visible={openModal === 'resetConfirm'}
        title={pendingDhikr ? 'تغيير الذكر' : 'إعادة ضبط العداد'}
        message={
          pendingDhikr
            ? `الانتقال إلى "${pendingDhikr.title}" سيُعيد العداد إلى الصفر. هل تريد المتابعة؟`
            : 'سيُعاد عداد الجلسة الحالية إلى الصفر. هل تريد المتابعة؟'
        }
        confirmLabel={pendingDhikr ? 'تغيير وبدء جديد' : 'نعم، ابدأ من جديد'}
        onClose={() => {
          setPendingDhikr(null);
          setOpenModal(null);
        }}
        onConfirm={handleConfirmReset}
      />
      {launchVisible && (
        <LaunchExperience
          ready={isLoaded && isThemeReady && isHomeLaidOut}
          onFinish={finishLaunch}
        />
      )}
    </LinearGradient>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <CounterScreen />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    screen: {
      backgroundColor: theme.background,
      flex: 1,
    },
    backgroundOrb: {
      backgroundColor: theme.accent,
      borderRadius: 180,
      height: 260,
      opacity: 0.08,
      position: 'absolute',
      right: -120,
      top: -100,
      width: 260,
    },
    root: {
      direction: 'rtl',
      flex: 1,
    },
    topBar: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 9,
      zIndex: 20,
    },
    headerSpacer: {
      height: 42,
      width: 42,
    },
    menuButton: {
      alignItems: 'center',
      backgroundColor: theme.surfaceSoft,
      borderColor: theme.surfaceBorder,
      borderRadius: 21,
      borderWidth: 1,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    titleSection: {
      alignItems: 'center',
    },
    appTitle: {
      color: theme.text,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
      ...Platform.select({
        ios: {
          textShadowColor: theme.warmSurface,
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 8,
        },
        android: {},
      }),
    },
    appSubtitle: {
      color: theme.textDim,
      fontSize: 10.5,
      marginTop: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingBottom: 12,
    },
    scrollContent: {
      alignItems: 'center',
      flexGrow: 1,
      gap: 15,
      paddingHorizontal: 18,
      paddingTop: 11,
      width: '100%',
    },
    dhikrCard: {
      backgroundColor: theme.surface,
      borderColor: theme.warmBorder,
      borderRadius: 22,
      borderWidth: 1,
      maxWidth: 440,
      paddingBottom: 15,
      paddingHorizontal: 17,
      paddingTop: 17,
      position: 'relative',
      width: '100%',
      shadowColor: theme.background,
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.28,
      shadowRadius: 14,
      elevation: 4,
      zIndex: 20,
    },
    rosetteWrapper: {
      alignSelf: 'center',
      position: 'absolute',
      top: -14,
    },
    dhikrCardTop: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    dhikrCategoryBadge: {
      backgroundColor: theme.warmSurface,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    dhikrCategoryText: {
      color: theme.warm,
      fontSize: 11,
      fontWeight: '700',
    },
    changeDhikrHint: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    changeDhikrText: {
      color: theme.textDim,
      fontSize: 11.5,
    },
    dhikrPhraseText: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 32,
      textAlign: 'center',
    },
    dhikrPhraseLong: {
      fontSize: 15.5,
      lineHeight: 25,
    },
    virtueSnippet: {
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 12,
      flexDirection: 'row',
      gap: 6,
      marginTop: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    virtueSnippetText: {
      color: theme.textDim,
      flex: 1,
      fontSize: 11,
    },
    ringSection: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 1,
      position: 'relative',
    },
    geometryWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
    },
    targetSection: {
      maxWidth: 440,
      width: '100%',
      zIndex: 20,
    },
    targetHeading: {
      alignItems: 'baseline',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
      paddingHorizontal: 2,
    },
    targetTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '800',
    },
    targetHint: {
      color: theme.textDim,
      fontSize: 11,
    },
    targetRow: {
      flexDirection: 'row',
      gap: 7,
      width: '100%',
    },
    targetChip: {
      alignItems: 'center',
      backgroundColor: theme.surfaceSoft,
      borderColor: theme.surfaceBorder,
      borderRadius: 18,
      borderWidth: 1,
      flex: 1,
      height: 42,
      justifyContent: 'center',
    },
    customChip: {
      flex: 1.25,
    },
    targetChipSelected: {
      backgroundColor: theme.warm,
      borderColor: theme.warm,
    },
    targetChipText: {
      color: theme.textMuted,
      fontSize: 13.5,
      fontWeight: '600',
    },
    targetChipTextSelected: {
      color: theme.onWarm,
      fontWeight: '800',
    },
    bottomDock: {
      alignItems: 'center',
      backgroundColor: theme.dockBackground,
      borderColor: theme.dockBorder,
      borderRadius: 26,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      maxWidth: 440,
      paddingHorizontal: 7,
      paddingVertical: 9,
      width: '100%',
      shadowColor: theme.background,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 7,
      zIndex: 20,
    },
    dockItem: {
      alignItems: 'center',
      flex: 1,
      gap: 4,
      justifyContent: 'center',
      minHeight: 42,
      paddingVertical: 2,
    },
    dockItemLabel: {
      color: theme.textMuted,
      fontSize: 10,
      fontWeight: '600',
    },
    dockDivider: {
      backgroundColor: theme.dockDivider,
      height: 25,
      width: 1,
    },
    privacyNote: {
      color: theme.textFaint,
      fontSize: 10.5,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.72,
      transform: [{ scale: 0.98 }],
    },
    disabled: {
      opacity: 0.38,
    },
    disabledText: {
      color: theme.textFaint,
    },
  });
}
