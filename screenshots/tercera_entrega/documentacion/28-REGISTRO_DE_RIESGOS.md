> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.
> **Tercera entrega.** Copia actualizada del documento de la segunda entrega (`../../segunda_entrega/documentacion/28-REGISTRO_DE_RIESGOS.md`), que se conserva sin cambios. Aquí solo cambia lo del correo de alerta a los contactos.


# 28. Registro de riesgos del proyecto — SISMO

Versión 1.0 · 4 de noviembre de 2026.

**Escala:** probabilidad (P) e impacto (I) de 1 (bajo) a 3 (alto). **Nivel = P × I**: 1–2 bajo, 3–4 medio, 6–9 alto.

| ID | Riesgo | Categoría | P | I | Nivel | Mitigación / control | Responsable | Estado |
|---|---|---|---|---|---|---|---|---|
| R-01 | Las funciones nativas (servicio con pantalla bloqueada, linterna, vibración, widget) fallan en teléfonos reales distintos del emulador | Técnico | 2 | 3 | **6 Alto** | Probadas en el emulador Android 16; plan de prueba en dispositivo físico (CP-M-13) antes de usuarios reales | Desarrollo | Abierto |
| R-02 | Tras un sismo la red está saturada y no salen ni el SMS ni el correo | Operativo | 3 | 3 | **9 Alto** | Señales locales sin internet, QR médico sin internet, cola sin conexión, varios canales (SMS, WhatsApp, correo, llamada) | Producto | Mitigado parcialmente |
| R-03 | El SMS y el WhatsApp dependen de que la persona toque «Enviar» | Funcional | 2 | 3 | **6 Alto** | Correo automático a los 20 s sin respuesta; la app nunca dice que el SMS salió si no se confirma | Producto | Mitigado parcialmente |
| R-04 | El servicio de correo de alertas no está disponible | Técnico | 2 | 3 | **6 Alto** | Dos reintentos con espera, estado «fallido» visible y botón para reintentar; otros canales disponibles | Infraestructura | Abierto |
| R-05 | Exposición de datos de salud o de contactos | Seguridad / legal | 1 | 3 | **3 Medio** | Ficha cifrada AES-256-GCM, tokens como SHA-256, acceso al panel restringido y registrado, CSRF, supresión al eliminar la cuenta | Desarrollo + seguridad | Controlado |
| R-06 | Pérdida o filtración de la llave de cifrado | Seguridad | 1 | 3 | **3 Medio** | La llave vive solo en el servidor (variable de entorno), nunca en código ni BD; la custodia infraestructura. Si se pierde, las fichas no se pueden descifrar | Infraestructura | Controlado |
| R-07 | Tratamiento de datos sin aprobación formal (Ley 1581) | Legal | 2 | 3 | **6 Alto** | Consentimiento explícito para la ficha; aprobación pendiente antes de usar el servidor con usuarios reales | Dirección / jurídica | Abierto |
| R-08 | Registro masivo de dispositivos falsos | Seguridad | 2 | 2 | **4 Medio** | Validación de entrada y límite de cuerpo; pendiente un límite de registros por IP | Desarrollo | Abierto |
| R-09 | La persona no ve la ayuda del operador si cierra la pantalla de alerta | Funcional | 2 | 2 | **4 Medio** | Aviso fijo mientras la alerta está abierta (consulta cada 15 s); las notificaciones push quedan fuera del alcance | Desarrollo | Aceptado |
| R-10 | Falsas alarmas o caídas no detectadas por umbrales sin calibrar | Funcional | 2 | 2 | **4 Medio** | Confirmación antes de activar; detección de caídas opcional; calibración con pruebas reales pendiente | Desarrollo | Abierto |
| R-11 | Ubicación imprecisa (interiores, escritorio) | Técnico | 2 | 2 | **4 Medio** | Afinado de GPS de hasta 10 s, precisión visible en mensajes y panel, actualización cada 2 min | Desarrollo | Mitigado |
| R-12 | Dependencia de servicios gratuitos externos (USGS, OpenStreetMap, ruteo, geocodificación) | Dependencias | 2 | 1 | **2 Bajo** | Caché del USGS, mensajes de error, dos fuentes de geocodificación, la brújula funciona sin internet | Desarrollo | Mitigado |
| R-13 | Conflictos de datos si se usa la cuenta en dos teléfonos | Técnico | 1 | 2 | **2 Bajo** | La recuperación revoca el teléfono anterior (un solo dispositivo activo); la sincronización sube del teléfono al servidor | Desarrollo | Controlado |
| R-14 | Sin versión para iPhone | Alcance | 3 | 2 | **6 Alto** | Versión web disponible (sin linterna ni vibración en Safari); proyecto iOS en la hoja de ruta | Producto | Aceptado |
| R-15 | Traducciones al inglés sin validación técnica | Calidad | 2 | 1 | **2 Bajo** | Validación por una persona con criterio técnico pendiente | Producto | Abierto |
| R-16 | El ambiente de desarrollo depende de un túnel a la base de datos en la nube | Operativo | 2 | 1 | **2 Bajo** | Documentado en el manual técnico; reiniciar el túnel si se congela | Desarrollo | Controlado |
| R-17 | Código generado con IA aceptado sin revisión | Calidad / gobierno | 1 | 2 | **2 Bajo** | Política ODTI012: nota de transparencia, revisión humana, pruebas automáticas en CI | Desarrollo | Controlado |
| R-18 | Uso del correo de alerta para enviar mensajes no deseados | Baja | Medio | Destinatarios solo desde los contactos guardados, token del teléfono, un envío por alerta y tipo, máximo 8 por hora y nada en simulacros | Mitigado |
| R-19 | El token del servicio de correo queda expuesto | Media | Alto | Se lee de la variable de entorno `CORREO_SERVICIO_TOKEN`; las versiones anteriores de la librería lo tenían en el código: conviene rotarlo | Abierto |

## Mapa de calor

| Probabilidad \ Impacto | 1 (bajo) | 2 (medio) | 3 (alto) |
|---|---|---|---|
| **3 (alta)** | — | R-14 | R-02 |
| **2 (media)** | R-12, R-15, R-16 | R-08, R-09, R-10, R-11 | R-01, R-03, R-04, R-07 |
| **1 (baja)** | — | R-13, R-17 | R-05, R-06 |

## Seguimiento

Revisar este registro en cada entrega. Antes de usar el sistema con usuarios reales, los riesgos **R-01, R-04 y R-07** deben quedar cerrados (prueba en dispositivo físico, servicio de correo en producción y aprobación del tratamiento de datos).
