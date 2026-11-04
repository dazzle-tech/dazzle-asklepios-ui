import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { ClaimEncounterCopyResponse } from '@/types/model-types-new';


export const claimEncounterCopyService = createApi({
    reducerPath: 'claimEncounterCopyApi',
    baseQuery: BaseQuery,
    tagTypes: ['ClaimEncounterCopy'],
    endpoints: builder => ({
        getClaimEncounterCopy: builder.query<
            ClaimEncounterCopyResponse | null,
            { encounterId: number }
        >({
            query: ({ encounterId }) => ({
                url: `/api/patient/billing/claim-encounter-copies/encounters/${encounterId}`,
                method: 'GET'
            }),
            providesTags: ['ClaimEncounterCopy']
        }),

        updateClaimEncounterCopy: builder.mutation<
            ClaimEncounterCopyResponse,
            {
                encounterId: number;
                dto: Omit<
                    ClaimEncounterCopyResponse,
                    'id' | 'encounterId'
                >;
            }
        >({
            query: ({ encounterId, dto }) => ({
                url: `/api/patient/billing/claim-encounter-copies/encounters/${encounterId}`,
                method: 'PUT',
                body: dto
            }),
            invalidatesTags: ['ClaimEncounterCopy']
        })
    })
});

export const {
    useGetClaimEncounterCopyQuery,
    useUpdateClaimEncounterCopyMutation
} = claimEncounterCopyService;