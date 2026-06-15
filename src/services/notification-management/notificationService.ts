import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import {
  NotificationChannel,
  NotificationResponseVM,
  NotificationSearchDTO,
} from '@/types/model-types-new';

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
      providesTags: ['Notification'],
    }),

    getNotificationById: builder.query<NotificationResponseVM, number>({
      query: id => ({
        url: `/api/notification/notifications/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Notification', id }],
    }),

    cancelNotification: builder.mutation<void, number>({
      query: id => ({
        url: `/api/notification/notifications/${id}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Notification', id }, 'Notification'],
    }),
  }),
});

export const {
  useGetNotificationsByChannelQuery,
  useSearchNotificationsByChannelQuery,
  useGetNotificationByIdQuery,
  useLazyGetNotificationByIdQuery,
  useCancelNotificationMutation,
} = notificationService;
