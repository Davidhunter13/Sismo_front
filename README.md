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
| Ubicación (precisa y aproximada) | Adjuntar la posición a la alerta | Al abrir la app (solo en Android) |
| Cámara | Únicamente encender el flash como linterna intermitente; no se capturan imágenes | Al abrir la app, después del de ubicación (solo en Android) |

Con los permisos concedidos, al confirmar el SOS la app Android enciende sola la sirena y la linterna intermitente (si «Señal visual» está activa y «Reducir animaciones» no).

La sirena no requiere permisos.

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
| `npm run test:e2e` | Pruebas Playwright en vista móvil (Pixel 7) y de escritorio (1440×900) |
| `npm run screenshots` | Regenera `screenshots/visual/` y `screenshots/codigo/` |

La primera vez que use Playwright, ejecute `npx playwright install chromium`.

## Flujo de una alerta

1. En Inicio se toca **SOS** y se elige el tipo de evento (sismo, otra emergencia o prueba).
2. Al confirmar, **la sirena suena de inmediato** (si «Señal sonora» está activa en Configuración) y la tarjeta de alerta empieza a destellar.
3. En la vista de alerta se puede **silenciar/reactivar la sirena**, apagar la señal visual y encender la **linterna intermitente**. Al apagar la señal visual también se apaga y deshabilita la linterna.
4. «Estoy a salvo · Finalizar alerta» detiene sirena, destello y linterna, y guarda la alerta en el historial.

## Vistas y rutas

`/bienvenida` · `/inicio` · `/alerta` · `/ubicacion` · `/contactos` · `/historial` · `/historial/:id` · `/guia` · `/configuracion`

## Qué es real y qué es simulado

| Función | Estado |
|---|---|
| Alerta local, sirena (Web Audio), señal visual | Real, en el dispositivo |
| Linterna intermitente | Real en la app Android y en Chrome para Android con HTTPS. No disponible en iPhone ni en escritorio |
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
├── services/     storageService, demoData, locationService, sirenService, torchService
├── types/        Tipos del dominio
├── utils/        Formato de fechas y validación de contactos
└── styles/       theme.css (tokens) y global.css
tests/            e2e.spec.ts (funcionales) y screenshots.spec.ts (evidencias)
android/          Proyecto nativo de Android generado por Capacitor (abrir con Android Studio)
assets/           Imágenes fuente del ícono de la app
capacitor.config.ts  Id de la app (co.edu.poli.sismo), nombre y carpeta web (dist)
```

## Pendiente para el equipo (revisión humana, regla 80/20)

- Validar el contenido de la Guía de emergencia contra fuentes oficiales (UNGRD, SGC).
- Definir e implementar el canal digital real (SMS o push) y su backend.
- Probar en dispositivos físicos: sirena con la pantalla bloqueada, linterna y permisos de ubicación/cámara.
- Agregar pruebas automáticas para la sirena (botón «Silenciar sirena») y la linterna.
- Revisar las reglas de validación de teléfonos según el alcance del proyecto.
