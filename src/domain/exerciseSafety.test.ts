import { describe, expect, it } from 'vitest';
import plan from './trainingPlan.json';
import { explicitSafety, safetyFor } from './exerciseSafety';

describe('exercise safety', () => {
  it('has an explicit entry for every plan exercise and alternative', () => {
    const names = new Set<string>();
    for (const day of Object.values(plan.days) as { name: string; alts: string[] }[][]) {
      for (const e of day) {
        names.add(e.name);
        e.alts.forEach((a) => names.add(a));
      }
    }
    const missing = [...names].filter((n) => explicitSafety(n) == null);
    expect(missing).toEqual([]);
  });

  it('needs a spotter on the Smith machine', () => {
    expect(safetyFor('Smith machine squat').spotter).toBe('yes');
  });

  it('covers swap fallbacks by keyword', () => {
    expect(safetyFor('DB curl').start).toMatch(/kg/);
    expect(safetyFor('DB floor press').spotter).toBe('watch');
    expect(safetyFor('Plank / dead bug').spotter).toBe('no');
  });
});
