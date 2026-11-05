> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# SISMO: diagramas · tercera entrega

En la tercera entrega **solo están los diagramas que cambiaron**, tomando como base los de la segunda entrega (que se conservan en [`../../segunda_entrega/diagramas/DIAGRAMAS.md`](../../segunda_entrega/diagramas/DIAGRAMAS.md)). Los demás siguen vigentes allí.

| # | Imagen | Qué cambió |
|---|---|---|
| 1 | `1-uml-y-funcionales/01a-casos-de-uso-persona-usuaria.png` | Nuevos casos «Avisar por correo a los contactos» y «Marcar contacto principal del correo» |
| 1 | `1-uml-y-funcionales/01b-casos-de-uso-operador-centro-de-monitoreo.png` | Nuevos casos «Enviar correo a los contactos de la persona» y «Ver los correos enviados» |
| 2 | `1-uml-y-funcionales/02b-actividades-persona-alerta-sos-y-correo.png` | El correo se pide al API; respuestas enviado, sin destinatarios y fallido; avisos por urgente, atrapado y batería |
| 3 | `1-uml-y-funcionales/03a-secuencia-persona-alerta-sos-y-correo.png` | App → API `correo_alerta` → modelo (destinatarios desde la BD, bitácora y límite) → `PHP_Mailer` → servicio de correo → contactos |
| 3 | `1-uml-y-funcionales/03e-secuencia-operador-correo-a-los-contactos.png` | **Nuevo:** el operador escribe a los contactos desde el panel (lista blanca, límite, `Sismo_correo`, bitácora) |
| 4 | `1-uml-y-funcionales/04a-clases-backend.png` | `correo_alerta()`, `correo_contactos()`, librerías `Sismo_correo` y `PHP_Mailer`, métodos de correo del modelo |
| 12 | `3-base-de-datos/12-entidad-relacion.png` | 15 tablas: `sismo_correos_alertas` y `sismo_correos_operador` con sus relaciones |
| 13 | `3-base-de-datos/13-modelo-logico.png` | Columnas de las dos bitácoras de correo y `es_principal_correo` |
| 14 | `3-base-de-datos/14-modelo-fisico.png` | Modelo físico generado desde los scripts SQL (incluye `2026-11-05-sismo-correos-alertas.sql`) |

El diccionario de datos actualizado está en [`BASE_DE_DATOS_SISMO.md`](BASE_DE_DATOS_SISMO.md).

**Regenerar las imágenes** (desde la raíz del proyecto): `npm i --no-save mermaid@11.4.1` y `node screenshots/tercera_entrega/diagramas/fuentes/generar-imagenes.cjs`.
