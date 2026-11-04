/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del servidor que envía el correo de alerta (POST JSON). Vacía = aún no hay servidor. */
  readonly VITE_ALERT_EMAIL_URL?: string;
  /** URL base del API de sincronización (CodeIgniter 3). Vacía = los datos se guardan solo en el teléfono. */
  readonly VITE_SISMO_API_URL?: string;
  /** 'true' habilita el modo de demostración en una compilación de producción (solo pruebas). */
  readonly VITE_DEMO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
