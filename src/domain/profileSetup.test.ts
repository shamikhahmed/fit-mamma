import { describe, expect, it } from 'vitest';
import { createDefaultSettings } from './defaults';
import { parseProfile, suggestGoal } from './profileSetup';

const ok = { weightKg: '70', goalKg: '62', heightFt: '5', heightIn: '4', birthYear: '1980' };

describe('parseProfile', () => {
  it('converts feet and inches and rounds weights', () => {
    expect(parseProfile(ok, 2026)).toEqual({ startingWeightKg: 70, targetWeightKg: 62, heightCm: 162.6, birthYear: 1980 });
  });
  it('explains the first problem', () => {
    expect(parseProfile({ ...ok, weightKg: '' }, 2026)).toHaveProperty('error');
    expect(parseProfile({ ...ok, goalKg: '75' }, 2026)).toMatchObject({ error: /lower/ });
    expect(parseProfile({ ...ok, heightIn: '13' }, 2026)).toMatchObject({ error: /height/ });
    expect(parseProfile({ ...ok, birthYear: '2020' }, 2026)).toMatchObject({ error: /born/ });
  });
});

describe('suggestGoal', () => {
  it('suggests 10 kg down without going under a healthy floor', () => {
    expect(suggestGoal(70, 162.6)).toBe(60);
    expect(suggestGoal(62, 162.6)).toBe(58); // floor ≈ 58 kg at BMI 22
  });
});

describe('defaults hold no personal numbers', () => {
  it('asks on first run', () => {
    const s = createDefaultSettings();
    expect(s.profileSetupDone).toBe(false);
    expect(s.heightCm).toBeNull();
    expect(s.birthYear).toBeNull();
  });
});
