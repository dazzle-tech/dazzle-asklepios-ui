import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { createApi } from '@reduxjs/toolkit/dist/query/react';
import type {
  DiscountCode,
  DiscountCodeAllowedUser,
  DiscountCodeCreateDTO,
  DiscountCodeUpdateDTO,
  DiscountType
} from '@/types/model-types-new';

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

const toPagedResult = (response: DiscountCode[], meta: { response?: Response } | undefined): PagedResult<DiscountCode> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const discountCodeService = createApi({
  reducerPath: 'discountCodeApi',
  baseQuery: BaseQuery,
  tagTypes: ['DiscountCode', 'DiscountCodeAllowedUser'],
  endpoints: builder => ({
    getDiscountCodes: builder.query<PagedResult<DiscountCode>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/discount-code',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: toPagedResult,
      providesTags: ['DiscountCode']
    }),

    getDiscountCodesByFacility: builder.query<
      PagedResult<DiscountCode>,
      { facilityId: number } & PagedParams
    >({
      query: ({ facilityId, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/discount-code/by-facility',
        method: 'GET',
        params: { facilityId, page, size, sort }
      }),
      transformResponse: toPagedResult,
      providesTags: ['DiscountCode']
    }),

    getDiscountCodesByCode: builder.query<PagedResult<DiscountCode>, { code: string } & PagedParams>({
      query: ({ code, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/discount-code/by-code',
        method: 'GET',
        params: { code, page, size, sort }
      }),
      transformResponse: toPagedResult,
      providesTags: ['DiscountCode']
    }),

    getDiscountCodesByName: builder.query<PagedResult<DiscountCode>, { name: string } & PagedParams>({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/discount-code/by-name',
        method: 'GET',
        params: { name, page, size, sort }
      }),
      transformResponse: toPagedResult,
      providesTags: ['DiscountCode']
    }),

    getDiscountCodesByType: builder.query<
      PagedResult<DiscountCode>,
      { discountType: DiscountType } & PagedParams
    >({
      query: ({ discountType, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/discount-code/by-type',
        method: 'GET',
        params: { discountType, page, size, sort }
      }),
      transformResponse: toPagedResult,
      providesTags: ['DiscountCode']
    }),

    createDiscountCode: builder.mutation<DiscountCode, DiscountCodeCreateDTO>({
      query: body => ({
        url: '/api/setup/discount-code',
        method: 'POST',
        body
      }),
      invalidatesTags: ['DiscountCode']
    }),

    updateDiscountCode: builder.mutation<DiscountCode, DiscountCodeUpdateDTO>({
      query: body => ({
        url: '/api/setup/discount-code',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['DiscountCode']
    }),

    getDiscountCodeAllowedUsers: builder.query<DiscountCodeAllowedUser[], number>({
      query: discountCodeId => ({
        url: `/api/setup/discount-code/${discountCodeId}/allowed-users`,
        method: 'GET'
      }),
      providesTags: (_result, _error, discountCodeId) => [
        { type: 'DiscountCodeAllowedUser', id: discountCodeId }
      ]
    }),

    replaceDiscountCodeAllowedUsers: builder.mutation<
      DiscountCodeAllowedUser[],
      { discountCodeId: number; userIds: number[] }
    >({
      query: ({ discountCodeId, userIds }) => ({
        url: `/api/setup/discount-code/${discountCodeId}/allowed-users`,
        method: 'PUT',
        body: { userIds }
      }),
      invalidatesTags: (_result, _error, { discountCodeId }) => [
        { type: 'DiscountCodeAllowedUser', id: discountCodeId }
      ]
    }),

    toggleDiscountCodeActive: builder.mutation<DiscountCode, number>({
      query: id => ({
        url: `/api/setup/discount-code/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['DiscountCode']
    })
  })
});

export const {
  useGetDiscountCodesQuery,
  useLazyGetDiscountCodesByFacilityQuery,
  useLazyGetDiscountCodesByCodeQuery,
  useLazyGetDiscountCodesByNameQuery,
  useLazyGetDiscountCodesByTypeQuery,
  useCreateDiscountCodeMutation,
  useUpdateDiscountCodeMutation,
  useGetDiscountCodeAllowedUsersQuery,
  useReplaceDiscountCodeAllowedUsersMutation,
  useToggleDiscountCodeActiveMutation
} = discountCodeService;
