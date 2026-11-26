type ListResult = {
  data?: unknown;
  error?: unknown;
  meta?: { response?: { headers?: { get?: (name: string) => string | null } } };
};

type ListSnapshot = {
  args: unknown;
  rows: any[];
  totalCount: number;
  refetch: (args: unknown) => Promise<ListResult>;
};

const snapshots: ListSnapshot[] = [];
const MAX_SNAPSHOTS = 40;
const MAX_PAGES = 500;

const pagingKeys = ['page', 'size', 'pageNumber', 'pageSize', 'offset', 'limit'];

const rowKey = (row: unknown): string => {
  if (row == null) return 'null';
  if (typeof row !== 'object') return String(row);
  const record = row as Record<string, unknown>;
  const id = record.id ?? record.uuid ?? record.key;
  if (id != null && id !== '') return `id:${String(id)}`;
  try {
    return JSON.stringify(row);
  } catch {
    return '';
  }
};

const extractRows = (data: unknown): any[] | null => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (Array.isArray(record.content)) return record.content;
  if (Array.isArray(record.data)) return record.data;
  return null;
};

const extractTotal = (data: unknown, result: ListResult, rowCount: number): number => {
  const headerRaw = result.meta?.response?.headers?.get?.('X-Total-Count');
  const header = headerRaw == null || headerRaw === '' ? NaN : Number(headerRaw);
  if (Number.isFinite(header)) return header;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const bodyTotal = Number(record.totalElements ?? record.totalCount ?? record.total);
    if (Number.isFinite(bodyTotal)) return bodyTotal;
  }
  return rowCount;
};

const hasPaging = (params: URLSearchParams) => pagingKeys.some(key => params.has(key));

const setQueryPaging = (url: string, page: number, size: number): string => {
  const queryAt = url.indexOf('?');
  if (queryAt < 0) return url;
  const params = new URLSearchParams(url.slice(queryAt + 1));
  if (!hasPaging(params)) return url;

  if (params.has('page')) params.set('page', String(page));
  else if (params.has('pageNumber')) params.set('pageNumber', String(page));
  else if (params.has('offset')) params.set('offset', String(page * size));
  else params.set('page', String(page));

  if (params.has('size')) params.set('size', String(size));
  if (params.has('pageSize')) params.set('pageSize', String(size));
  if (params.has('limit')) params.set('limit', String(size));
  if (!params.has('size') && !params.has('pageSize') && !params.has('limit')) {
    params.set('size', String(size));
  }
  return `${url.slice(0, queryAt)}?${params.toString()}`;
};

const pageRequest = (args: unknown, page: number, size: number): unknown | null => {
  if (typeof args === 'string') {
    const next = setQueryPaging(args, page, size);
    return next === args ? null : next;
  }
  if (!args || typeof args !== 'object') return null;

  const request = args as { url?: unknown; params?: unknown };
  const url = typeof request.url === 'string' ? request.url : '';
  const nextUrl = setQueryPaging(url, page, size);
  const params = request.params;

  if (params instanceof URLSearchParams) {
    if (!hasPaging(params) && nextUrl === url) return null;
    const nextParams = new URLSearchParams(params);
    if (hasPaging(nextParams) || nextUrl !== url) {
      if (nextParams.has('page')) nextParams.set('page', String(page));
      if (nextParams.has('pageNumber')) nextParams.set('pageNumber', String(page));
      if (nextParams.has('offset')) nextParams.set('offset', String(page * size));
      if (nextParams.has('size')) nextParams.set('size', String(size));
      if (nextParams.has('pageSize')) nextParams.set('pageSize', String(size));
      if (nextParams.has('limit')) nextParams.set('limit', String(size));
    }
    return { ...request, url: nextUrl, params: nextParams };
  }

  if (params && typeof params === 'object') {
    const current = params as Record<string, unknown>;
    const keyed = pagingKeys.some(key => key in current);
    if (!keyed && nextUrl === url) return null;
    const nextParams = { ...current };
    if ('page' in nextParams) nextParams.page = page;
    if ('pageNumber' in nextParams) nextParams.pageNumber = page;
    if ('offset' in nextParams) nextParams.offset = page * size;
    if ('size' in nextParams) nextParams.size = size;
    if ('pageSize' in nextParams) nextParams.pageSize = size;
    if ('limit' in nextParams) nextParams.limit = size;
    if (!('page' in nextParams) && !('pageNumber' in nextParams) && !('offset' in nextParams)) {
      nextParams.page = page;
    }
    if (!('size' in nextParams) && !('pageSize' in nextParams) && !('limit' in nextParams)) {
      nextParams.size = size;
    }
    return { ...request, url: nextUrl, params: nextParams };
  }

  return nextUrl === url ? null : { ...request, url: nextUrl };
};

const containsVisible = (snapshot: ListSnapshot, visible: any[], totalCount: number) => {
  if (snapshot.totalCount !== totalCount && snapshot.rows.length !== totalCount) return false;
  const have = new Set(snapshot.rows.map(rowKey));
  return visible.every(row => {
    const key = rowKey(row);
    return key !== '' && have.has(key);
  });
};

const fetchAllPages = async (snapshot: ListSnapshot, totalCount: number) => {
  const collected: any[] = [];
  const seen = new Set<string>();
  let step = Math.min(totalCount, 1000);

  for (let page = 0; page < MAX_PAGES && collected.length < totalCount; page += 1) {
    const requestSize = page === 0 ? Math.min(totalCount, 2000) : step;
    const args = pageRequest(snapshot.args, page, requestSize);
    if (!args) break;
    const result = await snapshot.refetch(args);
    if (result?.error) break;
    const batch = extractRows(result?.data) ?? [];
    if (!batch.length) break;

    let added = 0;
    batch.forEach(row => {
      const key = rowKey(row);
      if (!key || seen.has(key)) return;
      seen.add(key);
      collected.push(row);
      added += 1;
    });

    if (collected.length >= totalCount || added === 0) break;
    if (batch.length < requestSize) {
      // The server returned a smaller page than requested, then later pages use that size.
      if (page === 0) {
        step = batch.length;
        continue;
      }
      break;
    }
    step = batch.length;
  }

  return collected;
};

export const rememberListResponse = (
  args: unknown,
  result: ListResult,
  refetch: (args: unknown) => Promise<ListResult>
) => {
  try {
    if (!result || result.error || result.data == null) return;
    const method =
      args && typeof args === 'object' && 'method' in args
        ? String((args as { method?: string }).method || 'GET').toUpperCase()
        : 'GET';
    if (method !== 'GET') return;

    const rows = extractRows(result.data);
    if (!rows?.length) return;
    snapshots.unshift({
      args,
      rows: rows.slice(),
      totalCount: extractTotal(result.data, result, rows.length),
      refetch
    });
    if (snapshots.length > MAX_SNAPSHOTS) snapshots.pop();
  } catch {
    // Recording a list must not affect the request that filled the table.
  }
};

export const loadAllTableRows = async (visible: any[], totalCount?: number) => {
  const rows = Array.isArray(visible) ? visible : [];
  if (!rows.length || totalCount == null || !Number.isFinite(totalCount) || totalCount <= rows.length) {
    return rows;
  }

  const match = snapshots.find(snapshot => containsVisible(snapshot, rows, totalCount));
  if (!match) {
    throw new Error('Could not load all search results for export.');
  }
  if (match.rows.length >= totalCount) return match.rows;

  const all = await fetchAllPages(match, totalCount);
  if (all.length < totalCount) {
    throw new Error('Could not load all search results for export.');
  }
  return all;
};
