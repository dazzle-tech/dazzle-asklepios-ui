import { useEffect, useState } from 'react';
import { notify } from '@/utils/uiReducerActions';
import type { CoverageLookupItem, PagedResult } from '@/services/setup/coverageManagement/coverageManagementService';

type QueryResult = {
  data?: PagedResult<CoverageLookupItem>;
  isFetching: boolean;
};

type UsePagedLookupArgs = {
  result: QueryResult;
  page: number;
  setPage: (updater: number | ((prev: number) => number)) => void;
  search: string;
  setSearch: (value: string) => void;
  resetToken?: string | number;
};

export function useDebouncedSearch(value: string, delay = 300) {
  const [applied, setApplied] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setApplied(value.trim()), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return applied;
}

export function usePagedLookupCache({
  result,
  page,
  setPage,
  search,
  setSearch,
  resetToken
}: UsePagedLookupArgs) {
  const [cache, setCache] = useState<CoverageLookupItem[]>([]);

  useEffect(() => {
    setPage(0);
    setCache([]);
  }, [resetToken, setPage]);

  useEffect(() => {
    const rows = result.data?.data ?? [];
    setCache(previous => {
      if (page === 0) {
        return rows;
      }
      const seen = new Set(previous.map(item => item.id));
      return [...previous, ...rows.filter(item => !seen.has(item.id))];
    });
  }, [result.data, result.isFetching, page]);

  const hasMore = Boolean(result.data?.links?.next) || Number(result.data?.totalCount ?? 0) > cache.length;

  return {
    options: cache,
    search,
    setSearch,
    loading: result.isFetching,
    hasMore,
    fetchMore: () => {
      if (!result.isFetching && hasMore) {
        setPage(prev => prev + 1);
      }
    }
  };
}

export const ALL_LOOKUP_OPTION: CoverageLookupItem = {
  id: 0,
  code: 'ALL',
  name: 'All'
};

export function withAllOption(options: CoverageLookupItem[]) {
  return [ALL_LOOKUP_OPTION, ...options.filter(item => item.id !== 0)];
}

export function formatLookupLabel(item: CoverageLookupItem) {
  const base =
    item.code && item.name && item.code !== item.name
      ? `${item.code} — ${item.name}`
      : item.name || item.code || '';
  if (item.relatedName && item.relatedName !== item.name) {
    return `${base} (${item.relatedName})`;
  }
  return base;
}

export function useStatusFilter() {
  const [isActive, setIsActive] = useState(true);
  return {
    isActive,
    setIsActive,
    options: [
      { label: 'Active', value: true },
      { label: 'Inactive', value: false }
    ]
  };
}

export function emptyContract(): any {
  return {
    guarantorType: '',
    companyId: undefined,
    code: '',
    policyNumber: '',
    coverageBasis: 'GROSS',
    insurancePayerId: undefined,
    priceListSetupId: undefined,
    parentPayerId: undefined,
    className: '',
    isActive: true,
    startDate: null,
    endDate: null
  };
}

export function coverageApiError(error: any, fallback: string) {
  const data = error?.data ?? error?.error?.data ?? {};
  const rawMessage = String(data?.properties?.message || data?.message || '').replace(/^error\./i, '').trim();
  if (rawMessage && rawMessage.toLowerCase() !== 'bad request' && !rawMessage.startsWith('400 ')) {
    return rawMessage;
  }
  const title = String(data?.title || '').trim();
  if (title && title.toLowerCase() !== 'bad request') {
    return title;
  }
  const detail = String(data?.detail || '');
  if (detail && !detail.includes('ProblemDetail') && !detail.toLowerCase().includes('failed to read request')) {
    return detail;
  }
  return fallback;
}

export function notifySuccess(dispatch: any, msg: string) {
  dispatch(notify({ msg, sev: 'success' }));
}

export function notifyWarning(dispatch: any, msg: string) {
  dispatch(notify({ msg, sev: 'warning' }));
}

export function notifyError(dispatch: any, error: any, fallback: string) {
  dispatch(notify({ msg: coverageApiError(error, fallback), sev: 'error' }));
}
