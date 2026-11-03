// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonToast } from '@ionic/react';
import { BookUser, Info, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { ContactCard } from '../components/ContactCard';
import { ContactFormModal } from '../components/ContactFormModal';
import { useAppState } from '../context/appContext';
import { setupGaps } from '../utils/setupGaps';
import { useT } from '../i18n/useT';
import { isContactPickerSupported, pickContact } from '../services/contactPickerService';
import type { Contact, ContactInput } from '../types';

export default function ContactsPage() {
  const [presentToast] = useIonToast();
  const t = useT().contacts;
  const { data, addContact, updateContact, deleteContact } = useAppState();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [toDelete, setToDelete] = useState<Contact | null>(null);
  const [imported, setImported] = useState<ContactInput | null>(null);

  const toast = (message: string, color = 'success') => presentToast({ message, duration: 2200, color, position: 'top' });

  const openNew = () => {
    setEditing(null);
    setImported(null);
    setFormOpen(true);
  };

  // Importar de la agenda: precarga nombre y teléfono; la persona elige la relación y confirma.
  const importContact = async () => {
    try {
      const picked = await pickContact();
      if (!picked) return;
      setEditing(null);
      setImported({ name: picked.name, relationship: '', phone: picked.phone, email: '' });
      setFormOpen(true);
    } catch {
      toast(t.agendaError, 'warning');
    }
  };

  const save = (input: ContactInput) => {
    if (editing) {
      updateContact(editing.id, input);
      toast(t.updated);
    } else {
      addContact(input);
      toast(t.added);
    }
    setFormOpen(false);
  };

  return (
    <AppLayout title={t.title} backTo="/inicio">
      <div className="callout callout--info">
        <Info size={20} aria-hidden="true" />
        <p>
          {t.infoPre}<strong>{t.infoStrong}</strong>{t.infoPost}
        </p>
      </div>

      <div className="section-head">
        <h2 className="section-title">{t.myContacts(data.contacts.length)}</h2>
        <div className="btn-pair">
          {isContactPickerSupported() && (
            <button className="btn btn--outline btn--sm" onClick={importContact}><BookUser size={16} aria-hidden="true" /> {t.fromAgenda}</button>
          )}
          <button className="btn btn--primary btn--sm" onClick={openNew}><UserPlus size={16} aria-hidden="true" /> {t.add}</button>
        </div>
      </div>

      {data.contacts.length === 0 ? (
        <section className={`card empty-state${setupGaps(data).includes('contact') ? ' card--missing' : ''}`}>
          <Users size={44} aria-hidden="true" />
          <h2>{t.emptyTitle}</h2>
          <p className="muted">{t.emptyText}</p>
          <button className="btn btn--primary" onClick={openNew}><UserPlus size={18} aria-hidden="true" /> {t.addContact}</button>
        </section>
      ) : (
        <ul className="list">
          {data.contacts.map((c) => (
            <ContactCard
              key={c.id}
              contact={c}
              onEdit={() => {
                setEditing(c);
                setFormOpen(true);
              }}
              onDelete={() => setToDelete(c)}
            />
          ))}
        </ul>
      )}

      <ContactFormModal isOpen={formOpen} contact={editing} initial={imported} onSave={save} onClose={() => setFormOpen(false)} />

      <ConfirmationDialog
        isOpen={!!toDelete}
        title={t.deleteTitle}
        message={toDelete ? t.deleteMessage(toDelete.name) : ''}
        confirmText={t.deleteConfirm}
        destructive
        onConfirm={() => {
          if (toDelete) {
            deleteContact(toDelete.id);
            toast(t.deleted, 'medium');
          }
        }}
        onClose={() => setToDelete(null)}
      />
    </AppLayout>
  );
}
