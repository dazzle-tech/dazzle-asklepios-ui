import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import type {
  EmailSettingsCreateDTO,
  EmailSettingsResponseVM,
  EmailSettingsTestConnectionDTO,
  EmailSettingsUpdateDTO,
} from '@/types/model-types-new';

export const emailSettingsService = createApi({
  reducerPath: 'emailSettingsApi',
  baseQuery: BaseQuery,
  tagTypes: ['EmailSettings'],
  endpoints: builder => ({
    createEmailSettings: builder.mutation<EmailSettingsResponseVM, EmailSettingsCreateDTO>({
      query: emailSettings => ({
        url: '/api/notification/email-settings',
        method: 'POST',
        body: emailSettings,
      }),
      invalidatesTags: ['EmailSettings'],
    }),
    updateEmailSettings: builder.mutation<EmailSettingsResponseVM, EmailSettingsUpdateDTO>({
      query: emailSettings => ({
        url: `/api/notification/email-settings/${emailSettings.id}`,
        method: 'PUT',
        body: emailSettings,
      }),
      invalidatesTags: ['EmailSettings'],
    }),

    getAllEmailSettings: builder.query<EmailSettingsResponseVM[], void>({
      query: () => ({
        url: '/api/notification/email-settings',
        method: 'GET',
      }),
      providesTags: ['EmailSettings'],
    }),

    getEmailSettingsById: builder.query<EmailSettingsResponseVM, number>({
      query: emailSettingsId => ({
        url: `/api/notification/email-settings/${emailSettingsId}`,
        method: 'GET',
      }),
      providesTags: ['EmailSettings'],
    }),

    testEmailSettingsConnection: builder.mutation<void, EmailSettingsTestConnectionDTO>({
      query: body => ({
        url: '/api/notification/email-settings/test-connection',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useCreateEmailSettingsMutation,
  useUpdateEmailSettingsMutation,
  useGetAllEmailSettingsQuery,
  useGetEmailSettingsByIdQuery,
  useTestEmailSettingsConnectionMutation,
} = emailSettingsService;
