import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../../../newApi';
import type {
  ApplyAvailabilityTemplateResponseVM,
  AvailabilityGenerationBatch,
  AvailabilityGenerationBatchApplyDTO
} from '@/types/model-types-new';

type Id = number | string;

export const availabilityGenerationBatchService = createApi({
  reducerPath: 'availabilityGenerationBatchApi',
  baseQuery: BaseQuery,
  tagTypes: ['AvailabilityGenerationBatch'],
  endpoints: builder => ({
    applyAvailabilityTemplate: builder.mutation<
      ApplyAvailabilityTemplateResponseVM,
      AvailabilityGenerationBatchApplyDTO
    >({
      query: body => ({
        url: '/api/patient/availability-generation-batches/apply',
        method: 'POST',
        body
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      invalidatesTags: ['AvailabilityGenerationBatch']
    }),

    getAvailabilityGenerationBatchesByTemplate: builder.query<
      AvailabilityGenerationBatch[],
      { templateId: Id }
    >({
      query: ({ templateId }) => ({
        url: `/api/patient/availability-generation-batches/template/${templateId}`,
        method: 'GET'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      providesTags: ['AvailabilityGenerationBatch']
    })
  })
});

export const {
  useApplyAvailabilityTemplateMutation,
  useGetAvailabilityGenerationBatchesByTemplateQuery,
  useLazyGetAvailabilityGenerationBatchesByTemplateQuery
} = availabilityGenerationBatchService;
