import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';

type Id = number | string;
type WithFacility = { facilityId: Id };
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

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link')),
  };
};

export const ageGroupService = createApi({
  reducerPath: 'newAgeGroupApi',
  baseQuery: BaseQuery,
  tagTypes: ['AgeGroup'],
  endpoints: (builder) => ({

    getAgeGroups: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/age-group',
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['AgeGroup'],
    }),

    getAgeGroupsByFacility: builder.query<PagedResult<any>, WithFacility & PagedParams>({
      query: ({ facilityId, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/age-group/by-facility',
        params: { facilityId, page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['AgeGroup'],
    }),

    getAgeGroupsByLabel: builder.query<
      PagedResult<any>,
      { label: string } & PagedParams
    >({
      query: ({ label, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/age-group/by-label/${encodeURIComponent(label)}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['AgeGroup'],
    }),

    getAgeGroupsByFromAge: builder.query<
      PagedResult<any>,
      { fromAge: number | string } & PagedParams
    >({
      query: ({ fromAge, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/age-group/by-from-age/${encodeURIComponent(String(fromAge))}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['AgeGroup'],
    }),

    getAgeGroupsByToAge: builder.query<
      PagedResult<any>,
      { toAge: number | string } & PagedParams
    >({
      query: ({ toAge, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/age-group/by-to-age/${encodeURIComponent(String(toAge))}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['AgeGroup'],
    }),

    addAgeGroup: builder.mutation<any, WithFacility & any>({
      query: ({ facilityId, ...body }) => ({
        url: '/api/setup/age-group',
        method: 'POST',
        params: { facilityId },
        body: { ...body, facilityId },
      }),
      invalidatesTags: ['AgeGroup'],
    }),

    
    updateAgeGroup: builder.mutation<any, WithFacility & { id: Id } & any>({
      query: ({ facilityId, id, ...body }) => ({
        url: `/api/setup/age-group/${id}`,
        method: 'PUT',
        params: { facilityId },
        body: { id, ...body },
      }),
      invalidatesTags: ['AgeGroup'],
    }),

    deleteAgeGroup: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/age-group/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AgeGroup'],
    }),
  }),
});

export const {
  // QUERIES
  useGetAgeGroupsQuery,
  useGetAgeGroupsByFacilityQuery,
  useLazyGetAgeGroupsByFacilityQuery,
  useGetAgeGroupsByLabelQuery,
  useLazyGetAgeGroupsByLabelQuery,
  useGetAgeGroupsByFromAgeQuery,
  useLazyGetAgeGroupsByFromAgeQuery,
  useGetAgeGroupsByToAgeQuery,
  useLazyGetAgeGroupsByToAgeQuery,

  // MUTATIONS
  useAddAgeGroupMutation,
  useUpdateAgeGroupMutation,
  useDeleteAgeGroupMutation,
} = ageGroupService;
