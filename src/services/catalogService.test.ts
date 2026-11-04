// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { afterEach, describe, expect, it } from 'vitest';
import { getT, setEmergencyNumber } from '../i18n';
import { defaultCatalogs, labelOf, normalizePostQuake, parseCatalogs } from './catalogService';

afterEach(() => setEmergencyNumber('123'));

describe('defaultCatalogs', () => {
  it('trae los catálogos actuales de la app en español e inglés', () => {
    const d = defaultCatalogs();
    expect(d.eventTypes.map((e) => e.id)).toEqual(['sismo', 'emergencia_general', 'prueba']);
    expect(d.postQuakeSteps[0].id).toBe('paso_01');
    expect(d.postQuakeSteps.every((s) => s.label.es && s.label.en)).toBe(true);
    expect(d.guide.cards.filter((c) => c.moment === 'durante')).toHaveLength(4);
    expect(d.params.emergencyNumber).toBe('123');
  });
});

describe('parseCatalogs', () => {
  it('usa los valores por defecto para lo que falte o venga mal', () => {
    const c = parseCatalogs({ version: 'v2', eventTypes: [{ id: 'tsunami', label: { es: 'Tsunami' } }], params: { maxMeetingPoints: 999 } });
    expect(c?.eventTypes).toEqual([{ id: 'tsunami', label: { es: 'Tsunami', en: 'Tsunami' }, icon: undefined }]);
    expect(c?.relationships.length).toBeGreaterThan(0);
    expect(c?.params.maxMeetingPoints).toBe(5);
  });
  it('rechaza respuestas sin versión', () => {
    expect(parseCatalogs({ eventTypes: [] })).toBeNull();
  });
  it('etiqueta de un valor que ya no existe: se muestra el valor guardado', () => {
    expect(labelOf(defaultCatalogs().relationships, 'Abuela', 'es')).toBe('Abuela');
  });
});

describe('normalizePostQuake', () => {
  it('convierte el avance antiguo por posición en claves de paso', () => {
    expect(normalizePostQuake([0, 2, 'paso_05', 'paso_05'])).toEqual(['paso_01', 'paso_03', 'paso_05']);
    expect(normalizePostQuake(null)).toEqual([]);
  });
});

describe('número de emergencia configurable', () => {
  it('reemplaza el marcador en los textos', () => {
    expect(getT('es').alert.call123).toBe('Llamar al 123');
    setEmergencyNumber('112');
    expect(getT('es').alert.call123).toBe('Llamar al 112');
  });
});
