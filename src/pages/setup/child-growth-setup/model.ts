export type Scope = 'ORGANIZATION' | 'FACILITY' | 'USER';
export type Sex = 'BOTH' | 'GIRLS' | 'BOYS';
export type AgeUnit = 'MONTHS' | 'YEARS';
export type ChartKind = 'DEFAULT' | 'PRETERM' | 'DIAGNOSIS' | 'CUSTOM';
export type IndicatorId = 'WFA' | 'LFA' | 'HC' | 'WFL' | 'BMI';
export type BandTone = 'action' | 'watch' | 'normal';
export type MissingSex = 'ASK' | 'GIRLS' | 'BOYS';
export type AlertRecipient = 'PHYSICIAN' | 'NURSE' | 'TASK';

export type ChartSet = {
  id: string;
  name: string;
  description: string;
  sex: Sex;
  ageFrom: number | string | null;
  ageTo: number | string | null;
  unit: AgeUnit;
  enabled: boolean;
  kind: ChartKind;
};

export type SelectionRules = {
  missingSex: MissingSex;
  correctedAgeUntilMonths: number | string | null;
  allowOverride: boolean;
  showInParentPortal: boolean;
};

export type StatusBand = {
  id: string;
  label: string;
  tone: BandTone;
  min: number | string | null;
  max: number | string | null;
  percentile: string;
  alerted: AlertRecipient[];
};

export type EntryLimits = {
  weightMinKg: number | string | null;
  weightMaxKg: number | string | null;
  lengthMinCm: number | string | null;
  lengthMaxCm: number | string | null;
  headMinCm: number | string | null;
  headMaxCm: number | string | null;
};

export type AlertRules = {
  consecutiveVisits: number | string | null;
  channelsCrossed: number | string | null;
};

export type SetupState = {
  charts: ChartSet[];
  rules: SelectionRules;
  bandsByIndicator: Record<IndicatorId, StatusBand[]>;
  limits: EntryLimits;
  alerts: AlertRules;
};

export const SCOPES: { id: Scope; label: string }[] = [
  { id: 'ORGANIZATION', label: 'Organization' },
  { id: 'FACILITY', label: 'Facility' },
  { id: 'USER', label: 'User' }
];

export const SEX_OPTIONS = [
  { label: 'Both', value: 'BOTH' },
  { label: 'Girls', value: 'GIRLS' },
  { label: 'Boys', value: 'BOYS' }
];

export const UNIT_OPTIONS = [
  { label: 'months', value: 'MONTHS' },
  { label: 'years', value: 'YEARS' }
];

export const MISSING_SEX_OPTIONS = [
  { label: 'Ask before plotting', value: 'ASK' },
  { label: 'Plot as girls', value: 'GIRLS' },
  { label: 'Plot as boys', value: 'BOYS' }
];

export const ALERTED_OPTIONS: { label: string; value: AlertRecipient }[] = [
  { label: 'Physician', value: 'PHYSICIAN' },
  { label: 'Nurse', value: 'NURSE' },
  { label: 'Task', value: 'TASK' }
];

const ALERTED_VALUES = new Set<string>(ALERTED_OPTIONS.map(option => option.value));

const LEGACY_ALERTED: Record<string, AlertRecipient[]> = {
  'Physician + task': ['PHYSICIAN', 'TASK'],
  'Nurse flag': ['NURSE'],
  'No alert': []
};

export const alertedOf = (band: { alerted?: unknown; alert?: unknown }): AlertRecipient[] => {
  const source = Array.isArray(band.alerted)
    ? band.alerted
    : typeof band.alert === 'string'
      ? LEGACY_ALERTED[band.alert] ?? []
      : [];
  const seen = new Set<string>();
  return source.filter((value): value is AlertRecipient => {
    const key = String(value);
    if (!ALERTED_VALUES.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const INDICATORS: { id: IndicatorId; label: string }[] = [
  { id: 'WFA', label: 'Weight-for-age' },
  { id: 'LFA', label: 'Length-for-age' },
  { id: 'HC', label: 'Head circumference' },
  { id: 'WFL', label: 'Weight-for-length' },
  { id: 'BMI', label: 'BMI-for-age' }
];

const defaultBands = (): StatusBand[] => [
  {
    id: 'action-low',
    label: 'Action · low',
    tone: 'action',
    min: -5,
    max: -2,
    percentile: 'below 2nd',
    alerted: ['PHYSICIAN', 'TASK']
  },
  {
    id: 'watch-low',
    label: 'Watch · low',
    tone: 'watch',
    min: -2,
    max: -1,
    percentile: '2nd to 16th',
    alerted: ['NURSE']
  },
  {
    id: 'normal',
    label: 'Normal',
    tone: 'normal',
    min: -1,
    max: 1,
    percentile: '16th to 84th',
    alerted: []
  },
  {
    id: 'watch-high',
    label: 'Watch · high',
    tone: 'watch',
    min: 1,
    max: 2,
    percentile: '84th to 98th',
    alerted: ['NURSE']
  },
  {
    id: 'action-high',
    label: 'Action · high',
    tone: 'action',
    min: 2,
    max: 5,
    percentile: 'above 98th',
    alerted: ['PHYSICIAN', 'TASK']
  }
];

export const defaultSetup = (): SetupState => ({
  charts: [
    {
      id: 'who',
      name: 'WHO Child Growth Standards',
      description: 'Default for age',
      sex: 'BOTH',
      ageFrom: 0,
      ageTo: 24,
      unit: 'MONTHS',
      enabled: true,
      kind: 'DEFAULT'
    },
    {
      id: 'cdc',
      name: 'CDC Growth Charts',
      description: 'Default for age',
      sex: 'BOTH',
      ageFrom: 24,
      ageTo: 240,
      unit: 'MONTHS',
      enabled: true,
      kind: 'DEFAULT'
    },
    {
      id: 'preterm',
      name: 'Preterm chart',
      description: 'By gestational age, born before 37 weeks',
      sex: 'BOTH',
      ageFrom: 22,
      ageTo: 50,
      unit: 'MONTHS',
      enabled: true,
      kind: 'PRETERM'
    },
    {
      id: 'down',
      name: 'Down syndrome chart',
      description: 'By diagnosis on the problem list',
      sex: 'BOTH',
      ageFrom: 0,
      ageTo: 240,
      unit: 'MONTHS',
      enabled: true,
      kind: 'DIAGNOSIS'
    },
    {
      id: 'custom',
      name: 'Custom or national chart',
      description: 'Upload an LMS table (age, sex, L, M, S)',
      sex: 'BOTH',
      ageFrom: null,
      ageTo: null,
      unit: 'MONTHS',
      enabled: false,
      kind: 'CUSTOM'
    }
  ],
  rules: {
    missingSex: 'ASK',
    correctedAgeUntilMonths: 24,
    allowOverride: true,
    showInParentPortal: true
  },
  bandsByIndicator: {
    WFA: defaultBands(),
    LFA: defaultBands(),
    HC: defaultBands(),
    WFL: defaultBands(),
    BMI: defaultBands()
  },
  limits: {
    weightMinKg: 0.3,
    weightMaxKg: 150,
    lengthMinCm: 25,
    lengthMaxCm: 220,
    headMinCm: 20,
    headMaxCm: 65
  },
  alerts: {
    consecutiveVisits: 2,
    channelsCrossed: 2
  }
});

export const asNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const toMonths = (value: unknown, unit: AgeUnit): number | null => {
  const n = asNumber(value);
  if (n === null) return null;
  return unit === 'YEARS' ? n * 12 : n;
};

export const formatMonths = (months: number): string => {
  if (months % 12 === 0) {
    const years = months / 12;
    return years === 1 ? '1 year' : `${years} years`;
  }
  return months === 1 ? '1 month' : `${months} months`;
};

const chartShort = (chart: ChartSet) => {
  if (chart.id === 'who') return 'WHO';
  if (chart.id === 'cdc') return 'CDC';
  if (chart.id === 'preterm') return 'Preterm';
  if (chart.id === 'down') return 'Down syndrome';
  if (chart.id === 'custom') return 'Custom';
  return chart.name;
};

export type CoverageSegment = {
  id: string;
  short: string;
  detail: string;
  from: number;
  to: number;
};

export type CoverageRow = {
  sex: 'GIRLS' | 'BOYS';
  label: string;
  segments: CoverageSegment[];
};

export type Coverage = {
  rows: CoverageRow[];
  issues: string[];
  scaleMax: number;
  clear: boolean;
};

const appliesTo = (chart: ChartSet, sex: 'GIRLS' | 'BOYS') =>
  chart.sex === 'BOTH' || chart.sex === sex;

export const buildCoverage = (charts: ChartSet[]): Coverage => {
  const issues: string[] = [];
  const rows: CoverageRow[] = (['GIRLS', 'BOYS'] as const).map(sex => {
    const segments: CoverageSegment[] = [];
    charts
      .filter(chart => chart.enabled && chart.kind === 'DEFAULT' && appliesTo(chart, sex))
      .forEach(chart => {
        const from = toMonths(chart.ageFrom, chart.unit);
        const to = toMonths(chart.ageTo, chart.unit);
        if (from === null || to === null || to <= from) return;
        const short = chartShort(chart);
        segments.push({
          id: chart.id,
          short,
          detail: `${short} ${formatMonths(from)} to ${formatMonths(to)}`,
          from,
          to
        });
      });
    segments.sort((a, b) => a.from - b.from || a.to - b.to);
    if (!segments.length) {
      issues.push(`No default age chart for ${sex === 'GIRLS' ? 'girls' : 'boys'}`);
    }
    for (let i = 1; i < segments.length; i += 1) {
      const previous = segments[i - 1];
      const current = segments[i];
      if (current.from < previous.to) {
        issues.push(
          `${sex === 'GIRLS' ? 'Girls' : 'Boys'}: ${previous.short} overlaps ${current.short}`
        );
      } else if (current.from > previous.to) {
        issues.push(
          `${sex === 'GIRLS' ? 'Girls' : 'Boys'}: gap from ${formatMonths(previous.to)} to ${formatMonths(current.from)}`
        );
      }
    }
    return { sex, label: sex === 'GIRLS' ? 'Girls' : 'Boys', segments };
  });

  const highest = rows.reduce(
    (max, row) => Math.max(max, ...row.segments.map(segment => segment.to), 0),
    0
  );
  return {
    rows,
    issues,
    scaleMax: Math.max(240, highest),
    clear: issues.length === 0
  };
};

export const validateCharts = (charts: ChartSet[]): string | null => {
  for (const chart of charts) {
    if (!chart.enabled) continue;
    const from = asNumber(chart.ageFrom);
    const to = asNumber(chart.ageTo);
    if (from === null) return `${chart.name}: Age from is required`;
    if (to === null) return `${chart.name}: Age to is required`;
    if (!Number.isInteger(from) || from < 0) return `${chart.name}: Age from must be a whole number, 0 or more`;
    if (!Number.isInteger(to) || to < 0) return `${chart.name}: Age to must be a whole number, 0 or more`;
    if (to <= from) return `${chart.name}: Age to must be greater than Age from`;
  }
  return null;
};

export const validateRules = (rules: SelectionRules): string | null => {
  const months = asNumber(rules.correctedAgeUntilMonths);
  if (months === null) return 'Use corrected age until (months) is required';
  if (!Number.isInteger(months) || months < 0) {
    return 'Corrected age must be a whole number of months, 0 or more';
  }
  return null;
};

export const validateBands = (bands: StatusBand[]): string | null => {
  const parsed: { band: StatusBand; min: number; max: number }[] = [];
  for (const band of bands) {
    const min = asNumber(band.min);
    const max = asNumber(band.max);
    if (min === null || max === null) return `${band.label}: Min and Max are required`;
    if (min >= max) return `${band.label}: Min must be less than Max`;
    parsed.push({ band, min, max });
  }
  const sorted = [...parsed].sort((a, b) => a.min - b.min);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].min < sorted[i - 1].max) {
      return `${sorted[i].band.label} overlaps ${sorted[i - 1].band.label}`;
    }
  }
  return null;
};

export const validateAllBands = (bandsByIndicator: Record<IndicatorId, StatusBand[]>): string | null => {
  for (const indicator of INDICATORS) {
    const error = validateBands(bandsByIndicator[indicator.id] ?? []);
    if (error) return `${indicator.label}: ${error}`;
  }
  return null;
};

const limitPairs: { min: keyof EntryLimits; max: keyof EntryLimits; label: string }[] = [
  { min: 'weightMinKg', max: 'weightMaxKg', label: 'Weight' },
  { min: 'lengthMinCm', max: 'lengthMaxCm', label: 'Length' },
  { min: 'headMinCm', max: 'headMaxCm', label: 'Head circumference' }
];

export const validateLimits = (limits: EntryLimits): string | null => {
  for (const pair of limitPairs) {
    const min = asNumber(limits[pair.min]);
    const max = asNumber(limits[pair.max]);
    if (min === null || max === null) return `${pair.label}: min and max are required`;
    if (min < 0 || max < 0) return `${pair.label}: limits must be 0 or more`;
    if (min >= max) return `${pair.label}: min must be less than max`;
  }
  return null;
};

export const validateAlerts = (alerts: AlertRules): string | null => {
  const visits = asNumber(alerts.consecutiveVisits);
  const channels = asNumber(alerts.channelsCrossed);
  if (visits === null || !Number.isInteger(visits) || visits < 1) {
    return 'Consecutive visits must be a whole number, 1 or more';
  }
  if (channels === null || !Number.isInteger(channels) || channels < 1) {
    return 'Percentile channels crossed must be a whole number, 1 or more';
  }
  return null;
};

export const bandAt = (z: number, bands: StatusBand[]): StatusBand | undefined => {
  const parsed = bands
    .map(band => ({ band, min: asNumber(band.min), max: asNumber(band.max) }))
    .filter((item): item is { band: StatusBand; min: number; max: number } => item.min !== null && item.max !== null)
    .sort((a, b) => a.min - b.min);
  return parsed.find((item, index) => {
    const last = index === parsed.length - 1;
    return z >= item.min && (last ? z <= item.max : z < item.max);
  })?.band;
};

export const sampleCaption = (band?: StatusBand): string => {
  if (!band) return 'Sample child: outside the configured bands';
  if (band.id === 'watch-low') return 'Sample child: now in the low Watch band';
  if (band.id === 'watch-high') return 'Sample child: now in the high Watch band';
  if (band.id === 'action-low') return 'Sample child: now in the low Action band';
  if (band.id === 'action-high') return 'Sample child: now in the high Action band';
  return 'Sample child: now in the Normal band';
};

export const outerLimitNote = (bands: StatusBand[]): string => {
  const values = bands
    .flatMap(band => [asNumber(band.min), asNumber(band.max)])
    .filter((value): value is number => value !== null);
  const outer = values.length ? Math.max(...values.map(value => Math.abs(value))) : 5;
  const shown = Number.isInteger(outer) ? String(outer) : String(Math.round(outer * 10) / 10);
  return `Beyond ±${shown} is treated as a data-entry error and the nurse is asked to re-measure.`;
};

export const SAMPLE_SERIES = [0.2, 0.02, -0.4, -0.85, -1.4];
export const SAMPLE_Z = SAMPLE_SERIES[SAMPLE_SERIES.length - 1];
