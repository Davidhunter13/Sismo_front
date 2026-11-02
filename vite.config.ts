// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // @ionic/react incluye su librería completa de web components (~1,1 MB sin comprimir, ~330 kB gzip).
    chunkSizeWarningLimit: 1600,
  },
})
