import AsyncStorage from '@react-native-async-storage/async-storage';

import { type CounterState, initialCounterState, MAX_TARGET, sanitizeCounterState } from './counter';
import { PersistentState } from './persistence';
import { DEFAULT_READING, parseReadingPreferences, type ReadingPreferences } from './smartReading';
import { initialRoutineState, parseRoutineState, type RoutineState } from './routines';
import { DEFAULT_THEME_ID, isThemeId, type ThemeId } from './theme';

const STORAGE_KEY = '@dhikr/counter-state/v1';
const THEME_STORAGE_KEY = '@dhikr/theme/v1';
const ROUTINE_STORAGE_KEY = '@dhikr/routines/v1';

/** Native getItem collapses an existing empty string to null. Confirm absence
 * before allowing defaults; unreadable data and uncertain existence fail closed.
 */
async function loadStoredValue(key: string): Promise<string | null> {
  const stored = await AsyncStorage.getItem(key);
  if (stored !== null) return stored;

  let existenceCheckFailed = false;
  const keys = await AsyncStorage.getAllKeys((error) => {
    // The installed native adapter can resolve keys despite a callback error.
    existenceCheckFailed = error != null;
  });
  if (existenceCheckFailed || !Array.isArray(keys) ||
    Array.from(keys).some((storedKey) => typeof storedKey !== 'string') || keys.includes(key)) {
    throw new Error('Cannot confirm missing storage key');
  }
  return null;
}

/** Only a successful missing-key read means a new installation. Errors propagate. */
export async function loadCounterState(): Promise<CounterState | null> {
  const stored = await loadStoredValue(STORAGE_KEY);
  if (stored === null) return null;
  const raw: unknown = JSON.parse(stored);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Invalid saved counter');
  }
  const data = raw as Partial<CounterState>;
  // Preserve unreadable progress rather than sanitizing it into writable zeros.
  // Legacy missing fields still use the existing field-by-field migration;
  // obsolete cycle metadata is ignored.
  for (const field of ['count', 'totalSessionCount'] as const) {
    const value = data[field];
    if (value !== undefined && (!Number.isSafeInteger(value) || value < 0 ||
      value > Number.MAX_SAFE_INTEGER - (field === 'count' ? MAX_TARGET : 0))) {
      throw new Error('Invalid saved progress');
    }
  }
  return sanitizeCounterState(raw);
}

export async function saveCounterState(state: CounterState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function loadThemePreference(): Promise<ThemeId | null> {
  const stored = await loadStoredValue(THEME_STORAGE_KEY);
  if (stored === null) return null;
  if (!isThemeId(stored)) throw new Error('Invalid saved theme');
  return stored;
}

export async function saveThemePreference(themeId: ThemeId): Promise<void> {
  await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
}

export async function loadRoutineState(): Promise<RoutineState | null> {
  const stored = await loadStoredValue(ROUTINE_STORAGE_KEY);
  return stored === null ? null : parseRoutineState(JSON.parse(stored));
}

export async function saveRoutineState(state: RoutineState): Promise<void> {
  await AsyncStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(state));
}

export const routinePersistence = new PersistentState({
  initialValue: initialRoutineState,
  read: loadRoutineState,
  write: saveRoutineState,
});

// Shared owners survive component remounts and StrictMode effect replay. Screens
// never call the raw writers, so background, retry and autosave cannot race.
export const counterPersistence = new PersistentState({
  initialValue: initialCounterState,
  read: loadCounterState,
  write: saveCounterState,
});

export const themePersistence = new PersistentState({
  initialValue: DEFAULT_THEME_ID,
  read: loadThemePreference,
  write: saveThemePreference,
  intervalMs: 0,
});

// A separate versioned key cannot migrate, reset or overwrite counting progress.
export async function loadReadingPreferences(): Promise<ReadingPreferences | null> {
  const stored = await loadStoredValue('@dhikr/reading/v1');
  return stored === null ? null : parseReadingPreferences(JSON.parse(stored));
}
export async function saveReadingPreferences(value: ReadingPreferences): Promise<void> {
  await AsyncStorage.setItem('@dhikr/reading/v1', JSON.stringify(value));
}
export const readingPersistence = new PersistentState({
  initialValue: DEFAULT_READING, read: loadReadingPreferences, write: saveReadingPreferences, intervalMs: 0,
});
