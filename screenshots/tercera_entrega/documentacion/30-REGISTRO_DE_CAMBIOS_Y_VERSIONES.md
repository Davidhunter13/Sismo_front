> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.
> **Tercera entrega.** Copia del registro de la segunda entrega (`../../segunda_entrega/documentacion/30-REGISTRO_DE_CAMBIOS_Y_VERSIONES.md`, que se conserva sin cambios) con la versión 3.3.


# 30. Registro de cambios y versiones — SISMO

Formato basado en *Keep a Changelog*. **Las versiones siguen la planificación del proyecto** (diagramas 15 a 18: Gantt, PERT, ruta crítica y línea de tiempo): del **martes 6 de octubre al viernes 11 de diciembre de 2026**, 49 días hábiles en 5 fases. Cada versión indica la actividad del plan (A, B, C…) y su periodo. Las actividades D a G y la I se trabajaron en paralelo; las entregas coinciden con las evidencias: versión 1 el 23/10 (capturas del 24/10), versión 2 el 02/11 y versión 3 el 04/11.

La app vive en el repositorio `Sismo_front` (rama `main`); el backend, en su propio repositorio.

| Versión | Periodo | Fase · actividad del plan | Resumen |
|---|---|---|---|
| **3.3** | 05/11 – 06/11 (en curso) · **tercera entrega** | Fase 3 · L, con adelanto de la actividad P | Correo de alerta a los contactos por el API: contacto principal (Para) y copia oculta, caída, urgente, atrapado, batería y ubicación; correo del centro de monitoreo con plantillas |
| **3.2** | 05/11 – 06/11 (en curso) | Fase 3 · L | Plantillas y editor de mensajes, prioridad de alertas, evento masivo, sismos con gráfica y mapa, página informativa y documentación |
| **3.0** | 04/11 | Fase 3 · J y K | Panel de monitoreo, catálogos administrables, recuperación, eliminar cuenta y servicio de correo · **entrega v3** |
| **2.1** | 26/10 – 03/11 | Fase 3 · I | Backend, base de datos y sincronización sin conexión |
| **2.0** | 02/11 | Fase 2 · H | Calidad: pruebas, integración continua y APK · **entrega v2** |
| **1.4** | 26/10 – 30/10 | Fase 2 · G | Supervivencia y validación |
| **1.3** | 26/10 – 30/10 | Fase 2 · F | Ubicación, mapas, rutas y puntos de encuentro |
| **1.2** | 26/10 – 30/10 | Fase 2 · E | Alertas avanzadas y comunicación |
| **1.1** | 26/10 – 30/10 | Fase 2 · D | App Android, widget y acceso rápido |
| **1.0** | 19/10 – 23/10 | Fase 1 · C | Prototipo web del botón de pánico · **entrega v1** (evidencias del 24/10) |
| **0.2** | 12/10 – 16/10 | Fase 1 · B | Diseño UX/UI e identidad visual |
| **0.1** | 06/10 – 09/10 | Fase 1 · A | Análisis y requisitos |

---

## Fase 3 · Backend y monitoreo (26/10 – 06/11)

### [3.3] — 05/11 – 06/11 · Actividad L, adelanto de P · tercera entrega

#### Agregado
- **Correo de alerta a los contactos por el API** (`POST sismo/correo_alerta/{id}`): el backend envía con el servicio de correo de la organización y el remitente «SISMO». Los destinatarios salen de los contactos guardados (nunca de la app).
- **Contacto principal del correo:** al crear o editar un contacto se marca como principal; los principales van en «Para» y el resto en copia oculta. Si ninguno está marcado, el primero es el principal.
- **Avisos por correo durante la alerta:** ayuda urgente, modo atrapado, batería baja y **ubicación actualizada** (si se desplaza 200 m o más, como máximo cada 15 min; sin cron). Atrapado, batería y ubicación solo si no se canceló el correo inicial.
- **Correo de caída sin respuesta:** si la alerta se activó sola por una caída, el correo inicial es de ese tipo.
- **Correo del centro de monitoreo a los contactos** desde el detalle de la persona, con mensaje propio o **6 plantillas para contactos**, editor y comodines; bitácora `sismo_correos_operador` (15 tablas).
- **Inicio:** «SMS y WhatsApp (manual)» y «Correo a contactos (automático)» en Disponibilidad de servicios.
- **Página informativa:** sección «Cómo avisa a sus contactos» con el correo en portátil y teléfono, partículas de fondo, e imágenes nuevas de la alerta (ayuda urgente y canales con el correo «Enviado»).
- **Diseño del correo igual al de la app:** encabezado azul marino con el logo en base64, franja roja (o ámbar en los avisos), mensaje y botón «Ver ubicación en el mapa».
- **Bitácora `sismo_correos_alertas`** y marca `es_principal_correo` en los contactos, con un script idempotente. El panel muestra todos los correos (automáticos y del centro) en el detalle de la persona.

#### Cambiado
- El token del servicio de correo se lee de una variable de entorno (`CORREO_SERVICIO_TOKEN`); los correos de la app salen con el remitente «SISMO».
- `VITE_ALERT_EMAIL_URL` deja de usarse: el correo va por el mismo API de sincronización.
- En la pantalla de alerta, «Canal digital» pasa a ser «SMS y WhatsApp (manual)» y el correo enviado se muestra como «Enviado».

#### Seguridad
- Un envío por alerta y tipo, nada en simulacros, máximo 8 correos por persona en una hora, mensaje escapado y bitácora sin direcciones de correo.

**Probado el 05/11:** envío real de los cuatro tipos de correo a una cuenta de prueba (confirmado por el servicio).

**Queda para la actividad P (16/11 – 20/11):** prueba del endpoint completo en producción (con la variable `CORREO_SERVICIO_TOKEN` configurada) y revisión en Gmail, Outlook y Apple Mail.

### [3.2] — 05/11 – 06/11 · Actividad L (en curso)

#### Agregado
- **Página web informativa pública** (`Sismo_info`, actualizada el 05/11 con prioridad, preparación, sismos con gráfica y mensajes con formato), sin inicio de sesión: beneficios y funciones con capturas en teléfonos, portátil y escritorio; «Lo que aún está pendiente»; carrusel automático y animaciones que respetan «reducir movimiento»; botón «Solicitar una demostración», configurable.
- **Plantillas de mensaje en «Brindar ayuda»** (panel): generales y por estado, con 10 comodines (clic o arrastre) y vista previa. Se administran en «Mensajes de ayuda». Nueva tabla `sismo_plantillas_atenciones` (13 tablas en total), con 20 plantillas iniciales.
- **Editor de texto enriquecido** (Quill local, sin CDN) en «Brindar ayuda» y en las plantillas; la app muestra el mensaje con el mismo formato. HTML limpio con lista blanca en el servidor, el panel y la app.
- **Prioridad de las alertas:** botón **«Necesito ayuda urgente»** en la app; la alerta viaja con la caída sin respuesta, el modo atrapado y la batería. El panel lo muestra en cada tarjeta, ordena por criticidad y permite **filtrar por criticidad**. Seis columnas nuevas en `sismo_alertas_usuarios` (script idempotente).
- **Panel casi en tiempo real:** pulso cada 3 s (antes, cada minuto) y puntos que palpitan con ondas en el mapa, con el nombre de la persona encima.
- **Evento masivo en el panel:** avisos agrupados (sin cascada de ventanas), sonido y notificaciones con límite, orden de triaje y mapa legible con muchas alertas.
- **Sismos recientes con gráfica de picos y mapa con ondas** (app y panel): entre más intenso, más alto el pico y más grande el punto.
- **Inicio que avisa qué falta:** tarjetas en amarillo (mochila vacía, sin ficha médica, sin simulacro, sin punto de encuentro, «Después del sismo» incompleto) y la mochila en rojo con lo vencido o por vencer.
- **App:** aviso fijo de alerta activa en cualquier pantalla, «Estoy a salvo» fijo en la parte inferior y **5.º paso del registro, «Protección»** (señales, detección de caídas y ahorro de batería; opcional).
- **Documentación gráfica:** 33 diagramas (UML, arquitectura, base de datos y planificación) con fuentes Mermaid editables.
- **Documentación técnica y funcional:** requisitos, historias de usuario, diccionario de datos, API, manuales, plan e informe de pruebas, riesgos, evidencias y este registro.

#### Cambiado
- La cuenta regresiva «Se enviará automáticamente en N s» usa tamaño de frase y no separa el número de la «s».
- Quill, Leaflet y SweetAlert2 del panel se sirven desde el servidor (sin CDN).

#### Corregido
- El texto de la cuenta regresiva se salía del diálogo del correo en teléfonos angostos.
- El encabezado del registro mostraba texto oscuro sobre el fondo azul.
- Las pruebas e2e ya no dependen de la batería real del equipo.

### [3.0] — 04/11 · Actividades J y K · entrega v3

#### Agregado
- **Panel de monitoreo en tiempo real:** indicadores, alertas activas y mapa; avisos con sonido y notificación; brindar ayuda (la persona la ve como aviso fijo en la app); detalle de la persona, historial y usuarios; sismos recientes (24 h / 7 días); código de recuperación temporal (48 h); loader.
- **Catálogos administrables:** tipos de evento, parentescos, kit, pasos de «Después del sismo», tipos de sangre, guía y parámetros (número de emergencia, topes, tiempos), en español e inglés.
- **Recuperación de datos** con código de un solo uso y **«Eliminar mi cuenta»** con supresión de datos personales.
- **Servicio de correo de alertas:** contrato de envío desde la app (cuenta regresiva de 20 s y validación de destinatarios).
- Avisos con SweetAlert2 en el panel.

#### Cambiado
- «Después del sismo» guarda el avance **por clave de paso** (antes, por posición). Los datos anteriores se migran solos.
- El **modo de demostración** solo aparece en desarrollo.

### [2.1] — 26/10 – 03/11 · Actividad I

#### Agregado
- **Backend en CodeIgniter 3** con API REST (token por dispositivo, sin contraseña) y **12 tablas `sismo_*`** en un script SQL idempotente con la convención de nombres del CCS.
- **Sincronización sin conexión:** cola persistente, subida automática al volver la red, reintentos con espera exponencial y nuevo registro tras un 401.
- **Ficha médica cifrada** (AES-256-GCM) con la llave en una variable de entorno.
- Pantalla de carga, loader de solicitudes, aviso «sin conexión» y pantalla de error en la app.

#### Corregido
- Preflight CORS con la cabecera `Authorization`.
- Tras un 401, la app se registra de nuevo de inmediato y sube lo pendiente.
- Errores de recarga en caliente (*HMR*) del contexto global.

---

## Fase 2 · App completa (26/10 – 02/11)

### [2.0] — 02/11 · Actividad H · entrega v2

#### Agregado
- **Calidad:** pruebas unitarias con Vitest, pruebas e2e en móvil y escritorio (114 ejecuciones), integración continua y APK automático.
- **Registro obligatorio** en 4 pasos, idioma inglés, tema oscuro, accesibilidad y lectura en voz alta.

### [1.4] — 26/10 – 30/10 · Actividad G

#### Agregado
- **Supervivencia:** modo atrapado, silbato, ahorro de batería automático y detección de caídas.
- **Validación:** métricas de tiempo, simulacro con cronómetro, encuesta SUS, estadísticas y CSV.
- **Preparación:** ficha médica con QR, mochila de emergencia y «Después del sismo».

### [1.3] — 26/10 – 30/10 · Actividad F

#### Agregado
- **Ubicación:** GPS afinado y actualización cada 2 min durante la alerta, mapa real (OpenStreetMap), varios puntos de encuentro (hasta 5), brújula sin internet y ruta (a pie, carro o bici; Waze y Google Maps).
- Sismos recientes (USGS) filtrados por cercanía.

### [1.2] — 26/10 – 30/10 · Actividad E

#### Agregado
- **Comunicación:** botón «Llamar al 123»; SMS a los contactos; «Estoy bien» por SMS o WhatsApp con ubicación, punto de encuentro y batería; correo de alerta con cuenta regresiva.
- Estados por canal («activada localmente ≠ mensaje entregado»).

### [1.1] — 26/10 – 30/10 · Actividad D

#### Agregado
- **App Android** (Capacitor) con widget SOS (1×1 y 2×2, doble toque) y acceso rápido.
- **Señales nativas:** la sirena sigue con la pantalla bloqueada, linterna y vibración en código SOS, y pantalla encendida durante la alerta.

---

## Fase 1 · Análisis, diseño y prototipo (06/10 – 23/10)

### [1.0] — 19/10 – 23/10 · Actividad C · entrega v1

#### Agregado
- **Prototipo web:** bienvenida, inicio con botón SOS, confirmación y alerta activa; ubicación, contactos de emergencia e historial de alertas; guía de emergencia, configuración y vista de escritorio.
- Evidencias de la primera entrega (`screenshots/primera_entrega/2026-10-24/`).

### [0.2] — 12/10 – 16/10 · Actividad B

#### Agregado
- **Identidad visual:** logo, paleta de colores (azul marino y rojo SOS) y tipografía Inter.
- Diseño de los flujos principales: activar el SOS en pocos toques, alerta activa, contactos y guía.

### [0.1] — 06/10 – 09/10 · Actividad A

#### Agregado
- Análisis del problema y del alcance: botón de pánico para emergencias sísmicas con aviso a contactos de confianza.
- Requisitos iniciales, roles (persona usuaria y centro de monitoreo) y criterios de validación (tiempos de reacción, simulacro y encuesta SUS).

---

## Planeado hasta el 11/12/2026

| Fechas | Fase · actividad | Actividad |
|---|---|---|
| 09/11 – 13/11 | Fase 4 · N | Puesta en producción (base de datos, llave de cifrado, despliegue) |
| 09/11 – 20/11 | Fase 4 · O | Prueba en dispositivo físico y ajustes nativos |
| 16/11 – 20/11 | Fase 4 · P | Correo de alertas en producción y pruebas reales |
| 09/11 – 27/11 | Fase 4 · Q | Aprobación del tratamiento de datos (Ley 1581) |
| 30/11 – 04/12 | Fase 5 · S | Validación con usuarios: simulacros y encuesta SUS |
| 07/12 – 09/12 | Fase 5 · T | Ajustes por los resultados de la validación |
| 10/12 – 11/12 | Fase 5 · U | Documentación final, informe y **entrega final (11/12)** |

**Fuera del alcance de este proyecto** (posibles mejoras futuras): notificaciones push, proyecto iOS, alertas del Servicio Geológico Colombiano, funcionamiento sin conexión como PWA y estadísticas de la tesis consultando la base de datos.
