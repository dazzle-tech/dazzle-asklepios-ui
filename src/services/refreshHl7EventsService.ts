import { createApi } from '@reduxjs/toolkit/query/react';
import {BaseQuery } from '../newApi';

export interface IRefreshHl7EventsRequest {
    encounterId: number;
    orderTestIds: number[];
}
export const refreshHl7EventsService = createApi({
    reducerPath: "refreshHl7EventsService",
    baseQuery: BaseQuery,

    endpoints: builder => ({
        refreshHl7Events: builder.mutation<void, IRefreshHl7EventsRequest>({
            query: body => ({
                url: '/api/hl7-events/refresh',
                method: 'POST',
                body,
            }),

        }),
    }),
});
export const { useRefreshHl7EventsMutation } = refreshHl7EventsService;