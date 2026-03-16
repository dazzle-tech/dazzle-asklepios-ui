import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import {
    PatientWarnings,
    PatientWarningsCreateDTO,
    PatientWarningsUpdateDTO,
} from '@/types/model-types-new';


// Parsed pagination links from a Link header.
type LinkMap = {
    next?: string | null;
    prev?: string | null;
    first?: string | null;
    last?: string | null;
};

// Standard paged response shape used by the warnings list.
type PagedResult<T> = {
    data: T[];
    totalCount: number;
    links?: LinkMap;
};

export const patientWarningsService = createApi({
    reducerPath: 'patientWarningsApi',
    baseQuery: BaseQuery,
    tagTypes: ['PatientWarnings'],
    endpoints: (builder) => ({

        // Fetch warnings for a specific patient with pagination + sorting.
        getPatientWarningsByPatientId: builder.query<
            PagedResult<PatientWarnings>,
            {
                patientId: number;
                page?: number;
                size?: number;
                sort?: string;
                showCancelled?: boolean;
            }
        >({
            query: ({ patientId, page, size, sort = 'id,desc', showCancelled = false }) => ({
                url: `/api/patient/patient-warnings/by-patient/${patientId}`,
                params: { page, size, sort, showCancelled },
            }),
            transformResponse: (
                response: PatientWarnings[],
                meta
            ): PagedResult<PatientWarnings> => {
                const headers = meta?.response?.headers;
                return {
                    data: response,
                    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
                    links: parseLinkHeader(headers?.get('Link')),
                };
            },
            providesTags: ['PatientWarnings'],
        }),

        // Create a new patient warning.
        addPatientWarning: builder.mutation<
            PatientWarnings,
            PatientWarningsCreateDTO
        >({
            query: (payload) => ({
                url: '/api/patient/patient-warnings',
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['PatientWarnings'],
        }),

        // Update an existing warning by id.
        updatePatientWarning: builder.mutation<
            PatientWarnings,
            { id: number; dto: PatientWarningsUpdateDTO }
        >({
            query: ({ id, dto }) => ({
                url: `/api/patient/patient-warnings/${id}`,
                method: 'PUT',
                body: dto,
            }),
            invalidatesTags: ['PatientWarnings'],
        }),

        // Cancel a warning with a required reason (sent as query param).
        cancelPatientWarning: builder.mutation<
            PatientWarnings,
            { id: number; reason: string }
        >({
            query: ({ id, reason }) => ({
                url: `/api/patient/patient-warnings/${id}/cancel`,
                method: 'PUT',
                params: { reason },
            }),
            invalidatesTags: ['PatientWarnings'],
        }),

        // Mark a warning as resolved.
        resolvePatientWarning: builder.mutation<
            PatientWarnings,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `/api/patient/patient-warnings/${id}/resolve`,
                method: 'PUT',
            }),
            invalidatesTags: ['PatientWarnings'],
        }),

        // Undo a previous resolve action.
        undoResolvePatientWarning: builder.mutation<
            PatientWarnings,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `/api/patient/patient-warnings/${id}/undo-resolve`,
                method: 'PUT',
            }),
            invalidatesTags: ['PatientWarnings'],
        }),

    }),
});

// Auto-generated RTK Query hooks.
export const {
    useAddPatientWarningMutation,
    useGetPatientWarningsByPatientIdQuery,
    useUpdatePatientWarningMutation,
    useUndoResolvePatientWarningMutation,
    useCancelPatientWarningMutation,
    useResolvePatientWarningMutation,
} = patientWarningsService;
