// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Mail } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { getBatteryLevel } from '../services/batteryService';
import { buildAlertEmail, EMAIL_COUNTDOWN_S, emailRecipients, sendAlertEmail } from '../services/emailService';
import type { AlertRecord, EmailStatus } from '../types';
import { StatusBadge, type BadgeTone } from './StatusBadge';

const tone: Record<EmailStatus | 'pendiente' | 'enviando', BadgeTone> = {
  pendiente: 'warning',
  enviando: 'info',
  enviado: 'success',
  cancelado: 'neutral',
  sin_servidor: 'neutral',
  sin_destinatarios: 'neutral',
  fallido: 'danger',
};

/**
 * Correo de alerta a los contactos. Al activar el SOS pregunta «¿Enviar correo a sus contactos?» con cuenta
 * regresiva de EMAIL_COUNTDOWN_S segundos: «Sí» o el silencio lo envían; «No» lo cancela. Se pregunta una
 * sola vez por alerta y nunca en simulacros. El envío lo hace el servidor (ver emailService.ts).
 */
export function AlertEmailCard({ alert }: { alert: AlertRecord }) {
  const t = useT().alert.email;
  const { data, setEmailStatus } = useAppState();
  const recipients = emailRecipients(data.contacts);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const sentRef = useRef(false);

  const asked = alert.emailStatus !== undefined;
  const shouldAsk = !asked && !alert.isDrill;

  const send = useCallback(async () => {
    if (sentRef.current) return;
    sentRef.current = true;
    setRemaining(null);
    setSending(true);
    const battery = await getBatteryLevel();
    const request = buildAlertEmail(alert, data.settings.userName, recipients, data.meetingPoints, data.medical, battery);
    const status = await sendAlertEmail(request);
    setSending(false);
    setEmailStatus(alert.id, status);
  }, [alert, data.settings.userName, data.meetingPoints, data.medical, recipients, setEmailStatus]);

  // Primera vez que se ve la alerta: sin destinatarios se registra sin preguntar; si hay, empieza la cuenta.
  useEffect(() => {
    if (!shouldAsk || remaining !== null || sentRef.current) return;
    if (recipients.length === 0) setEmailStatus(alert.id, 'sin_destinatarios');
    else setRemaining(EMAIL_COUNTDOWN_S);
  }, [shouldAsk, remaining, recipients.length, alert.id, setEmailStatus]);

  // La pantalla de alerta se redibuja cada segundo (reloj): si el temporizador dependiera de `send`
  // (que cambia en cada render) se reiniciaría antes de descontar. Se usa la versión más reciente por ref.
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) {
      void sendRef.current();
      return;
    }
    const timer = window.setTimeout(() => setRemaining((r) => (r === null ? r : r - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  const cancel = () => {
    setRemaining(null);
    setEmailStatus(alert.id, 'cancelado');
  };

  const retry = () => {
    sentRef.current = false;
    void send();
  };

  if (alert.isDrill) return null;
  const key: EmailStatus | 'pendiente' | 'enviando' = sending ? 'enviando' : alert.emailStatus ?? 'pendiente';

  return (
    <>
      <div className="channel">
        <span className="channel__icon"><Mail size={20} aria-hidden="true" /></span>
        <div>
          <strong>{t.channel}</strong>
          <p className="small muted">{t.status[key]}</p>
        </div>
        <StatusBadge tone={tone[key]} label={t.badge[key]} />
      </div>
      {(alert.emailStatus === 'fallido' || alert.emailStatus === 'cancelado') && recipients.length > 0 && (
        <button className="btn btn--outline btn--block" onClick={retry} disabled={sending}>
          <Mail size={18} aria-hidden="true" /> {t.retry}
        </button>
      )}

      {remaining !== null && (
        <div className="fall-overlay" role="alertdialog" aria-modal="true" aria-labelledby="email-title" aria-describedby="email-desc">
          <div className="fall-dialog">
            <Mail size={44} aria-hidden="true" />
            <h2 id="email-title">{t.dialogTitle}</h2>
            <p id="email-desc">{t.dialogText(recipients.length)}</p>
            <strong className="fall-count" aria-live="polite">{t.countdown(remaining)}</strong>
            <button className="btn btn--primary btn--lg btn--block" onClick={() => void send()}>{t.yes}</button>
            <button className="btn btn--outline btn--block" onClick={cancel}>{t.no}</button>
          </div>
        </div>
      )}
    </>
  );
}
