// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonLabel, IonSegment, IonSegmentButton, useIonViewDidEnter } from '@ionic/react';
import { Landmark } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { EmergencyInstructionCard } from '../components/EmergencyInstructionCard';
import { catalogIcon } from '../components/catalogIcons';
import { getLang } from '../i18n';
import { useT } from '../i18n/useT';
import { MOMENTS, text, useCatalogs, type Moment } from '../services/catalogService';
import { recordAction } from '../services/badgeService';
import { isSpeechSupported, speak, stopSpeaking } from '../services/speechService';

/** Guía de emergencia: tarjetas, introducciones y aviso vienen del catálogo administrable (con copia local sin red). */
const moments = MOMENTS;

export default function EmergencyGuidePage() {
  const t = useT().guide;
  const [moment, setMoment] = useState<Moment>('durante');
  const [speaking, setSpeaking] = useState<string | null>(null);
  const guide = useCatalogs().guide;
  const lang = getLang();
  const cards = guide.cards.filter((c) => c.moment === moment).map((c) => ({
    title: text(c.title, lang),
    steps: (lang === 'en' ? c.steps.en : c.steps.es).map((st) => text({ es: st, en: st }, lang)),
    icon: catalogIcon(c.icon),
  }));

  // Insignias: cuenta cada SECCIÓN de la guía leída (antes, durante, después), al entrar y al cambiar de pestaña.
  // La insignia «Antes, durante y después» pide las 3 secciones distintas.
  const recordSection = () => recordAction('ver_guia', { elemento: moment });
  useIonViewDidEnter(recordSection);
  useEffect(recordSection, [moment]);

  // Al salir de la página o cambiar de pestaña se detiene la lectura.
  useEffect(() => stopSpeaking, []);

  const listen = async (title: string, steps: string[]) => {
    if (speaking === title) {
      stopSpeaking();
      setSpeaking(null);
      return;
    }
    const text = `${title}. ${steps.map((s, i) => t.step(i + 1, s)).join(' ')}`;
    setSpeaking(title);
    const ok = await speak(text, () => setSpeaking((s) => (s === title ? null : s)));
    if (!ok) setSpeaking(null);
  };

  const changeMoment = (m: Moment) => {
    stopSpeaking();
    setSpeaking(null);
    setMoment(m);
  };

  return (
    <AppLayout title={t.title} backTo="/inicio">
      <IonSegment value={moment} onIonChange={(e) => changeMoment(e.detail.value as Moment)} className="segment">
        {moments.map((m) => (
          <IonSegmentButton key={m} value={m}><IonLabel>{t.moments[m]}</IonLabel></IonSegmentButton>
        ))}
      </IonSegment>

      <p className="muted">{text(guide.intro[moment], lang)}</p>
      <div className="list">
        {cards.map((c) => (
          <EmergencyInstructionCard
            key={c.title}
            {...c}
            speaking={speaking === c.title}
            onListen={isSpeechSupported() ? () => void listen(c.title, c.steps) : undefined}
          />
        ))}
      </div>

      <div className="callout callout--info">
        <Landmark size={20} aria-hidden="true" />
        <p>{text(guide.disclaimer, lang)}</p>
      </div>
    </AppLayout>
  );
}
