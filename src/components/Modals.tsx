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

import { formatArabicNumber, normalizeDigits, toArabicDigits } from '../arabic';
import { DHIKR_OPTIONS, DhikrOption, isValidTarget, MAX_TARGET, MIN_TARGET } from '../counter';
import { colors } from '../theme';
import { BookIcon, CheckIcon, CloseIcon, FullScreenIcon, SparkleIcon, VibrateIcon } from './Icons';

type ShellProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

function ModalShell({ visible, title, subtitle, onClose, children }: ShellProps) {
  return (
    <Modal animationType="fade" transparent statusBarTranslucent navigationBarTranslucent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable accessibilityLabel="إغلاق" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card} accessibilityViewIsModal>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} accessibilityRole="header">{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <CloseIcon size={18} color={colors.textMuted} />
            </Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ActionButton({
  label,
  variant = 'primary',
  onPress,
}: {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onPress: () => void;
}) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        isPrimary && styles.primaryButton,
        isDanger && styles.dangerButton,
        !isPrimary && !isDanger && styles.secondaryButton,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.actionButtonText,
          isPrimary && styles.primaryText,
          isDanger && styles.dangerText,
          !isPrimary && !isDanger && styles.secondaryText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* =========================================================================
   1. DHIKR PICKER SHEET
   ========================================================================= */

type DhikrPickerProps = {
  visible: boolean;
  selectedId: string;
  onClose: () => void;
  onSelect: (option: DhikrOption) => void;
};

export function DhikrPickerModal({ visible, selectedId, onClose, onSelect }: DhikrPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('الكل');

  const categories = ['الكل', 'تسابيح', 'أذكار جامعة', 'استغفار', 'صلاة على النبي'];

  const filteredDhikrs =
    activeCategory === 'الكل'
      ? DHIKR_OPTIONS
      : DHIKR_OPTIONS.filter((item) => item.category === activeCategory);

  return (
    <ModalShell
      visible={visible}
      title="مكتبة الأذكار"
      subtitle="اختر الذكر المأثور لتبدأ ورده وفضله"
      onClose={onClose}
    >
      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
        style={styles.categoryContainer}
      >
        {categories.map((cat) => {
          const isSelected = activeCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={({ pressed }) => [
                styles.categoryChip,
                isSelected && styles.categoryChipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  isSelected && styles.categoryChipTextSelected,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Dhikr Cards List */}
      <ScrollView style={styles.dhikrList} showsVerticalScrollIndicator={false}>
        {filteredDhikrs.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="radio"
              accessibilityLabel={item.phrase}
              accessibilityState={{ checked: isSelected }}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
              style={({ pressed }) => [
                styles.dhikrCard,
                isSelected && styles.dhikrCardSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.dhikrCardHeader}>
                <View style={styles.dhikrTitleRow}>
                  <Text style={[styles.dhikrTitle, isSelected && styles.dhikrTitleSelected]}>
                    {item.title}
                  </Text>
                  <View style={styles.dhikrBadge}>
                    <Text style={styles.dhikrBadgeText}>الهدف {toArabicDigits(item.defaultTarget)}</Text>
                  </View>
                </View>
                {isSelected && (
                  <View style={styles.selectedCircle}>
                    <CheckIcon size={14} color={colors.onGold} />
                  </View>
                )}
              </View>

              <Text style={styles.dhikrPhrase}>{item.phrase}</Text>

              {item.virtue ? (
                <View style={styles.virtueBox}>
                  <SparkleIcon size={13} color={colors.goldLight} />
                  <Text style={styles.virtueText} numberOfLines={2}>
                    {item.virtue}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </ModalShell>
  );
}

/* =========================================================================
   2. CUSTOM TARGET MODAL
   ========================================================================= */

type CustomTargetProps = {
  visible: boolean;
  currentTarget: number;
  onClose: () => void;
  onSave: (target: number) => void;
};

const TARGET_PRESETS = [33, 99, 100, 300, 500, 1000];

export function CustomTargetModal({ visible, currentTarget, onClose, onSave }: CustomTargetProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setText(toArabicDigits(currentTarget));
      setError(null);
    }
  }, [visible, currentTarget]);

  const handleSave = (targetValue?: number) => {
    const rawVal = targetValue !== undefined ? targetValue : Number(normalizeDigits(text).trim());
    if (!isValidTarget(rawVal)) {
      setError(`يرجى كتابة عدد صحيح بين ${toArabicDigits(MIN_TARGET)} و ${toArabicDigits(MAX_TARGET)}`);
      return;
    }
    onSave(rawVal);
  };

  return (
    <ModalShell
      visible={visible}
      title="تحديد الهدف"
      subtitle={`الهدف الحالي: ${toArabicDigits(currentTarget)} عدّة`}
      onClose={onClose}
    >
      <View style={styles.quickPresetsRow}>
        {TARGET_PRESETS.map((preset) => {
          const isPresetCurrent = currentTarget === preset;
          return (
            <Pressable
              key={preset}
              onPress={() => handleSave(preset)}
              style={({ pressed }) => [
                styles.presetChip,
                isPresetCurrent && styles.presetChipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.presetChipText,
                  isPresetCurrent && styles.presetChipTextSelected,
                ]}
              >
                {toArabicDigits(preset)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.inputSectionLabel}>أو اكتب عددًا مخصصًا:</Text>

      <TextInput
        accessibilityLabel="الهدف المخصص"
        autoFocus
        keyboardType="number-pad"
        maxLength={4}
        onChangeText={(val) => {
          setText(val);
          setError(null);
        }}
        onSubmitEditing={() => handleSave()}
        placeholder="مثال: ٥٠"
        placeholderTextColor={colors.textFaint}
        returnKeyType="done"
        style={[styles.input, error ? styles.inputError : null]}
        textAlign="center"
        value={text}
      />

      {error && <Text style={styles.errorText} accessibilityLiveRegion="polite">{error}</Text>}

      <View style={styles.actions}>
        <ActionButton label="حفظ الهدف" variant="primary" onPress={() => handleSave()} />
        <ActionButton label="إلغاء" variant="secondary" onPress={onClose} />
      </View>
    </ModalShell>
  );
}

/* =========================================================================
   3. SETTINGS MODAL
   ========================================================================= */

type SettingsProps = {
  visible: boolean;
  hapticsEnabled: boolean;
  fullScreenTap: boolean;
  totalSessionCount: number;
  onClose: () => void;
  onToggleHaptics: (enabled: boolean) => void;
  onToggleFullScreenTap: (enabled: boolean) => void;
  onResetStats: () => void;
};

export function SettingsModal({
  visible,
  hapticsEnabled,
  fullScreenTap,
  totalSessionCount,
  onClose,
  onToggleHaptics,
  onToggleFullScreenTap,
  onResetStats,
}: SettingsProps) {
  return (
    <ModalShell
      visible={visible}
      title="الإعدادات والتفضيلات"
      subtitle="تخصيص تجربة التسبيح والمزايا اللمسية"
      onClose={onClose}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
        {/* Haptics Switch */}
        <View style={styles.settingItem}>
          <View style={styles.settingItemIconWrap}>
            <VibrateIcon size={20} color={colors.goldLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>الاهتزاز اللمسي</Text>
            <Text style={styles.settingDesc}>نبضة خفيفة عند كل تسبيحة وعند إتمام الهدف</Text>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={onToggleHaptics}
            trackColor={{ false: colors.track, true: colors.green }}
            thumbColor={hapticsEnabled ? colors.goldLight : colors.textMuted}
          />
        </View>

        {/* Fullscreen Tap Switch */}
        <View style={styles.settingItem}>
          <View style={styles.settingItemIconWrap}>
            <FullScreenIcon size={20} color={colors.goldLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>النقر في كامل الشاشة</Text>
            <Text style={styles.settingDesc}>المس أي مكان بالشاشة لزيادة العدّ دون النظر</Text>
          </View>
          <Switch
            value={fullScreenTap}
            onValueChange={onToggleFullScreenTap}
            trackColor={{ false: colors.track, true: colors.green }}
            thumbColor={fullScreenTap ? colors.goldLight : colors.textMuted}
          />
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>مجموع التسبيحات الكلي</Text>
          <Text style={styles.statsCount}>{formatArabicNumber(totalSessionCount)}</Text>
          <Text style={styles.statsSubtext}>تسبيحة وذكر بحمد الله</Text>

          {totalSessionCount > 0 && (
            <Pressable
              onPress={onResetStats}
              style={({ pressed }) => [styles.resetStatsButton, pressed && styles.pressed]}
            >
              <Text style={styles.resetStatsText}>تصفير الإحصائيات</Text>
            </Pressable>
          )}
        </View>

        {/* Spiritual Note */}
        <View style={styles.aboutBox}>
          <BookIcon size={16} color={colors.goldLight} />
          <Text style={styles.aboutText}>
            تطبيق «ذِكر» صُمم ليكون رفيقًا هادئًا لذكر الله، خاليًا تمامًا من الإعلانات والتتبع. بياناتك محفوظة محليًا على جهازك فقط.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <ActionButton label="تم" variant="primary" onPress={onClose} />
      </View>
    </ModalShell>
  );
}

/* =========================================================================
   4. CONFIRMATION MODAL (used for every destructive action)
   ========================================================================= */

type ConfirmProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'إلغاء',
  onClose,
  onConfirm,
}: ConfirmProps) {
  return (
    <ModalShell visible={visible} title={title} subtitle={message} onClose={onClose}>
      <View style={styles.actions}>
        <ActionButton
          label={confirmLabel}
          variant="danger"
          onPress={() => {
            onConfirm();
            onClose();
          }}
        />
        <ActionButton label={cancelLabel} variant="secondary" onPress={onClose} />
      </View>
    </ModalShell>
  );
}

/* =========================================================================
   STYLES
   ========================================================================= */

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
    borderColor: colors.modalBorder,
    borderRadius: 26,
    borderWidth: 1.2,
    maxHeight: '88%',
    maxWidth: 440,
    padding: 22,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 12.5,
    marginTop: 4,
    lineHeight: 18,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  categoryChipSelected: {
    backgroundColor: colors.goldBadge,
    borderColor: colors.goldBadgeBorder,
  },
  categoryChipText: {
    color: colors.textDim,
    fontSize: 12,
  },
  categoryChipTextSelected: {
    color: colors.goldText,
    fontWeight: '700',
  },
  dhikrList: {
    maxHeight: 380,
  },
  dhikrCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderColor: 'rgba(210, 230, 218, 0.1)',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  dhikrCardSelected: {
    backgroundColor: 'rgba(223, 186, 107, 0.09)',
    borderColor: colors.goldBadgeBorder,
  },
  dhikrCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dhikrTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dhikrTitle: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: '700',
  },
  dhikrTitleSelected: {
    color: colors.goldLight,
  },
  dhikrBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dhikrBadgeText: {
    color: colors.textDim,
    fontSize: 10,
  },
  selectedCircle: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  dhikrPhrase: {
    color: colors.text,
    fontSize: 16.5,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 8,
  },
  virtueBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  virtueText: {
    color: colors.textDim,
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  quickPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minWidth: '28%',
    paddingVertical: 10,
  },
  presetChipSelected: {
    backgroundColor: colors.goldBadge,
    borderColor: colors.goldBadgeBorder,
  },
  presetChipText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  presetChipTextSelected: {
    color: colors.goldText,
    fontWeight: '700',
  },
  inputSectionLabel: {
    color: colors.textDim,
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    borderWidth: 1.2,
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 11.5,
    marginTop: 6,
  },
  settingItem: {
    alignItems: 'center',
    borderBottomColor: 'rgba(210, 230, 218, 0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
  },
  settingItemIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(223, 186, 107, 0.1)',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  settingTitle: {
    color: colors.text,
    fontSize: 14.5,
    fontWeight: '600',
  },
  settingDesc: {
    color: colors.textDim,
    fontSize: 11.5,
    marginTop: 2,
  },
  statsCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(223, 186, 107, 0.2)',
    borderRadius: 18,
    borderWidth: 1,
    marginVertical: 16,
    padding: 16,
  },
  statsLabel: {
    color: colors.textDim,
    fontSize: 12,
  },
  statsCount: {
    color: colors.goldLight,
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 4,
  },
  statsSubtext: {
    color: colors.textMuted,
    fontSize: 11,
  },
  resetStatsButton: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  resetStatsText: {
    color: colors.danger,
    fontSize: 11,
  },
  aboutBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    padding: 12,
  },
  aboutText: {
    color: colors.textDim,
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: colors.gold,
  },
  secondaryButton: {
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
  },
  dangerButton: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryText: {
    color: colors.onGold,
  },
  secondaryText: {
    color: colors.textMuted,
  },
  dangerText: {
    color: colors.danger,
  },
  pressed: {
    opacity: 0.72,
  },
});
