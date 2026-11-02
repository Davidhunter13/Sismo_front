// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonCheckbox, IonInput, useIonToast } from '@ionic/react';
import { AlertTriangle, Backpack, CalendarCheck, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useAppState } from '../context/appContext';
import { createDefaultKit, daysUntil, kitStatus, REVIEW_EVERY_DAYS } from '../services/kitService';
import { newId } from '../services/storageService';
import type { EmergencyKit, KitItem } from '../types';

const MAX_NAME = 60;

/** Lista de la mochila de emergencia con fechas de vencimiento y recordatorio de revisión semestral (dentro de la app). */
export default function KitPage() {
  const [presentToast] = useIonToast();
  const { data, setKit } = useAppState();
  const [newItem, setNewItem] = useState('');

  // La primera vez se crea la lista base.
  useEffect(() => {
    if (!data.kit) setKit(createDefaultKit());
  }, [data.kit, setKit]);

  const kit: EmergencyKit = data.kit ?? { items: [] };
  const status = kitStatus(kit);
  const update = (items: KitItem[], patch: Partial<EmergencyKit> = {}) => setKit({ ...kit, ...patch, items });
  const patchItem = (id: string, patch: Partial<KitItem>) => update(kit.items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const add = () => {
    const name = newItem.trim();
    if (name.length < 2) return;
    update([...kit.items, { id: newId(), name, checked: false, isDefault: false }]);
    setNewItem('');
  };

  const markReviewed = () => {
    update(kit.items, { lastReviewedAt: new Date().toISOString() });
    presentToast({ message: 'Revisión registrada. Le recordaremos en 6 meses.', duration: 2200, color: 'success', position: 'top' });
  };

  const expiryLabel = (item: KitItem) => {
    if (!item.expiresOn) return null;
    const d = daysUntil(item.expiresOn);
    if (d < 0) return <span className="kit-expiry kit-expiry--bad">Vencido</span>;
    if (d <= 30) return <span className="kit-expiry kit-expiry--warn">Vence en {d} día(s)</span>;
    return <span className="kit-expiry">Vence: {item.expiresOn}</span>;
  };

  return (
    <AppLayout title="Mochila de emergencia" backTo="/inicio">
      <section className="stat-grid">
        <div className="card stat-tile"><span>Listos</span><strong>{status.checked}/{status.total}</strong></div>
        <div className="card stat-tile"><span>Vencidos</span><strong>{status.expired.length}</strong></div>
        <div className="card stat-tile"><span>Por vencer</span><strong>{status.expiringSoon.length}</strong></div>
      </section>

      {(status.expired.length > 0 || status.expiringSoon.length > 0) && (
        <p className="callout callout--warning callout--row small">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>Revise y reemplace: {[...status.expired, ...status.expiringSoon].map((i) => i.name).join(', ')}.</span>
        </p>
      )}

      <section className="card stack">
        <h2 className="card__title"><CalendarCheck size={18} aria-hidden="true" /> Revisión periódica</h2>
        <p className="small muted">
          {kit.lastReviewedAt
            ? `Última revisión: ${new Date(kit.lastReviewedAt).toLocaleDateString('es-CO')}.`
            : 'Aún no ha registrado una revisión.'}
          {status.reviewDue ? ` Se recomienda revisarla cada ${REVIEW_EVERY_DAYS / 30} meses: es momento de hacerlo.` : ''}
        </p>
        <button className="btn btn--outline btn--block" onClick={markReviewed}>Marcar revisada hoy</button>
      </section>

      <section className="card">
        <h2 className="card__title"><Backpack size={18} aria-hidden="true" /> Elementos</h2>
        <ul className="kit-list">
          {kit.items.map((item) => (
            <li key={item.id} className="kit-item">
              <IonCheckbox
                checked={item.checked}
                onIonChange={(e) => patchItem(item.id, { checked: e.detail.checked })}
                aria-label={item.name}
              />
              <div className="kit-item__body">
                <span className={item.checked ? 'kit-item__name kit-item__name--done' : 'kit-item__name'}>{item.name}</span>
                {expiryLabel(item)}
                <label className="kit-date small muted">
                  Vencimiento
                  <input
                    type="date"
                    value={item.expiresOn ?? ''}
                    onChange={(e) => patchItem(item.id, { expiresOn: e.target.value || undefined })}
                  />
                </label>
              </div>
              {!item.isDefault && (
                <button className="icon-btn icon-btn--danger" onClick={() => update(kit.items.filter((i) => i.id !== item.id))} aria-label={`Quitar ${item.name}`}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="kit-add">
          <IonInput
            label="Agregar elemento"
            labelPlacement="stacked"
            fill="outline"
            maxlength={MAX_NAME}
            value={newItem}
            onIonInput={(e) => setNewItem(String(e.detail.value ?? '').slice(0, MAX_NAME))}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button className="btn btn--primary" onClick={add} disabled={newItem.trim().length < 2} aria-label="Agregar elemento">
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      <p className="small muted center">Lista orientativa. Valídela con las recomendaciones oficiales de gestión del riesgo (UNGRD).</p>
    </AppLayout>
  );
}
