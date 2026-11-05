> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.
> **Tercera entrega.** Copia actualizada del documento de la segunda entrega (`../../segunda_entrega/documentacion/23-API_Y_ENDPOINTS.md`), que se conserva sin cambios. Aquí solo cambia lo del correo de alerta a los contactos.


# 23. Documentación de API y endpoints — SISMO

El backend está hecho en **CodeIgniter 3 (PHP 7.3)** y se comunica en **JSON**. Tiene tres partes:

| Parte | Controlador | Quién la usa | Autenticación |
|---|---|---|---|
| API de la app | `Sismo` | App SISMO | Token del dispositivo: `Authorization: Bearer <token>` |
| Panel de monitoreo | `Sismo_admin` | Operador | Sesión iniciada + correo autorizado; los `POST` exigen `X-CSRF-Token` |
| Página informativa | `Sismo_info` | Público | Ninguna |

**URL base de la API:** `VITE_SISMO_API_URL` (por ejemplo `https://<servidor>/sismo`).

---

## 1. Convenciones de la API de la app

- **Formato:** `Content-Type: application/json`; cuerpo máximo de **64 KB**.
- **Identificador de petición:** cada respuesta trae la cabecera `X-Execution-Id` (UUID v4), que es el mismo `execution_id` de los logs JSON.
- **CORS:** orígenes en `SISMO_CORS_ORIGENES` o, por defecto, los de Capacitor y Vite local. El *preflight* `OPTIONS` responde `204`.
- **Idempotencia:** los `PUT` y `DELETE` por `{id}` usan el UUID de la app (`id_cliente`). Repetirlos no crea duplicados.
- **Ids:** `{id}` debe cumplir `^[A-Za-z0-9-]{8,36}$`.

### Errores comunes

| Código | Cuerpo | Cuándo |
|---|---|---|
| 400 | `{"error":"json_invalido"}` | El cuerpo no es JSON válido |
| 401 | `{"error":"token_invalido"}` | Falta el token, es incorrecto o la cuenta fue revocada o eliminada |
| 404 | `{"error":"ruta_no_encontrada"}` | Ruta inexistente |
| 405 | `{"error":"metodo_no_permitido"}` | Método HTTP no admitido en esa ruta |
| 413 | `{"error":"cuerpo_muy_grande"}` | Cuerpo de más de 64 KB |
| 422 | `{"error":"dato_invalido","campo":"<campo>"}` | Validación fallida; indica el campo |
| 500 | `{"error":"error_interno"}` | Error inesperado (queda en el log con su `execution_id`) |
| 503 | `{"error":"cifrado_no_configurado"}` / `{"error":"catalogos_no_disponibles"}` | Falta la llave de cifrado / no se pudieron leer los catálogos |

---

## 2. Endpoints de la API de la app (`Sismo`)

| Método | Ruta | Token | Cuerpo | Respuesta correcta | Errores propios |
|---|---|---|---|---|---|
| `POST` | `/registro` | No | `{"plataforma":"android"\|"ios"\|"web"}` | **201** `{"uuid_dispositivo","token"}` (el token se entrega solo una vez) | 422 |
| `GET` | `/estado` | Sí | — | **200** todos los datos de la persona en formato `AppData` (para restaurar) | 401 |
| `PUT` | `/ajustes` | Sí | `{settings, locationPermission, lastLocation, postQuakeDone}` | **200** `{"ok":true}` | 401, 422 |
| `PUT` | `/contactos/{id}` | Sí | `Contact` (incluye `emailPrimary`) | **200** `{"ok":true}` | 401, 422 |
| `DELETE` | `/contactos/{id}` | Sí | — | **200** `{"ok":true}` (borrado lógico) | 401 |
| `PUT` | `/alertas/{id}` | Sí | `AlertRecord` (incluye métricas, ubicación, `emailStatus`, `postQuakeDone` y la prioridad: `urgent`, `urgentAt`, `fallNoResponse`, `trapped`, `batteryLevel` 0–100, `batteryAt`) | **200** `{"ok":true}` | 401, 422 |
| `DELETE` | `/alertas/{id}` | Sí | — | **200** `{"ok":true}` | 401 |
| `PUT` | `/puntos_encuentro/{id}` | Sí | `MeetingPoint` | **200** `{"ok":true}` | 401, 422 |
| `DELETE` | `/puntos_encuentro/{id}` | Sí | — | **200** `{"ok":true}` | 401 |
| `PUT` | `/encuestas/{id}` | Sí | `SusResponse` | **200** `{"ok":true}` | 401, 422 |
| `DELETE` | `/encuestas/{id}` | Sí | — | **200** `{"ok":true}` | 401 |
| `PUT` | `/inventario` | Sí | `EmergencyKit` o `null` | **200** `{"ok":true}` | 401, 422 |
| `PUT` | `/ficha_medica` | Sí | `MedicalInfo` (se cifra con AES-256-GCM) | **200** `{"ok":true}` | 401, 422, **503** sin llave |
| `DELETE` | `/ficha_medica` | Sí | — | **200** `{"ok":true}` | 401 |
| `POST` | `/codigo_recuperacion` | Sí | — | **201** `{"codigo":"XXXX-XXXX-XXXX"}` (invalida el anterior; no vence) | 401 |
| `POST` | `/recuperar` | No | `{"codigo","plataforma"}` | **200** `{"uuid_dispositivo","token"}` (token nuevo; el teléfono anterior queda revocado) | **404** `codigo_invalido` (responde tras 1 s) |
| `GET` | `/atencion` | Sí | — | **200** `{"atencion":{alertId,status,note,at}\|null}` | 401 |
| `GET` | `/catalogos` | No | — | **200** catálogos, guía y parámetros con su `version` | 503 |
| `POST` | `/eliminar_cuenta` | Sí | — | **200** borrado lógico en cascada + supresión de datos personales; token y código revocados | 401 |
| `POST` | `/correo_alerta/{id}` | Sí | `{tipo: alerta\|caida\|urgente\|atrapado\|bateria\|ubicacion, mensaje, idioma}` | **200** `{ok, para, copia}` · **200** `{ok, ya_enviado}` | 404 `alerta_no_encontrada` · 422 `simulacro` · 422 `sin_destinatarios` · 422 `dato_invalido` · 429 `limite_correos` · 502 `envio_fallido` · 503 `correo_no_disponible` |
| `GET` | `/insignias` | Sí | — | **200** `{ganadas, por_ganar, secretas, vencidas, nuevas, perfil:{porcentaje, items}, total}` (evalúa antes; las «nuevas» quedan notificadas; las secretas sin nombre ni imagen) | 401 |
| `POST` | `/insignias` | Sí | `{acciones:[{accion: ingreso\|hecho, clave?, elemento?, valor?, momento?}]}` (máx. 50; `momento` ≤ 30 días atrás; `clave` de la lista blanca) | **200** igual que el GET | 401, 422 `acciones` / `clave` / `momento` |
| `GET` | `/foto` | Sí | — | **200** `{foto:{url, expira}\|null}` (URL firmada de 15 min; pedir otra al vencer) | 401 |
| `POST` | `/foto` | Sí | `{imagen: base64}` (JPEG/PNG/WebP, máx. 2 MB) | **200** `{foto:{url, expira}}` (se guarda en el bucket `sismo/perfil/` y se borra la anterior) | 401, 413, 422 `imagen`, 503 `bucket_no_disponible` |
| `DELETE` | `/foto` | Sí | — | **200** `{foto:null}` (se borra del bucket) | 401 |
| `GET` | `/version` | No | — | **200** `{actual, minima, nombre, enlace, tienda}`: versión publicada de la app Android (`actual`/`minima` son `versionCode`; `enlace` es la tienda si está configurada o `Sismo_info/android`) | — |

### Ejemplo: registrar el dispositivo y subir un contacto

```http
POST /sismo/registro
Content-Type: application/json

{"plataforma":"android"}
```
```json
201 Created
{"uuid_dispositivo":"3f6c…","token":"<token de un solo uso>"}
```
```http
PUT /sismo/contactos/7d0e9a3c-1b2f-4c55-9e1a-0a6b2c3d4e5f
Authorization: Bearer <token>
Content-Type: application/json

{"id":"7d0e9a3c-1b2f-4c55-9e1a-0a6b2c3d4e5f","name":"Luisa Demo","relationship":"Familiar",
 "phone":"3000000001","email":"luisa@example.com","createdAt":"2026-11-04T13:00:00.000Z"}
```
```json
200 OK
{"ok":true}
```

---

## 3. Endpoints del panel de monitoreo (`Sismo_admin`)

Sin sesión, las páginas redirigen al inicio de sesión y las consultas responden **401** `sesion_expirada`. Con sesión pero sin autorización responden **403** `sin_permiso`. Un `POST` sin un token CSRF válido responde **403** `csrf`.

| Método | Ruta | Parámetros | Respuesta |
|---|---|---|---|
| `GET` | `/Sismo_admin` | — | Página del panel (HTML) con el token CSRF |
| `GET` | `/Sismo_admin/datos` | — | **200** `{resumen, activas, alertas, usuarios, ahora}` |
| `GET` | `/Sismo_admin/pulso` | — | **200** `{firma}`: huella de alertas y atenciones; el panel la pide cada 3 s y descarga `datos` solo si cambia |
| `GET` | `/Sismo_admin/usuario/{id}` | — | **200** detalle de la persona (contactos, ficha descifrada, puntos, alertas, kit, encuestas, bitácora, correos, **foto** firmada, **insignias** y **perfil**). La consulta queda en el log · 404 |
| `POST` | `/Sismo_admin/atender` | `{id_alerta, estado: en_atencion\|ayuda_enviada\|resuelta, nota}` (`nota` en HTML; el servidor deja solo p, br, strong, em, u, s, ul, ol, li; máx. 500 caracteres visibles) | **200** `{"ok":true}` · 404 `alerta_no_encontrada` · 422 |
| `POST` | `/Sismo_admin/codigo` | `{id_usuario}` | **201** `{codigo, horas: 48}` · 404 `usuario_no_encontrado` |
| `GET` | `/Sismo_admin/sismos?dias=1\|7` | `dias` | **200** `{dias, sismos[]}` (USGS, caché de 5 min) · 502 `usgs_no_disponible` |
| `GET` | `/Sismo_admin/catalogos` | — | **200** catálogos, guía, parámetros y plantillas de mensaje (incluye los ocultos) + íconos disponibles |
| `POST` | `/Sismo_admin/catalogo_guardar` | `{id?, tipo, clave, nombre_es, nombre_en, icono, orden, activo}` | **200** · 422 `{campo}` |
| `POST` | `/Sismo_admin/guia_guardar` | `{id?, clave, momento, titulo_es, titulo_en, pasos_es, pasos_en, icono, orden, activo}` | **200** · 422 `{campo}` |
| `POST` | `/Sismo_admin/parametro_guardar` | `{clave, valor, activo}` | **200** · 422 `{campo}` (valida números y listas) |
| `POST` | `/Sismo_admin/plantilla_guardar` | `{id?, estado: general\|en_atencion\|ayuda_enviada\|resuelta, titulo, mensaje (HTML con la misma lista blanca), orden, activo}` | **200** `{"ok":true}` · 422 `{campo}` · 422 `titulo_repetido` · 422 `no_encontrado` |
| `POST` | `/Sismo_admin/correo_contactos` | `{id_usuario, asunto, mensaje}` (mensaje en HTML con lista blanca, máx. 2000 caracteres) | **200** `{ok, para, copia}` · 404 `usuario_no_encontrado` · 422 `dato_invalido` / `mensaje_largo` / `sin_destinatarios` · 429 `limite_correos` · 502 `envio_fallido` · 503 `correo_no_disponible` |
| `GET` | `/Sismo_admin/insignias` | — | **200** `{insignias (con ganadores, imagen_url, regla, local), auditoria, locales, acciones, hechos, niveles}` |
| `POST` | `/Sismo_admin/insignia_guardar` | multipart: campos de la regla + `imagen` (PNG/JPEG/WebP, máx. 512 KB; obligatoria al crear) | **200** `{ok, id}` · 422 `{campos}` (incluye `nombre_repetido`) · 404 |
| `POST` | `/Sismo_admin/insignia_estado` | `{id, activo}` | **200** · 404 |
| `GET` | `/Sismo_admin/insignia_ganadores/{id}` | — | **200** `{ganadores[]}` (máx. 200) · 404 |
| `POST` | `/Sismo_admin/insignias_subir_bucket` | `{}` | **200** `{ok, subidas, fallidas}`: sube a `sismo/insignias/`, verifica MD5 y borra la copia del servidor · 502 si ninguna subió |
| `GET` | `/Sismo_admin/foto/{id}` | — | **200** `{foto:{url, expira}\|null}` (URL firmada de 15 min) |
| `GET` | `/Sismo_admin/apk_estado` | — | **200** `{publicado, descarga, version}` · 403 si no es superadministrador · 502 `bucket` |
| `POST` | `/Sismo_admin/apk_subir` | multipart: `apk` (`.apk`, máx. 150 MB; ZIP con `AndroidManifest.xml`) | **200** `{ok, bytes, descarga, version_apk:{codigo, nombre}\|null, version}`: sube a `sismo/app/sismo.apk`, verifica MD5, sin copia local · 403 · 422 `no_es_apk` / `muy_grande` / `archivo` · 502 `bucket` |
| `POST` | `/Sismo_admin/apk_version_guardar` | `{actual, minima, nombre, tienda}` (`minima` ≤ `actual`; `tienda` vacía o `https://`) | **200** `{ok, version}` · 403 · 422 `{campos}` |

## 4. Página informativa (`Sismo_info`)

| Método | Ruta | Respuesta |
|---|---|---|
| `GET` | `/Sismo_info` | Página HTML pública; «Ir al panel» solo para operadores autorizados |
| `GET` | `/Sismo_info/android` | **302** a una URL firmada de 10 min del APK (se descarga como `SISMO.apk`) · **404** «estará disponible pronto» si aún no se ha subido |

## 5. Correo de alerta a los contactos

El correo lo envía el backend con el servicio de correo de la organización; la app no guarda credenciales de correo ni decide a quién se escribe.

1. La app sube lo pendiente (contactos y alerta) y llama a `POST /correo_alerta/{id}`.
2. El backend valida la alerta (de esa persona, no simulacro), revisa la bitácora (un envío por alerta y tipo) y el límite (8 por hora).
3. Toma los destinatarios de los contactos guardados: principales en «Para» y el resto en copia oculta.
4. Arma el asunto por tipo y el cuerpo HTML con el diseño de la app (logo en base64, mensaje escapado, botón «Ver ubicación en el mapa»).
5. Envía con el remitente «SISMO» y registra el resultado en `sismo_correos_alertas` (sin direcciones).

El operador también puede escribir a los contactos desde el panel (`POST /Sismo_admin/correo_contactos`): mismos destinatarios y diseño, franja «Centro de monitoreo SISMO», máximo 10 por persona y hora, y registro en `sismo_correos_operador`.

El token del servicio de correo se lee de la variable de entorno `CORREO_SERVICIO_TOKEN` (y la URL, opcional, de `CORREO_SERVICIO_URL`); nunca está en el código.

## 6. Servicios externos consumidos

| Servicio | Uso | Quién lo llama |
|---|---|---|
| USGS (`earthquake.usgs.gov`) | Sismos M2,5+ de 24 h y 7 días | App y backend (panel) |
| OpenStreetMap (`tile.openstreetmap.org`) | Mapas | App y panel |
| `routing.openstreetmap.de` | Rutas al punto de encuentro | App |
| ArcGIS / Photon | Buscar una dirección | App |
| Waze / Google Maps | Enlaces de navegación | App (abre la app externa) |
