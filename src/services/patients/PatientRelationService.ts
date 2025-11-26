// src/services/patient/PatientRelationService.ts
import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";
import { createApi } from "@reduxjs/toolkit/dist/query/react";
import type {
    PatientRelation,
    PatientRelationCreate,
} from "@/types/model-types-new";

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = { next?: string | null; prev?: string | null; first?: string | null; last?: string | null };
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

export const PatientRelationService = createApi({
    reducerPath: "patientRelationApi",
    baseQuery: BaseQuery,
    tagTypes: ["PatientRelation"],
    endpoints: (builder) => ({
        // POST /api/patient/patient-relations
        createPatientRelation: builder.mutation<PatientRelation, PatientRelationCreate>({
            query: (body) => ({
                url: "/api/patient/patient-relations",
                method: "POST",
                body,
            }),
            invalidatesTags: ["PatientRelation"],
        }),

        // GET /api/patient/patient-relations (paginated)
        getAllPatientRelations: builder.query<PagedResult<PatientRelation>, PagedParams>({
            query: ({ page, size, sort = "id,asc" }) => ({
                url: "/api/patient/patient-relations",
                method: "GET",
                params: { page, size, sort },
            }),
            transformResponse: (response: PatientRelation[], meta) => {
                const headers = meta?.response?.headers;
                return {
                    data: response ?? [],
                    totalCount: Number(headers?.get("X-Total-Count") ?? 0),
                    links: parseLinkHeader(headers?.get("Link")),
                };
            },
            providesTags: ["PatientRelation"],
        }),

        // GET /api/patient/patient-relations/by-patient/{patientId}
        getPatientRelationsByPatient: builder.query<
            PagedResult<PatientRelation>,
            { patientId: number } & PagedParams
        >({
            query: ({ patientId, page, size, sort = "id,asc" }) => ({
                url: `/api/patient/patient-relations/by-patient/${patientId}`,
                method: "GET",
                params: { page, size, sort },
            }),
            transformResponse: (response: PatientRelation[], meta) => {
                const headers = meta?.response?.headers;
                return {
                    data: response ?? [],
                    totalCount: Number(headers?.get("X-Total-Count") ?? 0),
                    links: parseLinkHeader(headers?.get("Link")),
                };
            },
            providesTags: ["PatientRelation"],
        }),

        // DELETE /api/patient/patient-relations/{id}
        deletePatientRelation: builder.mutation<void, number>({
            query: (id) => ({
                url: `/api/patient/patient-relations/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["PatientRelation"],
        }),
        // PUT /api/patient/patient-relations/{id}  
        updatePatientRelation: builder.mutation<any, { id: number; body: any }>({
            query: ({ id, body }) => ({
                url: `/api/patient/patient-relations/${id}`,
                method: 'PUT',
                body,
            }),
        }),



    }),

});

export const {
    useCreatePatientRelationMutation,
    useGetAllPatientRelationsQuery,
    useLazyGetAllPatientRelationsQuery,
    useGetPatientRelationsByPatientQuery,
    useLazyGetPatientRelationsByPatientQuery,
    useDeletePatientRelationMutation,
    useUpdatePatientRelationMutation
} = PatientRelationService;

export default PatientRelationService;
