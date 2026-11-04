// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
// Guía de emergencia (antes, durante, después). Contenido de seguridad: la versión en inglés es una traducción fiel,
// sin agregar ni quitar recomendaciones. El orden de las tarjetas debe coincidir con los íconos de EmergencyGuidePage.

const es = {
  title: 'Guía de emergencia',
  moments: { antes: 'Antes', durante: 'Durante', despues: 'Después' },
  step: (n: number, text: string) => `Paso ${n}: ${text}`,
  sections: {
    antes: {
      intro: 'La preparación reduce el riesgo. Revise estos puntos con su familia o equipo de trabajo.',
      cards: [
        { title: 'Plan familiar de emergencia', steps: [
          'Acuerde un punto de encuentro seguro fuera de casa.',
          'Defina quién recoge a niños, personas mayores o con discapacidad.',
          'Tenga a mano los números de emergencia (línea {emergencyNumber}).',
        ] },
        { title: 'Kit de emergencia', steps: [
          'Agua potable y alimentos no perecederos.',
          'Linterna, radio de pilas y pilas de repuesto.',
          'Botiquín básico, medicamentos de uso habitual y copias de documentos.',
        ] },
        { title: 'Vivienda y lugar de trabajo', steps: [
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
        { title: 'Agáchese, cúbrase y sujétese', steps: [
          'Agáchese y protéjase la cabeza y el cuello.',
          'Cúbrase bajo una mesa resistente si está cerca.',
          'Sujétese hasta que termine el movimiento.',
        ] },
        { title: 'En interiores', steps: [
          'Aléjese de ventanas, vidrios y objetos que puedan caer.',
          'No use ascensores.',
          'No corra hacia las salidas durante el movimiento.',
        ] },
        { title: 'Al aire libre', steps: [
          'Aléjese de edificios, postes, árboles y cables eléctricos.',
          'Permanezca en un espacio abierto hasta que termine el sismo.',
        ] },
        { title: 'En un vehículo', steps: [
          'Deténgase en un lugar seguro, lejos de puentes y estructuras.',
          'Permanezca dentro con el cinturón puesto hasta que pase el movimiento.',
        ] },
      ],
    },
    despues: {
      intro: 'Espere posibles réplicas y actúe con prudencia antes de moverse.',
      cards: [
        { title: 'Evacuación segura', steps: [
          'Salga con calma por las escaleras hacia el punto de encuentro.',
          'Use calzado cerrado y lleve su kit de emergencia.',
          'No regrese a edificaciones con daños visibles.',
        ] },
        { title: 'Revise su entorno', steps: [
          'Si percibe olor a gas, no encienda fuego ni interruptores y salga del lugar.',
          'Si es seguro hacerlo, cierre las llaves de gas, agua y electricidad.',
          'Reporte daños a las autoridades.',
        ] },
        { title: 'Personas lesionadas', steps: [
          'Solicite ayuda a la línea {emergencyNumber} o al personal de socorro.',
          'No mueva a personas heridas salvo peligro inminente; espere a personal capacitado.',
        ] },
        { title: 'Comunicación', steps: [
          'Prefiera mensajes de texto a las llamadas para no congestionar la red.',
          'Infórmese solo por canales oficiales y no difunda rumores.',
        ] },
      ],
    },
  },
  disclaimerPre:
    'Siga siempre las indicaciones de las autoridades competentes (organismos de gestión del riesgo, socorro y protección civil). SISMO ',
  disclaimerStrong: 'no detecta ni predice sismos',
  disclaimerPost: '; esta guía es orientativa.',
};

const en: typeof es = {
  title: 'Emergency guide',
  moments: { antes: 'Before', durante: 'During', despues: 'After' },
  step: (n: number, text: string) => `Step ${n}: ${text}`,
  sections: {
    antes: {
      intro: 'Preparedness reduces risk. Go over these points with your family or work team.',
      cards: [
        { title: 'Family emergency plan', steps: [
          'Agree on a safe meeting point outside the home.',
          'Decide who will pick up children, older adults or people with disabilities.',
          'Keep emergency numbers at hand (dial {emergencyNumber}).',
        ] },
        { title: 'Emergency kit', steps: [
          'Drinking water and non-perishable food.',
          'Flashlight, battery-powered radio and spare batteries.',
          'Basic first aid kit, regular medications and copies of documents.',
        ] },
        { title: 'Home and workplace', steps: [
          'Secure tall furniture, shelves and heavy objects.',
          'Identify safe areas and evacuation routes.',
          'Know how to shut off the gas, water and electricity.',
          'Take part in the drills organized by the authorities.',
        ] },
      ],
    },
    durante: {
      intro: 'Stay calm. Protect yourself first and do not try to go outside while the ground is shaking.',
      cards: [
        { title: 'Drop, cover and hold on', steps: [
          'Drop down and protect your head and neck.',
          'Take cover under a sturdy table if one is nearby.',
          'Hold on until the shaking stops.',
        ] },
        { title: 'Indoors', steps: [
          'Stay away from windows, glass and objects that could fall.',
          'Do not use elevators.',
          'Do not run toward the exits while the shaking lasts.',
        ] },
        { title: 'Outdoors', steps: [
          'Move away from buildings, poles, trees and power lines.',
          'Stay in an open area until the earthquake ends.',
        ] },
        { title: 'In a vehicle', steps: [
          'Stop in a safe place, away from bridges and structures.',
          'Stay inside with your seat belt fastened until the shaking stops.',
        ] },
      ],
    },
    despues: {
      intro: 'Expect possible aftershocks and act carefully before moving.',
      cards: [
        { title: 'Safe evacuation', steps: [
          'Calmly take the stairs to the meeting point.',
          'Wear closed-toe shoes and bring your emergency kit.',
          'Do not go back into buildings with visible damage.',
        ] },
        { title: 'Check your surroundings', steps: [
          'If you smell gas, do not light any flame or use switches, and leave the area.',
          'If it is safe to do so, shut off the gas, water and electricity.',
          'Report damage to the authorities.',
        ] },
        { title: 'Injured people', steps: [
          'Call for help by dialing {emergencyNumber} or ask rescue personnel.',
          'Do not move injured people unless they are in imminent danger; wait for trained personnel.',
        ] },
        { title: 'Communication', steps: [
          'Use text messages rather than calls so as not to overload the network.',
          'Get information only from official channels and do not spread rumors.',
        ] },
      ],
    },
  },
  disclaimerPre:
    'Always follow the instructions of the competent authorities (risk management, rescue and civil protection agencies). SISMO ',
  disclaimerStrong: 'does not detect or predict earthquakes',
  disclaimerPost: '; this guide is for guidance only.',
};

export default { es, en };
