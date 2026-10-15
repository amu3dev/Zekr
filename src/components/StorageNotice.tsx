import { useSyncExternalStore } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { counterPersistence, themePersistence } from '../storage';
import { useTheme } from '../theme';

/** Native Modals sit above the root view, so surface unsaved progress there too. */
export function StorageSaveNotice() {
  const { saveStatus } = useTheme();
  const counterFailed = useSyncExternalStore(counterPersistence.subscribe,
    () => counterPersistence.getSnapshot().saveStatus === 'error');
  if (!counterFailed && saveStatus !== 'error') return null;
  return (
    <ScrollView style={styles.modalNotice}>
      <StorageNotice initialization={false} onRetry={() => {
        void counterPersistence.retry();
        void themePersistence.retry();
      }} />
    </ScrollView>
  );
}

export function StorageNotice({ initialization, onRetry }: {
  initialization: boolean;
  onRetry: () => void;
}) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.notice, { backgroundColor: theme.background, borderColor: theme.accent }]}
    >
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
        {initialization ? 'تعذّر استعادة البيانات' : 'التغييرات لم تُحفظ بعد'}
      </Text>
      <Text style={[styles.message, { color: theme.text }]}>
        {initialization
          ? 'تعذّر قراءة البيانات المحفوظة. لم نغيّر بياناتك. أعد المحاولة لاستعادتها.'
          : 'يمكنك متابعة العدّ. نحاول الحفظ مجددًا، لكن قد تفقد التغييرات غير المحفوظة إذا أغلقت التطبيق.'}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={initialization ? 'إعادة محاولة استعادة البيانات' : 'إعادة محاولة الحفظ'}
        onPress={onRetry}
        style={[styles.retry, { borderColor: theme.accent }]}
      >
        <Text style={[styles.title, { color: theme.text }]}>إعادة المحاولة</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  modalNotice: { maxHeight: 200, flexGrow: 0, marginBottom: 8 },
  notice: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8, direction: 'rtl' },
  title: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  retry: { minHeight: 48, justifyContent: 'center', borderWidth: 1, borderRadius: 12, padding: 8 },
});
