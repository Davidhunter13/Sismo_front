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
| Información | Guía de emergencia | + Sismos recientes (USGS), ficha médica con QR, lectura en voz alta, mochila de emergencia y lista «Después del sismo» |
| Orientación | Mapa | + Brújula sin internet hacia el punto de encuentro |
| Presentación | Solo español, tema claro | Español e inglés, tema claro u oscuro |
| Supervivencia | No existía | Modo atrapado (ahorro de batería), silbato de rescate, batería en el SMS, detección de caídas |
| Validación | Sin datos | Métricas de tiempo, simulacro con cronómetro, encuesta SUS, estadísticas y CSV |
| Calidad | 18 pruebas e2e | 90 pruebas e2e + 87 pruebas unitarias + integración continua con APK automático |

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
- **«Estoy bien»:** al finalizar la alerta (y desde Inicio) se pregunta por dónde avisar: **por SMS** a todos los contactos o **por WhatsApp** a cada contacto (enlace oficial wa.me). Luego se abre la lista «Después del sismo».
- **Correo de alerta (servidor pendiente de conectar):** al activar el SOS aparece «¿Enviar correo a sus contactos?» con cuenta regresiva de **20 s**: «Sí, enviar ahora» o el silencio lo envían; «No enviar» lo cancela (luego se puede reintentar). No se pregunta en simulacros ni si ningún contacto real tiene correo. La app **no envía correos por sí misma ni guarda credenciales**: arma la solicitud (asunto, destinatarios, cuerpo con ubicación, punto de encuentro, ficha médica y batería) y la envía por POST a `VITE_ALERT_EMAIL_URL` (`.env`; ejemplo en `.env.example`), con tiempo límite y dos reintentos con espera exponencial. Mientras no esté configurado, el estado dice «No se envió: falta conectar el servidor de correo». El contrato JSON para el servidor está documentado en `src/services/emailService.ts`.
- **Correo obligatorio en los contactos:** nuevo campo «Correo electrónico» validado en el formulario. Los contactos guardados antes muestran «Falta el correo» hasta editarlos.
- **WhatsApp por contacto:** en la alerta, un botón por contacto abre WhatsApp con el mismo aviso (WhatsApp no admite varios destinatarios en un enlace y requiere internet). El número se normaliza al formato de WhatsApp.
- Los contactos de demostración (ficticios) nunca reciben SMS.

### 2.4 Ubicación

- Afinado del GPS: escucha hasta 10 s y conserva la lectura más precisa (para antes si llega a ±25 m). Si en ese tiempo no llega ninguna lectura de alta precisión (computadores sin GPS), pide una ubicación aproximada por WiFi/red, que responde rápido.
- **Durante la alerta** se actualiza al activarla y cada 2 minutos si hay permiso. Se guarda en el dispositivo y el SMS usa la más reciente. Se cuentan las actualizaciones por alerta.
- **Punto de encuentro:** se guarda desde la ubicación actual, tocando el mapa real («Elegir en el mapa» sube automáticamente hasta el mapa) o **buscando una dirección**: fuente principal **Esri ArcGIS World Geocoding** (gratuito sin llave para búsquedas), que entiende la nomenclatura colombiana y tiene números de casa (p. ej. «Carrera 20 # 39-52» → punto exacto en La Soledad) y algunos lugares por nombre; en paralelo **Photon** (OpenStreetMap) como respaldo. Cada resultado indica si es «Dirección exacta» o «Aproximada». Los resultados exactos más cercanos al usuario van primero. Se descartaron Nominatim (no encuentra direcciones colombianas) y Overpass (bloquea consultas). **Licencia:** Esri permite búsquedas anónimas sin almacenar resultados; guardar el punto de encuentro es un almacenamiento, así que para producción hay que revisar sus términos o usar una cuenta ArcGIS Location Platform (tiene cupo gratuito).

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

### 2.7 Supervivencia en un sismo

- **Modo atrapado:** para quien queda bajo escombros. Apaga las señales continuas, baja el brillo y deja apagar la pantalla. Cada 3 minutos emite una ráfaga corta: tres pitidos de silbato y un ciclo de linterna SOS (Android) o vibración (navegador). En Android lo ejecuta el servicio nativo con un WakeLock parcial, así que sigue con la pantalla apagada. **Al salir del modo se retoman las señales normales** según la configuración.
- **Silbato de rescate:** opción de sonido en Configuración («Sirena» o «Silbato»). Tres pitidos de ~3,1 kHz (señal internacional de auxilio): se oye mejor entre escombros y gasta menos batería que la sirena. Cada opción tiene un botón **«Escuchar»** con una muestra (3 s de sirena o un ciclo de silbato) que se detiene sola o con «Detener»; no está disponible durante una alerta activa.
- **Batería en el SMS:** el aviso incluye «Batería: X %» para que los contactos sepan cuánto tiempo queda para comunicarse.
- **Detección de caídas («¿Está bien?»):** con la app abierta, el acelerómetro detecta caída libre seguida de impacto, o un impacto muy fuerte (≥ 6 g). Si la pantalla está apagada, la enciende y muestra el aviso sobre la pantalla de bloqueo (Android). Muestra una cuenta regresiva de 30 s con «Estoy bien» y «Pedir ayuda ahora»; si nadie responde, activa la alerta (origen `deteccion_automatica`). **Desactivada por defecto** por posibles falsas alarmas.
- **Ubicación automática al dar SOS:** se toma al activar la alerta aunque no hubiera una guardada; si el permiso no se había pedido, se pide en ese momento. Solo deja de intentarlo si el permiso fue denegado.
- Archivos: `trappedService.ts`, `batteryService.ts`, `fallDetectionService.ts`, `components/FallDetector.tsx`, `sirenService.ts`; `AlertService.java`, `SismoNativePlugin.java`.

### 2.8 Validación para la tesis

- **Encuesta SUS** (`/encuesta`): las 10 afirmaciones estándar con escala 1–5. Calcula el puntaje 0–100 con su interpretación (68 es el promedio de referencia). **Se abre sola al finalizar un simulacro** (en ese caso no se ofrece el SMS «Estoy bien»). Las respuestas son anónimas.
- **Estadísticas:** resumen SUS (n, promedio, mediana) y **CSV de SUS** aparte del CSV de métricas.
- **Pruebas unitarias (Vitest, 39):** texto del SMS (ubicación, punto de encuentro, ficha médica, batería, «Estoy bien»), normalización de teléfonos, métricas y CSV (incluida la protección contra inyección de fórmulas), filtro de sismos y validación de datos externos, puntaje SUS, mochila y detector de caídas.
- **Integración continua (GitHub Actions):** en cada `push` corre lint, tipos, pruebas unitarias y e2e, y genera el **APK descargable** desde la pestaña *Actions*.

### 2.9 Preparación y comodidad

- **«Avisar que estoy bien»** desde Inicio: SMS a los contactos sin activar una alerta (por ejemplo, después de un temblor).
- **Mochila de emergencia** (`/mochila`): lista base de 13 elementos (orientativa), marcar listos, fecha de vencimiento por elemento, agregar o quitar elementos propios. Avisos de elementos vencidos o por vencer (≤ 30 días) y de revisión cada 6 meses, en la página y en el acceso rápido de Inicio.
- **Importar contactos de la agenda:** botón «De la agenda» en Contactos. Precarga nombre y teléfono; la persona elige la relación y confirma. No pide permiso de leer toda la agenda.
- **Lectura en voz alta de la guía:** botón «Escuchar» en cada tarjeta de la guía de emergencia (voz del sistema en Android, Web Speech API en el navegador).

### 2.10 Correcciones

| Problema reportado | Causa | Solución |
|---|---|---|
| Tras tocar el engranaje (Configuración) y luego la casita, seguía viéndose Configuración | Ionic deja visible la vista apilada al «reemplazar» la ruta por una vista que ya está debajo en la pila | Nueva función `goToRoot` (`utils/navigation.ts`) que reinicia la pila; se usa en la barra inferior, el simulacro, los accesos rápidos y el widget |
| «Comenzar simulacro» no hacía nada al entrar desde Inicio | Misma causa: la vista de Simulacro quedaba encima | Misma solución |
| El simulacro podía guardar «activó antes de la señal» aunque la señal ya se hubiera mostrado | La activación leía el estado del simulacro desde una vista con datos desactualizados | El estado del simulacro se lee de una referencia siempre actualizada del estado global |
| Al salir del modo atrapado no volvían las señales | Solo se restauraba la pantalla encendida | Se reactivan sonido, linterna, vibración y destello según la configuración |
| Con SOS sin ubicación guardada, la alerta quedaba sin ubicación | Solo se pedía con permiso ya concedido | Se toma automáticamente al activar (ver 2.7) |
| Modo oscuro: pestañas no seleccionadas, textos pequeños y opciones del diálogo de SOS casi invisibles | Ionic usaba sus grises de tema claro | Escala completa de grises oscuros para Ionic y color principal claro en oscuro; verificado con capturas |
| Alto contraste + modo oscuro: fondo blanco y textos oscuros | El alto contraste forzaba colores de tema claro | Alto contraste propio para oscuro (blanco sobre negro) |
| Botones del diálogo en mayúsculas y sin el rojo de «Activar alerta» en la app compilada | En la compilación de producción el CSS de Ionic se carga después y ganaba con la misma especificidad | Reglas del diálogo más específicas (`ion-alert.sismo-alert …`) |
| «Estoy a salvo · Finalizar alerta» volvía a Inicio | — | Ahora abre la lista «Después del sismo» (tras un simulacro sigue abriendo la encuesta) |
| WhatsApp decía que el contacto no existía | WhatsApp exige el número con código de país y sin «+» | Botón de WhatsApp por contacto en la alerta con el número normalizado (`whatsappNumber`: se quita el «+» y se antepone 57 a celulares colombianos guardados sin indicativo) |
| La detección de caídas se activó al apretar el teléfono con fuerza | El umbral de impacto aislado (4 g) se alcanza con un apretón o sacudida | Impacto aislado sube a 6 g; caída libre + impacto se mantiene. Prueba de falsas alarmas |
| La cuenta regresiva del correo se quedaba en 20 s y nunca enviaba (detectado por las pruebas) | La pantalla de alerta se redibuja cada segundo y reiniciaba el temporizador | El temporizador ya no depende de los redibujos (referencia a la función de envío) |
| El mapa real podía verse gris | El mapa se dibujaba antes de tener su tamaño final (pestañas, transiciones) o las teselas no cargaban (sin internet o un bloqueador) | El mapa se recalcula cada vez que cambia su contenedor y, si las teselas fallan, muestra un aviso en lugar de quedar gris |
| «Elegir en el mapa» no llevaba al mapa | — | Sube automáticamente hasta el mapa |
| La búsqueda de dirección no encontraba «Carrera 20 # 39-52» (Consejo Colombiano de Seguridad) | OpenStreetMap casi no tiene números de casa en Colombia | Esri ArcGIS como fuente principal (punto exacto), Photon de respaldo, limpieza del texto (paréntesis, «Barrio», «D.C.») |
| En el PC «Solicitar mi ubicación» terminaba en «tiempo agotado» | Tras el afinado de GPS, sin GPS la alta precisión nunca llega | Respaldo con ubicación aproximada por WiFi/red |
| «Avisar que estoy bien» bloqueado sin explicación | Los contactos de demostración son ficticios y no reciben mensajes | Texto que explica el bloqueo y enlace «Agregar un contacto real» |
| La flecha de las brújulas apuntaba 45° desviada (p. ej. al Este con rumbo NE) | El ícono de flecha viene inclinado 45° de fábrica | Se compensa la inclinación (`ICON_TILT`); verificado con capturas |
| «Estoy bien» por SMS abría WhatsApp y decía que el número no estaba registrado | En algunos teléfonos el enlace SMS lo atiende WhatsApp, que no entiende ese formato (número junto al texto, varios destinatarios) | «Estoy bien» (Inicio y al finalizar la alerta) ahora pregunta el canal: «Por SMS» o «WhatsApp: <contacto>» con el enlace oficial wa.me (`useNotifySafe`). Además el SMS agrega +57 a celulares sin indicativo |
| En el PC, Waze abría sin punto de salida | El enlace de la app solo lleva el destino y la web de Waze no conoce la ubicación | En el navegador se usa el mapa web de Waze con salida y destino |
| Las letras N/S/E/O giraban junto con el teléfono | Se rotaba toda la rosa | Letras fijas; solo gira la flecha |
| Costaba encontrar la brújula | Estaba al final de Ubicación y solo con punto de encuentro | Tarjeta siempre visible y acceso «Brújula» en Inicio que baja directo a ella |
| El «¿Está bien?» no se vio porque la pantalla estaba apagada | El aviso no encendía la pantalla | Al detectar una caída la app enciende la pantalla y se muestra sobre la de bloqueo (Android, `wakeScreen` + `setShowWhenLocked`) |

### 2.11 Orientación, rescatistas, contexto y presentación

- **Brújula al punto de encuentro** (en Ubicación y en la alerta): flecha que apunta al punto de encuentro, distancia en metros y dirección en grados con punto cardinal. **Funciona sin internet**: usa el GPS en vivo y el magnetómetro (`deviceorientationabsolute` en Android/Chrome, `webkitCompassHeading` en iOS). Sin magnetómetro dibuja la dirección respecto al norte. Indica «ya llegó» a menos de 25 m. Archivos: `compassService.ts`, `components/MeetingCompass.tsx`.
- **Lista «Después del sismo»** (`/despues-del-sismo`, acceso en Inicio y en la alerta; se abre sola al finalizar la alerta): 11 pasos (heridos, gas, electricidad, agua, grietas, escaleras, punto de encuentro, réplicas, uso del teléfono, información oficial, avisar a la familia) con casillas y barra de progreso. **Cada alerta tiene su propia lista** (`AlertRecord.postQuakeDone`): al dar SOS empieza vacía y las anteriores se conservan con su alerta, sin borrar datos (preparado para migrar a una base de datos). Desde Inicio se abre la de la alerta más reciente; sin alertas, una lista de práctica. Arriba muestra el **punto de encuentro con la brújula** o, si no hay uno configurado, invita a configurarlo (botón que lleva a la brújula en Ubicación). Orientativa: debe validarse con la UNGRD.
- **QR médico:** en la ficha médica y en la pantalla de alerta. Contiene la ficha en texto plano (nombre, sangre, alergias, medicamentos, condiciones, notas, línea 123): cualquier lector de QR lo muestra **sin internet ni app**. Solo se genera si «Compartir» está activo. Siempre sobre fondo blanco para que lo lean los escáneres. Librería `qrcode`.
- **Ficha médica sobre la pantalla de bloqueo (Android):** durante la alerta SISMO se muestra encima de la pantalla bloqueada y la enciende (`setShowWhenLocked` / `setTurnScreenOn`), para que los rescatistas vean la ficha y el QR sin desbloquear. Se desactiva al finalizar.
- **Indicador de red:** aviso «Sin internet» en Inicio y en la alerta (qué sigue funcionando: SMS, 123, brújula, esquema; qué no: mapa real y sismos recientes) y fila «Conexión a internet» en la disponibilidad de servicios.
- **Recordatorios de simulacro:** en Inicio y en Simulacro, si nunca se ha hecho uno o pasaron 90 días; en septiembre y octubre recuerda el **Simulacro Nacional de Respuesta a Emergencias** (la fecha exacta se remite a la UNGRD). Dentro de la app. Archivo: `drillReminderService.ts`.
- **Modo oscuro:** Configuración → Tema: Sistema (sigue al teléfono), Claro u Oscuro, y un **botón sol/luna en el encabezado** (junto a la tuerca) para cambiar rápido entre claro y oscuro.
- **Ruta al punto de encuentro («Cómo llegar»)** en Ubicación y en «Después del sismo»: mapa con el trazado, modos **A pie / Carro o moto / Bici** con distancia y tiempo, y botones **«Abrir ruta en Google Maps»** (guía por voz) y, en el modo carro/moto, **«Abrir en Waze»** (enlace público gratuito, sin llave): en el celular abre la app y navega desde el GPS; en el PC abre el mapa web de Waze con salida y destino (`live-map`), porque la web de Waze no conoce la ubicación del usuario. Rutas gratuitas de OpenStreetMap (routing.openstreetmap.de, sin llave; para moto se usa el perfil de carro). Requiere internet (sin conexión lo indica y remite a la brújula). Archivos: `routeService.ts`, `components/MeetingRoute.tsx`, `components/RouteMap.tsx`.
- **Brújula siempre visible** en Ubicación: sin punto de encuentro explica cómo activarla.
- **Rosa de los vientos (N, NE, E, SE, S, SO, O, NO; en inglés W):** en la brújula completa, en la mini y en la del encabezado. Las letras quedan **fijas** (N arriba) y **solo gira la flecha**: con brújula del teléfono marca el rumbo al punto de encuentro aunque se gire el celular (rumbo − orientación); sin punto de encuentro apunta al norte real. Componente `CompassRose`. Sin punto de encuentro, la tarjeta de la brújula y la mini brújula se marcan con **borde amarillo y un aviso**.
- **Brújula en el encabezado de Inicio:** al hacer scroll y perder de vista la mini brújula, aparece junto al botón de tema una rosa pequeña (N, E, S, O) que gira igual; al tocarla abre la brújula completa.
- **Mini brújula en Inicio:** gira en vivo con el magnetómetro; con punto de encuentro apunta hacia él y muestra la distancia, sin él apunta al norte e invita a configurarlo. Sin sensor (computador) la aguja se balancea suavemente. No deja el GPS encendido (usa la última ubicación guardada) para ahorrar batería. Al tocarla abre la brújula completa. Paleta oscura propia; el azul de marca (`--brand`) se separa del azul de textos (`--navy`). Incluye alto contraste para oscuro. Revisado con capturas en Configuración y en el diálogo de SOS; el resto de pantallas falta revisarlo en el teléfono.
- **Idioma español / inglés:** selector en la bienvenida y en Configuración; el idioma inicial se toma del teléfono. Traduce toda la interfaz, la guía de emergencia, la lista post-sismo, los SMS, la encuesta SUS (versión estándar en inglés), la lista de la mochila, las etiquetas, las fechas (`es-CO` / `en-US`) y la voz de lectura. Infraestructura propia sin dependencias en `src/i18n/` (un archivo por pantalla con `es` y `en`; TypeScript avisa si falta una traducción). Los valores guardados (tipos de evento, relaciones de contacto) no se traducen: solo su etiqueta.

### 2.12 Base técnica (iteraciones anteriores)

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
| Ubicación actualizada solo en el dispositivo | El envío automático será por el servidor de correo (pendiente de conectar) |
| Ficha médica compartida por defecto en la alerta y el SMS, con opción de desactivarla | En una emergencia es más útil que rescatistas y contactos la conozcan; el usuario conserva el control. El aviso de la página explica qué se comparte |
| CSV sin datos personales | Permite compartir métricas para la tesis sin exponer a nadie |
| Sismos: descarga general y filtro local | No revelar la ubicación del usuario a terceros |
| Modo atrapado en el servicio nativo con WakeLock | Con la pantalla apagada Android suspende la app web; el servicio mantiene las ráfagas |
| Detección de caídas desactivada por defecto y siempre con «¿Está bien?» | Dejar caer el teléfono no debe activar una alerta; la cuenta regresiva permite cancelar |
| Tras un simulacro se ofrece la encuesta y no el SMS «Estoy bien» | No tiene sentido avisar a la familia de un ejercicio; sí medir la usabilidad |
| Importar contactos con el selector del sistema | Acceso solo al contacto elegido, sin permiso sobre toda la agenda |
| Recordatorios de la mochila dentro de la app | Evita otro permiso y otra dependencia (notificaciones programadas) |
| QR con texto plano (no un enlace) | Se lee sin internet ni app con cualquier lector de QR |
| Brújula con GPS + magnetómetro, sin mapas | Debe funcionar sin internet justo cuando las redes fallan |
| Simulacro Nacional: solo el mes, no la fecha | La UNGRD fija la fecha cada año; se evita mostrar una fecha equivocada |
| Internacionalización propia sin librerías | Pocas dependencias y verificación de traducciones faltantes en tiempo de compilación |
| Valores guardados en español, etiquetas traducidas | Cambiar de idioma no altera ni rompe los datos ya guardados |
| Correo enviado por un servidor propio, no desde el teléfono | Enviar correo requiere credenciales del proveedor; nunca deben ir dentro de la app (política CCS de secretos) |
| Silencio de 20 s = enviar el correo | Si la persona no puede responder (herida o atrapada), el aviso igual sale |
| Estado «Sin servidor» explícito | La app nunca dice que el correo salió si no es así |

---

## 4. Limitaciones conocidas

- **iPhone:** no hay proyecto iOS; linterna y vibración no están disponibles en Safari.
- **Escritorio:** sin flash ni vibración; la ubicación se estima por WiFi o IP y puede desviarse cientos de metros o más.
- **SMS:** no se confirma el envío; no está verificado que todas las apps de mensajes acepten varios destinatarios en un enlace. Con ficha médica el mensaje puede superar 160 caracteres y enviarse en varias partes.
- **Ubicación durante la alerta:** se actualiza en el dispositivo pero no se envía sola a los contactos.
- **Sismos recientes:** dependen de internet y del catálogo del USGS, que puede tardar minutos en publicar.
- **Métricas de señales:** si una señal tarda más que el cierre del diálogo de confirmación (unos 200 ms), su tiempo puede quedar sin registrar.
- **Simulacro:** se cancela si se cierra la app; no se guarda la espera en curso.
- **Detección de caídas:** solo con la app abierta en primer plano; los umbrales son empíricos y deben calibrarse con pruebas reales.
- **Modo atrapado en el navegador:** solo funciona mientras la pestaña esté visible.
- **Mochila:** los recordatorios aparecen al abrir la app; no hay notificaciones programadas.
- **Lectura en voz alta:** depende de que el teléfono tenga una voz en español instalada.
- **Batería en el SMS:** no disponible en iPhone ni en Firefox (no exponen la Battery API).
- **Brújula:** la precisión depende del magnetómetro (objetos metálicos o imanes la desvían; puede requerir calibrar moviendo el teléfono en forma de 8). En computadores no hay brújula.
- **Indicador de red:** «con internet» solo significa que hay una red; tras un sismo puede estar saturada.
- **Traducción al inglés:** la guía de emergencia, la lista post-sismo y la mochila en inglés deben validarse por una persona con criterio técnico; los SMS se envían en el idioma de quien los manda.

---

## 5. Estado de verificación

| Verificación | Resultado |
|---|---|
| TypeScript, ESLint y compilación web | Sin errores |
| Compilación Android (`gradlew assembleDebug`) | Sin errores |
| Pruebas unitarias (Vitest) | **87 de 87** superadas |
| Pruebas e2e (Playwright, móvil y escritorio) | **90 de 90** superadas |
| Cubierto por pruebas e2e | Páginas nuevas, botón 123, métricas, ubicación automática al dar SOS, simulacro desde Inicio con su señal, encuesta SUS, mochila, modo atrapado (entrar y salir), muestras de sonido en Configuración, detección de caídas, navegación engranaje/casita sin vistas superpuestas, ficha médica, estadísticas y CSV, sismos |
| Cubierto por pruebas unitarias | Texto de los SMS, métricas y CSV, sismos, SUS, mochila, detector de caídas |
| Integración continua | Configurada; se verá su primera ejecución en GitHub al subir los cambios |
| Prueba en dispositivo físico | **Pendiente**: servicio nativo con pantalla bloqueada, modo atrapado con pantalla apagada, silbato, linterna SOS, vibración, notificación, widget, acceso rápido, voz, selector de contactos, batería, SMS y llamada |
| Sin pruebas automáticas | Punto de encuentro, actualización periódica de la ubicación, funciones nativas de Android |

---

## 6. Hoja de ruta (pendiente)

| # | Mejora | Valor |
|---|---|---|
| 1 | **Prueba en dispositivo físico** de todo lo listado en la sección 5 | Requisito antes de validar con usuarios |
| 1b | Rutas sin depender del servidor público (p. ej. servidor OSRM propio) si se espera mucho uso | El servicio gratuito es de uso moderado |
| 2 | **Conectar el servidor de correo** (`VITE_ALERT_EMAIL_URL`; contrato en `src/services/emailService.ts`) | El correo de alerta empieza a enviarse de verdad |
| 3 | Enviar por correo la ubicación actualizada durante la alerta (mismo servidor) | Seguimiento si la persona se desplaza |
| 4 | Pruebas automáticas faltantes (sección 5) y calibración de los umbrales de caída con pruebas reales | Cobertura del 20 % humano del modelo 80/20 |
| 4b | Notificaciones programadas para la mochila | Recordatorios aunque no se abra la app |
| 5 | Proyecto iOS | Ampliar el alcance a iPhone |
| 6 | Alertas oficiales del Servicio Geológico Colombiano | Fuente nacional además del USGS |
| 7 | Funcionamiento sin conexión (PWA / service worker) | La guía y la alerta local disponibles sin red |
