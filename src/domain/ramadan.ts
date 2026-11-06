/** Ramadan guide: heads-up a week before, then daily sehri / iftar / gym guidance. */
import { differenceInCalendarDays } from 'date-fns';
import { RAMADAN_END, RAMADAN_START } from './plan';
import type { ISODate } from './types';
import { parseLocalDate } from '../lib/dates';

export interface RamadanGuide {
  stage: 'soon' | 'fasting';
  /** 1-based roza number while fasting; days to go when soon */
  day: number;
  title: string;
  sehri: string[];
  iftar: string[];
  move: string;
}

const SEHRI = [
  '2 eggs or a bowl of dahi for protein',
  'Half paratha or 1 roti, or a bowl of oats',
  '2-3 glasses of water; skip extra chai (it makes you thirsty)',
];
const IFTAR = [
  '1-2 dates and water first, then pray',
  'Fruit chaat, then a normal plate: salan + 1 roti or 1 cup rice + salad',
  'Pakora or samosa: 2 pieces, not 6. Rooh Afza: half a glass',
  '8 glasses of water between iftar and sehri',
];

export function ramadanGuide(date: ISODate): RamadanGuide | null {
  const toStart = differenceInCalendarDays(parseLocalDate(RAMADAN_START), parseLocalDate(date));
  if (toStart > 0 && toStart <= 7) {
    return {
      stage: 'soon',
      day: toStart,
      title: toStart === 1 ? 'Ramadan starts tomorrow (moon permitting)' : `Ramadan in about ${toStart} days`,
      sehri: SEHRI,
      iftar: IFTAR,
      move: 'From 1st roza: gym 4 days after iftar (Mon, Tue, Thu, Fri), 2 sets each, lighter.',
    };
  }
  if (date < RAMADAN_START || date > RAMADAN_END) return null;
  const day = differenceInCalendarDays(parseLocalDate(date), parseLocalDate(RAMADAN_START)) + 1;
  return {
    stage: 'fasting',
    day,
    title: `Roza ${day}`,
    sehri: SEHRI,
    iftar: IFTAR,
    move:
      day >= 21
        ? 'Last ashra: keep gym short (30 min) or walk after taraweeh. Rest is fine.'
        : 'Gym 1-2 hours after iftar, 2 sets each. Stop if dizzy. Taraweeh counts as movement.',
  };
}
