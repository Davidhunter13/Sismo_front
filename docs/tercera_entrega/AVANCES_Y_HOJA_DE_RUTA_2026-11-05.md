> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# SISMO — Avances de la tercera entrega

**Fecha:** 5 de noviembre de 2026 · **Versión:** 3.6 · **Fase del plan:** 3 · actividad L (05/11 – 06/11), con adelanto de la actividad P «Correo de alertas en producción y pruebas reales» (16/11 – 20/11).

Desde esta entrega, todo lo nuevo queda en `docs/tercera_entrega/` y `screenshots/tercera_entrega/`. Cuando un diagrama o un documento cambia, se copia el de la segunda entrega como base y se actualiza la copia (los de la segunda entrega no se tocan); en la sección 4 se explica qué cambió y por qué. Lo anterior está en [`../segunda_entrega/AVANCES_Y_HOJA_DE_RUTA_2026-11-04.md`](../segunda_entrega/AVANCES_Y_HOJA_DE_RUTA_2026-11-04.md).

---

## 1. Resumen

| Área | Antes (segunda entrega) | Ahora (tercera entrega) |
|---|---|---|
| Correo de alerta | La app tenía el diálogo y la cuenta regresiva, pero el envío dependía de un servidor de correo aún sin conectar | **El backend envía el correo** con el servicio de correo de la organización, por el mismo API de sincronización |
| Destinatarios | La app armaba la lista | **El servidor toma los contactos guardados**; la app no decide a quién se escribe |
| Principales y copia | Todos iguales | **Contacto principal del correo** («Para»); los demás en **copia oculta** |
| Tipos de correo | Solo el inicial | **Activó la alarma**, **caída sin respuesta**, **ayuda urgente**, **modo atrapado**, **batería baja** y **ubicación actualizada** |
| Centro de monitoreo | Solo mensajes a la persona | Además **escribe a los contactos** desde el panel, con mensaje propio o **plantillas para contactos** |
| Diseño | Texto plano | **Diseño de la app**: azul marino, rojo SOS, logo en base64 y botón «Ver ubicación en el mapa» |
| Control | — | Un envío por alerta y tipo (la ubicación, uno cada 15 min), nada en simulacros, límites por hora y **bitácoras** sin direcciones |
| Inicio de la app | «Canal digital: SMS» | **«SMS y WhatsApp (manual)»** y **«Correo a contactos (automático)»** con su estado real |
| Página informativa | El correo figuraba como pendiente | Sección **«Cómo avisa a sus contactos»** con lo que ya funciona y el correo en un teléfono |
| **Plus: insignias** | — (no estaba en el plan) | **100 insignias automáticas** (secretas, con fechas y con vencimiento), Mis insignias, «Perfil completado» y su administración en el panel |
| **Foto de perfil** | — | Tomar o elegir la foto; se guarda en el bucket, se ve en la app, en el panel y **en los correos** |
| Producción | Textos de «demostración» visibles | En producción **no aparece nada de demo**; «Borrar todos los datos» solo en desarrollo |
| **App Android: descarga y versiones** | El APK se compartía a mano | Botón **«Descargar para Android»** en la página informativa, **APK en el bucket** subido desde el panel y **aviso de actualización** (sugerido u obligatorio; tienda o APK) |
| **Sismos recientes** | Solo los de Colombia o a menos de 500 km de la persona | Además **«Todo el mundo»**: sismos de magnitud 4,5 o mayor de todo el planeta, con gráfica de picos, mapa mundial y lista |

---

## 2. Funciones implementadas

### 2.1 Correo «activó la alarma» (el principal)

- Al activar una alerta real, la app pregunta «¿Enviar correo a sus contactos?» con cuenta regresiva de 20 s; el diálogo dice cuántos van como principales y cuántos en copia oculta.
- Con «Sí» o sin respuesta, la app **sube lo pendiente** (contactos y alerta) y llama a `POST sismo/correo_alerta/{id}` con el token del teléfono. El backend envía el correo y responde cuántos destinatarios hubo.
- Estados en la app: **enviado**, **sin destinatarios**, **fallido** (se puede reintentar), **cancelado** y **sin servidor**.

### 2.2 Correo de caída sin respuesta

- Si la alerta se activó sola porque la persona **no respondió «¿Está bien?»** tras una caída, el correo inicial es de tipo **«caída»**: asunto «SISMO: se detectó una caída de Ana y no respondió», título propio y la explicación en la primera línea.
- Si la persona tocó «Pedir ayuda ahora», sale el de «activó la alarma» y además el de **ayuda urgente**.

### 2.3 Avisos por correo durante la alerta

- **Ayuda urgente:** al tocar «Necesito ayuda urgente» (aunque se haya cancelado el correo inicial, porque lo pide la persona).
- **Modo atrapado:** al activarlo (si lo activó el ahorro automático por batería, basta el aviso de batería).
- **Batería baja:** al llegar al umbral de Configuración, con el porcentaje.
- Una vez por alerta y tipo; atrapado y batería solo si no se canceló el correo inicial; nunca en simulacros.

### 2.4 Ubicación actualizada por correo (sin cron)

- Durante la alerta la app ya registra la ubicación cada 2 minutos. Con cada ubicación nueva, si la persona **se desplazó 200 m o más** desde la última ubicación enviada por correo y pasaron **15 minutos**, se envía el correo **«Ubicación actualizada»** con el mapa nuevo.
- Solo si el correo inicial se envió; nunca en simulacros. El servidor también exige los 15 minutos (si la app reintenta, responde «ya enviado»).
- **No hace falta un cron:** el aviso depende de las ubicaciones que envía el teléfono. Un cron solo serviría para algo que el servidor haga sin datos nuevos (por ejemplo, «lleva 30 min sin dar señales»), que queda como posible mejora.

### 2.5 Contacto principal del correo

- Al crear o editar un contacto aparece **«Contacto principal del correo»**. Los principales reciben el correo en «Para» y los demás en **copia oculta** (nadie ve los correos de los otros contactos).
- Se pueden marcar varios. Si no hay ninguno, **el primero es el principal** (lo aplican la app al guardar y el servidor al enviar).
- La lista de contactos y el registro muestran «Correo: principal» o «Correo: copia oculta».

### 2.6 Correo del centro de monitoreo a los contactos

- En el detalle de la persona, **«Enviar correo a sus contactos»** abre una ventana con: a quién va (Para y copia oculta), **plantilla** (opcional), **asunto**, **editor de texto enriquecido**, **comodines** (`[nombre]`, `[hora_alerta]`, `[numero_emergencia]`, `[operador]`…) y **vista previa**.
- El correo sale con el mismo diseño, con franja azul **«Centro de monitoreo SISMO»** y el botón de la última ubicación conocida.
- **6 plantillas para contactos** (estado «Correo a contactos», se administran en «Mensajes de ayuda» y no aparecen en «Brindar ayuda»): Estamos atendiendo la alerta · La ayuda va en camino · Está a salvo · No hemos podido comunicarnos · Diríjase al punto de encuentro · Le escribe el operador.
- Mismos destinatarios que el correo automático (desde la base de datos), mensaje limpio con lista blanca, máximo **10 correos por persona en una hora**, y registro en `sismo_correos_operador` (operador, asunto y cuántos destinatarios; sin direcciones ni cuerpo).
- El detalle de la persona muestra todos los correos: automáticos y del centro de monitoreo, con fecha, estado y cantidades.

### 2.7 Diseño del correo

- Igual al de la app: encabezado azul marino con el **logo incrustado en base64** y el nombre «SISMO» en texto, franja de color por tipo (rojo: alarma, caída y urgente · ámbar: atrapado y batería · azul: ubicación y centro de monitoreo), el mensaje, botón **«Ver ubicación en el mapa»**, «¿Qué hacer?» y pie.
- Maquetado con tablas y estilos en línea; se adapta al celular. Remitente **«SISMO»**.
- Gmail y Outlook web no muestran imágenes en base64: el encabezado igual se ve bien por el nombre en texto.

### 2.8 Inicio: disponibilidad de servicios

- «Canal digital» se separó en **«SMS y WhatsApp (manual)»** (se abre la app de mensajes con el aviso listo y la persona confirma) y **«Correo a contactos (automático)»**, con su estado real: disponible, sin internet, sin contactos con correo o sin servidor.

### 2.9 Página informativa

- **Insignias y foto de perfil** en la página: bloque «Una cara para reconocerla» (ilustración sin dispositivos) y la sección **«Un plus: insignias que invitan a prepararse»** más abajo, con Mis insignias e insignias reales flotando.
- **Menos repetición visual:** no todo va en portátil y teléfono; hay ilustraciones, recortes de pantalla, un portátil solo con etiquetas y un teléfono con la brújula en círculo.
- **Imagen al compartir el enlace** renovada: portátil con el panel y teléfono con la alerta activa.
- La sección que antes decía «Lo que aún está pendiente» ahora es **«Cómo avisa a sus contactos · Qué se envía solo y qué confirma la persona»**, con fondo neutro y partículas como el resto: SMS y WhatsApp «Hoy: manual», correos automáticos «Ya funciona» y ubicación actualizada por correo «Ya funciona», y un bloque «Así llega el correo» con el correo en un portátil y en un teléfono que flota.
- **Imágenes actualizadas con la tercera entrega:** alerta activa con «Necesito ayuda urgente», canales con el correo «Enviado», aviso del centro con mensaje con formato, panel con el editor, con prioridad y filtros, y en evento masivo. La portada dice que SISMO «avisa por correo a sus contactos».
- En la app, la pantalla de alerta cambia «Canal digital» por **«SMS y WhatsApp (manual)»** («SMS sin enviar» mientras no se envíe) y el correo enviado se muestra como **«Enviado»**.

### 2.10 Plus: insignias para motivar el uso de la app

Las insignias **no estaban en el plan**: se agregaron como un plus para que la gente use la app, se prepare y practique (sin convertir la emergencia en un juego).

- **Se ganan solas** (no hay insignias manuales: asignarlas a mano sería una carga para los operadores) al terminar el registro, agregar contactos y puntos de encuentro, llenar la ficha médica, armar y revisar la mochila, poner la foto, hacer simulacros (y hacerlos rápido, de noche o el fin de semana), abrir la app varios días o seguidos, usar la brújula y la ruta, leer la guía, marcar «Estoy a salvo», responder la encuesta, etc. **Las alertas reales no dan insignias.**
- **Reglas dinámicas** que el panel configura: cantidad, periodo, días seguidos, franja horaria, días de la semana, tiempo máximo del simulacro, porcentaje del perfil y metas («gana 25 insignias», «todas las de la mochila»).
- **Secretas** (solo se ve una pista), **con fechas** (solo se ganan entre dos fechas, p. ej. diciembre) y **con vencimiento** (p. ej. «Mochila al día» dura 180 días y se puede volver a ganar).
- **100 insignias iniciales** con imagen propia: forma según el nivel (bronce, plata, oro, diamante, especial), colores de SISMO y marcas de la regla.
- **App:** página **Mis insignias** (ganadas, por ganar con su avance, secretas y vencidas), tarjetas **«Perfil completado»** (porcentaje y qué falta) y **«Mis insignias»** en Inicio, y el aviso **«¡Ganaste una insignia!»**, que **nunca aparece con una alerta activa** para no distraer a la persona: queda en cola y se muestra al terminar.
- **Sin internet:** lo que hace la persona queda guardado en el teléfono con su hora y se envía al reconectar (hasta 30 días atrás).
- **Aviso centrado con dos botones:** «Siguiente/Continuar» y **«Ver mis insignias»**, que cierra todos los avisos en cola y lleva a la página. En Mis insignias nunca sale el aviso: las que se ganen quedan con la marca **«Nueva»** (primero en la lista, con contador en la pestaña y en la tarjeta de Inicio) hasta que se ven.
- **Panel:** tarjeta «Insignias de la app» con filtros, editor que muestra solo los campos de cada tipo de regla, ganadores, activar o desactivar y auditoría. Las imágenes nuevas quedan en el servidor hasta presionar **«Subir a bucket»**, que las sube a `sismo/insignias/`, verifica que llegaron iguales y **las borra del servidor**.
- **Rendimiento:** la evaluación trae toda la actividad de la persona en 2 consultas por petición; con 100 insignias y la base de datos remota pasó de ~17 s a menos de 1 s.

### 2.11 Foto de perfil

- En **Configuración → Perfil**: **Tomar foto**, **Elegir de la galería** o **Quitar foto**, con el aviso «Su foto la verán el centro de monitoreo y sus contactos en los correos de alerta».
- La app la reduce a 512 px; el servidor valida el tipo real, la recorta, le quita los metadatos (como la ubicación del EXIF) y la guarda en el **bucket** `sismo/perfil/` sin dejar copia en el servidor.
- Se muestra con **URL firmada de 15 minutos**: la app y el panel piden otra cuando vence (nunca hay una URL pública).
- **Sin internet** queda «pendiente de subir» y se sube sola al reconectar.
- Se ve en la app, en el **detalle de la persona**, en las **tarjetas de alerta** y en la **tabla de usuarios** del panel, y va **incrustada en los correos** a los contactos para que reconozcan a la persona.
- Da la insignia «Cara conocida» y suma al perfil completado. Al eliminar la cuenta se borra del bucket.

### 2.12 Producción sin «demostración»

- En producción no aparece ningún texto de demo: «Perfil de demostración» pasa a **«Perfil»** y la tarjeta «Limitaciones del prototipo» se actualizó con lo que ya funciona (correo automático, respaldo en el servidor, foto).
- **«Borrar todos los datos»** solo aparece en desarrollo; en producción está «Eliminar mi cuenta».

### 2.13 Seguridad y control

- **Destinatarios solo desde la base de datos**: el servicio no se puede usar para escribir a cualquier dirección.
- Un envío por alerta y tipo (la ubicación, uno cada 15 min), nada en simulacros, máximo 8 correos automáticos por persona y hora, y 10 del centro de monitoreo por persona y hora.
- El mensaje automático llega como texto plano y se escapa; el del operador pasa por la lista blanca de HTML.
- Bitácoras **sin direcciones**. Logs en JSON con `execution_id`.
- El **token del servicio de correo** se lee de la variable de entorno `CORREO_SERVICIO_TOKEN` (y la URL, opcional, de `CORREO_SERVICIO_URL`); ya no está en el código.

### 2.14 Descarga del APK y aviso de actualización

- **Página informativa:** botón **«Descargar para Android»** (estilo de tienda, dice «Descárgala como APK» e «Instalación directa · Android 7 o superior»), debajo de «Ver lo que hace» y «Cómo funciona», y otra vez al final. Lleva a `Sismo_info/android`, que redirige a una **URL firmada de 10 minutos** del bucket y descarga el archivo como `SISMO.apk`. Si aún no hay APK, muestra «La app para Android estará disponible pronto».
- **Panel → «App para Android (APK)»** (solo el superadministrador, la misma lista que «Vaciar todos los usuarios»): **Subir / Reemplazar APK** (`.apk`, máx. 150 MB, se valida que sea un APK de verdad), verifica el MD5 y lo guarda en `intranet/{desarrollo|produccion}/sismo/app/sismo.apk` sin copia en el servidor; **Probar descarga**.
- **Versión publicada** en la misma tarjeta: **versión actual** y **versión mínima** (códigos `versionCode`), **nombre visible** (p. ej. 1.1) y **enlace de la tienda** (opcional). Al subir un APK, el panel lee su versión y ofrece ponerla como actual.
- **App Android:** consulta `GET sismo/version` al abrir y al volver a la app (y guarda la última respuesta para cuando no hay internet):
  - más vieja que la **actual** → aviso **«Hay una versión nueva»** con «Descargar la nueva versión» y «Ahora no» (no vuelve a salir para esa versión);
  - más vieja que la **mínima** → pantalla **«Actualice SISMO para seguir»**, con el botón rojo **«Tengo una emergencia»**, que lleva a Inicio (SOS) y deja usar la app 30 minutos;
  - **nunca** aparece con una alerta activa, en la pantalla de alerta ni en un simulacro.
- **Tienda o APK:** si el panel tiene enlace de tienda, el botón dice «Abrir la tienda»; si no, descarga el APK. Así, cuando la app esté en una tienda basta con pegar el enlace.
- **Una sola fuente de versión:** `versionCode` y `versionName` de `android/app/build.gradle`. La compilación los inyecta en la app y escribe `version.json` dentro del APK, que es lo que lee el panel.
- La versión web no muestra el aviso (siempre es la última).

### 2.15 Sismos recientes de todo el mundo

- **Selector «Cerca de mí / Todo el mundo»** en Sismos recientes, debajo de «Últimas 24 h / Últimos 7 días».
- **Cerca de mí** se comporta como antes: sismos de magnitud 2,5 o mayor a menos de 500 km de la última ubicación, o en Colombia si no hay ubicación.
- **Todo el mundo** muestra los sismos de **magnitud 4,5 o mayor de todo el planeta** (catálogo `4.5_day` / `4.5_week` del USGS). Con 2,5 serían cientos por semana y el mapa no se leería.
- Usa la misma **gráfica de picos**, el **mapa** (abre con el planeta completo, en cualquier ancho de pantalla) y la **lista** con el enlace al detalle del USGS. Si la persona tiene ubicación, cada sismo muestra a cuántos kilómetros está.
- Igual que antes, **la ubicación no se envía**: se descarga el listado general y se filtra en el teléfono. Solo app; sin cambios en el backend ni en la base de datos.

---

## 3. Base de datos

Script idempotente `2026-11-05-sismo-correos-alertas.sql` (se ejecuta después de los anteriores; se puede repetir):

- `sismo_contactos_usuarios.es_principal_correo` (`TINYINT(1)`, por defecto 0).
- Nueva tabla `sismo_correos_alertas`: correos automáticos (uno por alerta y tipo; la ubicación guarda el último envío).
- Nueva tabla `sismo_correos_operador`: correos del centro de monitoreo a los contactos.
- `sismo_plantillas_atenciones.estado` admite **«contactos»**, con 6 plantillas iniciales.

Script idempotente `2026-11-05-sismo-insignias.sql` y semilla `2026-11-05-sismo-insignias-iniciales.sql` (100 insignias; se puede repetir y actualiza las reglas por nombre):

- `sismo_usuarios.foto`: ruta de la foto en el bucket.
- `sismo_insignias` (catálogo y regla), `sismo_usuarios_insignias` (ganadas, con vencimiento y aviso pendiente), `sismo_acciones_usuarios` (lo que hace la persona, máximo una fila por hora, sin datos personales) y `sismo_insignias_auditoria`.

Script idempotente `2026-11-05-sismo-version-app.sql` (**no crea tablas**): 4 filas en `sismo_parametros` para la versión de la app (`app_version_actual`, `app_version_minima`, `app_version_nombre`, `app_enlace_tienda`). Estas claves no aparecen en el editor de parámetros de los operadores ni en los catálogos que descarga la app; solo las edita el superadministrador.

En total, **19 tablas** (sin cambios). Si el script aún no se ejecutó, la API responde `correo_no_disponible` y la app muestra «sin servidor»; el resto sigue funcionando.

---

## 4. Diagramas y documentos que cambiaron, y por qué

Se copiaron de la segunda entrega y se actualizaron las copias en `screenshots/tercera_entrega/` (los originales siguen sin cambios). Los demás siguen vigentes en la segunda entrega.

| Diagrama o documento | Por qué cambió |
|---|---|
| `01a` Casos de uso de la persona usuaria | Nuevos casos: avisar por correo a los contactos, marcar el contacto principal, poner foto de perfil, ganar insignias, ver Mis insignias, **descargar la app (APK) y actualizarla**; «Consultar sismos recientes» ahora es **cerca y en todo el mundo** |
| `01b` Casos de uso del operador | Nuevos casos: enviar correo a los contactos, ver los correos enviados, administrar insignias, subirlas al bucket, ver foto, insignias y perfil, y **publicar el APK y la versión** (superadministrador) |
| `02b` Actividades: alerta SOS y correo | El correo se pide al API (alarma o caída), con sus respuestas y los avisos por urgente, atrapado y batería |
| `03a` Secuencia: alerta SOS y correo | Nuevo recorrido: app → API → modelo (destinatarios, bitácora, límite) → librería `Sismo_correo` → servicio de correo |
| `03e` Secuencia: correo del operador a los contactos (**nuevo**) | No existía: panel → `Sismo_admin` → lista blanca → modelo → `Sismo_correo` → servicio de correo |
| `04a` Clases del backend | `correo_alerta()`, `correo_contactos()`, `insignias()`, `foto()`, `version()`, `Sismo_info::android()`, `apk_estado()`, `apk_subir()`, `apk_version_guardar()` y los endpoints de insignias del panel; `Sismo_insignias_model`; librerías `Sismo_correo`, `Sismo_insignias_reglas`, `Sismo_foto` y `PHP_Mailer` |
| `12`, `13`, `14` Modelos de base de datos | Bitácoras de correo, 4 tablas de insignias y columnas `es_principal_correo` y `foto` (19 tablas) |
| `BASE_DE_DATOS_SISMO.md` | Mismas razones que los modelos, y el estado «contactos» de las plantillas |
| 19 Requisitos funcionales | RF-CO-03, 04 y 08 cambian; nuevos RF-CO-07 a 11 (correo), RF-IG-01 a 07 (insignias), RF-FP-01 a 05 (foto) y RF-AV-01 a 05 (descarga y versiones de la app); RF-IN-04 cambia (sismos de todo el mundo) |
| 22 Diccionario de datos | Contrato del correo y dominios de valores (tipos de correo, estado «contactos», claves `app_*` de la versión) |
| 23 API y endpoints | Catálogo del USGS de magnitud 4,5 o mayor para «Todo el mundo». Nuevos `POST /correo_alerta/{id}`, `/insignias`, `/foto`, `GET /version`, `Sismo_info/android` y los del panel (correo, insignias, foto, APK y versión) |
| `03f` Secuencia: la persona gana insignias (**nuevo**) | No existía: acciones con cola sin internet → API → registrar y evaluar → aviso (en cola si hay alerta activa) |
| `03g` Secuencia: foto de perfil (**nuevo**) | No existía: app → API → `Sismo_foto` → bucket `sismo/perfil/` → URL firmada → panel y correos |
| `03h` Secuencia: publicar el APK y actualizar la app (**nuevo**) | No existía: panel → bucket `sismo/app/` → versión en `sismo_parametros` → `GET /version` → aviso sugerido u obligatorio → tienda o descarga firmada |
| `BASE_DE_DATOS_SISMO.md` (parámetros) | Claves `app_*` de la versión de la app en `sismo_parametros` |
| 28 Registro de riesgos | R-18 (uso indebido del correo), R-19 (token), R-20 (foto de perfil), R-21 (insignias durante una alerta), R-22 (rendimiento), R-23 (actualización obligatoria en una emergencia) y R-24 (APK fuera de una tienda) |
| 29 Evidencias visuales | Evidencias de la tercera entrega |
| 30 Registro de cambios | Versiones 3.3 (correo), 3.4 (plus: insignias y foto), 3.5 (descarga del APK y versiones) y 3.6 (sismos de todo el mundo) |

---

## 5. Decisiones de diseño

- **Principales en «Para» y el resto en copia oculta:** el servicio de correo solo maneja «Para» y copia oculta, y la copia oculta protege los datos personales de los contactos.
- **El servidor decide los destinatarios:** evita que el API se use para enviar correos a direcciones arbitrarias.
- **Un solo endpoint con tipos:** «activó la alarma» es el principal; caída, urgente, atrapado, batería y ubicación reutilizan el mismo endpoint con otro `tipo`.
- **Ubicación sin cron:** se decide con cada ubicación que envía el teléfono; el servidor solo exige el intervalo.
- **Insignias solo automáticas:** asignarlas a mano sería una carga para los operadores del centro de monitoreo.
- **Nada de insignias durante una alerta:** el aviso queda en cola; las alertas reales no dan insignias.
- **Foto en el bucket con URL firmada:** es un dato personal; nunca URL pública ni copia en el servidor. En los correos va incrustada porque una URL firmada vencería.
- **Imágenes de insignias locales hasta «Subir a bucket»:** el operador decide cuándo publicarlas; al subirlas se verifica el MD5 y solo entonces se borran del servidor.
- **Actualización obligatoria que nunca bloquea una emergencia:** no sale durante una alerta ni en un simulacro, y la pantalla tiene «Tengo una emergencia».
- **Versión por `versionCode` (entero) y una sola fuente (`build.gradle`):** comparar enteros evita errores con nombres como «1.10» y «1.9».
- **Tienda si existe, si no APK:** el mismo aviso sirve hoy (APK en el bucket) y cuando la app esté en una tienda.
- **APK en el bucket con URL firmada y solo el superadministrador lo publica:** no queda en el servidor ni en el repositorio, y cada descarga usa un enlace temporal.
- **Una librería para armar y enviar correos** (`Sismo_correo`): la usan el API de la app y el panel, así el diseño y el remitente son siempre iguales.

---

## 6. Limitaciones conocidas

- **Envío real probado el 05/11:** los tipos «activó la alarma», ayuda urgente, modo atrapado y batería baja se enviaron a una cuenta de prueba de la organización con la librería de correo, la plantilla y los textos del API (datos ficticios, asunto «[PRUEBA]»); el servicio confirmó los cuatro envíos. Después se enviaron también la **caída sin respuesta**, la **ubicación actualizada** y el **correo del centro de monitoreo**, con la foto de perfil incrustada (datos ficticios): **los 7 tipos quedaron probados con envío real**. Falta probar los endpoints completos en el servidor de producción con su token configurado (actividad P).
- **Logo en base64:** no se muestra en Gmail ni Outlook web (sí en Apple Mail, Outlook de escritorio y apps móviles). Alternativa: imagen publicada por URL.
- **Token anterior:** versiones anteriores de la librería de correo tenían el token en el código; conviene rotarlo (riesgo R-19).
- El correo depende de internet en el teléfono; sin red, la alerta local y los SMS siguen funcionando.
- **APK sin firma de publicación:** por ahora se publica el APK firmado con la clave de depuración de Android Studio; el teléfono pide permitir «orígenes desconocidos». Para la tienda hará falta una firma de publicación.
- **Tamaño de subida en producción:** el servidor debe aceptar archivos del tamaño del APK (`upload_max_filesize` y `post_max_size`; hoy ~5,6 MB). Si no, el panel dice «El APK es demasiado grande para el servidor».
- La subida del APK y el guardado de la versión desde el panel se probaron con la API simulada; falta probarlos con una sesión real de superadministrador.

---

## 7. Evidencias

Carpeta `screenshots/tercera_entrega/2026-11-05/` (**66 evidencias**, datos ficticios). Índice en [`../../screenshots/tercera_entrega/documentacion/29-EVIDENCIAS_VISUALES.md`](../../screenshots/tercera_entrega/documentacion/29-EVIDENCIAS_VISUALES.md).

**`visual/visual_front/`** (app, 390×844):

| Archivo | Qué muestra |
|---|---|
| `01-contactos-principal-y-copia-oculta.png` | Lista de contactos con «Correo: principal» y «Correo: copia oculta» (§2.5) |
| `02-formulario-contacto-principal-del-correo.png` | Formulario del contacto con «Contacto principal del correo» (§2.5) |
| `03-alerta-correo-principales-y-copia-oculta.png` | Diálogo del correo al activar la alarma: principales y copia oculta (§2.1) |
| `04-inicio-servicios-sms-manual-y-correo.png` | Disponibilidad de servicios con «SMS y WhatsApp (manual)» y «Correo a contactos (automático)» (§2.8) |
| `05-mis-insignias-ganadas.png` | Mis insignias: foto, ganadas/total, contadores y ganadas con su vencimiento (§2.10) |
| `06-mis-insignias-por-ganar.png` | Por ganar con su avance y una insignia con fecha límite (§2.10) |
| `07-aviso-gano-insignia-ver-mis-insignias.png` | Aviso «¡Ganaste una insignia!» centrado, con «Siguiente» y «Ver mis insignias» (§2.10) |
| `08-insignias-nuevas.png` | Mis insignias tras «Ver mis insignias»: marcas «Nueva» y contador en la pestaña (§2.10) |
| `09-configuracion-foto-de-perfil.png` | Configuración → Perfil: tomar, elegir o quitar la foto y aviso de privacidad (§2.11) |
| `10-configuracion-lo-que-debe-saber.png` | Producción: «Lo que debe saber» actualizado, sin textos de demostración (§2.12) |
| `11-inicio-perfil-completado-y-mis-insignias.png` | Inicio: «Perfil completado» con lo que falta y «Mis insignias» (§2.10) |
| `12-aviso-version-nueva.png` | Aviso «Hay una versión nueva» con «Descargar la nueva versión» y «Ahora no» (§2.14) |
| `13-actualizacion-obligatoria.png` | «Actualice SISMO para seguir» con «Abrir la tienda» y «Tengo una emergencia» (§2.14) |
| `14-sismos-todo-el-mundo.png` | Sismos recientes con «Todo el mundo»: magnitud 4,5 o mayor y gráfica de picos con datos reales del USGS (§2.15) |
| `15-mapa-sismos-del-mundo.png` | Mapa con el planeta completo y los sismos de las últimas 24 h (§2.15) |

**`visual/visual_back/`** (correos y panel):

| Archivo | Qué muestra |
|---|---|
| `01-correo-activo-la-alarma.png` | Correo «activó la alarma» con el diseño de la app (§2.1, §2.7) |
| `02-correo-ayuda-urgente-en-celular.png` | Correo de ayuda urgente en el ancho de un celular (§2.3) |
| `03-correo-bateria-baja.png` | Correo de batería baja, franja ámbar (§2.3) |
| `04-panel-correos-a-sus-contactos.png` | Panel: «Correos a sus contactos» en el detalle de la persona (§2.6) |
| `05-correo-caida-sin-respuesta.png` | Correo de caída sin respuesta (§2.2) |
| `06-panel-correo-a-los-contactos.png` | Panel: ventana para escribir a los contactos con plantilla, editor, comodines y vista previa (§2.6) |
| `07-correo-del-centro-de-monitoreo.png` | Correo del centro de monitoreo, franja azul (§2.6) |
| `08-pagina-informativa-correos-automaticos.png` | Página informativa: «Cómo avisa a sus contactos» con el correo en portátil y teléfono (§2.9) |
| `09-pagina-informativa-tercera-entrega.png` | Página informativa completa con las imágenes nuevas (ayuda urgente, canales con el correo «Enviado», panel con prioridad y editor) (§2.9) |
| `10-panel-insignias.png` | Panel: tarjeta «Insignias de la app» con filtros, chips y «Subir a bucket» (§2.10) |
| `11-panel-editor-insignia.png` | Panel: editor de insignia con los campos de su tipo de regla e imagen (§2.10) |
| `12-panel-usuario-foto-insignias.png` | Panel: detalle de la persona con foto, perfil completado e insignias (§2.11) |
| `13-pagina-informativa-descargar-android.png` | Página informativa: botón «Descargar para Android» (APK) debajo de los otros dos (§2.14) |
| `14-panel-app-android-apk-y-version.png` | Panel: tarjeta «App para Android (APK)» con la versión actual, la mínima y el enlace de tienda (§2.14) |

**`codigo/codigo_front/`**:

| Archivo | Qué muestra |
|---|---|
| `01-correo-por-el-api.png` | `emailService.ts`: el correo se pide al API con el token |
| `02-mensaje-por-tipo-de-correo.png` | `emailService.ts`: mensaje por tipo (alarma, caída y avisos) |
| `03-contacto-principal-del-correo.png` | `contactEmail.ts`: mínimo un principal y papel de cada contacto |
| `04-avisos-por-correo-en-la-alerta.png` | `AlertPage.tsx`: avisos por urgente, atrapado, batería y ubicación |
| `05-formulario-principal.png` | `ContactFormModal.tsx`: «Contacto principal del correo» |
| `06-ubicacion-actualizada-por-correo.png` | `emailService.ts`: ¿toca enviar la ubicación? (200 m y 15 min) |
| `07-servicios-sms-manual-y-correo.png` | `HomePage.tsx`: estado del correo en «Disponibilidad de servicios» |
| `08-cola-de-insignias-sin-internet.png` | `badgeService.ts`: acciones en cola sin internet, máximo una por hora |
| `09-acciones-desde-el-estado.png` | `badgeActions.ts`: lo que cambia en la app se vuelve acción de insignias |
| `10-aviso-nunca-durante-una-alerta.png` | `badgeGate.ts`: el aviso nunca aparece con una alerta activa ni en simulacro |
| `11-ver-mis-insignias-y-nuevas.png` | `badgeService.ts`: «Ver mis insignias» y marca «Nueva» |
| `12-foto-reescalada-y-url-firmada.png` | `photoService.ts`: validar, reducir y renovar la URL firmada |
| `13-perfil-completado.png` | `profileCompletion.ts`: los 7 puntos del perfil |
| `14-produccion-sin-demo.png` | `env.ts`: en producción no aparece nada de demostración |
| `15-aviso-de-actualizacion.png` | `versionService.ts`: versión sugerida u obligatoria según el `versionCode` |
| `16-version-desde-build-gradle.png` | `vite.config.ts`: versión desde `build.gradle` y `version.json` dentro del APK |
| `17-sismos-de-todo-el-mundo.png` | `quakeService.ts`: «Cerca de mí» (radio o Colombia) o «Todo el mundo» (M4,5+), con distancia si hay ubicación |

**`codigo/codigo_back/`**:

| Archivo | Qué muestra |
|---|---|
| `01-api-correo-alerta.png` | `POST sismo/correo_alerta/{id}`: validaciones, un envío por tipo, ubicación cada 15 min y límite |
| `02-destinatarios-desde-la-bd.png` | Destinatarios desde los contactos guardados: «Para» y copia oculta |
| `03-bitacora-de-correos.png` | Bitácoras sin direcciones y límites por hora |
| `04-diseno-del-correo.png` | Plantilla del correo con el diseño de la app |
| `05-token-en-variable-de-entorno.png` | Librería de correo: token del servicio desde variable de entorno |
| `06-sql-correos.png` | Script SQL: contacto principal, bitácoras y plantillas para contactos |
| `07-libreria-sismo-correo.png` | `Sismo_correo`: asunto, cuerpo y envío (API y panel) |
| `08-api-correo-del-centro.png` | `POST Sismo_admin/correo_contactos` |
| `09-panel-correo-a-contactos.png` | Panel: ventana del correo a los contactos |
| `10-evaluar-insignias.png` | `Sismo_insignias_model`: evalúa y entrega (renueva las vencidas) |
| `11-actividad-en-dos-consultas.png` | `Sismo_insignias_model`: toda la actividad en 2 consultas (rendimiento) |
| `12-reglas-progreso-y-rachas.png` | `Sismo_insignias_reglas`: periodo deslizante y días seguidos |
| `13-api-insignias.png` | `GET/POST sismo/insignias` con lista blanca |
| `14-api-foto-de-perfil.png` | `GET/POST/DELETE sismo/foto` |
| `15-foto-bucket-url-firmada.png` | `Sismo_foto`: sin metadatos, bucket `sismo/perfil/` y URL firmada |
| `16-panel-subir-a-bucket.png` | «Subir a bucket»: verifica MD5 y solo entonces borra del servidor |
| `17-sql-insignias.png` | Script SQL de las insignias (convención CCS) |
| `18-api-version-de-la-app.png` | `GET sismo/version`: tienda si existe, si no el APK |
| `19-subir-apk-al-bucket.png` | `Sismo_admin::apk_subir()`: valida el APK, lee su versión y verifica MD5 |
| `20-descarga-apk-url-firmada.png` | `Sismo_info::android()`: URL firmada de 10 min |

---

## 8. Estado de verificación

- Pruebas unitarias: **200 de 200** (28 archivos; incluye sismos de todo el mundo, el aviso de actualización, correo, insignias, cola sin internet, aviso que nunca sale con alerta activa, «Nueva», foto pendiente, perfil completado y textos de producción).
- Pruebas e2e (celular y escritorio): **130 de 130** el 05/11, repetidas después de agregar el aviso de actualización (incluye la nueva `insignias-foto.e2e.spec.ts`: tarjetas, pestañas, aviso centrado, sin aviso durante una alerta, «Ver mis insignias» y «Nueva», foto con y sin internet).
- `eslint` y `tsc -b` sin errores; PHP sin errores de sintaxis.
- API de insignias y foto probados contra el backend local con una cuenta de prueba que se eliminó al final (acciones inválidas → 422, sin token → 401, foto inválida → 422, foto subida y descargada con URL firmada).
- Evaluación de 100 insignias: < 1 s por petición.
- Envío real de los 7 tipos de correo a una cuenta de prueba.
- Aviso de actualización revisado en pantalla (sugerido, obligatorio, «Ahora no» y «Tengo una emergencia») con la respuesta del backend simulada; `GET sismo/version` probado contra el backend local; el APK trae `version.json` y el backend lo lee.
- Página informativa con el botón de Android sin desbordes en 1440 px y 390 px.

---

## 9. Para desplegar

1. Ejecutar `docs/superpowers/sql/2026-11-05-sismo-correos-alertas.sql` (además de los scripts anteriores).
2. Crear en el servidor la variable de entorno `CORREO_SERVICIO_TOKEN` (y, si cambia, `CORREO_SERVICIO_URL`).
3. Recompilar la app (`npm run build` / APK); ya no se usa `VITE_ALERT_EMAIL_URL`.
4. Ejecutar `docs/superpowers/sql/2026-11-05-sismo-version-app.sql` (versión de la app).
5. Revisar que `upload_max_filesize` y `post_max_size` del servidor acepten el APK, y subirlo desde el panel (tarjeta «App para Android (APK)»).
6. Para cada versión nueva: subir `versionCode`/`versionName` en `android/app/build.gradle`, compilar, subir el APK desde el panel y aceptar ponerlo como versión actual (la mínima solo si la anterior ya no debe usarse).

---

## 10. Hoja de ruta (pendiente)

| Fechas | Actividad |
|---|---|
| 09/11 – 13/11 | Puesta en producción (base de datos, llave de cifrado, **variable del token de correo**, despliegue) |
| 09/11 – 20/11 | Prueba en dispositivo físico y ajustes nativos |
| 16/11 – 20/11 | **Correo de alertas en producción**: pruebas reales de todos los tipos y revisión en Gmail, Outlook y Apple Mail |
| 09/11 – 27/11 | Aprobación del tratamiento de datos (Ley 1581) |
| 30/11 – 11/12 | Validación con usuarios, ajustes y entrega final (11/12) |

Posible mejora (fuera del plan): aviso del servidor si una persona con alerta activa deja de dar señales (requiere un cron).
