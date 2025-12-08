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

export const districtCommunityService = createApi({
  reducerPath: 'districtCommunityApi',
  baseQuery: BaseQuery,
  tagTypes: ['DistrictCommunity'],
  endpoints: builder => ({
    getAllCommunities: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/community',
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['DistrictCommunity']
    }),

    getCommunitiesByDistrict: builder.query<PagedResult<any>, WithDistrict & PagedParams>({
      query: ({ districtId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/district/${districtId}/community`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['DistrictCommunity']
    }),

    getCommunitiesByName: builder.query<
      PagedResult<any>,
      WithDistrict & { name?: string } & PagedParams
    >({
      query: ({ districtId, name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/district/${districtId}/community/by-name`,
        params: { page, size, sort, name }
      }),
      transformResponse: mapPaged,
      providesTags: ['DistrictCommunity']
    }),

    addCommunity: builder.mutation<any, WithDistrict & any>({
      query: ({ districtId, ...body }) => ({
        url: `/api/setup/district/${districtId}/community`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['DistrictCommunity']
    }),

    updateCommunity: builder.mutation<any, { districtId: Id; id: Id; body: any }>({
      query: ({ districtId, id, body }) => ({
        url: `/api/setup/district/${districtId}/community/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['DistrictCommunity']
    }),

    toggleCommunityActive: builder.mutation<any, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/community/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['DistrictCommunity']
    })
  })
});

export const {
  // Queries
  useGetAllCommunitiesQuery,
  useLazyGetAllCommunitiesQuery,
  useGetCommunitiesByDistrictQuery,
  useLazyGetCommunitiesByDistrictQuery,
  useGetCommunitiesByNameQuery,
  useLazyGetCommunitiesByNameQuery,

  // Mutations
  useAddCommunityMutation,
  useUpdateCommunityMutation,
  useToggleCommunityActiveMutation
} = districtCommunityService;
