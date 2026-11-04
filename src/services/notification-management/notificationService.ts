import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import {
  NotificationChannel,
  NotificationEventResponseVM,
  NotificationResponseVM,
  NotificationSearchDTO,
} from '@/types/model-types-new';

export type InAppNotificationRecipientParams = {
  recipientType: string;
  recipientId: number;
};

export type CountUnreadNotificationsParams = InAppNotificationRecipientParams & {
  channel: NotificationChannel;
};

export const notificationService = createApi({
  reducerPath: 'notificationApi',
  baseQuery: BaseQuery,
  tagTypes: ['Notification'],
  endpoints: builder => ({
    getNotificationsByChannel: builder.query<NotificationResponseVM[], NotificationChannel>({
      query: channel => ({
        url: `/api/notification/notifications/channel/${channel}`,
        method: 'GET',
      }),
      transformResponse: (response: NotificationResponseVM[] | null | undefined) => response ?? [],
      providesTags: ['Notification'],
    }),

    searchNotificationsByChannel: builder.query<
      NotificationResponseVM[],
      { channel: NotificationChannel; body: NotificationSearchDTO }
    >({
      query: ({ channel, body }) => ({
        url: `/api/notification/notifications/channel/${channel}/search`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: NotificationResponseVM[] | null | undefined) => response ?? [],
      providesTags: ['Notification'],
    }),

    getNotificationById: builder.query<NotificationResponseVM, number>({
      query: id => ({
        url: `/api/notification/notifications/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Notification', id }],
    }),

    getNotificationEvents: builder.query<NotificationEventResponseVM[], number>({
      query: id => ({
        url: `/api/notification/notifications/${id}/events`,
        method: 'GET',
      }),
      transformResponse: (response: NotificationEventResponseVM[] | null | undefined) =>
        response ?? [],
      providesTags: (_result, _error, id) => [{ type: 'Notification', id }],
    }),

    cancelNotification: builder.mutation<void, number>({
      query: id => ({
        url: `/api/notification/notifications/${id}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Notification', id }, 'Notification'],
    }),

    getInAppNotifications: builder.query<
      NotificationResponseVM[],
      InAppNotificationRecipientParams
    >({
      query: ({ recipientType, recipientId }) => ({
        url: '/api/notification/notifications/in-app',
        method: 'GET',
        params: { recipientType, recipientId },
      }),
      transformResponse: (response: NotificationResponseVM[] | null | undefined) => response ?? [],
      providesTags: ['Notification'],
    }),

    getUnreadInAppNotifications: builder.query<
      NotificationResponseVM[],
      InAppNotificationRecipientParams
    >({
      query: ({ recipientType, recipientId }) => ({
        url: '/api/notification/notifications/in-app/unread',
        method: 'GET',
        params: { recipientType, recipientId },
      }),
      transformResponse: (response: NotificationResponseVM[] | null | undefined) => response ?? [],
      providesTags: ['Notification'],
    }),

    countUnreadInAppNotifications: builder.query<number, CountUnreadNotificationsParams>({
      query: ({ recipientType, recipientId, channel }) => ({
        url: '/api/notification/notifications/unread/count',
        method: 'GET',
        params: { recipientType, recipientId, channel },
      }),
      transformResponse: (response: number | null | undefined) => response ?? 0,
      providesTags: ['Notification'],
    }),

    markNotificationRead: builder.mutation<NotificationResponseVM, number>({
      query: id => ({
        url: `/api/notification/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Notification', id }, 'Notification'],
    }),

    markAllNotificationsRead: builder.mutation<NotificationResponseVM[], number>({
      query: recipientId => ({
        url: `/api/notification/notifications/read-all/${recipientId}`,
        method: 'PATCH',
      }),
      transformResponse: (response: NotificationResponseVM[] | null | undefined) => response ?? [],
      invalidatesTags: ['Notification'],
    }),

    retryNotification: builder.mutation<NotificationResponseVM, number>({
      query: id => ({
        url: `/api/notification/notifications/${id}/retry`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Notification', id }, 'Notification'],
    }),
  }),
});

export const {
  useGetNotificationsByChannelQuery,
  useSearchNotificationsByChannelQuery,
  useGetNotificationByIdQuery,
  useGetNotificationEventsQuery,
  useLazyGetNotificationByIdQuery,
  useCancelNotificationMutation,
  useGetInAppNotificationsQuery,
  useLazyGetInAppNotificationsQuery,
  useGetUnreadInAppNotificationsQuery,
  useLazyGetUnreadInAppNotificationsQuery,
  useCountUnreadInAppNotificationsQuery,
  useLazyCountUnreadInAppNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useRetryNotificationMutation,
} = notificationService;
