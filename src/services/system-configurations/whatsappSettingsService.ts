import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import type {
  WhatsAppSettingsCreateDTO,
  WhatsAppSettingsResponseVM,
  WhatsAppSettingsTestConnectionDTO,
  WhatsAppSettingsUpdateDTO,
} from '@/types/model-types-new';

export const whatsappSettingsService = createApi({
  reducerPath: 'whatsappSettingsApi',
  baseQuery: BaseQuery,
  tagTypes: ['WhatsAppSettings'],
  endpoints: builder => ({
    createWhatsAppSettings: builder.mutation<WhatsAppSettingsResponseVM, WhatsAppSettingsCreateDTO>({
      query: whatsAppSettings => ({
        url: '/api/notification/whatsapp-settings',
        method: 'POST',
        body: whatsAppSettings,
      }),
      invalidatesTags: ['WhatsAppSettings'],
    }),
    updateWhatsAppSettings: builder.mutation<WhatsAppSettingsResponseVM, WhatsAppSettingsUpdateDTO>({
      query: whatsAppSettings => ({
        url: `/api/notification/whatsapp-settings/${whatsAppSettings.id}`,
        method: 'PUT',
        body: whatsAppSettings,
      }),
      invalidatesTags: ['WhatsAppSettings'],
    }),

    getAllWhatsAppSettings: builder.query<WhatsAppSettingsResponseVM[], void>({
      query: () => ({
        url: '/api/notification/whatsapp-settings',
        method: 'GET',
      }),
      providesTags: ['WhatsAppSettings'],
    }),

    getWhatsAppSettingsById: builder.query<WhatsAppSettingsResponseVM, number>({
      query: whatsAppSettingsId => ({
        url: `/api/notification/whatsapp-settings/${whatsAppSettingsId}`,
        method: 'GET',
      }),
      providesTags: ['WhatsAppSettings'],
    }),

    testWhatsAppSettingsConnection: builder.mutation<void, WhatsAppSettingsTestConnectionDTO>({
      query: body => ({
        url: '/api/notification/whatsapp-settings/test-connection',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useCreateWhatsAppSettingsMutation,
  useUpdateWhatsAppSettingsMutation,
  useGetAllWhatsAppSettingsQuery,
  useGetWhatsAppSettingsByIdQuery,
  useTestWhatsAppSettingsConnectionMutation,
} = whatsappSettingsService;
