import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';

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
      PageResponse<WaseelItemMapping>,
      WaseelItemMappingSearchParams
    >({
      query: ({
        page,
        size,
        sort = 'id,desc',
        search,
        itemType,
        activeOnly
      }) => ({
        url: '/api/setup/waseel/item-mapping',
        method: 'GET',
        params: {
          page,
          size,
          sort,
          ...(search ? { search } : {}),
          ...(itemType ? { itemType } : {}),
          ...(activeOnly != null ? { activeOnly } : {})
        }
      }),
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