import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import type { ConsultationPortalSearchParams } from '@/types/model-types-new';

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

export const portalService = createApi({
  reducerPath: 'portalService',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    searchConsultations: builder.query<PagedResult<any>, ConsultationPortalSearchParams>({
      query: ({
        fromDate,
        toDate,
        fromFacilityId,
        practitionerId,
        toDepartmentId,
        fromDepartmentIds,
        page = 0,
        size = 10,
        sort = 'id,desc',
        showRejected = false
      }) => {
        const params = new URLSearchParams();
        params.append('fromDate', String(fromDate));
        params.append('toDate', String(toDate));
        params.append('fromFacilityId', String(fromFacilityId));
        if (practitionerId !== undefined && practitionerId !== null) {
          params.append('practitionerId', String(practitionerId));
        }
        if (toDepartmentId !== undefined && toDepartmentId !== null) {
          params.append('toDepartmentId', String(toDepartmentId));
        }
        if (fromDepartmentIds && fromDepartmentIds.length > 0) {
          fromDepartmentIds.forEach(id => params.append('fromDepartmentIds', String(id)));
        }
        params.append('page', String(page));
        params.append('size', String(size));
        params.append('sort', String(sort));
        params.append('showRejected', String(showRejected));

        return {
          url: `/api/patient/consultation-portal/search?${params.toString()}`,
          method: 'GET'
        };
      },
      onQueryStarted,
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response ?? [],
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      }
    }),
    confirmConsultation: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/patient/consultation/${id}/confirm`,
        method: 'PUT',
        body
      }),
      onQueryStarted
    }),
    rejectConsultation: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/patient/consultation/${id}/reject`,
        method: 'PUT',
        body
      }),
      onQueryStarted
    }),
    submitConsultationResponse: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/patient/consultation/${id}/response`,
        method: 'PUT',
        body
      }),
      onQueryStarted
    }),
    submitConsultations: builder.mutation<any, any>({
      query: body => ({
        url: `/api/patient/consultation/submit`,
        method: 'PUT',
        body
      }),
      onQueryStarted
    })
  })
});

export const {
  useSearchConsultationsQuery,
  useLazySearchConsultationsQuery,
  useConfirmConsultationMutation,
  useRejectConsultationMutation,
  useSubmitConsultationResponseMutation,
  useSubmitConsultationsMutation
} = portalService;