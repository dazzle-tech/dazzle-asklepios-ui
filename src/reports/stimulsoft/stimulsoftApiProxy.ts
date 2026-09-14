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

const hisPathname = (value?: string | null): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/api/')) return trimmed.split('?')[0];
  if (trimmed.startsWith('api/')) return `/${trimmed.split('?')[0]}`;
  const apiIndex = trimmed.indexOf('/api/');
  if (apiIndex >= 0) {
    return trimmed.slice(apiIndex).split('?')[0];
  }
  const parsed = tryUrl(trimmed);
  return parsed?.pathname?.startsWith('/api/') ? parsed.pathname : '';
};

/** Any Stimulsoft JSON URL whose path is /api/... — host does not matter. */
const isHisApiPath = (value?: string | null): boolean =>
  hisPathname(value).startsWith('/api/');

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
  const apiIndex = trimmed.indexOf('/api/');
  const fromIndex =
    apiIndex >= 0
      ? trimmed.slice(apiIndex)
      : trimmed.startsWith('api/')
        ? `/${trimmed}`
        : trimmed;
  const parsed = tryUrl(fromIndex.startsWith('/') ? fromIndex : `/${fromIndex}`);
  if (!parsed) {
    const q = fromIndex.indexOf('?');
    const path = q >= 0 ? fromIndex.slice(0, q) : fromIndex;
    const search = q >= 0 ? fromIndex.slice(q) : '';
    return `${window.location.origin}${path}${search}`;
  }
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

/** Fetch report JSON from backendBaseURL only. Does not change stored template URLs. */
const resolveReportDataUrl = (url: string): string => {
  const expanded = applyLiveQueryParams(
    expandReportVariables(activeReport, url),
    activeReport
  );
  const designerUrl = toDesignerApiUrl(expanded);
  const parsed = tryUrl(designerUrl);
  if (!parsed) return designerUrl;
  let pathname = parsed.pathname;
  const localePrefixed = pathname.match(/^\/[a-z]{2}(\/api\/.*)/i);
  if (localePrefixed) pathname = localePrefixed[1];
  if (!pathname.startsWith('/api/')) {
    pathname = hisPathname(expanded) || pathname;
  }
  const backend = String(config.backendBaseURL || '').replace(/\/$/, '');
  if (!backend) {
    return `${parsed.origin}${pathname}${parsed.search}${parsed.hash}`;
  }
  try {
    const backendUrl = new URL(backend, window.location.origin);
    if (
      backendUrl.host === window.location.host ||
      backendUrl.hostname === 'localhost' ||
      backendUrl.hostname === '127.0.0.1'
    ) {
      return `${window.location.origin}${pathname}${parsed.search}${parsed.hash}`;
    }
    return `${backend}${pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return `${parsed.origin}${pathname}${parsed.search}${parsed.hash}`;
  }
};

type OriginalXhr = {
  XHR: typeof XMLHttpRequest;
  open: typeof XMLHttpRequest.prototype.open;
  send: typeof XMLHttpRequest.prototype.send;
  fetch: typeof fetch;
};

const originalHttp = (): OriginalXhr => {
  const w = window as Window & { __stiXhrOriginal?: OriginalXhr };
  if (!w.__stiXhrOriginal) {
    w.__stiXhrOriginal = {
      XHR: window.XMLHttpRequest,
      open: XMLHttpRequest.prototype.open,
      send: XMLHttpRequest.prototype.send,
      fetch: window.fetch.bind(window),
    };
  }
  return w.__stiXhrOriginal;
};

const isHtmlBody = (text: string) => text.trim().startsWith('<');

const fetchHisApi = async (
  url: string
): Promise<{ ok: boolean; status: number; text: string }> => {
  const resolved = resolveReportDataUrl(url);
  const { fetch } = originalHttp();
  const headers = new Headers();
  headers.set('Accept', 'application/json');
  getStimulsoftAuthHeaders().forEach(header => {
    headers.set(header.key, header.value);
  });
  const response = await fetch(resolved, { method: 'GET', headers });
  const text = (await response.text()) || '';
  const ok = response.ok && !isHtmlBody(text);
  if (!ok) {
    console.error(
      `[Stimulsoft] HIS API ${response.status} ${resolved}`,
      text.slice(0, 400)
    );
  }
  return { ok, status: response.status, text };
};

const emptyJsonForCommand = (command: string) =>
  command === 'GetSchema' ? '{}' : '[]';

const DATA_COMMANDS = new Set([
  'GetSchema',
  'GetData',
  'RetrieveColumns',
  'RetrieveData',
  'TestConnection',
  'ExecuteQuery',
]);

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
  const command = String(args?.command || '');
  if (command && !DATA_COMMANDS.has(command)) return false;
  const path =
    args?.pathData || args?.path || args?.url || args?.connectionString;
  if (!isHisApiPath(path)) return false;

  args.preventDefault = true;
  args.async = true;
  fetchHisApi(path)
    .then(result => {
      if (result.ok) {
        done(result.text);
        return;
      }
      // Never let Stimulsoft retry this URL without JWT (that 401 becomes the overlay).
      done(emptyJsonForCommand(command));
    })
    .catch(error => {
      console.error('[Stimulsoft] HIS API request failed', path, error);
      done(emptyJsonForCommand(command));
    });
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

const mergeAuthHeadersList = (
  headers?: { key?: string; value?: string }[]
) => {
  const authHeaders = getStimulsoftAuthHeaders();
  const existing = Array.isArray(headers) ? headers : [];
  return [
    ...existing.filter(
      item => !AUTH_HEADER_NAMES.has(String(item?.key).toLowerCase())
    ),
    ...authHeaders,
  ];
};

const resolveHttpFilePath = (filePath: string) => {
  if (!isHisApiPath(filePath)) return filePath;
  return applyLiveQueryParams(
    toDesignerApiUrl(expandReportVariables(activeReport, filePath)),
    activeReport
  );
};

const emptyHttpBody = (binary?: boolean) => (binary ? new Uint8Array() : '[]');

/**
 * Stimulsoft dictionary/data loads go through System.IO.Http.getFile as a
 * synchronous XHR. A 401 throws "Unauthorized" and the whole dictionary tree
 * (data sources, variables, functions) stays empty.
 */
export const patchStimulsoftHttp = (Stimulsoft?: any) => {
  const sti = Stimulsoft ?? window.Stimulsoft;
  const Http = sti?.System?.IO?.Http;
  if (!Http || Http.__stiHttpPatched) return;
  Http.__stiHttpPatched = true;

  if (typeof Http.getFile === 'function') {
    const originalGetFile = Http.getFile.bind(Http);
    Http.getFile = function getFile(
      filePath: string,
      binary?: boolean,
      contentType?: string,
      headers?: { key?: string; value?: string }[],
      ...rest: unknown[]
    ) {
      const url = resolveHttpFilePath(filePath);
      try {
        return originalGetFile(
          url,
          binary,
          contentType,
          mergeAuthHeadersList(headers),
          ...rest
        );
      } catch (error) {
        if (!isHisApiPath(filePath) && !isHisApiPath(url)) throw error;
        console.warn('[Stimulsoft] data file request failed', url, error);
        return emptyHttpBody(binary);
      }
    };
  }

  if (typeof Http.getFileAsync === 'function') {
    const originalGetFileAsync = Http.getFileAsync.bind(Http);
    Http.getFileAsync = function getFileAsync(
      callback: (data: any) => void,
      filePath: string,
      binary?: boolean,
      contentType?: string,
      headers?: { key?: string; value?: string }[],
      ...rest: unknown[]
    ) {
      const url = resolveHttpFilePath(filePath);
      const done = (data: any) => {
        if (data == null && (isHisApiPath(filePath) || isHisApiPath(url))) {
          callback?.(emptyHttpBody(binary));
          return;
        }
        callback?.(data);
      };
      try {
        return originalGetFileAsync(
          done,
          url,
          binary,
          contentType,
          mergeAuthHeadersList(headers),
          ...rest
        );
      } catch (error) {
        if (!isHisApiPath(filePath) && !isHisApiPath(url)) throw error;
        console.warn('[Stimulsoft] data file request failed', url, error);
        callback?.(emptyHttpBody(binary));
      }
    };
  }

  if (typeof Http.send === 'function') {
    const originalSend = Http.send.bind(Http);
    Http.send = function send(
      method: string,
      url: string,
      body?: string,
      headers?: { key?: string; value?: string }[],
      ...rest: unknown[]
    ) {
      const resolved = resolveHttpFilePath(url);
      try {
        const result = originalSend(
          method,
          resolved,
          body,
          mergeAuthHeadersList(headers),
          ...rest
        );
        if (
          result &&
          Number(result.status) === 401 &&
          (isHisApiPath(url) || isHisApiPath(resolved))
        ) {
          return { ...result, status: 200, responseText: '[]', statusText: 'OK' };
        }
        return result;
      } catch (error) {
        if (!isHisApiPath(url) && !isHisApiPath(resolved)) throw error;
        return { status: 200, responseText: '[]', statusText: 'OK' };
      }
    };
  }
};

/**
 * Attach the current JWT to every HIS /api call from Stimulsoft.
 * Rewrite only GET URLs to the UI origin so webpack can proxy them (sync XHR
 * cannot CORS-preflight Authorization to :8080). Do not rewrite POST/PUT —
 * template CRUD uses RTK Query to backendBaseURL.
 */
export const installStimulsoftApiInterceptor = () => {
  if (typeof window === 'undefined') return;
  const originals = originalHttp();
  interceptorInstalled = true;

  if (!(window as Window & { __stiUnauthorizedGuard?: boolean }).__stiUnauthorizedGuard) {
    (window as Window & { __stiUnauthorizedGuard?: boolean }).__stiUnauthorizedGuard =
      true;
    window.addEventListener('unhandledrejection', event => {
      const reason = event.reason;
      const message = String(
        reason?.message || reason?.statusText || reason || ''
      );
      if (message === 'Unauthorized' || message.includes('Unauthorized')) {
        event.preventDefault();
        console.warn('[Stimulsoft] data request failed; JWT was already sent.');
      }
    });
  }

  const methodOf = (method: string) => String(method || 'GET').toUpperCase();
  const isGet = (method: string) => methodOf(method) === 'GET';
  const skipAuth = (method: string) => methodOf(method) === 'OPTIONS';

  const markAndOpen = function (
    xhr: XMLHttpRequest,
    nativeOpen: typeof XMLHttpRequest.prototype.open,
    method: string,
    url: string | URL,
    rest: unknown[]
  ) {
    const raw = String(url);
    const rewrite = isGet(method) && isHisApiPath(raw);
    const resolved = rewrite ? resolveHisApiRequestUrl(raw) : raw;
    const flagged = xhr as XMLHttpRequest & {
      __stiHisApi?: boolean;
      __stiUrl?: string;
    };
    flagged.__stiUrl = resolved;
    flagged.__stiHisApi =
      !skipAuth(method) && (isHisApiPath(raw) || isHisApiPath(resolved));
    const result = nativeOpen.call(xhr, method, resolved, ...(rest as []));
    if (flagged.__stiHisApi) applyAuthHeadersToXhr(xhr);
    return result;
  };

  const sendWithAuth = function (
    xhr: XMLHttpRequest,
    nativeSend: typeof XMLHttpRequest.prototype.send,
    body?: Document | XMLHttpRequestBodyInit | null
  ) {
    const flagged = xhr as XMLHttpRequest & {
      __stiHisApi?: boolean;
      __stiUrl?: string;
    };
    if (flagged.__stiHisApi || isHisApiPath(flagged.__stiUrl)) {
      applyAuthHeadersToXhr(xhr);
    }
    const result = nativeSend.call(xhr, body);
    if (
      (flagged.__stiHisApi || isHisApiPath(flagged.__stiUrl)) &&
      xhr.status === 401
    ) {
      try {
        Object.defineProperty(xhr, 'status', { configurable: true, value: 200 });
        Object.defineProperty(xhr, 'statusText', {
          configurable: true,
          value: 'OK',
        });
        Object.defineProperty(xhr, 'responseText', {
          configurable: true,
          value: '[]',
        });
        Object.defineProperty(xhr, 'response', {
          configurable: true,
          value: '[]',
        });
      } catch {
        // some browsers keep status read-only
      }
    }
    return result;
  };

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ) {
    return markAndOpen(this, originals.open, method, url, rest);
  };

  XMLHttpRequest.prototype.send = function (
    body?: Document | XMLHttpRequestBodyInit | null
  ) {
    return sendWithAuth(this, originals.send, body);
  };

  const w = window as Window & { __stiXhrWrapped?: boolean };
  if (!w.__stiXhrWrapped) {
    w.__stiXhrWrapped = true;
    const NativeXHR = originals.XHR;
    const PatchedXHR = function PatchedXHR(
      this: XMLHttpRequest
    ): XMLHttpRequest {
      const xhr = new NativeXHR();
      const nativeOpen = originals.open.bind(xhr);
      const nativeSend = originals.send.bind(xhr);
      xhr.open = function (
        method: string,
        url: string | URL,
        ...rest: unknown[]
      ) {
        return markAndOpen(xhr, nativeOpen, method, url, rest);
      } as typeof xhr.open;
      xhr.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
        return sendWithAuth(xhr, nativeSend, body);
      };
      return xhr;
    } as unknown as typeof XMLHttpRequest;
    PatchedXHR.prototype = NativeXHR.prototype;
    Object.setPrototypeOf(PatchedXHR, NativeXHR);
    window.XMLHttpRequest = PatchedXHR;
  }

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const originalUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = methodOf(
      init?.method || (input instanceof Request ? input.method : 'GET')
    );

    // Leave POST/PUT/PATCH/DELETE alone. Rebuilding those requests drops the
    // body, so template save never reaches the network.
    if (!isGet(method) || !isHisApiPath(originalUrl)) {
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
        method: 'GET',
        headers,
        credentials: input.credentials,
        cache: input.cache,
        redirect: input.redirect,
        referrer: input.referrer,
        signal: input.signal,
      });
    }
    return originals.fetch(resolved, { ...init, method: 'GET', headers });
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
  patchStimulsoftHttp(Stimulsoft);
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
