import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';

import { canAutoRead } from '../smartReading';
import { useReducedMotion } from './useReducedMotion';

export function useReadingSafety() {
  const reduced = useReducedMotion();
  const [reader, setReader] = useState<boolean | null>(null);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', value => {
      changed = true;
      if (active) setReader(value);
    });
    AccessibilityInfo.isScreenReaderEnabled().then(value => {
      if (active && !changed) setReader(value);
    }, () => { if (active && !changed) setReader(true); });
    const app = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => { active = false; subscription.remove(); app.remove(); };
  }, []);
  return { canAnimate: canAutoRead(reduced, reader, foreground), staticReading: reader !== false };
}
