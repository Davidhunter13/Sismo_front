> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# 22. Diccionario de datos — SISMO

Los datos de SISMO viven en dos lugares:

1. **Base de datos del backend** (MySQL / MariaDB): 13 tablas `sismo_*` (incluidas las plantillas de mensaje de «Brindar ayuda», `sismo_plantillas_atenciones`).
2. **Almacenamiento local del teléfono** (`localStorage`): copia de trabajo de la app, cola sin conexión y caché.

## 1. Base de datos del backend

El diccionario completo, tabla por tabla, está en **[`../diagramas/BASE_DE_DATOS_SISMO.md`](../diagramas/BASE_DE_DATOS_SISMO.md)**. Incluye cada columna con su tipo, si acepta nulos, su valor por defecto y su descripción, además de índices, claves foráneas, valores iniciales y protección de datos personales. Los modelos gráficos están en `../diagramas/3-base-de-datos/` (DER, lógico y físico).

| Tabla | Descripción | Filas por persona |
|---|---|---|
| `sismo_usuarios` | Dispositivo registrado (token y código de recuperación como SHA-256) | 1 |
| `sismo_ajustes_usuarios` | Configuración y última ubicación | 0..1 |
| `sismo_contactos_usuarios` | Contactos de emergencia | 0..n |
| `sismo_alertas_usuarios` | Alertas SOS y métricas | 0..n |
| `sismo_fichas_medicas_usuarios` | Ficha médica cifrada AES-256-GCM | 0..1 |
| `sismo_puntos_encuentro_usuarios` | Puntos de encuentro | 0..n |
| `sismo_encuestas_sus_usuarios` | Encuestas SUS | 0..n |
| `sismo_inventarios_usuarios` | Mochila / kit de emergencia | 0..n |
| `sismo_atenciones_alertas` | Ayuda registrada por el operador | 0..n por alerta |
| `sismo_catalogos` | Listas administrables | — |
| `sismo_guia_tarjetas` | Guía de emergencia | — |
| `sismo_parametros` | Parámetros generales | — |

## 2. Dominios de valores (listas cerradas)

| Campo | Valores permitidos |
|---|---|
| `sismo_usuarios.plataforma` | `android`, `ios`, `web` |
| `sismo_alertas_usuarios.estado` | `activa`, `finalizada` |
| `sismo_alertas_usuarios.estado_canal_digital` | `pendiente`, `enviada`, `fallida`, `no_disponible`, `sms_abierto` |
| `sismo_alertas_usuarios.estado_correo` | `enviado`, `cancelado`, `sin_servidor`, `sin_destinatarios`, `fallido`; `NULL` = no se preguntó |
| `sismo_alertas_usuarios.origen_activacion` | `app`, `acceso_rapido`, `widget`, `deteccion_automatica` |
| `sismo_alertas_usuarios.tipo_evento` | Clave del catálogo `tipo_evento` (`^[a-z0-9_]{1,40}$`; `sismo` y `emergencia_general` siempre existen) |
| `origen_ubicacion`, `origen_ultima_ubicacion` | `dispositivo`, `prueba` |
| `sismo_ajustes_usuarios.permiso_ubicacion` | `concedido`, `denegado`, `no_disponible`, `sin_solicitar` |
| `sismo_ajustes_usuarios.idioma` | `es`, `en` |
| `sismo_ajustes_usuarios.tema` | `sistema`, `claro`, `oscuro` |
| `sismo_ajustes_usuarios.sonido_alarma` | `sirena`, `silbato` |
| `sismo_atenciones_alertas.estado` | `en_atencion`, `ayuda_enviada`, `resuelta` |
| `sismo_catalogos.tipo` | `tipo_evento`, `parentesco`, `item_kit`, `paso_post_sismo`, `tipo_sangre` |
| `sismo_guia_tarjetas.momento` | `antes`, `durante`, `despues` |
| `sismo_parametros.tipo` | `texto`, `numero`, `lista` |
| `activo` (todas las tablas) | `1` = activo, `0` = inactivo (borrado lógico) |

## 3. Almacenamiento local de la app (`localStorage`)

| Clave | Contenido | Se borra al eliminar la cuenta |
|---|---|---|
| `sismo:v1:data` | `AppData`: ajustes, contactos, alertas, alerta activa, última ubicación, permiso de ubicación, ficha médica, puntos de encuentro, encuestas SUS, kit y avance de «Después del sismo» | Sí |
| `sismo:v1:outbox` | Cola de operaciones pendientes de subir (método, ruta, cuerpo), agrupadas por recurso | Sí |
| `sismo:v1:dispositivo` | `uuid_dispositivo` y token del dispositivo | Sí |
| `sismo:v1:catalogos` | Última copia de los catálogos, la guía y los parámetros (con su versión) | No (es contenido público) |
| `sismo:v1:ayuda_cerrada` | Último aviso del centro de monitoreo que la persona cerró, para no volver a mostrarlo | Sí |

### Estructura de `AppData` (resumen)

| Campo | Tipo | Equivale en el servidor a |
|---|---|---|
| `settings` | `Settings` (nombre, señales, sonido, idioma, tema, caídas, batería, accesibilidad, `onboarded`) | `sismo_usuarios.nombre` + `sismo_ajustes_usuarios` |
| `contacts[]` | `Contact` (id, name, relationship, phone, email, createdAt) | `sismo_contactos_usuarios` |
| `alerts[]` | `AlertRecord` (id, eventType, status, fechas, location, digitalStatus, emailStatus, isDrill, source, metrics, postQuakeDone) | `sismo_alertas_usuarios` |
| `medical` | `MedicalInfo` (bloodType, allergies, medications, conditions, notes, showOnAlert) | `sismo_fichas_medicas_usuarios` (cifrada) |
| `meetingPoints[]` | `MeetingPoint` (id, label, latitude, longitude) | `sismo_puntos_encuentro_usuarios` |
| `susResponses[]` | `SusResponse` (id, answeredAt, answers[10], score, drillAlertId) | `sismo_encuestas_sus_usuarios` |
| `kit` | `EmergencyKit` (items[], lastReviewedAt) | `sismo_inventarios_usuarios` + `fecha_ultima_revision_kit` |
| `lastLocation`, `locationPermission`, `postQuakeDone` | ubicación, permiso, claves de pasos | columnas de `sismo_ajustes_usuarios` |

## 4. Contrato del correo de alerta

| Campo | Tipo | Descripción |
|---|---|---|
| `alertId` | texto (UUID) | Alerta que origina el correo |
| `eventType` | texto | Clave del tipo de evento |
| `activatedAt` | texto ISO-8601 | Hora de activación |
| `language` | `es` \| `en` | Idioma del mensaje |
| `sender.name` | texto | Nombre de la persona |
| `recipients[]` | `{name, email}` | Contactos reales con correo |
| `subject`, `body` | texto | Asunto y cuerpo (ubicación, puntos de encuentro, ficha médica si se comparte, batería) |
| `location` | `{latitude, longitude, accuracy}` \| `null` | Última ubicación |
