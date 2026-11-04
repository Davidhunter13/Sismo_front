// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonHeader, IonToolbar, useIonRouter } from '@ionic/react';
import { DEMO_ENABLED } from '../utils/env';
import { ArrowLeft, FlaskConical, Moon, Settings, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { SismoLogo } from './SismoLogo';

interface HeaderProps {
  title?: string;
  backTo?: string;
  showSettings?: boolean;
  /** Elemento extra junto al botón de tema. */
  extra?: ReactNode;
}

export function Header({ title, backTo, showSettings = true, extra }: HeaderProps) {
  const router = useIonRouter();
  const { data, updateSettings } = useAppState();
  const t = useT().common.header;

  // Tema efectivo: con «Sistema» se lee la preferencia del teléfono.
  const systemDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const isDark = data.settings.theme === 'oscuro' || (data.settings.theme === 'sistema' && systemDark);
  const toggleTheme = () => updateSettings({ theme: isDark ? 'claro' : 'oscuro' });

  return (
    <IonHeader className="app-header ion-no-border">
      <IonToolbar>
        <div className="app-header__bar">
          {backTo ? (
            <button
              className="icon-btn"
              // Vistas apiladas (configuración, detalle, alerta) regresan; las de la barra inferior van a backTo.
              onClick={() => (router.canGoBack() ? router.goBack() : router.push(backTo, 'root', 'replace'))}
              aria-label={router.canGoBack() || backTo !== '/inicio' ? t.back : t.backHome}
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
          {DEMO_ENABLED && data.settings.demoMode && (
            <span className="demo-chip" title={t.demoHint}>
              <FlaskConical size={13} aria-hidden="true" /> {t.demo}
            </span>
          )}
          {extra}
          <button className="icon-btn" onClick={toggleTheme} aria-label={isDark ? t.themeToLight : t.themeToDark}>
            {isDark ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          {showSettings && (
            <button className="icon-btn" onClick={() => router.push('/configuracion', 'forward')} aria-label={t.settings}>
              <Settings size={22} />
            </button>
          )}
        </div>
      </IonToolbar>
    </IonHeader>
  );
}
