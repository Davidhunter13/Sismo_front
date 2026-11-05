> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# SISMO — Avances de la tercera entrega

**Fecha:** 5 de noviembre de 2026 · **Versión:** 3.3 · **Fase del plan:** 3 · actividad L (05/11 – 06/11), con adelanto de la actividad P «Correo de alertas en producción y pruebas reales» (16/11 – 20/11).

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

- La sección que antes decía «Lo que aún está pendiente» ahora es **«Cómo avisa a sus contactos · Qué se envía solo y qué confirma la persona»**, con fondo neutro y partículas como el resto: SMS y WhatsApp «Hoy: manual», correos automáticos «Ya funciona» y ubicación actualizada por correo «Ya funciona», y un bloque «Así llega el correo» con el correo en un portátil y en un teléfono que flota.
- **Imágenes actualizadas con la tercera entrega:** alerta activa con «Necesito ayuda urgente», canales con el correo «Enviado», aviso del centro con mensaje con formato, panel con el editor, con prioridad y filtros, y en evento masivo. La portada dice que SISMO «avisa por correo a sus contactos».
- En la app, la pantalla de alerta cambia «Canal digital» por **«SMS y WhatsApp (manual)»** («SMS sin enviar» mientras no se envíe) y el correo enviado se muestra como **«Enviado»**.

### 2.10 Seguridad y control

- **Destinatarios solo desde la base de datos**: el servicio no se puede usar para escribir a cualquier dirección.
- Un envío por alerta y tipo (la ubicación, uno cada 15 min), nada en simulacros, máximo 8 correos automáticos por persona y hora, y 10 del centro de monitoreo por persona y hora.
- El mensaje automático llega como texto plano y se escapa; el del operador pasa por la lista blanca de HTML.
- Bitácoras **sin direcciones**. Logs en JSON con `execution_id`.
- El **token del servicio de correo** se lee de la variable de entorno `CORREO_SERVICIO_TOKEN` (y la URL, opcional, de `CORREO_SERVICIO_URL`); ya no está en el código.

---

## 3. Base de datos

Script idempotente `2026-11-05-sismo-correos-alertas.sql` (se ejecuta después de los anteriores; se puede repetir):

- `sismo_contactos_usuarios.es_principal_correo` (`TINYINT(1)`, por defecto 0).
- Nueva tabla `sismo_correos_alertas`: correos automáticos (uno por alerta y tipo; la ubicación guarda el último envío).
- Nueva tabla `sismo_correos_operador`: correos del centro de monitoreo a los contactos.
- `sismo_plantillas_atenciones.estado` admite **«contactos»**, con 6 plantillas iniciales.

En total, **15 tablas**. Si el script aún no se ejecutó, la API responde `correo_no_disponible` y la app muestra «sin servidor»; el resto sigue funcionando.

---

## 4. Diagramas y documentos que cambiaron, y por qué

Se copiaron de la segunda entrega y se actualizaron las copias en `screenshots/tercera_entrega/` (los originales siguen sin cambios). Los demás siguen vigentes en la segunda entrega.

| Diagrama o documento | Por qué cambió |
|---|---|
| `01a` Casos de uso de la persona usuaria | Nuevos casos: avisar por correo a los contactos y marcar el contacto principal del correo |
| `01b` Casos de uso del operador | Nuevos casos: enviar correo a los contactos de la persona y ver los correos enviados |
| `02b` Actividades: alerta SOS y correo | El correo se pide al API (alarma o caída), con sus respuestas y los avisos por urgente, atrapado y batería |
| `03a` Secuencia: alerta SOS y correo | Nuevo recorrido: app → API → modelo (destinatarios, bitácora, límite) → librería `Sismo_correo` → servicio de correo |
| `03e` Secuencia: correo del operador a los contactos (**nuevo**) | No existía: panel → `Sismo_admin` → lista blanca → modelo → `Sismo_correo` → servicio de correo |
| `04a` Clases del backend | `correo_alerta()`, `correo_contactos()`, librerías `Sismo_correo` y `PHP_Mailer`, métodos de correo del modelo |
| `12`, `13`, `14` Modelos de base de datos | Tablas `sismo_correos_alertas` y `sismo_correos_operador` (15 tablas) y columna `es_principal_correo` |
| `BASE_DE_DATOS_SISMO.md` | Mismas razones que los modelos, y el estado «contactos» de las plantillas |
| 19 Requisitos funcionales | RF-CO-03, 04 y 08 cambian; nuevos RF-CO-07 (principal), 09 (control), 10 (correo del centro) y 11 (plantillas para contactos) |
| 22 Diccionario de datos | Contrato del correo y dominios de valores (tipos de correo, estado «contactos») |
| 23 API y endpoints | Nuevos `POST /correo_alerta/{id}` y `POST Sismo_admin/correo_contactos` |
| 28 Registro de riesgos | R-18 (uso indebido del correo) y R-19 (token del servicio de correo) |
| 29 Evidencias visuales | Evidencias de la tercera entrega |
| 30 Registro de cambios | Versión 3.3 |

---

## 5. Decisiones de diseño

- **Principales en «Para» y el resto en copia oculta:** el servicio de correo solo maneja «Para» y copia oculta, y la copia oculta protege los datos personales de los contactos.
- **El servidor decide los destinatarios:** evita que el API se use para enviar correos a direcciones arbitrarias.
- **Un solo endpoint con tipos:** «activó la alarma» es el principal; caída, urgente, atrapado, batería y ubicación reutilizan el mismo endpoint con otro `tipo`.
- **Ubicación sin cron:** se decide con cada ubicación que envía el teléfono; el servidor solo exige el intervalo.
- **Una librería para armar y enviar correos** (`Sismo_correo`): la usan el API de la app y el panel, así el diseño y el remitente son siempre iguales.

---

## 6. Limitaciones conocidas

- **Envío real probado el 05/11:** los tipos «activó la alarma», ayuda urgente, modo atrapado y batería baja se enviaron a una cuenta de prueba de la organización con la librería de correo, la plantilla y los textos del API (datos ficticios, asunto «[PRUEBA]»); el servicio confirmó los cuatro envíos. Falta enviar de prueba la caída, la ubicación y el correo del centro (mismo mecanismo) y probar los endpoints completos en el servidor, que requiere crear allí `CORREO_SERVICIO_TOKEN` (actividad P).
- **Logo en base64:** no se muestra en Gmail ni Outlook web (sí en Apple Mail, Outlook de escritorio y apps móviles). Alternativa: imagen publicada por URL.
- **Token anterior:** versiones anteriores de la librería de correo tenían el token en el código; conviene rotarlo (riesgo R-19).
- El correo depende de internet en el teléfono; sin red, la alerta local y los SMS siguen funcionando.

---

## 7. Evidencias

Carpeta `screenshots/tercera_entrega/2026-11-05/` (**29 evidencias**, datos ficticios). Índice en [`../../screenshots/tercera_entrega/documentacion/29-EVIDENCIAS_VISUALES.md`](../../screenshots/tercera_entrega/documentacion/29-EVIDENCIAS_VISUALES.md).

**`visual/visual_front/`** (app, 390×844):

| Archivo | Qué muestra |
|---|---|
| `01-contactos-principal-y-copia-oculta.png` | Lista de contactos con «Correo: principal» y «Correo: copia oculta» (§2.5) |
| `02-formulario-contacto-principal-del-correo.png` | Formulario del contacto con «Contacto principal del correo» (§2.5) |
| `03-alerta-correo-principales-y-copia-oculta.png` | Diálogo del correo al activar la alarma: principales y copia oculta (§2.1) |
| `04-inicio-servicios-sms-manual-y-correo.png` | Disponibilidad de servicios con «SMS y WhatsApp (manual)» y «Correo a contactos (automático)» (§2.8) |

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

---

## 8. Estado de verificación

- Pruebas unitarias: **145 de 145** (incluye `emailService`, `contactEmail` y la decisión de la ubicación por correo).
- Pruebas e2e (celular y escritorio): **116 de 116** el 05/11 (incluye «correo: el primer contacto es el principal…» y los textos «SMS sin enviar» y «Enviado»).
- Lint y tipos (`tsc -b`) sin errores; PHP sin errores de sintaxis.
- API probada contra el servidor de desarrollo en los casos sin envío, y envío real de cuatro tipos de correo a una cuenta de prueba (§6).

---

## 9. Para desplegar

1. Ejecutar `docs/superpowers/sql/2026-11-05-sismo-correos-alertas.sql` (además de los scripts anteriores).
2. Crear en el servidor la variable de entorno `CORREO_SERVICIO_TOKEN` (y, si cambia, `CORREO_SERVICIO_URL`).
3. Recompilar la app (`npm run build` / APK); ya no se usa `VITE_ALERT_EMAIL_URL`.

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
