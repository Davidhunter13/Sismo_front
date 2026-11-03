// Nota de Transparencia: Código generado/refactorizado con asistencia de IA Generativa (Claude Code) bajo la Política ODTI012 del CCS. Requiere supervisión y validación humana permanente.
// Pantalla de Ficha médica.

const es = {
  title: 'Ficha médica',
  sensitiveTitle: 'Datos sensibles.',
  sensitive:
    ' Se guardan en este teléfono y puede borrarlos cuando quiera. Con «Compartir en la alerta y en el SMS» activado (opción predeterminada), se muestran en la pantalla de alerta y se incluyen en el SMS que envía a sus contactos. Desactívelo si no desea compartirlos.',
  formTitle: 'Información para rescatistas',
  blood: 'Tipo de sangre',
  /** Texto visible de la opción «No sé» (el valor guardado no cambia). */
  bloodUnknown: 'No sé',
  unspecified: 'Sin especificar',
  allergies: 'Alergias',
  allergiesPh: 'Ej.: penicilina',
  medications: 'Medicamentos',
  medicationsPh: 'Ej.: insulina',
  conditions: 'Condiciones médicas',
  conditionsPh: 'Ej.: asma, marcapasos',
  notes: 'Notas',
  notesPh: 'Información adicional útil en una emergencia',
  share: 'Compartir en la alerta y en el SMS',
  shareHint: 'Visible en la pantalla de alerta e incluida en el SMS a sus contactos.',
  save: 'Guardar ficha',
  saved: 'Ficha médica guardada en este dispositivo.',
  delete: 'Borrar ficha médica',
  deleteTitle: '¿Borrar la ficha médica?',
  deleteMessage: 'Se eliminará la información médica guardada en este dispositivo.',
  deleteAction: 'Borrar',
  deleted: 'Ficha médica borrada.',
};

const en: typeof es = {
  title: 'Medical record',
  sensitiveTitle: 'Sensitive data.',
  sensitive:
    ' It is stored on this phone and you can delete it whenever you want. With “Share in the alert and SMS” on (the default), it is shown on the alert screen and included in the SMS you send to your contacts. Turn it off if you do not want to share it.',
  formTitle: 'Information for rescuers',
  blood: 'Blood type',
  bloodUnknown: 'I don’t know',
  unspecified: 'Not specified',
  allergies: 'Allergies',
  allergiesPh: 'E.g.: penicillin',
  medications: 'Medications',
  medicationsPh: 'E.g.: insulin',
  conditions: 'Medical conditions',
  conditionsPh: 'E.g.: asthma, pacemaker',
  notes: 'Notes',
  notesPh: 'Additional information useful in an emergency',
  share: 'Share in the alert and SMS',
  shareHint: 'Shown on the alert screen and included in the SMS to your contacts.',
  save: 'Save record',
  saved: 'Medical record saved on this device.',
  delete: 'Delete medical record',
  deleteTitle: 'Delete the medical record?',
  deleteMessage: 'The medical information stored on this device will be deleted.',
  deleteAction: 'Delete',
  deleted: 'Medical record deleted.',
};

export default { es, en };
