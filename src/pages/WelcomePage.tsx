// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonContent, IonLabel, IonPage, IonSegment, IonSegmentButton, IonToggle, useIonRouter } from '@ionic/react';
import { ArrowRight, BellRing, Info, MapPin, Users } from 'lucide-react';
import { useState } from 'react';
import { SismoLogo } from '../components/SismoLogo';
import { useAppState } from '../context/appContext';
import { LANGS, type Lang } from '../i18n';
import { useT } from '../i18n/useT';

const features = [
  { icon: BellRing, key: 'alert' },
  { icon: MapPin, key: 'location' },
  { icon: Users, key: 'contacts' },
] as const;

export default function WelcomePage() {
  const router = useIonRouter();
  const { data, updateSettings, setDemoMode } = useAppState();
  const { common: tc, welcome: t } = useT();
  const [loadDemo, setLoadDemo] = useState(true);

  const start = () => {
    if (loadDemo && !data.settings.demoMode) setDemoMode(true);
    updateSettings({ onboarded: true });
    router.push('/inicio', 'root', 'replace');
  };

  return (
    <IonPage>
      <IonContent className="welcome">
        <main className="welcome__inner">
          <div className="welcome__hero">
            <SismoLogo size={88} />
            <h1>SISMO</h1>
            <p className="welcome__tagline">{t.tagline}</p>
          </div>

          <ul className="welcome__features">
            {features.map(({ icon: Icon, key }) => (
              <li key={key}><span><Icon size={20} aria-hidden="true" /></span>{t.features[key]}</li>
            ))}
          </ul>

          <div className="callout callout--info">
            <Info size={20} aria-hidden="true" />
            <p>
              {t.disclaimerPre}<strong>{t.disclaimerTool}</strong>{t.disclaimerMid}<strong>{t.disclaimerLine}</strong>{t.disclaimerPost}
            </p>
          </div>

          <div className="card stack">
            <strong>{tc.language.title} · Language</strong>
            <IonSegment
              value={data.settings.language}
              onIonChange={(e) => updateSettings({ language: e.detail.value as Lang })}
              className="segment"
              aria-label={tc.language.title}
            >
              {LANGS.map((l) => <IonSegmentButton key={l.value} value={l.value}><IonLabel>{l.label}</IonLabel></IonSegmentButton>)}
            </IonSegment>
          </div>

          <div className="card toggle-row">
            <span>
              <strong>{t.demoTitle}</strong>
              <small>{t.demoHint}</small>
            </span>
            <IonToggle checked={loadDemo} onIonChange={(e) => setLoadDemo(e.detail.checked)} aria-label={t.demoToggle} />
          </div>

          <button className="btn btn--primary btn--lg btn--block" onClick={start}>
            {t.start} <ArrowRight size={20} aria-hidden="true" />
          </button>
          <p className="welcome__foot">{t.foot}</p>
        </main>
      </IonContent>
    </IonPage>
  );
}
