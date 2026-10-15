import { useMemo, useState, type ReactNode } from 'react';
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
  useWindowDimensions,
  View,
} from 'react-native';

import { formatArabicNumber, normalizeDigits, toArabicDigits } from '../arabic';
import { DHIKR_OPTIONS, DhikrOption, isValidTarget, MAX_TARGET, MIN_TARGET } from '../counter';
import { THEME_OPTIONS, useTheme } from '../theme';
import type { ThemeTokens } from '../theme';
import { BookIcon, CheckIcon, ChevronDownIcon, CloseIcon, FullScreenIcon, SparkleIcon, VibrateIcon } from './Icons';
import { CurrentThemeCard, ThemeGallery } from './ThemeGallery';
import { StorageSaveNotice } from './StorageNotice';

type ShellProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  closeLabel?: string;
  animationType?: 'none' | 'fade';
  textScaleLimit?: number;
};

function useModalStyles() {
  const { theme } = useTheme();
  return useMemo(() => createStyles(theme), [theme]);
}

function ModalShell({
  visible, title, subtitle, onClose, children,
  closeLabel = 'إغلاق', animationType = 'fade', textScaleLimit,
}: ShellProps) {
  const styles = useModalStyles();

  return (
    <Modal
      animationType={animationType}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable accessible={false} importantForAccessibility="no" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.sheetHandle} />

          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={textScaleLimit}>
                {title}
              </Text>
              {subtitle && (
                <Text
                  maxFontSizeMultiplier={textScaleLimit}
                  style={[styles.subtitle, textScaleLimit ? { lineHeight: undefined } : null]}
                >
                  {subtitle}
                </Text>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <CloseIcon size={18} color={styles.closeIcon.color} />
            </Pressable>
          </View>
          {visible && <StorageSaveNotice />}
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
  textScaleLimit,
}: {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  textScaleLimit?: number;
  onPress: () => void;
}) {
  const styles = useModalStyles();
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
        maxFontSizeMultiplier={textScaleLimit}
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
  const styles = useModalStyles();
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
        style={styles.categoryContainer}
      >
        {categories.map((category) => {
          const isSelected = activeCategory === category;
          return (
            <Pressable
              key={category}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              onPress={() => setActiveCategory(category)}
              style={({ pressed }) => [
                styles.categoryChip,
                isSelected && styles.categoryChipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.dhikrList} showsVerticalScrollIndicator={false}>
        {filteredDhikrs.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="radio"
              accessibilityLabel={item.phrase}
              accessibilityState={{ checked: isSelected }}
              onPress={() => onSelect(item)}
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
                    <CheckIcon size={14} color={styles.selectedCheck.color} />
                  </View>
                )}
              </View>

              <Text style={styles.dhikrPhrase}>{item.phrase}</Text>

              {item.virtue ? (
                <View style={styles.virtueBox}>
                  <SparkleIcon size={13} color={styles.warmIcon.color} />
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
  const styles = useModalStyles();
  const [previouslyVisible, setPreviouslyVisible] = useState(visible);
  const [previousTarget, setPreviousTarget] = useState(currentTarget);
  const [text, setText] = useState(() => toArabicDigits(currentTarget));
  const [error, setError] = useState<string | null>(null);

  if (visible !== previouslyVisible || (visible && currentTarget !== previousTarget)) {
    setPreviouslyVisible(visible);
    if (currentTarget !== previousTarget) setPreviousTarget(currentTarget);
    if (visible) {
      setText(toArabicDigits(currentTarget));
      setError(null);
    }
  }

  const handleClose = () => {
    setText(toArabicDigits(currentTarget));
    setError(null);
    onClose();
  };

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
      onClose={handleClose}
    >
      <View style={styles.quickPresetsRow}>
        {TARGET_PRESETS.map((preset) => {
          const isPresetCurrent = currentTarget === preset;
          return (
            <Pressable
              key={preset}
              accessibilityRole="radio"
              accessibilityState={{ checked: isPresetCurrent }}
              onPress={() => handleSave(preset)}
              style={({ pressed }) => [
                styles.presetChip,
                isPresetCurrent && styles.presetChipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.presetChipText, isPresetCurrent && styles.presetChipTextSelected]}>
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
        onChangeText={(value) => {
          setText(value);
          setError(null);
        }}
        onSubmitEditing={() => handleSave()}
        placeholder="مثال: ٥٠"
        placeholderTextColor={styles.inputPlaceholder.color}
        returnKeyType="done"
        style={[styles.input, error ? styles.inputError : null]}
        textAlign="center"
        value={text}
      />

      {error && (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}

      <View style={styles.actions}>
        <ActionButton label="حفظ الهدف" variant="primary" onPress={() => handleSave()} />
        <ActionButton label="إلغاء" variant="secondary" onPress={handleClose} />
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
  visualEffectsEnabled: boolean;
  fullScreenTap: boolean;
  totalSessionCount: number;
  onClose: () => void;
  onToggleHaptics: (enabled: boolean) => void;
  onToggleVisualEffects: (enabled: boolean) => void;
  onToggleFullScreenTap: (enabled: boolean) => void;
  onResetStats: () => void;
};

export function SettingsModal({
  visible,
  hapticsEnabled,
  visualEffectsEnabled,
  fullScreenTap,
  totalSessionCount,
  onClose,
  onToggleHaptics,
  onToggleVisualEffects,
  onToggleFullScreenTap,
  onResetStats,
}: SettingsProps) {
  const styles = useModalStyles();
  const { theme } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const [showGallery, setShowGallery] = useState(false);
  const handleClose = () => {
    setShowGallery(false);
    onClose();
  };
  const handleBack = () => setShowGallery(false);

  return (
    <ModalShell
      visible={visible}
      title={showGallery ? 'معرض المظاهر' : 'الإعدادات والتفضيلات'}
      subtitle={showGallery ? 'اختر المظهر الذي يناسبك' : 'خصص هدوء التجربة كما تحب'}
      onClose={showGallery ? handleBack : handleClose}
      closeLabel={showGallery ? 'العودة إلى الإعدادات' : 'إغلاق'}
      animationType="none"
      textScaleLimit={2}
    >
      {showGallery ? (
        <ThemeGallery />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.settingsScroll}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>المظهر</Text>
            <Text style={styles.sectionHint}>يتغير فورًا</Text>
          </View>
          <CurrentThemeCard compact={width >= 360 && fontScale < 1.3} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`استعراض المظاهر، ${toArabicDigits(THEME_OPTIONS.length)} مظاهر متاحة`}
            accessibilityHint="يفتح معرض المظاهر لاختيار المظهر"
            onPress={() => setShowGallery(true)}
            style={({ pressed }) => [styles.browseThemes, pressed && styles.pressed]}
          >
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { textAlign: 'right' }]}>استعراض المظاهر</Text>
              <Text style={styles.browseCount}>{toArabicDigits(THEME_OPTIONS.length)} مظاهر متاحة</Text>
            </View>
            <View style={{ transform: [{ rotate: '90deg' }] }}>
              <ChevronDownIcon size={20} color={theme.textMuted} />
            </View>
          </Pressable>

          <View style={styles.settingItem}>
            <View style={styles.settingItemIconWrap}>
              <VibrateIcon size={20} color={theme.iconAccent} />
            </View>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.settingCopy}
            >
              <Text style={styles.settingTitle}>الاهتزاز اللمسي</Text>
              <Text style={styles.settingDesc}>نبضة خفيفة عند كل تسبيحة وعند إتمام الهدف</Text>
            </View>
            <Switch
              accessibilityLabel="الاهتزاز اللمسي"
              accessibilityHint="نبضة خفيفة عند كل تسبيحة وعند إتمام الهدف"
              value={hapticsEnabled}
              onValueChange={onToggleHaptics}
              trackColor={{ false: theme.track, true: theme.accent }}
              thumbColor={hapticsEnabled ? theme.warm : theme.textMuted}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingItemIconWrap}>
              <SparkleIcon size={20} color={theme.iconAccent} />
            </View>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.settingCopy}
            >
              <Text style={styles.settingTitle}>المؤثرات البصرية</Text>
              <Text style={styles.settingDesc}>حركة التقدم ونبضة هادئة مع كل عدّة في العداد والنقر الحر</Text>
            </View>
            <Switch
              accessibilityLabel="المؤثرات البصرية"
              accessibilityHint="تشغيل حركة التقدم ونبضات العدّ في العداد والنقر الحر أو إيقافها"
              value={visualEffectsEnabled}
              onValueChange={onToggleVisualEffects}
              trackColor={{ false: theme.track, true: theme.accent }}
              thumbColor={visualEffectsEnabled ? theme.warm : theme.textMuted}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingItemIconWrap}>
              <FullScreenIcon size={20} color={theme.iconAccent} />
            </View>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.settingCopy}
            >
              <Text style={styles.settingTitle}>النقر في كامل الشاشة</Text>
              <Text style={styles.settingDesc}>المس أي مكان بالشاشة لزيادة العدّ دون النظر</Text>
            </View>
            <Switch
              accessibilityLabel="النقر في كامل الشاشة"
              accessibilityHint="المس أي مكان بالشاشة لزيادة العدّ دون النظر"
              value={fullScreenTap}
              onValueChange={onToggleFullScreenTap}
              trackColor={{ false: theme.track, true: theme.accent }}
              thumbColor={fullScreenTap ? theme.warm : theme.textMuted}
            />
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>مجموع التسبيحات الكلي</Text>
            <Text style={styles.statsCount}>{formatArabicNumber(totalSessionCount)}</Text>
            <Text style={styles.statsSubtext}>تسبيحة وذكر بحمد الله</Text>

            {totalSessionCount > 0 && (
              <Pressable
                accessibilityRole="button"
                onPress={onResetStats}
                style={({ pressed }) => [styles.resetStatsButton, pressed && styles.pressed]}
              >
                <Text style={styles.resetStatsText}>تصفير الإحصائيات</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.aboutBox}>
            <BookIcon size={16} color={theme.iconAccent} />
            <Text style={styles.aboutText}>
              تطبيق «ذِكر» صُمم ليكون رفيقًا هادئًا لذكر الله، خاليًا تمامًا من الإعلانات والتتبع. بياناتك محفوظة محليًا على جهازك فقط.
            </Text>
          </View>
        </ScrollView>
      )}

      <View style={styles.actions}>
        <ActionButton
          textScaleLimit={2}
          label={showGallery ? 'العودة إلى الإعدادات' : 'تم'}
          variant="primary"
          onPress={showGallery ? handleBack : handleClose}
        />
      </View>
    </ModalShell>
  );
}

/* =========================================================================
   4. CONFIRMATION MODAL
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
  const styles = useModalStyles();

  return (
    <ModalShell visible={visible} title={title} subtitle={message} onClose={onClose}>
      <View style={styles.actions}>
        <ActionButton
          label={confirmLabel}
          variant="danger"
          onPress={onConfirm}
        />
        <ActionButton label={cancelLabel} variant="secondary" onPress={onClose} />
      </View>
    </ModalShell>
  );
}

/* =========================================================================
   STYLES
   ========================================================================= */

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    backdrop: {
      alignItems: 'center',
      backgroundColor: theme.backdrop,
      direction: 'rtl',
      flex: 1,
      justifyContent: 'center',
      padding: 18,
    },
    card: {
      backgroundColor: theme.modalCard,
      borderColor: theme.modalBorder,
      borderRadius: 26,
      borderWidth: 1.2,
      maxHeight: '90%',
      maxWidth: 440,
      padding: 20,
      width: '100%',
      shadowColor: theme.background,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.45,
      shadowRadius: 24,
      elevation: 10,
    },
    sheetHandle: {
      alignSelf: 'center',
      backgroundColor: theme.surfaceBorder,
      borderRadius: 3,
      height: 4,
      marginBottom: 14,
      width: 38,
    },
    modalHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    modalHeaderCopy: {
      flex: 1,
      paddingRight: 12,
    },
    title: {
      color: theme.text,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    subtitle: {
      color: theme.textDim,
      fontSize: 12.5,
      lineHeight: 18,
      marginTop: 4,
    },
    closeButton: {
      alignItems: 'center',
      backgroundColor: theme.surfaceSoft,
      borderColor: theme.surfaceBorder,
      borderRadius: 18,
      borderWidth: 1,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    closeIcon: { color: theme.textMuted },
    categoryContainer: {
      marginBottom: 12,
    },
    categoryScroll: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 2,
    },
    categoryChip: {
      backgroundColor: theme.surfaceSoft,
      borderColor: theme.surfaceBorder,
      borderRadius: 16,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    categoryChipSelected: {
      backgroundColor: theme.warmSurface,
      borderColor: theme.warmBorder,
    },
    categoryChipText: {
      color: theme.textDim,
      fontSize: 12,
    },
    categoryChipTextSelected: {
      color: theme.warm,
      fontWeight: '700',
    },
    dhikrList: {
      maxHeight: 390,
    },
    dhikrCard: {
      backgroundColor: theme.surfaceSoft,
      borderColor: theme.surfaceBorder,
      borderRadius: 20,
      borderWidth: 1.2,
      marginBottom: 12,
      padding: 16,
    },
    dhikrCardSelected: {
      backgroundColor: theme.warmSurface,
      borderColor: theme.warmBorder,
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
      color: theme.textSoft,
      fontSize: 14,
      fontWeight: '700',
    },
    dhikrTitleSelected: {
      color: theme.warm,
    },
    dhikrBadge: {
      backgroundColor: theme.surfaceElevated,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    dhikrBadgeText: {
      color: theme.textDim,
      fontSize: 10,
    },
    selectedCircle: {
      alignItems: 'center',
      backgroundColor: theme.warm,
      borderRadius: 12,
      height: 24,
      justifyContent: 'center',
      width: 24,
    },
    selectedCheck: { color: theme.onWarm },
    warmIcon: { color: theme.warm },
    dhikrPhrase: {
      color: theme.text,
      fontSize: 16.5,
      fontWeight: '600',
      lineHeight: 26,
      marginBottom: 8,
    },
    virtueBox: {
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 12,
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    virtueText: {
      color: theme.textDim,
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
      backgroundColor: theme.surfaceSoft,
      borderColor: theme.surfaceBorder,
      borderRadius: 14,
      borderWidth: 1,
      flex: 1,
      minWidth: '28%',
      paddingVertical: 10,
    },
    presetChipSelected: {
      backgroundColor: theme.warmSurface,
      borderColor: theme.warmBorder,
    },
    presetChipText: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
    presetChipTextSelected: {
      color: theme.warm,
      fontWeight: '700',
    },
    inputSectionLabel: {
      color: theme.textDim,
      fontSize: 12,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.surfaceSoft,
      borderColor: theme.surfaceBorder,
      borderRadius: 16,
      borderWidth: 1.2,
      color: theme.text,
      fontSize: 24,
      fontWeight: '700',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    inputPlaceholder: { color: theme.textFaint },
    inputError: {
      borderColor: theme.danger,
    },
    errorText: {
      color: theme.danger,
      fontSize: 11.5,
      marginTop: 6,
    },
    settingsScroll: {
      maxHeight: 510,
      flexShrink: 1,
    },
    sectionHeaderRow: {
      alignItems: 'baseline',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '800',
    },
    sectionHint: {
      color: theme.textDim,
      fontSize: 11,
    },
    browseThemes: {
      alignItems: 'center',
      backgroundColor: theme.surfaceSoft,
      borderColor: theme.surfaceBorder,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 12,
      marginTop: 10,
      marginBottom: 8,
      minHeight: 60,
      padding: 14,
    },
    browseCount: {
      color: theme.textMuted,
      fontSize: 12,
      marginTop: 4,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    settingItem: {
      alignItems: 'center',
      borderBottomColor: theme.surfaceBorder,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 14,
    },
    settingItemIconWrap: {
      alignItems: 'center',
      backgroundColor: theme.warmSurface,
      borderRadius: 12,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    settingCopy: {
      flex: 1,
    },
    settingTitle: {
      color: theme.text,
      fontSize: 14.5,
      fontWeight: '600',
    },
    settingDesc: {
      color: theme.textDim,
      fontSize: 11.5,
      marginTop: 2,
    },
    statsCard: {
      alignItems: 'center',
      backgroundColor: theme.surfaceSoft,
      borderColor: theme.warmBorder,
      borderRadius: 18,
      borderWidth: 1,
      marginVertical: 16,
      padding: 16,
    },
    statsLabel: {
      color: theme.textDim,
      fontSize: 12,
    },
    statsCount: {
      color: theme.warm,
      fontSize: 32,
      fontWeight: '800',
      marginVertical: 4,
    },
    statsSubtext: {
      color: theme.textMuted,
      fontSize: 11,
    },
    resetStatsButton: {
      marginTop: 10,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    resetStatsText: {
      color: theme.danger,
      fontSize: 11,
    },
    aboutBox: {
      alignItems: 'center',
      backgroundColor: theme.surfaceSoft,
      borderRadius: 14,
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
      padding: 12,
    },
    aboutText: {
      color: theme.textDim,
      flex: 1,
      fontSize: 11,
      lineHeight: 16,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 18,
    },
    actionButton: {
      alignItems: 'center',
      borderRadius: 14,
      flex: 1,
      justifyContent: 'center',
      minHeight: 48,
      paddingVertical: 10,
      paddingHorizontal: 8,
    },
    primaryButton: {
      backgroundColor: theme.warm,
    },
    secondaryButton: {
      borderColor: theme.surfaceBorder,
      borderWidth: 1,
    },
    dangerButton: {
      backgroundColor: theme.dangerBg,
      borderColor: theme.dangerBorder,
      borderWidth: 1,
    },
    actionButtonText: {
      textAlign: 'center',
      flexShrink: 1,
      fontSize: 14,
      fontWeight: '700',
    },
    primaryText: {
      color: theme.onWarm,
    },
    secondaryText: {
      color: theme.textMuted,
    },
    dangerText: {
      color: theme.danger,
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
