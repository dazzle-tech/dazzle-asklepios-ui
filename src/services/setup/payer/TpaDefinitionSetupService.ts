import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { createApi } from '@reduxjs/toolkit/dist/query/react';
import type { TpaDefinition, TpaLinkedInsuranceCompany } from '@/types/model-types-new';

type PagedParams = {
  page: number;
  size: number;
  sort?: string;
  timestamp?: number;
};

type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};

type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: LinkMap;
};

const toId = (value: unknown): number | null => {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'object') {
    const nested = Number(
      (value as { id?: unknown; value?: unknown }).id ?? (value as { value?: unknown }).value
    );
    return Number.isFinite(nested) ? nested : null;
  }
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
};

const pickText = (...values: unknown[]) => {
  for (const value of values) {
    if (value == null || value === '') {
      continue;
    }
    const text = String(value).trim();
    if (text) {
      return text;
    }
  }
  return '';
};

const nestedCompany = (company: any) =>
  company?.nphiesPayer ??
  company?.insuranceCompany ??
  company?.payerCompany ??
  company?.payer ??
  company?.company ??
  null;

export const unwrapList = (value: unknown): any[] => {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  const obj = value as Record<string, unknown>;
  if (Array.isArray(obj.data)) {
    return obj.data;
  }
  if (Array.isArray(obj.content)) {
    return obj.content;
  }
  if (Array.isArray((obj.data as { content?: unknown })?.content)) {
    return (obj.data as { content: unknown[] }).content;
  }
  if (Array.isArray((obj.data as { data?: unknown })?.data)) {
    return (obj.data as { data: unknown[] }).data;
  }
  if (Array.isArray(obj.items)) {
    return obj.items as unknown[];
  }
  if (Array.isArray(obj.result)) {
    return obj.result as unknown[];
  }
  return [];
};

const toPagedResult = <T>(res: T[], meta: any): PagedResult<T> => {
  const h = meta?.response?.headers;
  const data = unwrapList(res);
  return {
    data,
    totalCount: Number(h?.get('X-Total-Count') ?? data.length),
    links: parseLinkHeader(h?.get('Link'))
  };
};

export const normalizeTpaDefinition = (
  tpa: any
): { id: number; tpaCode: string; name: string; isActive: boolean } | null => {
  if (tpa == null || tpa === '') {
    return null;
  }

  const nested = tpa?.tpa ?? tpa?.tpaDefinition ?? tpa?.tpaDetails ?? null;
  const source = nested && typeof nested === 'object' ? nested : typeof tpa === 'object' ? tpa : null;
  const id = toId(
    source?.id ??
      source?.tpaId ??
      source?.tpaDefinitionId ??
      tpa?.tpaId ??
      tpa?.tpaDefinitionId ??
      tpa?.id ??
      tpa?.value ??
      tpa
  );
  if (id == null) {
    return null;
  }

  const tpaCode = pickText(
    source?.tpaCode,
    source?.tpa_code,
    source?.code,
    tpa?.tpaCode,
    tpa?.tpa_code,
    tpa?.code
  );
  const name = pickText(
    source?.name,
    source?.tpaName,
    source?.label,
    tpa?.name,
    tpa?.tpaName,
    tpa?.label
  );
  const activeValue = source?.isActive ?? source?.active ?? tpa?.isActive ?? tpa?.active;
  const isActive =
    activeValue !== false &&
    activeValue !== 0 &&
    String(activeValue ?? 'true').toLowerCase() !== 'false' &&
    String(activeValue ?? '').toLowerCase() !== 'inactive';

  return { id, tpaCode, name, isActive };
};

export const normalizeLinkedInsuranceCompany = (
  company: any
): TpaLinkedInsuranceCompany | null => {
  if (company == null || typeof company !== 'object') {
    const id = toId(company);
    return id == null
      ? null
      : { id, nphiesId: '', nameEn: '', nameAr: null, isActive: true };
  }

  const nested = nestedCompany(company);
  const id = toId(
    nested?.id ??
      company?.nphiesPayerId ??
      company?.insuranceCompanyId ??
      company?.payerId ??
      company?.id ??
      company?.value
  );
  if (id == null) {
    return null;
  }

  const source = nested ?? company;
  const activeValue =
    source?.isActive ?? source?.active ?? company?.isActive ?? company?.active;
  const isActive =
    activeValue !== false &&
    activeValue !== 0 &&
    String(activeValue).toLowerCase() !== 'false' &&
    String(activeValue).toLowerCase() !== 'inactive';

  return {
    id,
    nphiesId: pickText(
      source?.nphiesId,
      source?.nphies_id,
      source?.code,
      source?.payerCompanyCode,
      source?.payerCode,
      company?.nphiesId,
      company?.nphies_id,
      company?.code,
      company?.payerCompanyCode
    ),
    nameEn: pickText(
      source?.nameEn,
      source?.name_en,
      source?.name,
      source?.englishName,
      source?.nameEnglish,
      source?.shortName,
      source?.label,
      company?.nameEn,
      company?.name_en,
      company?.name,
      company?.label
    ),
    nameAr:
      pickText(
        source?.nameAr,
        source?.name_ar,
        source?.arabicName,
        source?.nameArabic,
        company?.nameAr,
        company?.name_ar
      ) || null,
    isActive
  };
};

const toInsuranceCompanyList = (res: any): TpaLinkedInsuranceCompany[] => {
  const byId = new Map<number, TpaLinkedInsuranceCompany>();
  unwrapList(res).forEach(item => {
    const company = normalizeLinkedInsuranceCompany(item);
    if (!company) {
      return;
    }
    const existing = byId.get(company.id);
    byId.set(company.id, {
      id: company.id,
      nphiesId: company.nphiesId || existing?.nphiesId || '',
      nameEn: company.nameEn || existing?.nameEn || '',
      nameAr: company.nameAr || existing?.nameAr || null,
      isActive: company.nphiesId || company.nameEn ? company.isActive : existing?.isActive ?? company.isActive
    });
  });
  return [...byId.values()];
};

export const TpaDefinitionService = createApi({
  reducerPath: 'tpaDefinitionApi',
  baseQuery: BaseQuery,
  tagTypes: ['TpaDefinition', 'NphiesPayer'],
  endpoints: builder => ({
    getAllTpaDefinitions: builder.query<PagedResult<TpaDefinition>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/tpa-definitions',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (res: TpaDefinition[], meta) => toPagedResult(res, meta),
      providesTags: ['TpaDefinition']
    }),

    getActiveTpaDefinitions: builder.query<PagedResult<TpaDefinition>, PagedParams>({
      query: ({ page, size, sort = 'name,asc' }) => ({
        url: '/api/setup/tpa-definitions/active',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (res: TpaDefinition[], meta) => toPagedResult(res, meta),
      providesTags: ['TpaDefinition']
    }),

    getTpaDefinitionsByCode: builder.query<PagedResult<TpaDefinition>, { tpaCode: string } & PagedParams>({
      query: ({ tpaCode, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/tpa-definitions/by-code/${encodeURIComponent(tpaCode)}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (res: TpaDefinition[], meta) => toPagedResult(res, meta),
      providesTags: ['TpaDefinition']
    }),

    getTpaDefinitionsByName: builder.query<PagedResult<TpaDefinition>, { name: string } & PagedParams>({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/tpa-definitions/by-name/${encodeURIComponent(name)}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (res: TpaDefinition[], meta) => toPagedResult(res, meta),
      providesTags: ['TpaDefinition']
    }),

    getTpaDefinitionById: builder.query<TpaDefinition, number | string>({
      query: id => ({
        url: `/api/setup/tpa-definitions/${id}`,
        method: 'GET'
      }),
      providesTags: (_result, _error, id) => [{ type: 'TpaDefinition', id }]
    }),

    getTpaLinkedInsuranceCompanies: builder.query<TpaLinkedInsuranceCompany[], number | string>({
      query: id => ({
        url: `/api/setup/tpa-definitions/${id}/insurance-companies`,
        method: 'GET'
      }),
      transformResponse: toInsuranceCompanyList,
      providesTags: (_result, _error, id) => [{ type: 'TpaDefinition', id }]
    }),

    getLinkableInsuranceCompanies: builder.query<TpaLinkedInsuranceCompany[], void>({
      query: () => ({
        url: '/api/setup/tpa-definitions/linkable-insurance-companies',
        method: 'GET'
      }),
      transformResponse: toInsuranceCompanyList,
      providesTags: ['TpaDefinition', 'NphiesPayer']
    }),

    createTpaDefinition: builder.mutation<TpaDefinition, Partial<TpaDefinition>>({
      query: body => ({
        url: '/api/setup/tpa-definitions',
        method: 'POST',
        body
      }),
      invalidatesTags: ['TpaDefinition', 'NphiesPayer']
    }),

    updateTpaDefinition: builder.mutation<TpaDefinition, Partial<TpaDefinition>>({
      query: body => ({
        url: '/api/setup/tpa-definitions',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['TpaDefinition', 'NphiesPayer']
    }),

    toggleTpaDefinitionActive: builder.mutation<TpaDefinition, number | string>({
      query: id => ({
        url: `/api/setup/tpa-definitions/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['TpaDefinition', 'NphiesPayer']
    })
  })
});

export const {
  useGetAllTpaDefinitionsQuery,
  useGetActiveTpaDefinitionsQuery,
  useGetTpaDefinitionsByCodeQuery,
  useGetTpaDefinitionsByNameQuery,
  useGetTpaDefinitionByIdQuery,
  useGetTpaLinkedInsuranceCompaniesQuery,
  useGetLinkableInsuranceCompaniesQuery,
  useCreateTpaDefinitionMutation,
  useUpdateTpaDefinitionMutation,
  useToggleTpaDefinitionActiveMutation
} = TpaDefinitionService;
