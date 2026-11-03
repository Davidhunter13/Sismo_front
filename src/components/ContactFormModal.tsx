// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonInput, IonModal, IonSelect, IonSelectOption } from '@ionic/react';
import { Save, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useT } from '../i18n/useT';
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

const empty: ContactInput = { name: '', relationship: '', phone: '', email: '' };

export function ContactFormModal({ isOpen, contact, initial, onSave, onClose }: ContactFormModalProps) {
  const tc = useT().contacts;
  const t = tc.form;
  const [form, setForm] = useState<ContactInput>(empty);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(contact ? { name: contact.name, relationship: contact.relationship, phone: contact.phone, email: contact.email ?? '' } : initial ?? empty);
      setTouched(false);
    }
  }, [isOpen, contact, initial]);

  const errors = validateContact(form);
  const fieldClass = (field: keyof ContactInput) => (touched && errors[field] ? 'ion-invalid ion-touched' : '');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) return;
    onSave({ name: form.name.trim(), relationship: form.relationship, phone: form.phone.trim(), email: form.email.trim() });
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="sheet-modal" initialBreakpoint={1} breakpoints={[0, 1]}>
      <form className="sheet" onSubmit={submit} noValidate>
        <div className="sheet__head">
          <h2>{contact ? t.editTitle : t.newTitle}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t.close}><X size={22} /></button>
        </div>
        <p className="muted small">{t.note}</p>

        <IonInput
          className={fieldClass('name')}
          label={t.name}
          labelPlacement="stacked"
          fill="outline"
          placeholder={t.namePlaceholder}
          value={form.name}
          maxlength={50}
          errorText={errors.name}
          onIonInput={(e) => setForm((f) => ({ ...f, name: String(e.detail.value ?? '') }))}
        />
        <IonSelect
          className={fieldClass('relationship')}
          label={t.relationship}
          labelPlacement="stacked"
          fill="outline"
          interface="popover"
          placeholder={t.relationshipPlaceholder}
          value={form.relationship || undefined}
          errorText={errors.relationship}
          onIonChange={(e) => setForm((f) => ({ ...f, relationship: String(e.detail.value ?? '') }))}
        >
          {RELATIONSHIPS.map((r) => <IonSelectOption key={r} value={r}>{tc.relationships[r] ?? r}</IonSelectOption>)}
        </IonSelect>
        <IonInput
          className={fieldClass('phone')}
          label={t.phone}
          labelPlacement="stacked"
          fill="outline"
          type="tel"
          inputmode="tel"
          placeholder={t.phonePlaceholder}
          value={form.phone}
          maxlength={20}
          errorText={errors.phone}
          helperText={t.phoneHelper}
          onIonInput={(e) => setForm((f) => ({ ...f, phone: String(e.detail.value ?? '') }))}
        />
        <IonInput
          className={fieldClass('email')}
          label={t.email}
          labelPlacement="stacked"
          fill="outline"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder={t.emailPlaceholder}
          value={form.email}
          maxlength={120}
          errorText={errors.email}
          helperText={t.emailHelper}
          onIonInput={(e) => setForm((f) => ({ ...f, email: String(e.detail.value ?? '') }))}
        />
        {touched && Object.keys(errors).length > 0 && (
          <p className="form-error" role="alert">{t.reviewFields}</p>
        )}
        <button type="submit" className="btn btn--primary btn--block">
          <Save size={18} aria-hidden="true" /> {contact ? t.saveChanges : t.addContact}
        </button>
      </form>
    </IonModal>
  );
}
