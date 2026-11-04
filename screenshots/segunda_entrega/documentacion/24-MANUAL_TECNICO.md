> **Nota de Transparencia:** Este documento fue generado con apoyo de Inteligencia Artificial Generativa (Claude Code) cumpliendo la Política ODTI012 del CCS.

# 24. Manual técnico — SISMO

Para quien instala, despliega, mantiene o extiende SISMO. Versión 1.0 · 4 de noviembre de 2026.

## 1. Arquitectura en una página

```
 App SISMO (React + Ionic + Capacitor) ──HTTPS JSON (Bearer)──▶ API Sismo ─┐
   │  localStorage (datos + cola sin conexión)                              ├─▶ Sismo_model ─▶ MySQL (sismo_*)
   ├──HTTPS POST──▶ Servicio de correo de alertas ─▶ proveedor de correo     │        └─▶ caché USGS (5 min)
   └──▶ USGS · OpenStreetMap · ruteo · geocodificación                       │
 Navegador del operador ──HTTPS (sesión + CSRF)──▶ Sismo_admin ─────────────┘
 Navegador del visitante ──HTTPS──▶ Sismo_info (pública)
```

Los diagramas detallados están en [`../diagramas/DIAGRAMAS.md`](../diagramas/DIAGRAMAS.md): arquitectura, componentes, despliegue, infraestructura y secuencias.

## 2. Tecnologías

| Capa | Tecnología |
|---|---|
| App | React 19, TypeScript, Vite 6, Ionic React 8, React Router 5, Lucide, Leaflet, `qrcode` |
| Móvil | Capacitor 8 (Android): geolocalización, widget SOS, acceso rápido, linterna, pantalla bloqueada |
| Pruebas | Vitest (unitarias), Playwright (e2e móvil y escritorio, capturas) |
| CI | GitHub Actions: lint, tipos, unitarias, e2e y APK de depuración |
| Backend | PHP 7.3, CodeIgniter 3, Apache con `mod_rewrite` |
| Base de datos | MySQL / MariaDB, InnoDB, `utf8mb4` |

## 3. Estructura del código

**App (repositorio `Sismo_front`)**

| Ruta | Contenido |
|---|---|
| `src/pages/` | 17 pantallas (Bienvenida, Registro, Inicio, Alerta, Ubicación, Contactos, Historial, Guía, Configuración, …) |
| `src/components/` | Componentes de interfaz (botón SOS, avisos, mapa, QR, cargadores, …) |
| `src/context/AppStateProvider.tsx` | Estado global, persistencia, sincronización y catálogos |
| `src/services/` | Lógica: `syncService` (cola y API), `catalogService`, `emailService`, `smsService`, `locationService`, señales, `quakeService`, `routeService`, … |
| `src/i18n/` | Textos en español e inglés |
| `src/types/index.ts` | Modelo de datos (`AppData`) |
| `tests/` | Pruebas e2e y de capturas |
| `android/` | Proyecto nativo de Capacitor |
| `screenshots/` | Evidencias por entrega y fecha (`primera_entrega/`, `segunda_entrega/`), con `segunda_entrega/diagramas/` y `segunda_entrega/documentacion/` |

**Backend (CodeIgniter 3)**

| Ruta | Contenido |
|---|---|
| `application/controllers/Sismo.php` | API REST de la app |
| `application/controllers/Sismo_admin.php` | Panel de monitoreo |
| `application/controllers/Sismo_info.php` | Página informativa pública |
| `application/models/Sismo_model.php` | Acceso a datos, cifrado, recuperación, catálogos, USGS |
| `application/views/sismo_admin/panel.php`, `info.php` | Vistas del panel y de la página pública |
| `application/config/sismo.php` | Operadores autorizados, horas del código temporal, URL de contacto |
| `assets/sismo/landing/` | Imágenes de la página informativa |
| `docs/superpowers/sql/2026-11-04-sismo-completo.sql` | Script único de base de datos |

## 4. Configuración

### App (archivos `.env*`, fuera de git salvo `.env.example`)

| Variable | Descripción |
|---|---|
| `VITE_SISMO_API_URL` | URL base de la API, sin barra final. Vacía = la app funciona solo en el teléfono |
| `VITE_ALERT_EMAIL_URL` | URL del servicio de correo de alertas |
| `VITE_DEMO` | `true` habilita el modo de demostración fuera de desarrollo (solo para pruebas) |

Vite lee `.env.development` en `npm run dev` y `.env.production` en `npm run build`.

### Backend (variables de entorno del servidor, nunca en el código)

| Variable | Descripción |
|---|---|
| `SISMO_LLAVE_CIFRADO` | Llave AES-256 en base64 (32 bytes). La genera y custodia el responsable de infraestructura; sin ella la ficha médica no se guarda (503) |
| `SISMO_CORS_ORIGENES` | Orígenes permitidos, separados por coma (opcional) |

Apache:

```apache
SetEnv SISMO_LLAVE_CIFRADO "<base64 de 32 bytes>"
SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1
```

`config/sismo.php`: `sismo_administradores` (correos con acceso al panel), `sismo_horas_codigo_panel` (48) y `sismo_contacto_url` (botón de demostración, solo `https://`).

## 5. Instalación en desarrollo

```bash
# App
npm ci
cp .env.example .env.development   # y completar VITE_SISMO_API_URL
npm run dev                        # http://localhost:5173
npm run android                    # compila, sincroniza y abre Android Studio
```

Backend: copiar los archivos de la tabla anterior al proyecto CodeIgniter 3, ejecutar el script SQL y definir las variables de entorno. Si la base de datos de desarrollo está en la nube y se accede por un túnel, el túnel debe estar activo. Si se congela, todas las peticiones quedan colgadas.

## 6. Pruebas y calidad

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run test:unit   # Vitest (116 pruebas)
npm run test:e2e    # Playwright, proyectos «movil» y «escritorio»
npm run screenshots # capturas de evidencias
```

Las pruebas e2e compilan la app con `VITE_DEMO=true` y sin servidor de sincronización: no dependen del backend. El detalle está en el [plan de pruebas](26-PLAN_Y_CASOS_DE_PRUEBA.md).

## 7. Despliegue

1. **Base de datos:** ejecutar `2026-11-04-sismo-completo.sql`. Es idempotente y se puede repetir.
2. **Backend:** desplegar los controladores, el modelo, las vistas, `config/sismo.php` y `assets/sismo/landing/`. Definir `SISMO_LLAVE_CIFRADO` y la regla `SetEnvIf Authorization`, y verificar que `application/cache/` sea escribible (caché del USGS).
3. **App web:** `npm run build` genera `dist/`, que se publica en cualquier servidor estático con HTTPS.
4. **App Android:** `npm run build && npx cap sync android` y compilar en Android Studio. El CI genera un APK de depuración en cada cambio.
5. **Verificación:** `GET /sismo/catalogos` responde 200; registrar un dispositivo de prueba; guardar una ficha médica (si responde 503, falta la llave); abrir el panel con un correo autorizado; abrir `/Sismo_info` sin sesión.

## 8. Operación y monitoreo

- **Logs:** el backend escribe una línea JSON por evento en la salida de errores (`stderr`), con `execution_id`, operación, código y duración. El `execution_id` también viaja en la cabecera `X-Execution-Id`.
- **Panel:** registra en el log cada consulta del detalle de una persona, cada atención y cada código generado.
- **Agregar un operador:** añadir su correo a `sismo_administradores` en `config/sismo.php`.
- **Contenido:** catálogos, guía y parámetros se editan desde el panel, sin desplegar código.

## 9. Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| La app dice «sin conexión» y no sube nada | `VITE_SISMO_API_URL` vacía o servidor inaccesible | Revisar la variable y recompilar |
| Error CORS en el navegador | Origen no permitido | Agregarlo a `SISMO_CORS_ORIGENES` |
| `401 token_invalido` en todo | Token revocado o cuenta eliminada | La app se registra de nuevo y sube todo sola |
| Ficha médica «sin llave de cifrado» / 503 | Falta `SISMO_LLAVE_CIFRADO` | Definirla en el servidor y reiniciar Apache |
| `Authorization` no llega a PHP | Apache no pasa la cabecera | Agregar `SetEnvIf Authorization …` |
| Sismos recientes vacíos | Sin sismos M2,5+ en el periodo o USGS caído (502) | Probar la pestaña de 7 días o reintentar |
| Correo «fallido» o «sin servidor» | Servicio de correo caído o `VITE_ALERT_EMAIL_URL` vacía | Revisar el servicio y la variable |
| Todas las peticiones quedan cargando (desarrollo) | Túnel a la base de datos congelado | Reiniciar el túnel |
