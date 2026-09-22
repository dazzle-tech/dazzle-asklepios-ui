import { useEffect, useState } from 'react';
import { notify } from '@/utils/uiReducerActions';
import { formatEnumString } from '@/utils';
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

export const APPROVAL_COVERAGE_COMPANY_LABELS: Record<string, string> = {
  WASEEL: 'Wasel',
  NPHIES: 'NPHIES'
};

export const APPROVAL_COVERAGE_COMPANY_OPTIONS = [
  { value: 'WASEEL', label: 'Wasel' },
  { value: 'NPHIES', label: 'NPHIES' }
];

export function approvalCoverageCompanyOptions(enumOptions: { value: string; label: string }[]) {
  return enumOptions.length ? enumOptions : APPROVAL_COVERAGE_COMPANY_OPTIONS;
}

export function formatLinkedInsuranceLabel(company?: {
  nphiesId?: string | null;
  nameEn?: string | null;
  nameAr?: string | null;
  name?: string | null;
} | null) {
  if (!company) {
    return '';
  }
  const code = String(company.nphiesId ?? '').trim();
  const name = String(company.nameEn ?? company.name ?? company.nameAr ?? '').trim();
  if (code && name) {
    return `${code} — ${name}`;
  }
  return name || code;
}

export function approvalCoverageCompanyLabel(value?: string | null) {
  if (!value) {
    return '-';
  }
  return APPROVAL_COVERAGE_COMPANY_LABELS[value] ?? value;
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
  const extras: string[] = [];
  const insuranceName = item.relatedName ?? item.payerName;
  if (insuranceName && insuranceName !== item.name) {
    extras.push(insuranceName);
  }
  const startDate = item.startDate ?? item.effectiveFrom;
  const endDate = item.endDate ?? item.effectiveTo;
  if (startDate || endDate) {
    extras.push([startDate, endDate].filter(Boolean).join(' → '));
  }
  return extras.length ? `${base} (${extras.join(' · ')})` : base;
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

export function coverageHeaderName(contract?: {
  companyName?: string | null;
  insurancePayerName?: string | null;
  policyNumber?: string | null;
} | null) {
  return String(contract?.companyName || contract?.insurancePayerName || contract?.policyNumber || '').trim();
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
    parentPayerName: '',
    approvalCoverageCompany: '',
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

export function discountCategoryLabel(row: any) {
  if (row?.billingItemType) {
    return formatEnumString(row.billingItemType);
  }
  if (row?.targetType === 'ALL') {
    return 'All';
  }
  return formatEnumString(row?.targetType) || '-';
}

export function discountItemLabel(row: any) {
  if (row?.serviceName) {
    return row.serviceName;
  }
  if (row?.billingItemType) {
    return `All ${formatEnumString(row.billingItemType)}`;
  }
  if (row?.targetType === 'ALL') {
    return 'All';
  }
  return '-';
}

export function exclusionTypeLabel(row: any) {
  return row?.exclusionType === 'DIAGNOSIS' ? 'Diagnosis' : 'Category';
}

export function exclusionResultLabel(row: any) {
  if (row?.exclusionType === 'DIAGNOSIS') {
    return row.diagnosisName || (row.allDiagnoses ? 'All diagnoses' : '-');
  }
  if (row?.serviceName) {
    return row.serviceName;
  }
  if (row?.billingItemType) {
    return `All ${formatEnumString(row.billingItemType)}`;
  }
  if (row?.exclusionType === 'ALL') {
    return 'All';
  }
  return '-';
}
