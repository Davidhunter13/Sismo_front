> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# 29. Evidencias visuales del sistema — SISMO

Las capturas ya están en `screenshots/`, separadas por entrega (`primera_entrega/` con la fase 1 y `segunda_entrega/` con las fases 2 y 3) y dentro de cada una por la **fecha en que se tomaron** (el día de cada entrega; el trabajo de cada fase abarca semanas, ver el inventario). Este documento es el índice; la descripción de cada archivo está en la sección 7 de [`../../../docs/segunda_entrega/AVANCES_Y_HOJA_DE_RUTA_2026-11-04.md`](../../../docs/segunda_entrega/AVANCES_Y_HOJA_DE_RUTA_2026-11-04.md).

Todas usan **datos ficticios** (nombres «Demo», teléfonos de prueba, correos `@example.com`).

## Estructura

```
screenshots/<primera|segunda>_entrega/AAAA-MM-DD/
├── codigo/
│   ├── codigo_front/   código de la app
│   └── codigo_back/    código del backend y SQL
└── visual/
    ├── visual_front/   pantallas de la app
    └── visual_back/    panel de monitoreo y página informativa
```

## Inventario

Las evidencias siguen la **planificación del proyecto** (diagramas 15 a 18: del 06/10 al 11/12/2026, 49 días hábiles en 5 fases) y el registro de cambios (documento 30). La **fecha de la carpeta es el día en que se tomaron las capturas**, que coincide con cada entrega. **El trabajo que muestran se hizo durante todo el periodo de su fase**, indicado en la segunda columna. Las fases 1 y 2 corresponden a 4 semanas de trabajo antes de la primera captura del backend.

| Entrega · versión | Fase y periodo de trabajo (plan) | Carpeta (fecha de captura) | Archivos | Qué contiene |
|---|---|---|---|---|
| Versión 1 (0.1 → 1.0) | **Fase 1** · A análisis y requisitos (06/10 – 09/10), B diseño UX/UI e identidad visual (12/10 – 16/10), C prototipo web (19/10 – 23/10) | `primera_entrega/2026-10-24/visual/` | 11 | Primera versión web: bienvenida, inicio, confirmación y alerta activa, ubicación, contactos, historial, guía, configuración, escritorio |
| | | `primera_entrega/2026-10-24/codigo/` | 5 | Estructura del proyecto, dependencias, rutas, botón de pánico y lógica de alertas |
| Versión 2 (1.1 → 2.0) | **Fase 2** · D app Android, E alertas y comunicación, F ubicación y mapas, G supervivencia y validación (en paralelo, 26/10 – 30/10), H calidad, pruebas y APK (02/11) | `segunda_entrega/2026-11-02/visual/visual_front/` | 37 | Registro en 4 pasos, alerta y correo, ahorro de batería, «Estoy bien», mapa real, brújula, ruta, ficha médica, guía, mochila, simulacro, estadísticas, SUS, tema oscuro, inglés, escritorio |
| | | `segunda_entrega/2026-11-02/android/` | 6 | Emulador Android 16: widgets, alerta desde el widget, notificación |
| | | `segunda_entrega/2026-11-02/codigo/codigo_front/` | 13 | Código de la app (servicios, señales, SMS, rutas…) |
| Versión 3 (2.1 → 3.0) | **Fase 3** · I backend, base de datos y sincronización (26/10 – 03/11), J panel de monitoreo y K catálogos, recuperación y correo (04/11) | `segunda_entrega/2026-11-04/visual/visual_front/` | 17 | Pantalla de carga, sin conexión, aviso del centro de monitoreo, respaldo y recuperación, eliminar cuenta, guía y «Después del sismo» desde catálogo, **ficha médica con QR**, **QR escaneado por un rescatista**, sismos recientes |
| | | `segunda_entrega/2026-11-04/visual/visual_back/` | 12 | Panel: alertas y mapa, brindar ayuda, detalle de la persona, sismos recientes, usuarios, catálogos, guía, parámetros, loader; **página informativa** en escritorio y celular |
| | | `segunda_entrega/2026-11-04/codigo/codigo_front/` | 12 | Cola sin conexión, reintentos, recuperación, eliminar cuenta, catálogos, avisos, modo demo |
| | | `segunda_entrega/2026-11-04/codigo/codigo_back/` | 12 | Tablas SQL, rutas de la API, validación y CORS, escritura idempotente, cifrado, recuperación, catálogos, USGS, panel |
| Versión 3.2 (en curso) | **Fase 3** · L página informativa, ajustes y documentación (05/11 – 06/11) | `segunda_entrega/2026-11-05/visual/visual_front/` | 8 | Sismos con **gráfica de picos** y **mapa con ondas**, aviso de alerta activa en otra pantalla, «Estoy a salvo» fijo abajo, paso «Protección» del registro, **«Necesito ayuda urgente»** (botón y estado), tarjetas de Inicio que avisan qué falta |
| | | `segunda_entrega/2026-11-05/visual/visual_back/` | 9 | «Brindar ayuda» con **editor enriquecido** y plantilla, **mensajes de ayuda** (lista y edición con comodines), sismos con gráfica de picos y mapa, **evento masivo**, **prioridad** y **filtros por criticidad**, **página informativa actualizada** |
| | | `segunda_entrega/2026-11-05/codigo/codigo_front/` | 10 | Limpiador de texto enriquecido, mensaje con formato, ayuda urgente, caída urgente o sin respuesta, prioridad en el estado, aviso de alerta activa, Inicio que avisa qué falta, gráfica de picos, mapa con ondas, paso «Protección» |
| | | `segunda_entrega/2026-11-05/codigo/codigo_back/` | 10 | Limpieza HTML en el servidor, tabla de plantillas, columnas de prioridad, guardar plantilla, prioridad en la API, pulso del panel, editor y comodines, evento masivo, filtros por criticidad |

**Próximas evidencias según el plan:** fase 4 (09/11 – 27/11: puesta en producción, prueba en dispositivo físico, correo en producción y aprobación Ley 1581) y fase 5 (30/11 – 11/12: validación con usuarios, ajustes y entrega final). Se guardarán en `segunda_entrega/AAAA-MM-DD/` con la fecha de cada captura.

**Total: 162 evidencias.** Front: 79 visuales (6 de ellas de Android) y 40 de código. Back: 21 visuales y 22 de código.

## Evidencias por requisito clave

| Requisito | Evidencia |
|---|---|
| RF-RE-02 Registro | `segunda_entrega/2026-11-02/visual/visual_front/02-…06-registro-*.png` |
| RF-AL-01…04 Alerta SOS | `segunda_entrega/2026-11-02/visual/visual_front/08-sos-tipo-de-evento.png`, `10-alerta-activa.png` |
| RF-CO-01 Correo | `segunda_entrega/2026-11-02/visual/visual_front/09-alerta-pregunta-correo.png`, `segunda_entrega/2026-11-04/visual/visual_front/05-alerta-ayuda-del-centro-de-monitoreo.png` |
| RF-IN-02 QR médico | `segunda_entrega/2026-11-04/visual/visual_front/14-ficha-medica-qr.png`, `15-qr-escaneado-por-un-rescatista.png` |
| RF-SI-03 Sin conexión | `segunda_entrega/2026-11-04/visual/visual_front/02-…04-*-sin-conexion*.png` |
| RF-PA-02…04 Panel | `segunda_entrega/2026-11-04/visual/visual_back/01-panel-alertas-activas-y-mapa.png`, `02-panel-brindar-ayuda.png`, `segunda_entrega/2026-11-04/visual/visual_front/13-alerta-aviso-del-centro.png` |
| RF-PA-08 Catálogos | `segunda_entrega/2026-11-04/visual/visual_back/06-…09-panel-*.png` |
| RF-PI-01 Página informativa | `segunda_entrega/2026-11-04/visual/visual_back/11-pagina-informativa-escritorio.png`, `12-pagina-informativa-celular.png` |
| Plantillas y editor de «Brindar ayuda» | `segunda_entrega/2026-11-05/visual/visual_back/01-panel-brindar-ayuda-con-plantilla.png`, `02-panel-catalogos-mensajes-de-ayuda.png`, `03-panel-editar-plantilla-de-mensaje.png` |
| Prioridad de alertas | `segunda_entrega/2026-11-05/visual/visual_front/06-alerta-boton-necesito-ayuda-urgente.png`, `segunda_entrega/2026-11-05/visual/visual_back/07-panel-prioridad-de-alertas.png`, `08-panel-filtros-por-criticidad.png` |

Los diagramas técnicos están en [`../diagramas/DIAGRAMAS.md`](../diagramas/DIAGRAMAS.md).
