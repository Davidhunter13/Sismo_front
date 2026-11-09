> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.
> **Tercera entrega.** Copia actualizada del documento de la segunda entrega (`../../segunda_entrega/documentacion/19-REQUISITOS_FUNCIONALES.md`), que se conserva sin cambios. Aquí solo cambia lo del correo de alerta a los contactos.


# 19. Documento de requisitos funcionales — SISMO

| Dato | Valor |
|---|---|
| Sistema | SISMO: botón de pánico para emergencias sísmicas (app móvil + backend + panel de monitoreo) |
| Versión del documento | 1.0 · 4 de noviembre de 2026 (versión 3 del sistema) |
| Roles | Persona usuaria (PU), Operador del centro de monitoreo (OP), Visitante (VI), Sistema (SIS) |
| Prioridad | **Alta** = indispensable en una emergencia · **Media** = preparación y soporte · **Baja** = comodidad |

Cada requisito tiene un identificador `RF-XX-NN`, el rol que lo usa y su prioridad. Las pruebas que lo verifican están en el [plan de pruebas](26-PLAN_Y_CASOS_DE_PRUEBA.md) y los diagramas en [`../diagramas/DIAGRAMAS.md`](../diagramas/DIAGRAMAS.md).

---

## RF-RE · Registro e inicio

| ID | Requisito | Rol | Prioridad |
|---|---|---|---|
| RF-RE-01 | El sistema debe mostrar una pantalla de carga al abrir la app y llevar a la Bienvenida si la persona no está registrada, o a Inicio si ya lo está. | PU | Media |
| RF-RE-02 | El sistema debe exigir un registro en 4 pasos antes de usar la app: nombre de usuario, ubicación (GPS), al menos un punto de encuentro y al menos un contacto de emergencia. | PU | Alta |
| RF-RE-03 | El sistema debe permitir agregar contactos desde la agenda del teléfono (donde el dispositivo lo permita), y editar o eliminar los contactos agregados durante el registro. | PU | Media |
| RF-RE-04 | El sistema debe marcar en rojo los datos obligatorios que falten y permitir completarlos después. | PU | Media |
| RF-RE-05 | Al terminar el registro, el sistema debe registrar el dispositivo en el servidor (sin contraseña, con un token) y subir todos los datos; sin conexión, debe dejarlos en cola. | SIS | Alta |

## RF-AL · Alerta SOS

| ID | Requisito | Rol | Prioridad |
|---|---|---|---|
| RF-AL-01 | El sistema debe permitir activar la alerta SOS desde el botón de la app, el widget de Android (doble toque), el acceso rápido o la detección automática de caídas. | PU | Alta |
| RF-AL-02 | El sistema debe pedir el tipo de evento (catálogo administrable: sismo, otra emergencia, prueba…) y confirmar antes de activar, para evitar activaciones accidentales. | PU | Alta |
| RF-AL-03 | Al activarse, el sistema debe emitir sirena (o silbato), destello y linterna en código SOS, vibración en patrón SOS y mantener la pantalla encendida, incluso con la pantalla bloqueada en Android. | SIS | Alta |
| RF-AL-04 | El sistema debe afinar la ubicación GPS (hasta 10 s) y actualizarla cada 2 minutos (parámetro administrable) mientras la alerta esté activa. | SIS | Alta |
| RF-AL-05 | El sistema debe ofrecer el botón «Llamar al {número de emergencia}» (parámetro administrable, por defecto 123). | PU | Alta |
| RF-AL-06 | El sistema debe permitir enviar a los contactos un SMS o WhatsApp con la ubicación, los puntos de encuentro, la ficha médica (si se comparte) y la batería. | PU | Alta |
| RF-AL-07 | El sistema debe activar el ahorro de batería cuando la carga baje del umbral configurado, y ofrecer el modo atrapado y el silbato de rescate. | PU | Alta |
| RF-AL-08 | El sistema debe permitir finalizar la alerta y guardarla en el historial con sus métricas (tiempos de confirmación, sirena, linterna, vibración y SMS). | PU | Alta |
| RF-AL-09 | El sistema debe permitir avisar «Estoy bien» por SMS o WhatsApp con la ubicación actual, el punto de encuentro y la batería. | PU | Alta |
| RF-AL-10 | El sistema debe mostrar la lista «Después del sismo» (catálogo administrable) y guardar el avance por clave de paso. | PU | Media |

## RF-CO · Correo de alerta a los contactos

| ID | Requisito | Rol | Prioridad |
|---|---|---|---|
| RF-CO-01 | Al activar una alerta real, el sistema debe preguntar «¿Enviar correo a sus contactos?» con una cuenta regresiva de 20 s. | PU | Alta |
| RF-CO-02 | Si la persona toca «Sí, enviar ahora» o no responde en 20 s, el sistema debe enviar el correo; con «No enviar», debe cancelarlo y permitir reintentar. | PU | Alta |
| RF-CO-03 | El correo debe llegar a los contactos reales que tengan correo e incluir el tipo de evento, la hora, la ubicación, los puntos de encuentro, la ficha médica (si se comparte) y la batería, con el diseño de la app. | SIS | Alta |
| RF-CO-04 | La app debe pedir el correo al backend (`POST /correo_alerta/{id}` con el token del teléfono, sin credenciales de correo en el teléfono); el backend toma los destinatarios de los contactos guardados (nunca de la app) y envía por el servicio de correo de la organización. | SIS | Alta |
| RF-CO-05 | El sistema debe reintentar 2 veces ante fallos de red o 5xx (espera exponencial) y mostrar el estado: enviado, cancelado, fallido, sin destinatarios o sin servidor. | SIS | Media |
| RF-CO-06 | El sistema no debe preguntar por el correo en los simulacros ni si ningún contacto real tiene correo. | SIS | Media |
| RF-CO-07 | Al crear o editar un contacto, la persona debe poder marcarlo como **principal del correo**: los principales reciben el correo en «Para» y los demás en copia oculta. Si ninguno está marcado, el primero es el principal. | PU | Alta |
| RF-CO-08 | Durante una alerta real, el sistema debe avisar por correo cuando la persona pida **ayuda urgente**, entre en **modo atrapado**, llegue al umbral de **batería baja** o **se desplace 200 m o más** (ubicación actualizada, como máximo cada 15 min); si la alerta se activó por una **caída sin respuesta**, el correo inicial debe ser de ese tipo. Atrapado, batería y ubicación solo si no se canceló el correo inicial. | SIS | Alta |
| RF-CO-09 | El backend debe enviar cada tipo de correo una sola vez por alerta (la ubicación, como máximo cada 15 min), nunca en simulacros, con un máximo de 8 por persona en una hora, y registrar cada envío sin guardar direcciones de correo. | SIS | Alta |
| RF-CO-10 | Desde el detalle de la persona en el panel, el operador debe poder enviar un correo a sus contactos (mensaje propio o plantilla, con editor y comodines), con los mismos destinatarios, como máximo 10 por persona en una hora, y quedar registrado quién lo envió. | OP | Alta |
| RF-CO-11 | El panel debe permitir administrar plantillas de correo para los contactos (estado «Correo a contactos»), separadas de las de «Brindar ayuda». | OP | Media |

## RF-IG · Insignias (plus de la tercera entrega)

| ID | Requisito | Actor | Prioridad |
|---|---|---|---|
| RF-IG-01 | La app debe entregar insignias **automáticamente** cuando la persona se prepara, practica y usa la app (registro, contactos, puntos de encuentro, ficha médica, mochila, simulacros, brújula, guía, «Estoy a salvo», encuesta, etc.). No hay insignias manuales. | SIS | Media |
| RF-IG-02 | Las reglas deben ser configurables: cantidad, periodo, días seguidos, franja horaria, días de la semana, tiempo máximo del simulacro, porcentaje del perfil y metas de otras insignias. | OP | Media |
| RF-IG-03 | Una insignia puede ser **secreta** (solo muestra una pista), **con fechas** (solo se gana entre `fecha_inicio` y `fecha_fin`) y **con vencimiento** (dura N días y se puede volver a ganar). | OP | Media |
| RF-IG-04 | La app debe mostrar **Mis insignias** (ganadas, por ganar con progreso, secretas y vencidas), la tarjeta **«Perfil completado»** (porcentaje y qué falta) y el aviso **«¡Ganaste una insignia!»**. | PU | Media |
| RF-IG-05 | El aviso «¡Ganaste una insignia!» **nunca debe aparecer con una alerta activa**: se guarda y se muestra cuando la alerta termina. Las alertas reales no dan insignias. | SIS | Alta |
| RF-IG-06 | La app debe guardar las acciones sin internet y enviarlas al sincronizar (máximo 50 por envío, hasta 30 días atrás); el servidor solo acepta los hechos de una lista blanca. | SIS | Media |
| RF-IG-07 | El panel debe permitir crear, editar, activar y desactivar insignias con su imagen, ver quién las ganó y la auditoría. Las imágenes nuevas quedan en el servidor hasta que el operador presione **«Subir a bucket»**, que las sube a `sismo/insignias/` y las borra del servidor. | OP | Media |

## RF-FP · Foto de perfil

| ID | Requisito | Actor | Prioridad |
|---|---|---|---|
| RF-FP-01 | En Configuración → Perfil la persona debe poder **tomar una foto**, **elegirla de la galería** o **quitarla**, con un aviso de quién la verá. | PU | Media |
| RF-FP-02 | La foto se reduce a 512 px, se valida su tipo real, se le quitan los metadatos y se guarda en el bucket (`sismo/perfil/`, sin copia en el servidor). | SIS | Alta |
| RF-FP-03 | La foto se muestra con **URL firmada de 15 minutos**; la app y el panel piden una nueva cuando vence. Nunca con URL pública. | SIS | Alta |
| RF-FP-04 | La foto debe verse en la app, en el detalle de la persona y en las alertas del panel, y en los **correos a los contactos** (incrustada y reducida). | PU, OP | Media |
| RF-FP-05 | Al eliminar la cuenta, la foto se borra del bucket. | SIS | Alta |

## RF-AV · Descarga y versiones de la app Android

| ID | Requisito | Actor | Prioridad |
|---|---|---|---|
| RF-AV-01 | La página informativa debe ofrecer **«Descargar para Android»**, que entrega el APK del bucket con una URL firmada temporal; si no hay APK, debe decir que estará disponible pronto. | VI | Media |
| RF-AV-02 | Solo el superadministrador debe poder **subir o reemplazar el APK** desde el panel; el servidor valida que sea un APK (máx. 150 MB), verifica el MD5 y no deja copia local. | OP | Media |
| RF-AV-03 | El panel debe permitir definir la **versión actual**, la **versión mínima**, el nombre visible y el **enlace de la tienda** (opcional); al subir un APK ofrece usar su versión como actual. | OP | Media |
| RF-AV-04 | La app Android debe avisar **«Hay una versión nueva»** (se puede cerrar) si es más vieja que la actual, y **exigir la actualización** si es más vieja que la mínima; «Actualizar» abre la tienda si está configurada y, si no, descarga el APK. | SIS | Media |
| RF-AV-05 | El aviso de actualización **nunca debe aparecer con una alerta activa**, en la pantalla de alerta ni en un simulacro, y la pantalla obligatoria debe ofrecer **«Tengo una emergencia»** para llegar al SOS. | SIS | Alta |

## RF-CT · Contactos y puntos de encuentro

| ID | Requisito | Rol | Prioridad |
|---|---|---|---|
| RF-CT-01 | El sistema debe permitir crear, editar y eliminar contactos de emergencia con nombre, teléfono, correo (validado) y relación (catálogo administrable). | PU | Alta |
| RF-CT-02 | El sistema debe permitir hasta N puntos de encuentro (parámetro administrable, por defecto 5) desde la ubicación actual, el mapa o una dirección. | PU | Alta |
| RF-CT-03 | El sistema debe mostrar la ubicación en un mapa real (OpenStreetMap), la brújula sin internet hacia el punto más cercano y la ruta (a pie, carro/moto o bicicleta), con enlace a Waze o Google Maps. | PU | Media |

## RF-IN · Información y preparación

| ID | Requisito | Rol | Prioridad |
|---|---|---|---|
| RF-IN-01 | El sistema debe permitir registrar una ficha médica (sangre, alergias, medicamentos, condiciones, notas) y elegir si se comparte en la alerta y el SMS. | PU | Alta |
| RF-IN-02 | El sistema debe generar un QR médico con la ficha en texto plano, legible por cualquier lector de QR sin internet ni la app. | PU | Alta |
| RF-IN-03 | El sistema debe mostrar la guía de emergencia (antes, durante, después) con lectura en voz alta; el contenido es administrable. | PU | Media |
| RF-IN-04 | El sistema debe mostrar los sismos recientes (USGS) de las últimas 24 h y 7 días: **cerca de la persona** (o en Colombia si no hay ubicación) y de **todo el mundo** (magnitud 4,5 o mayor), con gráfica, mapa y lista. | PU | Media |
| RF-IN-05 | El sistema debe permitir gestionar la mochila de emergencia (ítems sugeridos del catálogo, vencimientos y revisión periódica). | PU | Media |
| RF-IN-06 | El sistema debe ofrecer simulacros con cronómetro, la encuesta de usabilidad SUS y estadísticas (con exportación CSV). | PU | Media |
| RF-IN-07 | El sistema debe recordar hacer un simulacro si nunca se hizo o pasaron 90 días. | SIS | Baja |

## RF-CF · Configuración y cuenta

| ID | Requisito | Rol | Prioridad |
|---|---|---|---|
| RF-CF-01 | El sistema debe permitir elegir idioma (español / inglés), tema (sistema, claro, oscuro), sonido de alarma, señales, detección de caídas, umbral de ahorro de batería y opciones de accesibilidad (alto contraste, texto grande, reducir movimiento). | PU | Media |
| RF-CF-02 | El sistema debe permitir crear un código de recuperación (`XXXX-XXXX-XXXX`) y recuperar todos los datos en un teléfono nuevo con ese código; el teléfono anterior pierde el acceso. | PU | Alta |
| RF-CF-03 | El sistema debe permitir «Eliminar mi cuenta»: borrado lógico en cascada, supresión de datos personales y de salud, y revocación del token y del código; después la persona puede registrarse de nuevo. | PU | Alta |

## RF-SI · Sincronización

| ID | Requisito | Rol | Prioridad |
|---|---|---|---|
| RF-SI-01 | Todo cambio debe guardarse primero en el teléfono y subirse al servidor por recurso (ajustes, contactos, alertas, puntos, encuestas, kit, ficha médica). | SIS | Alta |
| RF-SI-02 | Sin conexión, los cambios deben esperar en una cola persistente y subirse solos al volver la red, con reintentos; si el token deja de ser válido, la app debe registrarse de nuevo y subir todo. | SIS | Alta |
| RF-SI-03 | El sistema debe avisar «Sin conexión: sus datos se guardarán apenas tenga conexión» y mostrar los cambios pendientes. | SIS | Media |
| RF-SI-04 | La app debe descargar los catálogos al abrirse y usar la última copia (o los valores por defecto) sin conexión. | SIS | Media |

## RF-PA · Panel de monitoreo

| ID | Requisito | Rol | Prioridad |
|---|---|---|---|
| RF-PA-01 | Solo deben entrar al panel las personas con sesión iniciada y correo autorizado en la configuración del servidor. | OP | Alta |
| RF-PA-02 | El panel debe mostrar indicadores, alertas activas y un mapa en tiempo real, y actualizarse solo casi en tiempo real (pulso cada 3 s, sin loader); cada consulta iniciada por el operador muestra un loader. | OP | Alta |
| RF-PA-03 | El panel debe avisar las alertas nuevas con banner, sonido y notificación del sistema (si los avisos están activos; la preferencia se recuerda). | OP | Alta |
| RF-PA-04 | El operador debe poder registrar la ayuda (En atención, Ayuda enviada, Resuelta) con un mensaje; la persona lo ve como aviso fijo en la app (consulta cada 15 s). | OP | Alta |
| RF-PA-05 | El operador debe poder ver el detalle de la persona: contactos, ficha médica descifrada, puntos de encuentro, alertas, kit, encuestas y bitácora de ayuda. Cada consulta queda en el log. | OP | Alta |
| RF-PA-06 | El panel debe mostrar el historial de alertas, la lista de usuarios con buscador y los sismos recientes (24 h / 7 días) en tabla y mapa. | OP | Media |
| RF-PA-07 | El operador debe poder generar un código de recuperación temporal (48 h) para una persona que perdió el teléfono. | OP | Media |
| RF-PA-08 | El operador debe poder administrar catálogos (tipos de evento, parentescos, kit, pasos post-sismo, tipos de sangre), la guía de emergencia (es/en) y los parámetros. Los tipos de evento `sismo` y `emergencia_general` no se pueden ocultar. | OP | Media |

## RF-PI · Página informativa

| ID | Requisito | Rol | Prioridad |
|---|---|---|---|
| RF-PI-01 | El sistema debe publicar una página informativa sin inicio de sesión (`Sismo_info`) con beneficios, funciones, capturas, lo que está pendiente y cómo funciona una alerta. | VI | Baja |
| RF-PI-02 | La página debe mostrar «Ir al panel» solo a los operadores autorizados y «Solicitar una demostración» solo si está configurada una URL https. | VI | Baja |
