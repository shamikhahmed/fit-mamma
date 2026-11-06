import { addDays, differenceInCalendarDays, getDay } from 'date-fns';
import type { AppSettings, ISODate } from './types';
import { parseLocalDate, toLocalISODate } from '../lib/dates';

/**
 * Fit Mamma plan: Mon 9 Nov 2026 → Eid al-Fitr (about 10 Mar 2027).
 * Five gym days (body-part split), Saturday walk, Sunday rest. Ramadan (about 8 Feb → 9 Mar)
 * switches to four lighter sessions after iftar. Pure functions only — no storage.
 */
export const PLAN_START: ISODate = '2026-11-09';
export const PLAN_END: ISODate = '2027-03-10';
const DELOAD_START: ISODate = '2026-12-28';
const DELOAD_END: ISODate = '2027-01-03';
/** Approximate — the real dates follow the moon sighting. */
export const RAMADAN_START: ISODate = '2027-02-08';
export const RAMADAN_END: ISODate = '2027-03-09';

export function isRamadan(date: ISODate): boolean {
  return date >= RAMADAN_START && date <= RAMADAN_END;
}

export type SessionKey = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'saturday' | 'rest';
export type DayKind = 'lift' | 'saturday' | 'rest';

export interface PlannedSession {
  key: SessionKey;
  label: string;
  kind: DayKind;
  /** Short qualifier, e.g. "Deload 60%" or "After iftar" */
  note: string | null;
}

export interface PlanPhase {
  week: number;
  phase: 'Before start' | 'Foundation' | 'Build' | 'Deload' | 'Strong' | 'Ramadan' | 'Eid' | 'Complete';
  mode: 'Learn' | 'Build' | 'Deload' | 'Strong' | 'Ramadan' | 'Eid' | '—';
  /** Kept for the shared exercise engine; this plan has no Block B swaps. */
  blockB: boolean;
  /** Use the pause-rep technique on the top set */
  advanced: boolean;
}

export const MISSIONS: readonly { phase: string; text: string }[] = [
  { phase: 'Foundation', text: 'Weigh in every morning after the bathroom. 6,000 steps a day.' },
  { phase: 'Foundation', text: 'Learn each machine with light weight. Form before weight.' },
  { phase: 'Foundation', text: 'Chai with no sugar, or one small spoon at most.' },
  { phase: 'Build', text: '7,000 steps. Add a little weight when 12 reps feel easy.' },
  { phase: 'Build', text: 'Protein at every meal: egg, daal, chicken, dahi or paneer.' },
  { phase: 'Build', text: 'Oil: 1 tablespoon per dish per person. Measure it once to see.' },
  { phase: 'Build', text: 'Wedding season: one plate, salad first, skip the second sweet.' },
  { phase: 'Deload', text: 'Easy gym week at 60%. Food the same. Sleep 7+ hours.' },
  { phase: 'Strong', text: '8,000 steps from now to Ramadan.' },
  { phase: 'Strong', text: 'Half-plate vegetables at lunch and dinner.' },
  { phase: 'Strong', text: 'No eating after 10 pm. Kitchen closed.' },
  { phase: 'Strong', text: 'Two roti, not three. Rice: one cup, not a mound.' },
  { phase: 'Strong', text: 'Last full gym week before Ramadan. Take measurements.' },
  { phase: 'Ramadan', text: 'Sehri: protein + slow carbs (eggs, paratha half, dahi). Water, water, water.' },
  { phase: 'Ramadan', text: 'Iftar: dates + water, then a normal plate. Pakora: 2 pieces, not 6.' },
  { phase: 'Ramadan', text: 'Gym 4 days after iftar, lighter. Walk after taraweeh if you can.' },
  { phase: 'Ramadan', text: 'Last ashra: keep the routine, rest well.' },
  { phase: 'Eid', text: 'Eid Mubarak! Enjoy the day. Photos and weigh-in the next morning.' },
];

const LABELS: Record<SessionKey, string> = {
  push: 'Chest & Triceps',
  pull: 'Back & Biceps',
  legs: 'Legs',
  upper: 'Shoulders & Abs',
  lower: 'Full body & Glutes',
  saturday: 'Walk day',
  rest: 'Rest',
};

function days(a: ISODate, b: ISODate): number {
  return differenceInCalendarDays(parseLocalDate(b), parseLocalDate(a));
}

/** Daily step target: 6k weeks 1-3, 7k weeks 4-8, 8k from week 9; 6k in Ramadan. */
export function planStepsTarget(date: ISODate): number {
  if (isRamadan(date)) return 6000;
  const w = planWeek(date);
  if (w <= 3) return 6000;
  if (w <= 8) return 7000;
  return 8000;
}

/** Settings with plan-driven targets applied (unless the user pinned their own). */
export function withPlanTargets<T extends { stepsTarget: number; stepsTargetFollowsPlan?: boolean }>(
  settings: T,
  date: ISODate,
): T {
  if (settings.stepsTargetFollowsPlan === false) return settings;
  if (date > PLAN_END) return settings;
  return { ...settings, stepsTarget: planStepsTarget(date) };
}

/** 1-based plan week (week 1 = 9-15 Nov). 0 before start. Capped at 18 (Eid week). */
export function planWeek(date: ISODate): number {
  if (date < PLAN_START) return 0;
  return Math.min(18, 1 + Math.floor(days(PLAN_START, date) / 7));
}

export function planPhase(date: ISODate): PlanPhase {
  const week = planWeek(date);
  const p = (phase: PlanPhase['phase'], mode: PlanPhase['mode'], advanced = false): PlanPhase => ({
    week,
    phase,
    mode,
    blockB: false,
    advanced,
  });
  if (week === 0) return p('Before start', '—');
  if (date > PLAN_END) return p('Complete', '—');
  if (date === PLAN_END) return p('Eid', 'Eid');
  if (isRamadan(date)) return p('Ramadan', 'Ramadan');
  if (date >= DELOAD_START && date <= DELOAD_END) return p('Deload', 'Deload');
  if (week <= 3) return p('Foundation', 'Learn');
  if (week <= 7) return p('Build', 'Build');
  return p('Strong', 'Strong', true);
}

export function missionFor(date: ISODate): { week: number; phase: string; text: string } {
  const w = Math.max(1, planWeek(date));
  const m = MISSIONS[Math.min(MISSIONS.length, w) - 1];
  return { week: w, ...m };
}

/** Which session is planned on a date. Mon-Fri gym, Saturday walk, Sunday rest. */
export function sessionFor(date: ISODate): PlannedSession {
  const mk = (key: SessionKey, note: string | null = null, kind?: DayKind): PlannedSession => ({
    key,
    label: LABELS[key],
    kind: kind ?? (key === 'rest' ? 'rest' : key === 'saturday' ? 'saturday' : 'lift'),
    note,
  });
  if (date < PLAN_START || date > PLAN_END) return mk('rest', date < PLAN_START ? 'Before day 1' : 'Plan complete');
  if (date === PLAN_END) return mk('rest', 'Eid Mubarak!');
  const wd = getDay(parseLocalDate(date)); // 0 Sun .. 6 Sat
  if (isRamadan(date)) {
    const ram: Record<number, SessionKey> = { 1: 'push', 2: 'pull', 3: 'rest', 4: 'legs', 5: 'lower', 6: 'saturday', 0: 'rest' };
    const key = ram[wd];
    return mk(key, key === 'rest' || key === 'saturday' ? null : 'After iftar · 2 sets, lighter');
  }
  const map: Record<number, SessionKey> = { 1: 'push', 2: 'pull', 3: 'legs', 4: 'upper', 5: 'lower', 6: 'saturday', 0: 'rest' };
  const key = map[wd];
  const deload = date >= DELOAD_START && date <= DELOAD_END && key !== 'rest' && key !== 'saturday';
  return mk(key, deload ? 'Deload: 60% weight, half the sets' : null);
}

/** Straight line from the mission start weight to the target on the deadline. */
export function targetWeightOn(settings: AppSettings, date: ISODate): number {
  const total = days(settings.startDate, settings.deadline);
  if (total <= 0) return settings.targetWeightKg;
  const t = Math.min(total, Math.max(0, days(settings.startDate, date)));
  const kg = settings.startingWeightKg - ((settings.startingWeightKg - settings.targetWeightKg) * t) / total;
  return Math.round(kg * 10) / 10;
}

/** Coach reaction to a single weigh-in vs the plan line. One day is noise, so the copy stays calm. */
export function weighInReaction(settings: AppSettings, date: ISODate, kg: number): string | null {
  if (date < settings.startDate || date > settings.deadline) return null;
  const line = targetWeightOn(settings, date);
  const diff = Math.round((kg - line) * 10) / 10;
  if (Math.abs(diff) <= 0.3) return `On the line (plan today ${line} kg).`;
  if (diff < 0) return `${Math.abs(diff)} kg ahead of the line. Keep protein high.`;
  return `${diff} kg above the line. One day is mostly water; watch the 7-day average.`;
}

/** Sunday checkpoints: target 7-day average is the line value 3 days before (the window centre). */
export function sundayCheckpoints(settings: AppSettings): { week: number; sunday: ISODate; targetKg: number }[] {
  const out: { week: number; sunday: ISODate; targetKg: number }[] = [];
  let sun = parseLocalDate(settings.startDate);
  while (getDay(sun) !== 0) sun = addDays(sun, 1);
  let week = 1;
  while (toLocalISODate(sun) < settings.deadline) {
    const iso = toLocalISODate(sun);
    out.push({ week, sunday: iso, targetKg: targetWeightOn(settings, toLocalISODate(addDays(sun, -3))) });
    sun = addDays(sun, 7);
    week += 1;
  }
  return out;
}

export interface DayMacros {
  kind: DayKind;
  calories: number;
  proteinG: number;
  carbsG: number | null;
  fatG: number | null;
}

/**
 * Day-specific targets. Training days use the Settings values; Saturday (walk) is 100 kcal lower,
 * rest days 300 kcal lower (carbs carry the difference — protein and fat stay constant).
 */
export function macrosFor(settings: AppSettings, date: ISODate): DayMacros {
  const base: DayMacros = {
    kind: 'lift',
    calories: settings.calorieTarget,
    proteinG: settings.proteinTargetG,
    carbsG: settings.carbsTargetG,
    fatG: settings.fatTargetG,
  };
  if (settings.dayTypeCalories === false) return base;
  const kind = sessionFor(date).kind;
  if (date < PLAN_START || date > PLAN_END) {
    // Outside the plan window, fall back to weekday pattern
    const wd = getDay(parseLocalDate(date));
    const k: DayKind = wd === 0 ? 'rest' : wd === 6 ? 'saturday' : 'lift';
    return shift(base, k);
  }
  return shift(base, kind);
}

function shift(base: DayMacros, kind: DayKind): DayMacros {
  if (kind === 'lift') return base;
  const delta = kind === 'saturday' ? 100 : 300;
  return {
    ...base,
    kind,
    calories: base.calories - delta,
    carbsG: base.carbsG == null ? null : Math.max(0, base.carbsG - Math.round(delta / 4)),
  };
}

export function calorieTargetFor(settings: AppSettings, date: ISODate): number {
  return macrosFor(settings, date).calories;
}
