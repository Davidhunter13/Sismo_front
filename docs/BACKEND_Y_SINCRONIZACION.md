> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# SISMO — Backend y sincronización de datos

**Fecha:** 4 de noviembre de 2026

Hasta esta versión todo se guardaba solo en el teléfono (`localStorage`, clave `sismo:v1:data`). Ahora los datos
también se guardan en una **base de datos MySQL** a través de un **backend en PHP con CodeIgniter 3** (API REST JSON).
El teléfono sigue funcionando igual sin internet: la base de datos recibe los cambios apenas hay red.

---

## 1. Arquitectura

```
App SISMO (React + Ionic + Capacitor)
  ├─ localStorage  sismo:v1:data        ← estado de la app (fuente inmediata, funciona sin red)
  ├─ localStorage  sismo:v1:outbox      ← cola persistente de cambios pendientes de subir
  ├─ localStorage  sismo:v1:dispositivo ← identificador y token del dispositivo
  └─ src/services/syncService.ts  ──HTTPS/JSON──►  Backend CodeIgniter 3 (controlador Sismo + modelo Sismo_model)
                                                      └─ MySQL: tablas sismo_*
```

- **Offline-first:** cada cambio se guarda primero en el teléfono; después se convierte en operaciones por recurso
  (`PUT`/`DELETE`) que entran a la cola.
- **La cola sobrevive** sin red, al cerrar la app y al reiniciar el teléfono.
- **Se vacía sola apenas hay conexión:** al recuperar la red (evento `online`), al abrir la app, al volver a primer
  plano y cada minuto. Ante errores 429/5xx reintenta con espera exponencial (1 s, 2 s, 4 s).
- **Sin duplicados:** cada registro lleva el UUID que generó la app; reenviar una operación la sobrescribe.
  Si un recurso cambia varias veces sin red, solo se sube su última versión.
- **Historial completo:** al registrarse el dispositivo por primera vez se sube **todo** lo que ya existía en el
  teléfono (alertas y sus métricas, simulacros, encuestas SUS, contactos, kit, puntos de encuentro, ajustes y ficha médica).
- Los datos del **modo de demostración** (`isSeed`) nunca se suben.
- Sin `VITE_SISMO_API_URL` la app funciona como antes, solo en el teléfono.

## 2. Identidad del usuario (sin contraseña)

Cada usuario es un **dispositivo**. En el primer uso con red la app llama a `POST /registro`; el servidor crea el
usuario y entrega un **token** aleatorio de 256 bits, una sola vez. La app lo guarda y lo envía en cada petición
(`Authorization: Bearer <token>`). El servidor solo guarda el **SHA-256** del token. Si el servidor responde 401
(token revocado), la app se registra de nuevo y vuelve a subir todo.

## 3. API REST

Base: `VITE_SISMO_API_URL` (p. ej. `https://servidor.ejemplo/sismo`). Cuerpos en JSON con los mismos tipos de
`src/types/index.ts`. Todas las respuestas traen la cabecera `X-Execution-Id` (UUID v4, también en los logs).

| Método y ruta | Cuerpo | Qué hace |
|---|---|---|
| `POST /registro` | `{ plataforma: android \| ios \| web }` | Crea el usuario; responde `{ uuid_dispositivo, token }` (201) |
| `GET /estado` | — | Devuelve todo lo guardado del usuario **en el mismo formato de la app** (para restaurar un teléfono) |
| `POST /codigo_recuperacion` | — | Crea un código de recuperación `XXXX-XXXX-XXXX` (no vence; uno nuevo invalida el anterior) |
| `POST /recuperar` | `{ codigo, plataforma }` | Canjea el código: entrega un token nuevo para el mismo usuario; el teléfono anterior pierde el acceso |
| `POST /eliminar_cuenta` | — | Elimina la cuenta: borrado lógico en cascada + supresión de datos personales y de salud; token y código revocados (el teléfono puede registrarse de nuevo) |
| `GET /catalogos` | — | **Público (sin token).** Catálogos administrables activos + `version` (la app solo los reemplaza si la versión cambió) |
| `GET /atencion` | — | Ayuda registrada desde el panel para la alerta activa (`en_atencion`, `ayuda_enviada`, `resuelta` + mensaje) |
| `PUT /ajustes` | `{ settings, locationPermission, lastLocation, postQuakeDone }` | Configuración, permiso y última ubicación |
| `PUT` / `DELETE /contactos/{id}` | `Contact` | Crea/actualiza o elimina un contacto |
| `PUT` / `DELETE /alertas/{id}` | `AlertRecord` | Alerta con ubicación, estados y métricas de tiempo |
| `PUT` / `DELETE /puntos_encuentro/{id}` | `MeetingPoint` | Punto de encuentro |
| `PUT` / `DELETE /encuestas/{id}` | `SusResponse` | Respuesta SUS (10 respuestas de 1 a 5 y puntaje) |
| `PUT /inventario` | `EmergencyKit \| null` | Reemplaza la lista del kit (los ítems que faltan quedan inactivos) |
| `PUT` / `DELETE /ficha_medica` | `MedicalInfo` | Ficha médica, siempre cifrada |

Códigos: `200/201` correcto · `401` token inválido · `405` método no permitido · `413` cuerpo > 64 KB ·
`422 { error: 'dato_invalido', campo }` validación · `503` el servidor aún no puede guardar el dato (la app lo
conserva en la cola y reintenta) · `500` error interno.

## 4. Base de datos

Tablas (convención CCS: snake_case, plural, todo comentado, FK `id_`, `activo` como único borrado lógico y
auditoría `created_at/created_by/updated_at/updated_by`):

| Tabla | Contenido |
|---|---|
| `sismo_usuarios` | Dispositivo: UUID, hash del token, nombre, plataforma, última sincronización |
| `sismo_ajustes_usuarios` | Configuración, permiso y última ubicación, lista post-sismo de práctica, revisión del kit |
| `sismo_contactos_usuarios` | Contactos de emergencia |
| `sismo_alertas_usuarios` | Historial de alertas: tipo, origen, estados, ubicación y **métricas en ms** (SOS, confirmación, sirena, linterna, vibración, SMS, señal del simulacro) |
| `sismo_fichas_medicas_usuarios` | Ficha médica cifrada (AES-256-GCM) + consentimiento para mostrarla en la alerta |
| `sismo_puntos_encuentro_usuarios` | Puntos de encuentro |
| `sismo_encuestas_sus_usuarios` | Respuestas y puntaje SUS, con la alerta de simulacro asociada |
| `sismo_inventarios_usuarios` | Ítems del kit de emergencia (marcado, vencimiento) |
| `sismo_atenciones_alertas` | Bitácora de la ayuda brindada desde el panel a cada alerta (estado, mensaje, operador) |
| `sismo_catalogos` | Listas administrables: tipos de evento, parentescos, ítems sugeridos del kit, pasos «Después del sismo», tipos de sangre (clave estable + nombre es/en, ícono, orden, visible) |
| `sismo_guia_tarjetas` | Tarjetas de la guía de emergencia por momento (título y pasos es/en, ícono, orden, visible) |
| `sismo_parametros` | Número de emergencia, máximo de puntos de encuentro, opciones de ahorro de batería, tiempos del simulacro y de ubicación, introducciones y aviso de la guía |

`sismo_usuarios` también guarda el **SHA-256 del código de recuperación** y su vencimiento (los códigos nunca se guardan en claro).

"Eliminar" en la app pone `activo = 0`; no hay borrado físico. Las métricas quedan consultables con SQL para la tesis
(p. ej. tiempo de reacción en simulacros = `ms_sos_presionado - ms_senal_simulacro`).

## 5. Recuperación de datos (teléfono perdido o nuevo)

1. **Antes de perder el teléfono:** en *Configuración → Respaldo y recuperación* la persona crea un **código de recuperación** y lo guarda fuera del teléfono. El código no vence; crear otro invalida el anterior.
2. **Si no tiene código:** un administrador, desde el panel, verifica su identidad y genera un **código temporal** (48 h por defecto).
3. **En el teléfono nuevo:** *Configuración → Recuperar mis datos*, escribe el código (sin importar mayúsculas ni guiones) y confirma. La app:
   - recibe un token nuevo para la **misma cuenta** (el teléfono perdido deja de sincronizar en ese instante);
   - descarga todo con `GET /estado` (contactos, historial de alertas y métricas, ficha médica, puntos de encuentro, kit, encuestas y ajustes) y reemplaza los datos locales;
   - descarta los cambios pendientes de ese teléfono para no mezclar datos.
4. El código es de **un solo uso**. Un código inválido tarda 1 s en responder (freno a intentos por fuerza bruta).

## 6. Panel administrativo (centro de monitoreo)

Página web servida por el mismo backend en CodeIgniter 3, con la **identidad visual de la app** (paleta, logo, tipografía Inter, modo claro/oscuro) y acceso solo para los administradores autorizados en la configuración del servidor.

- **Siempre al día:** cada pestaña consulta al servidor al abrirse; además el panel (y el detalle de una persona abierto) se actualiza solo cada minuto, en silencio (cada 2 min si la pestaña del navegador está oculta). Al registrar una ayuda la lista se actualiza al instante. Indicador «En vivo». Nunca hace falta recargar la página.
- **Loader:** las consultas que inicia el operador muestran un loader de pantalla completa (fondo oscuro translúcido, anillo rojo y onda sísmica); las actualizaciones automáticas no.
- **Alertas activas:** tarjetas con la persona, el tipo, hace cuánto se activó, el origen (app, widget, acceso rápido, caída), los contactos y la ubicación (enlace a Google Maps); los simulacros se distinguen en morado.
- **Mapa** (Leaflet + OpenStreetMap) con las alertas activas y el círculo de precisión.
- **Avisos:** banner rojo y título de la pestaña con el número de alertas SOS; con «Activar avisos» (preferencia guardada en el navegador) suena un pitido, llega una notificación del sistema y se abre una ventana (SweetAlert2) con «Ver persona» y «Brindar ayuda».
- **Brindar ayuda:** el operador registra *En atención*, *Ayuda enviada* o *Resuelta* con un mensaje. La app lo muestra en la pantalla de alerta (consulta cada 15 s): «El centro de monitoreo de SISMO está atendiendo su alerta».
- **Detalle de la persona:** contactos (con enlaces para llamar o escribir), ficha médica descifrada, puntos de encuentro, historial de alertas con tiempos de confirmación y reacción, kit, encuestas SUS y bitácora de ayuda.
- **Indicadores:** usuarios, activos en 24 h, alertas reales, simulacros, tiempo promedio de reacción en simulacros, tiempo de confirmación del SOS y SUS promedio.
- **Código de recuperación temporal** para quien perdió el teléfono.
- **Sismos recientes:** pestaña con las **últimas 24 horas** y los **últimos 7 días** (los mismos periodos de la app), magnitud 2.5 o más en Colombia y alrededores, desde el catálogo público del USGS consultado por el backend (caché de 5 min). Tabla con magnitud, lugar, profundidad y cuántas personas lo reportaron, y capa en el mapa (tamaño y color según la magnitud).
- **Catálogos de la app:** administración de tipos de evento, parentescos, kit, pasos post-sismo, tipos de sangre, guía y parámetros (ver 6b).
- **Trazabilidad:** cada consulta del detalle (incluye datos de salud), cada atención y cada código generado queda en el log con el operador y un `execution_id`.
- **Seguridad:** los datos de la app se pintan como texto (sin HTML) para evitar XSS; las acciones exigen token CSRF.

## 6b. Catálogos administrables (nada de negocio queda fijo en el código)

Todo lo que antes estaba escrito en el código de la app se administra desde el panel (pestaña **Catálogos de la app**):

| Qué | Dónde se ve en la app | Notas |
|---|---|---|
| Tipos de evento (nombre es/en, ícono, orden) | Diálogo del SOS, historial, SMS, correo, CSV | `sismo` y `emergencia_general` los usan el widget y la detección de caídas: se pueden renombrar, no ocultar |
| Parentescos | Formulario de contactos | Un contacto con un parentesco que se ocultó lo conserva |
| Ítems sugeridos del kit | Mochila de emergencia (al crearla) | Cada persona sigue editando su propio kit |
| Pasos «Después del sismo» | Lista de verificación | Lo marcado se guarda **por clave de paso** (antes por posición): agregar, ocultar o reordenar pasos no altera lo ya marcado y los pasos nuevos se guardan igual (teléfono y base de datos, por alerta y en la lista de práctica) |
| Tipos de sangre | Ficha médica | |
| Guía de emergencia | Antes / Durante / Después | Un paso por línea; `{emergencyNumber}` muestra el número configurado |
| Parámetros | Botón «Llamar al…», textos, topes y tiempos | Número de emergencia, máximo de puntos de encuentro, opciones de ahorro de batería, espera del simulacro, actualización de la ubicación en alerta, introducciones y aviso de la guía |

- **Sin internet:** la app trae los mismos valores por defecto con los que se sembró la base de datos, descarga los del servidor al abrir con red y guarda la última copia en el teléfono. El SOS nunca depende del servidor.
- **Claves estables:** la app guarda la clave (no el texto), así renombrar un elemento no rompe los datos guardados. La clave no se puede cambiar después de crearla; «eliminar» es ocultar (`activo = 0`).
- **Se deja fijo a propósito:** la encuesta SUS (instrumento estándar de 10 preguntas; cambiarla invalida el puntaje) y los estados técnicos (estado del SMS, permisos), de los que depende la lógica.

## 7. Seguridad

- **Secretos fuera del código:** la llave de cifrado (`SISMO_LLAVE_CIFRADO`, base64 de 32 bytes) y los orígenes CORS
  (`SISMO_CORS_ORIGENES`) se leen de variables de entorno del servidor. La app no lleva ninguna clave.
- **Ficha médica:** se cifra antes de guardarse; si el servidor no tiene llave responde 503 y **no la guarda en claro**.
- **Validación estricta** de cada campo (tipos, listas de valores, longitudes, coordenadas, correos, fechas);
  consultas con Query Builder (parámetros escapados, sin concatenar SQL).
- **Aislamiento por usuario:** toda consulta filtra por el `id_usuario` del token.
- **Logs** JSON estructurados con `execution_id`, sin datos personales.
- **CORS** solo para los orígenes de la app (`https://localhost` y `capacitor://localhost` de Capacitor y Vite local).

## 8. Configuración

**App:** en `.env.development` / `.env.production` ponga `VITE_SISMO_API_URL`: la URL del controlador `sismo` del backend, sin
barra final (p. ej. `http://localhost:8080/<ruta>/sismo` en desarrollo y HTTPS en producción). Reinicie `npm run dev` o vuelva
a compilar. En desarrollo (backend en localhost) se acepta cualquier puerto de `localhost`/`127.0.0.1`, porque Vite cambia de puerto si el
suyo está ocupado. En producción solo se aceptan los orígenes de la app (`SISMO_CORS_ORIGENES`).

**Modo de demostración:** solo existe en desarrollo (`npm run dev`). En producción (`npm run build` y el APK) no aparece en
ninguna pantalla (bienvenida, encabezado, configuración) y se apaga solo, borrando los datos ficticios que hubiera. Las
pruebas e2e lo habilitan para su compilación con `VITE_DEMO=true`.

**Servidor:** ejecute el script SQL de las tablas `sismo_*` y defina:

```bash
# Generar la llave (una sola vez; guárdela en el gestor de secretos)
php -r "echo base64_encode(random_bytes(32)), PHP_EOL;"
SISMO_LLAVE_CIFRADO=<llave generada>
SISMO_CORS_ORIGENES=https://localhost,capacitor://localhost,http://localhost:5173
```

## 9. Pruebas

`src/services/syncService.test.ts` (Vitest): diferencias → operaciones, exclusión de datos de demostración, ficha
médica, subida completa del historial, fusión de la cola y el escenario **sin red → con red** (la cola se guarda,
no se envía nada sin conexión y al volver la red se sube en orden) y la **recuperación** (token nuevo, descarga del
estado y código inválido). Además se probaron los endpoints de punta a punta contra la base de datos: registro, ajustes,
contactos, alertas, inventario, encuestas, validación (422), código de recuperación, recuperación (el token anterior queda
inválido y el código no se puede reutilizar) y CORS.

## 10. Pendiente

- Ejecutar el script SQL y configurar las variables en el servidor; probar los endpoints de punta a punta.
- **Aprobación del tratamiento de datos de salud** (ficha médica) y de datos personales de contactos (Ley 1581 de 2012).
- Límite de registros por IP en `POST /registro`.
- Notificaciones push a la app cuando se registra ayuda (hoy la app consulta cada 15 s con la alerta abierta).
- Probar el panel con varios operadores a la vez y definir el protocolo de atención con el equipo de emergencias.
