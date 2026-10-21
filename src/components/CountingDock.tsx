import { Fragment, useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useTheme } from '../theme';
import { BookIcon, FullScreenIcon, MoreIcon, ResetIcon, SparkleIcon, UndoIcon } from './Icons';

/** One familiar dock; routine lifecycle actions live in its overflow sheet. */
export function CountingDock({ guided, canUndo, routinesAvailable = true, onUndo, onReset, onLibrary, onRoutines, onFreeTap, onOptions }: {
  guided: boolean; canUndo: boolean; routinesAvailable?: boolean; onUndo: () => void; onReset: () => void;
  onLibrary: () => void; onRoutines: () => void; onFreeTap: () => void; onOptions: () => void;
}) {
  const { theme } = useTheme();
  const { fontScale } = useWindowDimensions();
  const reflow = fontScale > 1.5;
  const styles = useMemo(() => StyleSheet.create({
    dock: { alignItems: 'center', backgroundColor: theme.dockBackground, borderColor: theme.dockBorder,
      borderRadius: 26, borderWidth: 1, flexDirection: 'row', maxWidth: 440, width: '100%',
      paddingHorizontal: 7, paddingVertical: 7, flexWrap: reflow ? 'wrap' : 'nowrap', gap: reflow ? 8 : 0 },
    item: { alignItems: 'center', flexGrow: 1, flexShrink: 1, flexBasis: reflow ? '46%' : 0,
      minWidth: 44, minHeight: 44, gap: 3, justifyContent: 'center', paddingVertical: 2 },
    label: { color: theme.textMuted, fontSize: 10.5, fontWeight: '600', textAlign: 'center', width: '100%', flexShrink: 1 },
    divider: { width: 1, height: 24, backgroundColor: theme.dockDivider },
    dimmed: { opacity: 0.45 },
  }), [theme, reflow]);
  const items = [
    { label: 'تراجع', text: 'تراجع', icon: UndoIcon, action: onUndo, disabled: !canUndo },
    ...(!guided ? [
      { label: 'إعادة تعيين', text: 'إعادة تعيين', icon: ResetIcon, action: onReset, disabled: !canUndo },
      { label: 'مكتبة الأذكار', text: 'الأذكار', icon: BookIcon, action: onLibrary, disabled: false },
    ] : []),
    { label: 'التسبيحات الكاملة', text: 'الأوراد', icon: SparkleIcon, action: onRoutines, disabled: !routinesAvailable },
    { label: 'النقر الحر', text: 'النقر الحر', icon: FullScreenIcon, action: onFreeTap, disabled: false },
    ...(guided ? [{ label: 'خيارات الورد', text: 'خيارات', icon: MoreIcon, action: onOptions, disabled: false }] : []),
  ];
  return <View testID="counting-dock" style={styles.dock}>
    {items.map(({ label, text, icon: Icon, action, disabled }, index) => <Fragment key={label}>
      {index > 0 && !reflow && <View style={styles.divider} />}
      <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }}
        disabled={disabled} onPress={action} style={({ pressed }) => [styles.item, (pressed || disabled) && styles.dimmed]}>
        <Icon size={19} color={disabled ? theme.textFaint : theme.iconAccent} />
        <Text style={styles.label}>{text}</Text>
      </Pressable>
    </Fragment>)}
  </View>;
}
