import { useT } from '../i18n/useT';
import { ramadanGuide } from '../domain/ramadan';

/** Today: Ramadan heads-up and daily sehri / iftar guide. Hidden outside Ramadan. */
export function RamadanCard({ date }: { date: string }) {
  const t = useT();
  const g = ramadanGuide(date);
  if (!g) return null;
  return (
    <section className="panel stack ramadan-card" aria-labelledby="ramadan-title">
      <div className="section-head">
        <h2 id="ramadan-title" style={{ fontSize: 'var(--text-lg)' }}>
          🌙 {g.title}
        </h2>
        {g.stage === 'fasting' && <span className="badge badge-accent">{t('Ramadan mode')}</span>}
      </div>
      <div className="ramadan-meals">
        <div>
          <span className="label">{t('Sehri')}</span>
          <ul className="briefing-list">
            {g.sehri.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <span className="label">{t('Iftar')}</span>
          <ul className="briefing-list">
            {g.iftar.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
      <p style={{ margin: 0 }}>
        <strong>{t('Exercise')}:</strong> {g.move}
      </p>
      <p className="dim" style={{ margin: 0, fontSize: 'var(--text-caption)' }}>
        Dates are approximate; the moon sighting decides. If you have a health condition, ask your doctor about fasting and exercise.
      </p>
    </section>
  );
}
