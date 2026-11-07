/**
 * Daily cardio after weights: treadmill incline walk or elliptical, minute by minute.
 * Numbers are for a beginner woman starting out: easy enough to talk, never gasping.
 * They step up with the plan phase (Learn → Build → Strong) and drop for deload / Ramadan.
 */
import { isRamadan, planPhase } from './plan';
import type { ISODate } from './types';

/** Notes prefix on the cardio workout row, so the Train page can find today's log. */
export const CARDIO_NOTE_PREFIX = 'Plan cardio: ';

export type Machine = 'treadmill' | 'elliptical';

export interface CardioStep {
  label: string;
  min: number;
  /** treadmill */
  speedKmh?: number;
  inclinePct?: number;
  /** elliptical resistance level (most gym machines run 1–20) */
  level?: number;
  feel: string;
}

/** One table row. `rounds` > 1 means `steps` repeat in order that many times. */
export interface CardioRow {
  rounds: number;
  steps: CardioStep[];
}

export interface CardioSession {
  machine: Machine;
  title: string;
  rows: CardioRow[];
  totalMin: number;
  optional: boolean;
  note: string | null;
}

/** Day keys from the Train page. Sunday rest gets an optional easy walk. */
export type CardioDay = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'arms' | 'core' | 'rest' | 'pump';

/** Elliptical on the day after/of leg work: no impact on tired knees. */
export const DEFAULT_MACHINE: Record<CardioDay, Machine> = {
  push: 'treadmill',
  pull: 'elliptical',
  legs: 'elliptical',
  upper: 'treadmill',
  lower: 'elliptical',
  arms: 'treadmill',
  core: 'treadmill',
  rest: 'treadmill',
  pump: 'treadmill',
};

const EASY = 'Easy — breathing normal';
const TALK = 'Brisk — you can talk, not sing';
const HILL = 'Harder — short sentences only';

const one = (...steps: CardioStep[]): CardioRow => ({ rounds: 1, steps });

function tm(label: string, min: number, speedKmh: number, inclinePct: number, feel: string): CardioStep {
  return { label, min, speedKmh, inclinePct, feel };
}
function el(label: string, min: number, level: number, feel: string): CardioStep {
  return { label, min, level, feel };
}

type Level = 'learn' | 'build' | 'strong' | 'deload' | 'ramadan';

function levelFor(date: ISODate): Level {
  if (isRamadan(date)) return 'ramadan';
  const p = planPhase(date);
  if (p.mode === 'Deload') return 'deload';
  if (p.mode === 'Strong') return 'strong';
  if (p.mode === 'Build') return 'build';
  return 'learn';
}

function treadmillMain(lv: Level, short: boolean): CardioRow[] {
  switch (lv) {
    case 'ramadan':
      return [one(tm('Walk', 8, 4.2, 1, EASY))];
    case 'deload':
      return [one(tm('Walk', 10, 4.5, 3, TALK))];
    case 'learn':
      return [one(tm('Incline walk', short ? 8 : 12, 4.5, 4, TALK))];
    case 'build':
      return [one(tm('Incline walk', short ? 10 : 15, 4.8, 6, TALK))];
    case 'strong':
      return short
        ? [one(tm('Incline walk', 12, 4.8, 6, TALK))]
        : [{ rounds: 6, steps: [tm('Hill', 2, 5.0, 8, HILL), tm('Recover', 1, 5.0, 4, TALK)] }];
  }
}

function ellipticalMain(lv: Level, short: boolean): CardioRow[] {
  switch (lv) {
    case 'ramadan':
      return [one(el('Steady', 8, 2, EASY))];
    case 'deload':
      return [one(el('Steady', 10, 3, TALK))];
    case 'learn':
      return [one(el('Steady', short ? 8 : 12, 3, TALK))];
    case 'build':
      return [one(el('Steady', short ? 10 : 15, 5, TALK))];
    case 'strong':
      return short
        ? [one(el('Steady', 12, 5, TALK))]
        : [{ rounds: 6, steps: [el('Push', 2, 7, HILL), el('Recover', 1, 5, TALK)] }];
  }
}

export function rowsMinutes(rows: CardioRow[]): number {
  return rows.reduce((sum, r) => sum + r.rounds * r.steps.reduce((s, st) => s + st.min, 0), 0);
}

/** Today's cardio for that Train-page day, or null when there is none (Eid). */
export function cardioFor(date: ISODate, day: CardioDay, machine: Machine): CardioSession | null {
  if (day === 'pump') return null;
  const lv = levelFor(date);
  const walkDay = day === 'arms' || day === 'core';
  const restDay = day === 'rest';
  const short = day === 'legs' || day === 'lower';

  let rows: CardioRow[];
  if (machine === 'treadmill') {
    const warm = one(tm('Warm-up', 3, 4.0, 0, EASY));
    const cool = one(tm('Cool-down', 3, 3.5, 0, EASY));
    if (walkDay) {
      rows = lv === 'ramadan'
        ? [one(tm('Easy walk', 15, 4.2, 0, EASY))]
        : [one(tm('Warm-up', 5, 4.0, 0, EASY)), one(tm('Brisk walk', lv === 'learn' ? 20 : 25, 5.0, 2, TALK)), one(tm('Cool-down', 5, 3.8, 0, EASY))];
    } else if (restDay) {
      rows = [one(tm('Easy walk', lv === 'ramadan' ? 10 : 20, 4.2, 0, EASY))];
    } else {
      rows = [warm, ...treadmillMain(lv, short), cool];
    }
  } else {
    const warm = one(el('Warm-up', 3, 1, EASY));
    const cool = one(el('Cool-down', 3, 1, EASY));
    if (walkDay) {
      rows = lv === 'ramadan'
        ? [one(el('Easy', 15, 2, EASY))]
        : [one(el('Warm-up', 5, 1, EASY)), one(el('Steady', lv === 'learn' ? 15 : 20, 3, TALK)), one(el('Cool-down', 5, 1, EASY))];
    } else if (restDay) {
      rows = [one(el('Easy', lv === 'ramadan' ? 10 : 15, 1, EASY))];
    } else {
      rows = [warm, ...ellipticalMain(lv, short), cool];
    }
  }

  const totalMin = rowsMinutes(rows);
  const name = machine === 'treadmill' ? 'Treadmill' : 'Elliptical';
  const note =
    lv === 'ramadan'
      ? 'Ramadan: only after iftar, never while fasting. Flat and easy — skip it if you feel weak.'
      : restDay
        ? 'Optional. Rest day — a slow walk helps soreness. Skip if tired.'
        : walkDay
          ? 'Saturday is a walk day — this is the session. An outside walk at the same pace counts too.'
          : lv === 'deload'
            ? 'Deload week: lighter on purpose.'
            : null;
  return { machine, title: `${name} · ${totalMin} min`, rows, totalMin, optional: restDay, note };
}

/** Steps in time order (rounds unrolled), for the guided timer. */
export function expandSteps(rows: CardioRow[]): CardioStep[] {
  const out: CardioStep[] = [];
  for (const r of rows) for (let i = 0; i < r.rounds; i++) out.push(...r.steps);
  return out;
}

export const kmhToMph = (kmh: number) => Math.round(kmh * 0.621371 * 10) / 10;

/** "4.5 km/h · 4%" or "Level 3". */
export function settingText(s: CardioStep): string {
  if (s.speedKmh != null) return `${s.speedKmh.toFixed(1)} km/h · ${s.inclinePct ?? 0}%`;
  return `Level ${s.level ?? 1}`;
}

/** Spoken at each change in the timer. */
export function stepAnnouncement(s: CardioStep): string {
  const mins = `${s.min} minute${s.min === 1 ? '' : 's'}`;
  if (s.speedKmh != null) {
    return `${s.label}. Speed ${s.speedKmh.toFixed(1)}, incline ${s.inclinePct ?? 0}. ${mins}.`;
  }
  return `${s.label}. Level ${s.level ?? 1}. ${mins}.`;
}

/**
 * Easy-cardio heart-rate band: 60–70% of max (Tanaka: 208 − 0.7 × age).
 * Null without a birth year. Blood-pressure tablets (beta blockers) lower heart rate — then use the talk test.
 */
export function zone2(birthYear: number | null | undefined, year: number): { lo: number; hi: number } | null {
  if (!birthYear || birthYear < 1900 || birthYear > year - 10) return null;
  const max = 208 - 0.7 * (year - birthYear);
  return { lo: Math.round(max * 0.6), hi: Math.round(max * 0.7) };
}

export const MACHINE_HOW: Record<Machine, string[]> = {
  treadmill: [
    'Clip the red safety key to your clothes before you start.',
    'Stand on the side rails, start the belt at the slowest speed, then step on.',
    'Walk tall without leaning on the rails — touch them only for balance.',
    'Change speed and incline with the buttons while you walk; go up slowly.',
    'To finish: press stop, wait for the belt to stop fully, then step off.',
    'Shins or lower back ache? Drop the incline by 2.',
  ],
  elliptical: [
    'Hold the handles, step on with whole feet flat on the pedals.',
    'Start pedalling forward first, then raise the level.',
    'Stand tall, heels down, push and pull the handles gently.',
    'Aim for about 120 steps a minute (60 RPM on the screen).',
    'Levels differ by machine — if level 3 feels hard, use 2.',
    'To finish: slow down, stop pedalling, then step off holding the handles.',
  ],
};

export const STOP_SIGNS = 'Stop and sit down for chest pain, dizziness, a racing heart or if you cannot speak.';
