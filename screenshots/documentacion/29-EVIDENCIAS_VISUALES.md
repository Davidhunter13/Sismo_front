> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# 29. Evidencias visuales del sistema — SISMO

Las capturas ya están en `screenshots/`, organizadas por la **fecha en que se tomaron**. Este documento es el índice; la descripción de cada archivo está en la sección 7 de [`../../docs/segunda_entrega/AVANCES_Y_HOJA_DE_RUTA_2026-11-04.md`](../../docs/segunda_entrega/AVANCES_Y_HOJA_DE_RUTA_2026-11-04.md).

Todas usan **datos ficticios** (nombres «Demo», teléfonos de prueba, correos `@example.com`).

## Estructura

```
screenshots/AAAA-MM-DD/
├── codigo/
│   ├── codigo_front/   código de la app
│   └── codigo_back/    código del backend y SQL
└── visual/
    ├── visual_front/   pantallas de la app
    └── visual_back/    panel de monitoreo y página informativa
```

## Inventario

| Entrega | Carpeta | Archivos | Qué contiene |
|---|---|---|---|
| Versión 1 · 24/10/2026 | `2026-10-24/visual/` | 11 | Primera versión web: bienvenida, inicio, confirmación y alerta activa, ubicación, contactos, historial, guía, configuración, escritorio |
| | `2026-10-24/codigo/` | 5 | Estructura del proyecto, dependencias, rutas, botón de pánico y lógica de alertas |
| Versión 2 · 02/11/2026 | `2026-11-02/visual/visual_front/` | 37 | Registro en 4 pasos, alerta y correo, ahorro de batería, «Estoy bien», mapa real, brújula, ruta, ficha médica, guía, mochila, simulacro, estadísticas, SUS, tema oscuro, inglés, escritorio |
| | `2026-11-02/android/` | 6 | Emulador Android 16: widgets, alerta desde el widget, notificación |
| | `2026-11-02/codigo/codigo_front/` | 13 | Código de la app (servicios, señales, SMS, rutas…) |
| Versión 3 · 04/11/2026 | `2026-11-04/visual/visual_front/` | 17 | Pantalla de carga, sin conexión, aviso del centro de monitoreo, respaldo y recuperación, eliminar cuenta, guía y «Después del sismo» desde catálogo, **ficha médica con QR**, **QR escaneado por un rescatista**, sismos recientes |
| | `2026-11-04/visual/visual_back/` | 12 | Panel: alertas y mapa, brindar ayuda, detalle de la persona, sismos recientes, usuarios, catálogos, guía, parámetros, loader; **página informativa** en escritorio y celular |
| | `2026-11-04/codigo/codigo_front/` | 12 | Cola sin conexión, reintentos, recuperación, eliminar cuenta, catálogos, avisos, modo demo |
| | `2026-11-04/codigo/codigo_back/` | 12 | Tablas SQL, rutas de la API, validación y CORS, escritura idempotente, cifrado, recuperación, catálogos, USGS, panel |

**Total: 125 evidencias.** Front: 71 visuales (6 de ellas de Android) y 30 de código. Back: 12 visuales y 12 de código.

## Evidencias por requisito clave

| Requisito | Evidencia |
|---|---|
| RF-RE-02 Registro | `2026-11-02/visual/visual_front/02-…06-registro-*.png` |
| RF-AL-01…04 Alerta SOS | `2026-11-02/visual/visual_front/08-sos-tipo-de-evento.png`, `10-alerta-activa.png` |
| RF-CO-01 Correo | `2026-11-02/visual/visual_front/09-alerta-pregunta-correo.png`, `2026-11-04/visual/visual_front/05-alerta-ayuda-del-centro-de-monitoreo.png` |
| RF-IN-02 QR médico | `2026-11-04/visual/visual_front/14-ficha-medica-qr.png`, `15-qr-escaneado-por-un-rescatista.png` |
| RF-SI-03 Sin conexión | `2026-11-04/visual/visual_front/02-…04-*-sin-conexion*.png` |
| RF-PA-02…04 Panel | `2026-11-04/visual/visual_back/01-panel-alertas-activas-y-mapa.png`, `02-panel-brindar-ayuda.png`, `2026-11-04/visual/visual_front/13-alerta-aviso-del-centro.png` |
| RF-PA-08 Catálogos | `2026-11-04/visual/visual_back/06-…09-panel-*.png` |
| RF-PI-01 Página informativa | `2026-11-04/visual/visual_back/11-pagina-informativa-escritorio.png`, `12-pagina-informativa-celular.png` |

Los diagramas técnicos están en [`../diagramas/DIAGRAMAS.md`](../diagramas/DIAGRAMAS.md).
