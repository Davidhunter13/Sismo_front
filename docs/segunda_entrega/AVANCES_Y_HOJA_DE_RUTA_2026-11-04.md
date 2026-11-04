> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# SISMO — Avances implementados y hoja de ruta

Documento de seguimiento del prototipo SISMO (botón de pánico para emergencias sísmicas).
Resume las funciones agregadas, las decisiones de diseño, las limitaciones conocidas y las mejoras pendientes.

Repositorio: <https://github.com/Davidhunter13/Sismo_front>

**Última actualización:** 4 de noviembre de 2026 (la fecha también va en el nombre del archivo). Novedades de esta versión: **backend en CodeIgniter 3 con base de datos y sincronización sin conexión** (§2.14), **panel administrativo de monitoreo en tiempo real** (§2.15) **recuperación de datos si se pierde el teléfono** (§2.16), **catálogos administrables: nada de negocio queda fijo en el código** (§2.17), **sismos recientes en el panel** (§2.18) **modo de demostración solo en desarrollo** (§2.19) **pantalla de carga, loader de solicitudes y aviso de «sin conexión» en la app** (§2.20) y **eliminar mi cuenta** (§2.21).

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
| Canal digital | Solo simulación | SMS a contactos con ubicación y puntos de encuentro + «Estoy bien» (SMS o WhatsApp) con ubicación actual, puntos de encuentro y batería |
| Ubicación | Una lectura al tocar un botón | Afinado de GPS (hasta 10 s) y actualización cada 2 min durante la alerta |
| Mapa | Esquema SVG | Pestañas «Esquema» y «Mapa real» (OpenStreetMap) con punto de encuentro |
| Información | Guía de emergencia | + Sismos recientes (USGS), ficha médica con QR, lectura en voz alta, mochila de emergencia y lista «Después del sismo» |
| Orientación | Mapa | + Brújula sin internet hacia el punto de encuentro |
| Presentación | Solo español, tema claro | Español e inglés, tema claro u oscuro |
| Supervivencia | No existía | Modo atrapado (ahorro de batería), silbato de rescate, batería en el SMS, detección de caídas |
| Validación | Sin datos | Métricas de tiempo, simulacro con cronómetro, encuesta SUS, estadísticas y CSV |
| Almacenamiento | Solo en el teléfono | Teléfono + base de datos MySQL vía backend en CodeIgniter 3; sin red los cambios esperan en una cola y se suben solos al volver la conexión |
| Monitoreo | No existía | Panel administrativo web (backend) con alertas activas en tiempo real, mapa, detalle de la persona y registro de la ayuda brindada, visible en la app |
| Divulgación | No existía | Página web informativa (comercial) con beneficios, funciones, capturas en teléfonos, portátil y escritorio, y lo que aún está pendiente |
| Recuperación | Si se perdía el teléfono se perdía todo | Código de recuperación: en un teléfono nuevo se restauran contactos, historial, ficha médica y demás datos |
| Contenido | Listas y textos fijos en el código | Tipos de evento, parentescos, kit, pasos post-sismo, tipos de sangre, guía de emergencia y parámetros (número de emergencia, topes, tiempos) editables desde el panel |
| Modo demostración | Visible siempre | Solo en desarrollo; en producción no aparece y se apaga solo |
| Calidad | 18 pruebas e2e | 114 pruebas e2e (móvil y escritorio) + 116 pruebas unitarias + integración continua con APK automático |

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
- **Widgets SOS** para la pantalla de inicio: **1×1** (logo circular de SISMO con etiqueta roja «SOS» encima) y **2×2** (logo y nombre arriba, botón SOS redondo grande y una línea de estado). Ambos se activan con **doble toque en el propio widget**: el primer toque lo «arma» durante 4 s («¿SOS? Toque otra vez» / «¿ACTIVAR?» con borde amarillo) y el segundo activa la alerta sin diálogo. Android enciende **de inmediato** sirena, linterna y vibración (`MainActivity`, antes de que cargue la app web) y SISMO abre directo la pantalla de alerta (tipo «Sismo», origen `widget`), con la ubicación automática. Luego la app apaga las señales que el usuario tenga desactivadas en Configuración; el sonido queda en sirena aunque se haya elegido el silbato (cambiarlo podía dejarla en silencio). Funciona aunque el registro no esté terminado. El segundo toque abre la actividad directamente porque Android no permite abrir pantallas desde un receptor en segundo plano. Textos del widget en español o inglés según el idioma del teléfono. Archivos: `SosWidgetProvider.java`, `SosWidgetLargeProvider.java`, `res/layout/widget_sos*.xml`.
- Ambos abren SISMO con el diálogo de SOS listo. La confirmación se mantiene para evitar activaciones accidentales (por ejemplo, en el bolsillo).
- Cada alerta registra su origen (`app` o `acceso_rapido`) para comparar tiempos.

### 2.3 Comunicación

- **Llamar al 123:** abre el marcador con el número listo.
- **SMS de alerta:** abre la app de mensajes con los contactos reales y el aviso: tipo de evento, ubicación (con precisión), punto de encuentro y resumen de la ficha médica (si «Compartir» está activo). Estado honesto «SMS abierto», porque SISMO no puede verificar el envío.
- **«Estoy bien»:** al finalizar la alerta (y desde Inicio) se pregunta por dónde avisar: **por SMS** a todos los contactos o **por WhatsApp** a cada contacto (enlace oficial wa.me). El mensaje va completo: enlace de Google Maps a la **ubicación actual** (con precisión), enlace a **cada punto de encuentro** y **batería**. Luego se abre la lista «Después del sismo».
- **Correo de alerta (servidor pendiente de conectar):** al activar el SOS aparece «¿Enviar correo a sus contactos?» con cuenta regresiva de **20 s**: «Sí, enviar ahora» o el silencio lo envían; «No enviar» lo cancela (luego se puede reintentar). No se pregunta en simulacros ni si ningún contacto real tiene correo. La app **no envía correos por sí misma ni guarda credenciales**: arma la solicitud (asunto, destinatarios, cuerpo con ubicación, punto de encuentro, ficha médica y batería) y la envía por POST a `VITE_ALERT_EMAIL_URL` (`.env`; ejemplo en `.env.example`), con tiempo límite y dos reintentos con espera exponencial. Mientras no esté configurado, el estado dice «No se envió: falta conectar el servidor de correo». El contrato JSON para el servidor está documentado en `src/services/emailService.ts`.
- **Correo obligatorio en los contactos:** nuevo campo «Correo electrónico» validado en el formulario. Los contactos guardados antes muestran «Falta el correo» hasta editarlos.
- **WhatsApp por contacto:** en la alerta, un botón por contacto abre WhatsApp con el mismo aviso (WhatsApp no admite varios destinatarios en un enlace y requiere internet). El número se normaliza al formato de WhatsApp.
- Los contactos de demostración (ficticios) nunca reciben SMS.

### 2.4 Ubicación

- Afinado del GPS: escucha hasta 10 s y conserva la lectura más precisa (para antes si llega a ±25 m). Si en ese tiempo no llega ninguna lectura de alta precisión (computadores sin GPS), pide una ubicación aproximada por WiFi/red, que responde rápido.
- **Durante la alerta** se actualiza al activarla y cada 2 minutos si hay permiso. Se guarda en el dispositivo y el SMS usa la más reciente. Se cuentan las actualizaciones por alerta.
- **Punto de encuentro:** se guarda desde la ubicación actual, tocando el mapa real («Elegir en el mapa» sube automáticamente hasta el mapa) o **buscando una dirección**: fuente principal **Esri ArcGIS World Geocoding** (gratuito sin llave para búsquedas), que entiende la nomenclatura colombiana y tiene números de casa (p. ej. «Carrera 20 # 39-52» → punto exacto en La Soledad) y algunos lugares por nombre; en paralelo **Photon** (OpenStreetMap) como respaldo. Cada resultado indica si es «Dirección exacta» o «Aproximada». Los resultados exactos más cercanos al usuario van primero. Se descartaron Nominatim (no encuentra direcciones colombianas) y Overpass (bloquea consultas). **Licencia:** Esri permite búsquedas anónimas sin almacenar resultados; guardar el punto de encuentro es un almacenamiento, así que para producción hay que revisar sus términos o usar una cuenta ArcGIS Location Platform (tiene cupo gratuito).
- **Varios puntos de encuentro (hasta 5):** casa, trabajo, colegio… Se agregan uno tras otro (ubicación actual, mapa o dirección) y se ven en una lista con botón para borrar cada uno. **Todos van en los mensajes** (SMS, WhatsApp, «Estoy bien» y correo), cada uno con su enlace. La **brújula, la ruta y la mini brújula guían al más cercano** a la ubicación actual (o a donde se activó la alerta); con dos o más aparece «Guiar hacia» para elegir otro, con la distancia a cada uno. El tope de 5 mantiene el SMS corto. Los datos guardados con un solo punto se migran solos a la lista (`storageService.loadData`). Archivos: `utils/meetingPoints.ts`, `components/useMeetingTarget.tsx`.
- **Registro obligatorio sin modo de demostración** (`/registro`): si en la bienvenida se apaga el modo de demostración, «Comenzar» abre un asistente de 4 pasos: **nombre**, **ubicación actual** (real del dispositivo; las coordenadas de prueba no cuentan), **punto de encuentro** (uno o varios) y **al menos un contacto real**. «Siguiente» se habilita solo con el paso completo y la app no queda registrada hasta «Finalizar registro». El botón **SOS sigue disponible** durante el registro (en una emergencia no debe haber bloqueos). Con el modo de demostración se entra directo, como antes.
- **Ubicación actualizada sola cada 5 minutos** con la app abierta y visible, y al volver a la app si la última tiene más de 5 minutos. No usa ubicación en segundo plano (no pide «ubicación todo el tiempo» ni gasta batería con la pantalla apagada), solo actúa si el permiso ya está concedido y no reemplaza las coordenadas de prueba. Durante una alerta sigue la actualización propia cada 2 minutos. Archivo: `components/useLocationAutoRefresh.ts`.
- **Ahorro de batería automático en la alerta:** durante una alerta real (no en simulacros) se revisa la batería cada minuto; al llegar al umbral de **Configuración → Ahorro de batería en la alerta** (Nunca, 10, 15, **20 % por defecto** o 30 %) pasa sola al **modo ahorro** (el modo atrapado: ráfagas cada pocos minutos). Muestra el aviso «Batería al N %: se activó el modo ahorro» con **«Volver a la señal continua»** y **«Avisar a mis contactos»** (SMS o WhatsApp con el nivel de batería, la última ubicación y los puntos de encuentro; hay que confirmar el envío). Se activa **una sola vez por alerta**: si la persona vuelve a la señal continua, no se reactiva, aunque salga de la pantalla o la app se reinicie (se recuerda el id de la alerta). Si el teléfono no informa la batería (iPhone, Firefox), no hace nada. Archivos: `AlertPage.tsx`, `components/useContactChannel.ts` (selector de canal compartido con «Estoy bien»), `smsService.buildLowBatteryMessage`.
- **Registro: contacto desde la agenda, editar y eliminar.** En el paso 4 del registro está el botón **«De la agenda»** (como en Contactos): precarga nombre y teléfono y la persona completa relación y correo; solo aparece donde el teléfono lo permite. Cada contacto agregado tiene botones para **editarlo** o **eliminarlo** (con confirmación) por si hubo un error; si se elimina el único, el paso vuelve a quedar incompleto.
- **Datos necesarios que faltan, en rojo:** si se usa la app sin terminar el registro (por ejemplo, se dio «SOS · Emergencia ahora» durante el registro) o se borraron datos después, Inicio muestra el aviso rojo **«Faltan datos para avisar a sus contactos»** con la lista (su nombre, su ubicación, un punto de encuentro, un contacto real) y el botón **«Completar registro»**. Además se marcan con **borde rojo** los accesos de Contactos, Ubicación y Brújula, la tarjeta de Perfil en Configuración, la lista vacía de Contactos, y en Ubicación el punto de encuentro y la zona de «Solicitar mi ubicación». No se marca en el modo de demostración. Archivo: `utils/setupGaps.ts`.
- **Registro con confirmaciones y varios puntos:** cada acción del registro muestra un mensaje arriba (nombre actualizado, ubicación obtenida o el motivo si falla, punto de encuentro guardado, contacto agregado, actualizado o eliminado). Antes de mostrar uno nuevo se cierra el anterior, porque con uno abierto Ionic no muestra el siguiente. En el paso 3 se pueden guardar **varios puntos de encuentro** (hasta 5) y se ven en una lista con botón para borrar cada uno.
- **Archivos de entorno:** `.env.development` (`npm run dev`) y `.env.production` (`npm run build`, web y APK), locales y fuera de git; la plantilla compartida es `.env.example`. Las variables `VITE_` quedan dentro de la app: nunca deben llevar claves.

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
| El texto «Se enviará automáticamente en N s» se salía del diálogo del correo en teléfonos angostos | Usaba el tamaño de letra de un número grande (2,6 rem) para una frase completa | Tamaño de frase (1,15 rem), líneas equilibradas y espacio que no se parte entre el número y la «s» |
| El mapa real podía verse gris | El mapa se dibujaba antes de tener su tamaño final (pestañas, transiciones) o las teselas no cargaban (sin internet o un bloqueador) | El mapa se recalcula cada vez que cambia su contenedor y, si las teselas fallan, muestra un aviso en lugar de quedar gris |
| «Elegir en el mapa» no llevaba al mapa | — | Sube automáticamente hasta el mapa |
| La búsqueda de dirección no encontraba «Carrera 20 # 39-52» (Consejo Colombiano de Seguridad) | OpenStreetMap casi no tiene números de casa en Colombia | Esri ArcGIS como fuente principal (punto exacto), Photon de respaldo, limpieza del texto (paréntesis, «Barrio», «D.C.») |
| En el PC «Solicitar mi ubicación» terminaba en «tiempo agotado» | Tras el afinado de GPS, sin GPS la alta precisión nunca llega | Respaldo con ubicación aproximada por WiFi/red |
| «Avisar que estoy bien» bloqueado sin explicación | Los contactos de demostración son ficticios y no reciben mensajes | Texto que explica el bloqueo y enlace «Agregar un contacto real» |
| La flecha de las brújulas apuntaba 45° desviada (p. ej. al Este con rumbo NE) | El ícono de flecha viene inclinado 45° de fábrica | Se compensa la inclinación (`ICON_TILT`); verificado con capturas |
| «Estoy bien» por SMS abría WhatsApp y decía que el número no estaba registrado | En algunos teléfonos el enlace SMS lo atiende WhatsApp, que no entiende ese formato (número junto al texto, varios destinatarios) | «Estoy bien» (Inicio y al finalizar la alerta) ahora pregunta el canal: «Por SMS» o «WhatsApp: <contacto>» con el enlace oficial wa.me (`useNotifySafe`). Además el SMS agrega +57 a celulares sin indicativo |
| En el PC, Waze abría sin punto de salida | El enlace de la app solo lleva el destino y la web de Waze no conoce la ubicación | En el navegador se usa el mapa web de Waze con salida y destino |
| En modo oscuro el paso actual del registro se leía mal (azul sobre azul) | El azul de marca (`--brand`) no cambia en oscuro | El paso actual y el selector de puntos usan `--navy`, que se aclara en oscuro |
| En el PC, al tocar «Relación» al crear un contacto no aparecían las opciones (en el celular sí) | La lista flotante de Ionic dentro del modal no se mostraba en algunos navegadores de PC (simulador de celular o navegador integrado del editor) | Las 6 opciones se muestran como botones dentro del formulario (`ContactFormModal`): no dependen de ventanas flotantes y se eligen con un toque |
| En el widget 1×1 «Toque otra vez» se partía en líneas y se cortaba | No cabía en el círculo de 52 dp | Texto corto en dos líneas («OTRA / VEZ», «TAP / AGAIN») con tamaño automático |
| Con la app recién instalada (sin registro), el doble toque del widget encendía sirena, linterna y vibración pero mostraba la bienvenida en vez de la alerta | Al arrancar, la redirección a la bienvenida le ganaba a la navegación a Inicio | La app lee primero con qué acción se abrió y luego elige la primera pantalla (`App.tsx`). Comprobado en el emulador |
| En el widget 2×2 «¿ACTIVAR?» tocaba el borde del círculo | El tamaño de letra se cambiaba con un método que el widget ignora | Se usa `setTextViewTextSize` (15 sp) |
| En la vista de escritorio las opciones del umbral de batería se cortaban | Ionic da un ancho mínimo a cada opción del selector | Clase `segment--compact` sin ancho mínimo |
| Las letras N/S/E/O giraban junto con el teléfono | Se rotaba toda la rosa | Letras fijas; solo gira la flecha |
| Costaba encontrar la brújula | Estaba al final de Ubicación y solo con punto de encuentro | Tarjeta siempre visible y acceso «Brújula» en Inicio que baja directo a ella |
| El «¿Está bien?» no se vio porque la pantalla estaba apagada | El aviso no encendía la pantalla | Al detectar una caída la app enciende la pantalla y se muestra sobre la de bloqueo (Android, `wakeScreen` + `setShowWhenLocked`) |

### 2.11 Orientación, rescatistas, contexto y presentación

- **Brújula al punto de encuentro** (en Ubicación y en la alerta): flecha que apunta al punto de encuentro, distancia en metros y dirección en grados con punto cardinal. **Funciona sin internet**: usa el GPS en vivo y el magnetómetro (`deviceorientationabsolute` en Android/Chrome, `webkitCompassHeading` en iOS). Sin magnetómetro dibuja la dirección respecto al norte. Indica «ya llegó» a menos de 25 m. Archivos: `compassService.ts`, `components/MeetingCompass.tsx`.
- **Lista «Después del sismo»** (`/despues-del-sismo`, acceso en Inicio y en la alerta; se abre sola al finalizar la alerta): 11 pasos (heridos, gas, electricidad, agua, grietas, escaleras, punto de encuentro, réplicas, uso del teléfono, información oficial, avisar a la familia) con casillas y barra de progreso. **Cada alerta tiene su propia lista** (`AlertRecord.postQuakeDone`): al dar SOS empieza vacía y las anteriores se conservan con su alerta, sin borrar datos (preparado para migrar a una base de datos). Desde Inicio se abre la de la alerta más reciente; sin alertas, una lista de práctica. Arriba muestra el **punto de encuentro con la brújula** o, si no hay uno configurado, invita a configurarlo (botón que lleva a la brújula en Ubicación). Orientativa: debe validarse con la UNGRD.
- **QR médico:** en la ficha médica y en la pantalla de alerta. Contiene la ficha en texto plano (nombre, sangre, alergias, medicamentos, condiciones, notas, línea 123): cualquier lector de QR lo muestra **sin internet ni app**. Solo se genera si «Compartir» está activo. Siempre sobre fondo blanco para que lo lean los escáneres. Librería `qrcode`. **Evidencia:** `screenshots/2026-11-04/visual/visual_front/14-ficha-medica-qr.png` (el QR en la ficha) y `15-qr-escaneado-por-un-rescatista.png` (lo que ve quien lo escanea: el texto se obtuvo decodificando el QR real generado por la app; la pantalla del lector es una simulación genérica).
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

### 2.13 Identidad visual: logo y paleta de colores

**Logo.** Un cuadrado de esquinas redondeadas (un círculo en el ícono redondo de Android) en **azul marino SISMO `#0B2545`** con:
- una **onda sísmica blanca**: la línea de un sismógrafo (tramo plano, picos de subida y bajada y vuelta a la calma). Representa el temblor y, a la vez, la señal de vida;
- un **punto rojo `#D62828`** arriba a la derecha. Representa la alerta, el botón de pánico y el «estoy aquí».

Dónde se usa: bienvenida (`components/SismoLogo.tsx`, SVG), ícono de la app Android (normal y redondo) y widgets. El widget 1×1 lleva el logo redondo con un anillo rojo y una etiqueta roja «SOS» encima; el 2×2, el logo y el nombre arriba y un botón SOS rojo grande. El azul transmite calma y confianza; el rojo se reserva para la emergencia, para que el SOS sea lo primero que se ve.

**Paleta de colores** (variables CSS en `src/styles/theme.css`; los nombres son los tokens que usa el código):

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `--brand` | Azul de marca: encabezado, botón principal, logo | `#0B2545` | `#0B2545` (no cambia) |
| `--navy` | Azul de textos y elementos activos (se aclara en oscuro para leerse) | `#0B2545` | `#9CC0F0` |
| `--red` / `--red-dark` | Botón SOS, etiqueta SOS, alerta activa | `#D62828` / `#A61E1E` | iguales |
| `--bg` | Fondo de la app | `#F3F5F9` | `#0E141C` |
| `--card` | Tarjetas | `#FFFFFF` | `#18212D` |
| `--text` / `--muted` | Texto principal / secundario | `#1B2333` / `#5B6578` | `#E8EDF4` / `#A9B4C4` |
| `--border` | Bordes de tarjetas y campos | `#E3E7EF` | `#2F3C4E` |
| `--success` (+ `-bg`) | Correcto, guardado, pasos completos | `#1B7A4B` / `#E5F4EC` | `#5FCF96` / `#14301F` |
| `--warning` (+ `-bg`) | Atención: sin punto de encuentro (borde amarillo), mochila por revisar | `#8F5300` / `#FFF3DC` | `#F2B55C` / `#33260F` |
| `--danger` (+ `-bg`) | Error y **datos necesarios que faltan** (borde rojo) | `#B42318` / `#FDECEC` | `#FF8A80` / `#3A1716` |
| `--info` (+ `-bg`) | Avisos informativos | `#1D4E89` / `#E8F0FA` | `#9CC0F0` / `#172A42` |
| `--demo` (+ `-bg`) | Todo lo del modo de demostración (morado, para no confundirlo con datos reales) | `#6B3FA0` / `#F2EBFB` | `#C7A6F2` / `#2B2140` |
| — | Widget «armado» (tras el primer toque) | rojo `#FF1F1F` con borde amarillo `#FFD60A` | igual |
| — | Fondo del widget 2×2 | azul SISMO al 90 % (`#E60B2545`) | igual |

Reglas de uso: el **rojo** solo para SOS, alerta y datos faltantes; el **amarillo** para «revisar»; el **verde** para «listo»; el **morado** para la demostración. En oscuro los colores de texto se aclaran (`--navy`, `--danger`, etc.) para mantener el contraste, y la opción **Alto contraste** de Configuración marca más bordes y textos en ambos temas.

### 2.14 Backend y base de datos: guardado online y offline

Antes todo se guardaba solo en el teléfono (`localStorage`). Ahora también se guarda en una **base de datos MySQL** a través de un **backend en PHP con CodeIgniter 3** (API REST JSON). Detalle técnico completo en [BACKEND_Y_SINCRONIZACION.md](BACKEND_Y_SINCRONIZACION.md).

**Qué hace el backend (CodeIgniter 3):**
- **Registro del dispositivo sin contraseña:** al primer uso con red entrega un token (el servidor solo guarda su SHA-256); cada petición se autentica con él.
- **API por recurso:** ajustes, contactos, alertas (con ubicación, estados y métricas de tiempo), puntos de encuentro, encuestas SUS, kit de emergencia y ficha médica; más `GET /estado` para consultar todo lo guardado.
- **Escrituras idempotentes:** cada registro usa el UUID generado por la app, así reenviar no duplica. Eliminar = `activo = 0` (sin borrado físico).
- **Ficha médica cifrada** con AES-256-GCM; la llave vive en una variable de entorno del servidor. Sin llave, no se guarda.
- **Validación estricta** de cada campo, consultas parametrizadas, CORS solo para la app, logs JSON con `execution_id` y sin datos personales.
- **8 tablas `sismo_*`** con la convención de nombres del CCS: `sismo_usuarios`, `sismo_ajustes_usuarios`, `sismo_contactos_usuarios`, `sismo_alertas_usuarios`, `sismo_fichas_medicas_usuarios`, `sismo_puntos_encuentro_usuarios`, `sismo_encuestas_sus_usuarios` y `sismo_inventarios_usuarios`.

**Online / offline (`src/services/syncService.ts`):**
- **Con red:** cada cambio se guarda en el teléfono y se sube de inmediato.
- **Sin red:** la app funciona igual; los cambios quedan en una **cola persistente** (`sismo:v1:outbox`) que sobrevive al cierre de la app y al reinicio del teléfono.
- **Al volver la red:** la cola se sube sola y en orden apenas hay conexión (evento `online`, al abrir la app, al volver a primer plano y cada minuto). Ante saturación del servidor (429/5xx) reintenta con espera exponencial.
- **Historial completo:** al registrarse por primera vez se sube todo lo que ya existía en el teléfono: historial de alertas y simulacros con sus métricas, estadísticas, encuestas SUS, contactos, kit, puntos de encuentro, ajustes y ficha médica.
- Si un dato cambia varias veces sin red, solo se sube su última versión. Los datos del modo de demostración nunca se suben.
- Sin URL configurada (`VITE_SISMO_API_URL`) la app sigue funcionando solo en el teléfono, como antes.
- **Aviso «sin conexión» en todas las pantallas:** si no hay internet, la app muestra «Sin conexión. Sus datos se guardan en el teléfono y se subirán apenas haya conexión», con el número de cambios pendientes. Si hay internet pero el servidor no responde (caído o red saturada), dice «Sin conexión con el servidor. Sus datos están guardados en el teléfono y se subirán solos apenas se restablezca». Cuando vuelve la conexión, el aviso desaparece solo y la cola se sube (§2.20).
- **Token inválido (401):** si el servidor ya no reconoce el teléfono (cuenta eliminada o base de datos reiniciada), la app se vuelve a registrar **de inmediato** y sube todo lo que tiene guardado, sin perder datos ni intervención de la persona. El 401 aparece una vez en la consola del navegador y es normal.
- **Importante al configurar:** Vite solo lee los archivos `.env` al arrancar. Después de crear o cambiar `VITE_SISMO_API_URL` hay que detener y volver a iniciar `npm run dev` (o recompilar). Si no, la app no se comunica con el backend y no se crea el usuario en la base de datos. Pasó en las pruebas del 4/11/2026: tras reiniciar, el registro, los catálogos y los ajustes llegaron bien. Lo que se llenó antes no se pierde: al registrarse por primera vez la app sube todo lo que ya tenía guardado.
- **CORS en desarrollo:** si el puerto de Vite está ocupado, Vite usa otro (p. ej. 5181) y el navegador bloqueaba las peticiones. Ahora, con el backend en localhost, se acepta cualquier puerto local. En producción siguen permitidos solo los orígenes de la app.

### 2.15 Panel administrativo de monitoreo (backend)

Se construyó un **panel administrativo web desde el backend (CodeIgniter 3)** para el centro de monitoreo. Solo pueden entrar los administradores autorizados en la configuración del servidor. El diseño usa la **misma identidad visual de la app**: paleta (azul `#0B2545`, rojo SOS `#D62828`, morado para simulacros), logo, tipografía Inter y modo claro u oscuro. Es una página propia, sin menús ni encabezados de otros sistemas.

- **Siempre al día, sin recargar la página:** cada pestaña **consulta al servidor al abrirse** (Historial, Usuarios, Sismos recientes y cada catálogo). Además, el panel se actualiza solo **cada minuto, en silencio**: alertas activas, indicadores, mapa, historial, usuarios y el detalle de una persona abierto. Así, cuando alguien activa una alerta o pide ayuda, la tarjeta aparece sola en «Alertas activas». El detalle se actualiza sin perder la posición del scroll y no interrumpe si hay una ventana abierta. Al registrar una ayuda, la lista se actualiza al instante.
- **Loader:** cada consulta que inicia el operador (abrir una pestaña o una persona, registrar ayuda, generar un código, guardar un catálogo) muestra un loader de pantalla completa: fondo oscuro translúcido con desenfoque, un anillo que gira con el rojo SOS y la onda sísmica que se dibuja. Las actualizaciones automáticas de cada minuto no lo muestran. Muestra quién activó la alerta, el tipo de evento, hace cuánto, el origen (app, widget, acceso rápido o detección de caída), los contactos y la última ubicación con su precisión. Los simulacros se distinguen en morado.
- **Mapa en vivo** (Leaflet + OpenStreetMap) con cada alerta activa y su círculo de precisión.
- **Avisos al operador:** banner rojo y contador en la pestaña del navegador. Con «Activar avisos» (la preferencia se guarda en el navegador): pitido, notificación del sistema y una ventana (SweetAlert2) con «Ver persona» y «Brindar ayuda».
- **Brindar ayuda:** el operador registra *En atención*, *Ayuda enviada* o *Resuelta* con un mensaje. **La persona lo ve en la app** (consulta cada 15 s mientras la alerta está activa): cada actualización aparece como una **alerta fija arriba de la pantalla**, que se ve aunque esté con el scroll abajo, con el estado (p. ej. «Ayuda en camino: el centro de monitoreo envió ayuda») y el mensaje del operador. Se cierra tocándola o con la ✕ y solo vuelve a aparecer si llega otra actualización (otro estado o mensaje). El último estado también queda en un recuadro dentro de la pantalla de alerta.
- **Detalle de la persona:** contactos de emergencia con enlaces para llamar o escribir, ficha médica (descifrada solo en el panel), puntos de encuentro, historial de alertas con tiempos de confirmación y reacción, kit de emergencia, encuestas SUS y bitácora de la ayuda.
- **Indicadores para la tesis:** usuarios, activos en las últimas 24 h, alertas reales, simulacros, tiempo promedio de reacción en simulacros, tiempo de confirmación del SOS y SUS promedio. Historial de alertas y lista de usuarios con buscador.
- **Trazabilidad y seguridad:** cada consulta del detalle (incluye datos de salud), cada atención registrada y cada código de recuperación generado queda en el log con el operador. Los datos de la app se muestran como texto plano (protección contra XSS) y las acciones exigen token CSRF.
- Nueva tabla `sismo_atenciones_alertas` (bitácora de ayuda).

### 2.16 Recuperación de datos si se pierde el teléfono

- **Código de recuperación** (`XXXX-XXXX-XXXX`): en *Configuración → Respaldo y recuperación* la persona lo crea y lo guarda fuera del teléfono. No vence y crear otro invalida el anterior. La misma tarjeta muestra si hay cambios pendientes de subir.
- **Sin código:** el administrador, desde el panel, verifica la identidad de la persona y genera un **código temporal de 48 h**.
- **En el teléfono nuevo:** *Recuperar mis datos* → se escribe el código (sin importar mayúsculas ni guiones) → se confirma. Se restauran contactos, historial de alertas y métricas, ficha médica, puntos de encuentro, kit, encuestas y ajustes.
- **Seguridad:** el código es de un solo uso y solo se guarda su SHA-256. Al usarlo, el teléfono perdido **pierde el acceso al instante** (token nuevo). Un código inválido tarda 1 s en responder para frenar intentos de fuerza bruta.

### 2.17 Catálogos administrables (nada de negocio queda fijo en el código)

Todo lo que la app traía escrito en el código ahora se administra desde el panel, pestaña **Catálogos de la app** (backend CodeIgniter 3, tablas `sismo_catalogos`, `sismo_guia_tarjetas` y `sismo_parametros`). La app los descarga con `GET /catalogos`.

| Catálogo | Dónde se ve en la app |
|---|---|
| **Tipos de evento** (nombre es/en, ícono, orden) | Diálogo del SOS, historial, detalle, SMS, correo y CSV |
| **Parentescos** | Formulario de contactos |
| **Ítems sugeridos del kit** | Mochila de emergencia |
| **Pasos «Después del sismo»** | Lista de verificación |
| **Tipos de sangre** | Ficha médica |
| **Guía de emergencia** (tarjetas Antes/Durante/Después, introducciones y aviso) | Guía |
| **Parámetros**: número de emergencia, máximo de puntos de encuentro, opciones de ahorro de batería, espera del simulacro, actualización de la ubicación en alerta | Botón «Llamar al…» y todos los textos que mencionan el número, registro, ubicación, configuración, simulacro y alerta |

- **«Después del sismo» se guarda por clave de paso:** antes el avance se guardaba por posición (paso 1, 2, 3…), así que agregar o reordenar pasos lo habría dañado. Ahora cada casilla se guarda con la clave del paso, en el teléfono y en la base de datos, por alerta y en la lista de práctica. Un paso nuevo creado en el panel aparece en la app y se guarda igual. El avance guardado con versiones anteriores se convierte solo.
- **Funciona sin internet:** la app trae los mismos valores por defecto con los que se sembró la base de datos, descarga los del servidor al abrir con red (solo si cambió la versión) y guarda la última copia. El SOS nunca depende del servidor.
- **Claves estables:** la app guarda la clave, no el texto: renombrar no rompe los datos guardados. Ocultar un elemento no borra lo que ya lo usa (p. ej. un contacto con un parentesco que se ocultó lo conserva).
- **Reglas de seguridad:** `sismo` y `emergencia_general` (usados por el widget y la detección de caídas) se pueden renombrar pero no ocultar. Todo se valida en el servidor y los textos se guardan como texto plano.
- **Número de emergencia:** los textos de la app usan el marcador `{emergencyNumber}` y se reemplaza por el número configurado.
- **Se deja fijo a propósito:** la encuesta SUS (sus respuestas sí se guardan en la base de datos). Es un instrumento estándar de 10 preguntas y modificarlo invalida el puntaje de la tesis. También quedan fijos los estados técnicos de los que depende la lógica.

### 2.18 Sismos recientes en el panel

Pestaña **Sismos recientes** con las **últimas 24 horas** y los **últimos 7 días**, los mismos periodos que la app. Muestra los sismos de magnitud 2.5 o más en Colombia y alrededores, desde el catálogo público del USGS, que el backend consulta y guarda en caché 5 minutos. La tabla trae fecha, magnitud, lugar, profundidad, cuántas personas lo reportaron y el enlace al detalle. Los sismos también se ven en el mapa (tamaño y color según la magnitud) y al hacer clic en uno el mapa se centra en él.

### 2.19 Modo de demostración solo en desarrollo

- En desarrollo (`npm run dev`) se ve todo lo de demostración: opción en la bienvenida, aviso en el encabezado y tarjeta en Configuración.
- En producción (`npm run build` y el APK) **no aparece en ninguna pantalla**, el registro es siempre obligatorio y, si el teléfono tenía el modo encendido o datos ficticios, se apaga y se borran solos.
- Las pruebas e2e lo habilitan solo para su compilación (`VITE_DEMO=true`).

### 2.20 Pantalla de carga, loader de solicitudes y aviso de «sin conexión» (app)

- **Pantalla de carga al abrir:** fondo azul SISMO con el anillo rojo que gira, la onda sísmica que se dibuja y el nombre SISMO. Dura entre 0,6 s y 1,5 s mientras se intentan descargar los catálogos, y **nunca espera a la red más de eso**. **No aparece si la app se abre para una alerta** (widget, acceso rápido, alerta activa o pantalla de alerta): el SOS nunca queda tapado.
- **Loader en las solicitudes que hace la persona:** crear el código de recuperación, recuperar datos, buscar una dirección y consultar sismos recientes. Usa la misma marca sobre un fondo oscuro translúcido con desenfoque. La sincronización automática no lo muestra: sigue en silencio.
- **Aviso de guardado sin conexión:** en todas las pantallas (incluidas la bienvenida y el registro) aparece cuando no hay internet o cuando el servidor no responde. Dice que los datos quedan guardados en el teléfono y se suben solos apenas vuelva la conexión, con el número de cambios pendientes. Verificado con el navegador sin conexión en la bienvenida y en el registro. En la bienvenida, con conexión, la consola queda sin errores: registro 201, catálogos 200 y ajustes 200 (los errores de CORS vistos antes eran del puerto 5181, corregido en §2.14).
- Respeta «reducir movimiento» del sistema (animaciones más lentas o fijas).
- **Pantalla de error amable:** si algo falla al dibujar la app, en vez de una pantalla en blanco aparece «Algo salió mal» con «Recargar» y el botón para llamar al número de emergencia configurado. Los datos del teléfono no se tocan.
- **Desarrollo:** el estado de la app sobrevive a la recarga en caliente de Vite, así que ya no aparece el error «useAppState debe usarse dentro de AppStateProvider» al guardar archivos. Los mensajes de CSP, `simulator.js` o «Receiving end does not exist» vienen de las extensiones o del simulador de celular del navegador, no de SISMO: con la página abierta directamente, la consola queda sin errores.

### 2.21 Eliminar mi cuenta (app + backend)

- **En la app:** *Configuración → Eliminar mi cuenta*, con confirmación. Borra la cuenta en el servidor y todo lo del teléfono (datos, cambios pendientes y token) y vuelve a la bienvenida.
- **Al volver a entrar no estorba nada:** el token anterior queda revocado en el servidor y borrado del teléfono, y el código de recuperación se anula (ya no sirve para recuperar una cuenta eliminada). La app se registra como un usuario nuevo y limpio, con token nuevo. Si la persona quiere un código, crea uno nuevo.
- **En el backend** (`POST /eliminar_cuenta`, en una sola transacción): borrado lógico en cascada (`activo = 0`, convención CCS) de ajustes, contactos, alertas, puntos de encuentro, encuestas, kit, ficha médica y bitácora de ayuda. Además hay **supresión de datos personales y de salud** (Ley 1581): se vacían el nombre, los contactos, la ficha médica cifrada, las ubicaciones, los puntos de encuentro, las notas y los mensajes de ayuda. Solo quedan métricas anónimas (tiempos de reacción y confirmación, SUS) para la tesis. La persona desaparece del panel.
- **Sin conexión** no se borra nada (para no dejar datos huérfanos en el servidor) y la app avisa que debe intentarlo con internet.
- **Verificado de punta a punta:** registro, contacto y código de recuperación; luego eliminar → `ok` y el token anterior queda inválido. Pruebas unitarias: aviso al servidor, borrado del token y la cola, y comportamiento sin red.

### 2.22 Página web informativa (comercial) desde el backend

Se creó una **página web informativa para presentar y «vender» SISMO**, servida por el backend en CodeIgniter 3 en `Sismo_info`. **Es pública: no exige iniciar sesión** (controlador propio, separado del panel, que sigue protegido). Desde el panel se abre con el botón «Qué ofrece SISMO»; solo si quien la ve es administrador aparece además «Ir al panel». Es una página propia, sin menús ni encabezados de otros sistemas, con la identidad visual de la app (paleta, logo, Inter) y tema claro u oscuro con botón de sol y luna (comparte la preferencia con el panel).

- **Contenido:** portada con llamado a la acción y capturas de la app dentro de teléfonos; cifras del producto (1 toque, sin red, ubicación cada 2 min, en vivo); **«Lo que aún está pendiente»** en una franja propia (hoy el SMS y el WhatsApp los confirma la persona; pendiente el correo automático a los contactos al activar el SOS y el envío de la ubicación actualizada por correo); beneficios para la organización; funciones con capturas (alerta, centro de monitoreo, orientación, información con la ficha médica, su QR y lo que ve quien lo escanea, guía y sismos recientes, supervivencia); **el panel de monitoreo en un monitor de escritorio y en un portátil**; **«Todo es administrable»** con pestañas Catálogos / Guía / Parámetros (lo editado en el panel llega a la app sin publicar una nueva versión); carrusel automático de pantallas; comparación con y sin SISMO; cómo funciona en 4 pasos; seguridad y privacidad; cierre.
- **Botón «Solicitar una demostración»:** se activa con `sismo_contacto_url` en `config/sismo.php` (solo URL `https://`); vacío = no se muestra.
- **Movimiento:** aparición al hacer scroll, dispositivos que flotan, pares de teléfonos inclinados en 3D, abanico de cuatro teléfonos y fondo de partículas conectadas (solo se anima la sección visible). Todo se desactiva si el sistema pide reducir el movimiento. Carrusel que avanza solo cada 3,5 s y se pausa con el mouse o el foco.
- **Contenido honesto:** solo funciones que existen; las capturas usan datos ficticios (los sismos son datos reales del USGS). Contenido estático: no consulta datos de personas.
- **Imágenes:** capturas de la app y del panel convertidas a WebP (`assets/sismo/landing/`, ~1 MB en total), con carga diferida.
- **Adaptable:** escritorio y celular sin scroll horizontal (verificado a 1440 px y 390 px).

## 3. Decisiones de diseño

| Decisión | Motivo |
|---|---|
| Señales en un servicio nativo en primer plano | Android pausa la app en segundo plano; el servicio mantiene sirena, linterna y vibración con la pantalla bloqueada |
| Linterna con `setTorchMode` en lugar de la cámara | No requiere permiso de cámara y no compite con la vista web |
| El widget se activa con doble toque; el acceso rápido pide confirmación en el diálogo | El doble toque en el widget evita activaciones accidentales (p. ej. en el bolsillo) sin perder tiempo en diálogos |
| El SMS no se abre automáticamente | Abrir otra app envía SISMO a segundo plano; se deja al usuario decidir el momento |
| Estado «SMS abierto», nunca «Enviada» | SISMO no puede comprobar el envío ni la entrega |
| Ubicación de la alerta guardada en el teléfono y en la base de datos, pero no enviada sola a los contactos | El envío automático será por el servidor de correo (pendiente de conectar) |
| Offline-first: el teléfono es la fuente inmediata y la base de datos se actualiza con una cola | Tras un sismo la red falla o se satura; la app nunca debe esperar al servidor para funcionar ni perder datos |
| Identidad por dispositivo con token, sin contraseña | No agrega pasos en el registro; el servidor solo guarda el hash del token |
| Operaciones idempotentes por UUID de la app | Reenviar la cola tras un corte no crea duplicados |
| Ficha médica cifrada en la base de datos | Es un dato de salud; antes no salía del teléfono. Requiere aprobación del tratamiento de datos (Ley 1581) |
| Panel en tiempo real por consulta periódica (5 s), no WebSockets | Funciona en cualquier servidor PHP sin infraestructura adicional; 5 s es suficiente para coordinar ayuda |
| La ayuda registrada se muestra en la app | La persona sabe que alguien atiende su alerta; reduce la angustia y orienta qué hacer |
| Recuperación con código de un solo uso, sin contraseña | Mantiene el registro sin fricción; el código puede generarlo la persona o, verificando identidad, el administrador |
| Al recuperar, el teléfono anterior pierde el acceso | Un teléfono robado no debe seguir sincronizando ni recibiendo datos |
| Catálogos con valores por defecto en la app + copia local | En un sismo puede no haber internet: la app nunca debe quedar sin listas ni sin guía |
| Se guarda la clave del catálogo, no el texto | Renombrar o traducir no rompe los datos ya guardados |
| «Después del sismo» por clave de paso y no por posición | Agregar, quitar o reordenar pasos no cambia lo que la persona ya marcó |
| Encuesta SUS fija | Es un instrumento estandarizado; cambiarla invalida la comparación del puntaje |
| Modo demostración solo en desarrollo | En producción los datos ficticios podrían confundirse con reales o saltarse el registro obligatorio |
| Pantalla de carga breve y nunca al abrir para una alerta | En una emergencia cada segundo cuenta: el SOS no puede esperar a la red ni a una animación |
| Aviso explícito de «sus datos se guardan en el teléfono» | Sin conexión la persona debe saber que no perdió nada y que se subirá solo |
| Eliminar cuenta = borrado lógico + vaciar datos personales | Cumple la convención de BD del CCS (sin borrado físico) y el derecho de supresión de la Ley 1581; las métricas anónimas siguen sirviendo a la tesis |
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
- **Ubicación durante la alerta:** se actualiza en el dispositivo y en la base de datos, pero no se envía sola a los contactos.
- **Base de datos:** para recuperar los datos en otro teléfono hace falta el código de recuperación (propio o generado por el administrador). El registro de dispositivos todavía no tiene límite por IP.
- **Panel:** la ayuda registrada llega a la app solo mientras la pantalla de alerta está abierta y hay red (no hay notificaciones push).
- **Sincronización:** solo sube (teléfono → servidor); no hay edición desde otro dispositivo ni resolución de conflictos.
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
| Pruebas unitarias (Vitest) | **116 de 116** superadas (incluye sincronización sin red → con red, recuperación, catálogos y número de emergencia configurable) |
| Catálogos | `GET /catalogos` probado contra la base de desarrollo: 3 tipos de evento, 6 parentescos, 13 ítems del kit, 11 pasos post-sismo, 9 tipos de sangre, 11 tarjetas de guía y parámetros. **Pendiente:** probar la edición desde el panel con sesión |
| Sismos recientes | Consulta al USGS probada (últimas 24 h y 7 días) |
| Backend (CodeIgniter 3) | Endpoints probados de punta a punta contra la base de datos de desarrollo: registro, ajustes, contactos, alertas, inventario, encuestas, validación, CORS, código de recuperación y recuperación (token anterior invalidado, código de un solo uso). **Pendiente:** ficha médica (falta la llave de cifrado en el servidor) |
| Panel administrativo | Carga y consulta de usuarios verificadas en desarrollo; **pendiente** probarlo con una alerta real desde el teléfono y con varios operadores |
| Pruebas e2e (Playwright, móvil y escritorio) | **114 de 114** superadas (4/11/2026). Primera corrida: 110 de 114; las 4 de «Después del sismo» esperaban el avance guardado por posición. Se actualizaron al guardado por clave de paso y pasan |
| Cubierto por pruebas e2e | Datos faltantes en rojo (aviso en Inicio y bordes), confirmaciones y borrar puntos en el registro, editar y eliminar contactos en el registro, ahorro de batería automático (batería simulada, aviso, no se reactiva, «Nunca»), contacto desde la agenda en el registro, registro obligatorio (4 pasos y SOS), varios puntos de encuentro (lista, más cercano, tope de 5), ubicación cada 5 min (reloj simulado), páginas nuevas, botón 123, métricas, ubicación automática al dar SOS, simulacro desde Inicio con su señal, encuesta SUS, mochila, modo atrapado (entrar y salir), muestras de sonido en Configuración, detección de caídas, navegación engranaje/casita sin vistas superpuestas, ficha médica, estadísticas y CSV, sismos |
| Cubierto por pruebas unitarias | Texto de los SMS (varios puntos de encuentro), punto más cercano, migración de datos, métricas y CSV, sismos, SUS, mochila, detector de caídas |
| Integración continua | Configurada; se verá su primera ejecución en GitHub al subir los cambios |
| Prueba en emulador Android 16 | Widgets 1×1 y 2×2 (selector, colocación, doble toque), alerta abierta desde el widget con la app recién instalada, señales nativas encendidas y notificación «Alerta SISMO activa» (capturas en `screenshots/2026-11-02/android/`) |
| Prueba en dispositivo físico | **Pendiente**: servicio nativo con pantalla bloqueada, modo atrapado con pantalla apagada, silbato, linterna SOS, vibración, notificación, widget, acceso rápido, voz, selector de contactos, batería, SMS y llamada |
| Sin pruebas automáticas | Funciones nativas de Android |

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
| 7 | Funcionamiento sin conexión (PWA / service worker) | La guía y la alerta local disponibles sin red (los **datos** ya se guardan sin red y se suben al volver la conexión, §2.14) |
| 8 | **Poner en marcha la base de datos:** ejecutar el SQL de las tablas `sismo_*`, definir `SISMO_LLAVE_CIFRADO` y `SISMO_CORS_ORIGENES` en el servidor y `VITE_SISMO_API_URL` en la app | Los datos empiezan a guardarse en la base de datos |
| 9 | Aprobación del tratamiento de datos de salud y de contactos (Ley 1581) | Requisito legal antes de usar la ficha médica en el servidor con usuarios reales |
| 10 | Notificaciones push a la app cuando el centro de monitoreo registra ayuda | La persona se entera aunque no tenga la pantalla de alerta abierta |
| 10b | Protocolo de atención con el equipo de emergencias y prueba del panel con varios operadores | Uso real del centro de monitoreo |
| 11 | Estadísticas de la tesis consultando la base de datos (tiempos de reacción, SUS) | Análisis con todos los participantes, no teléfono por teléfono |

## 7. Evidencias: capturas de pantalla y de código

Las capturas se guardan en carpetas con la **fecha en que se tomaron** (`screenshots/AAAA-MM-DD/`), para conservar el historial del prototipo. Desde el 2/11/2026 cada fecha se organiza así:

```
screenshots/AAAA-MM-DD/
├── codigo/
│   ├── codigo_front/   código nuevo o modificado de la app
│   └── codigo_back/    código nuevo o modificado del backend
└── visual/
    ├── visual_front/   pantallazos de los cambios visuales de la app
    └── visual_back/    pantallazos de los cambios visuales del backend (panel), cuando aplica
```

**Nombres:** `NN-descripcion-corta.png` (número de orden de dos dígitos y descripción en minúsculas separada con guiones). Cada archivo aparece abajo con lo que muestra. Las de pantalla web y de código se generan con `npm run screenshots` (app real compilada, con datos ficticios); las de Android, en el emulador con el APK de depuración.

**Diagramas:** `screenshots/diagramas/` (sin fecha, se actualiza con cada cambio de la base de datos). `BASE_DE_DATOS_SISMO.md` es el diccionario de datos del backend: diagrama entidad-relación (Mermaid; GitHub lo dibuja), las 12 tablas `sismo_*` con cada columna, tipo, si admite nulos, valor por defecto y descripción, índices, valores iniciales de catálogos y parámetros, y dónde quedan los datos personales y cómo se protegen.

**Documentación gráfica:** `screenshots/diagramas/DIAGRAMAS.md` es el índice de **33 diagramas**, cada uno en su propia imagen PNG y construido a partir del código real. Cuando una función la usan roles distintos (persona usuaria, operador del centro de monitoreo, visitante), hay un diagrama por rol.
- **UML y funcionales:** casos de uso, actividades, secuencia, clases, estados y flujo de procesos.
- **Arquitectura y diseño:** arquitectura, componentes, despliegue, infraestructura y navegación.
- **Base de datos:** DER, modelo lógico y modelo físico (este último generado desde el script SQL).
- **Planificación y tiempos:** Gantt, PERT, ruta crítica y línea de tiempo.

El envío de correos de alerta aparece como función del sistema (servicio de correo + proveedor). Las fechas de planificación salen de las tres entregas registradas (24/10, 02/11 y 04/11/2026), y la ruta crítica se calcula con CPM. Las fuentes Mermaid están en `screenshots/diagramas/fuentes/` y las imágenes se regeneran con `generar-imagenes.cjs`.

**Documentación técnica y funcional:** `screenshots/documentacion/DOCUMENTACION.md` es el índice de los documentos 19 a 30: requisitos funcionales (48) y no funcionales, historias de usuario (21), diccionario de datos, API y endpoints, manual técnico, manual de usuario, plan y casos de prueba, informe de resultados (04/11/2026: 116 de 116 unitarias, 114 de 114 e2e, lint y tipos sin errores), registro de riesgos (17), índice de evidencias visuales (125) y registro de cambios y versiones (1.0 a 3.1).

### 7.1 Carpeta `screenshots/2026-10-24/` (primera versión)

| Carpeta | Archivo | Qué muestra |
|---|---|---|
| `visual/` | `01-bienvenida.png` | Bienvenida |
| `visual/` | `02-inicio.png` | Panel principal |
| `visual/` | `03-confirmacion-alerta.png` | Diálogo de confirmación del SOS |
| `visual/` | `04-alerta-activa.png` | Alerta activa |
| `visual/` | `05-ubicacion.png` | Ubicación |
| `visual/` | `06-contactos.png` | Contactos de confianza |
| `visual/` | `07-agregar-contacto.png` | Agregar contacto |
| `visual/` | `08-historial.png` | Historial |
| `visual/` | `09-guia-emergencia.png` | Guía de emergencia |
| `visual/` | `10-configuracion.png` | Configuración |
| `visual/` | `12-vista-escritorio.png` | Vista de escritorio |
| `codigo/` | `13-estructura-proyecto.png` | Estructura del proyecto |
| `codigo/` | `14-package-json.png` | `package.json` |
| `codigo/` | `15-navegacion-rutas.png` | Rutas (`App.tsx`) |
| `codigo/` | `16-componente-boton-panico.png` | Componente del botón de pánico |
| `codigo/` | `17-logica-alertas.png` | Lógica de alertas |

### 7.2 Carpeta `screenshots/2026-11-02/` (versión anterior)

**`visual/visual_front/`** (vista móvil 390×844, español):

| Archivo | Qué muestra |
|---|---|
| `01-bienvenida.png` | Bienvenida con idioma y modo de demostración |
| `02-registro-1-nombre.png` | Registro, paso 1: nombre |
| `03-registro-2-ubicacion.png` | Registro, paso 2: ubicación obtenida |
| `04-registro-3-puntos-de-encuentro.png` | Registro, paso 3: dos puntos de encuentro en lista |
| `05-registro-4-nuevo-contacto.png` | Registro, paso 4: formulario de contacto con la relación en botones |
| `06-registro-4-contactos.png` | Registro, paso 4: contacto agregado con editar y eliminar |
| `07-inicio.png` | Inicio tras el registro |
| `08-sos-tipo-de-evento.png` | Diálogo del SOS: tipo de evento |
| `09-alerta-pregunta-correo.png` | Pregunta «¿Enviar correo a sus contactos?» con cuenta regresiva |
| `10-alerta-activa.png` | Alerta activa |
| `11-alerta-ahorro-bateria.png` | Ahorro de batería automático (batería al 15 %) |
| `12-alerta-avisar-bateria-baja.png` | Elegir canal para avisar batería baja |
| `13-estoy-bien-canal.png` | «Estoy bien»: SMS o WhatsApp por contacto |
| `14-despues-del-sismo.png` | Lista «Después del sismo» |
| `15-despues-del-sismo-completo.png` | «Después del sismo» completa: brújula y ruta al punto más cercano |
| `16-ubicacion-mapa-real.png` | Ubicación con el mapa real y los puntos de encuentro |
| `17-brujula-varios-puntos.png` | Brújula con «Guiar hacia» (más cercano y distancias) |
| `18-ruta-al-punto-de-encuentro.png` | Ruta a pie con mapa, distancia y tiempo |
| `19-contactos.png` | Contactos |
| `20-configuracion-completa.png` | Configuración completa (incluye ahorro de batería) |
| `21-registro-sos-disponible.png` | Registro con el botón «SOS · Emergencia ahora» |
| `22-inicio-datos-faltantes.png` | Inicio con el aviso rojo de datos faltantes |
| `23-ubicacion-datos-faltantes.png` | Ubicación con bordes rojos en lo que falta |
| `24-inicio-demostracion.png` | Inicio en modo de demostración |
| `25-inicio-completo.png` | Inicio completo (accesos rápidos) |
| `26-historial.png` | Historial |
| `27-detalle-de-alerta.png` | Detalle de una alerta |
| `28-guia-de-emergencia.png` | Guía de emergencia |
| `29-mochila-de-emergencia.png` | Mochila de emergencia |
| `30-ficha-medica.png` | Ficha médica |
| `31-simulacro.png` | Simulacro |
| `32-estadisticas.png` | Estadísticas |
| `33-sismos-recientes.png` | Sismos recientes (USGS) |
| `34-encuesta-sus.png` | Encuesta SUS |
| `35-inicio-tema-oscuro.png` | Tema oscuro |
| `36-inicio-ingles.png` | Interfaz en inglés |
| `37-vista-escritorio.png` | Vista de escritorio |

**`codigo/codigo_front/`**:

| Archivo | Qué muestra |
|---|---|
| `01-estructura-proyecto.png` | Estructura del proyecto |
| `02-package-json.png` | `package.json` |
| `03-navegacion-rutas.png` | Rutas (`App.tsx`) |
| `04-componente-boton-panico.png` | `PanicButton.tsx` |
| `05-registro-obligatorio.png` | `SetupPage.tsx`: registro de 4 pasos |
| `06-datos-faltantes.png` | `setupGaps.ts`: datos faltantes (borde rojo) |
| `07-puntos-de-encuentro.png` | `meetingPoints.ts`: varios puntos y el más cercano |
| `08-mensajes-sms-whatsapp.png` | `smsService.ts`: aviso de alerta, «Estoy bien» y batería baja |
| `09-ahorro-bateria-automatico.png` | `AlertPage.tsx`: ahorro de batería automático |
| `10-ubicacion-cada-5-minutos.png` | `useLocationAutoRefresh.ts` |
| `11-widget-doble-toque.png` | `SosWidgetProvider.java`: doble toque |
| `12-widget-diseno-2x2.png` | `widget_sos_large.xml`: diseño del widget 2×2 |
| `13-paleta-de-colores.png` | `theme.css`: paleta de colores |

**`android/`** (emulador Android 16, en español):

| Archivo | Qué muestra |
|---|---|
| `01-selector-de-widgets.png` | Selector de widgets con «SOS SISMO» (1×1) y «SOS SISMO (grande)» (2×2) |
| `02-widgets-en-pantalla-de-inicio.png` | Los dos widgets en la pantalla de inicio |
| `03-widget-1x1-primer-toque.png` | Widget 1×1 tras el primer toque: «¿SOS? / OTRA VEZ» |
| `04-widget-2x2-primer-toque.png` | Widget 2×2 tras el primer toque: «¿ACTIVAR?» con borde amarillo |
| `05-alerta-activada-desde-el-widget.png` | Segundo toque: SISMO abre la alerta activa (app recién instalada, sin registro) |
| `06-notificacion-alerta-activa.png` | Notificación «Alerta SISMO activa · Sirena · Linterna SOS · Vibración» con «Silenciar sonido» |

### 7.3 Carpeta `screenshots/2026-11-04/` (esta versión: backend, sincronización, panel y catálogos)

Capturas con **datos ficticios** (nombres «Demo», teléfonos de prueba y correos `@example.com`). En las de la app, las respuestas del servidor se simularon para no escribir en la base de datos. Las del panel se tomaron con la vista real alimentada con datos de prueba.

**`visual/visual_front/`** (app, vista móvil 390×844, español):

| Archivo | Qué muestra |
|---|---|
| `01-pantalla-de-carga.png` | Pantalla de carga al abrir la app: anillo rojo, onda sísmica y «SISMO» (§2.20) |
| `02-bienvenida-sin-conexion.png` | Bienvenida sin internet: «Sus datos se guardan en el teléfono y se subirán apenas haya conexión» (§2.20) |
| `03-registro-sin-conexion.png` | Registro sin internet con el mismo aviso (§2.20) |
| `04-inicio-sin-conexion-cambios-pendientes.png` | Inicio sin internet con el número de cambios pendientes de subir (§2.14) |
| `05-alerta-ayuda-del-centro-de-monitoreo.png` | Alerta activa con el aviso fijo del centro de monitoreo («Ayuda en camino» y el mensaje del operador) sobre la pregunta del correo, con la cuenta regresiva ya ajustada para que no se salga del diálogo (§2.15, §2.10) |
| `06-configuracion-respaldo-y-recuperacion.png` | Configuración → Respaldo y recuperación: crear código y recuperar datos (§2.16) |
| `07-loader-de-solicitud.png` | Loader de pantalla completa mientras se crea el código de recuperación (§2.20) |
| `08-codigo-de-recuperacion.png` | Código de recuperación generado, para guardarlo fuera del teléfono (§2.16) |
| `09-configuracion-eliminar-cuenta.png` | Configuración → Eliminar mi cuenta (§2.21) |
| `10-confirmar-eliminar-cuenta.png` | Confirmación antes de eliminar la cuenta (§2.21) |
| `11-guia-desde-catalogo.png` | Guía de emergencia leída del catálogo administrable (§2.17) |
| `12-despues-del-sismo-por-clave.png` | «Después del sismo» con pasos del catálogo y avance guardado por clave de paso (§2.17) |
| `13-alerta-aviso-del-centro.png` | Alerta activa solo con el aviso fijo del centro de monitoreo (correo descartado): «Ayuda en camino», el mensaje del operador y el recuadro de estado (§2.15) |
| `14-ficha-medica-qr.png` | Ficha médica con datos ficticios y su QR médico para rescatistas (§2.11) |
| `15-qr-escaneado-por-un-rescatista.png` | Lo que ve un rescatista al escanear el QR con cualquier lector del teléfono: la ficha en texto, sin internet ni SISMO. El texto es el real decodificado del QR; la pantalla del lector es una simulación genérica (§2.11) |
| `16-guia-de-emergencia.png` | Guía de emergencia («Durante») con lectura en voz alta, sin modo de demostración (§2.5, §2.17) |
| `17-sismos-recientes.png` | Sismos recientes de los últimos 7 días en Colombia con datos reales del USGS (§2.5) |

**`visual/visual_back/`** (panel administrativo, 1440×900, tema oscuro):

| Archivo | Qué muestra |
|---|---|
| `01-panel-alertas-activas-y-mapa.png` | Indicadores, banner SOS, alertas activas con su estado de atención y mapa en tiempo real (§2.15) |
| `02-panel-brindar-ayuda.png` | Ventana «Brindar ayuda»: estado de la atención y mensaje para la persona (§2.15) |
| `03-panel-detalle-de-la-persona.png` | Detalle de la persona: contactos, ficha médica, puntos de encuentro, alertas y bitácora de ayuda (§2.15) |
| `04-panel-sismos-recientes.png` | Sismos recientes del USGS (últimas 24 h / 7 días) en tabla y mapa (§2.18) |
| `05-panel-usuarios.png` | Lista de usuarios con plataforma, última sincronización y alertas (§2.15) |
| `06-panel-catalogos-tipos-de-evento.png` | Catálogos de la app: tipos de evento (§2.17) |
| `07-panel-catalogos-guia.png` | Catálogos de la app: tarjetas de la guía de emergencia (§2.17) |
| `08-panel-editar-tarjeta-de-la-guia.png` | Edición de una tarjeta de la guía (título y pasos en español e inglés, ícono, orden) (§2.17) |
| `09-panel-parametros.png` | Parámetros: número de emergencia, topes, tiempos y textos de la guía (§2.17) |
| `10-panel-loader.png` | Loader del panel durante una consulta iniciada por el operador (§2.15) |
| `11-pagina-informativa-escritorio.png` | Página web informativa completa en escritorio (1440 px, tema claro): portada, pendientes, beneficios, funciones, panel en escritorio y portátil, todo administrable, carrusel, comparación, pasos y seguridad (§2.22) |
| `12-pagina-informativa-celular.png` | Portada de la página informativa en celular (390 px, tema oscuro) (§2.22) |

**`codigo/codigo_front/`** (código real del repositorio de la app):

| Archivo | Qué muestra |
|---|---|
| `01-cola-sin-conexion.png` | `syncService.ts`: diferencias del estado → operaciones por recurso para la cola persistente |
| `02-envio-y-reintentos.png` | `syncService.ts`: envío al volver la red, reintentos y nuevo registro inmediato tras un 401 |
| `03-recuperar-datos.png` | `syncService.ts`: código de recuperación y restaurar en un teléfono nuevo |
| `04-eliminar-cuenta.png` | `syncService.ts`: eliminar cuenta en el servidor y olvidar token y cola |
| `05-catalogos-administrables.png` | `catalogService.ts`: catálogos con valores por defecto y copia local sin red |
| `06-despues-del-sismo-por-clave.png` | `PostQuakePage.tsx`: avance guardado por clave de paso |
| `07-numero-emergencia-configurable.png` | `i18n/index.ts`: número de emergencia configurable en todos los textos |
| `08-pantalla-de-carga-y-loader.png` | `AppLoader.tsx`: pantalla de carga que nunca tapa el SOS |
| `09-aviso-sin-conexion.png` | `SyncStatusBanner.tsx`: aviso «sus datos se guardan en el teléfono» |
| `10-alerta-ayuda-fija.png` | `HelpStatusBanner.tsx`: aviso fijo del centro de monitoreo que se cierra tocándolo |
| `11-modo-demo-solo-desarrollo.png` | `env.ts` y `AppStateProvider.tsx`: modo de demostración solo en desarrollo |
| `12-backend-en-la-app.png` | `AppStateProvider.tsx`: sincronización y descarga de catálogos al abrir |

**`codigo/codigo_back/`** (backend en CodeIgniter 3 y scripts SQL):

| Archivo | Qué muestra |
|---|---|
| `01-tablas-sismo.png` | SQL: tablas de usuarios y alertas con la convención de BD del CCS |
| `02-tablas-catalogos.png` | SQL: tablas de catálogos y de la guía de emergencia |
| `03-api-rutas.png` | Controlador de la API: rutas REST de la app |
| `04-api-cors-y-validacion.png` | Controlador de la API: validación central, CORS y logs JSON con `execution_id` |
| `05-escritura-idempotente.png` | Modelo: escrituras idempotentes por el UUID de la app |
| `06-ficha-medica-cifrada.png` | Modelo: ficha médica cifrada AES-256-GCM con llave en variable de entorno |
| `07-recuperacion-de-cuenta.png` | Modelo: código de recuperación y token nuevo |
| `08-eliminar-cuenta.png` | Modelo: eliminar cuenta (borrado lógico en cascada + supresión de datos personales) |
| `09-catalogos-para-la-app.png` | Modelo: catálogos activos con versión para la app |
| `10-sismos-recientes-usgs.png` | Modelo: sismos de 24 h y 7 días desde el USGS con caché de 5 minutos |
| `11-panel-endpoints.png` | Controlador del panel: datos, detalle de la persona, ayuda y código de recuperación |
| `12-panel-tiempo-real-y-loader.png` | Vista del panel: consultas con loader y actualización silenciosa |

