import { getDhikr } from './counter.ts';

export type Routine = {
  id: string;
  definitionVersion: 1;
  title: string;
  context: 'afterPrayer' | 'beforeSleep';
  description: string;
  steps: readonly { dhikrId: string; repetitions: number }[];
  source: { collection: string; reference: string; url: string };
  total: number;
};

export const ROUTINE_CONTEXTS = {
  afterPrayer: 'أذكار بعد الصلاة',
  beforeSleep: 'أذكار قبل النوم',
} as const;

// Phrase content is shared with the individual library. These definitions are
// curated variants, not a combination of separate narrations or a ranking.
export const ROUTINES: readonly Routine[] = [
  {
    id: 'afterPrayer99Tahlil', definitionVersion: 1,
    title: 'تسبيح بعد الصلاة — تمام المائة', context: 'afterPrayer',
    description: 'بعد الصلاة المفروضة: ثلاث وثلاثون من كل ذكر، ثم التهليل مرة.',
    steps: [{ dhikrId: 'tasbih', repetitions: 33 }, { dhikrId: 'tahmid', repetitions: 33 },
      { dhikrId: 'takbir', repetitions: 33 }, { dhikrId: 'tahlil', repetitions: 1 }],
    source: { collection: 'صحيح مسلم', reference: '597a', url: 'https://sunnah.com/muslim/5/188' }, total: 100,
  },
  {
    id: 'afterPrayer100', definitionVersion: 1,
    title: 'تسبيح بعد الصلاة — ٣٣، ٣٣، ٣٤', context: 'afterPrayer',
    description: 'بعد الصلاة المفروضة: التسبيح والتحميد ثلاثًا وثلاثين، والتكبير أربعًا وثلاثين.',
    steps: [{ dhikrId: 'tasbih', repetitions: 33 }, { dhikrId: 'tahmid', repetitions: 33 },
      { dhikrId: 'takbir', repetitions: 34 }],
    source: { collection: 'صحيح مسلم', reference: '596a', url: 'https://sunnah.com/muslim:596a' }, total: 100,
  },
  {
    id: 'afterPrayer30', definitionVersion: 1,
    title: 'التسبيح المختصر بعد الصلاة', context: 'afterPrayer',
    description: 'بعد الصلاة: التسبيح والتحميد والتكبير عشر مرات لكل ذكر.',
    steps: [{ dhikrId: 'tasbih', repetitions: 10 }, { dhikrId: 'tahmid', repetitions: 10 },
      { dhikrId: 'takbir', repetitions: 10 }],
    source: { collection: 'سنن أبي داود', reference: '5065', url: 'https://dorar.net/h/loc9eOdh' }, total: 30,
  },
  {
    id: 'beforeSleep100', definitionVersion: 1,
    title: 'تسبيح ما قبل النوم', context: 'beforeSleep',
    description: 'عند النوم: التسبيح والتحميد ثلاثًا وثلاثين، والتكبير أربعًا وثلاثين.',
    steps: [{ dhikrId: 'tasbih', repetitions: 33 }, { dhikrId: 'tahmid', repetitions: 33 },
      { dhikrId: 'takbir', repetitions: 34 }],
    source: { collection: 'صحيح البخاري', reference: '5361', url: 'https://sunnah.com/bukhari:5361' }, total: 100,
  },
];

export function getRoutine(id: string) {
  return ROUTINES.find(routine => routine.id === id);
}

export type RoutineSession = { routineId: string; definitionVersion: 1; completedRepetitions: number };
export type RoutineState = {
  version: 1;
  inRoutine: boolean;
  session: RoutineSession | null;
  totalRecorded: number;
};
export const initialRoutineState: RoutineState = { version: 1, inRoutine: false, session: null, totalRecorded: 0 };

/** One authoritative integer makes transitions and boundary undo exact inverses.
 * Completion is derived, so there is no independently persisted completion flag.
 */
export function getRoutineProgress(session: RoutineSession) {
  const routine = getRoutine(session.routineId);
  if (!routine) throw new Error('Unknown routine');
  let remaining = session.completedRepetitions;
  let stepIndex = 0;
  while (stepIndex < routine.steps.length - 1 && remaining >= routine.steps[stepIndex].repetitions) {
    remaining -= routine.steps[stepIndex].repetitions;
    stepIndex++;
  }
  const step = routine.steps[stepIndex];
  return { routine, stepIndex, stepCount: remaining, stepTarget: step.repetitions,
    dhikr: getDhikr(step.dhikrId), completed: session.completedRepetitions === routine.total,
    overall: session.completedRepetitions };
}
export type RoutineProgress = ReturnType<typeof getRoutineProgress>;

export type RoutineAction =
  | { type: 'start'; routineId: string }
  | { type: 'resume' | 'leave' | 'increment' | 'undo' | 'restart' | 'resetAll' };

// Callers confirm replacement/restart; this engine has no side effects.
export function routineReducer(state: RoutineState, action: RoutineAction): RoutineState {
  if (action.type === 'start') {
    const routine = getRoutine(action.routineId);
    return routine ? { ...state, inRoutine: true, session: { routineId: routine.id,
      definitionVersion: routine.definitionVersion, completedRepetitions: 0 } } : state;
  }
  if (action.type === 'resetAll') return initialRoutineState;
  if (!state.session) return state;
  if (action.type === 'leave') return state.inRoutine ? { ...state, inRoutine: false } : state;
  if (action.type === 'resume') return state.inRoutine ? state : { ...state, inRoutine: true };
  if (!state.inRoutine) return state;
  if (action.type === 'restart') return { ...state, session: { ...state.session, completedRepetitions: 0 } };
  const progress = getRoutineProgress(state.session);
  const delta = action.type === 'increment' ? (progress.completed ? 0 : 1) : (progress.overall > 0 ? -1 : 0);
  if (delta === 0) return state;
  return { ...state, session: { ...state.session, completedRepetitions: progress.overall + delta },
    totalRecorded: Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, state.totalRecorded + delta)) };
}

/** Fail closed on unknown definitions/versions or any invalid progress. Never
 * sanitize a broken saved routine into writable empty data. No v1 counter change.
 */
export function parseRoutineState(raw: unknown): RoutineState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid routine state');
  const data = raw as RoutineState;
  if (data.version !== 1 || typeof data.inRoutine !== 'boolean' ||
    !Number.isSafeInteger(data.totalRecorded) || data.totalRecorded < 0) throw new Error('Invalid routine state');
  if (data.session === null) {
    if (data.inRoutine) throw new Error('Missing active routine');
  } else {
    if (!data.session || typeof data.session !== 'object' || Array.isArray(data.session)) throw new Error('Invalid routine session');
    const routine = getRoutine(data.session.routineId);
    const count = data.session.completedRepetitions;
    if (!routine || data.session.definitionVersion !== routine.definitionVersion ||
      !Number.isInteger(count) || count < 0 || count > routine.total || data.totalRecorded < count) {
      throw new Error('Invalid or obsolete routine progress');
    }
  }
  return data;
}
