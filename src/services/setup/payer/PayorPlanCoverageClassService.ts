import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { createApi } from '@reduxjs/toolkit/dist/query/react';

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

export type PayorPlanCoverageClass = any;
export type PayorPlanCoverageClassSaveVM = any;
export type PayorPlanCoverageClassUpdateVM = any;

export const PayorPlanCoverageClassService = createApi({
  reducerPath: 'newPayorPlanCoverageClassApi',
  baseQuery: BaseQuery,
  tagTypes: ['PayorPlanCoverageClass'],
  endpoints: builder => ({
    getCoverageClassesByPlan: builder.query<
      PagedResult<PayorPlanCoverageClass>,
      PagedParams & { planId: number | string }
    >({
      query: ({ planId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/payor-plan/${planId}/coverage-class`,
        method: 'GET',
        params: {
          page,
          size,
          sort
        }
      }),
      transformResponse: (response: PayorPlanCoverageClass[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['PayorPlanCoverageClass']
    }),

    getActiveCoverageClassesByPlan: builder.query<
      PagedResult<PayorPlanCoverageClass>,
      PagedParams & { planId: number | string }
    >({
      query: ({ planId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/payor-plan/${planId}/coverage-class/active`,
        method: 'GET',
        params: {
          page,
          size,
          sort
        }
      }),
      transformResponse: (response: PayorPlanCoverageClass[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['PayorPlanCoverageClass']
    }),

    getCoverageClassById: builder.query<PayorPlanCoverageClass, number | string>({
      query: id => ({
        url: `/api/setup/payor-plan-coverage-class/${id}`,
        method: 'GET'
      }),
      providesTags: (result, error, id) => [{ type: 'PayorPlanCoverageClass', id }]
    }),

    createCoverageClass: builder.mutation<
      PayorPlanCoverageClass,
      PayorPlanCoverageClassSaveVM
    >({
      query: body => ({
        url: '/api/setup/payor-plan-coverage-class',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PayorPlanCoverageClass']
    }),

    updateCoverageClass: builder.mutation<
      PayorPlanCoverageClass,
      PayorPlanCoverageClassUpdateVM
    >({
      query: body => ({
        url: '/api/setup/payor-plan-coverage-class',
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, body: any) =>
        body?.id
          ? [{ type: 'PayorPlanCoverageClass', id: body.id }, 'PayorPlanCoverageClass']
          : ['PayorPlanCoverageClass']
    }),

    toggleCoverageClassActive: builder.mutation<PayorPlanCoverageClass, number | string>({
      query: id => ({
        url: `/api/setup/payor-plan-coverage-class/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['PayorPlanCoverageClass']
    }),

    deleteCoverageClass: builder.mutation<void, number | string>({
      query: id => ({
        url: `/api/setup/payor-plan-coverage-class/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['PayorPlanCoverageClass']
    }),

    deleteCoverageClassesByPlan: builder.mutation<void, number | string>({
      query: planId => ({
        url: `/api/setup/payor-plan/${planId}/coverage-class`,
        method: 'DELETE'
      }),
      invalidatesTags: ['PayorPlanCoverageClass']
    })
  })
});

export const {
  useGetCoverageClassesByPlanQuery,
  useLazyGetCoverageClassesByPlanQuery,
  useGetActiveCoverageClassesByPlanQuery,
  useLazyGetActiveCoverageClassesByPlanQuery,
  useGetCoverageClassByIdQuery,
  useCreateCoverageClassMutation,
  useUpdateCoverageClassMutation,
  useToggleCoverageClassActiveMutation,
  useDeleteCoverageClassMutation,
  useDeleteCoverageClassesByPlanMutation
} = PayorPlanCoverageClassService;