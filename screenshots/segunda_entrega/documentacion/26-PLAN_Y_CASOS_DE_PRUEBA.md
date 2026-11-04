> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# 26. Plan y casos de prueba — SISMO

Versión 1.0 · 4 de noviembre de 2026.

## 1. Objetivo y alcance

Verificar que SISMO cumple los [requisitos funcionales](19-REQUISITOS_FUNCIONALES.md) y [no funcionales](20-REQUISITOS_NO_FUNCIONALES.md) en la app (web y Android), el backend y el panel de monitoreo.

**Fuera del alcance de las pruebas automáticas:** las funciones nativas de Android (servicio con pantalla bloqueada, linterna, vibración, widget y acceso rápido), que se prueban de forma manual en el emulador o en un dispositivo.

## 2. Niveles de prueba

| Nivel | Herramienta | Qué cubre | Dónde corre |
|---|---|---|---|
| Unitarias | Vitest (16 archivos, **116 pruebas**) | Lógica de servicios: sincronización, catálogos, correo, SMS, sismos, rutas, geocodificación, caídas, SUS, mochila, métricas | Local y CI |
| Extremo a extremo (e2e) | Playwright, proyectos **móvil** (390×844) y **escritorio** (6 archivos, **57 escenarios × 2 = 114 ejecuciones**) | Flujos completos en la app compilada (registro, SOS, correo, idioma, tema, brújula, QR, sin conexión, batería…) | Local y CI |
| Integración del backend | Manual, contra la base de datos de desarrollo | Endpoints de la API, validación, CORS, recuperación, eliminación | Desarrollo |
| Panel | Manual en el navegador | Acceso, monitoreo, atención, catálogos | Desarrollo |
| Dispositivo | Manual (emulador Android 16 / teléfono físico) | Funciones nativas | Emulador / teléfono |
| Calidad estática | ESLint + TypeScript | Estilo y tipos | Local y CI |

## 3. Entorno

- **App:** compilación de producción con `VITE_DEMO=true` y **sin servidor de sincronización** (las e2e no dependen del backend); Chromium de Playwright.
- **Backend:** PHP 7.3 + CodeIgniter 3, base de datos de desarrollo con el script SQL único.
- **Datos:** siempre ficticios (nombres «Demo», teléfonos de prueba, correos `@example.com`).

## 4. Criterios

- **Entrada:** el código compila sin errores de tipos ni de lint.
- **Salida:** el 100 % de las unitarias y de las e2e pasan, y los casos manuales críticos (prioridad Alta) están ejecutados o registrados como pendientes con su riesgo.
- **Defecto bloqueante:** cualquier falla en la alerta SOS, la sincronización o la seguridad de los datos.

## 5. Casos de prueba automáticos

### 5.1 E2E · Registro (`tests/registro.e2e.spec.ts`, 6) — RF-RE
| ID | Caso | Resultado esperado |
|---|---|---|
| CP-E-01 | Los 4 pasos bloquean «Siguiente» hasta completarse | No se avanza sin el dato obligatorio |
| CP-E-02 | Sin terminar el registro, no queda registrado | El SOS sigue disponible |
| CP-E-03 | Contacto desde la agenda | Nombre y teléfono precargados |
| CP-E-04 | Editar o eliminar un contacto agregado | El cambio se refleja en el paso |
| CP-E-05 | SOS durante el registro | Aviso rojo en Inicio y tarjetas con borde rojo |
| CP-E-06 | Confirmaciones y borrar puntos en el registro | Cada acción se confirma |

### 5.2 E2E · Núcleo (`tests/e2e.spec.ts`, 9) — RF-AL, RF-CT, RF-CF
| ID | Caso | Resultado esperado |
|---|---|---|
| CP-E-07 | Todas las rutas cargan | Las 17 pantallas abren sin error |
| CP-E-08 | Navegación inferior y regreso al inicio | Cada pestaña abre la suya |
| CP-E-09 | Activar y finalizar una alerta | El historial se actualiza |
| CP-E-10 | Sin modo demo el canal digital no se simula | Estado real, sin «enviado» ficticio |
| CP-E-11 | Cancelar la confirmación | No se crea la alerta |
| CP-E-12 | Contactos: validación, alta, edición, borrado y persistencia | Datos válidos y persistentes |
| CP-E-13 | Ubicación denegada / de prueba | Mensaje claro y coordenadas rotuladas |
| CP-E-14 | Ubicación con permiso concedido | Usa los datos del dispositivo |
| CP-E-15 | Configuración: nombre, accesibilidad y restablecer | Persisten tras recargar |

### 5.3 E2E · Funciones (`tests/funciones.e2e.spec.ts`, 16) — RF-AL, RF-IN
| ID | Caso | Resultado esperado |
|---|---|---|
| CP-E-16 | Botón 123 y métricas de activación | Enlace `tel:` y tiempos registrados |
| CP-E-17 | El SOS toma la ubicación aunque no haya una guardada | Ubicación en la alerta |
| CP-E-18 | Modo atrapado: pausa y retoma las señales | Señales correctas al entrar y salir |
| CP-E-19 | Simulacro: señal y tiempo de reacción | Tiempo guardado |
| CP-E-20 | Encuesta SUS | Puntaje calculado y guardado |
| CP-E-21 | Mochila: lista base, vencimientos y aviso | Aviso en Inicio |
| CP-E-22 | Detección de caídas | Pregunta «¿Está bien?» y permite pedir ayuda |
| CP-E-23 | Sismos recientes sin ubicación | Solo los de Colombia |
| CP-E-24 | Ficha médica compartida por defecto | Visible en la alerta; se puede desactivar |
| CP-E-25 | Estadísticas | Cuenta alertas y exporta CSV sin datos personales |
| CP-E-26 | «Estoy bien» requiere contactos reales | No se envía a contactos de demostración |
| CP-E-27 | Navegación: engranaje y casita | Vuelve al inicio sin vistas superpuestas |
| CP-E-28 | Escuchar cada sonido | Muestra de sirena y silbato |

### 5.4 E2E · Idioma y extras (`tests/idioma-y-extras.e2e.spec.ts`, 20) — RF-CO, RF-IN, RF-CF, RF-SI
| ID | Caso | Resultado esperado |
|---|---|---|
| CP-E-29 | Correo: al activar pregunta y «No enviar» lo cancela | Estado «cancelado» |
| CP-E-30 | Correo: sin respuesta en 20 s se envía; sin servidor lo indica | Envío automático; estado «sin servidor» si falta la URL |
| CP-E-31 | Correo: sin contactos reales con correo no pregunta | Sin diálogo |
| CP-E-32 | QR médico en la ficha y en la alerta | Imagen PNG del QR visible |
| CP-E-33 | Sin internet: aviso en la alerta y en Inicio | Mensaje de sin conexión |
| CP-E-34 | Idioma inglés en bienvenida, configuración y SOS | Textos en inglés y regreso al español |
| CP-E-35 | Tema oscuro y botón del encabezado | Alterna y vuelve al del sistema |
| CP-E-36 | «Después del sismo» por clave de paso | Avance guardado; cada SOS empieza vacío |
| CP-E-37 | Punto de encuentro por dirección | Busca, elige y guarda |
| CP-E-38 | Brújula y ruta al punto de encuentro | Distancia, dirección, tiempo por modo y enlace a Google Maps |
| CP-E-39 | «Estoy bien» por SMS o WhatsApp por contacto | Se elige el canal |
| CP-E-40 | Recordatorio de simulacro | Lleva al simulacro |

### 5.5 E2E · Puntos de encuentro y batería (7) — RF-CT, RF-AL-07
| ID | Caso | Resultado esperado |
|---|---|---|
| CP-E-41 | Varios puntos: el más cercano guía la brújula | Se puede elegir otro |
| CP-E-42 | Agregar hasta el máximo de 5 | No permite un sexto |
| CP-E-43 | Ubicación automática cada 5 min con la app abierta | Se actualiza sola |
| CP-E-44 | Batería baja en la alerta | Pasa sola al modo ahorro, avisa y respeta volver |
| CP-E-45 | «Nunca» en Configuración | No cambia de modo |
| CP-E-46 | Umbral por defecto | 20 % |

### 5.6 Unitarias (Vitest) — sincronización, correo y lógica
| Archivo | Pruebas | Casos clave |
|---|---|---|
| `syncService.test.ts` | 12 | PUT/DELETE por diferencias, nunca sube datos de demostración, cola sin red que se sube en orden, recuperar (token nuevo, descarta la cola; código inválido no toca nada), eliminar cuenta (con y sin red), 401 → nuevo registro y subida |
| `emailService.test.ts` | 7 | Solo contactos reales con correo, armado del mensaje, sin destinatarios, sin servidor, POST 2xx «enviado», 4xx sin reintento, error de red con reintentos y «fallido» |
| `catalogService.test.ts` | 6 | Catálogos es/en, valores por defecto, rechaza respuestas sin versión, migración del avance por posición, número de emergencia en los textos |
| `smsService.test.ts` | 22 | Texto de alerta, «Estoy bien», batería baja, ficha médica según consentimiento, teléfonos con +57, WhatsApp |
| `quakeService.test.ts` · `routeService.test.ts` · `geocodeService.test.ts` | 6 · 8 · 11 | Filtros por Colombia y radio, rutas y enlaces, búsqueda de direcciones con respaldo |
| `fallDetectionService.test.ts` | 6 | Caída libre + impacto dispara; sacudidas normales no |
| `susService.test.ts` · `metricsService.test.ts` · `kitService.test.ts` | 9 · 7 · 5 | Puntaje SUS, métricas y CSV sin coordenadas ni fórmulas, vencimientos |
| `compassService` · `drillReminderService` · `sosRequestService` · `storageService` · `meetingPoints` | 7 · 4 · 2 · 2 · 2 | Rumbos, recordatorios, pedidos de SOS, migración de datos, punto más cercano |

## 6. Casos de prueba manuales

| ID | Caso | Pasos | Resultado esperado | RF / RNF |
|---|---|---|---|---|
| CP-M-01 | Registro del dispositivo | `POST /registro` | 201 con `uuid_dispositivo` y token; en BD solo el SHA-256 | RF-RE-05, RNF-SE-01 |
| CP-M-02 | Escritura idempotente | Repetir `PUT /contactos/{id}` | Una sola fila | RNF-DI-03 |
| CP-M-03 | Validación | Enviar datos inválidos | 422 con el campo | RNF-SE-06 |
| CP-M-04 | CORS | Petición desde un origen no permitido | Bloqueada por el navegador | RNF-SE-08 |
| CP-M-05 | Ficha médica cifrada | `PUT /ficha_medica` y revisar la BD | `datos_cifrados` ilegible; sin llave, 503 | RNF-SE-02 |
| CP-M-06 | Recuperación | Crear código, `POST /recuperar` | Token nuevo, el anterior recibe 401, el código no se reutiliza | RF-CF-02 |
| CP-M-07 | Eliminar cuenta | `POST /eliminar_cuenta` | `activo = 0` en cascada y datos personales vaciados | RF-CF-03 |
| CP-M-08 | Acceso al panel | Sin sesión / sin autorización / autorizado | Login / 403 / panel | RF-PA-01 |
| CP-M-09 | Alerta real al panel | Activar el SOS desde el teléfono | Aparece en máximo 1 min con aviso | RF-PA-02, RF-PA-03 |
| CP-M-10 | Brindar ayuda | Registrar «Ayuda enviada» | La app muestra el aviso en máximo 15 s | RF-PA-04 |
| CP-M-11 | Editar catálogos | Cambiar un tipo de evento y reabrir la app | La app muestra el cambio | RF-PA-08 |
| CP-M-12 | Correo real | Activar el SOS con el servicio de correo configurado | Los contactos reciben el correo | RF-CO-03, RF-CO-04 |
| CP-M-13 | Funciones nativas | Pantalla bloqueada, linterna, vibración, widget, acceso rápido | Funcionan en el teléfono | RF-AL-01, RF-AL-03 |
| CP-M-14 | Página pública | Abrir `/Sismo_info` sin sesión | 200 sin «Ir al panel» | RF-PI-01 |

## 7. Matriz de trazabilidad (resumen)

| Grupo de requisitos | Casos |
|---|---|
| RF-RE Registro | CP-E-01…06, CP-M-01 |
| RF-AL Alerta SOS | CP-E-09, 11, 16–19, 22, 44–46, CP-M-13 |
| RF-CO Correo | CP-E-29…31, `emailService.test.ts`, CP-M-12 |
| RF-CT Contactos y puntos | CP-E-12, 37, 38, 41–43 |
| RF-IN Información | CP-E-20, 21, 23–25, 32, 40 |
| RF-CF Configuración y cuenta | CP-E-15, 34, 35, `syncService.test.ts`, CP-M-06, CP-M-07 |
| RF-SI Sincronización | CP-E-33, `syncService.test.ts`, `catalogService.test.ts`, CP-M-02 |
| RF-PA Panel | CP-M-08…11 |
| RF-PI Página informativa | CP-M-14 |
