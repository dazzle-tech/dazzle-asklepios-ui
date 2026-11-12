/**
 * Setup-only tooth numbering helpers.
 * Stable internal ids stay Tooth1–Tooth32 (permanent) and ToothA–ToothT (primary).
 * Display labels change with UNIVERSAL / FDI / PALMER without affecting selection values.
 */

export type ToothNumberingSystem = 'UNIVERSAL' | 'FDI' | 'PALMER';

export type DentalChartSetupType = 'ADULT' | 'CHILD' | 'MIXED';

export const PERMANENT_TOOTH_IDS: string[] = Array.from(
  { length: 32 },
  (_, i) => `Tooth${i + 1}`
);

export const PRIMARY_TOOTH_IDS: string[] = Array.from({ length: 20 }, (_, i) => {
  return `Tooth${String.fromCharCode('A'.charCodeAt(0) + i)}`;
});

export const MIXED_TOOTH_IDS: string[] = [
  ...PRIMARY_TOOTH_IDS,
  ...PERMANENT_TOOTH_IDS
];

export const NUMBERING_SYSTEM_OPTIONS = [
  { label: 'Universal', value: 'UNIVERSAL' },
  { label: 'FDI', value: 'FDI' },
  { label: 'Palmer', value: 'PALMER' }
];

const PERMANENT_UNIVERSAL: Record<string, string> = Object.fromEntries(
  PERMANENT_TOOTH_IDS.map((id, index) => [id, String(index + 1)])
);

const PRIMARY_UNIVERSAL: Record<string, string> = Object.fromEntries(
  PRIMARY_TOOTH_IDS.map((id, index) => [
    id,
    String.fromCharCode('A'.charCodeAt(0) + index)
  ])
);

/** Universal 1–32 → FDI two-digit codes. */
const PERMANENT_FDI: Record<string, string> = {
  Tooth1: '18',
  Tooth2: '17',
  Tooth3: '16',
  Tooth4: '15',
  Tooth5: '14',
  Tooth6: '13',
  Tooth7: '12',
  Tooth8: '11',
  Tooth9: '21',
  Tooth10: '22',
  Tooth11: '23',
  Tooth12: '24',
  Tooth13: '25',
  Tooth14: '26',
  Tooth15: '27',
  Tooth16: '28',
  Tooth17: '38',
  Tooth18: '37',
  Tooth19: '36',
  Tooth20: '35',
  Tooth21: '34',
  Tooth22: '33',
  Tooth23: '32',
  Tooth24: '31',
  Tooth25: '41',
  Tooth26: '42',
  Tooth27: '43',
  Tooth28: '44',
  Tooth29: '45',
  Tooth30: '46',
  Tooth31: '47',
  Tooth32: '48'
};

/** Universal A–T → FDI primary codes. */
const PRIMARY_FDI: Record<string, string> = {
  ToothA: '55',
  ToothB: '54',
  ToothC: '53',
  ToothD: '52',
  ToothE: '51',
  ToothF: '61',
  ToothG: '62',
  ToothH: '63',
  ToothI: '64',
  ToothJ: '65',
  ToothK: '75',
  ToothL: '74',
  ToothM: '73',
  ToothN: '72',
  ToothO: '71',
  ToothP: '81',
  ToothQ: '82',
  ToothR: '83',
  ToothS: '84',
  ToothT: '85'
};

/** Palmer notation with quadrant corners (permanent). */
const PERMANENT_PALMER: Record<string, string> = {
  Tooth1: '8┘',
  Tooth2: '7┘',
  Tooth3: '6┘',
  Tooth4: '5┘',
  Tooth5: '4┘',
  Tooth6: '3┘',
  Tooth7: '2┘',
  Tooth8: '1┘',
  Tooth9: '1└',
  Tooth10: '2└',
  Tooth11: '3└',
  Tooth12: '4└',
  Tooth13: '5└',
  Tooth14: '6└',
  Tooth15: '7└',
  Tooth16: '8└',
  Tooth17: '8┐',
  Tooth18: '7┐',
  Tooth19: '6┐',
  Tooth20: '5┐',
  Tooth21: '4┐',
  Tooth22: '3┐',
  Tooth23: '2┐',
  Tooth24: '1┐',
  Tooth25: '1┌',
  Tooth26: '2┌',
  Tooth27: '3┌',
  Tooth28: '4┌',
  Tooth29: '5┌',
  Tooth30: '6┌',
  Tooth31: '7┌',
  Tooth32: '8┌'
};

/** Palmer notation with quadrant corners (primary). */
const PRIMARY_PALMER: Record<string, string> = {
  ToothA: 'E┘',
  ToothB: 'D┘',
  ToothC: 'C┘',
  ToothD: 'B┘',
  ToothE: 'A┘',
  ToothF: 'A└',
  ToothG: 'B└',
  ToothH: 'C└',
  ToothI: 'D└',
  ToothJ: 'E└',
  ToothK: 'E┐',
  ToothL: 'D┐',
  ToothM: 'C┐',
  ToothN: 'B┐',
  ToothO: 'A┐',
  ToothP: 'A┌',
  ToothQ: 'B┌',
  ToothR: 'C┌',
  ToothS: 'D┌',
  ToothT: 'E┌'
};

export const isPrimaryToothId = (toothId: string): boolean =>
  /^Tooth[A-T]$/.test(toothId);

export const isPermanentToothId = (toothId: string): boolean =>
  /^Tooth([1-9]|[12]\d|3[0-2])$/.test(toothId);

export const defaultToothIdsForChartType = (
  chartType?: DentalChartSetupType | string | null
): string[] => {
  if (chartType === 'CHILD') return [...PRIMARY_TOOTH_IDS];
  // MIXED starts with primary only; permanents are added explicitly in the selector.
  if (chartType === 'MIXED') return [...PRIMARY_TOOTH_IDS];
  if (chartType === 'ADULT') return [...PERMANENT_TOOTH_IDS];
  return [];
};

export const toothIdsForChartType = (
  chartType?: DentalChartSetupType | string | null
): string[] => {
  if (chartType === 'CHILD') return PRIMARY_TOOTH_IDS;
  if (chartType === 'MIXED') return MIXED_TOOTH_IDS;
  if (chartType === 'ADULT') return PERMANENT_TOOTH_IDS;
  return [];
};

export const toothDisplayLabelForSystem = (
  toothId: string,
  numberingSystem: ToothNumberingSystem | string | null | undefined
): string => {
  const system = numberingSystem || 'UNIVERSAL';

  if (isPermanentToothId(toothId)) {
    if (system === 'FDI') return PERMANENT_FDI[toothId] || toothId;
    if (system === 'PALMER') return PERMANENT_PALMER[toothId] || toothId;
    return PERMANENT_UNIVERSAL[toothId] || toothId.replace('Tooth', '');
  }

  if (isPrimaryToothId(toothId)) {
    if (system === 'FDI') return PRIMARY_FDI[toothId] || toothId;
    if (system === 'PALMER') return PRIMARY_PALMER[toothId] || toothId;
    return PRIMARY_UNIVERSAL[toothId] || toothId.replace('Tooth', '');
  }

  return toothId;
};

export const toothPickerOptions = (
  chartType: DentalChartSetupType | string | null | undefined,
  numberingSystem: ToothNumberingSystem | string | null | undefined
): Array<{ label: string; value: string; group: string }> =>
  toothIdsForChartType(chartType).map(id => ({
    value: id,
    label: toothDisplayLabelForSystem(id, numberingSystem),
    group: isPrimaryToothId(id) ? 'Primary' : 'Permanent'
  }));

export const formatSelectedToothSummary = (
  toothIds: string[] | null | undefined,
  numberingSystem: ToothNumberingSystem | string | null | undefined
): string => {
  if (!toothIds?.length) return 'None selected';
  return toothIds
    .map(id => toothDisplayLabelForSystem(id, numberingSystem))
    .join(', ');
};

/** Permanent upper arch display order (right → left): Tooth1–Tooth16. */
export const PERMANENT_UPPER_IDS = PERMANENT_TOOTH_IDS.slice(0, 16);
/** Permanent lower arch display order (right → left visually): Tooth32→Tooth17. */
export const PERMANENT_LOWER_IDS = [...PERMANENT_TOOTH_IDS.slice(16)].reverse();
/** Primary upper arch: ToothA–ToothJ. */
export const PRIMARY_UPPER_IDS = PRIMARY_TOOTH_IDS.slice(0, 10);
/** Primary lower arch display order: ToothT→ToothK. */
export const PRIMARY_LOWER_IDS = [...PRIMARY_TOOTH_IDS.slice(10)].reverse();

export type DentitionGroup = 'permanent' | 'primary';

/**
 * Mixed-chart slot geometry (patient-facing, screen-left = patient right).
 * Permanent arches use 16 slots. Primary arches use 10 slots aligned under
 * permanent positions 4–13 (0-based 3–12); outer molar slots have no primary.
 */
export const MIXED_ARCH_SLOT_COUNT = 16;
export const MIXED_PRIMARY_SLOT_OFFSET = 3;

export type MixedArchSubrow = {
  dentition: DentitionGroup;
  /** Full anatomical slot ids for this subrow (display order). */
  slotIds: string[];
  /** CSS grid column start (1-based) within the 16-column arch. */
  gridColumnStart: number;
};

export type MixedArchLayout = {
  arch: 'upper' | 'lower';
  permanent: MixedArchSubrow;
  primary: MixedArchSubrow;
};

export const MIXED_UPPER_LAYOUT: MixedArchLayout = {
  arch: 'upper',
  permanent: {
    dentition: 'permanent',
    slotIds: PERMANENT_UPPER_IDS,
    gridColumnStart: 1
  },
  primary: {
    dentition: 'primary',
    slotIds: PRIMARY_UPPER_IDS,
    gridColumnStart: MIXED_PRIMARY_SLOT_OFFSET + 1
  }
};

export const MIXED_LOWER_LAYOUT: MixedArchLayout = {
  arch: 'lower',
  permanent: {
    dentition: 'permanent',
    slotIds: PERMANENT_LOWER_IDS,
    gridColumnStart: 1
  },
  primary: {
    dentition: 'primary',
    slotIds: PRIMARY_LOWER_IDS,
    gridColumnStart: MIXED_PRIMARY_SLOT_OFFSET + 1
  }
};

/** @deprecated Prefer MIXED_*_LAYOUT subrows; kept for callers that need a flat filter list. */
export const MIXED_UPPER_ORDER = [...PERMANENT_UPPER_IDS, ...PRIMARY_UPPER_IDS];
/** @deprecated Prefer MIXED_*_LAYOUT subrows. */
export const MIXED_LOWER_ORDER = [...PERMANENT_LOWER_IDS, ...PRIMARY_LOWER_IDS];

/**
 * Split selected tooth ids into upper/lower using scheme membership only.
 * Display placement must use MIXED_*_LAYOUT subrows, not this flat concat order.
 */
export const selectedToothIdsByArch = (
  toothIds: string[] | null | undefined
): { upper: string[]; lower: string[] } => {
  const upperSet = new Set([...PERMANENT_UPPER_IDS, ...PRIMARY_UPPER_IDS]);
  const upper: string[] = [];
  const lower: string[] = [];
  for (const id of toothIds ?? []) {
    if (upperSet.has(id)) upper.push(id);
    else lower.push(id);
  }
  return { upper, lower };
};

/**
 * Deterministic save order by anatomical quadrant/slot — not selection order.
 * Upper permanent → upper primary → lower permanent → lower primary.
 */
export const orderMixedToothIds = (
  toothIds: string[] | null | undefined
): string[] => {
  const selected = new Set(toothIds ?? []);
  return [
    ...PERMANENT_UPPER_IDS.filter(id => selected.has(id)),
    ...PRIMARY_UPPER_IDS.filter(id => selected.has(id)),
    ...PERMANENT_LOWER_IDS.filter(id => selected.has(id)),
    ...PRIMARY_LOWER_IDS.filter(id => selected.has(id))
  ];
};

/** Arch rows for the setup visual selector — groups stay separate (no shared index). */
export const dentitionGroupsForChartType = (
  chartType?: string | null
): Array<{
  key: DentitionGroup;
  title: string;
  upper: string[];
  lower: string[];
}> => {
  if (chartType === 'CHILD') {
    return [
      {
        key: 'primary',
        title: 'Primary',
        upper: PRIMARY_UPPER_IDS,
        lower: PRIMARY_LOWER_IDS
      }
    ];
  }
  if (chartType === 'MIXED') {
    return [
      {
        key: 'permanent',
        title: 'Permanent',
        upper: PERMANENT_UPPER_IDS,
        lower: PERMANENT_LOWER_IDS
      },
      {
        key: 'primary',
        title: 'Primary',
        upper: PRIMARY_UPPER_IDS,
        lower: PRIMARY_LOWER_IDS
      }
    ];
  }
  if (chartType === 'ADULT') {
    return [
      {
        key: 'permanent',
        title: 'Permanent',
        upper: PERMANENT_UPPER_IDS,
        lower: PERMANENT_LOWER_IDS
      }
    ];
  }
  return [];
};

/** Upper arch order for preview: right → left. */
export const upperPreviewIds = (chartType?: string | null): string[] => {
  if (chartType === 'CHILD') {
    return PRIMARY_UPPER_IDS;
  }
  if (chartType === 'MIXED') {
    return [...PERMANENT_UPPER_IDS, ...PRIMARY_UPPER_IDS];
  }
  return PERMANENT_UPPER_IDS;
};

/** Lower arch order for preview: left → right visually (reverse of index order). */
export const lowerPreviewIds = (chartType?: string | null): string[] => {
  if (chartType === 'CHILD') {
    return PRIMARY_LOWER_IDS;
  }
  if (chartType === 'MIXED') {
    return [...PERMANENT_LOWER_IDS, ...PRIMARY_LOWER_IDS];
  }
  return PERMANENT_LOWER_IDS;
};

export const numberingSystemLabel = (
  value?: ToothNumberingSystem | string | null
): string => {
  if (value === 'FDI') return 'FDI';
  if (value === 'PALMER') return 'Palmer';
  if (value === 'UNIVERSAL') return 'Universal';
  return value || '-';
};
