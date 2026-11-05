// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { describe, expect, it } from 'vitest';
import type { Contact } from '../types';
import { emailRole, ensureEmailPrimary } from './contactEmail';

const c = (id: string, patch: Partial<Contact> = {}): Contact => ({
  id, name: id, relationship: 'Familiar', phone: '300', email: `${id}@example.com`, isSeed: false, createdAt: '', ...patch,
});

describe('ensureEmailPrimary', () => {
  it('sin ningún principal marca el primero con correo', () => {
    const r = ensureEmailPrimary([c('sin', { email: '' }), c('a'), c('b')]);
    expect(r.map((x) => !!x.emailPrimary)).toEqual([false, true, false]);
  });

  it('si ya hay principales no cambia nada (misma lista)', () => {
    const list = [c('a'), c('b', { emailPrimary: true })];
    expect(ensureEmailPrimary(list)).toBe(list);
  });

  it('permite varios principales', () => {
    const r = ensureEmailPrimary([c('a', { emailPrimary: true }), c('b', { emailPrimary: true }), c('d')]);
    expect(r.filter((x) => x.emailPrimary)).toHaveLength(2);
  });

  it('ignora contactos de demostración y sin correo', () => {
    const list = [c('demo', { isSeed: true }), c('x', { email: undefined })];
    expect(ensureEmailPrimary(list)).toBe(list);
  });
});

describe('emailRole', () => {
  it('principal, copia o ninguno', () => {
    expect(emailRole(c('a', { emailPrimary: true }))).toBe('principal');
    expect(emailRole(c('b'))).toBe('copia');
    expect(emailRole(c('d', { email: '' }))).toBeNull();
    expect(emailRole(c('e', { isSeed: true, emailPrimary: true }))).toBeNull();
  });
});
