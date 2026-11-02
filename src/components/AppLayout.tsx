// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonContent, IonPage } from '@ionic/react';
import type { ReactNode } from 'react';
import { BottomNavigation } from './BottomNavigation';
import { Header } from './Header';

interface AppLayoutProps {
  title?: string;
  backTo?: string;
  hideNav?: boolean;
  showSettings?: boolean;
  className?: string;
  children: ReactNode;
}

/** Estructura común: encabezado, contenido desplazable y navegación inferior. */
export function AppLayout({ title, backTo, hideNav, showSettings, className, children }: AppLayoutProps) {
  return (
    <IonPage className={className}>
      <Header title={title} backTo={backTo} showSettings={showSettings} />
      <IonContent className="app-content">
        <main className={`page${hideNav ? ' page--no-nav' : ''}`}>{children}</main>
      </IonContent>
      {!hideNav && <BottomNavigation />}
    </IonPage>
  );
}
