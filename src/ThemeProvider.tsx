import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { loadThemePreference, saveThemePreference } from './storage';
import {
  DEFAULT_THEME_ID,
  isThemeId,
  THEMES,
  ThemeContext,
  ThemeId,
} from './theme';

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    loadThemePreference()
      .then((savedThemeId) => {
        if (active && savedThemeId && isThemeId(savedThemeId)) {
          setThemeIdState(savedThemeId);
        }
      })
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const setThemeId = useCallback((nextThemeId: ThemeId) => {
    setThemeIdState(nextThemeId);
    void saveThemePreference(nextThemeId);
  }, []);

  const value = useMemo(
    () => ({ themeId, theme: THEMES[themeId], setThemeId, isReady }),
    [isReady, setThemeId, themeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
