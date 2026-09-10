import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { createApi } from '@reduxjs/toolkit/dist/query/react';

import { DesignerSchema } from '@/reports/stimulsoft/reportDesignerSchema';
import { normalizeStimulsoftTemplateJson } from '@/reports/stimulsoft/reportPrintParameters';

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
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

/**
 * Stimulsoft .mrt templates stored by Spring Boot in PostgreSQL.
 *
 * Admin: small schema + template JSON only (no live patient rows).
 * User print: backend ReportDataService fills data and Stimulsoft renders PDF.
 */
/**
 * Matches Spring StimulsoftReportTemplateVM.
 */
export type StimulsoftReportTemplate = {
  id?: number;
  code: string;
  name: string;
  description?: string;
  templateJson?: string;
  isActive?: boolean;
  createdDate?: string;
  lastModifiedDate?: string;
  facilityId?: number | null;
  departmentIds?: string | null;
  module?: string | null;
};

/**
 * Matches Spring StimulsoftReportTemplateWriteDTO.
 */
export type StimulsoftReportTemplateWriteVM = {
  id?: number;
  code: string;
  name: string;
  description?: string;
  templateJson?: string;
  isActive?: boolean;
  facilityId?: number | null;
  departmentIds?: string | null;
  module?: string | null;
};

/**
 * Matches GET /api/analytics/reports/pdf
 *   templateCode  -> @RequestParam String templateCode
 *   remaining keys -> @RequestParam Map<String, String> parameters
 */
export interface StimulsoftPdfParams {
  templateCode: string;
  [key: string]: string;
}

const toPdfString = (raw: unknown): string | undefined => {
  if (raw == null || raw === '') return undefined;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }
  if (typeof raw === 'string') {
    const value = raw.trim();
    return value || undefined;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  if (typeof raw === 'boolean') return String(raw);
  return undefined;
};

export const toStimulsoftPdfParams = (
  templateCode: string,
  params: Record<string, unknown> = {}
): StimulsoftPdfParams => {
  const next: StimulsoftPdfParams = { templateCode };
  Object.entries(params).forEach(([key, raw]) => {
    if (key === 'templateCode') return;
    const value = toPdfString(raw);
    if (value !== undefined) next[key] = value;
  });
  return next;
};

const compactParams = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );

export const parseDepartmentIds = (
  value?: string | number[] | null
): number[] => {
  if (Array.isArray(value)) {
    return value.map(Number).filter(id => Number.isFinite(id) && id > 0);
  }
  if (value == null || value === '') return [];
  const raw = String(value).trim();
  if (!raw) return [];
  if (raw.startsWith('[')) {
    try {
      return parseDepartmentIds(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  return raw
    .split(/[,\s]+/)
    .map(part => Number(part.trim()))
    .filter(id => Number.isFinite(id) && id > 0);
};

export const serializeDepartmentIds = (ids?: number[] | null): string =>
  (ids ?? [])
    .map(Number)
    .filter(id => Number.isFinite(id) && id > 0)
    .join(',');

const mapPagedTemplates = (response: unknown, meta: any): PagedResult<StimulsoftReportTemplate> => {
  const headers = meta?.response?.headers;
  const headerTotal = Number(headers?.get('X-Total-Count') ?? 0);
  const links = parseLinkHeader(headers?.get('Link'));

  if (Array.isArray(response)) {
    return {
      data: response,
      totalCount: headerTotal || response.length,
      links,
    };
  }

  const body = (response ?? {}) as Record<string, any>;
  const list = Array.isArray(body.data)
    ? body.data
    : Array.isArray(body.content)
      ? body.content
      : Array.isArray(body.items)
        ? body.items
        : [];

  return {
    data: list,
    totalCount: Number(body.totalCount ?? body.totalElements ?? headerTotal ?? list.length) || 0,
    links: body.links ?? links,
  };
};

export const stimulsoftReportService = createApi({
  reducerPath: 'stimulsoftReportApi',
  baseQuery: BaseQuery,
  tagTypes: ['StimulsoftReportTemplate'],
  keepUnusedDataFor: 0,
  refetchOnMountOrArgChange: true,
  endpoints: builder => ({
    getStimulsoftReportTemplates: builder.query<
      PagedResult<StimulsoftReportTemplate>,
      PagedParams
    >({
      query: ({ page, size, sort = 'id,desc', timestamp }) => ({
        url: '/api/analytics/reports/templates',
        method: 'GET',
        cache: 'no-store' as RequestCache,
        params: { page, size, sort, timestamp },
      }),
      transformResponse: mapPagedTemplates,
      providesTags: ['StimulsoftReportTemplate'],
    }),

    getStimulsoftReportTemplatesByName: builder.query<
      PagedResult<StimulsoftReportTemplate>,
      { name: string } & PagedParams
    >({
      query: ({ name, page, size, sort, timestamp }) => ({
        url: `/api/analytics/reports/templates/by-name/${encodeURIComponent(name)}`,
        method: 'GET',
        cache: 'no-store' as RequestCache,
        params: { page, size, sort, timestamp },
      }),
      transformResponse: mapPagedTemplates,
      providesTags: ['StimulsoftReportTemplate'],
    }),

    getStimulsoftReportTemplateById: builder.query<StimulsoftReportTemplate, number>({
      query: id => ({
        url: `/api/analytics/reports/templates/${id}`,
        method: 'GET',
        cache: 'no-store' as RequestCache,
        params: { t: Date.now() },
      }),
      transformResponse: (response: unknown): StimulsoftReportTemplate => {
        const record = (
          response && typeof response === 'object' && 'data' in (response as object)
            ? (response as { data: StimulsoftReportTemplate }).data
            : response
        ) as StimulsoftReportTemplate;
        return {
          ...record,
          templateJson: normalizeStimulsoftTemplateJson(record),
        };
      },
      providesTags: (_r, _e, id) => [{ type: 'StimulsoftReportTemplate', id }],
    }),

    getStimulsoftDesignerSchema: builder.query<DesignerSchema, number | string>({
      query: idOrCode => ({
        url: `/api/analytics/reports/templates/${idOrCode}/schema`,
        method: 'GET',
        cache: 'no-store' as RequestCache,
        params: { t: Date.now() },
      }),
    }),

    createStimulsoftReportTemplate: builder.mutation<
      StimulsoftReportTemplate,
      StimulsoftReportTemplateWriteVM
    >({
      query: body => ({
        url: '/api/analytics/reports/templates',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StimulsoftReportTemplate'],
    }),

    updateStimulsoftReportTemplate: builder.mutation<
      StimulsoftReportTemplate,
      StimulsoftReportTemplateWriteVM & { id: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/analytics/reports/templates/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'StimulsoftReportTemplate', id },
        'StimulsoftReportTemplate',
      ],
    }),

    toggleStimulsoftReportTemplateActive: builder.mutation<
      StimulsoftReportTemplate,
      number
    >({
      query: id => ({
        url: `/api/analytics/reports/templates/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'StimulsoftReportTemplate', id },
        'StimulsoftReportTemplate',
      ],
    }),

    printStimulsoftReportPdf: builder.query<Blob, StimulsoftPdfParams>({
      query: params => ({
        url: '/api/analytics/reports/pdf',
        method: 'GET',
        params: compactParams(params),
        responseHandler: async (response: Response) => {
          const blob = await response.blob();
          if (!response.ok) {
            const text = await blob.text();
            let message = `Failed to generate report PDF (${response.status})`;
            try {
              const json = JSON.parse(text);
              message = json.message || json.detail || json.error || message;
            } catch {
              if (text?.trim()) message = text.slice(0, 400);
            }
            throw new Error(message);
          }
          return blob;
        },
      }),
      keepUnusedDataFor: 0,
    }),

    getPrintableStimulsoftReports: builder.query<
      StimulsoftReportTemplate[],
      { module: string; facilityId?: number | null; departmentId?: number | null }
    >({
      query: ({ module, facilityId, departmentId }) => ({
        url: '/api/analytics/reports/templates',
        method: 'GET',
        cache: 'no-store' as RequestCache,
        params: compactParams({
          module,
          facilityId,
          departmentId,
          isActive: true,
          page: 0,
          size: 200,
          sort: 'name,asc',
          t: Date.now(),
        }),
      }),
      transformResponse: (response: unknown, meta: any, arg) => {
        const mapped = mapPagedTemplates(response, meta);
        return mapped.data.filter(template => {
          if (template.isActive === false) return false;
          if (
            arg.module &&
            template.module &&
            String(template.module).toUpperCase() !== String(arg.module).toUpperCase()
          ) {
            return false;
          }
          if (!template.module) return false;
          if (
            arg.facilityId &&
            template.facilityId &&
            Number(template.facilityId) !== Number(arg.facilityId)
          ) {
            return false;
          }
          if (arg.departmentId && template.departmentIds) {
            const ids = parseDepartmentIds(template.departmentIds);
            if (ids.length > 0 && !ids.includes(Number(arg.departmentId))) {
              return false;
            }
          }
          return true;
        });
      },
      providesTags: ['StimulsoftReportTemplate'],
    }),
  }),
});

export const {
  useGetStimulsoftReportTemplatesQuery,
  useLazyGetStimulsoftReportTemplatesByNameQuery,
  useLazyGetStimulsoftReportTemplateByIdQuery,
  useLazyGetStimulsoftDesignerSchemaQuery,
  useCreateStimulsoftReportTemplateMutation,
  useUpdateStimulsoftReportTemplateMutation,
  useToggleStimulsoftReportTemplateActiveMutation,
  useLazyPrintStimulsoftReportPdfQuery,
  useGetPrintableStimulsoftReportsQuery,
  useLazyGetPrintableStimulsoftReportsQuery,
} = stimulsoftReportService;
