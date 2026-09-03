export type ReportPrintParameter = {
  name: string;
  label: string;
  type: 'date' | 'text';
};

const CONTEXT_PARAM_NAMES = new Set([
  'patientid',
  'encounterid',
  'departmentid',
  'facilityid',
  'status',
  'timezone',
  'lang',
]);

const PLACEHOLDER_RE = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

const toLabel = (name: string) =>
  name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, char => char.toUpperCase());

const isDateParam = (name: string) =>
  /^(start|end|from|to)?date$/i.test(name) || /date/i.test(name);

const collectNames = (value: unknown, names: Set<string>) => {
  if (typeof value === 'string') {
    value.replace(PLACEHOLDER_RE, (_match, name: string) => {
      names.add(name);
      return _match;
    });
    return;
  }
  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  const ident = String(record.Ident ?? record.ident ?? '');
  const varName = String(record.Name ?? record.name ?? '');
  if (varName && (ident === 'StiVariable' || record.RequestFromUser === true)) {
    names.add(varName);
  }
  Object.values(record).forEach(child => collectNames(child, names));
};

export const extractReportPrintParameters = (
  templateJson?: string | null
): ReportPrintParameter[] => {
  if (!templateJson?.trim()) return [];
  let parsed: unknown = templateJson;
  try {
    parsed = JSON.parse(templateJson);
  } catch {
    parsed = templateJson;
  }
  const names = new Set<string>();
  collectNames(parsed, names);
  return [...names]
    .filter(name => !CONTEXT_PARAM_NAMES.has(name.toLowerCase()))
    .map(name => ({
      name,
      label: toLabel(name),
      type: isDateParam(name) ? 'date' : 'text',
    }));
};

export const defaultDateValue = (name: string): string => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  if (/^(startDate|fromDate)$/i.test(name)) return iso(start);
  if (/^(endDate|toDate)$/i.test(name)) return iso(end);
  if (/date/i.test(name)) return iso(end);
  return '';
};
