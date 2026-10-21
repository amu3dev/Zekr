import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { toArabicDigits } from '../arabic';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { Routine } from '../routines';
import { useTheme } from '../theme';
import { BookIcon } from './Icons';
import { ModalShell } from './Modals';

/** Inspect the offline citation first; only the explicit action leaves the app. */
export function SourceBadge({ source }: { source: Routine['source'] }) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState(false);
  const reduceMotion = useReducedMotion() !== false;
  const styles = useMemo(() => StyleSheet.create({
    badge: { minHeight: 44, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
      borderWidth: 1, borderColor: theme.warmBorder, backgroundColor: theme.warmSurface,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 1 },
    label: { color: theme.text, fontSize: 12.5, textAlign: 'center', writingDirection: 'rtl' },
    content: { gap: 16, paddingBottom: 6 },
    citation: { color: theme.text, fontSize: 21, lineHeight: 34, textAlign: 'center', writingDirection: 'rtl' },
    detail: { color: theme.textMuted, fontSize: 14, lineHeight: 24, textAlign: 'center', writingDirection: 'rtl' },
    action: { minHeight: 44, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 10,
      borderRadius: 14, backgroundColor: theme.warmSurface, borderColor: theme.warmBorder, borderWidth: 1 },
    actionText: { color: theme.text, fontSize: 16, fontWeight: '600', textAlign: 'center' },
    error: { color: theme.text, fontSize: 14, textAlign: 'right', writingDirection: 'rtl' },
  }), [theme]);
  const reference = `\u2066${toArabicDigits(source.reference)}\u2069`;
  const openSource = async () => {
    if (opening) return;
    setOpening(true); setFailed(false);
    try { await Linking.openURL(source.url); }
    catch { setFailed(true); }
    finally { setOpening(false); }
  };
  return <View style={{ flexShrink: 1 }}>
    <Pressable accessibilityRole="button"
      accessibilityLabel={`تفاصيل المصدر: ${source.collection}، الحديث ${source.reference}`}
      accessibilityHint="يعرض المرجع داخل التطبيق" onPress={() => { setFailed(false); setVisible(true); }}
      style={({ pressed }) => [styles.badge, pressed && { opacity: 0.75 }]}>
      <BookIcon size={16} color={theme.iconAccent} />
      <Text style={styles.label}>{source.collection} · {reference}</Text>
    </Pressable>
    <ModalShell visible={visible} title="مرجع الحديث" closeLabel="إغلاق مرجع الحديث" onClose={() => setVisible(false)}
      animationType={reduceMotion ? 'none' : 'fade'} textScaleLimit={2}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text selectable testID="source-citation" style={styles.citation}>{source.collection}{'\n'}الحديث {reference}</Text>
        <Text style={styles.detail}>هذا مرجع الورد. يمكنك متابعة التسبيح دون اتصال بالإنترنت.</Text>
        <Pressable accessibilityRole="link" accessibilityLabel="فتح المصدر" accessibilityHint="يفتح الموقع في المتصفح الخارجي"
          disabled={opening} accessibilityState={{ disabled: opening }} onPress={openSource} style={styles.action}>
          <Text style={styles.actionText}>فتح المصدر</Text>
        </Pressable>
        {failed && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
          تعذّر فتح المصدر. حاول مرة أخرى.
        </Text>}
      </ScrollView>
    </ModalShell>
  </View>;
}
