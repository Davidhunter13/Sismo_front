// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonLabel, IonSegment, IonSegmentButton, useIonRouter, useIonToast } from '@ionic/react';
import { BarChart3, ClipboardCheck, Download, Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { alertsToCsv, formatMs, metricLabels, metricValue, summarize, type MetricKey } from '../services/metricsService';
import { isNative, SismoNative } from '../services/nativeBridge';
import { susGrade, susToCsv } from '../services/susService';

type Filter = 'todas' | 'reales' | 'simulacros';
const METRICS: MetricKey[] = ['decision', 'siren', 'torch', 'vibration', 'sms', 'drillReaction'];

/** Métricas de validación del prototipo, calculadas solo con alertas reales del dispositivo (sin datos de ejemplo). */
export default function StatsPage() {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const { data } = useAppState();
  const t = useT().stats;
  const [filter, setFilter] = useState<Filter>('todas');

  const alerts = useMemo(
    () => data.alerts
      .filter((a) => !a.isSeed)
      .filter((a) => (filter === 'reales' ? !a.isDrill : filter === 'simulacros' ? !!a.isDrill : true)),
    [data.alerts, filter],
  );

  const smsCount = alerts.filter((a) => a.digitalStatus === 'sms_abierto').length;
  const withLocation = alerts.filter((a) => a.location?.source === 'dispositivo').length;
  const pct = (n: number) => (alerts.length ? `${Math.round((n / alerts.length) * 100)} %` : '—');

  const sus = summarize(data.susResponses.map((r) => r.score));

  const exportCsv = (kind: 'metricas' | 'sus') =>
    exportFile(`sismo-${kind}-${new Date().toISOString().slice(0, 10)}.csv`, kind === 'sus' ? susToCsv(data.susResponses) : alertsToCsv(alerts));

  const exportFile = async (filename: string, csv: string) => {
    try {
      if (isNative()) {
        await SismoNative.shareCsv({ filename, content: csv });
      } else {
        // BOM para que Excel reconozca UTF-8 (tildes).
        const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      presentToast({ message: t.exportError, duration: 2500, color: 'warning', position: 'top' });
    }
  };

  return (
    <AppLayout title={t.title} backTo="/inicio">
      <IonSegment value={filter} onIonChange={(e) => setFilter(e.detail.value as Filter)} className="segment">
        <IonSegmentButton value="todas"><IonLabel>{t.filterAll}</IonLabel></IonSegmentButton>
        <IonSegmentButton value="reales"><IonLabel>{t.filterReal}</IonLabel></IonSegmentButton>
        <IonSegmentButton value="simulacros"><IonLabel>{t.filterDrills}</IonLabel></IonSegmentButton>
      </IonSegment>

      <section className="stat-grid">
        <div className="card stat-tile"><span>{t.alerts}</span><strong>{alerts.length}</strong></div>
        <div className="card stat-tile"><span>{t.withSms}</span><strong>{pct(smsCount)}</strong></div>
        <div className="card stat-tile"><span>{t.withLocation}</span><strong>{pct(withLocation)}</strong></div>
      </section>

      <section className="card">
        <h2 className="card__title"><BarChart3 size={18} aria-hidden="true" /> {t.timesTitle}</h2>
        {alerts.length === 0 ? (
          <p className="muted small">{t.noAlerts}</p>
        ) : (
          <div className="table-wrap">
            <table className="stat-table">
              <thead>
                <tr><th>{t.colMetric}</th><th>n</th><th>{t.colMedian}</th><th>{t.colMean}</th><th>{t.colMax}</th></tr>
              </thead>
              <tbody>
                {METRICS.map((k) => {
                  const s = summarize(alerts.map((a) => metricValue(a, k)).filter((v): v is number => v != null));
                  return (
                    <tr key={k}>
                      <th scope="row">{metricLabels[k]}</th>
                      <td>{s.count}</td>
                      <td>{formatMs(s.median)}</td>
                      <td>{formatMs(s.mean)}</td>
                      <td>{formatMs(s.max)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <button className="btn btn--primary btn--block" onClick={() => void exportCsv('metricas')} disabled={alerts.length === 0}>
        <Download size={18} aria-hidden="true" /> {t.exportCsv}
      </button>

      <section className="card stack">
        <h2 className="card__title"><ClipboardCheck size={18} aria-hidden="true" /> {t.susTitle}</h2>
        {sus.count === 0 ? (
          <p className="muted small">{t.susEmpty}</p>
        ) : (
          <p className="small">
            <strong>{sus.count}</strong>{t.susResponses}<strong>{sus.mean?.toFixed(1)}</strong> ({susGrade(sus.mean ?? 0)})
            {t.susMedian(sus.median?.toFixed(1) ?? '')}
          </p>
        )}
        <div className="btn-pair">
          <button className="btn btn--outline" onClick={() => router.push('/encuesta', 'forward')}>{t.answerSurvey}</button>
          <button className="btn btn--outline" onClick={() => void exportCsv('sus')} disabled={sus.count === 0}>
            <Download size={16} aria-hidden="true" /> {t.susCsv}
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="card__title"><Info size={18} aria-hidden="true" /> {t.howTitle}</h2>
        <ul className="bullets">
          {t.how.map((h) => <li key={h.term}><strong>{h.term}</strong>{h.text}</li>)}
          <li>{t.howNote}</li>
        </ul>
      </section>
    </AppLayout>
  );
}
