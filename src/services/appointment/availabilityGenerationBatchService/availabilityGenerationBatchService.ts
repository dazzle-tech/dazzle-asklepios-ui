import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../../../newApi';
import type {
  ApplyAvailabilityTemplateResponseVM,
  AvailabilityGenerationBatch,
  AvailabilityGenerationBatchApplyDTO
} from '@/types/model-types-new';
import { parseLinkHeader } from '@/utils/paginationHelper';

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
      PagedResult<AvailabilityGenerationBatch>,
      { templateId: Id } & PagedParams
    >({
      query: ({ templateId, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/availability-generation-batches/template/${templateId}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (response: AvailabilityGenerationBatch[], meta) => {
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
      providesTags: ['AvailabilityGenerationBatch']
    }),

    getAvailabilityGenerationBatchById: builder.query<AvailabilityGenerationBatch, Id>({
      query: id => ({
        url: `/api/patient/availability-generation-batches/${id}`,
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
  useLazyGetAvailabilityGenerationBatchesByTemplateQuery,
  useGetAvailabilityGenerationBatchByIdQuery,
  useLazyGetAvailabilityGenerationBatchByIdQuery
} = availabilityGenerationBatchService;
