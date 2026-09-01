import config from '../../../app-config';
import { getStimulsoftAuthHeaders } from './loadStimulsoftDesigner';

const PATH_FIELDS = ['pathData', 'path', 'url', 'connectionString'] as const;

let activeReport: any = null;
let interceptorInstalled = false;

const listDatabases = (report: any): any[] => {
  const databases = report?.dictionary?.databases;
  if (!databases) return [];
  if (Array.isArray(databases.list)) return databases.list;
  if (Array.isArray(databases)) return databases;
  return [];
};

const tryUrl = (value?: string | null): URL | null => {
  if (!value) return null;
  try {
    return new URL(value, window.location.origin);
  } catch {
    return null;
  }
};

const backendBase = () => (config.backendBaseURL || '').replace(/\/$/, '');

const backendOrigin = () => {
  try {
    return backendBase() ? new URL(backendBase()).origin : '';
  } catch {
    return '';
  }
};

const isHisApiPath = (value?: string | null): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.startsWith('/api/') || trimmed.startsWith('api/')) return true;
  const parsed = tryUrl(trimmed);
  if (!parsed) return false;
  if (!parsed.pathname.startsWith('/api/')) return false;
  const origin = window.location.origin;
  const backend = backendOrigin();
  return parsed.origin === origin || (!!backend && parsed.origin === backend);
};

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const defaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
};

const defaultForVariable = (name: string): string | null => {
  const { startDate, endDate } = defaultDateRange();
  if (name === 'startDate' || name === 'fromDate') return startDate;
  if (name === 'endDate' || name === 'toDate') return endDate;
  if (/date/i.test(name)) return endDate;
  return null;
};

const AUTH_HEADER_NAMES = new Set(['authorization', 'id_token']);

const mergeAuthHeaders = (headers?: unknown) => {
  const authHeaders = getStimulsoftAuthHeaders();
  const existing = Array.isArray(headers) ? headers : [];
  return [
    ...existing.filter(
      (item: { key?: string }) =>
        !AUTH_HEADER_NAMES.has(String(item?.key).toLowerCase())
    ),
    ...authHeaders,
  ];
};

const getVariableValue = (report: any, name: string): string | null => {
  const variables = report?.dictionary?.variables;
  const variable =
    (typeof variables?.getByName === 'function'
      ? variables.getByName(name)
      : null) ??
    (Array.isArray(variables?.list)
      ? variables.list.find((item: { name?: string }) => item?.name === name)
      : null);
  const raw = variable?.value ?? variable?.val ?? report?.getVariable?.(name);
  if (raw == null || raw === '') return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return toIsoDate(raw);
  }
  const text = String(raw);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  return text;
};

/** Expand {variableName} placeholders Stimulsoft skipped on relative URLs. */
export const expandReportVariables = (report: any, value: string): string => {
  if (!value || value.indexOf('{') < 0) return value;
  return value.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (match, name) => {
    const resolved =
      getVariableValue(report, name) ?? defaultForVariable(name);
    return resolved == null ? match : encodeURIComponent(resolved);
  });
};

/**
 * Keep HIS /api calls on the UI origin. Stimulsoft uses synchronous XHR;
 * cross-origin + Authorization requires a CORS preflight, which sync XHR
 * cannot complete — that is why columns stayed empty.
 */
export const toDesignerApiUrl = (value?: string | null): string => {
  if (!value) return value ?? '';
  const trimmed = value.trim();
  if (!isHisApiPath(trimmed)) return trimmed;
  const parsed = tryUrl(trimmed.startsWith('api/') ? `/${trimmed}` : trimmed);
  if (!parsed) return trimmed;
  return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
};

export const toBackendApiUrl = toDesignerApiUrl;
export const toSameOriginApiUrl = toDesignerApiUrl;

/** Store portable /api/... paths in the .mrt so templates are not bound to one host. */
export const toPortableApiPath = (value?: string | null): string => {
  if (!value) return value ?? '';
  const trimmed = value.trim();
  if (!isHisApiPath(trimmed)) return trimmed;
  const parsed = tryUrl(
    trimmed.startsWith('api/') ? `/${trimmed}` : trimmed
  );
  if (!parsed) return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
};

const rewritePathFields = (
  target: any,
  rewrite: (value: string) => string
) => {
  if (!target) return;
  for (const field of PATH_FIELDS) {
    if (typeof target[field] === 'string' && target[field]) {
      target[field] = rewrite(target[field]);
    }
  }
};

const applyAuthHeadersToDatabase = (database: any) => {
  if (!database || !isHisApiPath(database.pathData || database.path || '')) {
    return;
  }
  database.headers = mergeAuthHeaders(database.headers);
};

export const makeApiPathsPortable = (report: any) => {
  listDatabases(report).forEach(database => {
    rewritePathFields(database, toPortableApiPath);
  });
};

export const attachStimulsoftRequestAuth = (args: any) => {
  if (!args) return;
  const path = args.pathData || args.path || args.url || args.connectionString;
  if (path && !isHisApiPath(path)) return;
  args.headers = mergeAuthHeaders(args.headers);
};

export const setActiveStimulsoftReport = (report: any) => {
  activeReport = report;
};

const resolveHisApiRequestUrl = (url: string): string => {
  if (!url || !isHisApiPath(url)) return url;
  return toDesignerApiUrl(expandReportVariables(activeReport, url));
};

type OriginalXhr = {
  open: typeof XMLHttpRequest.prototype.open;
  send: typeof XMLHttpRequest.prototype.send;
  fetch: typeof fetch;
};

const originalHttp = (): OriginalXhr => {
  const w = window as Window & { __stiXhrOriginal?: OriginalXhr };
  if (!w.__stiXhrOriginal) {
    w.__stiXhrOriginal = {
      open: XMLHttpRequest.prototype.open,
      send: XMLHttpRequest.prototype.send,
      fetch: window.fetch.bind(window),
    };
  }
  return w.__stiXhrOriginal;
};

const fetchHisApiSync = (url: string): string | null => {
  const resolved = resolveHisApiRequestUrl(url);
  const { open, send } = originalHttp();
  const xhr = new XMLHttpRequest();
  open.call(xhr, 'GET', resolved, false);
  applyAuthHeadersToXhr(xhr);
  send.call(xhr);
  const text = xhr.responseText || '';
  if (xhr.status < 200 || xhr.status >= 300) {
    console.error(
      `[Stimulsoft] HIS API ${xhr.status} ${resolved}`,
      text.slice(0, 240)
    );
    return null;
  }
  if (text.trim().startsWith('<')) {
    console.error(
      '[Stimulsoft] /api returned HTML instead of JSON. Restart `npm run dev` so webpack proxies /api to Spring Boot.'
    );
    return null;
  }
  return text;
};

export const tryFulfillStimulsoftApiRequest = (
  args: any,
  callback?: (data: string) => void
) => {
  if (typeof callback !== 'function') return false;
  const command = args?.command;
  if (command !== 'GetSchema' && command !== 'GetData') return false;
  const path = args?.pathData || args?.path || args?.url;
  if (!isHisApiPath(path)) return false;
  const text = fetchHisApiSync(path);
  if (text == null) return false;
  args.preventDefault = true;
  callback(text);
  return true;
};

const applyAuthHeadersToXhr = (xhr: XMLHttpRequest) => {
  getStimulsoftAuthHeaders().forEach(header => {
    try {
      xhr.setRequestHeader(header.key, header.value);
    } catch {
      // header already set
    }
  });
};

/**
 * Designer Retrieve Columns uses Stimulsoft's own GET XHR.
 * Do not wrap window.fetch or rewrite POST/PUT — template CRUD uses RTK Query fetch
 * to backendBaseURL /api/analytics/reports/templates.
 */
export const installStimulsoftApiInterceptor = () => {
  if (typeof window === 'undefined' || interceptorInstalled) return;
  const originals = originalHttp();
  interceptorInstalled = true;

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ) {
    const raw = String(url);
    const isGet = String(method).toUpperCase() === 'GET';
    const rewrite = isGet && isHisApiPath(raw);
    const resolved = rewrite ? resolveHisApiRequestUrl(raw) : raw;
    (this as XMLHttpRequest & { __stiHisApi?: boolean }).__stiHisApi = rewrite;
    return originals.open.call(this, method, resolved, ...(rest as []));
  };

  XMLHttpRequest.prototype.send = function (
    body?: Document | XMLHttpRequestBodyInit | null
  ) {
    const xhr = this as XMLHttpRequest & { __stiHisApi?: boolean };
    if (xhr.__stiHisApi) {
      applyAuthHeadersToXhr(xhr);
    }
    return originals.send.call(this, body);
  };
};

const PLACEHOLDER_RE = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

const placeholdersIn = (value: string): string[] => {
  const names: string[] = [];
  String(value || '').replace(PLACEHOLDER_RE, (_match, name: string) => {
    names.push(name);
    return _match;
  });
  return names;
};

const hasVariable = (report: any, name: string): boolean => {
  const variables = report?.dictionary?.variables;
  if (!variables) return false;
  if (typeof variables.contains === 'function') {
    return Boolean(variables.contains(name));
  }
  const list = variables.list ?? variables;
  return Array.isArray(list) && list.some((item: { name?: string }) => item?.name === name);
};

const ensureVariablesFromApiPaths = (Stimulsoft: any, report: any) => {
  if (!Stimulsoft?.Report?.Dictionary?.StiVariable || !report?.dictionary?.variables) {
    return;
  }
  listDatabases(report).forEach(database => {
    const path = String(database?.pathData || database?.path || '');
    placeholdersIn(path).forEach(name => {
      if (hasVariable(report, name)) return;
      const variable = new Stimulsoft.Report.Dictionary.StiVariable(
        'Parameters',
        name,
        name,
        name,
        String,
        defaultForVariable(name) ?? '',
        false,
        Stimulsoft.Report.StiVariableInitBy?.Value ?? 0,
        true
      );
      report.dictionary.variables.add(variable);
    });
  });
};

/**
 * Stimulsoft parsePath treats {startDate} in http(s) URLs as an expression and
 * throws if the name is not in the parser context. Expand placeholders ourselves.
 */
export const patchStimulsoftParsePath = (Stimulsoft: any) => {
  const FileDatabase = Stimulsoft?.Report?.Dictionary?.StiFileDatabase;
  if (!FileDatabase?.parsePath || FileDatabase.parsePath.__stiPatched) return;
  const originalParsePath = FileDatabase.parsePath.bind(FileDatabase);

  FileDatabase.parsePath = function (path: string, report: any) {
    const source = String(path || '');
    const processReport = report || activeReport;
    const expanded = expandReportVariables(processReport, source);
    if (isHisApiPath(source) || isHisApiPath(expanded)) {
      const withoutBraces = expanded.replace(PLACEHOLDER_RE, (_match, name: string) =>
        encodeURIComponent(defaultForVariable(name) || '')
      );
      return toDesignerApiUrl(withoutBraces);
    }
    try {
      return originalParsePath(path, report);
    } catch {
      return expanded;
    }
  };
  FileDatabase.parsePath.__stiPatched = true;
};

/**
 * Enable any JSON/REST endpoint added in the designer.
 * No per-API registration ΓÇö JWT + same-origin proxy apply to every HIS /api URL.
 */
export const enableDynamicStimulsoftApis = (Stimulsoft: any, report: any) => {
  if (!Stimulsoft || !report) return;
  if (Stimulsoft.StiOptions?.Dictionary) {
    Stimulsoft.StiOptions.Dictionary.allowRestConnections = true;
  }
  setActiveStimulsoftReport(report);
  patchStimulsoftParsePath(Stimulsoft);
  installStimulsoftApiInterceptor();
  ensureVariablesFromApiPaths(Stimulsoft, report);
  listDatabases(report).forEach(applyAuthHeadersToDatabase);
};

export const prepareStimulsoftDataRequest = (report: any, args: any) => {
  if (!args) return;
  const processReport = args.report ?? report;
  setActiveStimulsoftReport(processReport);
  listDatabases(processReport).forEach(applyAuthHeadersToDatabase);
  rewritePathFields(args, value =>
    toDesignerApiUrl(expandReportVariables(processReport, value))
  );
  attachStimulsoftRequestAuth(args);
};
