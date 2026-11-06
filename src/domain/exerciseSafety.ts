/**
 * Safety notes per exercise: does she need a spotter, and what weight to start with.
 * Starting weights are deliberately light (a beginner learning the move); the log then
 * shows when to add weight. Every plan exercise and alternative has an explicit entry
 * (see exerciseSafety.test.ts); keyword rules only cover swap fallbacks.
 */
export type Spotter = 'no' | 'watch' | 'yes';

export interface Safety {
  spotter: Spotter;
  /** Why / how, one short line. */
  spotterNote: string;
  start: string;
}

const MACHINE: Safety = {
  spotter: 'no',
  spotterNote: 'Machine: the weight cannot fall on you.',
  start: 'Lightest weight on the stack (about 5–10 kg). Add one step only when every rep feels easy.',
};
const CABLE: Safety = {
  spotter: 'no',
  spotterNote: 'Cable: let go and the weight stops safely.',
  start: '2.5–5 kg (the first one or two plates).',
};
const BODY: Safety = { spotter: 'no', spotterNote: 'No weight to drop.', start: 'Your own body weight.' };
const SMITH: Safety = {
  spotter: 'yes',
  spotterNote: 'Ask a trainer to stand by the first few times. Set the safety stops just below your lowest point.',
  start: 'Empty bar only.',
};
const db = (start: string, spotter: Spotter = 'no', note = 'Light dumbbells: just put them down if tired.'): Safety => ({
  spotter,
  spotterNote: note,
  start,
});
const PRESS_NOTE = 'Not needed with light dumbbells. Ask a trainer to watch your first session.';

const TABLE: Record<string, Safety> = {
  // machines
  'assisted pull-up machine': {
    spotter: 'no',
    spotterNote: 'Machine: kneel on the pad and hold the handles.',
    start: 'Most help: set the counterweight high (about 30–40 kg of help). Less help = harder.',
  },
  'chest press machine': MACHINE,
  'chest press machine, light': MACHINE,
  'incline chest press machine': MACHINE,
  'shoulder press machine': MACHINE,
  'pec deck': MACHINE,
  'rear delt fly machine': MACHINE,
  'lat pulldown': { ...MACHINE, start: '10–15 kg. Pull to the top of the chest, not behind the neck.' },
  'lat pulldown, close grip': { ...MACHINE, start: '10–15 kg.' },
  'seated row machine': { ...MACHINE, start: '10–15 kg.' },
  'preacher curl machine': { ...MACHINE, start: 'Lightest weight on the stack (about 5 kg).' },
  'leg extension': { ...MACHINE, start: '5–10 kg. Slow on the way down.' },
  'lying leg curl': { ...MACHINE, start: '5–10 kg.' },
  'seated leg curl': { ...MACHINE, start: '5–10 kg.' },
  'leg press': {
    spotter: 'no',
    spotterNote: 'Keep the safety handles in reach. Never lock your knees straight.',
    start: 'Empty sled, or 10–20 kg on a weight-stack leg press.',
  },
  'hip abductor machine': { ...MACHINE, start: '10–15 kg.' },
  'hip adductor machine': { ...MACHINE, start: '10–15 kg.' },
  'hip thrust machine': { ...MACHINE, start: 'Lightest setting. Pad across the hips, chin tucked.' },
  'seated calf raise': { ...MACHINE, start: 'Empty machine or 5–10 kg.' },
  'standing calf raise': { spotter: 'no', spotterNote: 'Hold a rail for balance.', start: 'Body weight first; a machine at 10–20 kg later.' },
  // cables
  'cable crunch': { ...CABLE, start: '5–10 kg.' },
  'cable curl': CABLE,
  'cable fly': CABLE,
  'cable front raise': CABLE,
  'cable glute kickback': CABLE,
  'cable hip adduction': CABLE,
  'cable kickback': CABLE,
  'cable lateral raise': CABLE,
  'cable pull-through': { ...CABLE, start: '5–10 kg.' },
  'rope cable hammer curl': CABLE,
  'rope triceps pushdown': { ...CABLE, start: '5 kg.' },
  'straight bar pushdown': { ...CABLE, start: '5 kg.' },
  'overhead cable triceps extension': CABLE,
  'seated cable row': { ...CABLE, start: '10–15 kg. Sit tall, do not round the back.' },
  // Smith machine
  'smith incline press': SMITH,
  'smith machine squat': SMITH,
  // dumbbells and plates
  'dumbbell bench press': db('3–5 kg in each hand.', 'watch', PRESS_NOTE),
  'incline dumbbell press': db('3–5 kg in each hand.', 'watch', PRESS_NOTE),
  'dumbbell fly': db('2–3 kg in each hand. Small range, slight bend in the elbows.', 'watch', PRESS_NOTE),
  'seated dumbbell press': db('2–4 kg in each hand. Back against the bench.', 'watch', PRESS_NOTE),
  'seated dumbbell overhead extension': db('One dumbbell, 3–5 kg, held with both hands.', 'watch', 'Ask someone to hand you the dumbbell overhead the first time.'),
  'dumbbell curl': db('2–4 kg in each hand.'),
  'hammer curl': db('2–4 kg in each hand.'),
  'dumbbell lateral raise': db('1–2 kg in each hand. Lateral raises need very little weight.'),
  'dumbbell kickback': db('1–3 kg. Hand on a bench for support.'),
  'dumbbell row': db('4–6 kg. Hand and knee on a bench, flat back.'),
  'one-arm dumbbell row': db('4–6 kg. Hand and knee on a bench, flat back.'),
  'dumbbell romanian deadlift': db('4–6 kg in each hand. Flat back; stop when you feel the stretch.'),
  'goblet squat to a bench': db('One dumbbell, 4–6 kg, held at the chest.'),
  'goblet squat to bench': db('One dumbbell, 4–6 kg, held at the chest.'),
  'side bend with dumbbell': db('4–6 kg in one hand.'),
  'farmer walk': db('5–8 kg in each hand. Walk slowly, stand tall.'),
  'suitcase carry, one hand': db('5–8 kg in one hand.'),
  'plate front raise': db('A 2.5 or 5 kg plate.'),
  'barbell glute bridge': {
    spotter: 'no',
    spotterNote: 'You can roll the bar off your hips.',
    start: 'Body weight first, then an empty bar with a thick pad over the hips.',
  },
  // body weight / bands / cardio
  'band pull-apart': { ...BODY, start: 'The lightest band.' },
  'band pulldown': { ...BODY, start: 'The lightest band.' },
  'band side walk': { ...BODY, start: 'The lightest band, above the knees.' },
  'spanish squat with band': { ...BODY, start: 'A strong band round a post, behind the knees.' },
  'bench dip, knees bent': { ...BODY, spotterNote: 'Knees bent keeps it easy. Skip if your shoulders hurt.' },
  'bodyweight box squat': BODY,
  'brisk walk': { spotter: 'no', spotterNote: 'Comfortable shoes.', start: 'A pace where you can still talk.' },
  'treadmill incline walk': { spotter: 'no', spotterNote: 'Hold the rails only for balance; clip the safety key on.', start: '4–5 km/h at 3–5% incline.' },
  elliptical: { spotter: 'no', spotterNote: 'Hold the handles.', start: 'Lowest resistance, easy pace.' },
  'calf raise on a step': { ...BODY, spotterNote: 'Hold a rail for balance.' },
  'crunch on a mat': BODY,
  'dead bug': BODY,
  'donkey kick on a mat': BODY,
  'glute bridge': BODY,
  'glute bridge on the floor': BODY,
  'single-leg bridge': BODY,
  'plank on knees': BODY,
  'side plank on knees': BODY,
  'push-up on a bench': { ...BODY, spotterNote: 'Use a bench fixed against a wall so it cannot slide.' },
  'push-ups on a bench': { ...BODY, spotterNote: 'Use a bench fixed against a wall so it cannot slide.' },
  'wall push-up': BODY,
};
/** Explicit entry, if any (used by the coverage test). */
export function explicitSafety(name: string): Safety | null {
  return TABLE[name.trim().toLowerCase()] ?? null;
}

/** Safety for any name, including swap fallbacks like "DB curl" or "Plank / dead bug". */
export function safetyFor(name: string): Safety {
  const hit = explicitSafety(name);
  if (hit) return hit;
  const n = name.toLowerCase();
  if (/smith/.test(n)) return SMITH;
  if (/machine|pec deck|leg press|leg curl|leg extension|pulldown/.test(n)) return MACHINE;
  if (/cable|rope|pushdown/.test(n)) return CABLE;
  if (/\b(db|dumbbell)\b.*\b(press|fly)\b/.test(n)) return db('3–5 kg in each hand.', 'watch', PRESS_NOTE);
  if (/lateral raise/.test(n)) return db('1–2 kg in each hand.');
  if (/\b(db|dumbbell|goblet|farmer|rdl)\b/.test(n)) return db('Start light: 2–5 kg. Add weight only when every rep feels easy.');
  if (/barbell/.test(n)) return { spotter: 'watch', spotterNote: 'Ask a trainer to watch the first time.', start: 'Empty bar only.' };
  return BODY;
}

export const SPOTTER_LABEL: Record<Spotter, string> = {
  no: 'Not needed',
  watch: 'Helpful at first',
  yes: 'Yes, at first',
};
