import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { PatientServiceAndProduct, PatientServiceProductCreateDTO, PatientServiceProductUpdateDTO } from '@/types/model-types-new';




export type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};

export type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: LinkMap;
};

const mapPaged = <T>(response: T[], meta: any): PagedResult<T> => {
  const headers = meta?.response?.headers;

  return {
    data: response ?? [],
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link')),
  };
};

export const patientServicesAndProductsService = createApi({
  reducerPath: 'patientServicesAndProductsService',
  baseQuery: BaseQuery,
  tagTypes: ['PatientServiceAndProduct'],

  endpoints: builder => ({
    // POST /api/patient/patient-services-products
    createPatientServiceOrProduct: builder.mutation<
      PatientServiceAndProduct,
      PatientServiceProductCreateDTO
    >({
      query: body => ({
        url: '/api/patient/patient-services-products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PatientServiceAndProduct'],
    }),

    // GET /api/patient/patient-services-products/by-encounter/{encounterId}
    getPatientServicesAndProductsByEncounter: builder.query<
      PagedResult<PatientServiceAndProduct>,
      { encounterId: number; page?: number; size?: number; sort?: string }
    >({
      query: ({ encounterId, page = 0, size = 10, sort = 'id,desc' }) => ({
        url: `/api/patient/patient-services-products/by-encounter/${encounterId}?page=${page}&size=${size}&sort=${sort}`,
        method: 'GET',
      }),
      transformResponse: (response: PatientServiceAndProduct[], meta) => mapPaged(response, meta),
      providesTags: (_res, _err, { encounterId }) => [
        { type: 'PatientServiceAndProduct', id: encounterId },
      ],
    }),

    // GET /api/patient/patient-services-products/by-patient/{patientId}
    getPatientServicesAndProductsByPatient: builder.query<
      PagedResult<PatientServiceAndProduct>,
      { patientId: number; page?: number; size?: number; sort?: string }
    >({
      query: ({ patientId, page = 0, size = 10, sort = 'id,desc' }) => ({
        url: `/api/patient/patient-services-products/by-patient/${patientId}?page=${page}&size=${size}&sort=${sort}`,
        method: 'GET',
      }),
      transformResponse: (response: PatientServiceAndProduct[], meta) => mapPaged(response, meta),
      providesTags: (_res, _err, { patientId }) => [
        { type: 'PatientServiceAndProduct', id: patientId },
      ],
    }),

    // PUT /api/patient/patient-services-products/{id}
    updatePatientServiceOrProduct: builder.mutation<
      PatientServiceAndProduct,
      { id: number; body: PatientServiceProductUpdateDTO; encounterId?: number }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/patient-services-products/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, { encounterId }) =>
        encounterId != null
          ? [
              { type: 'PatientServiceAndProduct', id: encounterId },
              'PatientServiceAndProduct',
            ]
          : ['PatientServiceAndProduct'],
    }),

    // DELETE /api/patient/patient-services-products/{id}
    deletePatientServiceOrProduct: builder.mutation<void, { id: number; encounterId?: number }>({
      query: ({ id }) => ({
        url: `/api/patient/patient-services-products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { encounterId }) =>
        encounterId != null
          ? [
              { type: 'PatientServiceAndProduct', id: encounterId },
              'PatientServiceAndProduct',
            ]
          : ['PatientServiceAndProduct'],
    }),
  }),
});

export const {
  useCreatePatientServiceOrProductMutation,
  useGetPatientServicesAndProductsByEncounterQuery,
  useLazyGetPatientServicesAndProductsByEncounterQuery,
  useGetPatientServicesAndProductsByPatientQuery,
  useLazyGetPatientServicesAndProductsByPatientQuery,
  useUpdatePatientServiceOrProductMutation,
  useDeletePatientServiceOrProductMutation,
  
} = patientServicesAndProductsService;
