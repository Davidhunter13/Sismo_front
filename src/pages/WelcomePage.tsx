// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonContent, IonPage, IonToggle, useIonRouter } from '@ionic/react';
import { ArrowRight, BellRing, Info, MapPin, Users } from 'lucide-react';
import { useState } from 'react';
import { SismoLogo } from '../components/SismoLogo';
import { useAppState } from '../context/appContext';

const features = [
  { icon: BellRing, text: 'Alerta local con señal sonora y visual' },
  { icon: MapPin, text: 'Ubicación del dispositivo, si usted la autoriza' },
  { icon: Users, text: 'Lista de contactos de confianza' },
];

export default function WelcomePage() {
  const router = useIonRouter();
  const { data, updateSettings, setDemoMode } = useAppState();
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
            <p className="welcome__tagline">Botón de pánico para emergencias sísmicas con alertas multicanal</p>
          </div>

          <ul className="welcome__features">
            {features.map(({ icon: Icon, text }) => (
              <li key={text}><span><Icon size={20} aria-hidden="true" /></span>{text}</li>
            ))}
          </ul>

          <div className="callout callout--info">
            <Info size={20} aria-hidden="true" />
            <p>
              SISMO es una <strong>herramienta complementaria</strong>. No sustituye a los servicios oficiales de
              emergencia: ante una emergencia comuníquese con la <strong>línea 123</strong>.
            </p>
          </div>

          <div className="card toggle-row">
            <span>
              <strong>Modo de demostración</strong>
              <small>Carga contactos e historial ficticios para explorar la app.</small>
            </span>
            <IonToggle checked={loadDemo} onIonChange={(e) => setLoadDemo(e.detail.checked)} aria-label="Cargar modo de demostración" />
          </div>

          <button className="btn btn--primary btn--lg btn--block" onClick={start}>
            Comenzar <ArrowRight size={20} aria-hidden="true" />
          </button>
          <p className="welcome__foot">Prototipo académico · Politécnico Grancolombiano</p>
        </main>
      </IonContent>
    </IonPage>
  );
}
