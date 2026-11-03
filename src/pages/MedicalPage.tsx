// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonInput, IonSelect, IonSelectOption, IonTextarea, IonToggle, useIonToast } from '@ionic/react';
import { HeartPulse, QrCode, ShieldAlert, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { MedicalQr } from '../components/MedicalQr';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import type { MedicalInfo } from '../types';

// «No sé» es el valor guardado; solo su texto visible se traduce.
const BLOOD_UNKNOWN = 'No sé';
const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', BLOOD_UNKNOWN];
const MAX_TEXT = 200;

// Compartir viene activado: en una emergencia es más útil que los rescatistas y contactos la vean. El usuario puede desactivarlo.
const empty: MedicalInfo = { bloodType: '', allergies: '', medications: '', conditions: '', notes: '', showOnAlert: true };

/** Ficha médica: se guarda en este dispositivo y, si «Compartir» está activo, se muestra en la alerta y va en el SMS. */
export default function MedicalPage() {
  const [presentToast] = useIonToast();
  const { data, setMedical } = useAppState();
  const { features: tf, medical: t } = useT();
  const [form, setForm] = useState<MedicalInfo>(data.medical ?? empty);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof MedicalInfo>(key: K, value: MedicalInfo[K]) => setForm((f) => ({ ...f, [key]: value }));
  const text = (v: unknown) => String(v ?? '').slice(0, MAX_TEXT);

  const hasData = [form.bloodType, form.allergies, form.medications, form.conditions, form.notes].some((v) => v.trim() !== '');

  const save = () => {
    const clean: MedicalInfo = {
      bloodType: form.bloodType,
      allergies: form.allergies.trim(),
      medications: form.medications.trim(),
      conditions: form.conditions.trim(),
      notes: form.notes.trim(),
      showOnAlert: form.showOnAlert,
    };
    setMedical(clean);
    presentToast({ message: t.saved, duration: 2200, color: 'success', position: 'top' });
  };

  return (
    <AppLayout title={t.title} backTo="/inicio">
      <section className="callout callout--warning callout--row small">
        <ShieldAlert size={18} aria-hidden="true" />
        <span>
          <strong>{t.sensitiveTitle}</strong>{t.sensitive}
        </span>
      </section>

      <section className="card stack">
        <h2 className="card__title"><HeartPulse size={18} aria-hidden="true" /> {t.formTitle}</h2>
        <IonSelect
          label={t.blood}
          labelPlacement="stacked"
          fill="outline"
          placeholder={t.unspecified}
          value={form.bloodType}
          onIonChange={(e) => set('bloodType', String(e.detail.value ?? ''))}
        >
          {BLOOD_TYPES.map((b) => <IonSelectOption key={b} value={b}>{b === BLOOD_UNKNOWN ? t.bloodUnknown : b}</IonSelectOption>)}
        </IonSelect>
        <IonInput label={t.allergies} labelPlacement="stacked" fill="outline" maxlength={MAX_TEXT} value={form.allergies}
          placeholder={t.allergiesPh} onIonInput={(e) => set('allergies', text(e.detail.value))} />
        <IonInput label={t.medications} labelPlacement="stacked" fill="outline" maxlength={MAX_TEXT} value={form.medications}
          placeholder={t.medicationsPh} onIonInput={(e) => set('medications', text(e.detail.value))} />
        <IonInput label={t.conditions} labelPlacement="stacked" fill="outline" maxlength={MAX_TEXT} value={form.conditions}
          placeholder={t.conditionsPh} onIonInput={(e) => set('conditions', text(e.detail.value))} />
        <IonTextarea label={t.notes} labelPlacement="stacked" fill="outline" maxlength={MAX_TEXT} autoGrow value={form.notes}
          placeholder={t.notesPh} onIonInput={(e) => set('notes', text(e.detail.value))} />
        <div className="toggle-row toggle-row--plain">
          <span><strong>{t.share}</strong><small>{t.shareHint}</small></span>
          <IonToggle checked={form.showOnAlert} onIonChange={(e) => set('showOnAlert', e.detail.checked)} aria-label={t.share} />
        </div>
        <button className="btn btn--primary btn--block" onClick={save} disabled={!hasData}>{t.save}</button>
      </section>

      {data.medical && (
        <section className="card stack">
          <h2 className="card__title"><QrCode size={18} aria-hidden="true" /> {tf.medicalQr.title}</h2>
          <MedicalQr userName={data.settings.userName} medical={data.medical} />
        </section>
      )}

      {data.medical && (
        <button className="btn btn--danger-outline btn--block" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={18} aria-hidden="true" /> {t.delete}
        </button>
      )}

      <ConfirmationDialog
        isOpen={confirmDelete}
        title={t.deleteTitle}
        message={t.deleteMessage}
        confirmText={t.deleteAction}
        destructive
        onConfirm={() => {
          setMedical(null);
          setForm(empty);
          presentToast({ message: t.deleted, duration: 2200, color: 'medium', position: 'top' });
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </AppLayout>
  );
}
