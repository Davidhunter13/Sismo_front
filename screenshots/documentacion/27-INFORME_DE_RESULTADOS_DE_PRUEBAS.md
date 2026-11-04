> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# 27. Informe de resultados de pruebas — SISMO

| Dato | Valor |
|---|---|
| Fecha de ejecución | 4 de noviembre de 2026 |
| Versión probada | 3.1 (rama `main` de la app + backend del 04/11/2026) |
| Plan de referencia | [26. Plan y casos de prueba](26-PLAN_Y_CASOS_DE_PRUEBA.md) |
| Entorno automático | Windows, Node 24, Chromium de Playwright; app compilada con `VITE_DEMO=true` y sin servidor de sincronización |

## 1. Resumen

| Nivel | Ejecutadas | Superadas | Fallidas | Omitidas | Resultado |
|---|---|---|---|---|---|
| ESLint | todo el proyecto | sin errores | 0 | — | ✅ |
| TypeScript (`tsc -b`) | todo el proyecto | sin errores | 0 | — | ✅ |
| Unitarias (Vitest) | **116** (16 archivos) | **116** | 0 | 0 | ✅ 100 % · 6,7 s |
| E2E (Playwright) | **114** (57 escenarios × 2 proyectos) | **114** | 0 | 0 | ✅ 100 % · 7,5 min · sin pruebas inestables (*flaky*) |
| Manuales del backend | 7 casos (CP-M-01…07) | 6 | 0 | 1 pendiente | ⚠️ ver §4 |
| Manuales del panel | 4 casos (CP-M-08…11) | 1 | 0 | 1 parcial, 2 pendientes | ⚠️ ver §4 |
| Dispositivo físico | CP-M-13 | — | — | pendiente | ⏳ |

**Conclusión:** la app cumple el criterio de salida automático (100 % de las unitarias y de las e2e). Quedan casos manuales pendientes, registrados como riesgos (R-01, R-04, R-07).

## 2. Pruebas e2e por archivo

| Archivo | Móvil | Escritorio | Total |
|---|---|---|---|
| `idioma-y-extras.e2e.spec.ts` | 20 ✅ | 20 ✅ | 40 |
| `funciones.e2e.spec.ts` | 16 ✅ | 16 ✅ | 32 |
| `e2e.spec.ts` | 9 ✅ | 9 ✅ | 18 |
| `registro.e2e.spec.ts` | 6 ✅ | 6 ✅ | 12 |
| `bateria.e2e.spec.ts` | 3 ✅ | 3 ✅ | 6 |
| `puntos-encuentro.e2e.spec.ts` | 3 ✅ | 3 ✅ | 6 |
| **Total** | **57** | **57** | **114** |

## 3. Pruebas unitarias por archivo

| Archivo | Pruebas | Resultado |
|---|---|---|
| `smsService.test.ts` | 22 | ✅ |
| `syncService.test.ts` | 12 | ✅ |
| `geocodeService.test.ts` | 11 | ✅ |
| `susService.test.ts` | 9 | ✅ |
| `routeService.test.ts` | 8 | ✅ |
| `emailService.test.ts` | 7 | ✅ |
| `compassService.test.ts` | 7 | ✅ |
| `metricsService.test.ts` | 7 | ✅ |
| `catalogService.test.ts` | 6 | ✅ |
| `fallDetectionService.test.ts` | 6 | ✅ |
| `quakeService.test.ts` | 6 | ✅ |
| `kitService.test.ts` | 5 | ✅ |
| `drillReminderService.test.ts` | 4 | ✅ |
| `sosRequestService.test.ts` · `storageService.test.ts` · `meetingPoints.test.ts` | 2 · 2 · 2 | ✅ |
| **Total** | **116** | **116 ✅** |

## 4. Casos manuales

| ID | Caso | Resultado | Observación |
|---|---|---|---|
| CP-M-01 | Registro del dispositivo | ✅ | 201 con token; en BD solo el SHA-256 |
| CP-M-02 | Escritura idempotente | ✅ | Reenvío sin duplicados |
| CP-M-03 | Validación | ✅ | 422 con el campo inválido |
| CP-M-04 | CORS | ✅ | Probado; se ajustó para permitir cualquier puerto de `localhost` en desarrollo |
| CP-M-05 | Ficha médica cifrada | ⏳ Pendiente en producción | En el servidor de pruebas faltaba `SISMO_LLAVE_CIFRADO` y la API respondió 503, como debe (no guarda en claro). Falta repetirlo con la llave definida |
| CP-M-06 | Recuperación | ✅ | Token anterior invalidado; código de un solo uso |
| CP-M-07 | Eliminar cuenta | ✅ | Probado de punta a punta: `ok`, token anterior inválido |
| CP-M-08 | Acceso al panel | ✅ | Sin sesión redirige; autorizado entra |
| CP-M-09 | Alerta real al panel | ⏳ Pendiente | Probar con una alerta desde un teléfono real y varios operadores |
| CP-M-10 | Brindar ayuda | ⚠️ Parcial | La app muestra el aviso con la respuesta del servidor (verificado con un servidor simulado). Falta la prueba de punta a punta con el panel y un teléfono real |
| CP-M-11 | Editar catálogos | ⏳ Pendiente | `GET /catalogos` verificado; falta editar desde el panel con sesión |
| CP-M-12 | Correo real a los contactos | ⏳ Pendiente | Las unitarias y las e2e cubren el flujo en la app (envío, reintentos, cancelación, sin servidor). Falta la prueba con el servicio de correo en producción |
| CP-M-13 | Funciones nativas | ⏳ Parcial | Emulador Android 16: widgets, alerta desde el widget, señales nativas y notificación ✅. Falta un teléfono físico |
| CP-M-14 | Página pública | ✅ | `GET /Sismo_info` sin sesión → 200, sin «Ir al panel»; el panel sigue redirigiendo al login |

## 5. Defectos encontrados y corregidos durante el ciclo

| ID | Defecto | Severidad | Corrección | Estado |
|---|---|---|---|---|
| D-01 | 4 e2e de «Después del sismo» esperaban el avance por posición | Media | Pruebas actualizadas al guardado por clave de paso | Cerrado |
| D-02 | El texto de la cuenta regresiva del correo se salía del diálogo | Baja | Tamaño de frase y espacio que no se parte | Cerrado |
| D-03 | Preflight CORS sin la cabecera `Authorization` | Alta | Preflight atendido antes del constructor base | Cerrado |
| D-04 | Error fatal por un método `json()` con nivel de acceso distinto al del controlador base | Alta | Método renombrado | Cerrado |
| D-05 | 401 en ajustes después de registrarse | Media | Nuevo registro inmediato y subida completa | Cerrado |
| D-06 | Pantalla en blanco por pérdida del contexto en recarga en caliente | Baja (solo desarrollo) | Contexto global estable y pantalla de error | Cerrado |
| D-07 | La cuenta regresiva del correo no avanzaba porque la pantalla se redibujaba cada segundo | Alta | Temporizador independiente de los redibujos | Cerrado |

## 6. Recomendaciones

1. Ejecutar CP-M-05, 09, 11, 12 y 13 en el ambiente de producción y en un teléfono físico antes de usar el sistema con personas reales.
2. Agregar pruebas automáticas del backend (por ejemplo, PHPUnit o pruebas de API) para la validación, el cifrado y la recuperación.
3. Mantener las e2e en la integración continua; hoy tardan unos 7,5 minutos.
