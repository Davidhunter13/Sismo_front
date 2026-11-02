// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonInput, IonSelect, IonSelectOption, IonTextarea, IonToggle, useIonToast } from '@ionic/react';
import { HeartPulse, ShieldAlert, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useAppState } from '../context/appContext';
import type { MedicalInfo } from '../types';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'No sé'];
const MAX_TEXT = 200;

// Compartir viene activado: en una emergencia es más útil que los rescatistas y contactos la vean. El usuario puede desactivarlo.
const empty: MedicalInfo = { bloodType: '', allergies: '', medications: '', conditions: '', notes: '', showOnAlert: true };

/** Ficha médica: se guarda en este dispositivo y, si «Compartir» está activo, se muestra en la alerta y va en el SMS. */
export default function MedicalPage() {
  const [presentToast] = useIonToast();
  const { data, setMedical } = useAppState();
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
    presentToast({ message: 'Ficha médica guardada en este dispositivo.', duration: 2200, color: 'success', position: 'top' });
  };

  return (
    <AppLayout title="Ficha médica" backTo="/inicio">
      <section className="callout callout--warning callout--row small">
        <ShieldAlert size={18} aria-hidden="true" />
        <span>
          <strong>Datos sensibles.</strong> Se guardan en este teléfono y puede borrarlos cuando quiera. Con «Compartir en la
          alerta y en el SMS» activado (opción predeterminada), se muestran en la pantalla de alerta y se incluyen en el SMS
          que envía a sus contactos. Desactívelo si no desea compartirlos.
        </span>
      </section>

      <section className="card stack">
        <h2 className="card__title"><HeartPulse size={18} aria-hidden="true" /> Información para rescatistas</h2>
        <IonSelect
          label="Tipo de sangre"
          labelPlacement="stacked"
          fill="outline"
          placeholder="Sin especificar"
          value={form.bloodType}
          onIonChange={(e) => set('bloodType', String(e.detail.value ?? ''))}
        >
          {BLOOD_TYPES.map((t) => <IonSelectOption key={t} value={t}>{t}</IonSelectOption>)}
        </IonSelect>
        <IonInput label="Alergias" labelPlacement="stacked" fill="outline" maxlength={MAX_TEXT} value={form.allergies}
          placeholder="Ej.: penicilina" onIonInput={(e) => set('allergies', text(e.detail.value))} />
        <IonInput label="Medicamentos" labelPlacement="stacked" fill="outline" maxlength={MAX_TEXT} value={form.medications}
          placeholder="Ej.: insulina" onIonInput={(e) => set('medications', text(e.detail.value))} />
        <IonInput label="Condiciones médicas" labelPlacement="stacked" fill="outline" maxlength={MAX_TEXT} value={form.conditions}
          placeholder="Ej.: asma, marcapasos" onIonInput={(e) => set('conditions', text(e.detail.value))} />
        <IonTextarea label="Notas" labelPlacement="stacked" fill="outline" maxlength={MAX_TEXT} autoGrow value={form.notes}
          placeholder="Información adicional útil en una emergencia" onIonInput={(e) => set('notes', text(e.detail.value))} />
        <div className="toggle-row toggle-row--plain">
          <span><strong>Compartir en la alerta y en el SMS</strong><small>Visible en la pantalla de alerta e incluida en el SMS a sus contactos.</small></span>
          <IonToggle checked={form.showOnAlert} onIonChange={(e) => set('showOnAlert', e.detail.checked)} aria-label="Compartir en la alerta y en el SMS" />
        </div>
        <button className="btn btn--primary btn--block" onClick={save} disabled={!hasData}>Guardar ficha</button>
      </section>

      {data.medical && (
        <button className="btn btn--danger-outline btn--block" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={18} aria-hidden="true" /> Borrar ficha médica
        </button>
      )}

      <ConfirmationDialog
        isOpen={confirmDelete}
        title="¿Borrar la ficha médica?"
        message="Se eliminará la información médica guardada en este dispositivo."
        confirmText="Borrar"
        destructive
        onConfirm={() => {
          setMedical(null);
          setForm(empty);
          presentToast({ message: 'Ficha médica borrada.', duration: 2200, color: 'medium', position: 'top' });
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </AppLayout>
  );
}
