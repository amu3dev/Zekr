import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { DHIKR_OPTIONS } from '../counter';
import { usePersistentState } from '../hooks/usePersistentState';
import { READING_MODES, type ReadingPreferences as Preferences } from '../smartReading';
import { readingPersistence } from '../storage';
import { useTheme } from '../theme';
import { ReadingControl, SmartReadingSurface } from './SmartReadingSurface';

export function ReadingPreferences({ compact = false, phrase }: { compact?: boolean; phrase?: string }) {
  const { theme } = useTheme();
  const { value, hydration, saveStatus } = usePersistentState(readingPersistence);
  const [expanded, setExpanded] = useState(!compact);
  const update = (patch: Partial<Preferences>) => readingPersistence.update(old => ({ ...old, ...patch }));
  const label = READING_MODES.find(mode => mode.id === value.mode)!.label;
  return <View testID="reading-preferences" style={{ gap: 6, paddingVertical: compact ? 0 : 12 }}>
    {compact ? <ReadingControl label={`طريقة القراءة: ${label}`} onPress={() => setExpanded(old => !old)} /> :
      <View style={{ gap: 4 }}><Text accessibilityRole="header" style={{ color: theme.text, fontSize: 17, fontWeight: '700', textAlign: 'right' }}>طريقة قراءة الأذكار</Text><Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 22, textAlign: 'right' }}>نظام القراءة الذكية للأذكار</Text></View>}
    {expanded && <>
      {compact ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
        {READING_MODES.map(mode => <ReadingControl key={mode.id} choice label={mode.label} selected={value.mode === mode.id}
          disabled={hydration !== 'ready'} onPress={() => { update({ mode: mode.id }); if (compact) setExpanded(false); }} />)}
      </ScrollView> : <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4 }}>
        {READING_MODES.map(mode => <View key={mode.id} style={{ width: '48%' }}><ReadingControl choice label={mode.label} selected={value.mode === mode.id}
          disabled={hydration !== 'ready'} onPress={() => { update({ mode: mode.id }); if (compact) setExpanded(false); }} /></View>)}
      </View>}
      {value.mode !== 'full' && <>
        {value.mode !== 'ticker' && <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <ReadingControl choice label="يدوي" selected={value.progression === 'manual'} onPress={() => update({ progression: 'manual' })} />
          <ReadingControl choice label="تلقائي" selected={value.progression === 'automatic'} onPress={() => update({ progression: 'automatic' })} />
        </View>}
        {(value.mode === 'ticker' || value.progression === 'automatic') && <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          {(['slow', 'normal', 'fast'] as const).map((speed, index) => <ReadingControl key={speed} choice label={['بطيء', 'عادي', 'سريع'][index]}
            selected={value.speed === speed} onPress={() => update({ speed })} />)}
        </View>}
      </>}
      {!compact && <View testID="reading-live-preview" style={{ padding: 12, borderRadius: 14, backgroundColor: theme.warmSurface }}>
        <Text style={{ color: theme.textMuted, textAlign: 'right', fontSize: 12, paddingBottom: 8 }}>معاينة حية — سيد الاستغفار</Text>
        {value.mode === 'full' ? <ScrollView style={{ maxHeight: 140 }}><Text style={{ color: theme.text, fontSize: 20, lineHeight: 38, textAlign: 'right', writingDirection: 'rtl', paddingVertical: 8 }}>
          {phrase ?? DHIKR_OPTIONS.find(item => item.id === 'sayyid_istighfar')!.phrase}
        </Text></ScrollView> : <SmartReadingSurface key={value.mode} preview preferences={value}
          phrase={phrase ?? DHIKR_OPTIONS.find(item => item.id === 'sayyid_istighfar')!.phrase} />}
      </View>}
    </>}
    {(hydration === 'error' || saveStatus === 'error') && <ReadingControl label="تعذر حفظ طريقة القراءة — إعادة المحاولة" onPress={() => { void readingPersistence.retry(); }} />}
  </View>;
}
