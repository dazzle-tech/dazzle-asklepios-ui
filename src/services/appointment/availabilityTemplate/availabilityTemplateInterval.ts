import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../../../newApi';
import type {
  AvailabilityTemplateIntervalCreateDTO,
  AvailabilityTemplateIntervalResponseVM,
  AvailabilityTemplateIntervalUpdateDTO
} from '@/types/model-types-new';

type Id = number | string;

export const availabilityTemplateIntervalService = createApi({
  reducerPath: 'availabilityTemplateIntervalApi',
  baseQuery: BaseQuery,
  tagTypes: ['AvailabilityTemplateInterval'],
  endpoints: builder => ({
    createAvailabilityTemplateInterval: builder.mutation<
      AvailabilityTemplateIntervalResponseVM,
      AvailabilityTemplateIntervalCreateDTO
    >({
      query: body => ({
        url: '/api/patient/availability-template-intervals',
        method: 'POST',
        body
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      invalidatesTags: ['AvailabilityTemplateInterval']
    }),

    updateAvailabilityTemplateInterval: builder.mutation<
      AvailabilityTemplateIntervalResponseVM,
      { id: Id; body: AvailabilityTemplateIntervalUpdateDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/availability-template-intervals/${id}`,
        method: 'PUT',
        body
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      invalidatesTags: ['AvailabilityTemplateInterval']
    }),

    getAvailabilityTemplateInterval: builder.query<AvailabilityTemplateIntervalResponseVM, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/availability-template-intervals/${id}`,
        method: 'GET'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      providesTags: ['AvailabilityTemplateInterval']
    }),

    getAvailabilityTemplateIntervalsByTemplateAndDay: builder.query<
      AvailabilityTemplateIntervalResponseVM[],
      { templateId: Id; dayOfWeek: string }
    >({
      query: ({ templateId, dayOfWeek }) => ({
        url: '/api/patient/availability-template-intervals/search',
        method: 'GET',
        params: { templateId, dayOfWeek }
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      providesTags: ['AvailabilityTemplateInterval']
    }),

    deleteAvailabilityTemplateInterval: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/availability-template-intervals/${id}`,
        method: 'DELETE'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      invalidatesTags: ['AvailabilityTemplateInterval']
    })
  })
});

export const {
  useCreateAvailabilityTemplateIntervalMutation,
  useUpdateAvailabilityTemplateIntervalMutation,
  useGetAvailabilityTemplateIntervalQuery,
  useLazyGetAvailabilityTemplateIntervalQuery,
  useGetAvailabilityTemplateIntervalsByTemplateAndDayQuery,
  useLazyGetAvailabilityTemplateIntervalsByTemplateAndDayQuery,
  useDeleteAvailabilityTemplateIntervalMutation
} = availabilityTemplateIntervalService;
