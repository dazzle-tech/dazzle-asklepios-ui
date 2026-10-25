import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import {
  MobileAppConfigCreateDTO,
  MobileAppConfigResponseVM,
  MobileAppConfigUpdateDTO,
} from '@/types/model-types-new';

export const mobileAppConfigService = createApi({
  reducerPath: 'mobileAppConfigApi',
  baseQuery: BaseQuery,
  tagTypes: ['MobileAppConfig'],
  endpoints: builder => ({
    getAllMobileAppConfigs: builder.query<MobileAppConfigResponseVM[], void>({
      query: () => ({
        url: '/api/setup/mobile-app-config',
        method: 'GET',
      }),
      providesTags: ['MobileAppConfig'],
    }),

    getMobileAppConfigValues: builder.query<
      { configKey: string; configType: string | null; configValue: string | null }[],
      string[]
    >({
      query: keys => ({
        url: '/api/setup/mobile-app-config/value',
        method: 'GET',
        params: { keys },
      }),
      providesTags: ['MobileAppConfig'],
    }),

    createMobileAppConfig: builder.mutation<MobileAppConfigResponseVM, MobileAppConfigCreateDTO>({
      query: body => ({
        url: '/api/setup/mobile-app-config',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MobileAppConfig'],
    }),

    updateMobileAppConfig: builder.mutation<MobileAppConfigResponseVM, MobileAppConfigUpdateDTO>({
      query: ({ id, configType, configValue }) => ({
        url: `/api/setup/mobile-app-config/${id}`,
        method: 'PUT',
        body: { configType, configValue },
      }),
      invalidatesTags: ['MobileAppConfig'],
    }),

    deleteMobileAppConfig: builder.mutation<void, number>({
      query: id => ({
        url: `/api/setup/mobile-app-config/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MobileAppConfig'],
    }),

    createMobileAppConfigImage: builder.mutation<
      MobileAppConfigResponseVM,
      { configKey: string; file: File }
    >({
      query: ({ configKey, file }) => {
        const body = new FormData();
        body.append('configKey', configKey);
        body.append('file', file);
        return {
          url: '/api/setup/mobile-app-config/image',
          method: 'POST',
          body,
        };
      },
      invalidatesTags: ['MobileAppConfig'],
    }),

    updateMobileAppConfigImage: builder.mutation<MobileAppConfigResponseVM, { id: number; file: File }>({
      query: ({ id, file }) => {
        const body = new FormData();
        body.append('file', file);
        return {
          url: `/api/setup/mobile-app-config/${id}/image`,
          method: 'PUT',
          body,
        };
      },
      invalidatesTags: ['MobileAppConfig'],
    }),
  }),
});

export const {
  useGetAllMobileAppConfigsQuery,
  useGetMobileAppConfigValuesQuery,
  useCreateMobileAppConfigMutation,
  useUpdateMobileAppConfigMutation,
  useDeleteMobileAppConfigMutation,
  useCreateMobileAppConfigImageMutation,
  useUpdateMobileAppConfigImageMutation,
} = mobileAppConfigService;
