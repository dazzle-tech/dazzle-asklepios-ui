import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import type {
  AvailabilityTemplateCreateDTO,
  AvailabilityTemplateResponseVM,
  AvailabilityTemplateUpdateDTO
} from '@/types/model-types-new';

type Id = number | string;

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

type AvailabilityTemplateLog = {
  id: number;
  templateId: number;
  operationType: string;
  logDate: string;
  logBy?: string | null;
  facilityId: number;
  departmentId: number;
  templateName: string;
  templateType: string;
  resourceId: number;
  templateColor?: string | null;
  status: string;
  versionNo: number;
  copyFromTemplateId?: number | null;
  parentTemplateId?: number | null;
  durationMinutes: number;
  defaultBufferBeforeMinutes: number;
  defaultBufferAfterMinutes: number;
  parallelCapacityValue: number;
  defaultServiceId?: number | null;
  numberOfResourcesExpected?: number | null;
  requirePractitioner: boolean;
  defaultPractitionerId?: number | null;
  requireBilling: boolean;
  requirePreAssessment: boolean;
  allowPatientPortalBooking: boolean;
  allowWalkInBooking: boolean;
  requireConfirmation: boolean;
  financialDetails: string;
  workingDays: any;
  isActive: boolean;
  createdBy: string;
  createdDate: string;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
};

export const availabilityTemplateService = createApi({
  reducerPath: 'availabilityTemplateApi',
  baseQuery: BaseQuery,
  tagTypes: ['AvailabilityTemplate'],
  endpoints: builder => ({
    createAvailabilityTemplate: builder.mutation<
      AvailabilityTemplateResponseVM,
      AvailabilityTemplateCreateDTO
    >({
      query: body => ({
        url: '/api/patient/availability-templates',
        method: 'POST',
        body
      }),
      invalidatesTags: ['AvailabilityTemplate']
    }),

    updateAvailabilityTemplate: builder.mutation<
      AvailabilityTemplateResponseVM,
      AvailabilityTemplateUpdateDTO
    >({
      query: ({ id, ...body }) => ({
        url: `/api/patient/availability-templates/${id}`,
        method: 'PUT',
        body: { id, ...body }
      }),
      invalidatesTags: ['AvailabilityTemplate']
    }),

    getAvailabilityTemplate: builder.query<AvailabilityTemplateResponseVM, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/availability-templates/${id}`,
        method: 'GET'
      }),
      providesTags: ['AvailabilityTemplate']
    }),

    getAvailabilityTemplates: builder.query<AvailabilityTemplateResponseVM[], { departmentId?: Id } | void>({
      query: (params?: { departmentId?: Id }) => ({
        url: '/api/patient/availability-templates',
        method: 'GET',
        params: params?.departmentId ? { departmentId: params.departmentId } : undefined
      }),
      providesTags: ['AvailabilityTemplate']
    }),

    toggleAvailabilityTemplateActive: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/availability-templates/${id}/toggle-active`,
        method: 'PUT'
      }),
      invalidatesTags: ['AvailabilityTemplate']
    }),

    cloneAvailabilityTemplate: builder.mutation<AvailabilityTemplateResponseVM, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/availability-templates/${id}/clone`,
        method: 'POST'
      }),
      invalidatesTags: ['AvailabilityTemplate']
    }),

    deleteAvailabilityTemplate: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/availability-templates/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['AvailabilityTemplate']
    }),

    getAvailabilityTemplatesByTemplateType: builder.query<
      AvailabilityTemplateResponseVM[],
      { templateType: string } & PagedParams
    >({
      query: ({ templateType, page = 0, size = 1000, sort = 'id,asc' }) => ({
        url: '/api/patient/availability-templates/by-facility-and-type',
        method: 'GET',
        params: { templateType, page, size, sort }
      }),
      providesTags: ['AvailabilityTemplate']
    }),

    getAvailabilityTemplatesByTemplateName: builder.query<
      AvailabilityTemplateResponseVM[],
      { templateName: string }
    >({
      query: ({ templateName }) => ({
        url: '/api/patient/availability-templates/by-facility-and-name',
        method: 'GET',
        params: { templateName }
      }),
      providesTags: ['AvailabilityTemplate']
    }),

    getAvailabilityTemplatesByParentTemplateId: builder.query<
      AvailabilityTemplateResponseVM[],
      { parentTemplateId: Id }
    >({
      query: ({ parentTemplateId }) => ({
        url: '/api/patient/availability-templates/by-facility-and-parent',
        method: 'GET',
        params: { parentTemplateId }
      }),
      providesTags: ['AvailabilityTemplate']
    }),

    getAvailabilityTemplatesByDepartmentId: builder.query<
      AvailabilityTemplateResponseVM[],
      { departmentId: Id }
    >({
      query: ({ departmentId }) => ({
        url: '/api/patient/availability-templates/by-department',
        method: 'GET',
        params: { departmentId }
      }),
      providesTags: ['AvailabilityTemplate']
    }),

    getAvailabilityTemplatesByDepartmentAndActive: builder.query<
      PagedResult<AvailabilityTemplateResponseVM>,
      { departmentId: Id; type: string; resourceId: Id } & PagedParams
    >({
      query: ({ departmentId, type, resourceId, page, size, sort = 'id,asc' }) => ({
        url: '/api/patient/availability-templates/by-department-and-status/active',
        method: 'GET',
        params: { departmentId, type, resourceId, page, size, sort }
      }),
      transformResponse: (response: AvailabilityTemplateResponseVM[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response ?? [],
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      providesTags: ['AvailabilityTemplate']
    }),
    getAvailabilityTemplatesByPublishStatus: builder.query<
      PagedResult<AvailabilityTemplateResponseVM>,
      PagedParams
    >({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/patient/availability-templates/by-facility-and-publish-status-and-bookable-department',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (response: AvailabilityTemplateResponseVM[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response ?? [],
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    }),
    getAvailabilityTemplatesByStatus: builder.query<AvailabilityTemplateResponseVM[], { status: string }>({
      query: ({ status }) => ({
        url: '/api/patient/availability-templates/by-facility-and-status',
        method: 'GET',
        params: { status }
      }),
      providesTags: ['AvailabilityTemplate']
    }),

    getAvailabilityTemplatesActiveByStatus: builder.query<
      AvailabilityTemplateResponseVM[],
      { status: string }
    >({
      query: ({ status }) => ({
        url: '/api/patient/availability-templates/active/department/by-facility-and-status',
        method: 'GET',
        params: { status }
      }),
      providesTags: ['AvailabilityTemplate']
    }),

    getAvailabilityTemplateLogs: builder.query<AvailabilityTemplateLog[], { templateId: Id }>({
      query: ({ templateId }) => ({
        url: `/api/patient/availability-templates/${templateId}/logs`,
        method: 'GET'
      }),
      providesTags: ['AvailabilityTemplate']
    })
  })
});

export const {
  useCreateAvailabilityTemplateMutation,
  useUpdateAvailabilityTemplateMutation,
  useGetAvailabilityTemplateQuery,
  useLazyGetAvailabilityTemplateQuery,
  useGetAvailabilityTemplatesQuery,
  useLazyGetAvailabilityTemplatesQuery,
  useToggleAvailabilityTemplateActiveMutation,
  useCloneAvailabilityTemplateMutation,
  useDeleteAvailabilityTemplateMutation,
  useGetAvailabilityTemplatesByTemplateTypeQuery,
  useLazyGetAvailabilityTemplatesByTemplateTypeQuery,
  useGetAvailabilityTemplatesByTemplateNameQuery,
  useLazyGetAvailabilityTemplatesByTemplateNameQuery,
  useGetAvailabilityTemplatesByParentTemplateIdQuery,
  useLazyGetAvailabilityTemplatesByParentTemplateIdQuery,
  useGetAvailabilityTemplatesByDepartmentIdQuery,
  useLazyGetAvailabilityTemplatesByDepartmentIdQuery,
  useGetAvailabilityTemplatesByDepartmentAndActiveQuery,
  useLazyGetAvailabilityTemplatesByDepartmentAndActiveQuery,
  useGetAvailabilityTemplatesByStatusQuery,
  useLazyGetAvailabilityTemplatesByStatusQuery,
  useGetAvailabilityTemplatesActiveByStatusQuery,
  useGetAvailabilityTemplateLogsQuery,
  useLazyGetAvailabilityTemplateLogsQuery,
  useGetAvailabilityTemplatesByPublishStatusQuery,
  useLazyGetAvailabilityTemplatesByPublishStatusQuery,
} = availabilityTemplateService;
