import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import {
  MobileAppConfigCreateDTO,
  MobileAppConfigResponseVM,
  MobileAppConfigUpdateDTO,
  PortalAppUpdateNotificationVM,
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
      {
        configKey: string;
        configType: string | null;
        configValue: string | null;
        description: string | null;
      }[],
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
      query: ({ id, configType, configValue, description }) => ({
        url: `/api/setup/mobile-app-config/${id}`,
        method: 'PUT',
        body: { configType, configValue, description },
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
      { configKey: string; file: File; description?: string | null }
    >({
      query: ({ configKey, file, description }) => {
        const body = new FormData();
        body.append('configKey', configKey);
        body.append('file', file);
        if (description != null && description !== '') {
          body.append('description', description);
        }
        return {
          url: '/api/setup/mobile-app-config/image',
          method: 'POST',
          body,
        };
      },
      invalidatesTags: ['MobileAppConfig'],
    }),

    updateMobileAppConfigImage: builder.mutation<
      MobileAppConfigResponseVM,
      { id: number; file?: File | null; description?: string | null }
    >({
      query: ({ id, file, description }) => {
        const body = new FormData();
        if (file) {
          body.append('file', file);
        }
        if (description != null) {
          body.append('description', description);
        }
        return {
          url: `/api/setup/mobile-app-config/${id}/image`,
          method: 'PUT',
          body,
        };
      },
      invalidatesTags: ['MobileAppConfig'],
    }),

    notifyPortalPatientsToUpdateApp: builder.mutation<PortalAppUpdateNotificationVM, void>({
      query: () => ({
        url: '/api/patient/patient-portal/notify-app-update',
        method: 'POST',
      }),
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
  useNotifyPortalPatientsToUpdateAppMutation,
} = mobileAppConfigService;
