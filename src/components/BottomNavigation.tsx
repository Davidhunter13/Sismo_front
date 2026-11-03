// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonFooter, useIonRouter } from '@ionic/react';
import { BookOpen, History, Home, MapPin, Users, type LucideIcon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { goToRoot } from '../utils/navigation';

type NavKey = 'home' | 'location' | 'contacts' | 'history' | 'guide';

const items: { path: string; key: NavKey; icon: LucideIcon }[] = [
  { path: '/inicio', key: 'home', icon: Home },
  { path: '/ubicacion', key: 'location', icon: MapPin },
  { path: '/contactos', key: 'contacts', icon: Users },
  { path: '/historial', key: 'history', icon: History },
  { path: '/guia', key: 'guide', icon: BookOpen },
];

export function BottomNavigation() {
  const router = useIonRouter();
  const { pathname } = useLocation();
  const t = useT().common.nav;

  return (
    <IonFooter className="bottom-nav ion-no-border">
      <nav aria-label={t.main}>
        {items.map(({ path, key, icon: Icon }) => {
          const active = pathname === path || pathname.startsWith(`${path}/`);
          return (
            <button
              key={path}
              className={`bottom-nav__item${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => !active && goToRoot(router, path)}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
              <span>{t[key]}</span>
            </button>
          );
        })}
      </nav>
    </IonFooter>
  );
}
