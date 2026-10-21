import { isRunningInExpoGo } from 'expo';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
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
import { CountingDock } from './src/components/CountingDock';
import { DhikrReader } from './src/components/DhikrReader';
import { CounterRing } from './src/components/CounterRing';
import { FreeTapMode } from './src/components/FreeTapMode';
import { LaunchExperience } from './src/components/LaunchExperience';
import { StorageNotice } from './src/components/StorageNotice';
import { RoutineActions, RoutineButton, RoutineCatalog, RoutineFreeTap, RoutineHeader, RoutineProgressStrip, routineProgressLabel } from './src/components/RoutineExperience';
import { usePersistentState } from './src/hooks/usePersistentState';
import {
  ChevronDownIcon,
  SettingsIcon,
  RosetteClasp,
  SparkleIcon,
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
  PRESET_TARGETS,
} from './src/counter';
import { ThemeProvider } from './src/ThemeProvider';
import { useTheme } from './src/theme';
import type { ThemeTokens } from './src/theme';
import { counterPersistence, routinePersistence, themePersistence } from './src/storage';
import { getRoutineProgress, routineReducer, type RoutineAction } from './src/routines';

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
  | 'routineOptions'
  | 'routineConfirm'
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
  const { isReady: isThemeReady, theme, hydration: themeHydration, saveStatus: themeSaveStatus } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions();
  const [ringAreaHeight, setRingAreaHeight] = useState(300);
  const { value: state, hydration, saveStatus } = usePersistentState(counterPersistence);
  const { value: routineState, hydration: routineHydration, saveStatus: routineSaveStatus } = usePersistentState(routinePersistence);
  const [catalogVisible, setCatalogVisible] = useState(false);
  const [pendingRoutine, setPendingRoutine] = useState<RoutineAction | null>(null);
  const routineReady = routineHydration !== 'loading';
  const guided = routineHydration === 'ready' && routineState.inRoutine && routineState.session
    ? getRoutineProgress(routineState.session) : undefined;
  const isLoaded = hydration === 'ready';
  const hasHydrationError = hydration === 'error' || themeHydration === 'error';
  const hasSaveError = saveStatus === 'error' || themeSaveStatus === 'error' || routineSaveStatus === 'error';
  const [isRecoveryLaidOut, setIsRecoveryLaidOut] = useState(false);
  const [isHomeLaidOut, setIsHomeLaidOut] = useState(false);
  const [launchVisible, setLaunchVisible] = useState(true);
  const finishLaunch = useCallback(() => setLaunchVisible(false), []);
  const nativeHidden = useRef(false);
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [pendingDhikr, setPendingDhikr] = useState<DhikrOption | null>(null);
  const mainScroll = useRef<ScrollView>(null);

  const [completion, setCompletion] = useState<string | null>(null);
  // Track queued actions with the same reducer, so feedback and background
  // flushes see every tap even before React commits a batch.
  const dispatchCounter = useCallback((action: CounterAction) => {
    setCompletion(null);
    const next = counterPersistence.update((current) => counterReducer(current, action));
    return next;
  }, []);

  useEffect(() => {
    if (!completion) return;
    const timer = setTimeout(() => setCompletion(null), 900);
    return () => clearTimeout(timer);
  }, [completion]);

  useEffect(() => {
    const canShowHome = isLoaded && isThemeReady && routineReady && isHomeLaidOut;
    if ((canShowHome || (hasHydrationError && isRecoveryLaidOut)) && !nativeHidden.current) {
      nativeHidden.current = true;
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [isHomeLaidOut, isLoaded, isThemeReady, routineReady, hasHydrationError, isRecoveryLaidOut]);

  const retryStorage = useCallback(() => {
    void counterPersistence.retry();
    void themePersistence.retry();
    void routinePersistence.retry();
  }, []);

  const dhikr = getDhikr(state.dhikrId);
  const { activeMilestone } = getMilestoneProgress(state.count, state.target);
  const isPresetTarget = (PRESET_TARGETS as readonly number[]).includes(state.target);
  const availableHeight = height - insets.top - insets.bottom;
  const fitsCounting = fontScale <= 1.25 && availableHeight >= 540 && routineHydration !== 'error';
  const compactCounting = fitsCounting && availableHeight < 650;
  const ringSize = Math.round(Math.max(120, Math.min(width - 44,
    fitsCounting ? ringAreaHeight - 24 : availableHeight * 0.4, 350)));
  const geometrySize = ringSize * 1.16;
  const canUndo = guided ? guided.overall > 0 : state.count > 0;

  const dispatchRoutine = (action: RoutineAction) => {
    setCompletion(null);
    return routinePersistence.update(current => routineReducer(current, action));
  };
  const leaveRoutine = () => {
    dispatchRoutine({ type: 'leave' });
    dispatchCounter({ type: 'setFullScreenTap', enabled: false });
    mainScroll.current?.scrollTo({ y: 0, animated: false });
  };
  const selectRoutine = (routineId: string) => {
    const current = routinePersistence.getSnapshot().value;
    if (current.session?.routineId === routineId) {
      dispatchRoutine({ type: 'resume' });
      setCatalogVisible(false);
      mainScroll.current?.scrollTo({ y: 0, animated: false });
      return;
    }
    const action: RoutineAction = { type: 'start', routineId };
    if (current.session && current.session.completedRepetitions > 0 && !getRoutineProgress(current.session).completed) {
      setCatalogVisible(false);
      setPendingRoutine(action);
      setOpenModal('routineConfirm');
    } else {
      dispatchRoutine(action);
      setCatalogVisible(false);
      mainScroll.current?.scrollTo({ y: 0, animated: false });
    }
  };
  const restartRoutine = () => {
    setPendingRoutine({ type: 'restart' });
    setOpenModal('routineConfirm');
  };
  const handleRoutineTap = (type: 'increment' | 'undo') => {
    const before = routinePersistence.getSnapshot().value;
    if (!before.inRoutine || !before.session) return;
    const previous = getRoutineProgress(before.session);
    const next = dispatchRoutine({ type });
    if (next === before || !next.session) return;
    const progress = getRoutineProgress(next.session);
    const transition = previous.stepIndex !== progress.stepIndex || previous.completed !== progress.completed;
    if (transition) {
      const message = progress.completed ? 'أتممت الورد بحمد الله'
        : `${progress.dhikr.phrase}، ${routineProgressLabel(progress)}`;
      setCompletion(progress.completed ? null : 'انتقلت المرحلة');
      // Event-based: no repeated announcements on theme/save/rerender changes.
      // Keep focus on the existing counting control rather than moving it away.
      AccessibilityInfo.announceForAccessibility(message);
    }
    playHaptic(transition && type === 'increment' ? 'success' : 'tap', state.hapticsEnabled);
  };

  const handleIncrement = () => {
    if (routinePersistence.getSnapshot().value.inRoutine && routineHydration === 'ready') {
      handleRoutineTap('increment');
      return;
    }
    const previousCount = counterPersistence.getSnapshot().value.count;
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
    if (guided) { handleRoutineTap('undo'); return; }
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
    if (guided) mainScroll.current?.scrollTo({ y: 0, animated: false });
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

      {isLoaded && isThemeReady && routineReady && (
        <View
          aria-hidden={launchVisible}
          accessibilityElementsHidden={launchVisible}
          importantForAccessibility={launchVisible ? 'no-hide-descendants' : 'auto'}
          onLayout={() => setIsHomeLaidOut(true)}
          style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        >
          <View
            aria-hidden={state.fullScreenTap}
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
              <SettingsIcon size={20} color={theme.warm} />
            </Pressable>
          </View>

          <ScrollView
            aria-hidden={state.fullScreenTap}
            ref={mainScroll}
            testID="counting-scroll"
            scrollEnabled={!fitsCounting}
            accessibilityElementsHidden={state.fullScreenTap}
            bounces={false}
            contentContainerStyle={[styles.scrollContainer, fitsCounting && styles.fitContainer]}
            importantForAccessibility={state.fullScreenTap ? 'no-hide-descendants' : 'auto'}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.scrollContent, fitsCounting && styles.fitContent]}>
              {routineHydration === 'error' ? <View style={{ gap: 8 }}>
                <Text style={{ color: theme.text, textAlign: 'center' }}>تعذّر استعادة الورد المحفوظ. يمكنك متابعة التسبيح الفردي؛ لم نغيّر بيانات الورد.</Text>
                <RoutineButton label="إعادة محاولة استعادة الورد" onPress={() => { void routinePersistence.retry(); }} />
              </View> : null}
              {guided ? <RoutineHeader progress={guided} onTap={handleIncrement} onUndo={handleUndo} /> : dhikr.phrase.length > 80 ? (
                <View style={[styles.dhikrCard, { paddingVertical: 8, paddingHorizontal: 12 }]}>
                  <DhikrReader phrase={dhikr.phrase} title={dhikr.title} details={dhikr.virtue} testID="single-dhikr-phrase"
                    counter={{ value: `${toArabicDigits(state.count)} من ${toArabicDigits(activeMilestone)}`, canUndo, onTap: handleIncrement, onUndo: handleUndo }} />
                </View>
              ) : (
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

                {dhikr.virtue && !compactCounting ? (
                  <View style={styles.virtueSnippet}>
                    <SparkleIcon size={12} color={theme.warm} />
                    <Text style={styles.virtueSnippetText} numberOfLines={1}>
                      {dhikr.virtue}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
              )}

              <View testID="ring-section" onLayout={event => setRingAreaHeight(event.nativeEvent.layout.height)}
                style={[styles.ringSection, fitsCounting ? styles.flexRingSection : { height: ringSize + 28 }]}>
                <View pointerEvents="none" style={styles.geometryWrapper}>
                  <IslamicGeometryBackground size={geometrySize} opacity={0.72} />
                </View>
                <CounterRing
                  size={ringSize}
                  count={guided ? guided.stepCount : state.count}
                  target={guided ? guided.stepTarget : state.target}
                  title={guided ? guided.dhikr.title : dhikr.title}
                  guided={guided}
                  completion={completion}
                  effectsEnabled={state.visualEffectsEnabled}
                  onPress={handleIncrement}
                />
              </View>

              {guided ? <RoutineProgressStrip progress={guided} /> : (
              <View style={styles.targetSection} accessibilityRole="radiogroup" accessibilityLabel="الهدف">
                <View style={styles.targetHeading}>
                  <Text style={styles.targetTitle}>الهدف</Text>
                  <Text style={styles.targetHint}>اختر مقدار الورد</Text>
                </View>
                <View style={[styles.targetRow, fontScale > 1.25 && styles.targetsReflow]}>
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
                          fontScale > 1.25 && styles.targetChipReflow,
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
                      fontScale > 1.25 && styles.targetChipReflow,
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
              )}

              <CountingDock guided={!!guided} canUndo={canUndo} routinesAvailable={routineHydration === 'ready'} onUndo={handleUndo}
                onReset={() => setOpenModal('resetConfirm')} onLibrary={() => setOpenModal('dhikrPicker')}
                onRoutines={() => { if (routineHydration === 'ready') setCatalogVisible(true); }}
                onFreeTap={() => {
                  dispatchCounter({ type: 'setFullScreenTap', enabled: true });
                  playHaptic('tap', state.hapticsEnabled);
                }} onOptions={() => setOpenModal('routineOptions')} />

              <Text style={styles.privacyNote}>بياناتك محفوظة على جهازك فقط</Text>
            </View>
          </ScrollView>

          {state.fullScreenTap ? (
            guided ? <RoutineFreeTap progress={guided} effectsEnabled={state.visualEffectsEnabled}
              topInset={insets.top} bottomInset={insets.bottom} onTap={handleIncrement} onUndo={handleUndo}
              onExit={handleExitFullScreenTap} onRestart={restartRoutine} onLeave={leaveRoutine}
              onBrowse={() => setCatalogVisible(true)} /> : <FreeTapMode
              bottomInset={insets.bottom}
              count={state.count}
              completion={completion}
              dhikr={dhikr}
              effectsEnabled={state.visualEffectsEnabled}
              onExit={handleExitFullScreenTap}
              onTap={handleIncrement}
              onUndo={handleUndo}
              target={state.target}
              topInset={insets.top}
            />
          ) : null}
        </View>
      )}

      <RoutineCatalog visible={catalogVisible && routineHydration === 'ready'} session={routineState.session}
        onSelect={selectRoutine} onClose={() => setCatalogVisible(false)} />
      {guided && <RoutineActions visible={openModal === 'routineOptions'} progress={guided}
        onClose={() => setOpenModal(null)} onRestart={restartRoutine} onLeave={leaveRoutine}
        onBrowse={() => setCatalogVisible(true)} />}

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
        totalSessionCount={Math.min(Number.MAX_SAFE_INTEGER, state.totalSessionCount + routineState.totalRecorded)}
        statisticsIncomplete={routineHydration !== 'ready'}
        onClose={() => setOpenModal(null)}
        onToggleHaptics={(enabled) => dispatchCounter({ type: 'setHaptics', enabled })}
        onToggleVisualEffects={(enabled) => dispatchCounter({ type: 'setVisualEffects', enabled })}
        onToggleFullScreenTap={(enabled) => dispatchCounter({ type: 'setFullScreenTap', enabled })}
        onResetStats={() => setOpenModal('resetStatsConfirm')}
      />

      <ConfirmModal
        visible={openModal === 'resetStatsConfirm'}
        title="تصفير الإحصائيات"
        message="سيؤدي هذا الإجراء إلى تصفير إجمالي التسبيحات والعداد الفردي وتقدم الورد المحفوظ. هل تريد المتابعة؟"
        confirmLabel="نعم، حذف وتصفير"
        onClose={() => setOpenModal('settings')}
        onConfirm={() => {
          dispatchCounter({ type: 'resetAll' });
          dispatchRoutine({ type: 'resetAll' });
          playHaptic('warning', state.hapticsEnabled);
          setOpenModal('settings');
        }}
      />

      <ConfirmModal visible={openModal === 'routineConfirm'}
        title={pendingRoutine?.type === 'start' ? 'تغيير الورد' : 'إعادة بدء الورد'}
        message="سيُستبدل تقدم الورد الحالي ويبدأ العدّ من الصفر. يبقى إجمالي التسبيحات المسجلة محفوظًا. هل تريد المتابعة؟"
        confirmLabel="نعم، ابدأ الورد" onClose={() => {
          if (pendingRoutine?.type === 'start') setCatalogVisible(true);
          setPendingRoutine(null); setOpenModal(null);
        }}
        onConfirm={() => {
          if (pendingRoutine) dispatchRoutine(pendingRoutine);
          setPendingRoutine(null);
          setCatalogVisible(false);
          setOpenModal(null);
          mainScroll.current?.scrollTo({ y: 0, animated: false });
        }} />

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
      {launchVisible && !hasHydrationError && (
        <LaunchExperience
          ready={isLoaded && isThemeReady && routineReady && isHomeLaidOut}
          onFinish={finishLaunch}
        />
      )}
      {hasHydrationError && (
        <View
          onLayout={() => setIsRecoveryLaidOut(true)}
          style={[styles.storageRecovery, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
        >
          <StorageNotice initialization onRetry={retryStorage} />
        </View>
      )}
      {!hasHydrationError && hasSaveError && (
        <View style={[styles.storageWarning, { bottom: insets.bottom + 8 }]}>
          <StorageNotice initialization={false} onRetry={retryStorage} />
        </View>
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
    storageRecovery: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'center',
      paddingHorizontal: 20,
      zIndex: 50,
    },
    storageWarning: {
      position: 'absolute',
      left: 12,
      right: 12,
      zIndex: 50,
    },
    screen: {
      backgroundColor: theme.background,
      flex: 1,
      overflow: 'hidden',
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
      height: 44,
      justifyContent: 'center',
      width: 44,
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
    fitContainer: { flex: 1 },
    fitContent: { flex: 1, minHeight: 0 },
    flexRingSection: { flex: 1, minHeight: 0, width: '100%' },
    scrollContainer: {
      flexGrow: 1,
      paddingBottom: 12,
    },
    scrollContent: {
      alignItems: 'center',
      flexGrow: 1,
      gap: 9,
      paddingHorizontal: 18,
      paddingTop: 10,
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
    targetsReflow: { flexWrap: 'wrap' },
    targetChipReflow: { flexBasis: '30%', minWidth: 84, flexGrow: 1, flexShrink: 1 },
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
      minHeight: 44,
      paddingVertical: 8,
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
    privacyNote: {
      color: theme.textFaint,
      fontSize: 10.5,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.72,
      transform: [{ scale: 0.98 }],
    },
  });
}
