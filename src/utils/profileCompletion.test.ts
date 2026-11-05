// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it } from 'vitest';
import { createEmptyData } from '../services/storageService';
import type { AppData, Contact, KitItem } from '../types';
import { profileCompletion } from './profileCompletion';

const today = new Date(2026, 10, 5);
const contact = (extra: Partial<Contact> = {}): Contact => ({
  id: 'c1', name: 'Ana Demo', relationship: 'Hermana', phone: '3000000000', email: 'ana@example.com', isSeed: false, createdAt: '2026-11-01T10:00:00Z', ...extra,
});
const item = (extra: Partial<KitItem> = {}): KitItem => ({ id: 'agua', name: 'Agua', checked: true, isDefault: true, ...extra });
const medical = { bloodType: 'O+', allergies: '', medications: '', conditions: '', notes: '', showOnAlert: true };

function full(): AppData {
  const d = createEmptyData();
  return {
    ...d,
    settings: { ...d.settings, userName: 'Ana Demo' },
    contacts: [contact()],
    meetingPoints: [{ id: 'p1', label: 'Parque', latitude: 4.6, longitude: -74.1 }],
    medical,
    kit: { items: [item(), item({ id: 'pilas', name: 'Pilas', expiresOn: '2027-01-01' })] },
  };
}

describe('profileCompletion', () => {
  it('vacío = 0 % y le faltan los 7 puntos', () => {
    const empty = createEmptyData();
    const p = profileCompletion({ ...empty, settings: { ...empty.settings, userName: ' ' } }, false, today);
    expect(p.porcentaje).toBe(0);
    expect(p.missing).toEqual(['nombre', 'foto', 'contactos', 'correo', 'puntos', 'ficha', 'mochila']);
  });

  it('todo completo con foto = 100 %; sin foto = 86 % (6 de 7, como el servidor)', () => {
    expect(profileCompletion(full(), true, today).porcentaje).toBe(100);
    const sinFoto = profileCompletion(full(), false, today);
    expect(sinFoto.porcentaje).toBe(86);
    expect(sinFoto.missing).toEqual(['foto']);
  });

  it('contacto sin correo cuenta como contacto pero no como correo', () => {
    const p = profileCompletion({ ...full(), contacts: [contact({ email: '' })] }, true, today);
    expect(p.items.contactos).toBe(true);
    expect(p.items.correo).toBe(false);
  });

  it('los contactos de demostración no cuentan', () => {
    const p = profileCompletion({ ...full(), contacts: [contact({ isSeed: true })] }, true, today);
    expect(p.items.contactos).toBe(false);
  });

  it('mochila: necesita algún elemento, todo marcado y nada vencido', () => {
    expect(profileCompletion({ ...full(), kit: { items: [] } }, true, today).items.mochila).toBe(false);
    expect(profileCompletion({ ...full(), kit: { items: [item({ checked: false })] } }, true, today).items.mochila).toBe(false);
    expect(profileCompletion({ ...full(), kit: { items: [item({ expiresOn: '2026-11-04' })] } }, true, today).items.mochila).toBe(false);
    expect(profileCompletion({ ...full(), kit: { items: [item({ expiresOn: '2026-11-05' })] } }, true, today).items.mochila).toBe(true);
  });
});
