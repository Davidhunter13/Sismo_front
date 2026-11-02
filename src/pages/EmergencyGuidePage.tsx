// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
import { IonLabel, IonSegment, IonSegmentButton } from '@ionic/react';
import {
  Backpack, Building2, Car, ClipboardList, DoorOpen, HeartHandshake, Home, Landmark, MessageSquareText, ShieldAlert, Trees, Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { EmergencyInstructionCard } from '../components/EmergencyInstructionCard';
import { isSpeechSupported, speak, stopSpeaking } from '../services/speechService';

type Moment = 'antes' | 'durante' | 'despues';

const guide: Record<Moment, { intro: string; cards: { icon: LucideIcon; title: string; steps: string[] }[] }> = {
  antes: {
    intro: 'La preparación reduce el riesgo. Revise estos puntos con su familia o equipo de trabajo.',
    cards: [
      { icon: ClipboardList, title: 'Plan familiar de emergencia', steps: [
        'Acuerde un punto de encuentro seguro fuera de casa.',
        'Defina quién recoge a niños, personas mayores o con discapacidad.',
        'Tenga a mano los números de emergencia (línea 123).',
      ] },
      { icon: Backpack, title: 'Kit de emergencia', steps: [
        'Agua potable y alimentos no perecederos.',
        'Linterna, radio de pilas y pilas de repuesto.',
        'Botiquín básico, medicamentos de uso habitual y copias de documentos.',
      ] },
      { icon: Wrench, title: 'Vivienda y lugar de trabajo', steps: [
        'Asegure muebles altos, estanterías y objetos pesados.',
        'Identifique zonas seguras y rutas de evacuación.',
        'Sepa cómo cerrar las llaves de gas, agua y electricidad.',
        'Participe en los simulacros que organicen las autoridades.',
      ] },
    ],
  },
  durante: {
    intro: 'Conserve la calma. Protéjase primero y no intente salir mientras el suelo se mueve.',
    cards: [
      { icon: ShieldAlert, title: 'Agáchese, cúbrase y sujétese', steps: [
        'Agáchese y protéjase la cabeza y el cuello.',
        'Cúbrase bajo una mesa resistente si está cerca.',
        'Sujétese hasta que termine el movimiento.',
      ] },
      { icon: Building2, title: 'En interiores', steps: [
        'Aléjese de ventanas, vidrios y objetos que puedan caer.',
        'No use ascensores.',
        'No corra hacia las salidas durante el movimiento.',
      ] },
      { icon: Trees, title: 'Al aire libre', steps: [
        'Aléjese de edificios, postes, árboles y cables eléctricos.',
        'Permanezca en un espacio abierto hasta que termine el sismo.',
      ] },
      { icon: Car, title: 'En un vehículo', steps: [
        'Deténgase en un lugar seguro, lejos de puentes y estructuras.',
        'Permanezca dentro con el cinturón puesto hasta que pase el movimiento.',
      ] },
    ],
  },
  despues: {
    intro: 'Espere posibles réplicas y actúe con prudencia antes de moverse.',
    cards: [
      { icon: DoorOpen, title: 'Evacuación segura', steps: [
        'Salga con calma por las escaleras hacia el punto de encuentro.',
        'Use calzado cerrado y lleve su kit de emergencia.',
        'No regrese a edificaciones con daños visibles.',
      ] },
      { icon: Home, title: 'Revise su entorno', steps: [
        'Si percibe olor a gas, no encienda fuego ni interruptores y salga del lugar.',
        'Si es seguro hacerlo, cierre las llaves de gas, agua y electricidad.',
        'Reporte daños a las autoridades.',
      ] },
      { icon: HeartHandshake, title: 'Personas lesionadas', steps: [
        'Solicite ayuda a la línea 123 o al personal de socorro.',
        'No mueva a personas heridas salvo peligro inminente; espere a personal capacitado.',
      ] },
      { icon: MessageSquareText, title: 'Comunicación', steps: [
        'Prefiera mensajes de texto a las llamadas para no congestionar la red.',
        'Infórmese solo por canales oficiales y no difunda rumores.',
      ] },
    ],
  },
};

const labels: Record<Moment, string> = { antes: 'Antes', durante: 'Durante', despues: 'Después' };

export default function EmergencyGuidePage() {
  const [moment, setMoment] = useState<Moment>('durante');
  const [speaking, setSpeaking] = useState<string | null>(null);
  const section = guide[moment];

  // Al salir de la página o cambiar de pestaña se detiene la lectura.
  useEffect(() => stopSpeaking, []);

  const listen = async (title: string, steps: string[]) => {
    if (speaking === title) {
      stopSpeaking();
      setSpeaking(null);
      return;
    }
    const text = `${title}. ${steps.map((s, i) => `Paso ${i + 1}: ${s}`).join(' ')}`;
    setSpeaking(title);
    const ok = await speak(text, () => setSpeaking((s) => (s === title ? null : s)));
    if (!ok) setSpeaking(null);
  };

  const changeMoment = (m: Moment) => {
    stopSpeaking();
    setSpeaking(null);
    setMoment(m);
  };

  return (
    <AppLayout title="Guía de emergencia" backTo="/inicio">
      <IonSegment value={moment} onIonChange={(e) => changeMoment(e.detail.value as Moment)} className="segment">
        {(Object.keys(labels) as Moment[]).map((m) => (
          <IonSegmentButton key={m} value={m}><IonLabel>{labels[m]}</IonLabel></IonSegmentButton>
        ))}
      </IonSegment>

      <p className="muted">{section.intro}</p>
      <div className="list">
        {section.cards.map((c) => (
          <EmergencyInstructionCard
            key={c.title}
            {...c}
            speaking={speaking === c.title}
            onListen={isSpeechSupported() ? () => void listen(c.title, c.steps) : undefined}
          />
        ))}
      </div>

      <div className="callout callout--info">
        <Landmark size={20} aria-hidden="true" />
        <p>
          Siga siempre las indicaciones de las autoridades competentes (organismos de gestión del riesgo, socorro y
          protección civil). SISMO <strong>no detecta ni predice sismos</strong>; esta guía es orientativa.
        </p>
      </div>
    </AppLayout>
  );
}
