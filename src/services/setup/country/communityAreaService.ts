import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';

type Id = number | string;
type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type WithDistrict = { districtId: Id };
type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const communityAreaService = createApi({
  reducerPath: 'communityAreaApi',
  baseQuery: BaseQuery,
  tagTypes: ['CommunityArea'],
  endpoints: builder => ({
    getAllAreas: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/community-area',
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['CommunityArea']
    }),

    getAreasByDistrict: builder.query<PagedResult<any>, WithDistrict & PagedParams>({
      query: ({ districtId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/district/${districtId}/community-area`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['CommunityArea']
    }),

    getAreasByName: builder.query<PagedResult<any>, WithDistrict & { name?: string } & PagedParams>(
      {
        query: ({ districtId, name, page, size, sort = 'id,asc' }) => ({
          url: `/api/setup/district/${districtId}/community-area/by-name`,
          params: { page, size, sort, name }
        }),
        transformResponse: mapPaged,
        providesTags: ['CommunityArea']
      }
    ),

    addArea: builder.mutation<any, WithDistrict & any>({
      query: ({ districtId, ...body }) => ({
        url: `/api/setup/district/${districtId}/community-area`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['CommunityArea']
    }),

    updateArea: builder.mutation<any, { districtId: Id; id: Id; body: any }>({
      query: ({ districtId, id, body }) => ({
        url: `/api/setup/district/${districtId}/community-area/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['CommunityArea']
    }),

    toggleAreaActive: builder.mutation<any, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/community-area/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['CommunityArea']
    })
  })
});

export const {
  useGetAllAreasQuery,
  useLazyGetAllAreasQuery,
  useGetAreasByDistrictQuery,
  useLazyGetAreasByDistrictQuery,
  useGetAreasByNameQuery,
  useLazyGetAreasByNameQuery,
  useAddAreaMutation,
  useUpdateAreaMutation,
  useToggleAreaActiveMutation
} = communityAreaService;
