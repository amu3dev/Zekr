export const TOTAL_BEADS = 33;

/** Returns how many beads are active in the current 33-count loop. */
export function getActiveBeadCount(count: number): number {
  if (!Number.isSafeInteger(count) || count <= 0) return 0;
  return ((count - 1) % TOTAL_BEADS) + 1;
}

/** The boundary tap still belongs to the cycle it completes. */
export function getBeadCycle(count: number): number {
  return Number.isSafeInteger(count) && count > 0 ? Math.ceil(count / TOTAL_BEADS) : 1;
}
