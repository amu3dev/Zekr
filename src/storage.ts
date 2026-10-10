import AsyncStorage from '@react-native-async-storage/async-storage';

import { CounterState, sanitizeCounterState } from './counter';

const STORAGE_KEY = '@dhikr/counter-state/v1';

/** Returns the saved state, or null when nothing usable is stored. */
export async function loadCounterState(): Promise<CounterState | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? sanitizeCounterState(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

export async function saveCounterState(state: CounterState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage failures are non-fatal; the in-memory count keeps working.
  }
}
