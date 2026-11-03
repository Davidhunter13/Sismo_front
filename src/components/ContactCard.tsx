// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { Mail, Pencil, Phone, Trash2 } from 'lucide-react';
import { useT } from '../i18n/useT';
import type { Contact } from '../types';
import { DemoBadge } from './StatusBadge';

interface ContactCardProps {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const t = useT().contacts;
  const initials = contact.name.replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
  return (
    <li className="card contact-card">
      <span className="avatar" aria-hidden="true">{initials || '?'}</span>
      <div className="contact-card__body">
        <div className="contact-card__name">
          <strong>{contact.name}</strong>
          {contact.isSeed && <DemoBadge label={t.card.fictitious} />}
        </div>
        <small>{t.relationships[contact.relationship] ?? contact.relationship}</small>
        <span className="contact-card__phone"><Phone size={14} aria-hidden="true" /> {contact.phone}</span>
        {contact.email ? (
          <span className="contact-card__phone"><Mail size={14} aria-hidden="true" /> {contact.email}</span>
        ) : (
          !contact.isSeed && <small className="contact-card__warn">{t.card.missingEmail}</small>
        )}
      </div>
      <div className="contact-card__actions">
        <button className="icon-btn icon-btn--soft" onClick={onEdit} aria-label={t.card.edit(contact.name)}><Pencil size={18} /></button>
        <button className="icon-btn icon-btn--danger" onClick={onDelete} aria-label={t.card.remove(contact.name)}><Trash2 size={18} /></button>
      </div>
    </li>
  );
}
