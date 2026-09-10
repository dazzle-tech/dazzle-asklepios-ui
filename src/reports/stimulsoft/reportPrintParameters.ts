export type ReportPrintParameter = {
  name: string;
  label: string;
  type: 'date' | 'text';
  required: boolean;
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

const SYSTEM_VARIABLE_NAMES = new Set([
  'line',
  'lineabc',
  'lineroman',
  'page',
  'pagenumber',
  'totalpagenumber',
  'column',
  'groupline',
  'reportname',
  'reportalias',
  'reportauthor',
  'reportdescription',
  'time',
  'today',
]);

const DATE_PARAM_NAMES = new Set([
  'date',
  'startdate',
  'enddate',
  'fromdate',
  'todate',
]);

const PLACEHOLDER_RE = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;
const QUERY_PARAM_RE = /[?&]([A-Za-z_][A-Za-z0-9_]*)=/g;
const DATE_TOKEN_RE =
  /(?:[?&]|\{|%7B|"Name"\s*:\s*")(date|startDate|endDate|fromDate|toDate)(?:[=\}%]|")/gi;

const toLabel = (name: string) =>
  name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, char => char.toUpperCase());

const isKnownDateName = (name: string) => DATE_PARAM_NAMES.has(name.trim().toLowerCase());

const isDateType = (name: string, typeHint?: string) => {
  if (isKnownDateName(name)) return true;
  const hint = String(typeHint || '').toLowerCase();
  return hint.includes('datetime') || hint.includes('date');
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const listOf = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  if (!record) return [];
  if (Array.isArray(record.list)) return record.list as unknown[];
  const numericKeys = Object.keys(record)
    .filter(key => /^\d+$/.test(key))
    .sort((a, b) => Number(a) - Number(b));
  if (numericKeys.length > 0) {
    return numericKeys.map(key => record[key]);
  }
  return [];
};

const isTrue = (value: unknown) => {
  if (value === true || value === 1) return true;
  return String(value ?? '').trim().toLowerCase() === 'true';
};

const shouldKeepParam = (name: string) => {
  const trimmed = String(name || '').trim();
  if (!trimmed) return false;
  if (CONTEXT_PARAM_NAMES.has(trimmed.toLowerCase())) return false;
  if (SYSTEM_VARIABLE_NAMES.has(trimmed.toLowerCase())) return false;
  return true;
};

const PARAM_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

const addName = (names: string[], raw: unknown) => {
  if (typeof raw !== 'string' && typeof raw !== 'number') return;
  const name = String(raw).trim();
  if (!PARAM_NAME_RE.test(name) || !shouldKeepParam(name)) return;
  if (!names.includes(name)) names.push(name);
};

const resetGlobalRegex = (regex: RegExp) => {
  regex.lastIndex = 0;
};

const collectFromDataPath = (path: string, names: string[]) => {
  if (!path || path.length > 4000) return;
  const decoded = path
    .replace(/&amp;/g, '&')
    .replace(/%3D/gi, '=')
    .replace(/%3F/gi, '?')
    .replace(/%26/gi, '&')
    .replace(/%7B/gi, '{')
    .replace(/%7D/gi, '}');

  resetGlobalRegex(PLACEHOLDER_RE);
  decoded.replace(PLACEHOLDER_RE, (_match, name: string) => {
    addName(names, name);
    return _match;
  });
  resetGlobalRegex(QUERY_PARAM_RE);
  decoded.replace(QUERY_PARAM_RE, (_match, name: string) => {
    addName(names, name);
    return _match;
  });
  if (/daily-visits/i.test(decoded)) addName(names, 'date');
};

const collectFromValue = (value: unknown, names: string[], depth = 0) => {
  if (depth > 18) return;
  if (typeof value === 'string') {
    if (
      value.length <= 4000 &&
      (/\/api\//i.test(value) || /[?&][A-Za-z_]+=/.test(value) || /daily-visits/i.test(value))
    ) {
      collectFromDataPath(value, names);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(item => collectFromValue(item, names, depth + 1));
    return;
  }
  const record = asRecord(value);
  if (!record) return;

  const ident = String(record.Ident ?? record.ident ?? '');
  if (ident === 'StiVariable' || ident.endsWith('Variable')) {
    const name = String(record.Name ?? record.name ?? '').trim();
    if (
      name &&
      shouldKeepParam(name) &&
      (isTrue(record.RequestFromUser ?? record.requestFromUser) || isKnownDateName(name))
    ) {
      addName(names, name);
    }
  }

  Object.entries(record).forEach(([key, child]) => {
    const lower = key.toLowerCase();
    if (lower === 'image' || lower === 'bytes' || lower === 'watermark') return;
    collectFromValue(child, names, depth + 1);
  });
};

export const templateJsonToString = (templateJson?: string | object | null): string => {
  if (templateJson == null) return '';
  if (typeof templateJson === 'string') return templateJson;
  try {
    return JSON.stringify(templateJson);
  } catch {
    return '';
  }
};

export const normalizeStimulsoftTemplateJson = (source: unknown): string => {
  if (source == null) return '';
  if (typeof source === 'string') return source;
  const picked = pickTemplateJson(source);
  if (picked != null) return templateJsonToString(picked);
  const record = asRecord(source);
  if (
    record &&
    (record.Pages || record.ReportName || record.Dictionary || record.ReportUnit)
  ) {
    return templateJsonToString(source);
  }
  return '';
};

export const pickTemplateJson = (body: unknown): unknown => {
  if (body == null) return null;
  if (typeof body === 'string') return body;
  const record = asRecord(body);
  if (!record) return null;
  const nested = asRecord(record.data) ?? asRecord(record.result);
  return (
    record.templateJson ??
    record.template_json ??
    record.json ??
    record.mrt ??
    nested?.templateJson ??
    nested?.template_json ??
    nested?.json ??
    null
  );
};

const parseTemplateJson = (templateJson: string): unknown => {
  let parsed: unknown = templateJson;
  for (let i = 0; i < 3; i += 1) {
    if (typeof parsed !== 'string') break;
    try {
      parsed = JSON.parse(parsed);
    } catch {
      break;
    }
  }
  return parsed;
};

const toParameters = (
  names: string[],
  typeHints: Record<string, string> = {}
): ReportPrintParameter[] => {
  const byName = new Map<string, ReportPrintParameter>();
  names.forEach(raw => {
    if (typeof raw !== 'string') return;
    const name = raw.trim();
    if (!PARAM_NAME_RE.test(name) || !shouldKeepParam(name)) return;
    const key = name.toLowerCase();
    if (byName.has(key)) return;
    byName.set(key, {
      name,
      label: toLabel(name) || name,
      type: isDateType(name, typeHints[name] || typeHints[key]) ? 'date' : 'text',
      required: true,
    });
  });
  return Array.from(byName.values());
};

export const extractReportPrintParameters = (
  templateJson?: string | object | null
): ReportPrintParameter[] => {
  const text = templateJsonToString(templateJson);
  if (!text.trim()) return [];

  const names: string[] = [];
  resetGlobalRegex(DATE_TOKEN_RE);
  text.replace(DATE_TOKEN_RE, (_match, name: string) => {
    addName(names, name);
    return _match;
  });
  if (/daily-visits/i.test(text)) addName(names, 'date');

  const parsed = parseTemplateJson(text);
  const typeHints: Record<string, string> = {};
  if (parsed && typeof parsed !== 'string') {
    collectFromValue(parsed, names);
  } else {
    collectFromDataPath(text.slice(0, 20000), names);
  }

  return toParameters(names, typeHints);
};

const stimCollection = (value: any): any[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.list)) return value.list;
  const count = Number(value.count ?? value.length ?? 0);
  if (typeof value.getByIndex === 'function' && count > 0) {
    const items: any[] = [];
    for (let i = 0; i < count; i += 1) {
      items.push(value.getByIndex(i));
    }
    return items;
  }
  return listOf(value);
};

export const extractReportPrintParametersFromStimulsoftReport = (
  report: any
): ReportPrintParameter[] => {
  const names: string[] = [];
  const typeHints: Record<string, string> = {};

  stimCollection(report?.dictionary?.databases).forEach((database: any) => {
    const path = String(database?.pathData || database?.path || database?.url || '');
    collectFromDataPath(path, names);
  });
  stimCollection(report?.dictionary?.dataSources).forEach((source: any) => {
    collectFromDataPath(
      String(
        source?.sqlCommand ||
          source?.command ||
          source?.pathData ||
          source?.path ||
          ''
      ),
      names
    );
  });

  stimCollection(report?.dictionary?.variables).forEach((variable: any) => {
    const name = String(variable?.name || variable?.alias || '').trim();
    if (!name || !shouldKeepParam(name)) return;
    const hint = String(variable?.type || variable?.typeName || '');
    typeHints[name] = hint;
    const requestFromUser = isTrue(
      variable?.requestFromUser ?? variable?.RequestFromUser
    );
    if (requestFromUser || isKnownDateName(name) || names.includes(name)) {
      addName(names, name);
    }
  });

  return toParameters(names, typeHints);
};

export const defaultDateValue = (name: string): string => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  const iso = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  if (/^(startDate|fromDate)$/i.test(name)) return iso(start);
  if (/^(endDate|toDate)$/i.test(name)) return iso(end);
  if (/date/i.test(name)) return iso(end);
  return '';
};

export const valuesFromParameters = (
  parameters: ReportPrintParameter[]
): Record<string, any> => {
  const next: Record<string, any> = {};
  parameters.forEach(param => {
    next[param.name] = param.type === 'date' ? defaultDateValue(param.name) : '';
  });
  return next;
};
