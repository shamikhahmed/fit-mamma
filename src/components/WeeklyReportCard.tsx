import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import * as repo from '../data/repository';
import { addLocalCalendarDays, parseLocalDate, toLocalISODate } from '../lib/dates';
import { buildWeeklyReport, reportDue, reportWeek, type WeeklyReport } from '../lib/weeklyReport';
import { useAppStore } from '../store/useAppStore';
import { useT } from '../i18n/useT';

interface Props {
  /** Today: only Sun–Tue until dismissed. Progress: always the last closed week. */
  mode: 'today' | 'progress';
}

const VERDICT: Record<WeeklyReport['verdict'], string> = {
  ahead: 'Ahead of the line',
  'on-line': 'On the line',
  behind: 'Above the line',
  'no-weight': 'No weigh-ins',
};

export function WeeklyReportCard({ mode }: Props) {
  const t = useT();
  const settings = useAppStore((s) => s.settings);
  const refreshSettings = useAppStore((s) => s.refreshSettings);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const today = toLocalISODate();
  const due = settings
    ? mode === 'progress'
      ? reportWeek(today).weekEnd >= settings.startDate
      : reportDue(today, settings)
    : false;

  useEffect(() => {
    if (!settings || !due) return;
    let cancelled = false;
    void (async () => {
      const week = reportWeek(today);
      const days = await repo.loadAggregatesInRange(addLocalCalendarDays(week.weekStart, -7), week.weekEnd);
      if (!cancelled) setReport(buildWeeklyReport(days, settings, week));
    })();
    return () => {
      cancelled = true;
    };
  }, [settings, due, today]);

  if (!settings || !due || !report) return null;

  const dismiss = async () => {
    await repo.updateSettings({ weeklyReportSeen: report.weekEnd });
    await refreshSettings();
  };

  return (
    <section className="panel stack weekly-report" aria-labelledby={`report-${mode}`}>
      <div className="section-head">
        <div>
          <h2 id={`report-${mode}`} style={{ fontSize: 'var(--text-lg)' }}>
            {report.planWeek > 0 ? `${t('Weekly report')} · ${report.planWeek}` : t('Weekly report')}
          </h2>
          <p className="muted" style={{ margin: 0, fontSize: 'var(--text-footnote)' }}>
            {format(parseLocalDate(report.weekStart), 'd MMM')} → {format(parseLocalDate(report.weekEnd), 'd MMM')}
          </p>
        </div>
        <span className={`report-verdict ${report.verdict}`}>{t(VERDICT[report.verdict])}</span>
      </div>
      {report.avgWeightKg != null && (
        <p className="muted" style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
          7-day average <strong>{report.avgWeightKg} kg</strong> vs plan line {report.lineKg} kg.
        </p>
      )}
      <div className="report-rows">
        {report.rows.map((r) => (
          <div key={r.id} className="report-row">
            <span className="label">{t(r.label)}</span>
            <strong>{r.value}</strong>
            <span className={`report-trend ${r.trend ?? ''}`}>
              {r.previous != null ? `${r.trend === 'better' ? '▲' : r.trend === 'worse' ? '▼' : '='} ${r.previous}` : ''}
            </span>
          </div>
        ))}
      </div>
      {report.wins.length > 0 && (
        <ul className="briefing-list">
          {report.wins.map((w) => (
            <li key={w}>✓ {w}</li>
          ))}
        </ul>
      )}
      <div className="report-fix">
        <span className="label">{t('Fix next week')}</span>
        <p style={{ margin: '4px 0 0' }}>{report.fix}</p>
      </div>
      {mode === 'today' && (
        <div className="report-actions">
          <button type="button" className="btn btn-primary" onClick={() => void dismiss()}>
            {t('Got it')}
          </button>
        </div>
      )}
      <p className="dim" style={{ margin: 0, fontSize: 'var(--text-caption)' }}>
        Arrows compare with the week before. Built from logged days only.
      </p>
    </section>
  );
}
