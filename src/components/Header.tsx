// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonHeader, IonToolbar, useIonRouter } from '@ionic/react';
import { ArrowLeft, FlaskConical, Settings } from 'lucide-react';
import { useAppState } from '../context/appContext';
import { SismoLogo } from './SismoLogo';

interface HeaderProps {
  title?: string;
  backTo?: string;
  showSettings?: boolean;
}

export function Header({ title, backTo, showSettings = true }: HeaderProps) {
  const router = useIonRouter();
  const { data } = useAppState();

  return (
    <IonHeader className="app-header ion-no-border">
      <IonToolbar>
        <div className="app-header__bar">
          {backTo ? (
            <button
              className="icon-btn"
              // Vistas apiladas (configuración, detalle, alerta) regresan; las de la barra inferior van a backTo.
              onClick={() => (router.canGoBack() ? router.goBack() : router.push(backTo, 'root', 'replace'))}
              aria-label={router.canGoBack() || backTo !== '/inicio' ? 'Volver' : 'Volver al inicio'}
            >
              <ArrowLeft size={22} />
            </button>
          ) : (
            <SismoLogo size={34} />
          )}
          <div className="app-header__title">
            <span className="app-header__brand">SISMO</span>
            {title && <span className="app-header__subtitle">{title}</span>}
          </div>
          {data.settings.demoMode && (
            <span className="demo-chip" title="Los datos mostrados son ficticios">
              <FlaskConical size={13} aria-hidden="true" /> Modo demo
            </span>
          )}
          {showSettings && (
            <button className="icon-btn" onClick={() => router.push('/configuracion', 'forward')} aria-label="Configuración">
              <Settings size={22} />
            </button>
          )}
        </div>
      </IonToolbar>
    </IonHeader>
  );
}
