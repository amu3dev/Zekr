import type { Routine } from './routines';

/** Presentation grouping only. Every narration keeps its own start/resume ID. */
export function groupRoutineSequences(routines: readonly Routine[]) {
  const groups = new Map<string, { key: string; variants: Routine[] }>();
  for (const routine of routines) {
    const key = JSON.stringify(routine.steps.map(step => [step.dhikrId, step.repetitions]));
    const group = groups.get(key);
    if (group) group.variants.push(routine);
    else groups.set(key, { key, variants: [routine] });
  }
  return [...groups.values()];
}
