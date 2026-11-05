/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base del API de sincronización (CodeIgniter 3). Vacía = los datos se guardan solo en el teléfono. */
  readonly VITE_SISMO_API_URL?: string;
  /** 'true' habilita el modo de demostración en una compilación de producción (solo pruebas). */
  readonly VITE_DEMO?: string;
  /** versionCode de android/app/build.gradle (lo inyecta vite.config.ts). */
  readonly VITE_APP_VERSION_CODE?: string;
  /** versionName de android/app/build.gradle (lo inyecta vite.config.ts). */
  readonly VITE_APP_VERSION_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
