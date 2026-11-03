// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonCheckbox, IonInput, useIonToast } from '@ionic/react';
import { AlertTriangle, Backpack, CalendarCheck, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useAppState } from '../context/appContext';
import { getLocale } from '../i18n';
import { useT } from '../i18n/useT';
import { createDefaultKit, daysUntil, kitStatus, REVIEW_EVERY_DAYS } from '../services/kitService';
import { newId } from '../services/storageService';
import type { EmergencyKit, KitItem } from '../types';

const MAX_NAME = 60;

/** Lista de la mochila de emergencia con fechas de vencimiento y recordatorio de revisión semestral (dentro de la app). */
export default function KitPage() {
  const [presentToast] = useIonToast();
  const t = useT().kit;
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
    presentToast({ message: t.reviewedToast, duration: 2200, color: 'success', position: 'top' });
  };

  const expiryLabel = (item: KitItem) => {
    if (!item.expiresOn) return null;
    const d = daysUntil(item.expiresOn);
    if (d < 0) return <span className="kit-expiry kit-expiry--bad">{t.expired}</span>;
    if (d <= 30) return <span className="kit-expiry kit-expiry--warn">{t.expiresIn(d)}</span>;
    return <span className="kit-expiry">{t.expiresOn(item.expiresOn)}</span>;
  };

  return (
    <AppLayout title={t.title} backTo="/inicio">
      <section className="stat-grid">
        <div className="card stat-tile"><span>{t.stats.ready}</span><strong>{status.checked}/{status.total}</strong></div>
        <div className="card stat-tile"><span>{t.stats.expired}</span><strong>{status.expired.length}</strong></div>
        <div className="card stat-tile"><span>{t.stats.expiringSoon}</span><strong>{status.expiringSoon.length}</strong></div>
      </section>

      {(status.expired.length > 0 || status.expiringSoon.length > 0) && (
        <p className="callout callout--warning callout--row small">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>{t.replace([...status.expired, ...status.expiringSoon].map((i) => i.name).join(', '))}</span>
        </p>
      )}

      <section className="card stack">
        <h2 className="card__title"><CalendarCheck size={18} aria-hidden="true" /> {t.reviewTitle}</h2>
        <p className="small muted">
          {kit.lastReviewedAt
            ? t.lastReview(new Date(kit.lastReviewedAt).toLocaleDateString(getLocale()))
            : t.noReview}
          {status.reviewDue ? t.reviewDue(REVIEW_EVERY_DAYS / 30) : ''}
        </p>
        <button className="btn btn--outline btn--block" onClick={markReviewed}>{t.markReviewed}</button>
      </section>

      <section className="card">
        <h2 className="card__title"><Backpack size={18} aria-hidden="true" /> {t.itemsTitle}</h2>
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
                  {t.expiryLabel}
                  <input
                    type="date"
                    value={item.expiresOn ?? ''}
                    onChange={(e) => patchItem(item.id, { expiresOn: e.target.value || undefined })}
                  />
                </label>
              </div>
              {!item.isDefault && (
                <button className="icon-btn icon-btn--danger" onClick={() => update(kit.items.filter((i) => i.id !== item.id))} aria-label={t.remove(item.name)}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="kit-add">
          <IonInput
            label={t.addItem}
            labelPlacement="stacked"
            fill="outline"
            maxlength={MAX_NAME}
            value={newItem}
            onIonInput={(e) => setNewItem(String(e.detail.value ?? '').slice(0, MAX_NAME))}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button className="btn btn--primary" onClick={add} disabled={newItem.trim().length < 2} aria-label={t.addItem}>
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      <p className="small muted center">{t.footnote}</p>
    </AppLayout>
  );
}
