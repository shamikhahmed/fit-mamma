/** Celebration stickers: pure rules for when to pop one. */

export interface Sticker {
  emoji: string;
  title: string;
  sub?: string;
}

/**
 * Weigh-in milestone vs every earlier primary weigh-in (same-day entries excluded by the caller).
 * Whole-kg drops below the start weight win over a plain "new lowest"; the goal wins over both.
 */
export function weightSticker(earlier: number[], kg: number, startKg: number, targetKg: number): Sticker | null {
  if (kg <= targetKg && !earlier.some((w) => w <= targetKg)) {
    return { emoji: '👑', title: 'Goal reached!', sub: `${kg} kg. Eid Mubarak in advance, Mamma!` };
  }
  if (earlier.length === 0) return null;
  const lowest = Math.min(...earlier, startKg);
  if (kg >= lowest) return null;
  const lostBefore = Math.floor(startKg - lowest);
  const lostNow = Math.floor(startKg - kg);
  if (lostNow >= 1 && lostNow > lostBefore) {
    return { emoji: '🌸', title: `${lostNow} kg down!`, sub: 'Well done, Mamma!' };
  }
  return { emoji: '🎉', title: 'New lowest weight!', sub: `${kg} kg` };
}

/** Pops when the last planned exercise of the day gets its first log. */
export function workoutSticker(loggedBefore: string[], name: string, planned: number): Sticker | null {
  const set = new Set(loggedBefore.map((n) => n.toLowerCase()));
  if (set.has(name.toLowerCase())) return null;
  if (planned > 0 && set.size + 1 >= planned) return { emoji: '💪', title: 'Workout done!', sub: 'Well done, Mamma!' };
  return null;
}
