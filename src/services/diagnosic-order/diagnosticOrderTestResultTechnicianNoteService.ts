import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';

import type {
    DiagnosticOrderTestResultTechnicianNote,
    DiagnosticOrderTestResultTechnicianNoteCreateDTO,
} from '@/types/model-types-new';

const mapNote = (n: any): DiagnosticOrderTestResultTechnicianNote => ({
    ...n,
    id: n?.id != null ? Number(n.id) : n.id,
    orderId: n?.orderId != null ? Number(n.orderId) : n.orderId,
    orderTestId: n?.orderTestId != null ? Number(n.orderTestId) : n.orderTestId,
    resultId: n?.resultId != null ? Number(n.resultId) : n.resultId,
});

export const diagnosticOrderTestResultTechnicianNoteService = createApi({
    reducerPath: 'diagnosticOrderTestResultTechnicianNoteApi',
    baseQuery: BaseQuery,
    tagTypes: ['DiagnosticOrderTestResultTechnicianNote'],

    endpoints: builder => ({

        createDiagnosticOrderTestResultTechnicianNote: builder.mutation<
            DiagnosticOrderTestResultTechnicianNote,
            DiagnosticOrderTestResultTechnicianNoteCreateDTO
        >({
            query: body => ({
                url: '/api/patient/diagnostic-order-test-result-notes',
                method: 'POST',
                body,
            }),
            transformResponse: (response: any) => mapNote(response),
            invalidatesTags: ['DiagnosticOrderTestResultTechnicianNote'],
        }),

        getDiagnosticOrderTestResultTechnicianNoteById: builder.query<
            DiagnosticOrderTestResultTechnicianNote,
            number | string
        >({
            query: id => ({
                url: `/api/patient/diagnostic-order-test-result-notes/${id}`,
                method: 'GET',
            }),
            transformResponse: (response: any) => mapNote(response),
            providesTags: (_r, _e, id) => [
                { type: 'DiagnosticOrderTestResultTechnicianNote', id },
            ],
        }),

        getNotesByOrderTestId: builder.query<
            DiagnosticOrderTestResultTechnicianNote[],
            number | string
        >({
            query: orderTestId => ({
                url: `/api/patient/diagnostic-order-tests/${orderTestId}/result-notes`,
                method: 'GET',
            }),
            transformResponse: (response: any[]) =>
                (response ?? []).map(mapNote),
            providesTags: (_r, _e, orderTestId) => [
                {
                    type: 'DiagnosticOrderTestResultTechnicianNote',
                    id: `orderTest-${orderTestId}`,
                },
            ],
        }),

        getNotesByResultId: builder.query<
            DiagnosticOrderTestResultTechnicianNote[],
            number | string
        >({
            query: resultId => ({
                url: `/api/patient/diagnostic-order-test-results/${resultId}/notes`,
                method: 'GET',
            }),
            transformResponse: (response: any[]) =>
                (response ?? []).map(mapNote),
            providesTags: (_r, _e, resultId) => [
                {
                    type: 'DiagnosticOrderTestResultTechnicianNote',
                    id: `result-${resultId}`,
                },
            ],
        }),

        deleteDiagnosticOrderTestResultTechnicianNote: builder.mutation<
            void,
            number | string
        >({
            query: id => ({
                url: `/api/patient/diagnostic-order-test-result-notes/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['DiagnosticOrderTestResultTechnicianNote'],
        }),

    }),
});

export const {
    useCreateDiagnosticOrderTestResultTechnicianNoteMutation,
    useGetDiagnosticOrderTestResultTechnicianNoteByIdQuery,
    useGetNotesByOrderTestIdQuery,
    useGetNotesByResultIdQuery,
    useDeleteDiagnosticOrderTestResultTechnicianNoteMutation,
} = diagnosticOrderTestResultTechnicianNoteService;
