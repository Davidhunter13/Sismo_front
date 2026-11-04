> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

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
| `PUT` | `/contactos/{id}` | Sí | `Contact` | **200** `{"ok":true}` | 401, 422 |
| `DELETE` | `/contactos/{id}` | Sí | — | **200** `{"ok":true}` (borrado lógico) | 401 |
| `PUT` | `/alertas/{id}` | Sí | `AlertRecord` (incluye métricas, ubicación, `emailStatus`, `postQuakeDone`) | **200** `{"ok":true}` | 401, 422 |
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
| `GET` | `/Sismo_admin/usuario/{id}` | — | **200** detalle de la persona (contactos, ficha descifrada, puntos, alertas, kit, encuestas, bitácora). La consulta queda en el log · 404 |
| `POST` | `/Sismo_admin/atender` | `{id_alerta, estado: en_atencion\|ayuda_enviada\|resuelta, nota}` | **200** `{"ok":true}` · 404 `alerta_no_encontrada` · 422 |
| `POST` | `/Sismo_admin/codigo` | `{id_usuario}` | **201** `{codigo, horas: 48}` · 404 `usuario_no_encontrado` |
| `GET` | `/Sismo_admin/sismos?dias=1\|7` | `dias` | **200** `{dias, sismos[]}` (USGS, caché de 5 min) · 502 `usgs_no_disponible` |
| `GET` | `/Sismo_admin/catalogos` | — | **200** catálogos, guía y parámetros (incluye los ocultos) + íconos disponibles |
| `POST` | `/Sismo_admin/catalogo_guardar` | `{id?, tipo, clave, nombre_es, nombre_en, icono, orden, activo}` | **200** · 422 `{campo}` |
| `POST` | `/Sismo_admin/guia_guardar` | `{id?, clave, momento, titulo_es, titulo_en, pasos_es, pasos_en, icono, orden, activo}` | **200** · 422 `{campo}` |
| `POST` | `/Sismo_admin/parametro_guardar` | `{clave, valor, activo}` | **200** · 422 `{campo}` (valida números y listas) |

## 4. Página informativa (`Sismo_info`)

| Método | Ruta | Respuesta |
|---|---|---|
| `GET` | `/Sismo_info` | Página HTML pública; «Ir al panel» solo para operadores autorizados |

## 5. Servicio de correo de alertas

La app envía la solicitud al servicio de correo; no guarda credenciales.

| Método | URL | Cuerpo | Respuesta |
|---|---|---|---|
| `POST` | `VITE_ALERT_EMAIL_URL` | `{alertId, eventType, activatedAt, language, sender:{name}, recipients:[{name,email}], subject, body, location}` (ver el [diccionario de datos](22-DICCIONARIO_DE_DATOS.md#4-contrato-del-correo-de-alerta)) | **2xx** = aceptado. Ante error de red o 5xx, la app reintenta 2 veces (1 s y 2 s) con un tiempo límite de 10 s |

El servicio valida los correos, aplica límites de envío y entrega por medio del proveedor de correo.

## 6. Servicios externos consumidos

| Servicio | Uso | Quién lo llama |
|---|---|---|
| USGS (`earthquake.usgs.gov`) | Sismos M2,5+ de 24 h y 7 días | App y backend (panel) |
| OpenStreetMap (`tile.openstreetmap.org`) | Mapas | App y panel |
| `routing.openstreetmap.de` | Rutas al punto de encuentro | App |
| ArcGIS / Photon | Buscar una dirección | App |
| Waze / Google Maps | Enlaces de navegación | App (abre la app externa) |
