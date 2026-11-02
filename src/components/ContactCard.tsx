// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Pencil, Phone, Trash2 } from 'lucide-react';
import type { Contact } from '../types';
import { DemoBadge } from './StatusBadge';

interface ContactCardProps {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const initials = contact.name.replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
  return (
    <li className="card contact-card">
      <span className="avatar" aria-hidden="true">{initials || '?'}</span>
      <div className="contact-card__body">
        <div className="contact-card__name">
          <strong>{contact.name}</strong>
          {contact.isSeed && <DemoBadge label="Ficticio" />}
        </div>
        <small>{contact.relationship}</small>
        <span className="contact-card__phone"><Phone size={14} aria-hidden="true" /> {contact.phone}</span>
      </div>
      <div className="contact-card__actions">
        <button className="icon-btn icon-btn--soft" onClick={onEdit} aria-label={`Editar ${contact.name}`}><Pencil size={18} /></button>
        <button className="icon-btn icon-btn--danger" onClick={onDelete} aria-label={`Eliminar ${contact.name}`}><Trash2 size={18} /></button>
      </div>
    </li>
  );
}
