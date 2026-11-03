// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Capacitor } from '@capacitor/core';
import { IonApp, IonRouterOutlet, setupIonicReact, useIonRouter } from '@ionic/react';
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
import { FallDetector } from './components/FallDetector';
import { useLocationAutoRefresh } from './components/useLocationAutoRefresh';
import KitPage from './pages/KitPage';
import MedicalPage from './pages/MedicalPage';
import PostQuakePage from './pages/PostQuakePage';
import SurveyPage from './pages/SurveyPage';
import QuakesPage from './pages/QuakesPage';
import SettingsPage from './pages/SettingsPage';
import SetupPage from './pages/SetupPage';
import DrillPage from './pages/DrillPage';
import StatsPage from './pages/StatsPage';
import { requestLocationPermissionOnNative } from './services/locationService';
import { SismoNative } from './services/nativeBridge';
import { requestSosDialog } from './services/sosRequestService';
import { goToRoot } from './utils/navigation';
import WelcomePage from './pages/WelcomePage';

setupIonicReact({ mode: 'md' });

function Routes() {
  const router = useIonRouter();
  const { data, setLocationPermission } = useAppState();
  useLocationAutoRefresh();

  // En Android se piden los permisos al abrir la app (ubicación y luego notificaciones, para mostrar la
  // alerta activa con la pantalla bloqueada), uno tras otro porque el sistema solo muestra un diálogo a la vez.
  // La linterna nativa no necesita permiso de cámara.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    (async () => {
      const p = await requestLocationPermissionOnNative();
      if (p) setLocationPermission(p);
      await SismoNative.requestNotifications().catch(() => undefined);
    })();
  }, [setLocationPermission]);

  // Acceso rápido: abre el diálogo de SOS en Inicio. Widget (doble toque): activa la alerta sin diálogo.
  // También sin registro terminado: en una emergencia el SOS no se bloquea.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const openSos = (immediate: boolean) => {
      goToRoot(router, '/inicio');
      requestSosDialog(immediate);
    };
    void SismoNative.consumeLaunchAction()
      .then(({ action }) => action && openSos(action === 'sos_now'))
      .catch(() => undefined);
    const handle = SismoNative.addListener('sosRequested', (d) => openSos(d.immediate === true));
    return () => {
      void handle.then((h) => h.remove());
    };
  }, [router]);

  return (
    <>
      <FallDetector />
      <IonRouterOutlet>
        <Route exact path="/bienvenida" component={WelcomePage} />
        <Route exact path="/registro" component={SetupPage} />
        <Route exact path="/inicio" component={HomePage} />
        <Route exact path="/alerta" component={AlertPage} />
        <Route exact path="/ubicacion" component={LocationPage} />
        <Route exact path="/contactos" component={ContactsPage} />
        <Route exact path="/historial" component={HistoryPage} />
        <Route exact path="/historial/:id" component={AlertDetailPage} />
        <Route exact path="/guia" component={EmergencyGuidePage} />
        <Route exact path="/configuracion" component={SettingsPage} />
        <Route exact path="/estadisticas" component={StatsPage} />
        <Route exact path="/simulacro" component={DrillPage} />
        <Route exact path="/sismos" component={QuakesPage} />
        <Route exact path="/ficha-medica" component={MedicalPage} />
        <Route exact path="/encuesta" component={SurveyPage} />
        <Route exact path="/mochila" component={KitPage} />
        <Route exact path="/despues-del-sismo" component={PostQuakePage} />
        <Route exact path="/">
          <Redirect to={data.settings.onboarded ? '/inicio' : '/bienvenida'} />
        </Route>
      </IonRouterOutlet>
    </>
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
