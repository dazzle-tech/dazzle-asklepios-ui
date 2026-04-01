import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../../newApi';
import type {
  AvailabilityTemplateCreateDTO,
  AvailabilityTemplateResponseVM,
  AvailabilityTemplateUpdateDTO
} from '@/types/model-types-new';

type Id = number | string;

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
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
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
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      invalidatesTags: ['AvailabilityTemplate']
    }),

    getAvailabilityTemplate: builder.query<AvailabilityTemplateResponseVM, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/availability-templates/${id}`,
        method: 'GET'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      providesTags: ['AvailabilityTemplate']
    }),

    getAvailabilityTemplates: builder.query<AvailabilityTemplateResponseVM[], { departmentId?: Id } | void>({
      query: (params) => ({
        url: '/api/patient/availability-templates',
        method: 'GET',
        params: params?.departmentId ? { departmentId: params.departmentId } : undefined
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      providesTags: ['AvailabilityTemplate']
    }),

    toggleAvailabilityTemplateActive: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/availability-templates/${id}/toggle-active`,
        method: 'PUT'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      invalidatesTags: ['AvailabilityTemplate']
    }),

    deleteAvailabilityTemplate: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/availability-templates/${id}`,
        method: 'DELETE'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      invalidatesTags: ['AvailabilityTemplate']
    }),

    getAvailabilityTemplatesByTemplateType: builder.query<
      AvailabilityTemplateResponseVM[],
      { templateType: string }
    >({
      query: ({ templateType }) => ({
        url: '/api/patient/availability-templates/by-facility-and-type',
        method: 'GET',
        params: { templateType }
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
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
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
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
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
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
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      providesTags: ['AvailabilityTemplate']
    }),

    getAvailabilityTemplatesByStatus: builder.query<AvailabilityTemplateResponseVM[], { status: string }>({
      query: ({ status }) => ({
        url: '/api/patient/availability-templates/by-facility-and-status',
        method: 'GET',
        params: { status }
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
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
  useDeleteAvailabilityTemplateMutation,
  useGetAvailabilityTemplatesByTemplateTypeQuery,
  useLazyGetAvailabilityTemplatesByTemplateTypeQuery,
  useGetAvailabilityTemplatesByTemplateNameQuery,
  useLazyGetAvailabilityTemplatesByTemplateNameQuery,
  useGetAvailabilityTemplatesByParentTemplateIdQuery,
  useLazyGetAvailabilityTemplatesByParentTemplateIdQuery,
  useGetAvailabilityTemplatesByDepartmentIdQuery,
  useLazyGetAvailabilityTemplatesByDepartmentIdQuery,
  useGetAvailabilityTemplatesByStatusQuery,
  useLazyGetAvailabilityTemplatesByStatusQuery
} = availabilityTemplateService;
