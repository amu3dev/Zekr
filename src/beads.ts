export const TOTAL_BEADS = 33;

/** Returns how many beads are active in the current 33-count loop. */
export function getActiveBeadCount(count: number): number {
  if (count <= 0) return 0;
  return ((count - 1) % TOTAL_BEADS) + 1;
}
