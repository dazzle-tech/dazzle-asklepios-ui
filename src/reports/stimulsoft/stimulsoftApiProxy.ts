import config from '../../../app-config';
import { getStimulsoftAuthHeaders } from './stimulsoftAuth';

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

const normalizeVarName = (name: string) =>
  String(name || '')
    .replace(/[\s_-]/g, '')
    .toLowerCase();

const coerceVariableValue = (raw: unknown): string | null => {
  if (raw == null || raw === '') return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return toIsoDate(raw);
  }
  if (typeof raw === 'object') {
    const obj = raw as {
      year?: number;
      month?: number;
      day?: number;
      getFullYear?: () => number;
      getMonth?: () => number;
      getDate?: () => number;
    };
    if (typeof obj.getFullYear === 'function') {
      return toIsoDate(
        new Date(obj.getFullYear(), obj.getMonth?.() ?? 0, obj.getDate?.() ?? 1)
      );
    }
    if (obj.year && obj.month) {
      return `${obj.year}-${String(obj.month).padStart(2, '0')}-${String(
        obj.day ?? 1
      ).padStart(2, '0')}`;
    }
  }
  const text = String(raw).trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const us = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (us) {
    return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
  }
  return text;
};

/** Values from Preview → Parameters → Submit (onPrepareVariables). */
const previewVariableCache = new Map<string, string>();

export const cachePreviewVariables = (
  variables?: { name?: string; alias?: string; value?: unknown }[]
) => {
  if (!Array.isArray(variables)) return;
  variables.forEach(item => {
    const coerced = coerceVariableValue(item?.value);
    if (coerced == null) return;
    if (item?.name) previewVariableCache.set(normalizeVarName(item.name), coerced);
    if (item?.alias) previewVariableCache.set(normalizeVarName(item.alias), coerced);
  });
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

const listReportVariables = (report: any): any[] => {
  const variables = report?.dictionary?.variables;
  if (!variables) return [];
  if (Array.isArray(variables.list)) return variables.list;
  if (Array.isArray(variables)) return variables;
  return [];
};

const findVariable = (report: any, name: string): any => {
  const variables = report?.dictionary?.variables;
  if (typeof variables?.getByName === 'function') {
    const exact = variables.getByName(name);
    if (exact) return exact;
  }
  const want = normalizeVarName(name);
  return (
    listReportVariables(report).find((item: { name?: string; alias?: string }) => {
      const itemName = normalizeVarName(item?.name || '');
      const itemAlias = normalizeVarName(item?.alias || '');
      return itemName === want || itemAlias === want;
    }) ?? null
  );
};

const getVariableValue = (report: any, name: string): string | null => {
  const cached = previewVariableCache.get(normalizeVarName(name));
  if (cached) return cached;

  const variable = findVariable(report, name);
  const raw =
    (typeof variable?.eval === 'function' ? variable.eval(report) : null) ??
    variable?.valueObject ??
    variable?.value ??
    variable?.val ??
    (typeof report?.getVariable === 'function' ? report.getVariable(name) : null);
  return coerceVariableValue(raw);
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

/** Overwrite ?startDate=… query values with live Preview parameter values. */
const applyLiveQueryParams = (url: string, report: any): string => {
  const parsed = tryUrl(url);
  if (!parsed || !parsed.search) return url;
  let changed = false;
  parsed.searchParams.forEach((_value, key) => {
    const live = getVariableValue(report, key);
    if (live == null) return;
    if (parsed.searchParams.get(key) !== live) {
      parsed.searchParams.set(key, live);
      changed = true;
    }
  });
  if (!changed) return url;
  return `${parsed.origin}${parsed.pathname}?${parsed.searchParams.toString()}${parsed.hash}`;
};

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
  if (!report) previewVariableCache.clear();
};

const resolveHisApiRequestUrl = (url: string): string => {
  if (!url || !isHisApiPath(url)) return url;
  const expanded = toDesignerApiUrl(expandReportVariables(activeReport, url));
  return applyLiveQueryParams(expanded, activeReport);
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
  const done =
    typeof callback === 'function'
      ? callback
      : typeof args?.callback === 'function'
        ? args.callback
        : null;
  if (typeof done !== 'function') return false;
  const command = args?.command;
  if (command !== 'GetSchema' && command !== 'GetData') return false;
  const path = args?.pathData || args?.path || args?.url;
  if (!isHisApiPath(path)) return false;
  const text = fetchHisApiSync(path);
  if (text == null) return false;
  args.preventDefault = true;
  args.async = true;
  done(text);
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
 * Attach JWT on Stimulsoft JSON GETs (XHR and fetch).
 * Always rebind from the native originals so HMR cannot leave a stale wrap.
 * Do not rewrite POST/PUT — template CRUD uses RTK Query fetch to backendBaseURL.
 */
export const installStimulsoftApiInterceptor = () => {
  if (typeof window === 'undefined') return;
  const originals = originalHttp();
  interceptorInstalled = true;

  const isGet = (method: string) => String(method || 'GET').toUpperCase() === 'GET';

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ) {
    const raw = String(url);
    const rewrite = isGet(method) && isHisApiPath(raw);
    const resolved = rewrite ? resolveHisApiRequestUrl(raw) : raw;
    (this as XMLHttpRequest & { __stiHisApi?: boolean }).__stiHisApi =
      rewrite || (isGet(method) && isHisApiPath(resolved));
    const result = originals.open.call(this, method, resolved, ...(rest as []));
    if ((this as XMLHttpRequest & { __stiHisApi?: boolean }).__stiHisApi) {
      applyAuthHeadersToXhr(this);
    }
    return result;
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

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const originalUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = (
      init?.method ||
      (input instanceof Request ? input.method : 'GET')
    ).toUpperCase();

    if (method !== 'GET' || !isHisApiPath(originalUrl)) {
      return originals.fetch(input as RequestInfo, init);
    }

    const resolved = resolveHisApiRequestUrl(originalUrl);
    const headers = new Headers(
      input instanceof Request ? input.headers : init?.headers
    );
    getStimulsoftAuthHeaders().forEach(header => {
      headers.set(header.key, header.value);
    });
    if (input instanceof Request) {
      return originals.fetch(resolved, {
        headers,
        credentials: input.credentials,
        cache: input.cache,
        redirect: input.redirect,
        referrer: input.referrer,
        signal: input.signal,
      });
    }
    return originals.fetch(resolved, { ...init, headers });
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
  return Boolean(findVariable(report, name));
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
    const expanded = applyLiveQueryParams(
      expandReportVariables(processReport, source),
      processReport
    );
    if (isHisApiPath(source) || isHisApiPath(expanded)) {
      const withoutBraces = expanded.replace(PLACEHOLDER_RE, (_match, name: string) =>
        encodeURIComponent(
          getVariableValue(processReport, name) || defaultForVariable(name) || ''
        )
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

const attachPrepareVariables = (report: any) => {
  if (!report || report.__stiPreparePatched) return;
  report.__stiPreparePatched = true;
  const previous = report.onPrepareVariables;
  report.onPrepareVariables = (args: any, callback?: any) => {
    cachePreviewVariables(args?.variables);
    setActiveStimulsoftReport(args?.report ?? report);
    if (typeof previous === 'function') {
      previous.call(report, args, callback);
      return;
    }
    callback?.(args?.variables ?? args);
  };
};

/** Apply print-dialog values so JSON URLs and expressions match designer Preview. */
export const applyPrintParameterValues = (
  report: any,
  params: Record<string, string>
) => {
  const entries = Object.entries(params).filter(
    ([, value]) => value != null && String(value).trim() !== ''
  );
  cachePreviewVariables(entries.map(([name, value]) => ({ name, value })));
  setActiveStimulsoftReport(report);

  entries.forEach(([name, value]) => {
    const variable = findVariable(report, name);
    if (variable) {
      try {
        variable.value = value;
      } catch {
        /* read-only */
      }
      try {
        variable.valueObject = value;
      } catch {
        /* read-only */
      }
    }
    try {
      report.setVariable?.(name, value);
    } catch {
      /* not supported */
    }
  });

  const previous = report.onPrepareVariables;
  report.onPrepareVariables = (args: any, callback?: any) => {
    if (Array.isArray(args?.variables)) {
      args.variables.forEach((item: { name?: string; alias?: string; value?: unknown }) => {
        const key = item?.name || item?.alias;
        if (!key) return;
        const match = entries.find(
          ([name]) => normalizeVarName(name) === normalizeVarName(key)
        );
        if (match) item.value = match[1];
      });
    }
    cachePreviewVariables(args?.variables);
    cachePreviewVariables(entries.map(([name, value]) => ({ name, value })));
    if (typeof previous === 'function') {
      previous.call(report, args, callback);
      return;
    }
    callback?.(args?.variables ?? args);
  };
};

/**
 * Enable any JSON/REST endpoint added in the designer.
 * No per-API registration — JWT + same-origin proxy apply to every HIS /api URL.
 */
export const enableDynamicStimulsoftApis = (Stimulsoft: any, report: any) => {
  if (!Stimulsoft || !report) return;
  if (Stimulsoft.StiOptions?.Dictionary) {
    Stimulsoft.StiOptions.Dictionary.allowRestConnections = true;
  }
  setActiveStimulsoftReport(report);
  attachPrepareVariables(report);
  patchStimulsoftParsePath(Stimulsoft);
  installStimulsoftApiInterceptor();
  ensureVariablesFromApiPaths(Stimulsoft, report);
  listDatabases(report).forEach(applyAuthHeadersToDatabase);
};

export const prepareStimulsoftDataRequest = (report: any, args: any) => {
  if (!args) return;
  const processReport = args.report ?? report;
  cachePreviewVariables(args?.variables);
  setActiveStimulsoftReport(processReport);
  attachPrepareVariables(processReport);
  listDatabases(processReport).forEach(applyAuthHeadersToDatabase);
  rewritePathFields(args, value =>
    applyLiveQueryParams(
      toDesignerApiUrl(expandReportVariables(processReport, value)),
      processReport
    )
  );
  attachStimulsoftRequestAuth(args);
};
