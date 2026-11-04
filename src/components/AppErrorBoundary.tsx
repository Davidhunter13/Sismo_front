// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { getEmergencyNumber } from '../i18n';

/**
 * Si algo falla al dibujar la app, en lugar de una pantalla en blanco se muestra un aviso con «Recargar» y el
 * botón para llamar a emergencias (que no depende de React). Los datos guardados en el teléfono no se tocan.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[sismo] error al dibujar la app', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    const en = typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en');
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#0b2545', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'center' }}>
        <div style={{ maxWidth: 360 }}>
          <h1 style={{ fontSize: 22, margin: '0 0 8px' }}>{en ? 'Something went wrong' : 'Algo salió mal'}</h1>
          <p style={{ opacity: 0.85, margin: '0 0 20px' }}>{en ? 'Your data is safe on this phone. Reload to continue.' : 'Sus datos están a salvo en el teléfono. Recargue para continuar.'}</p>
          <button type="button" onClick={() => window.location.reload()} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: 0, background: '#fff', color: '#0b2545', fontWeight: 700, fontSize: 16, marginBottom: 12, cursor: 'pointer' }}>
            {en ? 'Reload' : 'Recargar'}
          </button>
          <a href={`tel:${getEmergencyNumber()}`} style={{ display: 'block', padding: '14px 16px', borderRadius: 14, background: '#d62828', color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
            {en ? 'Call emergency services' : 'Llamar a emergencias'}
          </a>
        </div>
      </main>
    );
  }
}
