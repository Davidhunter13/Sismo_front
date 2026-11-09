// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Capacitor } from '@capacitor/core';
import { RequestOverlay, SplashScreen } from './components/AppLoader';
import { IonApp, IonRouterOutlet, setupIonicReact, useIonRouter } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { AppStateProvider } from './context/AppStateProvider';
import { useAppState } from './context/appContext';
import AlertDetailPage from './pages/AlertDetailPage';
import AlertPage from './pages/AlertPage';
import BadgesPage from './pages/BadgesPage';
import { AccountGoneGuard } from './components/AccountGoneGuard';
import { BadgeCelebration } from './components/BadgeCelebration';
import ContactsPage from './pages/ContactsPage';
import EmergencyGuidePage from './pages/EmergencyGuidePage';
import HistoryPage from './pages/HistoryPage';
import HomePage from './pages/HomePage';
import LocationPage from './pages/LocationPage';
import { FallDetector } from './components/FallDetector';
import { UpdateNotice } from './components/UpdateNotice';
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
  // Si la app se ABRE con esa acción, se lee antes de elegir la primera pantalla: antes, sin registro, la
  // redirección a la bienvenida le ganaba a la navegación a Inicio y la alerta no se mostraba (visto en emulador).
  const [launch, setLaunch] = useState<'pendiente' | 'sos' | 'sos_now' | null>(Capacitor.isNativePlatform() ? 'pendiente' : null);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void SismoNative.consumeLaunchAction()
      .then(({ action }) => {
        if (action) requestSosDialog(action === 'sos_now'); // queda pendiente hasta que Inicio se monte
        setLaunch(action);
      })
      .catch(() => setLaunch(null));
  }, []);

  // Con la app ya abierta (widget o acceso rápido en segundo plano).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handle = SismoNative.addListener('sosRequested', (d) => {
      goToRoot(router, '/inicio');
      requestSosDialog(d.immediate === true);
    });
    return () => {
      void handle.then((h) => h.remove());
    };
  }, [router]);

  // Mientras se lee la acción de arranque (milisegundos) no se dibuja nada: la pantalla de inicio de Android la cubre.
  if (launch === 'pendiente') return null;

  // Pantalla de carga solo en un arranque normal: si la app se abre para una alerta (widget, acceso rápido,
  // alerta activa o ruta de alerta) no se muestra, para no tapar el SOS ni un segundo.
  const skipSplash = launch !== null || data.activeAlertId !== null || window.location.pathname.startsWith('/alerta');

  return (
    <>
      <SplashScreen skip={skipSplash} />
      <RequestOverlay />
      <FallDetector />
      {/* «¡Ganaste una insignia!»: nunca durante una alerta o un simulacro (queda en cola). */}
      <BadgeCelebration />
      {/* Aviso de actualización (solo Android): tampoco aparece durante una alerta o un simulacro. */}
      <UpdateNotice />
      {/* Cuenta borrada en el servidor: vuelve al registro (nunca durante una alerta o un simulacro). */}
      <AccountGoneGuard />
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
        <Route exact path="/insignias" component={BadgesPage} />
        <Route exact path="/">
          <Redirect to={launch || data.settings.onboarded ? '/inicio' : '/bienvenida'} />
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
