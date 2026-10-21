import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { toArabicDigits } from '../arabic';
import { getDhikr } from '../counter';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ROUTINES, ROUTINE_CONTEXTS, type RoutineProgress, type RoutineSession } from '../routines';
import { groupRoutineSequences } from '../routineCatalog';
import { useTheme, type ThemeTokens } from '../theme';
import { CountingBackdrop, CountingGeometry } from './CountingBackdrop';
import { DhikrReader } from './DhikrReader';
import { CounterRing } from './CounterRing';
import { BookIcon, CloseIcon, MoreIcon, ResetIcon, UndoIcon } from './Icons';
import { ModalShell } from './Modals';
import { SourceBadge } from './SourceBadge';

export function RoutineButton({ label, text, onPress, disabled = false }: {
  label: string; text?: string; onPress: () => void; disabled?: boolean;
}) {
  const styles = useRoutineStyles();
  return <Pressable accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, (pressed || disabled) && styles.dimmed]}>
    <Text style={styles.buttonText}>{text ?? label}</Text>
  </Pressable>;
}

function useRoutineStyles() {
  const { theme } = useTheme();
  return useMemo(() => createStyles(theme), [theme]);
}

export function RoutineCatalog({ visible, session, onSelect, onClose }: {
  visible: boolean; session: RoutineSession | null; onSelect: (id: string) => void; onClose: () => void;
}) {
  const styles = useRoutineStyles();
  const reduceMotion = useReducedMotion() !== false;
  return <ModalShell visible={visible} title="التسبيحات الكاملة" subtitle="أذكار مأثورة مرتبة بعددها"
    closeLabel="إغلاق التسبيحات الكاملة" onClose={onClose} animationType={reduceMotion ? 'none' : 'fade'} textScaleLimit={2}>
    <ScrollView testID="routine-catalog-scroll" contentContainerStyle={styles.catalogContent}>
      {groupRoutineSequences(ROUTINES).map(({ key, variants }) => {
        const routine = variants[0];
        const shared = variants.length > 1;
        return <View key={key} testID="routine-sequence-card" style={styles.catalogCard}>
          <View style={styles.catalogHeading}>
            <Text accessibilityRole="header" style={styles.catalogTitle}>{shared ? 'تسبيح ٣٣، ٣٣، ٣٤' : routine.title}</Text>
            <Text style={styles.totalBadge}>{toArabicDigits(routine.total)} ذكر</Text>
          </View>
          <Text testID="routine-sequence-summary" style={styles.summary}>{routine.steps.map(step => `${getDhikr(step.dhikrId).title} ${toArabicDigits(step.repetitions)}`).join(' · ')}</Text>
          {variants.map(variant => {
            const saved = session?.routineId === variant.id;
            return <View key={variant.id} style={styles.variant}>
              <Text style={styles.groupTitle}>{ROUTINE_CONTEXTS[variant.context]}</Text>
              <View style={styles.catalogFooter}>
                <SourceBadge source={variant.source} />
                <RoutineButton text={saved ? 'استئناف' : 'بدء'} label={`${saved ? 'استئناف' : 'بدء'} ${variant.title}`} onPress={() => onSelect(variant.id)} />
              </View>
              {saved && <Text style={styles.saved}>المحفوظ: {toArabicDigits(session.completedRepetitions)} من {toArabicDigits(variant.total)}</Text>}
            </View>;
          })}
        </View>;
      })}
    </ScrollView>
  </ModalShell>;
}

export function routineProgressLabel(progress: RoutineProgress) {
  return `المرحلة ${toArabicDigits(progress.stepIndex + 1)} من ${toArabicDigits(progress.routine.steps.length)}، ` +
    `${toArabicDigits(progress.stepCount)} من ${toArabicDigits(progress.stepTarget)}، ` +
    `التقدم الكلي: ${toArabicDigits(progress.overall)} من ${toArabicDigits(progress.routine.total)}`;
}

export function RoutineHeader({ progress, onTap, onUndo }: { progress: RoutineProgress; onTap: () => void; onUndo: () => void }) {
  const styles = useRoutineStyles();
  const { fontScale } = useWindowDimensions();
  return <View style={[styles.headerSlot, fontScale <= 1.25 && { minHeight: 140 }]}><View style={styles.header} testID="routine-header">
    <View style={styles.stageRow}>
      <Text testID="routine-step" style={styles.step}>المرحلة {toArabicDigits(progress.stepIndex + 1)} من {toArabicDigits(progress.routine.steps.length)}</Text>
      <Text testID="routine-repetitions" accessibilityLabel={`تكرارات الذكر: ${toArabicDigits(progress.stepCount)} من ${toArabicDigits(progress.stepTarget)}`}
        style={styles.repetitions}>{toArabicDigits(progress.stepCount)} <Text style={styles.step}>/ {toArabicDigits(progress.stepTarget)}</Text></Text>
    </View>
    <DhikrReader phrase={progress.dhikr.phrase} title={progress.dhikr.title} source={progress.routine.source}
      counter={{ value: `${toArabicDigits(progress.stepCount)} من ${toArabicDigits(progress.stepTarget)}`,
        progress: `المرحلة ${toArabicDigits(progress.stepIndex + 1)} من ${toArabicDigits(progress.routine.steps.length)} · الكلي ${toArabicDigits(progress.overall)} من ${toArabicDigits(progress.routine.total)}`, canUndo: progress.overall > 0, disabled: progress.completed, onTap, onUndo }} />
  </View></View>;
}

export function RoutineProgressStrip({ progress }: { progress: RoutineProgress }) {
  const styles = useRoutineStyles();
  return <View testID="routine-progress-strip" style={styles.progressStrip}>
    <View style={styles.progressRow}>
      <Text style={styles.progressLabel}>{progress.completed ? 'أتممت الورد بحمد الله' : 'التقدم الكلي'}</Text>
      <Text testID="routine-overall" accessibilityLabel={`التقدم الكلي: ${toArabicDigits(progress.overall)} من ${toArabicDigits(progress.routine.total)}`}
        style={styles.progressCount}>{toArabicDigits(progress.overall)} من {toArabicDigits(progress.routine.total)}</Text>
    </View>
    <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress.overall / progress.routine.total * 100}%` }]} /></View>
  </View>;
}

export function RoutineActions({ visible, progress, onClose, onRestart, onLeave, onBrowse }: {
  visible: boolean; progress: RoutineProgress; onClose: () => void;
  onRestart: () => void; onLeave: () => void; onBrowse: () => void;
}) {
  const { theme } = useTheme();
  const styles = useRoutineStyles();
  const reduceMotion = useReducedMotion() !== false;
  const items = [
    { label: 'اختيار ورد آخر', icon: BookIcon, action: onBrowse },
    { label: 'إعادة بدء الورد', icon: ResetIcon, action: onRestart },
    { label: 'العودة للتسبيح الفردي', icon: CloseIcon, action: onLeave },
  ];
  return <ModalShell visible={visible} title="خيارات الورد" subtitle={progress.routine.title}
    onClose={onClose} animationType={reduceMotion ? 'none' : 'fade'} textScaleLimit={2}>
    <ScrollView contentContainerStyle={styles.section}>
      {items.map(({ label, icon: Icon, action }) => <Pressable key={label} accessibilityRole="button"
        accessibilityLabel={label} onPress={() => { onClose(); action(); }}
        style={({ pressed }) => [styles.actionRow, pressed && styles.dimmed]}>
        <Icon size={18} color={theme.iconAccent} /><Text style={styles.actionText}>{label}</Text>
      </Pressable>)}
      <SourceBadge source={progress.routine.source} />
      <Text style={styles.detail}>تقدم المرحلة مستقل عن دورة الخرز البصرية ذات ٣٣ حبة.</Text>
    </ScrollView>
  </ModalShell>;
}

export function RoutineFreeTap({ progress, effectsEnabled, topInset, bottomInset, onTap, onExit,
  onUndo, onRestart, onLeave, onBrowse }: {
  progress: RoutineProgress; effectsEnabled: boolean; topInset: number; bottomInset: number;
  onTap: () => void; onExit: () => void; onUndo: () => void; onRestart: () => void;
  onLeave: () => void; onBrowse: () => void;
}) {
  const { theme } = useTheme();
  const { width, height, fontScale } = useWindowDimensions();
  const styles = useRoutineStyles();
  const [areaHeight, setAreaHeight] = useState(300);
  const [actions, setActions] = useState(false);
  const fit = fontScale <= 1.25 && height - topInset - bottomInset >= 540;
  const size = Math.round(Math.max(120, Math.min(width - 36, fit ? areaHeight - 8 : 300, 340)));
  return <View accessibilityViewIsModal style={[styles.freeOverlay, { paddingTop: topInset, paddingBottom: bottomInset }]}>
    <CountingBackdrop />
    <View style={styles.freeTop}>
      <Text style={styles.modeLabel}>النقر الحر</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="إنهاء وضع النقر الحر"
        onPress={onExit} style={styles.iconButton}><CloseIcon size={19} color={theme.iconAccent} /></Pressable>
    </View>
    <ScrollView testID="guided-free-scroll" scrollEnabled={!fit} style={styles.freeScroll}
      contentContainerStyle={[styles.freeContent, fit && styles.fitContent]}>
      <RoutineHeader progress={progress} onTap={onTap} onUndo={onUndo} />
      <Pressable accessibilityRole="button" accessibilityLabel={`عدّاد ${progress.dhikr.title}`}
        accessibilityValue={{ text: routineProgressLabel(progress) }} accessibilityHint="اضغط في المساحة الوسطى لزيادة العدّ"
        accessibilityState={{ disabled: progress.completed }} disabled={progress.completed} onPress={onTap}
        onLayout={event => setAreaHeight(event.nativeEvent.layout.height)}
        style={[styles.freeCountArea, fit ? styles.flexRing : styles.scrollingRing]}>
        <CountingGeometry size={size + 28} />
        <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <CounterRing size={size} count={progress.stepCount} target={progress.stepTarget}
            title={progress.dhikr.title} completion={null} guided={progress} decorative effectsEnabled={effectsEnabled}
            onPress={onTap} />
        </View>
      </Pressable>
      <RoutineProgressStrip progress={progress} />
      <View testID="guided-free-dock" style={styles.freeDock}>
        <Pressable accessibilityRole="button" accessibilityLabel="تراجع" accessibilityState={{disabled:progress.overall===0}}
          disabled={progress.overall===0} onPress={onUndo} style={styles.dockItem}>
          <UndoIcon size={19} color={theme.iconAccent} /><Text style={styles.dockLabel}>تراجع</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="التسبيحات الكاملة" onPress={onBrowse} style={styles.dockItem}>
          <BookIcon size={19} color={theme.iconAccent} /><Text style={styles.dockLabel}>الأوراد</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="خيارات الورد" onPress={() => setActions(true)} style={styles.dockItem}>
          <MoreIcon size={19} color={theme.iconAccent} /><Text style={styles.dockLabel}>خيارات</Text>
        </Pressable>
      </View>
    </ScrollView>
    <RoutineActions visible={actions} progress={progress} onClose={() => setActions(false)}
      onRestart={onRestart} onLeave={onLeave} onBrowse={onBrowse} />
  </View>;
}

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    section: { gap: 10, alignSelf: 'stretch', paddingBottom: 4 },
    dimmed: { opacity: 0.65 },
    button: { minHeight: 44, minWidth: 64, paddingHorizontal: 14, paddingVertical: 8,
      justifyContent: 'center', borderRadius: 13, backgroundColor: theme.warmSurface,
      borderWidth: 1, borderColor: theme.warmBorder, flexShrink: 1 },
    buttonText: { color: theme.text, fontSize: 14, fontWeight: '700', textAlign: 'center', writingDirection: 'rtl' },
    catalogContent: { gap: 18, paddingBottom: 8 },
    groupTitle: { color: theme.warm, fontSize: 14, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
    catalogCard: { gap: 9, padding: 13, borderRadius: 18, borderWidth: 1, borderColor: theme.surfaceBorder, backgroundColor: theme.surface },
    catalogHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    catalogTitle: { flex: 1, color: theme.text, fontSize: 16, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
    totalBadge: { color: theme.warm, backgroundColor: theme.warmSurface, borderRadius: 8,
      fontSize: 12, paddingVertical: 4, paddingHorizontal: 6, textAlign: 'center' },
    summary: { color: theme.textMuted, fontSize: 13, textAlign: 'right', writingDirection: 'rtl' },
    catalogFooter: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    variant: { gap: 6, paddingTop: 7, borderTopWidth: 1, borderTopColor: theme.surfaceBorder },
    saved: { color: theme.textMuted, fontSize: 12, textAlign: 'right', writingDirection: 'rtl' },
    headerSlot: { width: '100%', maxWidth: 440 },
    header: { width: '100%', maxWidth: 440, paddingHorizontal: 14, paddingVertical: 8, gap: 3,
      borderRadius: 22, borderWidth: 1, borderColor: theme.warmBorder, backgroundColor: theme.surface },
    stageRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    step: { color: theme.textMuted, fontSize: 12, textAlign: 'center', writingDirection: 'rtl' },
    repetitions: { color: theme.warm, fontSize: 16, fontWeight: '700', textAlign: 'center', writingDirection: 'rtl' },
    progressStrip: { alignSelf: 'stretch', gap: 8, paddingHorizontal: 5, paddingVertical: 6, minHeight: 44 },
    progressRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    progressLabel: { color: theme.text, fontSize: 14, fontWeight: '600', textAlign: 'right', writingDirection: 'rtl' },
    progressCount: { color: theme.warm, fontSize: 14, fontWeight: '700', textAlign: 'center', writingDirection: 'rtl' },
    progressTrack: { height: 3, borderRadius: 2, backgroundColor: theme.track, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: theme.warm, alignSelf: 'flex-start' },
    actionRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10,
      borderBottomWidth: 1, borderBottomColor: theme.surfaceBorder },
    actionText: { flex: 1, color: theme.text, fontSize: 16, textAlign: 'right', writingDirection: 'rtl' },
    detail: { color: theme.textMuted, fontSize: 13, textAlign: 'right', writingDirection: 'rtl' },
    freeOverlay: { ...StyleSheet.absoluteFill, zIndex: 100, backgroundColor: theme.background, overflow: 'hidden' },
    freeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 4 },
    modeLabel: { color: theme.textMuted, fontSize: 14, fontWeight: '600' },
    iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22,
      borderWidth: 1, borderColor: theme.surfaceBorder, backgroundColor: theme.surfaceSoft },
    freeScroll: { flex: 1 },
    freeContent: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 8, gap: 10, flexGrow: 1 },
    fitContent: { flex: 1 },
    freeCountArea: { alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
    flexRing: { flex: 1, minHeight: 0 },
    scrollingRing: { height: 320 },
    freeDock: { flexDirection: 'row', borderRadius: 26, borderWidth: 1, borderColor: theme.dockBorder,
      backgroundColor: theme.dockBackground, paddingVertical: 7, paddingHorizontal: 8 },
    dockItem: { minWidth: 44, minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
    dockLabel: { color: theme.textMuted, fontSize: 11, textAlign: 'center', width: '100%', flexShrink: 1 },
  });
}
