import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import {
  NotificationHeaderCreateDTO,
  NotificationHeaderResponseVM,
  NotificationHeaderSearchDTO,
  NotificationHeaderUpdateDTO,
} from '@/types/model-types-new';

export const notificationHeaderService = createApi({
  reducerPath: 'notificationHeaderApi',
  baseQuery: BaseQuery,
  tagTypes: ['NotificationHeader'],
  endpoints: builder => ({
    getAllNotificationHeaders: builder.query<NotificationHeaderResponseVM[], void>({
      query: () => ({
        url: '/api/notification/notification-header',
        method: 'GET',
      }),
      providesTags: ['NotificationHeader'],
    }),

    searchNotificationHeaders: builder.query<
      NotificationHeaderResponseVM[],
      NotificationHeaderSearchDTO
    >({
      query: body => ({
        url: '/api/notification/notification-header/search',
        method: 'POST',
        body,
      }),
      providesTags: ['NotificationHeader'],
    }),

    getNotificationHeaderById: builder.query<NotificationHeaderResponseVM, number>({
      query: id => ({
        url: `/api/notification/notification-header/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'NotificationHeader', id }],
    }),

    getActiveNotificationHeader: builder.query<
      NotificationHeaderResponseVM,
      { facilityId?: number | null; code: string }
    >({
      query: ({ facilityId, code }) => ({
        url: '/api/notification/notification-header/active',
        method: 'GET',
        params: { facilityId, code },
      }),
    }),

    createNotificationHeader: builder.mutation<
      NotificationHeaderResponseVM,
      NotificationHeaderCreateDTO
    >({
      query: body => ({
        url: '/api/notification/notification-header',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['NotificationHeader'],
    }),

    updateNotificationHeader: builder.mutation<
      NotificationHeaderResponseVM,
      { id: number; body: NotificationHeaderUpdateDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/notification/notification-header/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'NotificationHeader', id },
        'NotificationHeader',
      ],
    }),

    toggleNotificationHeaderActive: builder.mutation<NotificationHeaderResponseVM, number>({
      query: id => ({
        url: `/api/notification/notification-header/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'NotificationHeader', id },
        'NotificationHeader',
      ],
    })
  }),
});

export const {
  useGetAllNotificationHeadersQuery,
  useSearchNotificationHeadersQuery,
  useLazySearchNotificationHeadersQuery,
  useGetNotificationHeaderByIdQuery,
  useLazyGetActiveNotificationHeaderQuery,
  useCreateNotificationHeaderMutation,
  useUpdateNotificationHeaderMutation,
  useToggleNotificationHeaderActiveMutation,
} = notificationHeaderService;
