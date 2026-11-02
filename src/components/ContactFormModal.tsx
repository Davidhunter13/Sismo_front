// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonInput, IonModal, IonSelect, IonSelectOption } from '@ionic/react';
import { Save, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import type { Contact, ContactInput } from '../types';
import { RELATIONSHIPS, validateContact } from '../utils/contactValidation';


interface ContactFormModalProps {
  isOpen: boolean;
  contact: Contact | null;
  /** Datos con los que se precarga un contacto nuevo (p. ej. importado de la agenda). */
  initial?: ContactInput | null;
  onSave: (input: ContactInput) => void;
  onClose: () => void;
}

const empty: ContactInput = { name: '', relationship: '', phone: '' };

export function ContactFormModal({ isOpen, contact, initial, onSave, onClose }: ContactFormModalProps) {
  const [form, setForm] = useState<ContactInput>(empty);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(contact ? { name: contact.name, relationship: contact.relationship, phone: contact.phone } : initial ?? empty);
      setTouched(false);
    }
  }, [isOpen, contact, initial]);

  const errors = validateContact(form);
  const fieldClass = (field: keyof ContactInput) => (touched && errors[field] ? 'ion-invalid ion-touched' : '');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) return;
    onSave({ name: form.name.trim(), relationship: form.relationship, phone: form.phone.trim() });
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="sheet-modal" initialBreakpoint={1} breakpoints={[0, 1]}>
      <form className="sheet" onSubmit={submit} noValidate>
        <div className="sheet__head">
          <h2>{contact ? 'Editar contacto' : 'Nuevo contacto'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={22} /></button>
        </div>
        <p className="muted small">Use datos ficticios en el prototipo. Este contacto no recibirá alertas automáticamente.</p>

        <IonInput
          className={fieldClass('name')}
          label="Nombre"
          labelPlacement="stacked"
          fill="outline"
          placeholder="Ej.: Ana (demo)"
          value={form.name}
          maxlength={50}
          errorText={errors.name}
          onIonInput={(e) => setForm((f) => ({ ...f, name: String(e.detail.value ?? '') }))}
        />
        <IonSelect
          className={fieldClass('relationship')}
          label="Relación"
          labelPlacement="stacked"
          fill="outline"
          interface="popover"
          placeholder="Seleccione"
          value={form.relationship || undefined}
          errorText={errors.relationship}
          onIonChange={(e) => setForm((f) => ({ ...f, relationship: String(e.detail.value ?? '') }))}
        >
          {RELATIONSHIPS.map((r) => <IonSelectOption key={r} value={r}>{r}</IonSelectOption>)}
        </IonSelect>
        <IonInput
          className={fieldClass('phone')}
          label="Teléfono"
          labelPlacement="stacked"
          fill="outline"
          type="tel"
          inputmode="tel"
          placeholder="Ej.: 300 000 0004"
          value={form.phone}
          maxlength={20}
          errorText={errors.phone}
          helperText="Entre 7 y 15 dígitos."
          onIonInput={(e) => setForm((f) => ({ ...f, phone: String(e.detail.value ?? '') }))}
        />
        {touched && Object.keys(errors).length > 0 && (
          <p className="form-error" role="alert">Revise los campos marcados.</p>
        )}
        <button type="submit" className="btn btn--primary btn--block">
          <Save size={18} aria-hidden="true" /> {contact ? 'Guardar cambios' : 'Agregar contacto'}
        </button>
      </form>
    </IonModal>
  );
}
