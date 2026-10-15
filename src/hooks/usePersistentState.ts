import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import type { PersistentState } from '../persistence';

export function usePersistentState<T>(store: PersistentState<T>) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  useEffect(() => {
    void store.initialize();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') void store.retry();
      else if (nextState === 'inactive' || nextState === 'background') void store.flush();
    });
    return () => {
      subscription.remove();
      // The runtime owner drains queued writes even if the view is unmounted.
      void store.flush();
    };
  }, [store]);

  return snapshot;
}
