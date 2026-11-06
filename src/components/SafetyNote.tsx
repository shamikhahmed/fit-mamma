import { safetyFor, SPOTTER_LABEL } from '../domain/exerciseSafety';
import { useT } from '../i18n/useT';
import './ExerciseMedia.css';

/** Spotter + starting weight for one exercise. */
export function SafetyNote({ name, compact = false }: { name: string; compact?: boolean }) {
  const t = useT();
  const s = safetyFor(name);
  return (
    <div className={`safe${compact ? ' safe-compact' : ''}`}>
      <div className="safe-row">
        <span className="safe-k">{t('Spotter')}</span>
        <span className={`safe-pill ${s.spotter}`}>{t(SPOTTER_LABEL[s.spotter])}</span>
      </div>
      {!compact && <p className="safe-note">{s.spotterNote}</p>}
      <div className="safe-row">
        <span className="safe-k">{t('Start with')}</span>
        <span className="safe-v">{s.start}</span>
      </div>
    </div>
  );
}
