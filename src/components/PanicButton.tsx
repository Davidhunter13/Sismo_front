// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Siren } from 'lucide-react';
import { useT } from '../i18n/useT';

interface PanicButtonProps {
  onPress: () => void;
  active?: boolean;
}

export function PanicButton({ onPress, active = false }: PanicButtonProps) {
  const t = useT().components.panic;
  return (
    <div className={`panic${active ? ' panic--active' : ''}`}>
      <span className="panic__ring" aria-hidden="true" />
      <span className="panic__ring panic__ring--2" aria-hidden="true" />
      <button className="panic__button" onClick={onPress} aria-label={active ? t.viewActive : t.activate}>
        <Siren size={54} strokeWidth={2} aria-hidden="true" />
        <strong>{active ? t.active : t.sos}</strong>
        <small>{active ? t.tapToView : t.pressToActivate}</small>
      </button>
    </div>
  );
}
