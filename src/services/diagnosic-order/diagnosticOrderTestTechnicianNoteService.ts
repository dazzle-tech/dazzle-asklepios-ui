import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';

export type DiagnosticOrderTestTechnicianNote = {
    id?: string;
    orderId?: string;
    orderTestId?: string;
    note?: string;
    createdBy?: string;
    createdDate?: string;
};

export type DiagnosticOrderTestTechnicianNoteCreateDTO = {
    orderId: number | string;
    orderTestId: number | string;
    note: string;
};

type PageableParams = {
    page?: number;
    size?: number;
    sort?: string;
};

type PagedResult<T> = {
    data: T[];
    totalCount: number;
};

const mapNote = (n: any): DiagnosticOrderTestTechnicianNote => ({
    ...n,
    id: n?.id != null ? String(n.id) : n.id,
    orderId: n?.orderId != null ? String(n.orderId) : n.orderId,
    orderTestId: n?.orderTestId != null ? String(n.orderTestId) : n.orderTestId,
});

export const diagnosticOrderTestTechnicianNoteService = createApi({
    reducerPath: 'diagnosticOrderTestTechnicianNoteApi',
    baseQuery: BaseQuery,
    tagTypes: ['DiagnosticOrderTestTechnicianNote'],

    endpoints: builder => ({

        createDiagnosticOrderTestTechnicianNote: builder.mutation<
            DiagnosticOrderTestTechnicianNote,
            DiagnosticOrderTestTechnicianNoteCreateDTO
        >({
            query: body => ({
                url: '/api/patient/diagnostic-order-test-notes',
                method: 'POST',
                body,
            }),
            transformResponse: (response: any) => mapNote(response),
            invalidatesTags: ['DiagnosticOrderTestTechnicianNote'],
        }),

        getDiagnosticOrderTestTechnicianNoteById: builder.query<
            DiagnosticOrderTestTechnicianNote,
            number | string
        >({
            query: id => ({
                url: `/api/patient/diagnostic-order-test-notes/${id}`,
                method: 'GET',
            }),
            transformResponse: (response: any) => mapNote(response),
            providesTags: (_r, _e, id) => [
                { type: 'DiagnosticOrderTestTechnicianNote', id },
            ],
        }),

        getNotesByOrderTestId: builder.query<
            PagedResult<DiagnosticOrderTestTechnicianNote>,
            { orderTestId: number | string } & PageableParams
        >({
            query: ({ orderTestId, ...params }) => ({
                url: `/api/patient/diagnostic-order-test-notes/by-diagnostic-order-tests/${orderTestId}`,
                method: 'GET',
                params,
            }),
            transformResponse: (
                response: any[],
                meta
            ): PagedResult<DiagnosticOrderTestTechnicianNote> => ({
                data: (response ?? []).map(mapNote),
                totalCount: Number(
                    meta?.response?.headers?.get('X-Total-Count') ?? 0
                ),
            }),
            providesTags: (_r, _e, { orderTestId }) => [
                { type: 'DiagnosticOrderTestTechnicianNote', id: `orderTest-${orderTestId}` },
            ],
        }),

        getNotesByOrderId: builder.query<
            PagedResult<DiagnosticOrderTestTechnicianNote>,
            { orderId: number | string } & PageableParams
        >({
            query: ({ orderId, ...params }) => ({
                url: `/api/patient/diagnostic-order-test-notes/by-diagnostic-orders/${orderId}`,
                method: 'GET',
                params,
            }),
            transformResponse: (
                response: any[],
                meta
            ): PagedResult<DiagnosticOrderTestTechnicianNote> => ({
                data: (response ?? []).map(mapNote),
                totalCount: Number(
                    meta?.response?.headers?.get('X-Total-Count') ?? 0
                ),
            }),
            providesTags: (_r, _e, { orderId }) => [
                { type: 'DiagnosticOrderTestTechnicianNote', id: `order-${orderId}` },
            ],
        }),

        deleteDiagnosticOrderTestTechnicianNote: builder.mutation<
            void,
            number | string
        >({
            query: id => ({
                url: `/api/patient/diagnostic-order-test-notes/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['DiagnosticOrderTestTechnicianNote'],
        }),

    }),
});

export const {
    useCreateDiagnosticOrderTestTechnicianNoteMutation,
    useGetDiagnosticOrderTestTechnicianNoteByIdQuery,
    useGetNotesByOrderTestIdQuery,
    useGetNotesByOrderIdQuery,
    useDeleteDiagnosticOrderTestTechnicianNoteMutation,
} = diagnosticOrderTestTechnicianNoteService;
