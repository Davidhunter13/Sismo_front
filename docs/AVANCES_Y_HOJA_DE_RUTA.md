> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# SISMO — Avances implementados y hoja de ruta

Documento de seguimiento del prototipo SISMO (botón de pánico para emergencias sísmicas).
Resume las funciones agregadas, las decisiones de diseño, las limitaciones conocidas y las mejoras pendientes.

Repositorio: <https://github.com/Davidhunter13/Sismo_front>

---

## 1. Resumen

| Área | Versión inicial | Estado actual |
|---|---|---|
| Plataforma | Solo web | Web + app Android (Capacitor) con ícono, widget y acceso rápido |
| Sirena | Había que tocar «Iniciar sonido» | Suena al confirmar el SOS; en Android sigue con la pantalla bloqueada |
| Señal visual | Parpadeo sutil de la tarjeta | Destello de la tarjeta + linterna del teléfono en código SOS |
| Vibración | No existía | Vibración en patrón SOS |
| Pantalla | Se bloqueaba sola | Permanece encendida durante la alerta |
| Llamada de emergencia | No existía | Botón «Llamar al 123» |
| Canal digital | Solo simulación | SMS a contactos con ubicación y punto de encuentro + SMS «Estoy bien» al finalizar |
| Ubicación | Una lectura al tocar un botón | Afinado de GPS (hasta 10 s) y actualización cada 2 min durante la alerta |
| Mapa | Esquema SVG | Pestañas «Esquema» y «Mapa real» (OpenStreetMap) con punto de encuentro |
| Información | Guía de emergencia | + Sismos recientes (USGS) y ficha médica opcional |
| Validación | Sin datos | Métricas de tiempo por activación, simulacro con cronómetro, estadísticas y CSV |
| Pruebas automáticas | 18 pruebas e2e | 30 pruebas e2e (móvil y escritorio) |

---

## 2. Funciones implementadas

### 2.1 Señales locales de la alerta

| Señal | Comportamiento | Android | Navegador |
|---|---|---|---|
| Sirena | Se activa al confirmar el SOS; «Silenciar / Reactivar» | Servicio nativo (`AudioTrack`, uso «alarma»); sigue con la pantalla bloqueada; se puede silenciar desde la notificación | Web Audio API |
| Linterna SOS | Destella ··· ––– ··· (unidad 250 ms); depende de «Señal visual» | `CameraManager.setTorchMode` en el servicio; **no pide permiso de cámara** | Cámara con restricción `torch` (Chrome Android + HTTPS) |
| Vibración SOS | Mismo ritmo que la linterna | Servicio nativo (`Vibrator`) | Vibration API (Chrome Android) |
| Destello de la tarjeta | Rojo intenso / rojo claro cada 0,6 s | Igual | Igual |
| Pantalla encendida | Mientras haya alerta activa | `FLAG_KEEP_SCREEN_ON` | Screen Wake Lock API |

- Las señales arrancan dentro del toque de confirmación, porque los navegadores bloquean audio, cámara y vibración sin un gesto del usuario.
- El destello no supera 3 por segundo (WCAG 2.3.1) para proteger a personas con fotosensibilidad.
- Archivos: `src/services/signalsService.ts`, `sirenService.ts`, `torchService.ts`, `vibrationService.ts`, `screenService.ts`; `android/.../AlertService.java`.

### 2.2 Activación sin abrir la app (Android)

- **Acceso rápido «SOS SISMO»** en el panel de ajustes rápidos (`SosTileService.java`).
- **Widget SOS** para la pantalla de inicio (`SosWidgetProvider.java`).
- Ambos abren SISMO con el diálogo de SOS listo. La confirmación se mantiene para evitar activaciones accidentales (por ejemplo, en el bolsillo).
- Cada alerta registra su origen (`app` o `acceso_rapido`) para comparar tiempos.

### 2.3 Comunicación

- **Llamar al 123:** abre el marcador con el número listo.
- **SMS de alerta:** abre la app de mensajes con los contactos reales y el aviso: tipo de evento, ubicación (con precisión), punto de encuentro y resumen de la ficha médica (si «Compartir» está activo). Estado honesto «SMS abierto», porque SISMO no puede verificar el envío.
- **SMS «Estoy bien»:** al finalizar la alerta se ofrece avisar a los contactos que la persona está a salvo.
- Los contactos de demostración (ficticios) nunca reciben SMS.

### 2.4 Ubicación

- Afinado del GPS: escucha hasta 10 s y conserva la lectura más precisa (para antes si llega a ±25 m).
- **Durante la alerta** se actualiza al activarla y cada 2 minutos si hay permiso. Se guarda en el dispositivo y el SMS usa la más reciente. Se cuentan las actualizaciones por alerta.
- **Punto de encuentro:** se guarda desde la ubicación actual o tocando el mapa real. Se muestra en verde en el mapa y se incluye en el SMS.

### 2.5 Información

- **Sismos recientes:** catálogo público del USGS (magnitud ≥ 2,5, últimas 24 h o 7 días). Filtra a 500 km de la última ubicación real o, si no hay, a Colombia. La ubicación no se envía: se descarga el listado general y se filtra en el dispositivo. Los datos externos se validan antes de usarse.
- **Ficha médica:** tipo de sangre, alergias, medicamentos, condiciones y notas, guardados en el teléfono. La opción **«Compartir en la alerta y en el SMS» viene activada por defecto**: la ficha se muestra en la pantalla de alerta y se incluye en el SMS a los contactos. El usuario puede desactivarla o borrar la ficha.

### 2.6 Validación: métricas, simulacro y estadísticas

- **Marcas de tiempo por activación:** toque de SOS, confirmación, sirena, linterna, vibración, SMS abierto y señal del simulacro.
- **Simulacro:** tras una espera aleatoria de 3 a 10 s aparece «¡SISMO! Active la alerta ahora» y se mide el tiempo de reacción. La alerta queda marcada como simulacro.
- **Estadísticas:** filtros Todas / Reales / Simulacros; número de alertas, % con SMS abierto, % con ubicación real y, por métrica, n, mediana, promedio y máximo.
- **Exportar CSV:** sin nombre, contactos ni coordenadas; con protección contra inyección de fórmulas al abrirlo en Excel. En Android se comparte con el menú del sistema.

| Métrica | Definición |
|---|---|
| SOS → confirmación | Desde que se toca SOS hasta que se confirma el tipo de evento |
| Confirmación → sirena / linterna / vibración | Tiempo que tarda cada señal en encenderse |
| Confirmación → SMS abierto | Hasta que se abre la app de mensajes (no confirma el envío) |
| Señal del simulacro → confirmación | Tiempo de reacción en simulacros |

### 2.7 Base técnica (iteraciones anteriores)

- App Android con Capacitor, ícono adaptativo y márgenes de zona segura (Android 15+ dibuja de borde a borde).
- Permisos al abrir la app: ubicación y notificaciones.
- README con instalación, Android, permisos y solución de problemas en Windows.

---

## 3. Decisiones de diseño

| Decisión | Motivo |
|---|---|
| Señales en un servicio nativo en primer plano | Android pausa la app en segundo plano; el servicio mantiene sirena, linterna y vibración con la pantalla bloqueada |
| Linterna con `setTorchMode` en lugar de la cámara | No requiere permiso de cámara y no compite con la vista web |
| Widget y acceso rápido piden confirmación | Evitar activaciones accidentales |
| El SMS no se abre automáticamente | Abrir otra app envía SISMO a segundo plano; se deja al usuario decidir el momento |
| Estado «SMS abierto», nunca «Enviada» | SISMO no puede comprobar el envío ni la entrega |
| Ubicación actualizada solo en el dispositivo | No hay canal automático todavía (ver ntfy en la hoja de ruta) |
| Ficha médica compartida por defecto en la alerta y el SMS, con opción de desactivarla | En una emergencia es más útil que rescatistas y contactos la conozcan; el usuario conserva el control. El aviso de la página explica qué se comparte |
| CSV sin datos personales | Permite compartir métricas para la tesis sin exponer a nadie |
| Sismos: descarga general y filtro local | No revelar la ubicación del usuario a terceros |

---

## 4. Limitaciones conocidas

- **iPhone:** no hay proyecto iOS; linterna y vibración no están disponibles en Safari.
- **Escritorio:** sin flash ni vibración; la ubicación se estima por WiFi o IP y puede desviarse cientos de metros o más.
- **SMS:** no se confirma el envío; no está verificado que todas las apps de mensajes acepten varios destinatarios en un enlace. Con ficha médica el mensaje puede superar 160 caracteres y enviarse en varias partes.
- **Ubicación durante la alerta:** se actualiza en el dispositivo pero no se envía sola a los contactos.
- **Sismos recientes:** dependen de internet y del catálogo del USGS, que puede tardar minutos en publicar.
- **Métricas de señales:** si una señal tarda más que el cierre del diálogo de confirmación (unos 200 ms), su tiempo puede quedar sin registrar.
- **Simulacro:** se cancela si se cierra la app; no se guarda la espera en curso.

---

## 5. Estado de verificación

| Verificación | Resultado |
|---|---|
| TypeScript, ESLint y compilación web | Sin errores |
| Compilación Android (`gradlew assembleDebug`) | Sin errores |
| Pruebas e2e (Playwright, móvil y escritorio) | **30 de 30** superadas |
| Cubierto por pruebas nuevas | Páginas nuevas, botón 123, métricas, simulacro, ficha médica (compartida por defecto y desactivable), estadísticas y CSV, sismos (con datos simulados del USGS) |
| Prueba en dispositivo físico | **Pendiente**: servicio nativo con pantalla bloqueada, linterna SOS, vibración, notificación, widget, acceso rápido, SMS y llamada |
| Sin pruebas automáticas | Texto del SMS (alerta con ficha médica y «Estoy bien»), punto de encuentro, actualización periódica de ubicación |

---

## 6. Hoja de ruta (pendiente)

| # | Mejora | Valor |
|---|---|---|
| 1 | **Prueba en dispositivo físico** de todo lo listado en la sección 5 | Requisito antes de validar con usuarios |
| 2 | Canal automático con **ntfy** (tema aleatorio por usuario, invitación por QR) | Notificación push a contactos sin servidor propio |
| 3 | Envío automático de la ubicación actualizada por ntfy | Seguimiento si la persona se desplaza |
| 4 | Pruebas automáticas faltantes (sección 5) | Cobertura del 20 % humano del modelo 80/20 |
| 5 | Proyecto iOS | Ampliar el alcance a iPhone |
| 6 | Alertas oficiales del Servicio Geológico Colombiano | Fuente nacional además del USGS |
| 7 | Funcionamiento sin conexión (PWA / service worker) | La guía y la alerta local disponibles sin red |
