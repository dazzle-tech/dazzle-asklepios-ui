
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import {
  Configuration,
  ConfigurationCreateVM,
  ConfigurationUpdateVM,
} from '@/types/model-types-new';

type PagedParams = { page: number; size: number; sort?: string };
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

export const systemConfigurationService = createApi({
  reducerPath: 'systemConfigurationServiceApi',
  baseQuery: BaseQuery,
  tagTypes: ['Configuration'],
  endpoints: (builder) => ({

    // GET /api/setup/configuration?page=&size=&sort=
    getConfigurations: builder.query<PagedResult<Configuration>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/configuration',
        params: { page, size, sort },
      }),
      transformResponse: (response: Configuration[], meta): PagedResult<Configuration> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['Configuration'],
    }),

    // GET /api/setup/configuration/{id}
    getConfigurationById: builder.query<Configuration, number | string>({
      query: (id) => `/api/setup/configuration/${id}`,
      providesTags: ['Configuration'],
    }),

    // GET /api/setup/configuration/effective/{key}?facilityId=
    getEffectiveConfiguration: builder.query<
      Configuration,
      { key: string; facilityId?: number }
    >({
      query: ({ key, facilityId }) => ({
        url: `/api/setup/configuration/effective/${key}`,
        params: facilityId ? { facilityId } : undefined,
      }),
      providesTags: ['Configuration'],
    }),

    // POST /api/setup/configuration
    addConfiguration: builder.mutation<Configuration, ConfigurationCreateVM>({
      query: (payload) => ({
        url: '/api/setup/configuration',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Configuration'],
    }),

    // PUT /api/setup/configuration/{id}
    updateConfiguration: builder.mutation<
      Configuration,
      { id: number | string; body: ConfigurationUpdateVM }
    >({
      query: ({ id, body }) => ({
        url: `/api/setup/configuration/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Configuration'],
    }),

    // GET /api/setup/configuration/search?searchText=
    quickSearchConfigurations: builder.query<PagedResult<Configuration>, { searchText: string; page: number; size: number; sort?: string }>({
      query: ({ searchText, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/configuration/search',
        params: { searchText, page, size, sort },
      }),
      transformResponse: (response: Configuration[], meta): PagedResult<Configuration> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['Configuration'],
    }),

    // GET /api/setup/configuration/filter/value-type?valueType=
    filterByValueType: builder.query<PagedResult<Configuration>, { valueType: string; page: number; size: number; sort?: string }>({
      query: ({ valueType, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/configuration/filter/value-type',
        params: { valueType, page, size, sort },
      }),
      transformResponse: (response: Configuration[], meta): PagedResult<Configuration> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['Configuration'],
    }),

    // GET /api/setup/configuration/filter/reference-type?referenceType=
    filterByReferenceType: builder.query<PagedResult<Configuration>, { referenceType: string; page: number; size: number; sort?: string }>({
      query: ({ referenceType, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/configuration/filter/reference-type',
        params: { referenceType, page, size, sort },
      }),
      transformResponse: (response: Configuration[], meta): PagedResult<Configuration> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['Configuration'],
    }),

  }),
});

export const {
  useGetConfigurationsQuery,
  useLazyGetConfigurationsQuery,
  useGetConfigurationByIdQuery,
  useGetEffectiveConfigurationQuery,
  useAddConfigurationMutation,
  useUpdateConfigurationMutation,
  useQuickSearchConfigurationsQuery,
  useFilterByValueTypeQuery,
  useFilterByReferenceTypeQuery,
  useLazyFilterByValueTypeQuery,
  useLazyFilterByReferenceTypeQuery,
  useLazyQuickSearchConfigurationsQuery
  // useLazyGetConfigurationByKeyQuery
} = systemConfigurationService;
