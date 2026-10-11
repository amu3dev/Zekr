import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useReducer, useRef, useState } from 'react';
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

import { formatArabicNumber, getCycleText, toArabicDigits } from './src/arabic';
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
import { loadCounterState, saveCounterState } from './src/storage';
import { colors } from './src/theme';

type OpenModal = 'settings' | 'customTarget' | 'dhikrPicker' | 'resetConfirm' | null;

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

  // Debounce writes to AsyncStorage to prevent disk thrashing on rapid taps
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      saveCounterState(state);
    }, 400);
    return () => clearTimeout(timer);
  }, [isLoaded, state]);

  // Flush latest state immediately when app goes to background or becomes inactive
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState.match(/inactive|background/) && isLoaded) {
        saveCounterState(stateRef.current);
      }
    });
    return () => subscription.remove();
  }, [isLoaded]);

  const dhikr = getDhikr(state.dhikrId);
  const isPresetTarget = (PRESET_TARGETS as readonly number[]).includes(state.target);
  const isComplete = state.count >= state.target;

  const availableHeight = height - insets.top - insets.bottom;
  const ringSize = Math.round(Math.max(210, Math.min(width - 48, availableHeight * 0.40, 320)));
  const geometrySize = ringSize * 1.28;
  const canUndo = state.count > 0;

  const handleIncrement = () => {
    const nextCount = state.count + 1;
    dispatch({ type: 'increment' });
    playHaptic(nextCount === state.target ? 'success' : 'tap', state.hapticsEnabled);
  };

  const handleUndo = () => {
    if (canUndo) {
      dispatch({ type: 'undo' });
      playHaptic('tap', state.hapticsEnabled);
    }
  };

  const handleNextCycle = () => {
    dispatch({ type: 'nextCycle' });
    playHaptic('success', state.hapticsEnabled);
  };

  const handleSelectDhikr = (option: DhikrOption) => {
    if (option.id === state.dhikrId) return;
    if (state.count > 0) {
      setPendingDhikr(option);
      setOpenModal('resetConfirm');
    } else {
      dispatch({ type: 'setDhikr', dhikrId: option.id });
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
      colors={[colors.backgroundStart, colors.backgroundMid, colors.backgroundEnd]}
      locations={[0, 0.45, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.screen}
    >
      <StatusBar style="light" />

      {isLoaded && (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          {/* Top Bar Header (Matching Mockup: Menu Icon, Glowing Title, Dual-Line Pill) */}
          <View style={styles.topBar}>
            {/* Left Frosted Menu Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="القائمة والإعدادات"
              hitSlop={8}
              onPress={() => setOpenModal('settings')}
              style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
            >
              <MenuIcon size={19} color={colors.goldLight} />
            </Pressable>

            {/* Center Majestic Title */}
            <View style={styles.titleSection}>
              <Text style={styles.appTitle} accessibilityRole="header">ذِكر</Text>
            </View>

            {/* Right Dual-Line Session & Total Pill */}
            <View style={styles.sessionPill}>
              <Text style={styles.sessionPillTop}>
                {getCycleText(state.cycle)}
              </Text>
              <Text style={styles.sessionPillBottom}>
                التعداد: {formatArabicNumber(state.totalSessionCount)}
              </Text>
            </View>
          </View>

          {/* Main Scroll Content */}
          <ScrollView
            accessibilityElementsHidden={state.fullScreenTap}
            bounces={false}
            contentContainerStyle={styles.scrollContainer}
            importantForAccessibility={state.fullScreenTap ? 'no-hide-descendants' : 'auto'}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.scrollContent}>
              {/* 1. Dhikr Showcase Card with Centered Rosette Clasp */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`الذكر الحالي: ${dhikr.phrase}، اضغط لتغيير الذكر`}
                onPress={() => setOpenModal('dhikrPicker')}
                style={({ pressed }) => [styles.dhikrCard, pressed && styles.pressed]}
              >
                {/* Decorative Rosette Clasp Medallion at the top border */}
                <View style={styles.rosetteWrapper} pointerEvents="none">
                  <RosetteClasp size={30} />
                </View>

                <View style={styles.dhikrCardTop}>
                  <View style={styles.dhikrCategoryBadge}>
                    <Text style={styles.dhikrCategoryText}>{dhikr.category}</Text>
                  </View>
                  <View style={styles.changeDhikrHint}>
                    <Text style={styles.changeDhikrText}>تغيير الذكر</Text>
                    <ChevronDownIcon size={13} color={colors.goldLight} />
                  </View>
                </View>

                <Text style={[styles.dhikrPhraseText, dhikr.phrase.length > 80 && styles.dhikrPhraseLong]}>
                  {dhikr.phrase}
                </Text>

                {dhikr.virtue ? (
                  <View style={styles.virtueSnippet}>
                    <SparkleIcon size={12} color={colors.goldLight} />
                    <Text style={styles.virtueSnippetText} numberOfLines={1}>
                      {dhikr.virtue}
                    </Text>
                  </View>
                ) : null}
              </Pressable>

              {/* 2. Interactive Central Ring & Sacred Islamic Geometry */}
              <View style={styles.ringSection}>
                {/* Architectural 8-Point Star Geometry in Background */}
                <View pointerEvents="none" style={styles.geometryWrapper}>
                  <IslamicGeometryBackground size={geometrySize} opacity={0.9} />
                </View>

                {/* 33-Bead Spherical Tasbeeh Ring */}
                <CounterRing
                  size={ringSize}
                  count={state.count}
                  target={state.target}
                  title={dhikr.title}
                  cycle={state.cycle}
                  onPress={handleIncrement}
                />
              </View>

              {/* 3. Completion Banner (Shows when target is reached) */}
              {isComplete ? (
                <View style={styles.completionBanner}>
                  <View style={styles.completionInfo}>
                    <SparkleIcon size={18} color={colors.goldLight} />
                    <Text style={styles.completionTitle}>مبارك! أتممت الورد بنجاح</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="بدء الدورة التالية"
                    onPress={handleNextCycle}
                    style={({ pressed }) => [styles.nextCycleButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.nextCycleText}>ابدأ الدورة التالية</Text>
                    <NextCycleIcon size={15} color={colors.onGold} />
                  </Pressable>
                </View>
              ) : null}

              {/* 4. Target Selector Chips (Matching Mockup Pill Buttons) */}
              <View
                style={styles.targetSection}
                accessibilityRole="radiogroup"
                accessibilityLabel="الهدف"
              >
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
                        <Text
                          style={[
                            styles.targetChipText,
                            isSelected && styles.targetChipTextSelected,
                          ]}
                        >
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
                    <Text
                      style={[
                        styles.targetChipText,
                        !isPresetTarget && styles.targetChipTextSelected,
                      ]}
                    >
                      {!isPresetTarget ? `${toArabicDigits(state.target)} ✎` : 'مخصص'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* 5. Floating Glassmorphic Dock (Matching Mockup: 5 Balanced Actions) */}
              <View style={styles.bottomDock}>
                {/* 1. Undo Button */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="تراجع"
                  accessibilityState={{ disabled: !canUndo }}
                  disabled={!canUndo}
                  onPress={handleUndo}
                  style={({ pressed }) => [
                    styles.dockItem,
                    !canUndo && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <UndoIcon size={19} color={canUndo ? colors.iconGold : colors.textDim} />
                  <Text style={[styles.dockItemLabel, !canUndo && styles.disabledText]}>تراجع</Text>
                </Pressable>

                <View style={styles.dockDivider} />

                {/* 2. Reset Button */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="إعادة تعيين"
                  accessibilityState={{ disabled: !canUndo }}
                  disabled={!canUndo}
                  onPress={() => setOpenModal('resetConfirm')}
                  style={({ pressed }) => [
                    styles.dockItem,
                    !canUndo && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <ResetIcon size={19} color={canUndo ? colors.iconGold : colors.textDim} />
                  <Text style={[styles.dockItemLabel, !canUndo && styles.disabledText]}>إعادة تعيين</Text>
                </Pressable>

                <View style={styles.dockDivider} />

                {/* 3. Dhikr Library Shortcut */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="مكتبة الأذكار"
                  onPress={() => setOpenModal('dhikrPicker')}
                  style={({ pressed }) => [styles.dockItem, pressed && styles.pressed]}
                >
                  <BookIcon size={19} color={colors.iconGold} />
                  <Text style={styles.dockItemLabel}>الأذكار</Text>
                </Pressable>

                <View style={styles.dockDivider} />

                {/* 4. FullScreen Free Tap Toggle */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="النقر الحر"
                  onPress={() => {
                    dispatch({ type: 'setFullScreenTap', enabled: true });
                    playHaptic('tap', state.hapticsEnabled);
                  }}
                  style={({ pressed }) => [styles.dockItem, pressed && styles.pressed]}
                >
                  <FullScreenIcon size={19} color={colors.iconGold} />
                  <Text style={styles.dockItemLabel}>النقر الحر</Text>
                </Pressable>

                <View style={styles.dockDivider} />

                {/* 5. Settings */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="الإعدادات"
                  onPress={() => setOpenModal('settings')}
                  style={({ pressed }) => [styles.dockItem, pressed && styles.pressed]}
                >
                  <SettingsIcon size={19} color={colors.iconGold} />
                  <Text style={styles.dockItemLabel}>الإعدادات</Text>
                </Pressable>
              </View>

              <Text style={styles.privacyNote}>بياناتك محفوظة على جهازك فقط</Text>
            </View>
          </ScrollView>

          {/* Full Screen Free Tap Mode HUD Overlay (Matching Mockup screen-freetap.png) */}
          {state.fullScreenTap ? (
            <View style={styles.freeTapOverlay}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`النقر الحر لعدّاد ${dhikr.title}`}
                accessibilityHint="اضغط لزيادة العدّاد، واستخدم زر إنهاء الوضع للعودة"
                accessibilityValue={{
                  text: `${toArabicDigits(state.count)} من ${toArabicDigits(state.target)}`,
                }}
                onPress={handleIncrement}
                style={({ pressed }) => [
                  styles.freeTapSurface,
                  pressed && styles.freeTapSurfacePressed,
                ]}
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
                  <CloseIcon size={15} color={colors.goldLight} />
                  <Text style={styles.freeTapExitText}>إنهاء الوضع</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      )}

      {/* Modals & Sheets */}
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
        onResetStats={() => dispatch({ type: 'resetAll' })}
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
    <SafeAreaProvider>
      <CounterScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundStart,
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
    paddingVertical: 10,
    zIndex: 20,
  },
  menuButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(210, 230, 218, 0.16)',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  titleSection: {
    alignItems: 'center',
  },
  appTitle: {
    color: colors.goldLight,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.5,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(224, 194, 128, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
      },
      android: {},
    }),
  },
  sessionPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(223, 186, 107, 0.15)',
    borderColor: 'rgba(247, 229, 169, 0.35)',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  sessionPillTop: {
    color: colors.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  sessionPillBottom: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    gap: 16,
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  dhikrCard: {
    backgroundColor: colors.backgroundCard,
    borderColor: 'rgba(224, 194, 128, 0.38)',
    borderRadius: 24,
    borderWidth: 1.2,
    maxWidth: 440,
    paddingHorizontal: 18,
    paddingBottom: 16,
    paddingTop: 18,
    position: 'relative',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 5,
    zIndex: 20,
  },
  rosetteWrapper: {
    alignSelf: 'center',
    position: 'absolute',
    top: -15,
  },
  dhikrCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dhikrCategoryBadge: {
    backgroundColor: colors.goldBadge,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  dhikrCategoryText: {
    color: colors.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  changeDhikrHint: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  changeDhikrText: {
    color: colors.textDim,
    fontSize: 11.5,
  },
  dhikrPhraseText: {
    color: colors.text,
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
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  virtueSnippetText: {
    color: colors.textDim,
    flex: 1,
    fontSize: 11,
  },
  ringSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    position: 'relative',
  },
  geometryWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  completionBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(223, 186, 107, 0.12)',
    borderColor: colors.goldBadgeBorder,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 440,
    paddingHorizontal: 16,
    paddingVertical: 11,
    width: '100%',
  },
  completionInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  completionTitle: {
    color: colors.goldLight,
    fontSize: 13,
    fontWeight: '700',
  },
  nextCycleButton: {
    alignItems: 'center',
    backgroundColor: colors.goldPill,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  nextCycleText: {
    color: colors.onGold,
    fontSize: 12,
    fontWeight: '800',
  },
  targetSection: {
    maxWidth: 440,
    width: '100%',
    zIndex: 20,
  },
  targetRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  targetChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: colors.surfaceBorder,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    height: 42,
    justifyContent: 'center',
  },
  customChip: {
    flex: 1.25,
  },
  targetChipSelected: {
    backgroundColor: colors.goldPill,
    borderColor: colors.goldPill,
  },
  targetChipText: {
    color: colors.textMuted,
    fontSize: 13.5,
    fontWeight: '600',
  },
  targetChipTextSelected: {
    color: colors.onGold,
    fontWeight: '800',
  },
  bottomDock: {
    alignItems: 'center',
    backgroundColor: colors.dockBackground,
    borderColor: colors.dockBorder,
    borderRadius: 28,
    borderWidth: 1.2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 440,
    paddingHorizontal: 8,
    paddingVertical: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  dockItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dockItemLabel: {
    color: colors.textMuted,
    fontSize: 10.5,
    fontWeight: '600',
  },
  dockDivider: {
    backgroundColor: colors.dockDivider,
    height: 24,
    width: 1,
  },
  privacyNote: {
    color: colors.textFaint,
    fontSize: 10.5,
    textAlign: 'center',
  },
  freeTapOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(3, 10, 7, 0.94)',
    zIndex: 100,
  },
  freeTapSurface: {
    ...StyleSheet.absoluteFill,
  },
  freeTapSurfacePressed: {
    backgroundColor: 'rgba(223, 186, 107, 0.06)',
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
    color: colors.goldLight,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  freeTapCount: {
    color: colors.goldLight,
    fontSize: 92,
    fontWeight: '300',
    letterSpacing: -2,
    lineHeight: 110,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(224, 194, 128, 0.45)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 16,
      },
      android: {},
    }),
  },
  freeTapTarget: {
    color: colors.textMuted,
    fontSize: 14.5,
    marginTop: 4,
  },
  freeTapHint: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 26,
  },
  freeTapExitButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderColor: colors.surfaceBorder,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 20,
    paddingVertical: 11,
    position: 'absolute',
  },
  freeTapExitText: {
    color: colors.goldLight,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.35,
  },
  disabledText: {
    color: colors.textFaint,
  },
});
