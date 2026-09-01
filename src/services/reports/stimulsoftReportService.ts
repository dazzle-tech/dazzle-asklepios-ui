import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { createApi } from '@reduxjs/toolkit/dist/query/react';

import { DesignerSchema } from '@/reports/stimulsoft/reportDesignerSchema';

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

export type StimulsoftPdfParams = {
  templateCode: string;
  patientId?: number;
  encounterId?: number;
  departmentId?: number;
  status?: string;
  timezone?: string;
  lang?: string;
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
  endpoints: builder => ({
    getStimulsoftReportTemplates: builder.query<
      PagedResult<StimulsoftReportTemplate>,
      PagedParams
    >({
      query: ({ page, size, sort = 'id,desc', timestamp }) => ({
        url: '/api/analytics/reports/templates',
        method: 'GET',
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
        params: { page, size, sort, timestamp },
      }),
      transformResponse: mapPagedTemplates,
      providesTags: ['StimulsoftReportTemplate'],
    }),

    getStimulsoftReportTemplateById: builder.query<StimulsoftReportTemplate, number>({
      query: id => ({
        url: `/api/analytics/reports/templates/${id}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, id) => [{ type: 'StimulsoftReportTemplate', id }],
    }),

    getStimulsoftDesignerSchema: builder.query<DesignerSchema, number | string>({
      query: idOrCode => ({
        url: `/api/analytics/reports/templates/${idOrCode}/schema`,
        method: 'GET',
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
      query: ({ templateCode, ...rest }) => ({
        url: '/api/analytics/reports/pdf',
        method: 'GET',
        params: compactParams({ templateCode, ...rest }),
        responseHandler: (response: Response) => response.blob(),
      }),
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
} = stimulsoftReportService;
