import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { createApi } from '@reduxjs/toolkit/query/react';

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

export const PractitionerService = createApi({
  reducerPath: 'newPractitionerApi',
  baseQuery: BaseQuery,
  tagTypes: ['Practitioner'],
  endpoints: builder => ({
    // Get all practitioners
    getAllPractitioners: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/practitioner',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Practitioner']
    }),

    // Get practitioners by facility
    getPractitionersByFacility: builder.query<
      PagedResult<any>,
      { facilityId: number | string } & PagedParams
    >({
      query: ({ facilityId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/practitioner/by-facility/${facilityId}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Practitioner']
    }),

    // Get practitioners by specialty
    getPractitionersBySpecialty: builder.query<
      PagedResult<any>,
      { specialty: string } & PagedParams
    >({
      query: ({ specialty, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/practitioner/by-specialty/${specialty}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Practitioner']
    }),

    // Get active practitioners by sub-specialty
    getActivePractitionersBySubSpecialty: builder.query<
      PagedResult<any>,
      { specialty: string } & PagedParams
    >({
      query: ({ specialty, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/practitioner/active/by-sub-specialty/${specialty}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Practitioner']
    }),

    getPractitionerByName: builder.query<PagedResult<any>, { name: string } & PagedParams>({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/practitioner/by-name/${name}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Practitioner']
    }),

    // Get single practitioner
    getPractitionerById: builder.query<any, number | string>({
      query: id => ({
        url: `/api/setup/practitioner/${id}`,
        method: 'GET'
      }),
      providesTags: (_result, _error, id) => [{ type: 'Practitioner', id }]
    }),

    // Get active appointable practitioners
    getActiveAppointablePractitioners: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/practitioner/active-appointable',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Practitioner']
    }),

    createPractitioner: builder.mutation<any, any>({
      query: body => ({
        url: '/api/setup/practitioner',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Practitioner']
    }),

    updatePractitioner: builder.mutation<any, { id: number | string } & Record<string, any>>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/practitioner/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Practitioner', id }, 'Practitioner']
    }),

    // Toggle active status
    togglePractitionerActive: builder.mutation<any, number | string>({
      query: id => ({
        url: `/api/setup/practitioner/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Practitioner']
    }),

    getPractitionersBulk: builder.mutation<any, number[]>({
      query: ids => ({
        url: '/api/setup/practitioner/bulk',
        method: 'POST',
        body: ids
      })
    }),

    getPractitionerByUserId: builder.query<any, number>({
      query: userId => ({
        url: `/api/setup/practitioner/by-user/${userId}`,
        method: 'GET'
      }),
      providesTags: ['Practitioner']
    }),

    existsPractitionerByUserId: builder.query<boolean, number>({
      query: userId => ({
        url: `/api/setup/practitioner/exists-by-user/${userId}`,
        method: 'GET'
      }),
      providesTags: ['Practitioner']
    }),

    getSpecialistPractitioners: builder.query<
      PagedResult<any>,
      {
        facilityId: number;
        subSpecialty: string;
        page: number;
        size: number;
        sort?: string;
      }
    >({
      query: ({ facilityId, subSpecialty, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/specialists',
        method: 'GET',
        params: { facilityId, subSpecialty, page, size, sort }
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Practitioner']
    })
  })
});

export const {
  useGetAllPractitionersQuery,
  useGetPractitionersByFacilityQuery,
  useLazyGetPractitionersByFacilityQuery,
  useGetPractitionersBySpecialtyQuery,
  useLazyGetPractitionersBySpecialtyQuery,
  useGetActivePractitionersBySubSpecialtyQuery,
  useLazyGetActivePractitionersBySubSpecialtyQuery,
  useGetPractitionerByNameQuery,
  useLazyGetPractitionerByNameQuery,
  useGetPractitionerByIdQuery,
  useLazyGetPractitionerByIdQuery,
  useGetActiveAppointablePractitionersQuery,
  useLazyGetActiveAppointablePractitionersQuery,
  useCreatePractitionerMutation,
  useUpdatePractitionerMutation,
  useTogglePractitionerActiveMutation,
  useGetPractitionersBulkMutation,
  useGetPractitionerByUserIdQuery,
  useLazyGetPractitionerByUserIdQuery,
  useExistsPractitionerByUserIdQuery,
  useLazyExistsPractitionerByUserIdQuery,
  useGetSpecialistPractitionersQuery,
  useLazyGetSpecialistPractitionersQuery
} = PractitionerService;