> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# 21. Historias de usuario — SISMO

Formato: *Como* [rol] *quiero* [acción] *para* [beneficio]. Cada historia trae sus criterios de aceptación (Dado / Cuando / Entonces) y los requisitos funcionales que cubre ([documento 19](19-REQUISITOS_FUNCIONALES.md)). Estimación en puntos de historia (1, 2, 3, 5, 8).

---

## Persona usuaria (app)

### HU-01 · Registrarme · 5 pts · RF-RE-02, RF-RE-05
**Como** persona usuaria **quiero** registrar mi nombre, ubicación, punto de encuentro y contacto **para** que la alerta tenga a quién y a dónde avisar.
- **Dado** que abro la app por primera vez, **cuando** toco «Comenzar», **entonces** veo el registro en 4 pasos.
- **Dado** que falta un dato obligatorio, **cuando** intento finalizar, **entonces** no puedo hacerlo y el dato aparece en rojo.
- **Dado** que termino sin internet, **cuando** vuelve la red, **entonces** mis datos se suben solos al servidor.

### HU-02 · Pedir ayuda con un toque · 8 pts · RF-AL-01 a RF-AL-04
**Como** persona usuaria **quiero** activar el SOS desde la app, el widget o el acceso rápido **para** pedir ayuda en segundos.
- **Dado** que toco SOS, **cuando** elijo el tipo de evento y confirmo, **entonces** suenan la sirena, la linterna destella y el teléfono vibra en código SOS.
- **Dado** que la alerta está activa, **entonces** la ubicación se afina hasta 10 s y se actualiza cada 2 minutos.
- **Dado** que cancelo el diálogo, **entonces** no se crea ninguna alerta.

### HU-03 · Que mis contactos reciban un correo · 5 pts · RF-CO-01 a RF-CO-06
**Como** persona usuaria **quiero** que mis contactos reciban un correo con mi ubicación **aunque yo no pueda tocar nada**.
- **Dado** que activé una alerta real y tengo contactos con correo, **entonces** veo «¿Enviar correo a sus contactos?» con 20 s.
- **Cuando** no respondo en 20 s o toco «Sí, enviar ahora», **entonces** el correo se envía y el estado dice «enviado».
- **Cuando** toco «No enviar», **entonces** el estado dice «cancelado» y puedo reintentar.
- **Dado** que es un simulacro, **entonces** no se pregunta por el correo.

### HU-04 · Avisar por SMS o WhatsApp y llamar · 3 pts · RF-AL-05, RF-AL-06
**Como** persona usuaria **quiero** enviar un SMS o WhatsApp a mis contactos y llamar a la línea de emergencias **para** usar el canal que funcione.
- **Cuando** toco «Enviar SMS», **entonces** se abre la app de mensajes con el texto listo (ubicación, puntos de encuentro, ficha si la comparto y batería).
- **Cuando** toco «Llamar al 123», **entonces** se abre el marcador con el número configurado.

### HU-05 · Saber que el centro de monitoreo me atiende · 3 pts · RF-PA-04
**Como** persona usuaria **quiero** ver el mensaje del centro de monitoreo **para** saber que la ayuda viene en camino.
- **Dado** que el operador registró ayuda, **entonces** en máximo 15 s veo un aviso fijo arriba de la pantalla, aunque esté con el scroll abajo.
- **Cuando** toco el aviso o la ✕, **entonces** se cierra, y solo vuelve si llega otro estado o mensaje.

### HU-06 · Sobrevivir atrapado · 3 pts · RF-AL-07
**Como** persona usuaria **quiero** ahorrar batería y emitir señales de rescate **para** que me encuentren si quedo atrapada.
- **Dado** que la batería baja del umbral, **entonces** se activa el modo ahorro y lo puedo revertir.
- **Cuando** activo el modo atrapado, **entonces** suenan pitidos periódicos con menor consumo.

### HU-07 · Llegar al punto de encuentro · 3 pts · RF-CT-02, RF-CT-03
**Como** persona usuaria **quiero** ver el mapa, la brújula y la ruta al punto de encuentro más cercano **para** llegar aunque no haya señal.
- **Dado** que tengo varios puntos, **entonces** la brújula guía al más cercano y puedo elegir otro.

### HU-08 · Que los rescatistas conozcan mi ficha médica · 3 pts · RF-IN-01, RF-IN-02
**Como** persona usuaria **quiero** un QR con mi ficha médica **para** que cualquier rescatista la lea sin internet.
- **Dado** que guardé la ficha y activé «Compartir», **cuando** toco «Ver QR médico», **entonces** aparece un QR sobre fondo blanco.
- **Cuando** un rescatista lo escanea con cualquier lector, **entonces** ve la ficha en texto plano y la línea de emergencias.

### HU-09 · Prepararme · 5 pts · RF-IN-03 a RF-IN-07
**Como** persona usuaria **quiero** la guía, los sismos recientes, la mochila y los simulacros **para** estar preparada antes de un sismo.

### HU-10 · Mis datos sin conexión · 5 pts · RF-SI-01 a RF-SI-03
**Como** persona usuaria **quiero** que nada se pierda sin internet.
- **Dado** que no hay red, **cuando** hago un cambio, **entonces** veo «Sus datos se guardarán apenas tenga conexión» y el número de cambios pendientes.

### HU-11 · Recuperar mis datos en otro teléfono · 5 pts · RF-CF-02
**Como** persona usuaria **quiero** un código de recuperación **para** no perder nada si pierdo el teléfono.
- **Cuando** escribo el código en el teléfono nuevo (sin importar mayúsculas ni guiones), **entonces** se restauran contactos, historial, ficha, puntos, kit, encuestas y ajustes.
- **Entonces** el teléfono perdido pierde el acceso y el código ya no sirve.

### HU-12 · Eliminar mi cuenta · 3 pts · RF-CF-03
**Como** persona usuaria **quiero** eliminar mi cuenta **para** ejercer mi derecho sobre mis datos.
- **Cuando** confirmo, **entonces** se borran mis datos personales en el servidor y en el teléfono, y vuelvo a la Bienvenida para registrarme de nuevo si quiero.
- **Dado** que no hay red, **entonces** no se borra nada y la app me pide intentarlo con internet.

### HU-13 · Usar la app a mi manera · 2 pts · RF-CF-01
**Como** persona usuaria **quiero** elegir idioma, tema y opciones de accesibilidad **para** usarla con comodidad.

---

## Operador del centro de monitoreo (panel)

### HU-20 · Entrar solo si estoy autorizado · 2 pts · RF-PA-01
**Como** operador **quiero** que solo los correos autorizados entren al panel **para** proteger los datos de salud.
- **Dado** que no inicié sesión, **entonces** me lleva al inicio de sesión; **dado** que mi correo no está autorizado, **entonces** veo «Acceso restringido».

### HU-21 · Ver las alertas en tiempo real · 5 pts · RF-PA-02, RF-PA-03
**Como** operador **quiero** ver las alertas activas en un mapa y recibir avisos **para** reaccionar de inmediato.
- **Dado** que alguien activa una alerta, **entonces** en máximo un minuto aparece sola en «Alertas activas», con banner rojo, sonido y notificación si activé los avisos.

### HU-22 · Brindar ayuda · 5 pts · RF-PA-04
**Como** operador **quiero** registrar el estado de la atención con un mensaje **para** que la persona sepa que la estamos ayudando.
- **Cuando** guardo «Ayuda enviada» con un mensaje, **entonces** queda en la bitácora y la persona lo ve en su app.

### HU-23 · Conocer a la persona · 3 pts · RF-PA-05
**Como** operador **quiero** ver contactos, ficha médica, puntos de encuentro y última ubicación **para** coordinar el rescate.

### HU-24 · Ayudar a recuperar una cuenta · 2 pts · RF-PA-07
**Como** operador **quiero** generar un código temporal de 48 h **para** ayudar a quien perdió el teléfono y no guardó su código.

### HU-25 · Cambiar el contenido sin publicar otra versión · 5 pts · RF-PA-08
**Como** operador **quiero** editar catálogos, la guía y los parámetros **para** actualizar la app sin depender de una nueva versión.
- **Cuando** guardo un cambio válido, **entonces** la app lo recibe la próxima vez que se abre.
- **Dado** un dato inválido (clave repetida, número fuera de rango), **entonces** veo el error y no se guarda.

### HU-26 · Consultar historial, usuarios y sismos · 3 pts · RF-PA-06
**Como** operador **quiero** consultar el historial, los usuarios y los sismos recientes **para** tener contexto e indicadores.

---

## Visitante (página informativa)

### HU-30 · Conocer SISMO sin iniciar sesión · 2 pts · RF-PI-01, RF-PI-02
**Como** visitante **quiero** ver qué ofrece SISMO **para** decidir si lo quiero en mi organización.
- **Cuando** abro `Sismo_info`, **entonces** veo la página completa sin iniciar sesión, y no veo «Ir al panel».
