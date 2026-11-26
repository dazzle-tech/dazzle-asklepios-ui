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
 * Mixed charts use one upper and one lower arch. Each arch has 16 anatomical
 * slots (screen-left = patient right). Primary teeth occupy slots 4–13 of the
 * arch, sharing the position of the permanent tooth that succeeds them.
 */
export const MIXED_ARCH_SLOT_COUNT = 16;
export const MIXED_PRIMARY_SLOT_OFFSET = 3;
/** Slots before this index belong to the patient's right side. */
export const MIXED_ARCH_MIDLINE_SLOT = 8;
/** Mixed inventory limits: primary and permanent teeth are counted together. */
export const MIXED_MAX_TEETH_PER_ARCH = 16;
export const MIXED_MAX_TEETH_TOTAL = 32;

export type MixedArch = 'upper' | 'lower';
export type MixedSide = 'right' | 'left';

const slotsFor = (permanent: string[], primary: string[]): Record<string, number> => {
  const slots: Record<string, number> = {};
  permanent.forEach((id, index) => {
    slots[id] = index;
  });
  primary.forEach((id, index) => {
    slots[id] = index + MIXED_PRIMARY_SLOT_OFFSET;
  });
  return slots;
};

const UPPER_SLOTS = slotsFor(PERMANENT_UPPER_IDS, PRIMARY_UPPER_IDS);
const LOWER_SLOTS = slotsFor(PERMANENT_LOWER_IDS, PRIMARY_LOWER_IDS);

/** Anatomical order of an arch: per slot, the primary tooth then the permanent one. */
const unifiedArchOrder = (slots: Record<string, number>): string[] =>
  Object.keys(slots).sort((a, b) => {
    if (slots[a] !== slots[b]) return slots[a] - slots[b];
    return Number(isPermanentToothId(a)) - Number(isPermanentToothId(b));
  });

/** Upper arch, patient right → left, primary and permanent teeth interleaved. */
export const MIXED_UPPER_ORDER = unifiedArchOrder(UPPER_SLOTS);
/** Lower arch, patient right → left, primary and permanent teeth interleaved. */
export const MIXED_LOWER_ORDER = unifiedArchOrder(LOWER_SLOTS);

export const mixedArchOf = (toothId: string): MixedArch | null => {
  if (toothId in UPPER_SLOTS) return 'upper';
  if (toothId in LOWER_SLOTS) return 'lower';
  return null;
};

export const mixedToothSlot = (toothId: string): number =>
  UPPER_SLOTS[toothId] ?? LOWER_SLOTS[toothId] ?? -1;

/**
 * An anatomical position: one slot of an arch. Every position has a permanent
 * tooth; slots 4–13 also have a primary counterpart that shares the position.
 */
export type MixedPosition = {
  arch: MixedArch;
  slot: number;
  permanentId: string;
  primaryId: string | null;
};

const buildPositions = (
  arch: MixedArch,
  permanent: string[],
  primary: string[]
): MixedPosition[] =>
  permanent.map((permanentId, slot) => ({
    arch,
    slot,
    permanentId,
    primaryId: primary[slot - MIXED_PRIMARY_SLOT_OFFSET] ?? null
  }));

/** The 16 anatomical positions of each arch, patient right → left. */
export const MIXED_ARCH_POSITIONS: Record<MixedArch, MixedPosition[]> = {
  upper: buildPositions('upper', PERMANENT_UPPER_IDS, PRIMARY_UPPER_IDS).map(p =>
    p.slot < MIXED_PRIMARY_SLOT_OFFSET ? { ...p, primaryId: null } : p
  ),
  lower: buildPositions('lower', PERMANENT_LOWER_IDS, PRIMARY_LOWER_IDS).map(p =>
    p.slot < MIXED_PRIMARY_SLOT_OFFSET ? { ...p, primaryId: null } : p
  )
};

/** Teeth that can occupy a position: its primary tooth (if any), then its permanent tooth. */
export const mixedPositionToothIds = (position: MixedPosition): string[] =>
  position.primaryId
    ? [position.primaryId, position.permanentId]
    : [position.permanentId];

export const mixedPositionOf = (toothId: string): MixedPosition | null => {
  const arch = mixedArchOf(toothId);
  if (!arch) return null;
  return MIXED_ARCH_POSITIONS[arch][mixedToothSlot(toothId)] ?? null;
};

/** The other tooth that fits the same position (primary ↔ permanent), if one exists. */
export const counterpartToothId = (toothId: string): string | null => {
  const position = mixedPositionOf(toothId);
  if (!position || !position.primaryId) return null;
  return toothId === position.primaryId ? position.permanentId : position.primaryId;
};

/** Selected ids that occupy a position. */
export const mixedPositionSelection = (
  position: MixedPosition,
  toothIds: string[] | null | undefined
): string[] => {
  const selected = new Set(toothIds ?? []);
  return mixedPositionToothIds(position).filter(id => selected.has(id));
};

/** Positions where both the primary and permanent tooth are selected (legacy data). */
export const mixedPositionConflicts = (
  toothIds: string[] | null | undefined
): MixedPosition[] =>
  [...MIXED_ARCH_POSITIONS.upper, ...MIXED_ARCH_POSITIONS.lower].filter(
    position => mixedPositionSelection(position, toothIds).length > 1
  );

/** Positions on one end of an arch with no tooth selected. */
export const emptyMixedPositions = (
  toothIds: string[] | null | undefined,
  arch: MixedArch,
  side?: MixedSide
): MixedPosition[] =>
  MIXED_ARCH_POSITIONS[arch].filter(
    position =>
      (!side ||
        (position.slot < MIXED_ARCH_MIDLINE_SLOT ? 'right' : 'left') === side) &&
      mixedPositionSelection(position, toothIds).length === 0
  );

export const mixedToothCounts = (
  toothIds: string[] | null | undefined
): { total: number; upper: number; lower: number } => {
  let upper = 0;
  let lower = 0;
  new Set(toothIds ?? []).forEach(id => {
    const arch = mixedArchOf(id);
    if (arch === 'upper') upper += 1;
    if (arch === 'lower') lower += 1;
  });
  return { total: upper + lower, upper, lower };
};

/** True when one more tooth can be added to this arch without passing 16 per arch / 32 total. */
export const canAddMixedTooth = (
  toothIds: string[] | null | undefined,
  arch: MixedArch
): boolean => {
  const counts = mixedToothCounts(toothIds);
  return (
    counts.total < MIXED_MAX_TEETH_TOTAL &&
    counts[arch] < MIXED_MAX_TEETH_PER_ARCH
  );
};

/** Selected teeth of one arch in anatomical order. */
export const selectedMixedArchToothIds = (
  toothIds: string[] | null | undefined,
  arch: MixedArch
): string[] => {
  const selected = new Set(toothIds ?? []);
  return (arch === 'upper' ? MIXED_UPPER_ORDER : MIXED_LOWER_ORDER).filter(id =>
    selected.has(id)
  );
};

/**
 * Deterministic save order by anatomical position — not selection order.
 * Upper arch (patient right → left) then lower arch; duplicates are dropped.
 */
export const orderMixedToothIds = (
  toothIds: string[] | null | undefined
): string[] => [
  ...selectedMixedArchToothIds(toothIds, 'upper'),
  ...selectedMixedArchToothIds(toothIds, 'lower')
];

/**
 * Shared add used by every "+" entry point: no duplicates, no second tooth in an
 * occupied position, and never past 16 per arch / 32 total. Returns the same
 * array when the add is not allowed.
 */
export const addMixedToothToPosition = (
  toothIds: string[],
  toothId: string
): string[] => {
  const position = mixedPositionOf(toothId);
  if (!position || toothIds.includes(toothId)) return toothIds;
  if (mixedPositionSelection(position, toothIds).length > 0) return toothIds;
  if (!canAddMixedTooth(toothIds, position.arch)) return toothIds;
  return orderMixedToothIds([...toothIds, toothId]);
};

/** Atomic primary ↔ permanent swap in the same position; the count never changes. */
export const replaceMixedTooth = (
  toothIds: string[],
  fromId: string,
  toId: string
): string[] => {
  if (!toothIds.includes(fromId) || toothIds.includes(toId)) return toothIds;
  if (counterpartToothId(fromId) !== toId) return toothIds;
  return orderMixedToothIds(toothIds.map(id => (id === fromId ? toId : id)));
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
    return MIXED_UPPER_ORDER;
  }
  return PERMANENT_UPPER_IDS;
};

/** Lower arch order for preview: left → right visually (reverse of index order). */
export const lowerPreviewIds = (chartType?: string | null): string[] => {
  if (chartType === 'CHILD') {
    return PRIMARY_LOWER_IDS;
  }
  if (chartType === 'MIXED') {
    return MIXED_LOWER_ORDER;
  }
  return PERMANENT_LOWER_IDS;
};

/** Every stable tooth id: permanent Tooth1–Tooth32 then primary ToothA–ToothT. */
export const ALL_TOOTH_IDS: string[] = [...PERMANENT_TOOTH_IDS, ...PRIMARY_TOOTH_IDS];

/** Field limits shared with the setup-service validation. */
export const NUMBERING_METHOD_NAME_MAX = 100;
export const NUMBERING_METHOD_DESCRIPTION_MAX = 255;
export const NUMBERING_LABEL_MAX = 12;

export type ToothLabelMap = Record<string, string>;

/** Labels of a built-in numbering system for all 52 teeth (used to start a copy). */
export const builtInToothLabels = (system: ToothNumberingSystem): ToothLabelMap =>
  Object.fromEntries(ALL_TOOTH_IDS.map(id => [id, toothDisplayLabelForSystem(id, system)]));

const labelKey = (label: string) => label.trim().toLowerCase();

/**
 * Same rules as the backend: every tooth needs a trimmed non-empty label of at most
 * NUMBERING_LABEL_MAX characters, and a label may not repeat inside one dentition
 * (permanent or primary). Palmer labels carry their quadrant mark in the string
 * (for example 8 + corner), so the same number in another quadrant stays distinct.
 */
export const validateToothLabels = (
  labels: ToothLabelMap | null | undefined
): { missing: string[]; tooLong: string[]; duplicates: Record<string, string[]> } => {
  const map = labels ?? {};
  const missing = ALL_TOOTH_IDS.filter(id => !(map[id] ?? '').trim());
  const tooLong = ALL_TOOTH_IDS.filter(id => (map[id] ?? '').trim().length > NUMBERING_LABEL_MAX);
  const duplicates: Record<string, string[]> = {};
  [PERMANENT_TOOTH_IDS, PRIMARY_TOOTH_IDS].forEach(group => {
    const byLabel: Record<string, string[]> = {};
    group.forEach(id => {
      const label = (map[id] ?? '').trim();
      if (!label) return;
      (byLabel[labelKey(label)] ??= []).push(id);
    });
    Object.values(byLabel)
      .filter(ids => ids.length > 1)
      .forEach(ids => ids.forEach(id => (duplicates[id] = ids)));
  });
  return { missing, tooLong, duplicates };
};

export const isToothLabelSetComplete = (labels: ToothLabelMap | null | undefined): boolean => {
  const { missing, tooLong, duplicates } = validateToothLabels(labels);
  return missing.length === 0 && tooLong.length === 0 && Object.keys(duplicates).length === 0;
};

export type NumberingSequenceDirection = 'FORWARD' | 'REVERSE';

/**
 * Predictable anatomical sequence for Enter-to-next and bulk numbering. FORWARD follows the
 * Universal order of the stable ids: upper arch patient right → left, then lower arch
 * patient left → right (Tooth1…Tooth32, ToothA…ToothT). REVERSE walks it backwards.
 */
export const numberingSequence = (
  dentition: DentitionGroup,
  direction: NumberingSequenceDirection
): string[] => {
  const ids = dentition === 'primary' ? PRIMARY_TOOTH_IDS : PERMANENT_TOOTH_IDS;
  return direction === 'REVERSE' ? [...ids].reverse() : [...ids];
};

export type BulkNumberingOptions = {
  start: number;
  step: number;
  prefix?: string;
  suffix?: string;
};

/** Sequential labels for the given teeth, in the given order: prefix + (start + i * step) + suffix. */
export const buildBulkLabels = (
  orderedToothIds: string[],
  { start, step, prefix = '', suffix = '' }: BulkNumberingOptions
): ToothLabelMap =>
  Object.fromEntries(
    orderedToothIds.map((id, index) => [id, `${prefix}${start + index * step}${suffix}`])
  );

/** Snapshot labels win; otherwise the legacy enum labels apply. */
export const toothLabelFromSnapshot = (
  toothId: string,
  numberingLabels: ToothLabelMap | null | undefined,
  numberingSystem: ToothNumberingSystem | string | null | undefined
): string => numberingLabels?.[toothId]?.trim() || toothDisplayLabelForSystem(toothId, numberingSystem);

export const numberingSystemLabel = (
  value?: ToothNumberingSystem | string | null
): string => {
  if (value === 'FDI') return 'FDI';
  if (value === 'PALMER') return 'Palmer';
  if (value === 'UNIVERSAL') return 'Universal';
  return value || '-';
};
