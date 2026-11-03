> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# SISMO — Botón de pánico para emergencias sísmicas

Prototipo académico (Politécnico Grancolombiano) de una app móvil de botón de pánico con alertas multicanal.
**Es una herramienta complementaria: no sustituye a la línea 123 ni a los servicios oficiales de emergencia.**

## Tecnologías

React 19 · TypeScript · Vite 6 · Ionic React 8 · React Router 5 · Lucide React · Capacitor 8 (core, android, geolocation) · LocalStorage · Playwright (pruebas y capturas)

## Requisitos

| Para | Necesita |
|---|---|
| Versión web | [Node.js](https://nodejs.org) 20 o superior (incluye npm) |
| App Android | Además: [Android Studio](https://developer.android.com/studio) con un SDK de Android (API 24 a 36) y un celular con depuración USB o un emulador |

## 1. Ejecutar en el navegador

```bash
npm install          # solo la primera vez o cuando cambie package.json
npm run dev          # abre http://localhost:5173
```

En Windows también puede hacer doble clic en `iniciar.cmd`.

Vite **no abre el navegador solo**: copie la URL que aparece en la terminal. Para que se abra automáticamente use `npm run dev -- --open`.
Si el puerto 5173 está ocupado, Vite usa otro (5174, 5175…); revise la URL impresa.

### Problemas comunes en Windows

| Error | Solución |
|---|---|
| `"npm" no se reconoce como un comando…` | Node.js no está en el PATH de esa terminal. Cierre **por completo** VS Code (todas las ventanas) y vuelva a abrirlo. Compruebe con `node -v`. Si sigue fallando, reinicie Windows. |
| `No se puede cargar el archivo …\npm.ps1 porque la ejecución de scripts está deshabilitada` | Use `npm.cmd` en lugar de `npm` (por ejemplo `npm.cmd run dev`), o permita scripts locales para su usuario: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`. En equipos corporativos la política puede estar fijada por TI; en ese caso use `npm.cmd`. |

## 2. Ejecutar en Android

El proyecto nativo ya está en la carpeta `android/`. Para pasar los cambios de la app web al celular:

```bash
npm run android      # compila la web, la copia a android/ y abre Android Studio
```

Luego, en Android Studio:

1. Espere a que termine la sincronización de Gradle (la primera vez tarda varios minutos).
2. Conecte el celular por USB con la **depuración USB** activada (Ajustes → Acerca del teléfono → toque 7 veces «Número de compilación» → Opciones de desarrollador → Depuración USB), o elija un emulador.
3. Seleccione el dispositivo arriba y presione ▶ **Run**.

> Cada vez que cambie código en `src/` debe volver a ejecutar `npm run android` (o `npm run build` + `npx cap sync android`). Android Studio no toma los cambios web por sí solo.

**Generar un APK para instalar o compartir:** en Android Studio, *Build → Build App Bundle(s) / APK(s) → Build APK(s)*. El archivo queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

**Si Android Studio no encuentra el SDK:** *File → Project Structure → SDK Location* y apunte a `C:\Users\<usuario>\AppData\Local\Android\Sdk`.

### Permisos de la app

Declarados en `android/app/src/main/AndroidManifest.xml`:

| Permiso | Para qué | Cuándo se pide |
|---|---|---|
| Ubicación (precisa y aproximada) | Adjuntar la posición a la alerta y actualizarla durante ella | Al abrir la app |
| Notificaciones (Android 13+) | Mostrar la alerta activa con la pantalla bloqueada y el botón «Silenciar sirena» | Al abrir la app, después del de ubicación |
| Servicio en primer plano, vibración y `WAKE_LOCK` | Mantener sirena, linterna, vibración y el modo atrapado con la pantalla bloqueada | No se pide (se concede al instalar) |

La linterna usa `CameraManager.setTorchMode`, que **no requiere permiso de cámara**. El SMS y la llamada al 123 no requieren permisos: SISMO abre la app de mensajes o el marcador. Importar un contacto usa el selector del sistema, que solo da acceso al contacto elegido (sin el permiso de leer toda la agenda).

### Funciones nativas (código propio en `android/app/src/main/java/co/edu/poli/sismo/`)

| Archivo | Qué hace |
|---|---|
| `AlertService.java` | Servicio en primer plano: sirena o silbato (AudioTrack, uso «alarma»), linterna en código SOS, vibración SOS y **modo atrapado** (ráfagas cada 3 min con WakeLock). Sigue con la pantalla bloqueada. Notificación con «Silenciar sonido» |
| `SismoNativePlugin.java` | Puente con la app web: señales, modo atrapado, brillo, pantalla encendida, batería, voz (TextToSpeech), selector de contactos, permiso de notificaciones, accesos SOS y exportar CSV |
| `SosTileService.java` | Acceso rápido «SOS SISMO» en el panel de ajustes rápidos |
| `SosWidgetProvider.java` | Widget SOS para la pantalla de inicio: logo circular de SISMO con etiqueta roja «SOS» encima (`res/layout/widget_sos.xml`) |

El widget y el acceso rápido **abren SISMO con el diálogo de SOS listo**; la alerta se confirma en la app para evitar activaciones accidentales.

- **Agregar el acceso rápido:** desliza dos veces desde arriba → lápiz (editar) → arrastra «SOS SISMO» a los activos.
- **Agregar el widget:** mantén pulsada la pantalla de inicio → Widgets → SISMO → arrastra «SOS».

### Ícono de la app

Las imágenes fuente están en `assets/` (`icon-only.png`, `icon-foreground.png`, `icon-background.png`, 1024×1024, basadas en `public/sismo-icon.svg`). Para regenerar los íconos de Android después de cambiarlas:

```bash
npx capacitor-assets generate --android
```

Si el celular sigue mostrando el ícono anterior, desinstale la app y vuelva a instalarla.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo web |
| `npm run build` | Verificación de TypeScript + compilación de producción en `dist/` |
| `npm run preview` | Sirve la compilación de producción |
| `npm run android` | Compila, sincroniza con `android/` y abre Android Studio |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificación de TypeScript |
| `npm run test:unit` | Pruebas unitarias (Vitest) de la lógica: SMS, métricas, sismos, SUS, mochila y detección de caídas |
| `npm run test:e2e` | Pruebas Playwright en vista móvil (Pixel 7) y de escritorio (1440×900) |
| `npm run screenshots` | Regenera `screenshots/visual/` y `screenshots/codigo/` |

La primera vez que use Playwright, ejecute `npx playwright install chromium`.

### Integración continua (GitHub Actions)

`.github/workflows/ci.yml` corre en cada `push` o pull request a `main`:

1. **Lint, tipos y pruebas:** `lint`, `typecheck`, `test:unit` y `test:e2e`. Si fallan las pruebas e2e, sube los resultados como artefacto.
2. **APK de Android:** compila `app-debug.apk` y lo deja descargable en la pestaña *Actions* del repositorio (artefacto `sismo-debug-apk`, 14 días).

## Flujo de una alerta

1. Se toca **SOS** (en Inicio, en el widget o en el acceso rápido) y se elige el tipo de evento. Con **detección de caídas** activada, una caída o impacto fuerte muestra «¿Está bien?» con 30 s de cuenta regresiva; si nadie responde, la alerta se activa sola.
2. Al confirmar se activan según Configuración: **sirena o silbato de rescate** (en Configuración se puede escuchar una muestra de cada uno antes de elegir), **linterna en código SOS (··· ––– ···)** (solo Android), **vibración SOS** y el destello de la tarjeta. La **pantalla se mantiene encendida** y la **ubicación se toma automáticamente** (aunque no hubiera una guardada; si el permiso no se había pedido, se pide) y se actualiza cada 2 minutos.
3. En la vista de alerta: **Llamar al 123**, **Enviar SMS a mis contactos** (ubicación, punto de encuentro, ficha médica y **nivel de batería**), apagar/reactivar cada señal, **modo atrapado** y la **ficha médica** (salvo que el usuario haya desactivado «Compartir»).
4. **Modo atrapado:** apaga las señales continuas, baja el brillo y deja apagar la pantalla; cada 3 minutos suenan tres pitidos de silbato y destella la linterna SOS. Al salir del modo se retoman las señales normales.
5. «Estoy a salvo · Finalizar alerta» detiene todas las señales, guarda la alerta y ofrece avisar **«Estoy bien»** por SMS o por WhatsApp a cada contacto; el mensaje incluye el enlace a la ubicación actual, el de cada punto de encuentro y la batería. Si era un simulacro, abre la **encuesta SUS**.

Desde Inicio también se puede **avisar que está bien** por SMS sin activar una alerta.

## Correo de alerta (servidor pendiente)

Al activar el SOS la app pregunta «¿Enviar correo a sus contactos?» y, si no hay respuesta en 20 s, lo envía. El correo lo envía **un servidor propio** (aún por conectar):

1. Use `.env.development` (lo lee `npm run dev`) y `.env.production` (lo leen `npm run build` y el APK). Ambos son locales y no se suben a git; si no existen, cópielos de `.env.example`.
2. Ponga en `VITE_ALERT_EMAIL_URL` la URL del servidor (en producción, HTTPS). Las variables `VITE_` quedan dentro de la app: nunca ponga claves allí. La app le hace un POST JSON con asunto, destinatarios, cuerpo y ubicación (contrato en `src/services/emailService.ts`).
3. Vuelva a compilar (`npm run build` / `npm run android`).

Sin URL configurada, la alerta muestra «No se envió: falta conectar el servidor de correo». El correo es obligatorio al crear un contacto (los contactos guardados antes muestran «Falta el correo»). No se pregunta en simulacros ni si ningún contacto real tiene correo.

## Idioma y tema

- **Idioma:** español o inglés, desde la bienvenida o en Configuración. El idioma inicial se toma del teléfono. Traduce la interfaz, la guía, los SMS, la encuesta SUS, las fechas y la voz.
- **Tema:** Sistema, Claro u Oscuro (Configuración → Tema), o el botón sol/luna del encabezado.
- **Para desarrolladores:** los textos están en `src/i18n/ns/<pantalla>.ts` con `es` y `en`. En componentes: `const t = useT().<pantalla>`; en servicios: `getT().<pantalla>`. Si falta una traducción en `en`, TypeScript da error al compilar.

Cada activación guarda sus **tiempos** (SOS → confirmación, confirmación → sirena/linterna/vibración/SMS) para la página de Estadísticas.

## Vistas y rutas

`/bienvenida` · `/registro` · `/inicio` · `/alerta` · `/ubicacion` · `/contactos` · `/historial` · `/historial/:id` · `/guia` · `/configuracion` · `/estadisticas` · `/simulacro` · `/sismos` · `/ficha-medica` · `/encuesta` · `/mochila` · `/despues-del-sismo`

## Qué es real y qué es simulado

| Función | Estado |
|---|---|
| Alerta local, sirena, señal visual | Real, en el dispositivo (Android: servicio nativo, también con pantalla bloqueada; web: Web Audio) |
| Linterna SOS | Real en la app Android y en Chrome para Android con HTTPS. No disponible en iPhone ni en escritorio |
| Vibración SOS | Real en Android (app y Chrome). No disponible en iPhone ni en escritorio |
| Llamar al 123 | Abre el marcador con el 123; la llamada la hace el usuario |
| Simulacro y estadísticas | Reales; métricas guardadas en el dispositivo y exportables a CSV (sin datos personales) |
| Sismos recientes | Catálogo público del USGS (M ≥ 2,5); requiere internet. La ubicación no se envía: se filtra en el dispositivo |
| Ficha médica | Guardada en el dispositivo. «Compartir en la alerta y en el SMS» viene **activado por defecto**: se muestra en la pantalla de alerta y se incluye en el SMS. El usuario puede desactivarlo |
| Puntos de encuentro | Hasta 5 (casa, trabajo, colegio…), guardados en el dispositivo y todos incluidos en los mensajes; la brújula y la ruta guían al más cercano (se puede elegir otro) |
| Registro obligatorio | Sin modo de demostración, asistente de 4 pasos: nombre, ubicación actual, punto de encuentro y un contacto real. El SOS sigue disponible mientras tanto |
| Ubicación automática | Se actualiza cada 5 minutos con la app abierta (no en segundo plano) |
| Modo atrapado | Real en Android (servicio nativo, sigue con la pantalla apagada). En el navegador solo mientras la pestaña esté visible (silbato y vibración) |
| Detección de caídas | Real con la app abierta (acelerómetro). Desactivada por defecto: puede dar falsas alarmas |
| Encuesta SUS | Real; respuestas anónimas en el dispositivo, exportables a CSV |
| Mochila de emergencia | Real; recordatorios **dentro de la app** (no hay notificaciones programadas) |
| Lectura en voz alta de la guía | Android: voz del sistema; navegador: Web Speech API |
| Importar contactos | Android (selector del sistema) y Chrome Android (Contact Picker API) |
| Brújula al punto de encuentro | Real y sin internet (GPS + magnetómetro). Rosa con N, NE, E, SE, S, SO, O y NO fijos; solo gira la flecha. Borde amarillo si no hay punto de encuentro. Mini brújula en Inicio (y en el encabezado al hacer scroll) y acceso «Brújula». Sin magnetómetro, dirección respecto al norte |
| Buscar dirección del punto de encuentro | Esri ArcGIS (direcciones colombianas exactas, p. ej. «Carrera 20 # 39-52») + Photon/OpenStreetMap de respaldo; requiere internet. Para producción revisar los términos de Esri sobre almacenar resultados |
| WhatsApp por contacto | Abre WhatsApp con el aviso listo (un contacto por vez, requiere internet); el número se normaliza (+57). El SMS también agrega +57 a celulares sin indicativo |
| Ruta al punto de encuentro | Mapa con la ruta a pie, en carro/moto o en bici (OpenStreetMap, gratis, requiere internet) y botones para abrirla en Google Maps (guía por voz) o en Waze (carro/moto) |
| Lista «Después del sismo» por alerta | Cada SOS empieza con la lista vacía; las anteriores se guardan con su alerta. Muestra el punto de encuentro con la brújula |
| QR médico | Real; texto plano legible sin internet. En Android la alerta se muestra sobre la pantalla bloqueada |
| Lista «Después del sismo» | Real; contenido orientativo, a validar con la UNGRD |
| Indicador de red | Real (`navigator.onLine`); «con internet» no garantiza que la red no esté saturada |
| Recordatorios de simulacro | Dentro de la app (cada 90 días y Simulacro Nacional en octubre) |
| Geolocalización | Real si el usuario concede el permiso (en web requiere HTTPS o localhost) |
| Coordenadas de prueba | Fijas y **rotuladas** como de prueba; nunca se presentan como la posición del usuario |
| Mapa | Dos pestañas en Ubicación: «Esquema» (SVG, sin internet) y «Mapa real» (Leaflet + OpenStreetMap, requiere conexión y revela a OSM la zona consultada) |
| Envío a contactos (canal digital) | **SMS**: el botón «Enviar SMS a mis contactos» abre la app de mensajes con los contactos reales y el aviso (tipo de evento + enlace a la ubicación). El usuario confirma el envío allí; SISMO no puede verificarlo, por eso el estado es «SMS abierto» y no «Enviada». En el modo de demostración el estado «Enviada/Fallida» sigue siendo una **simulación rotulada** |
| Contactos, historial y configuración | Persistencia en LocalStorage (solo en ese navegador o dispositivo) |
| Estado sin conexión | No implementado |

> Probar desde el celular con `http://192.168.x.x:5173` **no** sirve para la linterna ni la ubicación (el navegador exige HTTPS). Para eso use la app Android.

## Estructura

```
src/
├── components/   AppLayout, Header, BottomNavigation, PanicButton, AlertStatusCard, ContactCard,
│                 ContactFormModal, LocationStatusCard, LocationMap, HistoryItem,
│                 ConfirmationDialog, StatusBadge, ServiceIndicator, EmergencyInstructionCard
├── context/      Estado global (AppStateProvider + useAppState)
├── pages/        Una página por vista
├── services/     storageService, demoData, locationService, sirenService, torchService, vibrationService,
│                 screenService, signalsService, trappedService, smsService, batteryService, metricsService,
│                 quakeService, susService, kitService, speechService, contactPickerService,
│                 fallDetectionService, sosRequestService, nativeBridge (plugin SismoNative)
│                 + *.test.ts (pruebas unitarias Vitest)
├── types/        Tipos del dominio
├── utils/        Formato de fechas, validación de contactos y navegación (goToRoot)
└── styles/       theme.css (tokens) y global.css
tests/            e2e.spec.ts y funciones.e2e.spec.ts (funcionales), screenshots.spec.ts (evidencias)
.github/workflows/ci.yml  Integración continua (lint, tipos, pruebas y APK)
android/          Proyecto nativo de Android generado por Capacitor (abrir con Android Studio)
assets/           Imágenes fuente del ícono de la app
capacitor.config.ts  Id de la app (co.edu.poli.sismo), nombre y carpeta web (dist)
```

## Avances y hoja de ruta

El detalle de lo implementado, las decisiones de diseño, las limitaciones y las mejoras planeadas está en [docs/AVANCES_Y_HOJA_DE_RUTA.md](docs/AVANCES_Y_HOJA_DE_RUTA.md).

## Pendiente para el equipo (revisión humana, regla 80/20)

- Validar el contenido de la Guía de emergencia contra fuentes oficiales (UNGRD, SGC).
- Definir e implementar el canal digital real (SMS o push) y su backend.
- Probar en dispositivos físicos: sirena con la pantalla bloqueada, linterna y permisos de ubicación/cámara.
- Agregar pruebas automáticas para la sirena (botón «Silenciar sirena») y la linterna.
- Revisar las reglas de validación de teléfonos según el alcance del proyecto.
