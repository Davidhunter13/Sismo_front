> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.
> **Tercera entrega.** Copia actualizada del documento de la segunda entrega (`../../segunda_entrega/documentacion/22-DICCIONARIO_DE_DATOS.md`), que se conserva sin cambios. Aquí solo cambia lo del correo de alerta a los contactos.


# 22. Diccionario de datos — SISMO

Los datos de SISMO viven en dos lugares:

1. **Base de datos del backend** (MySQL / MariaDB): 19 tablas `sismo_*` (tercera entrega: bitácoras `sismo_correos_alertas` y `sismo_correos_operador`, la marca `es_principal_correo` en los contactos, las 4 tablas de insignias y la columna `foto` en `sismo_usuarios`).
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
| `sismo_insignias` | Catálogo de insignias y su regla (todas automáticas) | — |
| `sismo_usuarios_insignias` | Insignias ganadas, con vencimiento opcional y aviso pendiente | 0..n |
| `sismo_acciones_usuarios` | Lo que hace la persona en la app y cuenta para las insignias (máx. una fila por hora) | 0..n |
| `sismo_insignias_auditoria` | Cambios de los operadores en las insignias | — |

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
| `sismo_parametros.clave` (versión de la app) | `app_version_actual` y `app_version_minima` (`versionCode` entero), `app_version_nombre` (p. ej. `1.1`), `app_enlace_tienda` (vacío o `https://…`). Solo las edita el superadministrador; no se envían en `/catalogos` |
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

La app pide el correo al backend: `POST {VITE_SISMO_API_URL}/correo_alerta/{alertId}` con `Authorization: Bearer <token>`.

| Campo | Tipo | Descripción |
|---|---|---|
| `tipo` | `alerta` \| `caida` \| `urgente` \| `atrapado` \| `bateria` \| `ubicacion` | «alerta» = activó la alarma (el principal); «caida» = se activó sola por una caída sin respuesta; los demás, avisos durante la alerta (la ubicación se puede repetir cada 15 min) |
| `mensaje` | texto plano (máx. 4000) | Ubicación, puntos de encuentro, ficha médica si se comparte y batería; el servidor lo escapa antes de armar el HTML |
| `idioma` | `es` \| `en` | Idioma del asunto y del diseño del correo |

**Destinatarios:** no viajan desde la app. El servidor usa los contactos activos de la persona con correo válido: `es_principal_correo = 1` en «Para» y el resto en copia oculta; si ninguno es principal, el primero lo es.

**Dominios de valores nuevos:**

| Campo | Valores |
|---|---|
| `sismo_contactos_usuarios.es_principal_correo` | `1` = «Para»; `0` = copia oculta |
| `sismo_correos_alertas.tipo` | `alerta`, `caida`, `urgente`, `atrapado`, `bateria`, `ubicacion` |
| `sismo_correos_operador.estado` | `enviado`, `fallido` (correo del centro de monitoreo a los contactos) |
| `sismo_plantillas_atenciones.estado` | además de los de «Brindar ayuda», `contactos` (plantillas del correo a los contactos) |
| `sismo_insignias.accion` | `ingreso` (días que abrió la app), `hacer` (un hecho de la app), `simulacro_rapido`, `perfil` (%), `insignias_ganadas` (metas) |
| `sismo_insignias.nivel` | `bronce`, `plata`, `oro`, `diamante`, `especial` |
| `sismo_insignias.periodo_unidad` | `hora`, `dia`, `semana`, `mes` (30 días) |
| `sismo_acciones_usuarios.accion` | `ingreso`, `hecho` (con `referencia = hecho:<clave>` de la lista blanca: registro_completo, ficha_medica, contacto_agregado, contacto_principal, punto_encuentro, mochila_item, mochila_completa, mochila_revisada, foto_perfil, qr_medico, respaldo, simulacro, ver_brujula, ver_ruta, ver_guia, ver_sismos, ver_estadisticas, ver_historial, cambiar_idioma, cambiar_tema, alto_contraste, deteccion_caidas, ahorro_bateria, estoy_a_salvo, avisar_bien, encuesta_sus, post_sismo, mis_insignias) |
| `sismo_insignias_auditoria.evento` | `crear`, `editar`, `activar`, `desactivar`, `subir_imagen`, `subir_bucket` |
| `sismo_usuarios.foto` | ruta en el bucket `sismo/perfil/<archivo>.jpg` o NULL (nunca una URL) |
| `sismo_correos_alertas.estado` | `enviado`, `fallido` |
| `Contact.emailPrimary` (app) | `true` = principal; ausente o `false` = copia oculta |
| `AlertRecord.followUpEmails` (app) | estado por aviso: `{urgente?, atrapado?, bateria?, ubicacion?}` con los mismos valores de `estado_correo` |
| `AlertRecord.lastEmailedLocation` (app) | última ubicación enviada por correo `{latitude, longitude, at}` |

