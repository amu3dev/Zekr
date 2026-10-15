import { useCallback, useMemo, type PropsWithChildren } from 'react';

import { usePersistentState } from './hooks/usePersistentState';
import { themePersistence } from './storage';
import { THEMES, ThemeContext, type ThemeId } from './theme';

export function ThemeProvider({ children }: PropsWithChildren) {
  const { value: themeId, hydration, saveStatus } = usePersistentState(themePersistence);
  const isReady = hydration === 'ready';

  const setThemeId = useCallback((nextThemeId: ThemeId) => {
    themePersistence.update(() => nextThemeId);
  }, []);

  const value = useMemo(
    () => ({ themeId, theme: THEMES[themeId], setThemeId, isReady, hydration, saveStatus }),
    [isReady, setThemeId, themeId, hydration, saveStatus],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
