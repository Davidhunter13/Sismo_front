// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonToast } from '@ionic/react';
import { BookUser, Info, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { ContactCard } from '../components/ContactCard';
import { ContactFormModal } from '../components/ContactFormModal';
import { useAppState } from '../context/appContext';
import { isContactPickerSupported, pickContact } from '../services/contactPickerService';
import type { Contact, ContactInput } from '../types';

export default function ContactsPage() {
  const [presentToast] = useIonToast();
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
      setImported({ name: picked.name, relationship: '', phone: picked.phone });
      setFormOpen(true);
    } catch {
      toast('No se pudo abrir la agenda.', 'warning');
    }
  };

  const save = (input: ContactInput) => {
    if (editing) {
      updateContact(editing.id, input);
      toast('Contacto actualizado.');
    } else {
      addContact(input);
      toast('Contacto agregado.');
    }
    setFormOpen(false);
  };

  return (
    <AppLayout title="Contactos de confianza" backTo="/inicio">
      <div className="callout callout--info">
        <Info size={20} aria-hidden="true" />
        <p>
          Sus contactos <strong>no reciben alertas automáticamente</strong>: durante una alerta SISMO abre la app de mensajes con el
          aviso listo y usted confirma el envío. Los contactos del modo de demostración son ficticios y nunca reciben SMS.
        </p>
      </div>

      <div className="section-head">
        <h2 className="section-title">Mis contactos ({data.contacts.length})</h2>
        <div className="btn-pair">
          {isContactPickerSupported() && (
            <button className="btn btn--outline btn--sm" onClick={importContact}><BookUser size={16} aria-hidden="true" /> De la agenda</button>
          )}
          <button className="btn btn--primary btn--sm" onClick={openNew}><UserPlus size={16} aria-hidden="true" /> Agregar</button>
        </div>
      </div>

      {data.contacts.length === 0 ? (
        <section className="card empty-state">
          <Users size={44} aria-hidden="true" />
          <h2>Aún no hay contactos</h2>
          <p className="muted">Agregue personas de confianza para tenerlas a mano durante una emergencia.</p>
          <button className="btn btn--primary" onClick={openNew}><UserPlus size={18} aria-hidden="true" /> Agregar contacto</button>
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
        title="¿Eliminar contacto?"
        message={toDelete ? `Se eliminará a «${toDelete.name}» de su lista.` : ''}
        confirmText="Eliminar"
        destructive
        onConfirm={() => {
          if (toDelete) {
            deleteContact(toDelete.id);
            toast('Contacto eliminado.', 'medium');
          }
        }}
        onClose={() => setToDelete(null)}
      />
    </AppLayout>
  );
}
