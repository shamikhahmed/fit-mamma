import { describe, expect, it } from 'vitest';
import { ramadanGuide } from './ramadan';
import { portionLabel } from '../components/QuickLogSheet';

describe('ramadanGuide', () => {
  it('is hidden far from Ramadan', () => {
    expect(ramadanGuide('2026-12-01')).toBeNull();
    expect(ramadanGuide('2027-03-10')).toBeNull(); // Eid
  });
  it('gives a heads-up in the week before', () => {
    expect(ramadanGuide('2027-02-07')).toMatchObject({ stage: 'soon', day: 1 });
    expect(ramadanGuide('2027-02-01')?.title).toMatch(/7 days/);
  });
  it('counts rozas and changes advice in the last ashra', () => {
    expect(ramadanGuide('2027-02-08')).toMatchObject({ stage: 'fasting', day: 1, title: 'Roza 1' });
    expect(ramadanGuide('2027-03-01')?.move).toMatch(/Last ashra/);
  });
});

describe('portionLabel', () => {
  it('reads naturally', () => {
    expect(portionLabel('1 bowl', 1)).toBe('1 bowl');
    expect(portionLabel('1 bowl', 1.5)).toBe('1½ bowl');
    expect(portionLabel('1 roti', 2)).toBe('2 roti');
    expect(portionLabel('2 dates', 0.5)).toBe('½ × 2 dates');
    expect(portionLabel(undefined, 2)).toBe('2 servings');
  });
});
