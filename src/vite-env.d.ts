/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del servidor que envía el correo de alerta (POST JSON). Vacía = aún no hay servidor. */
  readonly VITE_ALERT_EMAIL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
