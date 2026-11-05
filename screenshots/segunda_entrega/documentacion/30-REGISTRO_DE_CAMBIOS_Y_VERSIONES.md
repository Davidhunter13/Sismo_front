> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# 30. Registro de cambios y versiones — SISMO

Formato basado en *Keep a Changelog*. Las fechas salen de las evidencias y del historial de commits. La app vive en el repositorio `Sismo_front` (rama `main`); el backend, en su propio repositorio.

| Versión | Fecha | Resumen |
|---|---|---|
| **3.1** | 04/11/2026 | Documentación técnica completa, página informativa pública y ajustes visuales |
| **3.0** | 04/11/2026 | Backend, base de datos, sincronización sin conexión, panel de monitoreo, catálogos, recuperación y eliminar cuenta |
| **2.0** | 02/11/2026 | App Android completa, alertas avanzadas, comunicación, ubicación, supervivencia y validación |
| **1.0** | 24/10/2026 | Prototipo web del botón de pánico |

---

## [3.1] — 04/11/2026

### Agregado
- **Página web informativa pública** (`Sismo_info`), sin inicio de sesión. Incluye:
  - beneficios y funciones con capturas en teléfonos, portátil y escritorio;
  - «Lo que aún está pendiente»;
  - carrusel automático y animaciones que respetan «reducir movimiento»;
  - botón «Solicitar una demostración», configurable.
- **Evidencias nuevas:** ficha médica con QR, QR escaneado por un rescatista, aviso del centro de monitoreo, guía y sismos recientes (USGS).
- **Documentación gráfica:** 33 diagramas (UML, arquitectura, base de datos y planificación) con fuentes Mermaid editables.
- **Documentación técnica y funcional:** requisitos, historias de usuario, diccionario de datos, API, manuales, plan e informe de pruebas, riesgos, evidencias y este registro.

### Cambiado
- La cuenta regresiva «Se enviará automáticamente en N s» usa tamaño de frase y no separa el número de la «s».

### Corregido
- El texto de la cuenta regresiva se salía del diálogo del correo en teléfonos angostos.

## [3.0] — 04/11/2026

### Agregado
- **Backend en CodeIgniter 3** con API REST (token por dispositivo, sin contraseña) y **12 tablas `sismo_*`** en un script SQL único e idempotente.
- **Sincronización sin conexión:** cola persistente, subida automática al volver la red, reintentos y nuevo registro tras un 401.
- **Ficha médica cifrada** (AES-256-GCM) con la llave en una variable de entorno.
- **Panel de monitoreo en tiempo real:**
  - indicadores, alertas activas y mapa;
  - avisos con sonido y notificación;
  - brindar ayuda (la persona la ve como aviso fijo en la app);
  - detalle de la persona, historial y usuarios;
  - sismos recientes (24 h / 7 días);
  - código de recuperación temporal (48 h);
  - loader y actualización silenciosa cada minuto.
- **Catálogos administrables:** tipos de evento, parentescos, kit, pasos de «Después del sismo», tipos de sangre, guía y parámetros (número de emergencia, topes, tiempos), en español e inglés.
- **Recuperación de datos** con código de un solo uso y **«Eliminar mi cuenta»** con supresión de datos personales.
- Pantalla de carga, loader de solicitudes, aviso «sin conexión» y pantalla de error.
- Avisos con SweetAlert2 en el panel.

### Cambiado
- «Después del sismo» guarda el avance **por clave de paso** (antes, por posición). Los datos anteriores se migran solos.
- El **modo de demostración** solo aparece en desarrollo.

### Corregido
- Preflight CORS con la cabecera `Authorization`.
- Tras un 401, la app ahora se registra de nuevo de inmediato y sube lo pendiente.
- Errores de recarga en caliente (*HMR*) del contexto global.

## [2.0] — 02/11/2026

### Agregado
- **App Android** (Capacitor) con widget SOS (1×1 y 2×2, doble toque) y acceso rápido.
- **Señales nativas:** la sirena sigue con la pantalla bloqueada, más linterna y vibración en código SOS y pantalla encendida.
- **Comunicación:**
  - botón «Llamar al 123»;
  - SMS a los contactos;
  - «Estoy bien» por SMS o WhatsApp con ubicación, punto de encuentro y batería;
  - correo de alerta con cuenta regresiva de 20 s.
- **Ubicación:** GPS afinado, actualización cada 2 min, mapa real, varios puntos de encuentro (hasta 5), brújula sin internet y ruta (a pie, carro o bici, Waze, Google Maps).
- **Supervivencia:** modo atrapado, silbato, ahorro de batería automático y detección de caídas.
- **Validación:** métricas de tiempo, simulacro con cronómetro, encuesta SUS, estadísticas y CSV.
- **Preparación:** ficha médica con QR, mochila de emergencia, «Después del sismo» y sismos recientes (USGS).
- **Registro obligatorio** en 4 pasos, idioma inglés, tema oscuro, accesibilidad y lectura en voz alta.
- **Calidad:** Vitest, integración continua con APK automático y 114 ejecuciones e2e.

## [1.0] — 24/10/2026

### Agregado
- **Prototipo web:**
  - bienvenida, inicio con botón SOS, confirmación y alerta activa;
  - ubicación, contactos de emergencia e historial de alertas;
  - guía de emergencia, configuración y vista de escritorio.

---

## Planeado hasta el 11/12/2026

| Fechas | Actividad |
|---|---|
| 09/11 – 13/11 | Puesta en producción (base de datos, llave de cifrado, despliegue) |
| 09/11 – 20/11 | Prueba en dispositivo físico y ajustes nativos |
| 16/11 – 20/11 | Correo de alertas en producción y pruebas reales |
| 09/11 – 27/11 | Aprobación del tratamiento de datos (Ley 1581) |
| 30/11 – 04/12 | Validación con usuarios: simulacros y encuesta SUS |
| 07/12 – 09/12 | Ajustes por los resultados de la validación |
| 10/12 – 11/12 | Documentación final, informe y **entrega final (11/12)** |

**Fuera del alcance de este proyecto** (posibles mejoras futuras): notificaciones push, proyecto iOS, alertas del Servicio Geológico Colombiano, funcionamiento sin conexión como PWA y estadísticas de la tesis consultando la base de datos.
