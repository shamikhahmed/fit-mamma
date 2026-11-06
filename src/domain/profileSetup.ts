/** First-run profile: personal numbers live only on the device, never in the source. */

export interface ProfileInput {
  weightKg: string;
  goalKg: string;
  heightFt: string;
  heightIn: string;
  birthYear: string;
}

export interface ProfileValues {
  startingWeightKg: number;
  targetWeightKg: number;
  heightCm: number;
  birthYear: number;
}

/** Validates the form; returns values or the first error message. */
export function parseProfile(input: ProfileInput, thisYear: number): ProfileValues | { error: string } {
  const w = Number(input.weightKg);
  const g = Number(input.goalKg);
  const ft = Number(input.heightFt);
  const inch = input.heightIn.trim() === '' ? 0 : Number(input.heightIn);
  const by = Number(input.birthYear);
  if (!Number.isFinite(w) || w < 35 || w > 250) return { error: 'Enter your weight in kg (for example 70).' };
  if (!Number.isFinite(g) || g < 35 || g >= w) return { error: 'Goal weight should be lower than your weight now.' };
  if (!Number.isFinite(ft) || ft < 4 || ft > 7 || !Number.isFinite(inch) || inch < 0 || inch >= 12)
    return { error: 'Enter your height in feet and inches (for example 5 and 4).' };
  if (!Number.isInteger(by) || by < thisYear - 100 || by > thisYear - 15) return { error: 'Enter the year you were born.' };
  return {
    startingWeightKg: Math.round(w * 10) / 10,
    targetWeightKg: Math.round(g * 10) / 10,
    heightCm: Math.round((ft * 12 + inch) * 2.54 * 10) / 10,
    birthYear: by,
  };
}

/** Suggested goal: 10 kg down, never below a BMI of about 22 for the given height. */
export function suggestGoal(weightKg: number, heightCm: number | null): number {
  const tenDown = weightKg - 10;
  if (!heightCm) return Math.round(tenDown);
  const floor = 22 * (heightCm / 100) ** 2;
  return Math.round(Math.max(tenDown, Math.min(weightKg - 2, floor)));
}
