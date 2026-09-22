import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { createApi } from '@reduxjs/toolkit/dist/query/react';

import { DesignerSchema } from '@/reports/stimulsoft/reportDesignerSchema';
import { normalizeStimulsoftTemplateJson } from '@/reports/stimulsoft/reportPrintParameters';
import {
  isStimulsoftDashboardTemplate,
  type StimulsoftTemplateType,
} from '@/reports/stimulsoft/stimulsoftDesignerMode';

type PagedParams = {
  page: number;
  size: number;
  sort?: string;
  timestamp?: number;
  templateType?: StimulsoftTemplateType;
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
  templateType?: StimulsoftTemplateType | null;
  /** Empty means the dashboard is visible to every user. */
  jobRole?: string | null;
  /** Comma-separated user ids. Empty means every user of jobRole. */
  userIds?: string | number[] | null;
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
  templateType?: StimulsoftTemplateType | null;
  jobRole?: string | null;
  userIds?: string | null;
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

export const parseUserIds = parseDepartmentIds;
export const serializeUserIds = serializeDepartmentIds;

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

const unwrapTemplate = (response: unknown): StimulsoftReportTemplate => {
  if (!response || typeof response !== 'object') {
    return {} as StimulsoftReportTemplate;
  }
  const body = response as Record<string, any>;
  const nested = body.data;
  if (
    nested &&
    typeof nested === 'object' &&
    !Array.isArray(nested) &&
    (nested.id != null || nested.code != null || nested.templateJson != null)
  ) {
    return nested as StimulsoftReportTemplate;
  }
  return body as StimulsoftReportTemplate;
};

type TemplateContext = {
  module?: string | null;
  facilityId?: number | null;
  departmentId?: number | null;
};

const matchesTemplateContext = (
  template: StimulsoftReportTemplate,
  arg: TemplateContext
) => {
  if (template.isActive === false) return false;
  if (
    arg.module &&
    template.module &&
    String(template.module).toUpperCase() !== String(arg.module).toUpperCase()
  ) {
    return false;
  }
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
};

const noStoreGet = (url: string, params: Record<string, unknown> = {}) => ({
  url,
  method: 'GET' as const,
  cache: 'no-store' as RequestCache,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
  },
  params: compactParams({
    ...params,
    _ts: Date.now(),
  }),
});

const patchCachedTemplateLists = (
  dispatch: (action: unknown) => void,
  getState: () => unknown,
  patch: (draft: PagedResult<StimulsoftReportTemplate>) => void
) => {
  const api = stimulsoftReportService;
  api.util
    .selectCachedArgsForQuery(getState(), 'getStimulsoftReportTemplates')
    .forEach(args => {
      dispatch(
        api.util.updateQueryData('getStimulsoftReportTemplates', args, draft => {
          if (draft?.data) patch(draft);
        })
      );
    });
  api.util
    .selectCachedArgsForQuery(getState(), 'getStimulsoftReportTemplatesByName')
    .forEach(args => {
      dispatch(
        api.util.updateQueryData(
          'getStimulsoftReportTemplatesByName',
          args,
          draft => {
            if (draft?.data) patch(draft);
          }
        )
      );
    });
};

const applyTemplateToPagedList = (
  draft: PagedResult<StimulsoftReportTemplate>,
  template: StimulsoftReportTemplate,
  fallbackId?: number
) => {
  const id = template.id ?? fallbackId;
  if (id == null) return;
  const row = draft.data.find(item => item.id === id);
  if (row) {
    Object.assign(row, template);
    return;
  }
  draft.data = [template, ...draft.data];
  draft.totalCount = (draft.totalCount ?? 0) + 1;
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
      query: ({ page, size, sort = 'id,desc', templateType }) =>
        noStoreGet('/api/analytics/reports/templates', {
          page,
          size,
          sort,
          templateType,
        }),
      transformResponse: mapPagedTemplates,
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { timestamp, ...rest } = queryArgs;
        return `${endpointName}(${JSON.stringify(rest)})`;
      },
      providesTags: ['StimulsoftReportTemplate'],
      forceRefetch: () => true,
    }),

    getStimulsoftReportTemplatesByName: builder.query<
      PagedResult<StimulsoftReportTemplate>,
      { name: string } & PagedParams
    >({
      query: ({ name, page, size, sort, templateType }) =>
        noStoreGet(
          `/api/analytics/reports/templates/by-name/${encodeURIComponent(name)}`,
          { page, size, sort, templateType }
        ),
      transformResponse: mapPagedTemplates,
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { timestamp, ...rest } = queryArgs;
        return `${endpointName}(${JSON.stringify(rest)})`;
      },
      providesTags: ['StimulsoftReportTemplate'],
      forceRefetch: () => true,
    }),

    getStimulsoftReportTemplateById: builder.query<StimulsoftReportTemplate, number>({
      query: id => noStoreGet(`/api/analytics/reports/templates/${id}`),
      transformResponse: (response: unknown): StimulsoftReportTemplate => {
        const record = unwrapTemplate(response);
        return {
          ...record,
          templateJson: normalizeStimulsoftTemplateJson(record),
        };
      },
      providesTags: (_r, _e, id) => [{ type: 'StimulsoftReportTemplate', id }],
      forceRefetch: () => true,
    }),

    getStimulsoftDesignerSchema: builder.query<DesignerSchema, number | string>({
      query: idOrCode =>
        noStoreGet(`/api/analytics/reports/templates/${idOrCode}/schema`),
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
      transformResponse: unwrapTemplate,
      invalidatesTags: ['StimulsoftReportTemplate'],
      async onQueryStarted(_body, { dispatch, getState, queryFulfilled }) {
        try {
          const { data: created } = await queryFulfilled;
          if (!created?.id) return;
          patchCachedTemplateLists(dispatch, getState, draft => {
            applyTemplateToPagedList(draft, created);
          });
        } catch {
          // list refetch from invalidatesTags still runs
        }
      },
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
      transformResponse: unwrapTemplate,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'StimulsoftReportTemplate', id },
        'StimulsoftReportTemplate',
      ],
      async onQueryStarted({ id, ...body }, { dispatch, getState, queryFulfilled }) {
        try {
          const { data: updated } = await queryFulfilled;
          patchCachedTemplateLists(dispatch, getState, draft => {
            applyTemplateToPagedList(
              draft,
              { ...body, ...updated, id: updated?.id ?? id },
              id
            );
          });
        } catch {
          // list refetch from invalidatesTags still runs
        }
      },
    }),

    toggleStimulsoftReportTemplateActive: builder.mutation<
      StimulsoftReportTemplate,
      number
    >({
      query: id => ({
        url: `/api/analytics/reports/templates/${id}/toggle-active`,
        method: 'PATCH',
      }),
      transformResponse: unwrapTemplate,
      invalidatesTags: (_r, _e, id) => [
        { type: 'StimulsoftReportTemplate', id },
        'StimulsoftReportTemplate',
      ],
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        try {
          const { data: updated } = await queryFulfilled;
          patchCachedTemplateLists(dispatch, getState, draft => {
            const row = draft.data.find(item => item.id === id);
            if (row && updated && Object.keys(updated).length > 0) {
              Object.assign(row, updated);
            } else if (row) {
              row.isActive = !row.isActive;
            }
          });
        } catch {
          // list refetch from invalidatesTags still runs
        }
      },
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
      query: ({ module, facilityId, departmentId }) =>
        noStoreGet('/api/analytics/reports/templates', {
          module,
          facilityId,
          departmentId,
          isActive: true,
          templateType: 'REPORT',
          page: 0,
          size: 200,
          sort: 'name,asc',
        }),
      transformResponse: (response: unknown, meta: any, arg) => {
        const mapped = mapPagedTemplates(response, meta);
        return mapped.data.filter(template => {
          if (String(template.templateType ?? '').toUpperCase() === 'DASHBOARD') {
            return false;
          }
          if (isStimulsoftDashboardTemplate(template)) return false;
          if (!template.module) return false;
          return matchesTemplateContext(template, arg);
        });
      },
      providesTags: ['StimulsoftReportTemplate'],
      forceRefetch: () => true,
    }),

    getViewableStimulsoftDashboards: builder.query<
      StimulsoftReportTemplate[],
      {
        facilityId?: number | null;
        departmentId?: number | null;
        jobRole?: string | null;
        userId?: number | null;
      }
    >({
      query: ({ facilityId, departmentId, jobRole, userId }) =>
        noStoreGet('/api/analytics/reports/dashboards', {
          facilityId,
          departmentId,
          jobRole,
          userId,
          page: 0,
          size: 200,
          sort: 'name,asc',
        }),
      transformResponse: (response: unknown, meta: any) =>
        mapPagedTemplates(response, meta).data,
      providesTags: ['StimulsoftReportTemplate'],
      forceRefetch: () => true,
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
  useGetViewableStimulsoftDashboardsQuery,
} = stimulsoftReportService;
