import { describe, expect, it } from 'vitest';
import { createDefaultSettings } from './defaults';
import {
  isRamadan,
  macrosFor,
  missionFor,
  planPhase,
  planStepsTarget,
  planWeek,
  sessionFor,
  sundayCheckpoints,
  targetWeightOn,
  weighInReaction,
  withPlanTargets,
} from './plan';
import { applyPlanV2 } from '../data/repository';

const S = createDefaultSettings('2026-11-01T00:00:00.000Z');

describe('plan sessions', () => {
  it('runs Mon-Fri body-part split from Monday 9 Nov, Saturday walk, Sunday rest', () => {
    expect(sessionFor('2026-11-09')).toMatchObject({ key: 'push', label: 'Chest & Triceps' });
    expect(sessionFor('2026-11-10').label).toBe('Back & Biceps');
    expect(sessionFor('2026-11-11').label).toBe('Legs');
    expect(sessionFor('2026-11-12').label).toBe('Shoulders & Abs');
    expect(sessionFor('2026-11-13').label).toBe('Full body & Glutes');
    expect(sessionFor('2026-11-14')).toMatchObject({ key: 'saturday', label: 'Walk day' });
    expect(sessionFor('2026-11-15').kind).toBe('rest');
  });
  it('flags the New Year deload and Ramadan sessions', () => {
    expect(sessionFor('2026-12-29').note).toMatch(/Deload/);
    expect(isRamadan('2027-02-10')).toBe(true);
    expect(sessionFor('2027-02-08').note).toMatch(/iftar/); // Monday of Ramadan
    expect(sessionFor('2027-02-10').kind).toBe('rest'); // Wednesday off in Ramadan
    expect(sessionFor('2027-03-10').note).toMatch(/Eid/);
  });
  it('is rest outside the window', () => {
    expect(sessionFor('2026-11-06').key).toBe('rest');
    expect(sessionFor('2027-03-20').key).toBe('rest');
  });
});

describe('phases and missions', () => {
  it('maps weeks to modes', () => {
    expect(planWeek('2026-11-08')).toBe(0);
    expect(planWeek('2026-11-09')).toBe(1);
    expect(planWeek('2026-11-16')).toBe(2);
    expect(planPhase('2026-11-10').mode).toBe('Learn');
    expect(planPhase('2026-12-02').mode).toBe('Build');
    expect(planPhase('2026-12-30').mode).toBe('Deload');
    expect(planPhase('2027-01-12')).toMatchObject({ mode: 'Strong', advanced: true });
    expect(planPhase('2027-02-15').mode).toBe('Ramadan');
    expect(planPhase('2027-03-10').mode).toBe('Eid');
  });
  it('gives one mission per week', () => {
    expect(missionFor('2026-11-09').week).toBe(1);
    expect(missionFor('2026-11-23').text).toMatch(/sugar/i);
    expect(missionFor('2027-03-10').phase).toBe('Eid');
  });
});

describe('targets', () => {
  it('draws a straight line from start to goal by Eid', () => {
    expect(targetWeightOn(S, S.startDate)).toBe(80);
    expect(targetWeightOn(S, S.deadline)).toBe(70);
    const mid = targetWeightOn(S, '2027-01-10');
    expect(mid).toBeGreaterThan(70);
    expect(mid).toBeLessThan(80);
  });
  it('lists Sunday checkpoints with decreasing targets', () => {
    const cps = sundayCheckpoints(S);
    expect(cps[0].sunday).toBe('2026-11-15');
    expect(cps).toHaveLength(17);
    for (let i = 1; i < cps.length; i++) expect(cps[i].targetKg).toBeLessThan(cps[i - 1].targetKg);
  });
  it('uses day-specific calories with constant protein and fat', () => {
    const lift = macrosFor(S, '2026-11-09');
    const sat = macrosFor(S, '2026-11-14');
    const sun = macrosFor(S, '2026-11-15');
    expect(lift.calories).toBe(1500);
    expect(sat.calories).toBe(1400);
    expect(sun.calories).toBe(1200);
    expect(sun.carbsG).toBe(75);
    expect(new Set([lift.proteinG, sat.proteinG, sun.proteinG])).toEqual(new Set([110]));
    expect(macrosFor({ ...S, dayTypeCalories: false }, '2026-11-15').calories).toBe(1500);
  });
});

describe('plan v2 migration', () => {
  it('moves old installs to her plan once', () => {
    const old = { ...S, planVersion: undefined, startDate: '2026-10-27', startingWeightKg: 90, proteinTargetG: 160 };
    const m = applyPlanV2(old);
    expect(m).toMatchObject({ startDate: '2026-11-09', startingWeightKg: 80, proteinTargetG: 110, planVersion: 2 });
    expect(applyPlanV2({ ...m, proteinTargetG: 100 }).proteinTargetG).toBe(100);
  });
});

describe('plan-driven targets', () => {
  it('steps grow gently: 6k → 7k → 8k, back to 6k in Ramadan', () => {
    expect(planStepsTarget('2026-11-10')).toBe(6000);
    expect(planStepsTarget('2026-12-02')).toBe(7000);
    expect(planStepsTarget('2027-01-12')).toBe(8000);
    expect(planStepsTarget('2027-02-15')).toBe(6000);
  });

  it('a pinned manual target wins', () => {
    const s = { stepsTarget: 5000, stepsTargetFollowsPlan: false };
    expect(withPlanTargets(s, '2026-12-02').stepsTarget).toBe(5000);
    expect(withPlanTargets({ stepsTarget: 5000 }, '2026-12-02').stepsTarget).toBe(7000);
  });
});

describe('weighInReaction', () => {
  const s = applyPlanV2(createDefaultSettings());
  it('stays calm and specific', () => {
    const line = targetWeightOn(s, '2026-11-20');
    expect(weighInReaction(s, '2026-11-20', line)).toMatch(/On the line/);
    expect(weighInReaction(s, '2026-11-20', line - 1)).toMatch(/1 kg ahead/);
    expect(weighInReaction(s, '2026-11-20', line + 0.8)).toMatch(/0.8 kg above.*7-day average/);
    expect(weighInReaction(s, '2026-10-01', 80)).toBeNull();
  });
});
