// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useT } from '../i18n/useT';
import { recordAction } from '../services/badgeService';
import { medicalQrDataUrl, medicalQrText } from '../services/medicalQrService';
import type { MedicalInfo } from '../types';

interface Props {
  userName: string;
  medical: MedicalInfo;
  /** Mostrar el QR desde el inicio (pantalla de alerta) o con un botón (ficha médica). */
  initiallyOpen?: boolean;
}

/** QR con la ficha médica en texto plano: legible sin internet con cualquier lector de QR. */
export function MedicalQr({ userName, medical, initiallyOpen = false }: Props) {
  const t = useT().features.medicalQr;
  const [open, setOpen] = useState(initiallyOpen);
  const [src, setSrc] = useState<string | null>(null);
  const text = medicalQrText(userName, medical);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    medicalQrDataUrl(text)
      .then((url) => !cancelled && setSrc(url))
      .catch(() => !cancelled && setSrc(null));
    return () => {
      cancelled = true;
    };
  }, [open, text]);

  if (!medical.showOnAlert) return <p className="small muted">{t.disabled}</p>;

  return (
    <div className="medical-qr">
      {!initiallyOpen && (
        <button
          className="btn btn--outline btn--block"
          onClick={() => {
            if (!open) recordAction('qr_medico');
            setOpen((o) => !o);
          }}
          aria-expanded={open}
        >
          <QrCode size={18} aria-hidden="true" /> {open ? t.hide : t.show}
        </button>
      )}
      {open && (
        <figure className="medical-qr__figure">
          {src ? <img src={src} alt={t.alt} width={220} height={220} /> : <div className="medical-qr__placeholder" />}
          <figcaption className="small muted">{t.hint}</figcaption>
        </figure>
      )}
    </div>
  );
}
