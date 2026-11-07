import { describe, expect, it } from 'vitest';
import { cardioFor, expandSteps, rowsMinutes, zone2, type CardioDay, type Machine } from './cardioPlan';

const LIFT: CardioDay[] = ['push', 'pull', 'legs', 'upper', 'lower'];
const MACHINES: Machine[] = ['treadmill', 'elliptical'];

describe('cardioFor', () => {
  it('week 1 treadmill on Monday: 3 warm + 12 incline walk + 3 cool at safe beginner numbers', () => {
    const s = cardioFor('2026-11-09', 'push', 'treadmill')!;
    expect(s.totalMin).toBe(18);
    const main = s.rows[1].steps[0];
    expect(main.speedKmh).toBe(4.5);
    expect(main.inclinePct).toBe(4);
  });

  it('leg days are shorter than upper days', () => {
    for (const m of MACHINES) {
      expect(cardioFor('2026-11-11', 'legs', m)!.totalMin).toBeLessThan(cardioFor('2026-11-09', 'push', m)!.totalMin);
    }
  });

  it('steps up from Learn to Build to Strong but never past 5 km/h, 8% or level 7', () => {
    const dates = ['2026-11-09', '2026-12-07', '2027-01-11'];
    const tread = dates.map((d) => cardioFor(d, 'push', 'treadmill')!.totalMin);
    expect(tread[0]).toBeLessThan(tread[1]);
    for (const d of ['2026-11-09', '2026-12-07', '2027-01-11', '2027-02-01']) {
      for (const day of LIFT) {
        for (const m of MACHINES) {
          for (const st of expandSteps(cardioFor(d, day, m)!.rows)) {
            if (st.speedKmh != null) expect(st.speedKmh).toBeLessThanOrEqual(5);
            if (st.inclinePct != null) expect(st.inclinePct).toBeLessThanOrEqual(8);
            if (st.level != null) expect(st.level).toBeLessThanOrEqual(7);
            expect(st.min).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('Ramadan is flat, easy and notes after iftar', () => {
    const s = cardioFor('2027-02-15', 'push', 'treadmill')!;
    expect(s.note).toMatch(/iftar/);
    expect(Math.max(...expandSteps(s.rows).map((x) => x.inclinePct ?? 0))).toBeLessThanOrEqual(1);
  });

  it('Sunday is optional, Eid has none, timer steps add up to the total', () => {
    expect(cardioFor('2026-11-15', 'rest', 'treadmill')!.optional).toBe(true);
    expect(cardioFor('2027-03-10', 'pump', 'treadmill')).toBeNull();
    const s = cardioFor('2027-01-11', 'push', 'elliptical')!;
    expect(expandSteps(s.rows).reduce((a, b) => a + b.min, 0)).toBe(rowsMinutes(s.rows));
  });
});

describe('zone2', () => {
  it('60-70% of Tanaka max, null without a birth year', () => {
    expect(zone2(1990, 2026)).toEqual({ lo: 110, hi: 128 });
    expect(zone2(null, 2026)).toBeNull();
  });
});
