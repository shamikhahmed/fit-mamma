import { describe, expect, it } from 'vitest';
import { weightSticker, workoutSticker } from './stickers';

describe('weightSticker', () => {
  it('stays quiet on the first weigh-in and on no new low', () => {
    expect(weightSticker([], 90, 90, 80)).toBeNull();
    expect(weightSticker([89.5], 89.8, 90, 80)).toBeNull();
  });
  it('celebrates a new low, then each whole kg lost', () => {
    expect(weightSticker([90], 89.6, 90, 80)?.title).toBe('New lowest weight!');
    expect(weightSticker([90, 89.6], 88.9, 90, 80)?.title).toBe('1 kg down!');
    expect(weightSticker([90, 88.9], 88.5, 90, 80)?.title).toBe('New lowest weight!');
  });
  it('celebrates the goal once', () => {
    expect(weightSticker([81], 80, 90, 80)?.emoji).toBe('👑');
    expect(weightSticker([81, 79.9], 79.8, 90, 80)?.emoji).not.toBe('👑');
  });
});

describe('workoutSticker', () => {
  it('pops on the last new exercise only', () => {
    expect(workoutSticker(['A', 'B'], 'C', 3)?.title).toBe('Workout done!');
    expect(workoutSticker(['A'], 'B', 3)).toBeNull();
    expect(workoutSticker(['A', 'B', 'C'], 'c', 3)).toBeNull();
  });
});
