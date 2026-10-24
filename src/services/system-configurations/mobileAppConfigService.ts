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

    getMobileAppConfigValue: builder.query<{ configKey: string; configValue: string }, string>({
      query: configKey => ({
        url: `/api/setup/mobile-app-config/value/${configKey}`,
        method: 'GET',
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
      query: ({ id, configValue }) => ({
        url: `/api/setup/mobile-app-config/${id}`,
        method: 'PUT',
        body: { configValue },
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
  }),
});

export const {
  useGetAllMobileAppConfigsQuery,
  useGetMobileAppConfigValueQuery,
  useCreateMobileAppConfigMutation,
  useUpdateMobileAppConfigMutation,
  useDeleteMobileAppConfigMutation,
} = mobileAppConfigService;
