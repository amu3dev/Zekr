import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useReducer, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { toArabicDigits } from './src/arabic';
import { CounterRing } from './src/components/CounterRing';
import { ResetIcon, SettingsIcon, UndoIcon } from './src/components/Icons';
import { CustomTargetModal, SettingsModal } from './src/components/Modals';
import { counterReducer, getDhikr, initialCounterState, PRESET_TARGETS } from './src/counter';
import { loadCounterState, saveCounterState } from './src/storage';
import { colors } from './src/theme';

type OpenModal = 'settings' | 'customTarget' | null;

function playHaptic(kind: 'tap' | 'success') {
  const feedback = kind === 'success'
    ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  feedback.catch(() => undefined);
}

function CounterScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [state, dispatch] = useReducer(counterReducer, initialCounterState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [openModal, setOpenModal] = useState<OpenModal>(null);

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
  const availableHeight = height - insets.top - insets.bottom;
  const ringSize = Math.round(Math.max(200, Math.min(width - 56, availableHeight * 0.44, 340)));
  const compact = availableHeight < 640;

  const increment = () => {
    const nextCount = state.count + 1;
    dispatch({ type: 'increment' });
    if (state.hapticsEnabled) playHaptic(nextCount === state.target ? 'success' : 'tap');
  };

  const confirmReset = () => {
    Alert.alert('بدء جديد', 'سيُعاد العداد إلى الصفر. هل تريد المتابعة؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'بدء جديد', style: 'destructive', onPress: () => dispatch({ type: 'reset' }) },
    ]);
  };

  const canUndo = state.count > 0;

  return (
    <LinearGradient
      colors={[colors.backgroundStart, colors.backgroundMid, colors.backgroundEnd]}
      locations={[0, 0.58, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <StatusBar style="light" />
      {isLoaded && (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View pointerEvents="none" style={styles.halo} />

          <View style={styles.header}>
            <View>
              <Text style={styles.appTitle} accessibilityRole="header">ذِكر</Text>
              <Text style={styles.appSubtitle}>مسبحة هادئة</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="الإعدادات"
              hitSlop={8}
              onPress={() => setOpenModal('settings')}
              style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
            >
              <SettingsIcon />
            </Pressable>
          </View>

          <ScrollView
            bounces={false}
            contentContainerStyle={[styles.content, compact && styles.contentCompact]}
            showsVerticalScrollIndicator={false}
          >
            <CounterRing
              size={ringSize}
              count={state.count}
              target={state.target}
              title={dhikr.title}
              onPress={increment}
            />

            <View style={styles.phraseBlock}>
              <View style={styles.progressPill}>
                <Text style={styles.progressPillText}>
                  ورد اليوم {toArabicDigits(state.count)} / {toArabicDigits(state.target)}
                </Text>
              </View>
              <Text style={styles.phrase}>{dhikr.phrase}</Text>
              <Text style={styles.phraseNote}>يُحفظ عدّك تلقائيًا حتى لو أغلقت التطبيق</Text>
            </View>

            <View style={styles.targetRow} accessibilityRole="radiogroup" accessibilityLabel="الهدف">
              {PRESET_TARGETS.map((target) => {
                const selected = state.target === target;
                return (
                  <Pressable
                    key={target}
                    accessibilityRole="radio"
                    accessibilityLabel={`الهدف ${toArabicDigits(target)}`}
                    accessibilityState={{ checked: selected }}
                    onPress={() => dispatch({ type: 'setTarget', target })}
                    style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{toArabicDigits(target)}</Text>
                  </Pressable>
                );
              })}
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel={isPresetTarget ? 'هدف مخصص' : `هدف مخصص، الحالي ${toArabicDigits(state.target)}`}
                accessibilityState={{ checked: !isPresetTarget }}
                onPress={() => setOpenModal('customTarget')}
                style={({ pressed }) => [styles.chip, styles.chipWide, !isPresetTarget && styles.chipSelected, pressed && styles.pressed]}
              >
                <Text style={[styles.chipText, !isPresetTarget && styles.chipTextSelected]}>
                  {isPresetTarget ? 'مخصص +' : `${toArabicDigits(state.target)} ✎`}
                </Text>
              </Pressable>
            </View>

            <View style={styles.controls}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="بدء جديد"
                accessibilityHint="يطلب تأكيدًا قبل تصفير العداد"
                accessibilityState={{ disabled: !canUndo }}
                disabled={!canUndo}
                onPress={confirmReset}
                style={({ pressed }) => [styles.control, !canUndo && styles.disabled, pressed && styles.pressed]}
              >
                <View style={styles.controlCircle}><ResetIcon /></View>
                <Text style={styles.controlLabel}>بدء جديد</Text>
              </Pressable>

              <Pressable
                accessibilityRole="switch"
                accessibilityLabel="الاهتزاز"
                accessibilityState={{ checked: state.hapticsEnabled }}
                onPress={() => dispatch({ type: 'setHaptics', enabled: !state.hapticsEnabled })}
                style={({ pressed }) => [styles.control, pressed && styles.pressed]}
              >
                <View style={styles.hapticPill}>
                  <Text style={styles.hapticText}>اهتزاز</Text>
                  <View style={[styles.miniSwitch, state.hapticsEnabled && styles.miniSwitchOn]}>
                    <View style={[styles.miniThumb, state.hapticsEnabled && styles.miniThumbOn]} />
                  </View>
                </View>
                <Text style={styles.controlLabel}>{state.hapticsEnabled ? 'مفعّل' : 'متوقف'}</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="تراجع"
                accessibilityHint="ينقص العدد واحدًا"
                accessibilityState={{ disabled: !canUndo }}
                disabled={!canUndo}
                onPress={() => dispatch({ type: 'undo' })}
                style={({ pressed }) => [styles.control, !canUndo && styles.disabled, pressed && styles.pressed]}
              >
                <View style={styles.controlCircle}><UndoIcon /></View>
                <Text style={styles.controlLabel}>تراجع</Text>
              </Pressable>
            </View>

            <Text style={styles.privacy}>بياناتك محفوظة على جهازك فقط</Text>
          </ScrollView>
        </View>
      )}

      <SettingsModal
        visible={openModal === 'settings'}
        dhikrId={state.dhikrId}
        hapticsEnabled={state.hapticsEnabled}
        onClose={() => setOpenModal(null)}
        onSelectDhikr={(dhikrId) => dispatch({ type: 'setDhikr', dhikrId })}
        onToggleHaptics={(enabled) => dispatch({ type: 'setHaptics', enabled })}
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
  screen: { flex: 1, backgroundColor: colors.backgroundStart },
  // Layout is always right-to-left, independent of the device language.
  root: { direction: 'rtl', flex: 1 },
  halo: {
    alignSelf: 'center',
    backgroundColor: colors.gold,
    borderRadius: 999,
    height: 420,
    opacity: 0.05,
    position: 'absolute',
    top: '12%',
    width: 420,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  appTitle: { color: colors.textSoft, fontSize: 24, fontWeight: '700' },
  appSubtitle: { color: '#A9BEB4', fontSize: 11, marginTop: 2 },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(184,205,189,0.38)',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    gap: 18,
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  contentCompact: { gap: 12, paddingTop: 8 },
  phraseBlock: { alignItems: 'center' },
  progressPill: {
    backgroundColor: 'rgba(185,149,84,0.13)',
    borderColor: 'rgba(214,185,108,0.35)',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  progressPillText: { color: colors.goldText, fontSize: 12 },
  phrase: { color: colors.textSoft, fontSize: 18, marginTop: 12, textAlign: 'center' },
  phraseNote: { color: colors.textDim, fontSize: 11, marginTop: 4, textAlign: 'center' },
  targetRow: { flexDirection: 'row', gap: 8, maxWidth: 400, width: '100%' },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  chipWide: { flex: 1.2 },
  chipSelected: { backgroundColor: '#F1D692', borderColor: '#F1D692' },
  chipText: { color: '#D1DFD2', fontSize: 13 },
  chipTextSelected: { color: colors.onGold, fontWeight: '700' },
  controls: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 400,
    paddingHorizontal: 8,
    width: '100%',
  },
  control: { alignItems: 'center', minWidth: 72 },
  controlCircle: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(182,198,184,0.2)',
    borderRadius: 23,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  controlLabel: { color: '#91A99B', fontSize: 11, marginTop: 6 },
  hapticPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.065)',
    borderColor: 'rgba(182,198,184,0.2)',
    borderRadius: 23,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    height: 46,
    paddingHorizontal: 16,
  },
  hapticText: { color: '#D3E2D5', fontSize: 12 },
  // Physical row so the thumb slides left→right for "on", like a native switch.
  miniSwitch: {
    backgroundColor: colors.track,
    borderRadius: 9,
    direction: 'ltr',
    height: 18,
    justifyContent: 'center',
    paddingHorizontal: 3,
    width: 30,
  },
  miniSwitchOn: { backgroundColor: colors.green },
  miniThumb: { backgroundColor: colors.textMuted, borderRadius: 6, height: 12, width: 12 },
  miniThumbOn: { alignSelf: 'flex-end', backgroundColor: '#F3D88F' },
  privacy: { color: colors.textFaint, fontSize: 10, textAlign: 'center' },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.4 },
});
