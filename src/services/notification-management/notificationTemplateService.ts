import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import {
  NotificationTemplateChannel,
  NotificationTemplateCreateDTO,
  NotificationTemplateResponseVM,
  NotificationTemplateUpdateDTO,
} from '@/types/model-types-new';

export const notificationTemplateService = createApi({
  reducerPath: 'notificationTemplateApi',
  baseQuery: BaseQuery,
  tagTypes: ['NotificationTemplate'],
  endpoints: builder => ({
    getNotificationTemplateById: builder.query<NotificationTemplateResponseVM, number>({
      query: id => ({
        url: `/api/notification/notification-template/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'NotificationTemplate', id }],
    }),

    getNotificationTemplatesByHeader: builder.query<NotificationTemplateResponseVM[], number>({
      query: notificationHeaderId => ({
        url: `/api/notification/notification-template/by-header/${notificationHeaderId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, notificationHeaderId) => [
        { type: 'NotificationTemplate', id: `header-${notificationHeaderId}` },
        'NotificationTemplate',
      ],
    }),

    getActiveNotificationTemplatesByHeader: builder.query<NotificationTemplateResponseVM[], number>({
      query: notificationHeaderId => ({
        url: `/api/notification/notification-template/by-header/${notificationHeaderId}/active`,
        method: 'GET',
      }),
      providesTags: (_result, _error, notificationHeaderId) => [
        { type: 'NotificationTemplate', id: `header-active-${notificationHeaderId}` },
        'NotificationTemplate',
      ],
    }),

    getActiveNotificationTemplate: builder.query<
      NotificationTemplateResponseVM,
      { notificationHeaderId: number; channel: NotificationTemplateChannel; language: string }
    >({
      query: ({ notificationHeaderId, channel, language }) => ({
        url: `/api/notification/notification-template/active/${notificationHeaderId}/${channel}/${language}`,
        method: 'GET',
      }),
    }),

    createNotificationTemplate: builder.mutation<
      NotificationTemplateResponseVM,
      NotificationTemplateCreateDTO
    >({
      query: body => ({
        url: '/api/notification/notification-template',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: 'NotificationTemplate', id: `header-${body.notificationHeaderId}` },
        'NotificationTemplate',
      ],
    }),

    updateNotificationTemplate: builder.mutation<
      NotificationTemplateResponseVM,
      { id: number; body: NotificationTemplateUpdateDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/notification/notification-template/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id, body }) => [
        { type: 'NotificationTemplate', id },
        { type: 'NotificationTemplate', id: `header-${body.notificationHeaderId}` },
        'NotificationTemplate',
      ],
    }),

    toggleNotificationTemplateActive: builder.mutation<NotificationTemplateResponseVM, number>({
      query: id => ({
        url: `/api/notification/notification-template/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: ['NotificationTemplate'],
    }),

    registerWhatsAppTemplate: builder.mutation<NotificationTemplateResponseVM, number>({
      query: id => ({
        url: `/api/notification/notification-template/${id}/whatsapp/create-template`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'NotificationTemplate', id },
        'NotificationTemplate',
      ],
    }),

    updateRegisteredWhatsAppTemplate: builder.mutation<NotificationTemplateResponseVM, number>({
      query: id => ({
        url: `/api/notification/notification-template/${id}/whatsapp/update-template`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'NotificationTemplate', id },
        'NotificationTemplate',
      ],
    }),

    refreshRegisteredWhatsAppTemplate: builder.mutation<NotificationTemplateResponseVM, number>({
      query: id => ({
        url: `/api/notification/notification-template/${id}/whatsapp/refresh-template`,
        method: 'PUT',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'NotificationTemplate', id },
        'NotificationTemplate',
      ],
    }),
  }),
});

export const {
  useGetNotificationTemplateByIdQuery,
  useGetNotificationTemplatesByHeaderQuery,
  useGetActiveNotificationTemplatesByHeaderQuery,
  useLazyGetActiveNotificationTemplateQuery,
  useCreateNotificationTemplateMutation,
  useUpdateNotificationTemplateMutation,
  useToggleNotificationTemplateActiveMutation,
  useRegisterWhatsAppTemplateMutation,
  useUpdateRegisteredWhatsAppTemplateMutation,
  useRefreshRegisteredWhatsAppTemplateMutation,
} = notificationTemplateService;
