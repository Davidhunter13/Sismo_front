// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Versión de la app: una sola fuente, android/app/build.gradle (versionCode y versionName).
 * Se inyecta en el código (aviso de actualización) y se escribe en version.json dentro del build, que queda en
 * el APK como assets/public/version.json: el panel lo lee al subir el APK.
 */
function appVersion(): { codigo: number; nombre: string } {
  try {
    const gradle = readFileSync(new URL('./android/app/build.gradle', import.meta.url), 'utf8')
    const codigo = Number(/versionCode\s+(\d+)/.exec(gradle)?.[1] ?? 0)
    const nombre = /versionName\s+"([^"]+)"/.exec(gradle)?.[1] ?? ''
    return { codigo, nombre }
  } catch {
    return { codigo: 0, nombre: '' }
  }
}

const version = appVersion()

function versionJson(): Plugin {
  return {
    name: 'sismo-version-json',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(version) })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionJson()],
  define: {
    'import.meta.env.VITE_APP_VERSION_CODE': JSON.stringify(String(version.codigo)),
    'import.meta.env.VITE_APP_VERSION_NAME': JSON.stringify(version.nombre),
  },
  build: {
    // @ionic/react incluye su librería completa de web components (~1,1 MB sin comprimir, ~330 kB gzip).
    chunkSizeWarningLimit: 1600,
  },
})
