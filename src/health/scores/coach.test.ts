import { describe, expect, it } from 'vitest';
import { coachLine, shouldForceBasic } from './coach';

describe('coachLine', () => {
  it('pushes advanced on green + low strain', () => {
    expect(coachLine(70, 8)).toBe('Strong day: use pause reps on the top set.');
  });

  it('sends Basic on red recovery', () => {
    expect(coachLine(30, 5)).toBe('Go lighter today, add a 20 min walk.');
  });
});

describe('shouldForceBasic', () => {
  it('forces Basic for red recovery or short sleep', () => {
    expect(shouldForceBasic(30, 5, 7)).toBe(true);
    expect(shouldForceBasic(70, 5, 6)).toBe(true);
    expect(shouldForceBasic(70, 5, 7)).toBe(false);
  });
});
