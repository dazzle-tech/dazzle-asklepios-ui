import { intervalToDuration } from 'date-fns';

export type ToothSide = {
  label: 'Right' | 'Left';
  teeth: string[];
};

export type ToothJaw = {
  label: 'Upper jaw' | 'Lower jaw';
  sides: ToothSide[];
};

const ADULT_JAWS: ToothJaw[] = [
  {
    label: 'Upper jaw',
    sides: [
      { label: 'Right', teeth: ['18', '17', '16', '15', '14', '13', '12', '11'] },
      { label: 'Left', teeth: ['21', '22', '23', '24', '25', '26', '27', '28'] }
    ]
  },
  {
    label: 'Lower jaw',
    sides: [
      { label: 'Right', teeth: ['48', '47', '46', '45', '44', '43', '42', '41'] },
      { label: 'Left', teeth: ['31', '32', '33', '34', '35', '36', '37', '38'] }
    ]
  }
];

const CHILD_JAWS: ToothJaw[] = [
  {
    label: 'Upper jaw',
    sides: [
      { label: 'Right', teeth: ['55', '54', '53', '52', '51'] },
      { label: 'Left', teeth: ['61', '62', '63', '64', '65'] }
    ]
  },
  {
    label: 'Lower jaw',
    sides: [
      { label: 'Right', teeth: ['85', '84', '83', '82', '81'] },
      { label: 'Left', teeth: ['71', '72', '73', '74', '75'] }
    ]
  }
];

export const patientAgeYears = (patient: any): number | null => {
  const raw = patient?.dateOfBirth ?? patient?.dob ?? null;
  if (!raw) return null;
  const dob = new Date(raw);
  if (Number.isNaN(dob.getTime())) return null;
  const years = intervalToDuration({ start: dob, end: new Date() }).years;
  return typeof years === 'number' ? years : null;
};

/** Older than 12 uses permanent teeth. Age 12 and under uses primary teeth. */
export const isAdultDentition = (patient: any): boolean => {
  const age = patientAgeYears(patient);
  return age == null || age > 12;
};

export const toothJawsForPatient = (patient: any): ToothJaw[] =>
  isAdultDentition(patient) ? ADULT_JAWS : CHILD_JAWS;

export const toothCodesForPatient = (patient: any): Set<string> =>
  new Set(toothJawsForPatient(patient).flatMap(jaw => jaw.sides.flatMap(side => side.teeth)));

export const formatStoredToothNumber = (value: string): string =>
  value.startsWith('Tooth') ? value.replace(/^Tooth/, '') : value;
