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

export type PayorCategory = string;

export type Payor = any;
export type PayorSaveVM = any;
export type PayorUpdateVM = any;

export const PayorService = createApi({
  reducerPath: 'newPayorApi',
  baseQuery: BaseQuery,
  tagTypes: ['Payor'],
  endpoints: builder => ({
    getAllPayors: builder.query<
      PagedResult<Payor>,
      PagedParams & {
        category?: PayorCategory;
        name?: string;
        code?: string;
      }
    >({
      query: ({ page, size, sort = 'id,asc', category, name, code }) => ({
        url: '/api/setup/payor',
        method: 'GET',
        params: {
          page,
          size,
          sort,
          ...(category ? { category } : {}),
          ...(name ? { name } : {}),
          ...(code ? { code } : {})
        }
      }),
      transformResponse: (response: Payor[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Payor']
    }),

    // 🔹 Get single payor by id
    getPayorById: builder.query<Payor, number | string>({
      query: id => ({
        url: `/api/setup/payor/${id}`,
        method: 'GET'
      }),
      providesTags: (result, error, id) => [{ type: 'Payor', id }]
    }),

    // 🔹 Create payor
    createPayor: builder.mutation<Payor, PayorSaveVM>({
      query: body => ({
        url: '/api/setup/payor',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Payor']
    }),

    // 🔹 Update payor
    updatePayor: builder.mutation<Payor, PayorUpdateVM>({
      query: body => ({
        url: '/api/setup/payor',
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, body: any) =>
        body?.id ? [{ type: 'Payor', id: body.id }, 'Payor'] : ['Payor']
    }),

    // 🔹 Toggle active status
    togglePayorActive: builder.mutation<Payor, number | string>({
      query: id => ({
        url: `/api/setup/payor/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Payor']
    }),

    // 🔹 Get all active payors
    getAllActivePayors: builder.query<PagedResult<Payor>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/payor/active',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (response: Payor[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Payor']
    })
  })
});

export const {
  useGetAllPayorsQuery,
  useLazyGetAllPayorsQuery,
  useGetPayorByIdQuery,
  useCreatePayorMutation,
  useUpdatePayorMutation,
  useTogglePayorActiveMutation,
  useGetAllActivePayorsQuery,
  useLazyGetAllActivePayorsQuery
} = PayorService;
