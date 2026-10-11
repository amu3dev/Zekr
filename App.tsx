import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
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
import {
  BookIcon,
  ChevronDownIcon,
  CloseIcon,
  FullScreenIcon,
  MenuIcon,
  NextCycleIcon,
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
  DhikrOption,
  getDhikr,
  initialCounterState,
  PRESET_TARGETS,
} from './src/counter';
import { ThemeProvider } from './src/ThemeProvider';
import { useTheme } from './src/theme';
import type { ThemeTokens } from './src/theme';
import { loadCounterState, saveCounterState } from './src/storage';

// Keep the native Midnight Sapphire launch identity in place until both the
// persisted theme and the counter state are ready to render the first frame.
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
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [pendingDhikr, setPendingDhikr] = useState<DhikrOption | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    loadCounterState().then((saved) => {
      if (saved) dispatch({ type: 'restore', state: saved });
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded && isThemeReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [isLoaded, isThemeReady]);

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
  const isComplete = state.count >= state.target;
  const availableHeight = height - insets.top - insets.bottom;
  const ringSize = Math.round(Math.max(200, Math.min(width - 28, availableHeight * 0.44, 350)));
  const geometrySize = ringSize * 1.16;
  const canUndo = state.count > 0;

  const handleIncrement = () => {
    const nextCount = state.count + 1;
    dispatch({ type: 'increment' });
    playHaptic(nextCount === state.target ? 'success' : 'tap', state.hapticsEnabled);
  };

  const handleUndo = () => {
    if (!canUndo) return;
    dispatch({ type: 'undo' });
    playHaptic('tap', state.hapticsEnabled);
  };

  const handleNextCycle = () => {
    dispatch({ type: 'nextCycle' });
    playHaptic('success', state.hapticsEnabled);
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
      dispatch({ type: 'setDhikr', dhikrId: option.id });
      setOpenModal(null);
    }
  };

  const handleConfirmReset = () => {
    if (pendingDhikr) {
      dispatch({ type: 'setDhikr', dhikrId: pendingDhikr.id });
      setPendingDhikr(null);
    } else {
      dispatch({ type: 'reset' });
    }
    setOpenModal(null);
  };

  const handleExitFullScreenTap = () => {
    dispatch({ type: 'setFullScreenTap', enabled: false });
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

      {isLoaded && (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
                  cycle={state.cycle}
                  onPress={handleIncrement}
                />
              </View>

              {isComplete ? (
                <View style={styles.completionBanner}>
                  <View style={styles.completionInfo}>
                    <View style={styles.completionIconWrap}>
                      <SparkleIcon size={16} color={theme.success} />
                    </View>
                    <View style={styles.completionCopy}>
                      <Text style={styles.completionTitle}>اكتمل الورد</Text>
                      <Text style={styles.completionSubtitle}>ابدأ دورة جديدة عندما تكون مستعدًا</Text>
                    </View>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="بدء الدورة التالية"
                    onPress={handleNextCycle}
                    style={({ pressed }) => [styles.nextCycleButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.nextCycleText}>الدورة التالية</Text>
                    <NextCycleIcon size={15} color={theme.onWarm} />
                  </Pressable>
                </View>
              ) : null}

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
                          dispatch({ type: 'setTarget', target });
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
                    dispatch({ type: 'setFullScreenTap', enabled: true });
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
            <View accessibilityViewIsModal style={styles.freeTapOverlay}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`النقر الحر لعدّاد ${dhikr.title}`}
                accessibilityHint="اضغط لزيادة العدّاد، واستخدم زر إنهاء الوضع للعودة"
                accessibilityValue={{ text: `${toArabicDigits(state.count)} من ${toArabicDigits(state.target)}` }}
                onPress={handleIncrement}
                style={({ pressed }) => [styles.freeTapSurface, pressed && styles.freeTapSurfacePressed]}
              />

              <View pointerEvents="box-none" style={styles.freeTapHud}>
                <View pointerEvents="none" style={styles.freeTapStatus}>
                  <Text style={styles.freeTapEyebrow}>النقر الحر مفعل</Text>
                  <Text style={styles.freeTapCount}>{toArabicDigits(state.count)}</Text>
                  <Text style={styles.freeTapTarget}>
                    من {toArabicDigits(state.target)} · {dhikr.title}
                  </Text>
                  <Text style={styles.freeTapHint}>المس أي مكان لزيادة العدّ</Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="إنهاء وضع النقر الحر"
                  hitSlop={8}
                  onPress={handleExitFullScreenTap}
                  style={({ pressed }) => [
                    styles.freeTapExitButton,
                    { bottom: insets.bottom + 22 },
                    pressed && styles.pressed,
                  ]}
                >
                  <CloseIcon size={15} color={theme.warm} />
                  <Text style={styles.freeTapExitText}>إنهاء الوضع</Text>
                </Pressable>
              </View>
            </View>
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
          dispatch({ type: 'setTarget', target });
          setOpenModal(null);
        }}
      />

      <SettingsModal
        visible={openModal === 'settings'}
        hapticsEnabled={state.hapticsEnabled}
        fullScreenTap={state.fullScreenTap}
        totalSessionCount={state.totalSessionCount}
        onClose={() => setOpenModal(null)}
        onToggleHaptics={(enabled) => dispatch({ type: 'setHaptics', enabled })}
        onToggleFullScreenTap={(enabled) => dispatch({ type: 'setFullScreenTap', enabled })}
        onResetStats={() => setOpenModal('resetStatsConfirm')}
      />

      <ConfirmModal
        visible={openModal === 'resetStatsConfirm'}
        title="تصفير الإحصائيات"
        message="سيؤدي هذا الإجراء إلى حذف إجمالي التسبيحات والعداد نهائيًا. هل تريد المتابعة؟"
        confirmLabel="نعم، حذف وتصفير"
        onClose={() => setOpenModal('settings')}
        onConfirm={() => {
          dispatch({ type: 'resetAll' });
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
            : 'سيُعاد عداد الدورة الحالية إلى الصفر. هل تريد المتابعة؟'
        }
        confirmLabel={pendingDhikr ? 'تغيير وبدء جديد' : 'نعم، ابدأ من جديد'}
        onClose={() => {
          setPendingDhikr(null);
          setOpenModal(null);
        }}
        onConfirm={handleConfirmReset}
      />
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
    completionBanner: {
      alignItems: 'center',
      backgroundColor: theme.successSurface,
      borderColor: theme.successBorder,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      maxWidth: 440,
      paddingHorizontal: 13,
      paddingVertical: 10,
      width: '100%',
    },
    completionInfo: {
      alignItems: 'center',
      flexDirection: 'row',
      flex: 1,
      gap: 8,
    },
    completionIconWrap: {
      alignItems: 'center',
      backgroundColor: theme.successSurface,
      borderRadius: 16,
      height: 30,
      justifyContent: 'center',
      width: 30,
    },
    completionCopy: {
      flex: 1,
    },
    completionTitle: {
      color: theme.success,
      fontSize: 13,
      fontWeight: '800',
    },
    completionSubtitle: {
      color: theme.textDim,
      fontSize: 10.5,
      marginTop: 2,
    },
    nextCycleButton: {
      alignItems: 'center',
      backgroundColor: theme.warm,
      borderRadius: 12,
      flexDirection: 'row',
      gap: 5,
      marginLeft: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    nextCycleText: {
      color: theme.onWarm,
      fontSize: 11,
      fontWeight: '800',
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
    freeTapOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.background,
      zIndex: 100,
    },
    freeTapSurface: {
      ...StyleSheet.absoluteFill,
    },
    freeTapSurfacePressed: {
      backgroundColor: theme.warmSurface,
    },
    freeTapHud: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    freeTapStatus: {
      alignItems: 'center',
    },
    freeTapEyebrow: {
      color: theme.warm,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginBottom: 16,
    },
    freeTapCount: {
      color: theme.warm,
      fontSize: 92,
      fontWeight: '300',
      letterSpacing: -2,
      lineHeight: 110,
      ...Platform.select({
        ios: {
          textShadowColor: theme.warmSurface,
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 16,
        },
        android: {},
      }),
    },
    freeTapTarget: {
      color: theme.textMuted,
      fontSize: 14.5,
      marginTop: 4,
    },
    freeTapHint: {
      color: theme.textDim,
      fontSize: 12,
      marginTop: 26,
    },
    freeTapExitButton: {
      alignItems: 'center',
      backgroundColor: theme.surfaceSoft,
      borderColor: theme.surfaceBorder,
      borderRadius: 22,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 7,
      paddingHorizontal: 20,
      paddingVertical: 11,
      position: 'absolute',
    },
    freeTapExitText: {
      color: theme.warm,
      fontSize: 13,
      fontWeight: '700',
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
