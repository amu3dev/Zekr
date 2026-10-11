export const MIN_TARGET = 1;
export const MAX_TARGET = 9999;
export const PRESET_TARGETS = [33, 99, 100, 1000] as const;

export type DhikrOption = {
  id: string;
  title: string;
  phrase: string;
  virtue: string;
  category: string;
  defaultTarget: number;
};

export const DHIKR_OPTIONS: DhikrOption[] = [
  {
    id: 'tasbih_tahmid',
    title: 'التسبيح والتحميد',
    phrase: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    virtue: 'كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن',
    category: 'تسابيح',
    defaultTarget: 100,
  },
  {
    id: 'istighfar',
    title: 'الاستغفار',
    phrase: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ',
    virtue: 'من لزم الاستغفار جعل الله له من كل همٍّ فرجًا، ومن كل ضيقٍ مخرجًا',
    category: 'استغفار',
    defaultTarget: 100,
  },
  {
    id: 'tasbih',
    title: 'التسبيح',
    phrase: 'سُبْحَانَ اللَّهِ',
    virtue: 'تُغرس لقائلها نخلة في الجنة وتُحط بها الأوزار',
    category: 'تسابيح',
    defaultTarget: 33,
  },
  {
    id: 'tahmid',
    title: 'التحميد',
    phrase: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    virtue: 'الحمد لله تملأ الميزان، وأفضل ما دعا به العبد ربه',
    category: 'تسابيح',
    defaultTarget: 33,
  },
  {
    id: 'takbir',
    title: 'التكبير',
    phrase: 'اللَّهُ أَكْبَرُ كَبِيرًا',
    virtue: 'من أحب الكلام إلى الله وأعظمه إجلالاً وتعظيمًا',
    category: 'تسابيح',
    defaultTarget: 33,
  },
  {
    id: 'tahlil',
    title: 'التهليل',
    phrase: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    virtue: 'أفضل ما قال النبيون، وحصن حصين من الشيطان',
    category: 'أذكار جامعة',
    defaultTarget: 100,
  },
  {
    id: 'hawqala',
    title: 'الحوقلة',
    phrase: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
    virtue: 'كنز من كنوز الجنة، وباب عظيم لدفع الهموم وجلب التيسير',
    category: 'أذكار جامعة',
    defaultTarget: 100,
  },
  {
    id: 'salawat',
    title: 'الصلاة على النبي',
    phrase: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
    virtue: 'من صلى عليّ صلاة واحدة صلى الله عليه بها عشرًا وكُفِي همه',
    category: 'صلاة على النبي',
    defaultTarget: 100,
  },
  {
    id: 'baqiyat',
    title: 'الباقيات الصالحات',
    phrase: 'سُبْحَانَ اللَّهِ ، وَالْحَمْدُ لِلَّهِ ، وَلَا إِلَهَ إِلَّا اللَّهُ ، وَاللَّهُ أَكْبَرُ',
    virtue: 'هن الباقيات الصالحات وخير ما طلعت عليه الشمس',
    category: 'تسابيح',
    defaultTarget: 33,
  },
  {
    id: 'sayyid_istighfar',
    title: 'سيد الاستغفار',
    phrase: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ',
    virtue: 'من قالها موقنًا بها فمات من يومه أو ليلته دخل الجنة',
    category: 'استغفار',
    defaultTarget: 33,
  },
];

export type CounterState = {
  count: number;
  target: number;
  dhikrId: string;
  hapticsEnabled: boolean;
  cycle: number;
  totalSessionCount: number;
  fullScreenTap: boolean;
};

export type CounterAction =
  | { type: 'increment' }
  | { type: 'undo' }
  | { type: 'reset' }
  | { type: 'nextCycle' }
  | { type: 'resetAll' }
  | { type: 'setTarget'; target: number }
  | { type: 'setDhikr'; dhikrId: string }
  | { type: 'setHaptics'; enabled: boolean }
  | { type: 'setFullScreenTap'; enabled: boolean }
  | { type: 'restore'; state: CounterState };

export const initialCounterState: CounterState = {
  count: 0,
  target: 33,
  dhikrId: DHIKR_OPTIONS[0].id,
  hapticsEnabled: true,
  cycle: 1,
  totalSessionCount: 0,
  fullScreenTap: false,
};

export function isValidTarget(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_TARGET && value <= MAX_TARGET;
}

export function getDhikr(id: string): DhikrOption {
  return DHIKR_OPTIONS.find((option) => option.id === id) ?? DHIKR_OPTIONS[0];
}

export function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case 'increment': {
      return {
        ...state,
        count: state.count + 1,
        totalSessionCount: state.totalSessionCount + 1,
      };
    }
    case 'undo': {
      if (state.count === 0) return state;
      return {
        ...state,
        count: state.count - 1,
        totalSessionCount: Math.max(0, state.totalSessionCount - 1),
      };
    }
    case 'nextCycle': {
      return {
        ...state,
        count: 0,
        cycle: state.cycle + 1,
      };
    }
    case 'reset': {
      return {
        ...state,
        count: 0,
        cycle: 1,
      };
    }
    case 'resetAll': {
      return {
        ...state,
        count: 0,
        cycle: 1,
        totalSessionCount: 0,
      };
    }
    case 'setTarget': {
      return isValidTarget(action.target) ? { ...state, target: action.target } : state;
    }
    case 'setDhikr': {
      const selected = getDhikr(action.dhikrId);
      return {
        ...state,
        dhikrId: selected.id,
        count: 0,
        cycle: 1,
        target: selected.defaultTarget,
      };
    }
    case 'setHaptics': {
      return { ...state, hapticsEnabled: action.enabled };
    }
    case 'setFullScreenTap': {
      return { ...state, fullScreenTap: action.enabled };
    }
    case 'restore': {
      return action.state;
    }
  }
}

/** Builds a valid state from untrusted persisted data, falling back field by field. */
export function sanitizeCounterState(raw: unknown): CounterState {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof CounterState, unknown>>;
  const fallback = initialCounterState;

  const count =
    typeof data.count === 'number' && Number.isInteger(data.count) && data.count >= 0
      ? data.count
      : fallback.count;

  const target =
    typeof data.target === 'number' && isValidTarget(data.target) ? data.target : fallback.target;

  const dhikrId = typeof data.dhikrId === 'string' ? getDhikr(data.dhikrId).id : fallback.dhikrId;

  const hapticsEnabled =
    typeof data.hapticsEnabled === 'boolean' ? data.hapticsEnabled : fallback.hapticsEnabled;

  const cycle =
    typeof data.cycle === 'number' && Number.isInteger(data.cycle) && data.cycle >= 1
      ? data.cycle
      : 1;

  const totalSessionCount =
    typeof data.totalSessionCount === 'number' &&
    Number.isInteger(data.totalSessionCount) &&
    data.totalSessionCount >= 0
      ? data.totalSessionCount
      : count;

  const fullScreenTap =
    typeof data.fullScreenTap === 'boolean' ? data.fullScreenTap : fallback.fullScreenTap;

  return {
    count,
    target,
    dhikrId,
    hapticsEnabled,
    cycle,
    totalSessionCount,
    fullScreenTap,
  };
}
