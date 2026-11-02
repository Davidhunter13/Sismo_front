// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonFooter, useIonRouter } from '@ionic/react';
import { BookOpen, History, Home, MapPin, Users, type LucideIcon } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const items: { path: string; label: string; icon: LucideIcon }[] = [
  { path: '/inicio', label: 'Inicio', icon: Home },
  { path: '/ubicacion', label: 'Ubicación', icon: MapPin },
  { path: '/contactos', label: 'Contactos', icon: Users },
  { path: '/historial', label: 'Historial', icon: History },
  { path: '/guia', label: 'Guía', icon: BookOpen },
];

export function BottomNavigation() {
  const router = useIonRouter();
  const { pathname } = useLocation();

  return (
    <IonFooter className="bottom-nav ion-no-border">
      <nav aria-label="Navegación principal">
        {items.map(({ path, label, icon: Icon }) => {
          const active = pathname === path || pathname.startsWith(`${path}/`);
          return (
            <button
              key={path}
              className={`bottom-nav__item${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => !active && router.push(path, 'root', 'replace')}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </IonFooter>
  );
}
