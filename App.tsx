import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useReducer, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatArabicNumber, toArabicDigits } from './src/arabic';
import { CounterRing } from './src/components/CounterRing';
import {
  BookIcon,
  ChevronDownIcon,
  FullScreenIcon,
  NextCycleIcon,
  ResetIcon,
  SettingsIcon,
  SparkleIcon,
  UndoIcon,
  VibrateIcon,
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

type OpenModal = 'settings' | 'customTarget' | 'dhikrPicker' | 'resetConfirm' | 'resetAllConfirm' | null;

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
  // Dhikr waiting for confirmation because switching would clear the current count.
  const [pendingDhikr, setPendingDhikr] = useState<DhikrOption | null>(null);

  useEffect(() => {
    loadCounterState().then((saved) => {
      if (saved) dispatch({ type: 'restore', state: saved });
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) saveCounterState(state);
  }, [isLoaded, state]);

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

  const handleSelectDhikr = (option: DhikrOption) => {
    if (option.id === state.dhikrId) return;
    if (state.count > 0) {
      setPendingDhikr(option);
    } else {
      dispatch({ type: 'setDhikr', dhikrId: option.id });
    }
  };

  const handleNextCycle = () => {
    dispatch({ type: 'nextCycle' });
    playHaptic('success', state.hapticsEnabled);
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

      {/* Screen Container */}
      {isLoaded && (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          {/* Top Bar Navigation */}
          <View style={styles.topBar}>
            <View style={styles.titleSection}>
              <View style={styles.titleRow}>
                <Text style={styles.appTitle} accessibilityRole="header">ذِكر</Text>
                <SparkleIcon size={16} color={colors.goldLight} />
              </View>
              <Text style={styles.appSubtitle}>رفيق التسبيح والسكينة</Text>
            </View>

            <View style={styles.topActions}>
              {/* Total Session Pill */}
              <View style={styles.totalPill}>
                <Text style={styles.totalPillLabel}>الإجمالي:</Text>
                <Text style={styles.totalPillNumber}>
                  {formatArabicNumber(state.totalSessionCount)}
                </Text>
              </View>

              {/* Quick Haptics Toggle */}
              <Pressable
                accessibilityRole="switch"
                accessibilityLabel="الاهتزاز"
                accessibilityState={{ checked: state.hapticsEnabled }}
                hitSlop={8}
                onPress={() => {
                  const nextHaptics = !state.hapticsEnabled;
                  dispatch({ type: 'setHaptics', enabled: nextHaptics });
                  playHaptic('tap', nextHaptics);
                }}
                style={({ pressed }) => [
                  styles.iconButton,
                  state.hapticsEnabled && styles.iconButtonActive,
                  pressed && styles.pressed,
                ]}
              >
                <VibrateIcon
                  size={19}
                  color={state.hapticsEnabled ? colors.goldLight : colors.textDim}
                />
              </Pressable>

              {/* Settings Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="الإعدادات"
                hitSlop={8}
                onPress={() => setOpenModal('settings')}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              >
                <SettingsIcon size={19} color={colors.icon} />
              </Pressable>
            </View>
          </View>

          {/* Main Scroll Content */}
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* In free-tap mode, taps on empty space count; buttons inside still handle their own taps. */}
            <Pressable
              accessible={false}
              disabled={!state.fullScreenTap}
              onPress={handleIncrement}
              style={styles.scrollContent}
            >
              {/* 1. Dhikr Showcase Card (Clickable to open library) */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`الذكر الحالي: ${dhikr.phrase}، اضغط لتغيير الذكر`}
                onPress={() => setOpenModal('dhikrPicker')}
                style={({ pressed }) => [styles.dhikrCard, pressed && styles.pressed]}
              >
                <View style={styles.dhikrCardTop}>
                  <View style={styles.dhikrCategoryBadge}>
                    <Text style={styles.dhikrCategoryText}>{dhikr.category}</Text>
                  </View>
                  <View style={styles.changeDhikrHint}>
                    <Text style={styles.changeDhikrText}>تغيير الذكر</Text>
                    <ChevronDownIcon size={14} color={colors.goldLight} />
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

              {/* 2. Interactive Central Ring & Sacred Geometry */}
              <View style={styles.ringSection}>
                {/* Islamic Ambient Geometry in Background */}
                <View pointerEvents="none" style={styles.geometryWrapper}>
                  <IslamicGeometryBackground size={geometrySize} opacity={0.11} />
                </View>

                {/* Primary Interactive Ring */}
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
                    <NextCycleIcon size={16} color={colors.onGold} />
                  </Pressable>
                </View>
              ) : null}

              {/* 4. Target Selector Chips */}
              <View
                style={styles.targetSection}
                accessibilityRole="radiogroup"
                accessibilityLabel="الهدف"
              >
                <Text style={styles.targetHeaderLabel}>الهدف المطلوب:</Text>
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
                      {!isPresetTarget ? `${toArabicDigits(state.target)} ✎` : 'مخصص +'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* 5. Floating Bottom Control Dock */}
              <View style={styles.bottomDock}>
                {/* Reset Button */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="إعادة ضبط العداد"
                  accessibilityState={{ disabled: !canUndo }}
                  disabled={!canUndo}
                  onPress={() => setOpenModal('resetConfirm')}
                  style={({ pressed }) => [
                    styles.dockButton,
                    !canUndo && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.dockIconCircle}>
                    <ResetIcon size={18} color={canUndo ? colors.text : colors.textDim} />
                  </View>
                  <Text style={styles.dockLabel}>بدء جديد</Text>
                </Pressable>

                {/* FullScreen Tap Mode Toggle */}
                <Pressable
                  accessibilityRole="switch"
                  accessibilityLabel="النقر في كامل الشاشة"
                  accessibilityState={{ checked: state.fullScreenTap }}
                  onPress={() => {
                    const nextVal = !state.fullScreenTap;
                    dispatch({ type: 'setFullScreenTap', enabled: nextVal });
                    playHaptic('tap', state.hapticsEnabled);
                  }}
                  style={({ pressed }) => [
                    styles.dockButton,
                    styles.dockButtonSpecial,
                    state.fullScreenTap && styles.dockButtonActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.dockIconCircle,
                      state.fullScreenTap && styles.dockIconCircleActive,
                    ]}
                  >
                    <FullScreenIcon
                      size={19}
                      color={state.fullScreenTap ? colors.goldLight : colors.text}
                    />
                  </View>
                  <Text
                    style={[
                      styles.dockLabel,
                      state.fullScreenTap && styles.dockLabelActive,
                    ]}
                  >
                    {state.fullScreenTap ? 'نقر حر مفعل' : 'ملء الشاشة'}
                  </Text>
                </Pressable>

                {/* Dhikr Library Shortcut */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="مكتبة الأذكار"
                  onPress={() => setOpenModal('dhikrPicker')}
                  style={({ pressed }) => [styles.dockButton, pressed && styles.pressed]}
                >
                  <View style={styles.dockIconCircle}>
                    <BookIcon size={18} color={colors.text} />
                  </View>
                  <Text style={styles.dockLabel}>الأذكار</Text>
                </Pressable>

                {/* Undo Button */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="تراجع عن العدة الأخيرة"
                  accessibilityState={{ disabled: !canUndo }}
                  disabled={!canUndo}
                  onPress={handleUndo}
                  style={({ pressed }) => [
                    styles.dockButton,
                    !canUndo && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.dockIconCircle}>
                    <UndoIcon size={18} color={canUndo ? colors.text : colors.textDim} />
                  </View>
                  <Text style={styles.dockLabel}>تراجع</Text>
                </Pressable>
              </View>

              <Text style={styles.privacyNote}>بياناتك محفوظة على جهازك فقط</Text>
            </Pressable>
          </ScrollView>
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
        onResetStats={() => setOpenModal('resetAllConfirm')}
      />

      <ConfirmModal
        visible={openModal === 'resetConfirm'}
        title="بدء دورة جديدة"
        message="سيُعاد عداد الدورة الحالية إلى الصفر لتبدأ من جديد"
        confirmLabel="نعم، ابدأ من جديد"
        cancelLabel="متابعة الورد"
        onClose={() => setOpenModal(null)}
        onConfirm={() => dispatch({ type: 'reset' })}
      />

      <ConfirmModal
        visible={openModal === 'resetAllConfirm'}
        title="تصفير الإحصائيات"
        message="سيُحذف العدد الحالي ومجموع التسبيحات الكلي نهائيًا من جهازك"
        confirmLabel="نعم، صفّر الكل"
        onClose={() => setOpenModal(null)}
        onConfirm={() => dispatch({ type: 'resetAll' })}
      />

      <ConfirmModal
        visible={pendingDhikr !== null}
        title="تغيير الذكر"
        message={`سيُصفَّر العدد الحالي (${toArabicDigits(state.count)}) ويبدأ ورد «${pendingDhikr?.title ?? ''}» من جديد`}
        confirmLabel="نعم، غيّر الذكر"
        onClose={() => setPendingDhikr(null)}
        onConfirm={() => {
          if (pendingDhikr) dispatch({ type: 'setDhikr', dhikrId: pendingDhikr.id });
        }}
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
  titleSection: {
    flexDirection: 'column',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  appTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  topActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  totalPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(210, 230, 218, 0.16)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  totalPillLabel: {
    color: colors.textDim,
    fontSize: 10.5,
  },
  totalPillNumber: {
    color: colors.goldLight,
    fontSize: 12,
    fontWeight: '700',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(210, 230, 218, 0.16)',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconButtonActive: {
    backgroundColor: 'rgba(223, 186, 107, 0.15)',
    borderColor: colors.goldBadgeBorder,
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
    paddingTop: 8,
  },
  dhikrCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(223, 186, 107, 0.25)',
    borderRadius: 22,
    borderWidth: 1.2,
    maxWidth: 440,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 20,
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
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 30,
    textAlign: 'center',
  },
  dhikrPhraseLong: {
    fontSize: 15,
    lineHeight: 25,
  },
  virtueSnippet: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
    paddingVertical: 12,
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
    backgroundColor: colors.goldLight,
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
  targetHeaderLabel: {
    color: colors.textDim,
    fontSize: 11.5,
    marginBottom: 8,
  },
  targetRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  targetChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    height: 42,
    justifyContent: 'center',
  },
  customChip: {
    flex: 1.3,
  },
  targetChipSelected: {
    backgroundColor: colors.goldBadge,
    borderColor: colors.goldBadgeBorder,
  },
  targetChipText: {
    color: colors.textMuted,
    fontSize: 13.5,
    fontWeight: '600',
  },
  targetChipTextSelected: {
    color: colors.goldText,
    fontWeight: '800',
  },
  bottomDock: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(210, 230, 218, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    maxWidth: 440,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
    zIndex: 20,
  },
  dockButton: {
    alignItems: 'center',
    flex: 1,
    gap: 5,
    justifyContent: 'center',
  },
  dockButtonSpecial: {
    flex: 1.2,
  },
  dockButtonActive: {},
  dockIconCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(210, 230, 218, 0.15)',
    borderRadius: 21,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  dockIconCircleActive: {
    backgroundColor: 'rgba(223, 186, 107, 0.18)',
    borderColor: colors.goldBadgeBorder,
  },
  dockLabel: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  dockLabelActive: {
    color: colors.goldText,
    fontWeight: '700',
  },
  privacyNote: {
    color: colors.textFaint,
    fontSize: 10.5,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.35,
  },
});
