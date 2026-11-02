// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { AppStateProvider } from './context/AppStateProvider';
import { useAppState } from './context/appContext';
import AlertDetailPage from './pages/AlertDetailPage';
import AlertPage from './pages/AlertPage';
import ContactsPage from './pages/ContactsPage';
import EmergencyGuidePage from './pages/EmergencyGuidePage';
import HistoryPage from './pages/HistoryPage';
import HomePage from './pages/HomePage';
import LocationPage from './pages/LocationPage';
import SettingsPage from './pages/SettingsPage';
import { requestLocationPermissionOnNative } from './services/locationService';
import WelcomePage from './pages/WelcomePage';

setupIonicReact({ mode: 'md' });

function Routes() {
  const { data, setLocationPermission } = useAppState();

  // En Android/iOS se pide el permiso de ubicación al abrir la app para tenerlo listo antes de una alerta.
  useEffect(() => {
    requestLocationPermissionOnNative().then((p) => {
      if (p) setLocationPermission(p);
    });
  }, [setLocationPermission]);

  return (
    <IonRouterOutlet>
      <Route exact path="/bienvenida" component={WelcomePage} />
      <Route exact path="/inicio" component={HomePage} />
      <Route exact path="/alerta" component={AlertPage} />
      <Route exact path="/ubicacion" component={LocationPage} />
      <Route exact path="/contactos" component={ContactsPage} />
      <Route exact path="/historial" component={HistoryPage} />
      <Route exact path="/historial/:id" component={AlertDetailPage} />
      <Route exact path="/guia" component={EmergencyGuidePage} />
      <Route exact path="/configuracion" component={SettingsPage} />
      <Route exact path="/">
        <Redirect to={data.settings.onboarded ? '/inicio' : '/bienvenida'} />
      </Route>
    </IonRouterOutlet>
  );
}

export default function App() {
  return (
    <IonApp>
      <AppStateProvider>
        <IonReactRouter>
          <Routes />
        </IonReactRouter>
      </AppStateProvider>
    </IonApp>
  );
}
