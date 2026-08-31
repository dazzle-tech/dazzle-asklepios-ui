import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';

import type {
  WaseelSbsCatalog,
  WaseelSbsImportResult,
  WaseelItemMapping
} from '@/types/model-types-new';

import type {
  WaseelItemMappingRequest,
  WaseelSbsSearchParams,
  WaseelItemMappingSearchParams
} from '@/types/model-types-constructor-new';

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

export type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: {
    next?: string | null;
    prev?: string | null;
    first?: string | null;
    last?: string | null;
  };
};

const mapPagedResponse = <T>(
  response: T[] | PageResponse<T>,
  meta?: any
): PagedResult<T> => {
  if (
    response !== null &&
    !Array.isArray(response) &&
    Array.isArray(response.content)
  ) {
    return {
      data: response.content,
      totalCount: Number(response.totalElements ?? 0)
    };
  }

  const headers = meta?.response?.headers;

  return {
    data: Array.isArray(response) ? response : [],
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const waseelSbsSetupService = createApi({
  reducerPath: 'waseelSbsSetupApi',
  baseQuery: BaseQuery,
  tagTypes: ['WaseelSbs', 'WaseelItemMapping'],

  endpoints: builder => ({
    importSbsExcel: builder.mutation<WaseelSbsImportResult, File>({
      query: file => {
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: '/api/setup/waseel/sbs/import',
          method: 'POST',
          body: formData
        };
      },
      invalidatesTags: ['WaseelSbs']
    }),

    searchSbs: builder.query<PageResponse<WaseelSbsCatalog>, WaseelSbsSearchParams>({
      query: ({ page, size, search = '', sort = 'id,desc', activeOnly }) => ({
        url: '/api/setup/waseel/sbs',
        method: 'GET',
        params: {
          page,
          size,
          search,
          sort,
          ...(activeOnly != null ? { activeOnly } : {})
        }
      }),
      providesTags: ['WaseelSbs']
    }),

    getSbsById: builder.query<WaseelSbsCatalog, number>({
      query: id => ({
        url: `/api/setup/waseel/sbs/${id}`,
        method: 'GET'
      }),
      providesTags: ['WaseelSbs']
    }),

    createItemMapping: builder.mutation<WaseelItemMapping, WaseelItemMappingRequest>({
      query: body => ({
        url: '/api/setup/waseel/item-mapping',
        method: 'POST',
        body
      }),
      invalidatesTags: ['WaseelItemMapping']
    }),

    updateItemMapping: builder.mutation<
      WaseelItemMapping,
      { id: number; body: WaseelItemMappingRequest }
    >({
      query: ({ id, body }) => ({
        url: `/api/setup/waseel/item-mapping/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['WaseelItemMapping']
    }),

    searchItemMappings: builder.query<
      PagedResult<WaseelItemMapping>,
      WaseelItemMappingSearchParams
    >({
      query: ({
        page,
        size,
        sort = 'itemName,asc',
        itemType,
        itemName,
        itemCode,
        sbsCode
      }) => ({
        url: '/api/setup/waseel/item-mapping',
        method: 'GET',
        params: {
          page,
          size,
          sort,
          ...(itemType ? { itemType } : {}),
          ...(itemName ? { itemName } : {}),
          ...(itemCode ? { itemCode } : {}),
          ...(sbsCode ? { sbsCode } : {})
        }
      }),
      transformResponse: (
        response:
          | WaseelItemMapping[]
          | PageResponse<WaseelItemMapping>,
        meta
      ) =>
        mapPagedResponse<WaseelItemMapping>(
          response,
          meta
        ),
      providesTags: ['WaseelItemMapping']
    }),

    getMappingByServiceItemId: builder.query<WaseelItemMapping, number>({
      query: serviceItemId => ({
        url: `/api/setup/waseel/item-mapping/by-service-item/${serviceItemId}`,
        method: 'GET'
      }),
      providesTags: ['WaseelItemMapping']
    }),

    deactivateItemMapping: builder.mutation<void, number>({
      query: id => ({
        url: `/api/setup/waseel/item-mapping/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['WaseelItemMapping']
    })
  })
});

export const {
  useImportSbsExcelMutation,
  useSearchSbsQuery,
  useLazySearchSbsQuery,
  useGetSbsByIdQuery,
  useCreateItemMappingMutation,
  useUpdateItemMappingMutation,
  useSearchItemMappingsQuery,
  useGetMappingByServiceItemIdQuery,
  useDeactivateItemMappingMutation
} = waseelSbsSetupService;