import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import plan from '../domain/trainingPlan.json';
import { useAppStore } from '../store/useAppStore';
import * as repo from '../data/repository';
import { RestTimer, type RestState } from '../components/RestTimer';
import { parseRestSeconds } from '../domain/restTimer';
import { carryOver, skipOptions, type SkipChoice } from '../domain/skipDay';
import { MuscleRecoveryGrid } from '../components/MuscleRecoveryGrid';
import { ExerciseGif } from '../components/ExerciseGif';
import { SwapPanel } from '../components/SwapPanel';
import { SafetyNote } from '../components/SafetyNote';
import { WorkoutPlayer } from '../components/WorkoutPlayer';
import type { PlayerExercise } from '../domain/workoutPlayer';
import { WarmupList } from '../components/WarmupList';
import { demoUrl } from '../domain/exerciseMedia';
import { workoutSticker } from '../domain/stickers';
import { shouldForceBasic } from '../health/scores';
import {
  PLAN_END,
  PLAN_START,
  RAMADAN_START,
  macrosFor,
  missionFor,
  planPhase,
  sessionFor,
  sundayCheckpoints,
  type PlanPhase,
} from '../domain/plan';
import {
  fallbackFor,
  orderedAlternatives,
  reasonLabel,
  resolveDisplayName,
  swapKey,
  type ActiveSwapMap,
  type SwapReason,
} from '../domain/exerciseSwap';
import type { WorkoutEntry, WorkoutExercise } from '../domain/types';
import { buildCheckin } from '../lib/checkin';
import { parseLocalDate, toLocalISODate } from '../lib/dates';
import { sleepDurationHours } from '../lib/dates';
import {
  PLAN_NOTE_PREFIX,
  isNewBest,
  lastLogsByName,
  loggedSetRow,
  progressionHint,
  type LastLog,
} from '../lib/trainingLog';
import './TrainingPage.css';
import { useT } from '../i18n/useT';

type DayKey = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'arms' | 'core' | 'rest' | 'pump';

interface PlanExercise {
  code: string;
  name: string;
  muscle: string;
  sets: string[][];
  rest: string;
  cues: string[];
  why: string;
  alts: string[];
  advanced: string | null;
  blockB: string | null;
  demo: string;
  warmupSet: boolean;
  note: string | null;
  pair: string | null;
}

const BASE_DAYS: { key: DayKey; label: string; session: string }[] = [
  { key: 'push', label: 'Mon · Chest & Triceps', session: 'Chest & Triceps' },
  { key: 'pull', label: 'Tue · Back & Biceps', session: 'Back & Biceps' },
  { key: 'legs', label: 'Wed · Legs', session: 'Legs' },
  { key: 'upper', label: 'Thu · Shoulders & Abs', session: 'Shoulders & Abs' },
  { key: 'lower', label: 'Fri · Full body & Glutes', session: 'Full body & Glutes' },
  { key: 'arms', label: 'Sat · Walk', session: 'Walk + toning' },
  { key: 'core', label: 'Sat · Stretch', session: 'Walk + stretch' },
  { key: 'rest', label: 'Rest', session: 'Rest' },
];

const fmtDay = (iso: string) => format(parseLocalDate(iso), 'd MMM');

function defaultDay(today: string): DayKey {
  if (today === PLAN_END) return 'pump';
  const s = sessionFor(today < PLAN_START ? PLAN_START : today);
  if (s.key === 'saturday') return 'arms';
  if (s.key === 'rest') return 'rest';
  return s.key;
}

export function TrainingPage() {
  const t = useT();
  const settings = useAppStore((s) => s.settings);
  const setToast = useAppStore((s) => s.setToast);
  const celebrate = useAppStore((s) => s.celebrate);
  const refreshDay = useAppStore((s) => s.refreshDay);
  const refreshSettings = useAppStore((s) => s.refreshSettings);
  const [skipOpen, setSkipOpen] = useState(false);
  const today = toLocalISODate();
  const [day, setDay] = useState<DayKey>(() => defaultDay(today));
  const [checkin, setCheckin] = useState<string | null>(null);
  const [history, setHistory] = useState<WorkoutEntry[]>([]);
  const [rest, setRest] = useState<RestState>(null);
  const [swaps, setSwaps] = useState<ActiveSwapMap>({});
  const [playing, setPlaying] = useState(false);
  const [lastNightSleepH, setLastNightSleepH] = useState<number | null>(null);
  const [todayRecovery, setTodayRecovery] = useState<number | null>(null);
  const [todayStrain, setTodayStrain] = useState<number | null>(null);
  const ref = today < PLAN_START ? PLAN_START : today;
  const phase = planPhase(ref);
  const session = sessionFor(today);
  const mission = missionFor(ref);
  const todayKey = defaultDay(today);
  const checkpoints = useMemo(() => (settings ? sundayCheckpoints(settings) : []), [settings]);
  const days = useMemo(
    () =>
      today >= RAMADAN_START && today <= PLAN_END
        ? [...BASE_DAYS, { key: 'pump' as DayKey, label: 'Ramadan · Eid', session: 'Ramadan & Eid' }]
        : BASE_DAYS,
    [today],
  );
  const forceBasic = useMemo(() => {
    const sleepH = lastNightSleepH ?? 8;
    return shouldForceBasic(todayRecovery ?? 70, todayStrain ?? 0, sleepH);
  }, [lastNightSleepH, todayRecovery, todayStrain]);

  const effectivePhase = useMemo((): PlanPhase => {
    if (forceBasic && phase.advanced) {
      return { ...phase, advanced: false, mode: 'Build' };
    }
    return phase;
  }, [phase, forceBasic]);

  const historyFrom = format(addDays(parseLocalDate(today), -120), 'yyyy-MM-dd');
  const loadHistory = useCallback(async () => {
    setHistory(await repo.getWorkoutsInRange(historyFrom, today));
  }, [historyFrom, today]);

  useEffect(() => {
    let cancelled = false;
    void repo.getWorkoutsInRange(historyFrom, today).then((rows) => {
      if (!cancelled) setHistory(rows);
    });
    void repo.getActiveSwaps(today).then((map) => {
      if (!cancelled) setSwaps(map);
    });
    const yday = format(addDays(parseLocalDate(today), -1), 'yyyy-MM-dd');
    void repo.getSleepByDate(yday).then((sl) => {
      if (cancelled || !sl) return;
      setLastNightSleepH(sleepDurationHours(sl.bedtime, sl.wakeTime));
    });
    void repo.getDailyScore(today).then((row) => {
      if (cancelled) return;
      setTodayRecovery(row?.recovery ?? null);
      setTodayStrain(row?.strain ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [historyFrom, today]);

  const exercises = useMemo(
    () => (plan.days as Record<string, PlanExercise[]>)[day] ?? [],
    [day],
  );
  const displayName = useCallback(
    (ex: PlanExercise) =>
      resolveDisplayName(ex, { day, swaps, useBlockB: effectivePhase.blockB }),
    [day, swaps, effectivePhase.blockB],
  );
  const lastLogs = useMemo(
    () => lastLogsByName(history, exercises.map(displayName), today),
    [history, exercises, displayName, today],
  );
  const sessionLabel = days.find((d) => d.key === day)?.session ?? 'Session';
  const playerExercises = useMemo<PlayerExercise[]>(
    () =>
      exercises.map((ex) => {
        const n = displayName(ex);
        return { name: n, media: null, muscle: ex.muscle, sets: ex.sets, rest: ex.rest, cue: n === ex.name ? (ex.cues[0] ?? null) : null };
      }),
    [exercises, displayName],
  );
  const lastKg = useMemo(
    () => Object.fromEntries(Object.entries(lastLogs).map(([k, v]) => [k, v?.weightKg])),
    [lastLogs],
  );
  const todaySession = history.find(
    (w) => w.date === today && w.notes === `${PLAN_NOTE_PREFIX}${sessionLabel}`,
  );

  if (!settings) return null;
  const macros = macrosFor(settings, today);
  const isLower = day === 'legs' || day === 'lower';
  const cardio = (plan.cardio as Record<string, { title: string; how: string[] }>)[day];

  const saveSet = async (name: string, weightKg: number | undefined, reps: number | undefined) => {
    const ex: WorkoutExercise = { name, weightKg, reps, sets: 1, notes: 'top set' };
    const best = isNewBest(history, name, today, weightKg, reps);
    const done = workoutSticker((todaySession?.exercises ?? []).map((e) => e.name), name, exercises.length);
    await repo.logPlanExercise(today, sessionLabel, ex);
    await Promise.all([loadHistory(), refreshDay()]);
    setToast(best ? `🏆 New best on ${name}: ${weightKg} kg${reps != null ? ` × ${reps}` : ''}` : `${name} logged`);
    if (done) celebrate(done);
    else if (best) celebrate({ emoji: '🏆', title: 'New best!', sub: name });
  };

  const makeCheckin = async () => {
    const end = today;
    const start = format(addDays(parseLocalDate(end), -6), 'yyyy-MM-dd');
    const prevStart = format(addDays(parseLocalDate(end), -13), 'yyyy-MM-dd');
    const prevEnd = format(addDays(parseLocalDate(end), -7), 'yyyy-MM-dd');
    const [week, prev] = await Promise.all([
      repo.loadAggregatesInRange(start, end),
      repo.loadAggregatesInRange(prevStart, prevEnd),
    ]);
    const pk = prev.map((d) => d.primaryWeightKg).filter((v): v is number => v != null);
    const text = buildCheckin(
      settings,
      week,
      today,
      pk.length ? pk.reduce((a, b) => a + b, 0) / pk.length : null,
    );
    setCheckin(text);
    try {
      await navigator.clipboard.writeText(text);
      setToast('Check-in copied');
    } catch {
      setToast('Select the text below and copy it');
    }
  };

  const loggedCount = todaySession?.exercises?.length ?? 0;

  const skipChoices = skipOptions(today);
  const skipToday = settings.skippedSessions?.[today];
  const carry = carryOver(today, settings.skippedSessions);
  const saveSkip = async (choice: SkipChoice | null) => {
    const next = { ...settings.skippedSessions };
    if (choice == null) delete next[today];
    else next[today] = { session: session.key, choice };
    await repo.updateSettings({ skippedSessions: next });
    await refreshSettings();
    setSkipOpen(false);
    setToast(choice == null ? 'Skip undone' : 'Plan adjusted — see you tomorrow');
  };

  const startRest = (ex: PlanExercise, label: string) => {
    const secs = parseRestSeconds(ex.rest);
    if (secs == null) return;
    setRest({ endsAt: Date.now() + secs * 1000, total: secs, label });
  };

  return (
    <div className="stack page">
      <RestTimer rest={rest} onChange={setRest} />
      <header className="panel page-header stack">
        <div>
          <p className="briefing-kicker">
            {today < PLAN_START ? 'Plan starts Mon 9 Nov' : `Week ${phase.week} · ${phase.phase}`}
          </p>
          <h1>{t('Train')}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {t('Today:')} <strong>{t(session.label)}</strong>
            {session.note ? ` · ${session.note}` : ''} · {macros.calories} kcal · {macros.proteinG} g
            protein
          </p>
        </div>
        <div className="train-banner">
          <strong>Mode: {effectivePhase.mode}.</strong> <ModeText phase={effectivePhase} />
          <br />
          <strong>Week {mission.week} mission:</strong> {mission.text}
        </div>
        {carry && (
          <div className="train-banner" role="status">
            <strong>Carried over from yesterday:</strong>{' '}
            {carry.choice === 'tomorrow'
              ? `do ${carry.session} today instead of the scheduled session.`
              : `start with ${carry.lifts.join(' and ')} (top set only), then today's session.`}
            {carry.choice === 'tomorrow' && carry.session !== day && (
              <>
                {' '}
                <button type="button" className="btn btn-ghost" onClick={() => setDay(carry.session as DayKey)}>
                  Open {carry.session}
                </button>
              </>
            )}
          </div>
        )}
        {skipToday ? (
          <div className="train-banner skip-done" role="status">
            Skipped today: <strong>{skipToday.choice === 'drop' ? 'dropped' : skipToday.choice === 'merge' ? 'merging into tomorrow' : 'moved to tomorrow'}</strong>.{' '}
            <button type="button" className="btn btn-ghost" onClick={() => void saveSkip(null)}>
              Undo
            </button>
          </div>
        ) : (
          skipChoices &&
          loggedCount === 0 && (
            <div className="skip-coach">
              <button
                type="button"
                className="btn btn-ghost"
                aria-expanded={skipOpen}
                onClick={() => setSkipOpen((o) => !o)}
              >
                Can't train today?
              </button>
              {skipOpen && (
                <div className="skip-options">
                  {skipChoices.map((o) => (
                    <button
                      key={o.choice}
                      type="button"
                      className={`skip-option${o.recommended ? ' recommended' : ''}`}
                      onClick={() => void saveSkip(o.choice)}
                    >
                      <span className="skip-title">
                        {o.title}
                        {o.recommended && <span className="skip-badge">Coach pick</span>}
                      </span>
                      <span className="skip-detail">{o.detail}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        )}
        {forceBasic && (
          <div className="train-banner warn" role="status">
            {lastNightSleepH != null && lastNightSleepH < 6.5
              ? `Slept ${Math.floor(lastNightSleepH)}h ${Math.round((lastNightSleepH % 1) * 60)}m last night — `
              : todayRecovery != null && todayRecovery <= 33
                ? 'Low recovery today — '
                : ''}
            using <strong>Basic</strong> today (readiness + sleep).
          </div>
        )}
      </header>

      <nav className="train-days" aria-label="Training day">
        {days.map((d) => (
          <button
            key={d.key}
            type="button"
            className={`${day === d.key ? 'active' : ''} ${todayKey === d.key ? 'today' : ''}`}
            aria-pressed={day === d.key}
            onClick={() => setDay(d.key)}
          >
            {t(d.label)}
          </button>
        ))}
      </nav>

      <MuscleRecoveryGrid workouts={history} />

      {day === 'rest' && (
        <section className="panel stack">
          <h2 style={{ fontSize: 'var(--text-lg)' }}>Rest + Sunday check-in</h2>
          <ul className="train-list">
            <li><span>Easy walk</span><span>20-30 min</span></li>
            <li><span>Weigh-in + waist</span><span>Sunday</span></li>
            <li><span>Photos</span><span>Every 2nd Sunday</span></li>
            <li><span>Cook ahead</span><span>Daal, boiled eggs, chicken</span></li>
          </ul>
        </section>
      )}

      {day === 'core' && (
        <section className="panel stack">
          <h2 style={{ fontSize: 'var(--text-lg)' }}>{plan.satOption2.title}</h2>
          <p className="muted" style={{ margin: 0 }}>
            Pick this Saturday if you're sore or tired. A walk still counts.
          </p>
          <ul className="train-list">
            {plan.satOption2.blocks.map(([t, d]) => (
              <li key={t} style={{ flexDirection: 'column', gap: 4 }}>
                <strong>{t}</strong>
                <span style={{ textAlign: 'left' }}>{d}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {day === 'pump' && (
        <section className="panel stack">
          <h2 style={{ fontSize: 'var(--text-lg)' }}>{plan.birthdayPump.title}</h2>
          <p className="muted" style={{ margin: 0 }}>{plan.birthdayPump.when}</p>
          <ul className="train-list">
            {plan.birthdayPump.moves.map(([n, d]) => (
              <li key={n}><span>{n}</span><span>{d}</span></li>
            ))}
          </ul>
          <p className="muted" style={{ margin: 0 }}>{plan.birthdayPump.after}</p>
        </section>
      )}

      {exercises.length > 0 && (
        <>
          <section className="panel stack">
            <div className="section-head">
              <h2 style={{ fontSize: 'var(--text-lg)' }}>Warm-up · 8-10 min</h2>
            </div>
            <WarmupList rows={[...plan.warmupBase, ...(isLower ? plan.warmupLower : plan.warmupUpper)]} />
            {!isLower && (
              <p className="dim" style={{ margin: 0, fontSize: 'var(--text-caption)' }}>
                No band "dislocates" over the head — that end position is how a shoulder comes out.
              </p>
            )}
          </section>

          <button type="button" className="btn btn-primary train-play" onClick={() => setPlaying(true)}>
            ▶ {t('Start workout')}
            <span>
              {exercises.length} · {sessionLabel}
            </span>
          </button>
          <p className="dim train-safety">
            {t('Stop at once for sharp pain, dizziness, chest pain or unusual breathlessness. Light weights first; good form beats heavy.')}
          </p>
          {playing && (
            <WorkoutPlayer
              title={sessionLabel}
              exercises={playerExercises}
              lastKg={lastKg}
              doneNames={(todaySession?.exercises ?? []).map((e) => e.name)}
              onLog={saveSet}
              onClose={() => setPlaying(false)}
            />
          )}

          <p className="muted" style={{ margin: '0 4px' }}>
            {loggedCount > 0
              ? `${loggedCount} of ${exercises.length} exercises logged today.`
              : 'Log your top set on each card. Next time the app shows it and tells you whether to add weight.'}
          </p>

          <section className="stack" aria-label="Exercises">
            {exercises.map((ex, i) => {
              const name = displayName(ex);
              const key = swapKey(day, ex.code);
              const swap = swaps[key];
              const todayEx = todaySession?.exercises?.find(
                (e) => e.name.toLowerCase() === name.toLowerCase(),
              );
              return (
                <ExerciseCard
                  key={ex.code + ex.name}
                  ex={ex}
                  name={name}
                  planName={ex.name}
                  phase={effectivePhase}
                  sessionNote={session.key !== 'rest' ? session.note : null}
                  last={lastLogs[name]}
                  todayLog={todayEx}
                  defaultOpen={i === 0}
                  swap={swap}
                  shoulderCaution={settings.shoulderCaution}
                  onSave={saveSet}
                  onStartRest={() => startRest(ex, name)}
                  onSwap={async (swappedName, reason) => {
                    const map = await repo.setExerciseSwap({
                      date: today,
                      dayKey: day,
                      code: ex.code,
                      planName: ex.name,
                      swappedName,
                      reason,
                    });
                    setSwaps(map);
                  }}
                  onUndoSwap={async () => {
                    const map = await repo.clearExerciseSwap(today, day, ex.code);
                    setSwaps(map);
                  }}
                />
              );
            })}
          </section>

          {cardio && (
            <section className="panel stack">
              <h2 style={{ fontSize: 'var(--text-lg)' }}>Cardio · {cardio.title}</h2>
              <ul className="ex-cues">
                {cardio.how.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="panel stack">
            <h2 style={{ fontSize: 'var(--text-lg)' }}>Cooldown · 5 min</h2>
            <WarmupList rows={isLower ? plan.cooldownLower : plan.cooldownUpper} />
          </section>
        </>
      )}

      <section className="panel stack">
        <h2 style={{ fontSize: 'var(--text-lg)' }}>Sunday checkpoints</h2>
        <p className="muted" style={{ margin: 0 }}>
          Target 7-day average for each Sunday on the line to {settings.targetWeightKg} kg.
        </p>
        <table className="cp-table">
          <thead>
            <tr>
              <th>Week</th>
              <th>Sunday</th>
              <th>Target avg</th>
            </tr>
          </thead>
          <tbody>
            {checkpoints.map((c) => {
              const now =
                today <= c.sunday &&
                today > format(addDays(parseLocalDate(c.sunday), -7), 'yyyy-MM-dd');
              return (
                <tr key={c.sunday} className={now ? 'now' : ''}>
                  <td>{c.week}</td>
                  <td>{fmtDay(c.sunday)}</td>
                  <td>{c.targetKg.toFixed(1)} kg</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="dim" style={{ margin: 0, fontSize: 'var(--text-caption)' }}>
          Behind 0.5-1 kg: +1,000 steps a day. Over 1 kg: +2,000 steps and one roti less at dinner.
          Never under 100 g protein.
        </p>
      </section>

      <section className="panel stack">
        <h2 style={{ fontSize: 'var(--text-lg)' }}>Sunday check-in for Claude</h2>
        <p className="muted" style={{ margin: 0 }}>
          Copies your last 7 days of real logs. Paste it into Claude and fill in the notes.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => void makeCheckin()}>
          Copy check-in
        </button>
        {checkin && (
          <textarea
            className="checkin"
            readOnly
            value={checkin}
            aria-label="Check-in text"
            onFocus={(e) => e.currentTarget.select()}
          />
        )}
      </section>
    </div>
  );
}

function ModeText({ phase }: { phase: PlanPhase }) {
  switch (phase.mode) {
    case 'Learn':
      return <>Light weights. Learn each machine and log what you lift. 2-3 reps left in the tank.</>;
    case 'Build':
      return <>When all 12 reps feel easy, go one step heavier next time.</>;
    case 'Strong':
      return <>Top set: pause 1 second at the hardest point of every rep.</>;
    case 'Deload':
      return <>Same exercises at about 60% of your logged weights, half the sets. Food stays the same.</>;
    case 'Ramadan':
      return <>Train after iftar, 2 sets per exercise, lighter. Drink water between sets. Skip if dizzy.</>;
    case 'Eid':
      return <>Eid Mubarak! No gym today. Enjoy the day.</>;
    default:
      return <>The plan starts Monday 9 November.</>;
  }
}

function ExerciseCard({
  ex,
  name,
  planName,
  phase,
  sessionNote,
  last,
  todayLog,
  defaultOpen,
  swap,
  shoulderCaution,
  onSave,
  onStartRest,
  onSwap,
  onUndoSwap,
}: {
  ex: PlanExercise;
  name: string;
  planName: string;
  phase: PlanPhase;
  sessionNote: string | null;
  last: LastLog | undefined;
  todayLog: WorkoutExercise | undefined;
  defaultOpen: boolean;
  swap?: { name: string; reason: SwapReason };
  shoulderCaution: boolean;
  onSave: (name: string, weightKg: number | undefined, reps: number | undefined) => Promise<void>;
  onStartRest: () => void;
  onSwap: (swappedName: string, reason: SwapReason) => Promise<void>;
  onUndoSwap: () => Promise<void>;
}) {
  const t = useT();
  const row = loggedSetRow(ex.sets);
  const repRange = row?.[1] ?? '';
  const fallback = fallbackFor(ex.muscle, shoulderCaution);
  const [reason, setReason] = useState<SwapReason>(swap?.reason ?? 'busy');
  const alts = orderedAlternatives(ex.alts, fallback, reason);
  // Inputs show today's log, else last time's weight — cleared on fresh swap.
  const derivedKg = todayLog?.weightKg ?? (swap ? undefined : last?.weightKg);
  const [kgEdit, setKgEdit] = useState<string | null>(null);
  const [repsEdit, setRepsEdit] = useState<string | null>(null);
  const [freshSwap, setFreshSwap] = useState(false);
  const kg = kgEdit ?? (derivedKg != null ? String(derivedKg) : '');
  const reps = repsEdit ?? (todayLog?.reps != null ? String(todayLog.reps) : '');
  const [busy, setBusy] = useState(false);
  const usingBlockB = !swap && phase.blockB && ex.blockB != null;
  const kgId = `kg-${ex.code}-${ex.name}`.replace(/[^a-zA-Z0-9-]/g, '');
  const repsId = `reps-${ex.code}-${ex.name}`.replace(/[^a-zA-Z0-9-]/g, '');

  const save = async () => {
    const k = kg.trim() === '' ? undefined : Number(kg);
    const r = reps.trim() === '' ? undefined : Number(reps);
    if ((k != null && (!Number.isFinite(k) || k < 0 || k > 500)) || (r != null && (!Number.isInteger(r) || r < 0 || r > 100))) {
      return;
    }
    if (k == null && r == null) return;
    setBusy(true);
    try {
      await onSave(name, k, r);
      onStartRest();
      setKgEdit(null);
      setRepsEdit(null);
      setFreshSwap(false);
    } finally {
      setBusy(false);
    }
  };

  const pickAlt = async (alt: string) => {
    setBusy(true);
    try {
      await onSwap(alt, reason);
      setKgEdit('');
      setRepsEdit('');
      setFreshSwap(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className={`ex${todayLog ? ' done' : ''}`} open={defaultOpen}>
      <summary>
        <span className="ex-code">{todayLog ? '✓' : ex.code}</span>
        <span>
          <span className="ex-name">{name}</span>
          <span className="ex-muscle">
            {ex.muscle}
            {ex.pair ? ` · ${ex.pair}` : ''}
          </span>
          {swap && (
            <span className="ex-swap-badge">
              Swapped: {planName} → {swap.name} ({reasonLabel(swap.reason).toLowerCase()})
            </span>
          )}
        </span>
        <span className="ex-chev" aria-hidden>
          ›
        </span>
      </summary>
      <div className="ex-body">
        {usingBlockB && (
          <div className="ex-bb on">
            <strong>Block B</strong>Doing {ex.blockB} instead of {ex.name}. Same sets and reps; start
            lighter and recalibrate the weight.
          </div>
        )}
        <ExerciseGif key={name} name={name} />
        <table className="ex-sets">
          <thead>
            <tr>
              <th>Set</th>
              <th>Reps</th>
              <th>{usingBlockB ? 'Block A weight (guide)' : 'Weight'}</th>
            </tr>
          </thead>
          <tbody>
            {ex.sets.map(([s, r, w], j) => (
              <tr key={j}>
                <td>{s}</td>
                <td>{r}</td>
                <td>{w}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <SafetyNote name={name} />

        <SwapPanel
          planName={planName}
          muscle={ex.muscle}
          alts={alts}
          reason={reason}
          onReason={setReason}
          current={swap?.name ?? null}
          busy={busy}
          onPick={(alt) => void pickAlt(alt)}
          onUndo={() => void onUndoSwap()}
        />

        <div className="ex-log">
          <div className="ex-log-head">
            <strong>Log your {row?.[0]?.toLowerCase().startsWith('top') ? 'top set' : 'hardest set'}</strong>
            <span>
              {last?.weightKg != null
                ? `Last: ${last.weightKg} kg${last.reps != null ? ` × ${last.reps}` : ''} (${fmtDay(last.date)})`
                : 'No log yet'}
            </span>
          </div>
          <p className="ex-hint">
            {freshSwap || (swap && !todayLog)
              ? 'New exercise: pick a weight you can do for the top of the rep range with 1–2 reps left'
              : progressionHint(last, repRange)}
          </p>
          <div className="ex-log-row">
            <label htmlFor={kgId}>
              kg
              <input
                id={kgId}
                inputMode="decimal"
                type="number"
                step="0.5"
                min="0"
                value={kg}
                onChange={(e) => setKgEdit(e.target.value)}
              />
            </label>
            <label htmlFor={repsId}>
              reps
              <input
                id={repsId}
                inputMode="numeric"
                type="number"
                step="1"
                min="0"
                placeholder={repRange.split(',')[0]}
                value={reps}
                onChange={(e) => setRepsEdit(e.target.value)}
              />
            </label>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void save()}>
              {todayLog ? 'Update' : 'Save'}
            </button>
          </div>
        </div>

        <div className="ex-meta">
          <strong>Rest:</strong> {ex.rest} {ex.warmupSet ? '· Warm-up set first (new exercise)' : ''}
          {parseRestSeconds(ex.rest) != null && (
            <button type="button" className="btn btn-ghost ex-rest-btn" onClick={onStartRest}>
              Start rest timer
            </button>
          )}
          {sessionNote ? ` · ${sessionNote}` : ''}
        </div>
        <ul className="ex-cues">
          {ex.cues.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <div className="ex-why">
          <strong>Why this, why here</strong>
          {ex.why}
        </div>
        {ex.advanced && (
          <div className={`ex-adv${phase.advanced ? ' on' : ''}`}>
            <strong>Pause reps (weeks 9-13){phase.advanced ? ' · use it now' : ''}</strong>
            {ex.advanced}
          </div>
        )}
        {ex.blockB && !phase.blockB && !swap && (
          <div className="ex-bb">
            <strong>Block B (from 7 Dec)</strong>
            {ex.blockB}
          </div>
        )}
        {ex.note && (
          <div className="dim" style={{ fontSize: 'var(--text-caption)' }}>
            {ex.note}
          </div>
        )}
        <a className="btn" href={swap || usingBlockB ? demoUrl(name) : ex.demo} target="_blank" rel="noopener">
          ▶ {t('Watch Hindi video')}
        </a>
      </div>
    </details>
  );
}
