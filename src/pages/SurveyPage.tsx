// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { useIonRouter, useIonToast } from '@ionic/react';
import { ClipboardCheck } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAppState } from '../context/appContext';
import { useT } from '../i18n/useT';
import { newId } from '../services/storageService';
import { SUS_ITEMS, SUS_SCALE, susGrade, susScore } from '../services/susService';

/** Cuestionario SUS de usabilidad (10 afirmaciones, escala 1–5). Se ofrece al terminar un simulacro. */
export default function SurveyPage() {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const { search } = useLocation();
  const { addSusResponse } = useAppState();
  const t = useT().survey;
  const drillAlertId = new URLSearchParams(search).get('alerta') ?? undefined;
  const [answers, setAnswers] = useState<(number | null)[]>(Array(SUS_ITEMS.length).fill(null));
  const [result, setResult] = useState<number | null>(null);

  const complete = answers.every((a) => a !== null);

  const submit = () => {
    if (!complete) return;
    const values = answers as number[];
    const score = susScore(values);
    addSusResponse({ id: newId(), answeredAt: new Date().toISOString(), answers: values, score, drillAlertId });
    setResult(score);
    presentToast({ message: t.thanks, duration: 2200, color: 'success', position: 'top' });
  };

  if (result !== null) {
    return (
      <AppLayout title={t.title} backTo="/inicio">
        <section className="card empty-state">
          <ClipboardCheck size={44} aria-hidden="true" />
          <h2>{t.score(result)}</h2>
          <p className="muted">{t.reference(susGrade(result))}</p>
          <button className="btn btn--primary" onClick={() => router.push('/estadisticas', 'forward', 'replace')}>{t.viewStats}</button>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t.title} backTo="/inicio">
      <p className="muted small">
        {drillAlertId ? t.drillThanks : ''}
        {t.intro}
      </p>
      {SUS_ITEMS.map((item, i) => (
        <fieldset key={item} className="card sus-item">
          <legend><strong>{i + 1}.</strong> {item}</legend>
          <div className="sus-scale" role="radiogroup" aria-label={t.item(i + 1)}>
            {SUS_SCALE.map((label, v) => {
              const value = v + 1;
              const id = `sus-${i}-${value}`;
              return (
                <label key={id} htmlFor={id} className={`sus-option${answers[i] === value ? ' sus-option--on' : ''}`}>
                  <input
                    id={id}
                    type="radio"
                    name={`sus-${i}`}
                    value={value}
                    checked={answers[i] === value}
                    onChange={() => setAnswers((a) => a.map((x, j) => (j === i ? value : x)))}
                    aria-label={`${value}: ${label}`}
                  />
                  <span>{value}</span>
                </label>
              );
            })}
          </div>
          <div className="sus-ends small muted"><span>{t.disagree}</span><span>{t.agree}</span></div>
        </fieldset>
      ))}
      <button className="btn btn--primary btn--lg btn--block" onClick={submit} disabled={!complete}>
        {t.submit(answers.filter((a) => a !== null).length, SUS_ITEMS.length)}
      </button>
    </AppLayout>
  );
}
