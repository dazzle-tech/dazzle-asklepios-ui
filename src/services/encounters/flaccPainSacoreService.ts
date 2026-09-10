import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { FLACCPainScale, FLACCPainScaleCreateDTO, FLACCPainScaleUpdateDTO } from '@/types/model-types-new';



export const flaccPainSacoreService = createApi({
    reducerPath: 'flaccPainScaleApi',

    baseQuery: BaseQuery,

    tagTypes: ['FLACCPainScale'],

    endpoints: builder => ({
        createFLACCPainScale: builder.mutation<
            FLACCPainScale,
            FLACCPainScaleCreateDTO
        >({
            query: body => ({
                url: '/api/patient/flacc-pain-scales',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['FLACCPainScale'],
        }),

        updateFLACCPainScale: builder.mutation<
            FLACCPainScale,
            FLACCPainScaleUpdateDTO
        >({
            query: body => ({
                url: '/api/patient/flacc-pain-scales',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['FLACCPainScale'],
        }),

        getFLACCPainScaleById: builder.query<FLACCPainScale, number>({
            query: id => `/api/patient/flacc-pain-scales/${id}`,
            providesTags: ['FLACCPainScale'],
        }),

        getFLACCPainScalesByPatient: builder.query<
            FLACCPainScale[],
            number
        >({
            query: patientId => `/api/patient/flacc-pain-scales/patient/${patientId}`,
            providesTags: ['FLACCPainScale'],
        }),

        getFLACCPainScalesByEncounter: builder.query<
            FLACCPainScale[],
            {
                encounterId: number;
                showCancelled: boolean;
            }
        >({
            query: ({ encounterId, showCancelled }) => ({
                url: `api/patient/flacc-pain-scales/encounter/${encounterId}`,
                params: {
                    showCancelled
                }
            }),
            providesTags: ['FLACCPainScale']
        }),

        cancelFLACCPainScale: builder.mutation<
            FLACCPainScale,
            {
                id: number;
                cancellationReason: string;
            }
        >({
            query: ({ id, cancellationReason }) => ({
                url: `/api/patient/flacc-pain-scales/${id}/cancel`,
                method: 'PATCH',
                params: {
                    cancellationReason,
                },
            }),
            invalidatesTags: ['FLACCPainScale'],
        }),
    }),
});

export const {
    useCreateFLACCPainScaleMutation,
    useUpdateFLACCPainScaleMutation,
    useGetFLACCPainScaleByIdQuery,
    useGetFLACCPainScalesByPatientQuery,
    useGetFLACCPainScalesByEncounterQuery,
    useCancelFLACCPainScaleMutation,
} = flaccPainSacoreService;
