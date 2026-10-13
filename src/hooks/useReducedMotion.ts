import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** null means unresolved; consumers must not animate until explicitly false. */
export function useReducedMotion(): boolean | null {
  const [reduced, setReduced] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      changed = true;
      if (active) setReduced(value);
    });
    AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => { if (active && !changed) setReduced(value); },
      () => { if (active && !changed) setReduced(true); },
    );
    return () => { active = false; subscription.remove(); };
  }, []);

  return reduced;
}
