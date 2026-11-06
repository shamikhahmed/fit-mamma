import { useState } from 'react';
import * as repo from '../data/repository';
import { parseProfile, suggestGoal, type ProfileInput } from '../domain/profileSetup';
import { toLocalISODate } from '../lib/dates';
import { useAppStore } from '../store/useAppStore';

/** First open: her numbers are typed here and stay on this phone only. */
export function ProfileSetup() {
  const refreshSettings = useAppStore((s) => s.refreshSettings);
  const refreshDay = useAppStore((s) => s.refreshDay);
  const [f, setF] = useState<ProfileInput>({ weightKg: '', goalKg: '', heightFt: '5', heightIn: '', birthYear: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof ProfileInput) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const fillGoal = () => {
    const w = Number(f.weightKg);
    if (!f.goalKg && Number.isFinite(w) && w > 35) {
      const ft = Number(f.heightFt);
      const cm = Number.isFinite(ft) && ft >= 4 ? (ft * 12 + (Number(f.heightIn) || 0)) * 2.54 : null;
      setF((p) => ({ ...p, goalKg: String(suggestGoal(w, cm)) }));
    }
  };

  const save = async () => {
    const v = parseProfile(f, new Date().getFullYear());
    if ('error' in v) {
      setError(v.error);
      return;
    }
    setBusy(true);
    try {
      await repo.updateSettings({ ...v, biologicalSex: 'female', profileSetupDone: true });
      await repo.upsertPrimaryWeight({
        date: toLocalISODate(),
        weightKg: v.startingWeightKg,
        isEstimate: false,
        enteredLate: false,
        source: 'manual',
      });
      await Promise.all([refreshSettings(), refreshDay()]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="setup-page">
      <section className="panel stack setup-card">
        <img src={`${import.meta.env.BASE_URL}apple-touch-icon.png`} alt="" width={72} height={72} className="setup-icon" />
        <h1>
          Welcome to FIT <span className="hero-brand-num">MAMMA</span>
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Four quick numbers to set your plan. They stay on this phone only. خوش آمدید
        </p>
        <label>
          <span className="label">Your weight today (kg)</span>
          <input className="input" inputMode="decimal" value={f.weightKg} onChange={set('weightKg')} onBlur={fillGoal} />
        </label>
        <div className="setup-row">
          <label>
            <span className="label">Height (feet)</span>
            <input className="input" inputMode="numeric" value={f.heightFt} onChange={set('heightFt')} />
          </label>
          <label>
            <span className="label">Inches</span>
            <input className="input" inputMode="numeric" value={f.heightIn} onChange={set('heightIn')} onBlur={fillGoal} />
          </label>
        </div>
        <label>
          <span className="label">Year you were born</span>
          <input className="input" inputMode="numeric" value={f.birthYear} onChange={set('birthYear')} />
        </label>
        <label>
          <span className="label">Goal weight by Eid (kg)</span>
          <input className="input" inputMode="decimal" value={f.goalKg} onChange={set('goalKg')} />
        </label>
        {error && (
          <p role="alert" style={{ margin: 0, color: 'var(--danger)' }}>
            {error}
          </p>
        )}
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void save()}>
          Start my plan
        </button>
        <p className="dim" style={{ margin: 0, fontSize: 'var(--text-caption)' }}>
          You can change these any time in Settings.
        </p>
      </section>
    </div>
  );
}
