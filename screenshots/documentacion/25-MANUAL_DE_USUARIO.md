> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# 25. Manual de usuario — SISMO

Este manual tiene dos partes: **A. App SISMO**, para la persona usuaria, y **B. Panel de monitoreo**, para el operador. Las imágenes de referencia están en `../YYYY-MM-DD/visual/` (ver [evidencias](29-EVIDENCIAS_VISUALES.md)).

> SISMO **no detecta ni predice sismos**. Siga siempre las indicaciones de las autoridades.

---

## A. App SISMO (persona usuaria)

### A1. Primer uso: registro
1. Abra SISMO y toque **Comenzar**.
2. **Paso 1:** escriba su nombre.
3. **Paso 2:** toque **Obtener mi ubicación** y acepte el permiso.
4. **Paso 3:** agregue al menos un **punto de encuentro** (ubicación actual, mapa o dirección). Puede tener varios: casa, trabajo, colegio.
5. **Paso 4:** agregue al menos un **contacto de emergencia** con nombre, teléfono, correo y relación. Puede tomarlo de la agenda.
6. Toque **Finalizar registro**. Si no hay internet, sus datos se guardan en el teléfono y se suben apenas haya conexión.

### A2. En una emergencia: activar el SOS
1. Toque el botón rojo **SOS** en Inicio. En Android también puede usar el **widget** (doble toque) o el **acceso rápido**.
2. Elija el tipo de evento (por ejemplo, *Sismo*) y toque **Activar alerta**.
3. El teléfono hace sonar la sirena, destella la linterna, vibra en código SOS y mantiene la pantalla encendida. Toma su ubicación y la actualiza cada 2 minutos.
4. **Correo a sus contactos:** aparece «¿Enviar correo a sus contactos?» con 20 segundos. Si no responde, se envía solo. Toque **No enviar** si no quiere enviarlo.
5. Desde la pantalla de alerta puede:
   - **Enviar SMS** o **WhatsApp** a sus contactos (el mensaje sale listo; usted toca *Enviar*).
   - **Llamar al 123** (o el número configurado).
   - Activar el **modo atrapado** o el **silbato** si queda atrapado; la app ahorra batería sola cuando baja.
6. Si el centro de monitoreo le responde, verá un **aviso fijo arriba** (por ejemplo «Ayuda en camino») con su mensaje. Tóquelo para cerrarlo.
7. Cuando esté a salvo, toque **Finalizar alerta**. Complete **«Después del sismo»** y avise **«Estoy bien»** a sus contactos.

### A3. Prepararse
| Opción | Dónde | Para qué |
|---|---|---|
| Contactos | Barra inferior → Contactos | Agregar, editar o eliminar contactos |
| Ubicación | Barra inferior → Ubicación | Mapa real, brújula sin internet y ruta al punto de encuentro |
| Ficha médica | Inicio → Ficha médica | Sangre, alergias, medicamentos y condiciones. Active **Compartir** para mostrarla en la alerta y generar el **QR médico** |
| Guía | Barra inferior → Guía | Qué hacer antes, durante y después, con lectura en voz alta |
| Sismos recientes | Inicio → Sismos | Sismos de las últimas 24 h y 7 días |
| Mochila | Inicio → Mochila | Lista del kit con vencimientos |
| Simulacro | Inicio → Simulacro | Practicar con cronómetro y responder la encuesta SUS |
| Historial y estadísticas | Barra inferior → Historial · Inicio → Estadísticas | Alertas pasadas y tiempos de reacción |

**QR médico:** un rescatista lo puede leer con la cámara o con cualquier lector de QR, sin internet y sin SISMO. Verá su ficha en texto.

### A4. Configuración (ícono de engranaje)
- **Idioma** español o inglés, **tema** claro u oscuro, **sonido** (sirena o silbato), señales visuales y vibración.
- **Detección de caídas** (la app pregunta «¿Está bien?» y activa el SOS si no responde) y **ahorro de batería**.
- **Accesibilidad:** alto contraste, texto grande y reducir movimiento.
- **Respaldo y recuperación:**
  - **Crear código de recuperación:** anote el código `XXXX-XXXX-XXXX` fuera del teléfono.
  - **Recuperar mis datos:** en un teléfono nuevo, escriba el código y confirme. El teléfono anterior pierde el acceso. Si no tiene código, pida uno temporal (48 h) al centro de monitoreo.
- **Eliminar mi cuenta:** borra sus datos del servidor y del teléfono. Necesita internet.

### A5. Sin conexión
Si ve **«Sin conexión: sus datos se guardarán apenas tenga conexión»**, siga usando la app con normalidad. La alerta local, la brújula, la guía y el QR funcionan sin internet.

---

## B. Panel de monitoreo (operador)

### B1. Entrar
Inicie sesión con su cuenta y abra **Panel SISMO**. Solo entran los correos autorizados.

### B2. Pantalla principal
- **Indicadores:** alertas activas, usuarios, activos en 24 h, alertas reales, simulacros, tiempos promedio y SUS.
- **Alertas activas** y **mapa en tiempo real**. El panel se actualiza solo cada minuto.
- **Activar avisos:** toque el botón para recibir sonido, notificación del sistema y una ventana con cada alerta nueva. La preferencia se recuerda.

### B3. Atender una alerta
1. En la tarjeta de la alerta, toque **Ver persona y contactos** para ver contactos, ficha médica, puntos de encuentro y última ubicación.
2. Toque **Brindar ayuda**, elija el estado (**En atención**, **Ayuda enviada** o **Resuelta**) y escriba un mensaje claro para la persona.
3. Toque **Guardar**. La persona lo verá en su app en menos de 15 segundos. Registre una nueva atención cada vez que cambie la situación.

### B4. Otras pestañas
- **Historial de alertas** y **Usuarios** (con buscador).
- **Sismos recientes:** últimas 24 horas o 7 días, en tabla y mapa.
- **Código de recuperación temporal:** desde el detalle de la persona, tras verificar su identidad. Dura 48 h.

### B5. Catálogos de la app
En **Catálogos de la app** puede agregar o editar:
- tipos de evento, parentescos, kit, pasos de «Después del sismo» y tipos de sangre (en español e inglés);
- las tarjetas de la **guía**;
- los **parámetros** (número de emergencia, máximo de puntos de encuentro, tiempos).

Los cambios llegan a la app la próxima vez que se abre. *Sismo* y *Otra emergencia* no se pueden ocultar.

### B6. Página informativa
El botón **Qué ofrece SISMO** abre la página pública para presentar el sistema.
