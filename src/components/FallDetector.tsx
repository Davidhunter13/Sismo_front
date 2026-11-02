// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter } from '@ionic/react';
import { AlertTriangle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppState } from '../context/appContext';
import { FALL_COUNTDOWN_S, watchForFalls } from '../services/fallDetectionService';
import { beginTrace, mark } from '../services/metricsService';
import { startAlertSignals } from '../services/signalsService';
import { playWhistleBurst } from '../services/sirenService';
import { startVibration, stopVibration } from '../services/vibrationService';

/**
 * Si «Detección de caídas» está activa y no hay alerta en curso, escucha el acelerómetro. Ante una caída
 * o impacto fuerte pregunta «¿Está bien?» con cuenta regresiva; si nadie responde, activa la alerta.
 */
export function FallDetector() {
  const router = useIonRouter();
  const { data, activeAlert, activateAlert } = useAppState();
  const { settings } = data;
  const [remaining, setRemaining] = useState<number | null>(null);
  const triggered = useRef(false);

  const enabled = settings.fallDetection && settings.onboarded && !activeAlert;

  useEffect(() => {
    if (!enabled) return;
    return watchForFalls(() => {
      triggered.current = false;
      setRemaining(FALL_COUNTDOWN_S);
      void startVibration();
      void playWhistleBurst();
    });
  }, [enabled]);

  const dismiss = useCallback(() => {
    setRemaining(null);
    stopVibration();
  }, []);

  const raiseAlert = useCallback(() => {
    if (triggered.current) return;
    triggered.current = true;
    stopVibration();
    setRemaining(null);
    beginTrace();
    mark('confirmedAt');
    startAlertSignals(settings);
    activateAlert('emergencia_general', 'deteccion_automatica');
    router.push('/alerta', 'forward');
  }, [activateAlert, router, settings]);

  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) {
      raiseAlert();
      return;
    }
    const t = window.setTimeout(() => setRemaining((r) => (r === null ? r : r - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [remaining, raiseAlert]);

  if (remaining === null) return null;

  return (
    <div className="fall-overlay" role="alertdialog" aria-modal="true" aria-labelledby="fall-title" aria-describedby="fall-desc">
      <div className="fall-dialog">
        <AlertTriangle size={44} aria-hidden="true" />
        <h2 id="fall-title">¿Está bien?</h2>
        <p id="fall-desc">Detectamos una caída o un impacto fuerte. Si no responde, se activará la alerta en</p>
        <strong className="fall-count" aria-live="assertive">{remaining} s</strong>
        <button className="btn btn--success btn--lg btn--block" onClick={dismiss}>Estoy bien</button>
        <button className="btn btn--danger btn--block" onClick={raiseAlert}>Pedir ayuda ahora</button>
      </div>
    </div>
  );
}
