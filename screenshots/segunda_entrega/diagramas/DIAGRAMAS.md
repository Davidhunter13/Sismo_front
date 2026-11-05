> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# SISMO: documentación gráfica y diagramas

Diagramas técnicos del proyecto (app, backend en CodeIgniter 3 y base de datos). Cada diagrama es **una imagen PNG independiente**, construida a partir del código real. Cuando una función la usan roles distintos, hay **un diagrama por rol**.

**Roles del sistema**

| Rol | Dónde trabaja | Qué hace |
|---|---|---|
| **Persona usuaria** | App SISMO (Android o web) | Se registra, activa alertas, avisa a sus contactos y gestiona sus datos |
| **Operador del centro de monitoreo** | Panel SISMO (web, con sesión y correo autorizado) | Vigila alertas en tiempo real, brinda ayuda y administra el contenido de la app |
| **Visitante** | Página informativa pública (`Sismo_info`) | Conoce qué ofrece SISMO, sin iniciar sesión |
| Actores externos | — | Contacto de emergencia (recibe SMS, WhatsApp o correo), rescatista (lee el QR médico), servicio de correo, USGS |

> **Envío de correos:** se representa como función del sistema, según el alcance pedido. La app arma la solicitud y la envía por `POST` a `VITE_ALERT_EMAIL_URL` (contrato en `src/services/emailService.ts`); el **servicio de correo de alertas** valida los destinatarios y envía por medio del proveedor de correo.
>
> **Planificación (Gantt, PERT, ruta crítica, línea de tiempo):** el proyecto va del **martes 6 de octubre al viernes 11 de diciembre de 2026** (49 días hábiles, de lunes a viernes), en 5 fases. Las fases 1 a 3 ya están hechas y respetan las entregas reales: versión 1 el 23/10 (capturas del 24/10), versión 2 el 02/11 y versión 3 el 04/11. Las fases 4 y 5 (noviembre y diciembre) son el plan para lo que falta según la hoja de ruta. La holgura y la ruta crítica se calculan con el método CPM.

---

## 1. Diagramas UML y funcionales (`1-uml-y-funcionales/`)

| # | Imagen | Qué muestra |
|---|---|---|
| 1 | `01a-casos-de-uso-persona-usuaria.png` | Casos de uso de la persona en la app: registro, alerta SOS («include»: tipo de evento, señales y ubicación; «extend»: correo y SMS/WhatsApp), «Estoy bien», contactos, puntos de encuentro, ficha médica y QR, guía, sismos, mochila, «Después del sismo», simulacro y SUS, historial, configuración, recuperación y eliminar cuenta |
| 1 | `01b-casos-de-uso-operador-centro-de-monitoreo.png` | Casos de uso del operador: alertas y mapa en tiempo real, avisos, brindar ayuda, detalle de la persona, historial, usuarios, indicadores, sismos recientes, código temporal y administración de catálogos, guía, parámetros y **plantillas de mensaje** (usar plantilla «extend» de brindar ayuda) |
| 1 | `01c-casos-de-uso-visitante-pagina-informativa.png` | Casos de uso del visitante en la página pública |
| 2 | `02a-actividades-persona-registro-inicial.png` | Actividades: registro en 4 pasos y subida al servidor (o cola sin conexión) |
| 2 | `02b-actividades-persona-alerta-sos-y-correo.png` | Actividades: alerta SOS con señales, ubicación, **correo con cuenta regresiva de 20 s**, sincronización y aviso del centro de monitoreo |
| 2 | `02c-actividades-operador-atencion-de-alerta.png` | Actividades del operador: acceso, pulso cada 3 s, aviso y registro de la ayuda |
| 2 | `02d-actividades-operador-administrar-contenido.png` | Actividades del operador: catálogos, guía, parámetros y plantillas de mensaje, con validación; la app descarga los catálogos y las plantillas quedan en «Brindar ayuda» |
| 3 | `03a-secuencia-persona-alerta-sos-y-correo.png` | Secuencia: AlertPage → emailService → servicio de correo → proveedor → contactos, en paralelo con syncService → API → modelo → MySQL, y la consulta de ayuda cada 15 s |
| 3 | `03b-secuencia-operador-brindar-ayuda.png` | Secuencia: panel → `Sismo_admin` → `Sesion_persona` / `Sismo_model` → MySQL (con CSRF), con la carga de plantillas y el reemplazo de `[nombre]`, `[primer_nombre]` y `[evento]` |
| 3 | `03c-secuencia-persona-recuperar-cuenta.png` | Secuencia: código de recuperación (SHA-256), restauración en un teléfono nuevo y revocación del anterior |
| 3 | `03d-secuencia-sistema-sincronizacion-sin-conexion.png` | Secuencia: cola persistente, envío al volver la red, nuevo registro tras un 401 y reintentos |
| 4 | `04a-clases-backend.png` | Clases del backend: `Sismo`, `Sismo_admin`, `Sismo_info`, `Sismo_model`, `Sesion_persona` |
| 4 | `04b-clases-modelo-de-datos-app.png` | Modelo de datos de la app (`AppData` y sus partes) |
| 4 | `04c-clases-servicios-de-la-app.png` | Servicios (módulos) de la app y su relación con `AppStateProvider` |
| 5 | `05a-estados-alerta-sos.png` | Estados de la alerta: confirmando, activa (señales, ahorro, atrapado), finalizada y eliminada |
| 5 | `05b-estados-atencion-centro-de-monitoreo.png` | Estados de la atención: sin atender, en atención, ayuda enviada y resuelta |
| 5 | `05c-estados-correo-de-alerta.png` | Estados del correo: preguntando, enviando, enviado, cancelado, fallido, sin destinatarios y sin servidor |
| 5 | `05d-estados-cuenta-y-sincronizacion.png` | Estados de la cuenta del dispositivo: registrada, sincronizada, cambios pendientes, token revocado, acceso perdido y eliminada |
| 6 | `06a-flujo-de-procesos-persona-usuaria.png` | Flujo de procesos de la persona: preparación, emergencia, después y cuenta |
| 6 | `06b-flujo-de-procesos-operador.png` | Flujo de procesos del operador: acceso, monitoreo, atención, soporte y contenido |

## 2. Arquitectura y diseño (`2-arquitectura-y-diseno/`)

| # | Imagen | Qué muestra |
|---|---|---|
| 7 | `07-arquitectura-del-sistema.png` | Capas: clientes, backend CodeIgniter 3, datos (MySQL y localStorage) y servicios externos |
| 8 | `08-componentes.png` | Componentes del front (páginas, UI, estado, servicios, i18n, puente nativo) y del backend, con sus interfaces |
| 9 | `09-despliegue.png` | Nodos: teléfono Android (APK), navegador, servidor web (Apache + PHP 7.3), base de datos, servidor de correo y servicios de Internet, con protocolos y puertos |
| 10 | `10-infraestructura.png` | Desarrollo (GitHub, GitHub Actions con pruebas y APK, base de datos de desarrollo en Google Cloud por túnel IAP) y producción |
| 11 | `11a-navegacion-app-persona-usuaria.png` | Navegación entre las 17 rutas de la app (barra inferior, encabezado y enlaces) |
| 11 | `11b-navegacion-panel-operador.png` | Navegación del panel (ventanas, pestañas, catálogos y «Mensajes de ayuda») y de la página pública |

## 3. Base de datos (`3-base-de-datos/`)

| # | Imagen | Qué muestra |
|---|---|---|
| 12 | `12-entidad-relacion.png` | DER: las 13 tablas `sismo_*` (incluida `sismo_plantillas_atenciones`), sus atributos principales y las relaciones con cardinalidad |
| 13 | `13-modelo-logico.png` | Modelo lógico: todas las columnas con tipo lógico y claves PK / FK / UK |
| 14 | `14-modelo-fisico.png` | Modelo físico generado desde el script SQL: tipos MySQL, nulos, valores por defecto, índices, claves foráneas, motor y juego de caracteres |

El diccionario de datos completo está en [`BASE_DE_DATOS_SISMO.md`](BASE_DE_DATOS_SISMO.md).

## 4. Planificación y tiempos (`4-planificacion-y-tiempos/`)

| # | Imagen | Qué muestra |
|---|---|---|
| 15 | `15-gantt.png` | Gantt de las 5 fases (06/10 → 11/12/2026, días hábiles): hecho en azul, en curso con borde, planeado en blanco, crítico en rojo, hitos de entrega y la fecha de hoy |
| 16 | `16-pert.png` | Red PERT con ES, D, EF, LS, H (holgura) y LF por actividad |
| 17 | `17-ruta-critica.png` | Ruta crítica A → B → C → I → J·K → L → Q → S → T → U (49 días hábiles); las actividades con holgura van punteadas |
| 18 | `18-linea-de-tiempo.png` | Línea de tiempo por versión y próximos pasos de la hoja de ruta |

**Actividades:**

| Fase | Actividades | Fechas | Estado |
|---|---|---|---|
| 1 · Análisis, diseño y prototipo | A análisis y requisitos · B diseño UX/UI e identidad visual · C prototipo web v1 | 06/10 – 23/10 | Hecho |
| 2 · App completa | D app Android, widget y acceso rápido · E alertas avanzadas y comunicación · F ubicación, mapas, rutas y puntos · G supervivencia y validación · H pruebas, CI y APK | 26/10 – 02/11 | Hecho |
| 3 · Backend y monitoreo | I backend, BD y sincronización · J panel de monitoreo · K catálogos, recuperación y servicio de correo · L página informativa y documentación | 26/10 – 06/11 | Hecho / en curso |
| 4 · Producción y pruebas reales | N puesta en producción · O prueba en dispositivo físico · P correo en producción · Q aprobación Ley 1581 | 09/11 – 27/11 | Planeado |
| 5 · Validación y cierre | S validación con usuarios (SUS) · T ajustes · U documentación final y entrega | 30/11 – 11/12 | Planeado |

---

## Cómo editar y regenerar

- **Fuentes:** `fuentes/` tiene un archivo por diagrama, en la misma carpeta y con el mismo nombre que su imagen. Los `.mmd` están en [Mermaid](https://mermaid.js.org/) y se pueden abrir en GitHub o en mermaid.live. El modelo físico es un `.html`.
- **Regenerar las imágenes** (desde la raíz del proyecto):

  ```bash
  npm i --no-save mermaid@11.4.1
  node screenshots/segunda_entrega/diagramas/fuentes/generar-imagenes.cjs            # todas
  node screenshots/segunda_entrega/diagramas/fuentes/generar-imagenes.cjs 05a        # solo las que contienen «05a»
  ```

  Usa el Chromium de Playwright que ya tiene el proyecto.
