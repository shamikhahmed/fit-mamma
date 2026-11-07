import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_MACHINE,
  MACHINE_HOW,
  STOP_SIGNS,
  cardioFor,
  expandSteps,
  kmhToMph,
  settingText,
  stepAnnouncement,
  zone2,
  type CardioDay,
  type CardioSession,
  type CardioStep,
  type Machine,
} from '../domain/cardioPlan';
import { formatClock } from '../domain/restTimer';
import { demoUrl } from '../domain/exerciseMedia';
import { beep, speak, stopSpeaking } from '../lib/voice';
import { ExerciseGif } from './ExerciseGif';
import { useAppStore } from '../store/useAppStore';
import { useT } from '../i18n/useT';
import './CardioCard.css';
import './WorkoutPlayer.css';

const GIF_NAME: Record<Machine, string> = { treadmill: 'Treadmill incline walk', elliptical: 'Elliptical' };
const MACHINE_KEY = 'fm-cardio-machine-';
const VOICE_KEY = 'fm-player-voice';

function readMachine(day: CardioDay): Machine {
  try {
    const v = localStorage.getItem(MACHINE_KEY + day);
    if (v === 'treadmill' || v === 'elliptical') return v;
  } catch {
    /* private mode */
  }
  return DEFAULT_MACHINE[day];
}

interface Props {
  day: CardioDay;
  date: string;
  birthYear: number | null | undefined;
  /** False when looking at another day's plan: no timer or log. */
  canLog: boolean;
  /** Minutes already logged as plan cardio today, if any. */
  doneMin: number | null;
  onLog: (machine: Machine, minutes: number) => Promise<void>;
}

/** Post-workout cardio: machine toggle, minute-by-minute settings, guided timer, log. */
export function CardioCard({ day, date, birthYear, canLog, doneMin, onLog }: Props) {
  const t = useT();
  const [machine, setMachine] = useState<Machine>(() => readMachine(day));
  const [howOpen, setHowOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => setMachine(readMachine(day)), [day]);

  const session = cardioFor(date, day, machine);
  if (!session) return null;
  const zone = zone2(birthYear, Number(date.slice(0, 4)));

  const pick = (m: Machine) => {
    setMachine(m);
    try {
      localStorage.setItem(MACHINE_KEY + day, m);
    } catch {
      /* private mode */
    }
  };

  const log = async (minutes: number) => {
    setBusy(true);
    try {
      await onLog(machine, minutes);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel stack cardio">
      <div className="cardio-head">
        <h2>
          {t('Cardio')}
          {session.optional && <span className="cardio-tag">{t('Optional')}</span>}
        </h2>
        <span className="cardio-total">{session.totalMin} min</span>
      </div>

      <div className="swap-seg cardio-seg" role="group" aria-label={t('Machine')}>
        {(['treadmill', 'elliptical'] as Machine[]).map((m) => (
          <button key={m} type="button" className={machine === m ? 'on' : ''} aria-pressed={machine === m} onClick={() => pick(m)}>
            {t(m === 'treadmill' ? 'Treadmill' : 'Elliptical')}
            {DEFAULT_MACHINE[day] === m && <span className="cardio-dot" aria-label={t('Coach pick')} />}
          </button>
        ))}
      </div>

      <ExerciseGif key={machine} name={GIF_NAME[machine]} />

      {session.note && <p className="cardio-note">{t(session.note)}</p>}

      <CardioTable session={session} />

      <dl className="cardio-facts">
        <div>
          <dt>{t('Effort')}</dt>
          <dd>{t('You can talk in full sentences, but not sing.')}</dd>
        </div>
        {zone && (
          <div>
            <dt>{t('Heart rate')}</dt>
            <dd>
              {zone.lo}–{zone.hi} bpm · {t('if you wear a watch; the talk test wins.')}
            </dd>
          </div>
        )}
        <div>
          <dt>{t('Spotter')}</dt>
          <dd>{t('Not needed.')}</dd>
        </div>
      </dl>

      <button type="button" className="cardio-how-toggle" aria-expanded={howOpen} onClick={() => setHowOpen((o) => !o)}>
        <span>{t(machine === 'treadmill' ? 'How to use the treadmill safely' : 'How to use the elliptical safely')}</span>
        <span aria-hidden>{howOpen ? '−' : '+'}</span>
      </button>
      {howOpen && (
        <div className="stack" style={{ gap: 8 }}>
          <ol className="cardio-how">
            {MACHINE_HOW[machine].map((h) => (
              <li key={h}>{t(h)}</li>
            ))}
          </ol>
          <a className="btn btn-ghost cardio-video" href={demoUrl(GIF_NAME[machine])} target="_blank" rel="noreferrer">
            ▶ {t('Watch Hindi video')}
          </a>
        </div>
      )}

      <p className="cardio-stop">{t(STOP_SIGNS)}</p>

      {!canLog ? null : doneMin != null ? (
        <div className="cardio-done" role="status">
          ✓ {t('Cardio done')} · {doneMin} min
        </div>
      ) : (
        <div className="cardio-actions">
          <button type="button" className="btn btn-primary" onClick={() => { beep(); setRunning(true); }}>
            ▶ {t('Start cardio')}
          </button>
          <button type="button" className="btn" disabled={busy} onClick={() => void log(session.totalMin)}>
            ✓ {t('Mark done')}
          </button>
        </div>
      )}

      {running && (
        <CardioPlayer
          session={session}
          onClose={() => setRunning(false)}
          onFinish={async (min) => {
            await log(min);
          }}
        />
      )}
    </section>
  );
}

function StepSetting({ s }: { s: CardioStep }) {
  if (s.speedKmh != null) {
    return (
      <>
        <span className="cardio-v">{s.speedKmh.toFixed(1)} <small>km/h</small></span>
        <span className="cardio-v">{s.inclinePct ?? 0}<small>%</small></span>
      </>
    );
  }
  return (
    <span className="cardio-v cardio-span2">
      <small>Level</small> {s.level ?? 1}
    </span>
  );
}

function CardioTable({ session }: { session: CardioSession }) {
  const t = useT();
  const tread = session.machine === 'treadmill';
  return (
    <div className="cardio-table" role="table" aria-label={session.title}>
      <div className="cardio-tr cardio-th" role="row">
        <span role="columnheader">{t('Part')}</span>
        <span role="columnheader">{t('Time')}</span>
        {tread ? (
          <>
            <span role="columnheader">{t('Speed')}</span>
            <span role="columnheader">{t('Incline')}</span>
          </>
        ) : (
          <span role="columnheader" className="cardio-span2">{t('Resistance')}</span>
        )}
      </div>
      {session.rows.map((r, ri) => (
        <div key={ri} className={r.rounds > 1 ? 'cardio-group' : undefined}>
          {r.rounds > 1 && <div className="cardio-rounds">{t('Repeat')} × {r.rounds}</div>}
          {r.steps.map((s, si) => (
            <div key={si} className="cardio-tr" role="row">
              <span role="cell" className="cardio-part">
                <strong>{t(s.label)}</strong>
                <small>{t(s.feel)}</small>
              </span>
              <span role="cell" className="cardio-v">{s.min} <small>min</small></span>
              <StepSetting s={s} />
            </div>
          ))}
        </div>
      ))}
      {tread && (
        <p className="cardio-foot">
          {t('Treadmill in mph?')}{' '}
          {[...new Set(expandSteps(session.rows).map((x) => x.speedKmh ?? 0))]
            .sort((a, b) => a - b)
            .map((k) => `${k.toFixed(1)} → ${kmhToMph(k).toFixed(1)}`)
            .join(' · ')}
        </p>
      )}
    </div>
  );
}

function readVoice(): boolean {
  try {
    return localStorage.getItem(VOICE_KEY) !== 'off';
  } catch {
    return true;
  }
}

/** Full-screen timer: counts each part down, says the next speed / incline / level. */
function CardioPlayer({ session, onClose, onFinish }: { session: CardioSession; onClose: () => void; onFinish: (min: number) => Promise<void> }) {
  const t = useT();
  const lang = useAppStore((s) => s.settings?.language) ?? 'en';
  const steps = useMemo(() => expandSteps(session.rows), [session.rows]);
  const [idx, setIdx] = useState(0);
  const [endAt, setEndAt] = useState(() => Date.now() + steps[0].min * 60_000);
  const [pausedLeft, setPausedLeft] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [voice, setVoice] = useState(readVoice);
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(Date.now());
  const lastBeep = useRef<number | null>(null);
  const step = steps[idx];
  const next = steps[idx + 1];
  const leftMs = pausedLeft ?? Math.max(0, endAt - now);
  const left = Math.ceil(leftMs / 1000);
  const doneBefore = steps.slice(0, idx).reduce((s, st) => s + st.min * 60, 0);
  const progress = finished ? 1 : (doneBefore + step.min * 60 - left) / (session.totalMin * 60);

  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    void nav.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => undefined);
    document.body.style.overflow = 'hidden';
    return () => {
      void lock?.release().catch(() => undefined);
      document.body.style.overflow = '';
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    if (voice && !finished) speak(stepAnnouncement(step), undefined, lang);
  }, [idx, voice, finished, step, lang]);

  useEffect(() => {
    if (finished || pausedLeft != null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [finished, pausedLeft]);

  const finish = async () => {
    setFinished(true);
    if (voice) speak('Cardio complete. Well done!', 'کارڈیو مکمل۔ شاباش!', lang);
    const min = Math.max(1, Math.round((Date.now() - startedAt.current) / 60_000));
    await onFinish(Math.min(min, session.totalMin));
  };

  useEffect(() => {
    if (finished || pausedLeft != null) return;
    if (left <= 3 && left > 0 && lastBeep.current !== left) {
      lastBeep.current = left;
      beep();
    }
    if (left === 0) {
      lastBeep.current = null;
      beep(true);
      if (next) {
        setIdx((i) => i + 1);
        setEndAt(Date.now() + next.min * 60_000);
      } else void finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  const togglePause = () => {
    if (pausedLeft == null) setPausedLeft(leftMs);
    else {
      setEndAt(Date.now() + pausedLeft);
      setNow(Date.now());
      setPausedLeft(null);
    }
  };
  const skip = () => {
    if (next) {
      setIdx((i) => i + 1);
      setEndAt(Date.now() + next.min * 60_000);
      setNow(Date.now());
      setPausedLeft(null);
    } else void finish();
  };
  const toggleVoice = () => {
    const v = !voice;
    setVoice(v);
    if (!v) stopSpeaking();
    try {
      localStorage.setItem(VOICE_KEY, v ? 'on' : 'off');
    } catch {
      /* private mode */
    }
  };

  return (
    <div className="player" role="dialog" aria-modal="true" aria-label={session.title}>
      <header className="player-top">
        <button type="button" className="player-icon" onClick={onClose} aria-label={t('Exit')}>
          ✕
        </button>
        <div className="player-title">
          <strong>{t(session.machine === 'treadmill' ? 'Treadmill' : 'Elliptical')}</strong>
          <span>
            {idx + 1} / {steps.length}
          </span>
        </div>
        <button type="button" className="player-icon" onClick={toggleVoice} aria-pressed={voice} aria-label={t('Voice')}>
          {voice ? '🔊' : '🔇'}
        </button>
      </header>
      <div className="player-bar" aria-hidden>
        <span style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }} />
      </div>

      {finished ? (
        <section className="player-main player-done">
          <div className="player-emoji" aria-hidden>
            🎉
          </div>
          <h2>{t('Cardio complete')}</h2>
          <p className="muted">{t('Logged. Drink some water.')}</p>
          <button type="button" className="btn btn-primary player-cta" onClick={onClose}>
            {t('Done')}
          </button>
        </section>
      ) : (
        <section className="player-main cardio-live">
          <span className="player-kicker">{t(step.label)}</span>
          <div className="cardio-set" aria-live="polite">
            {settingText(step).replace('Level', t('Level'))}
          </div>
          <div className="player-clock">{formatClock(left)}</div>
          <p className="muted cardio-feel">{t(step.feel)}</p>
          {next && (
            <div className="cardio-next">
              <span className="player-kicker">{t('Up next')}</span>
              <strong>
                {t(next.label)} · {settingText(next).replace('Level', t('Level'))} · {next.min} min
              </strong>
            </div>
          )}
          <div className="player-row">
            <button type="button" className="btn" onClick={togglePause}>
              {pausedLeft == null ? t('Pause') : t('Resume')}
            </button>
            <button type="button" className="btn btn-primary" onClick={skip}>
              {next ? t('Next part') : t('Finish')}
            </button>
          </div>
          <p className="cardio-stop">{t(STOP_SIGNS)}</p>
        </section>
      )}
    </div>
  );
}
