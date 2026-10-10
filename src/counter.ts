export const MIN_TARGET = 1;
export const MAX_TARGET = 9999;
export const PRESET_TARGETS = [33, 99, 100] as const;

export type DhikrOption = { id: string; title: string; phrase: string };

export const DHIKR_OPTIONS: DhikrOption[] = [
  { id: 'istighfar', title: 'الاستغفار', phrase: 'أستغفر الله' },
  { id: 'tasbih', title: 'التسبيح', phrase: 'سبحان الله' },
  { id: 'tahmid', title: 'التحميد', phrase: 'الحمد لله' },
  { id: 'takbir', title: 'التكبير', phrase: 'الله أكبر' },
  { id: 'tahlil', title: 'التهليل', phrase: 'لا إله إلا الله' },
  { id: 'salawat', title: 'الصلاة على النبي', phrase: 'اللهم صلِّ على محمد' },
];

export type CounterState = {
  count: number;
  target: number;
  dhikrId: string;
  hapticsEnabled: boolean;
};

export type CounterAction =
  | { type: 'increment' }
  | { type: 'undo' }
  | { type: 'reset' }
  | { type: 'setTarget'; target: number }
  | { type: 'setDhikr'; dhikrId: string }
  | { type: 'setHaptics'; enabled: boolean }
  | { type: 'restore'; state: CounterState };

export const initialCounterState: CounterState = {
  count: 0,
  target: 33,
  dhikrId: DHIKR_OPTIONS[0].id,
  hapticsEnabled: true,
};

export function isValidTarget(value: number) {
  return Number.isInteger(value) && value >= MIN_TARGET && value <= MAX_TARGET;
}

export function getDhikr(id: string): DhikrOption {
  return DHIKR_OPTIONS.find((option) => option.id === id) ?? DHIKR_OPTIONS[0];
}

export function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 };
    case 'undo':
      return state.count === 0 ? state : { ...state, count: state.count - 1 };
    case 'reset':
      return { ...state, count: 0 };
    case 'setTarget':
      return isValidTarget(action.target) ? { ...state, target: action.target } : state;
    case 'setDhikr':
      return { ...state, dhikrId: getDhikr(action.dhikrId).id };
    case 'setHaptics':
      return { ...state, hapticsEnabled: action.enabled };
    case 'restore':
      return action.state;
  }
}

/** Builds a valid state from untrusted persisted data, falling back field by field. */
export function sanitizeCounterState(raw: unknown): CounterState {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof CounterState, unknown>>;
  const fallback = initialCounterState;
  return {
    count: typeof data.count === 'number' && Number.isInteger(data.count) && data.count >= 0
      ? data.count
      : fallback.count,
    target: typeof data.target === 'number' && isValidTarget(data.target) ? data.target : fallback.target,
    dhikrId: typeof data.dhikrId === 'string' ? getDhikr(data.dhikrId).id : fallback.dhikrId,
    hapticsEnabled: typeof data.hapticsEnabled === 'boolean' ? data.hapticsEnabled : fallback.hapticsEnabled,
  };
}
