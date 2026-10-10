import { ReactNode, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { normalizeDigits, toArabicDigits } from '../arabic';
import { DHIKR_OPTIONS, isValidTarget, MAX_TARGET, MIN_TARGET } from '../counter';
import { colors } from '../theme';

type ShellProps = { visible: boolean; title: string; subtitle: string; onClose: () => void; children: ReactNode };

function ModalShell({ visible, title, subtitle, onClose, children }: ShellProps) {
  return (
    <Modal animationType="fade" transparent statusBarTranslucent navigationBarTranslucent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
        <Pressable accessibilityLabel="إغلاق" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ModalButton({ label, primary, onPress }: { label: string; primary?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [primary ? styles.primaryButton : styles.secondaryButton, pressed && styles.pressed]}
    >
      <Text style={primary ? styles.primaryText : styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

type CustomTargetProps = { visible: boolean; currentTarget: number; onClose: () => void; onSave: (target: number) => void };

export function CustomTargetModal({ visible, currentTarget, onClose, onSave }: CustomTargetProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setText('');
      setError(null);
    }
  }, [visible]);

  const save = () => {
    const digits = normalizeDigits(text).trim();
    const value = /^\d+$/.test(digits) ? Number(digits) : NaN;
    if (!isValidTarget(value)) {
      setError(`اكتب عددًا من ${toArabicDigits(MIN_TARGET)} إلى ${toArabicDigits(MAX_TARGET)}`);
      return;
    }
    onSave(value);
  };

  return (
    <ModalShell
      visible={visible}
      title="هدف مخصص"
      subtitle={`الهدف الحالي ${toArabicDigits(currentTarget)} — اختر عددًا من ${toArabicDigits(MIN_TARGET)} إلى ${toArabicDigits(MAX_TARGET)}`}
      onClose={onClose}
    >
      <TextInput
        accessibilityLabel="عدد الهدف المخصص"
        autoFocus
        keyboardType="number-pad"
        maxLength={4}
        onChangeText={(value) => {
          setText(value);
          setError(null);
        }}
        onSubmitEditing={save}
        placeholder="مثال: ٥٠"
        placeholderTextColor={colors.textFaint}
        returnKeyType="done"
        style={[styles.input, error ? styles.inputError : null]}
        textAlign="center"
        value={text}
      />
      {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
      <View style={styles.actions}>
        <ModalButton label="حفظ الهدف" primary onPress={save} />
        <ModalButton label="إلغاء" onPress={onClose} />
      </View>
    </ModalShell>
  );
}

type SettingsProps = {
  visible: boolean;
  dhikrId: string;
  hapticsEnabled: boolean;
  onClose: () => void;
  onSelectDhikr: (id: string) => void;
  onToggleHaptics: (enabled: boolean) => void;
};

export function SettingsModal({ visible, dhikrId, hapticsEnabled, onClose, onSelectDhikr, onToggleHaptics }: SettingsProps) {
  return (
    <ModalShell visible={visible} title="الإعدادات" subtitle="اختر الذكر وطريقة الإحساس أثناء العدّ" onClose={onClose}>
      <Text style={styles.sectionLabel}>الذكر الحالي</Text>
      <ScrollView style={styles.optionList} contentContainerStyle={styles.optionListContent}>
        {DHIKR_OPTIONS.map((option) => {
          const selected = option.id === dhikrId;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityLabel={option.phrase}
              accessibilityState={{ checked: selected }}
              onPress={() => onSelectDhikr(option.id)}
              style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
            >
              <View style={[styles.radio, selected && styles.radioSelected]} />
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.phrase}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>اهتزاز خفيف عند كل عدّة</Text>
        <Switch
          accessibilityLabel="الاهتزاز عند العدّ"
          onValueChange={onToggleHaptics}
          value={hapticsEnabled}
          trackColor={{ false: colors.track, true: colors.green }}
          thumbColor={hapticsEnabled ? colors.goldLight : colors.textMuted}
        />
      </View>

      <View style={styles.actions}>
        <ModalButton label="تم" primary onPress={onClose} />
      </View>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: colors.backdrop,
    direction: 'rtl',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.modalCard,
    borderColor: 'rgba(214,185,108,0.35)',
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: '90%',
    maxWidth: 420,
    padding: 22,
    width: '100%',
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(182,198,184,0.24)',
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: 22,
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 12, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryText: { color: colors.onGold, fontSize: 14, fontWeight: '700' },
  secondaryButton: {
    alignItems: 'center',
    borderColor: 'rgba(182,198,184,0.28)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryText: { color: colors.textMuted, fontSize: 14 },
  sectionLabel: { color: colors.textDim, fontSize: 12, marginTop: 18, marginBottom: 8 },
  optionList: { flexGrow: 0 },
  optionListContent: { gap: 6 },
  option: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  optionSelected: { backgroundColor: 'rgba(185,149,84,0.12)', borderColor: 'rgba(214,185,108,0.35)' },
  radio: { borderColor: colors.textDim, borderRadius: 8, borderWidth: 1.5, height: 16, width: 16 },
  radioSelected: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
  optionText: { color: colors.textMuted, fontSize: 15 },
  optionTextSelected: { color: colors.text },
  settingRow: {
    alignItems: 'center',
    borderTopColor: 'rgba(182,198,184,0.14)',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
  },
  settingLabel: { color: colors.text, flexShrink: 1, fontSize: 14 },
  pressed: { opacity: 0.72 },
});
