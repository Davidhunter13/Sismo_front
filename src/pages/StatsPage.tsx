// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonLabel, IonSegment, IonSegmentButton, useIonToast } from '@ionic/react';
import { BarChart3, Download, Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useAppState } from '../context/appContext';
import { alertsToCsv, formatMs, metricLabels, metricValue, summarize, type MetricKey } from '../services/metricsService';
import { isNative, SismoNative } from '../services/nativeBridge';

type Filter = 'todas' | 'reales' | 'simulacros';
const METRICS: MetricKey[] = ['decision', 'siren', 'torch', 'vibration', 'sms', 'drillReaction'];

/** Métricas de validación del prototipo, calculadas solo con alertas reales del dispositivo (sin datos de ejemplo). */
export default function StatsPage() {
  const [presentToast] = useIonToast();
  const { data } = useAppState();
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

  const exportCsv = async () => {
    const csv = alertsToCsv(alerts);
    const filename = `sismo-metricas-${new Date().toISOString().slice(0, 10)}.csv`;
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
      presentToast({ message: 'No se pudo exportar el archivo.', duration: 2500, color: 'warning', position: 'top' });
    }
  };

  return (
    <AppLayout title="Estadísticas" backTo="/inicio">
      <IonSegment value={filter} onIonChange={(e) => setFilter(e.detail.value as Filter)} className="segment">
        <IonSegmentButton value="todas"><IonLabel>Todas</IonLabel></IonSegmentButton>
        <IonSegmentButton value="reales"><IonLabel>Reales</IonLabel></IonSegmentButton>
        <IonSegmentButton value="simulacros"><IonLabel>Simulacros</IonLabel></IonSegmentButton>
      </IonSegment>

      <section className="stat-grid">
        <div className="card stat-tile"><span>Alertas</span><strong>{alerts.length}</strong></div>
        <div className="card stat-tile"><span>Con SMS abierto</span><strong>{pct(smsCount)}</strong></div>
        <div className="card stat-tile"><span>Con ubicación real</span><strong>{pct(withLocation)}</strong></div>
      </section>

      <section className="card">
        <h2 className="card__title"><BarChart3 size={18} aria-hidden="true" /> Tiempos de respuesta</h2>
        {alerts.length === 0 ? (
          <p className="muted small">Aún no hay alertas registradas en este filtro. Haga un simulacro para empezar a medir.</p>
        ) : (
          <div className="table-wrap">
            <table className="stat-table">
              <thead>
                <tr><th>Métrica</th><th>n</th><th>Mediana</th><th>Promedio</th><th>Máx.</th></tr>
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

      <button className="btn btn--primary btn--block" onClick={exportCsv} disabled={alerts.length === 0}>
        <Download size={18} aria-hidden="true" /> Exportar CSV
      </button>

      <section className="card">
        <h2 className="card__title"><Info size={18} aria-hidden="true" /> Cómo se mide</h2>
        <ul className="bullets">
          <li><strong>SOS → confirmación:</strong> desde que se toca SOS hasta que se confirma el tipo de evento.</li>
          <li><strong>Confirmación → sirena / linterna / vibración:</strong> tiempo que tarda cada señal en encenderse.</li>
          <li><strong>Confirmación → SMS abierto:</strong> hasta que se abre la app de mensajes (no confirma el envío).</li>
          <li><strong>Señal del simulacro → confirmación:</strong> tiempo de reacción en los simulacros.</li>
          <li>No incluye los datos de ejemplo del modo de demostración. El CSV no contiene nombres, contactos ni coordenadas.</li>
        </ul>
      </section>
    </AppLayout>
  );
}
