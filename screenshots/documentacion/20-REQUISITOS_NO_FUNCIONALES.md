> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# 20. Documento de requisitos no funcionales — SISMO

Versión 1.0 · 4 de noviembre de 2026. Cada requisito tiene un identificador `RNF-XX-NN`, la forma de verificarlo y cómo lo cumple la implementación actual.

## RNF-SE · Seguridad y privacidad

| ID | Requisito | Cómo se cumple |
|---|---|---|
| RNF-SE-01 | Las credenciales del dispositivo no se guardan en claro. | Token aleatorio entregado una sola vez; en la base de datos solo queda su SHA-256 (`hash_token`). |
| RNF-SE-02 | Los datos de salud se guardan cifrados. | Ficha médica cifrada con AES-256-GCM (IV aleatorio + etiqueta de autenticación). La llave está en la variable de entorno `SISMO_LLAVE_CIFRADO`, nunca en el código ni en la base de datos. Sin llave, la API responde 503 y no guarda nada en claro. |
| RNF-SE-03 | Ningún secreto en el código de la app. | La app solo conoce URLs (`VITE_SISMO_API_URL`, `VITE_ALERT_EMAIL_URL`); las credenciales del proveedor de correo viven en el servicio de correo. |
| RNF-SE-04 | Los códigos de recuperación resisten la fuerza bruta. | 12 caracteres sin letras ambiguas, de un solo uso, guardados como SHA-256; un código inválido responde con 1 s de espera. El del panel vence en 48 h. |
| RNF-SE-05 | El panel exige identidad y protege sus acciones. | Sesión iniciada + correo en la lista `sismo_administradores`; todo `POST` exige la cabecera `X-CSRF-Token`. |
| RNF-SE-06 | Protección contra inyección y XSS. | Consultas con el Query Builder de CodeIgniter (valores escapados, nunca concatenados); validación central de cada campo (tipos, longitudes, expresiones regulares, listas cerradas); en el panel los datos de la app se pintan con `textContent`. |
| RNF-SE-07 | Límites de entrada. | Cuerpo JSON máximo de 64 KB (413); ids con `^[A-Za-z0-9-]{8,36}$`; claves de catálogo con `^[a-z0-9_]{1,40}$`. |
| RNF-SE-08 | Origen de las peticiones controlado. | CORS con lista de orígenes (`SISMO_CORS_ORIGENES` o los de Capacitor y Vite local). |
| RNF-SE-09 | Tratamiento de datos personales (Ley 1581 de 2012). | Consentimiento explícito para compartir la ficha médica; «Eliminar mi cuenta» suprime nombre, contactos, ficha, ubicaciones, puntos, notas y mensajes; solo quedan métricas anónimas. |
| RNF-SE-10 | Uso responsable de IA generativa (Política ODTI012). | Nota de transparencia en los archivos creados o modificados con IA; revisión humana obligatoria. |

## RNF-DI · Disponibilidad y tolerancia a fallos

| ID | Requisito | Cómo se cumple |
|---|---|---|
| RNF-DI-01 | La alerta local funciona sin internet. | Sirena, linterna, vibración, brújula, guía y QR médico funcionan en el teléfono sin red. |
| RNF-DI-02 | Ningún dato se pierde sin conexión. | Primero se guarda en el teléfono (`localStorage`); los cambios esperan en una cola persistente y se suben al volver la red, con reintentos y espera creciente. |
| RNF-DI-03 | Las escrituras se pueden repetir sin duplicar. | Cada registro lleva el UUID de la app (`id_cliente`) con índice único; la API hace *upsert*. |
| RNF-DI-04 | La app sigue funcionando si un servicio externo falla. | Catálogos: copia local y valores por defecto. Sismos: mensaje de error y reintento. Correo: estado «fallido» con reintento. Mapa: aviso en lugar de quedar gris. |
| RNF-DI-05 | Un error de pantalla no deja la app en blanco. | Pantalla de error con opción de recargar y el número de emergencia visible (`AppErrorBoundary`). |

## RNF-RE · Rendimiento y tiempos de respuesta

| ID | Requisito | Valor |
|---|---|---|
| RNF-RE-01 | La pantalla de carga no retrasa el uso de la app. | Mínimo 600 ms, máximo 1,5 s; nunca tapa una alerta activa. |
| RNF-RE-02 | La alerta del panel llega rápido al operador. | Actualización automática cada 60 s; detalle de la persona al abrirla. |
| RNF-RE-03 | La ayuda del operador llega rápido a la persona. | La app consulta `GET /atencion` cada 15 s mientras la alerta está activa. |
| RNF-RE-04 | El catálogo de sismos no satura el servicio externo. | Caché de 5 minutos en el backend para el USGS. |
| RNF-RE-05 | La ubicación de la alerta es precisa sin demorar el aviso. | Afinado de GPS de hasta 10 s; actualización cada 2 min. |

## RNF-US · Usabilidad y accesibilidad

| ID | Requisito | Cómo se cumple |
|---|---|---|
| RNF-US-01 | Se puede usar con nervios y con una mano. | Botón SOS grande, confirmación de un toque, textos cortos, barra de navegación inferior. |
| RNF-US-02 | Bilingüe. | Español e inglés en toda la app (i18n); catálogos con texto en ambos idiomas. |
| RNF-US-03 | Accesible. | Alto contraste, texto grande, reducir movimiento, tema oscuro, lectura en voz alta de la guía, etiquetas ARIA. |
| RNF-US-04 | Mensajes claros, nunca engañosos. | La app nunca dice que un SMS o correo salió si no es así; avisos de sin conexión, cambios pendientes y estado del correo. |
| RNF-US-05 | Usabilidad medible. | Encuesta SUS integrada (puntaje 0–100) y métricas de tiempo de reacción en simulacros. |

## RNF-PO · Portabilidad y compatibilidad

| ID | Requisito | Valor |
|---|---|---|
| RNF-PO-01 | Plataformas de la app. | Android (Capacitor 8, APK) y navegadores modernos (build web de Vite). iOS fuera del alcance actual. |
| RNF-PO-02 | Plataforma del backend. | PHP 7.3 + CodeIgniter 3 sobre Apache; MySQL / MariaDB (InnoDB, utf8mb4). |
| RNF-PO-03 | Diseño adaptable. | App en vista móvil y escritorio; panel y página informativa sin scroll horizontal desde 390 px. |

## RNF-MA · Mantenibilidad y calidad

| ID | Requisito | Cómo se cumple |
|---|---|---|
| RNF-MA-01 | Código tipado y revisado automáticamente. | TypeScript estricto, ESLint y `tsc` en cada cambio. |
| RNF-MA-02 | Pruebas automáticas en integración continua. | GitHub Actions: lint, tipos, pruebas unitarias (Vitest), e2e (Playwright, móvil y escritorio) y APK de depuración. |
| RNF-MA-03 | Contenido de negocio sin «quemar» en el código. | Catálogos, guía y parámetros administrables desde el panel. |
| RNF-MA-04 | Convención de base de datos del CCS. | Tablas en plural y `snake_case`, todo comentado, FK `id_`, auditoría completa, `activo` como único borrado. |
| RNF-MA-05 | Trazabilidad de operaciones. | Logs JSON con `execution_id` (UUID v4) por petición, también en la cabecera `X-Execution-Id`; el panel registra consultas de datos sensibles, atenciones y códigos generados. |
| RNF-MA-06 | Script de base de datos reproducible. | Un único script SQL idempotente (`CREATE TABLE IF NOT EXISTS`, `ALTER … MODIFY`, `INSERT IGNORE`). |
