> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# SISMO: diagramas · tercera entrega

En la tercera entrega **solo están los diagramas que cambiaron**, tomando como base los de la segunda entrega (que se conservan en [`../../segunda_entrega/diagramas/DIAGRAMAS.md`](../../segunda_entrega/diagramas/DIAGRAMAS.md)). Los demás siguen vigentes allí.

| # | Imagen | Qué cambió |
|---|---|---|
| 1 | `1-uml-y-funcionales/01a-casos-de-uso-persona-usuaria.png` | Nuevos casos «Avisar por correo a los contactos», «Marcar contacto principal del correo», «Poner foto de perfil», «Ganar insignias», «Ver Mis insignias y Perfil completado», «Descargar la app para Android» y «Actualizar la app» |
| 1 | `1-uml-y-funcionales/01b-casos-de-uso-operador-centro-de-monitoreo.png` | Nuevos casos «Enviar correo a los contactos de la persona», «Ver los correos enviados», «Administrar insignias», «Subir imágenes al bucket», «Ver foto, insignias y perfil» y «Publicar el APK y la versión» |
| 2 | `1-uml-y-funcionales/02b-actividades-persona-alerta-sos-y-correo.png` | El correo se pide al API; respuestas enviado, sin destinatarios y fallido; avisos por urgente, atrapado y batería |
| 3 | `1-uml-y-funcionales/03a-secuencia-persona-alerta-sos-y-correo.png` | App → API `correo_alerta` → modelo (destinatarios desde la BD, bitácora y límite) → `PHP_Mailer` → servicio de correo → contactos |
| 3 | `1-uml-y-funcionales/03e-secuencia-operador-correo-a-los-contactos.png` | **Nuevo:** el operador escribe a los contactos desde el panel (lista blanca, límite, `Sismo_correo`, bitácora) |
| 3 | `1-uml-y-funcionales/03f-secuencia-persona-gana-insignias.png` | **Nuevo:** acciones (cola sin internet) → API → registrar y evaluar → «¡Ganaste!» (en cola si hay alerta activa) |
| 3 | `1-uml-y-funcionales/03g-secuencia-persona-foto-de-perfil.png` | **Nuevo:** foto → reescalada → bucket `sismo/perfil/` → URL firmada de 15 min (se renueva) → panel y correos |
| 3 | `1-uml-y-funcionales/03h-secuencia-persona-actualizar-la-app.png` | **Nuevo:** subir el APK (bucket `sismo/app/`) → versión en `sismo_parametros` → `GET /version` → aviso sugerido u obligatorio → tienda o descarga firmada |
| 4 | `1-uml-y-funcionales/04a-clases-backend.png` | `correo_alerta()`, `correo_contactos()`, `insignias()`, `foto()`, `version()`, `Sismo_info::android()`, `apk_*` del panel, endpoints de insignias del panel; `Sismo_insignias_model`; librerías `Sismo_correo`, `Sismo_insignias_reglas`, `Sismo_foto`, `Archivos_bucket` y `PHP_Mailer` |
| 12 | `3-base-de-datos/12-entidad-relacion.png` | 19 tablas: bitácoras de correo, las 4 tablas de insignias y la foto de perfil, con sus relaciones |
| 13 | `3-base-de-datos/13-modelo-logico.png` | Columnas de las bitácoras de correo, `es_principal_correo`, `foto` y las tablas de insignias |
| 14 | `3-base-de-datos/14-modelo-fisico.png` | Modelo físico generado desde los scripts SQL (incluye `2026-11-05-sismo-correos-alertas.sql` y `2026-11-05-sismo-insignias.sql`) |

El diccionario de datos actualizado está en [`BASE_DE_DATOS_SISMO.md`](BASE_DE_DATOS_SISMO.md).

**Regenerar las imágenes** (desde la raíz del proyecto): `npm i --no-save mermaid@11.4.1` y `node screenshots/tercera_entrega/diagramas/fuentes/generar-imagenes.cjs`.
