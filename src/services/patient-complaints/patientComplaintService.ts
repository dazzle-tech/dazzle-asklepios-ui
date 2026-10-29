import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, PublicBaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import type {
  ComplaintStatus,
  PatientComplaintDetail,
  PatientComplaintListItem,
  PatientComplaintSummary,
  SummaryFilter
} from '@/pages/patient-complaints/constants';

type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};

export type PatientComplaintPagedResult = {
  data: PatientComplaintListItem[];
  totalCount: number;
  links?: LinkMap;
};

export type PatientComplaintSearchParams = {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  status?: ComplaintStatus | null;
  assignedUserId?: number | null;
  receivedFrom?: string | null;
  receivedTo?: string | null;
  summaryFilter?: Exclude<SummaryFilter, null> | null;
};

export type PatientComplaintSubmitPayload = {
  anonymous: boolean;
  patientName?: string | null;
  patientIdentifier?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  preferredContactMethod?: string | null;
  onBehalf?: boolean | null;
  relationshipToPatient?: string | null;
  consentToContact: boolean;
  facilityId: number;
  departmentId: number;
  feedbackType: string;
  complaintType?: string | null;
  incidentDate: string;
  incidentTime: string;
  description: string;
  involvedStaffNames?: string | null;
  desiredResolution?: string | null;
  files?: File[];
  accessToken?: string;
};

export type PatientComplaintSubmitResponse = {
  reference: string;
  receivedDate: string;
};

export type PatientComplaintPublicLookupRequest = {
  documentType: string;
  documentNumber: string;
  accessToken?: string;
};

export type PatientComplaintPublicLookupResult = {
  patientName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
};

export type PatientPortalOtpRequest = {
  primaryDocumentNumber: string;
};

export type PatientPortalOtpVerifyRequest = {
  primaryDocumentNumber: string;
  otp: string;
};

export type PatientPortalLoginResult = {
  patientId: number;
  medicalRecordNumber: string;
  firstName?: string | null;
  lastName?: string | null;
  token: string;
};

/** Matches backend download ticket shape (url + expiresInSeconds). */
export type PatientComplaintAttachmentDownload = {
  url: string;
  expiresInSeconds: number;
};

export type PublicFacilityOption = {
  id: number;
  name: string;
};

export type PublicDepartmentOption = {
  id: number;
  name: string;
};

const unwrapNamedOptions = <T extends { id: number; name: string }>(response: any): T[] => {
  const list = Array.isArray(response)
    ? response
    : response?.value ?? response?.data ?? response?.content ?? [];

  return (Array.isArray(list) ? list : [])
    .map((item: any) => ({
      id: Number(item?.id),
      name: String(item?.name ?? '').trim()
    }))
    .filter((item: { id: number; name: string }) => Number.isFinite(item.id) && item.name) as T[];
};

/** Public endpoints — no Authorization header (PublicBaseQuery / survey permitAll pattern). */
export const patientComplaintPublicService = createApi({
  reducerPath: 'patientComplaintPublicApi',
  baseQuery: PublicBaseQuery,
  endpoints: builder => ({
    getPublicActiveFacilities: builder.query<PublicFacilityOption[], void>({
      query: () => ({
        url: '/api/setup/facility/active',
        method: 'GET'
      }),
      transformResponse: (response: any) => unwrapNamedOptions<PublicFacilityOption>(response)
    }),

    getPublicActiveDepartmentsByFacility: builder.query<PublicDepartmentOption[], number>({
      query: facilityId => ({
        url: `/api/setup/department/external/active/by-facility/${facilityId}`,
        method: 'GET'
      }),
      transformResponse: (response: any) => unwrapNamedOptions<PublicDepartmentOption>(response)
    }),

    submitPatientComplaint: builder.mutation<
      PatientComplaintSubmitResponse,
      PatientComplaintSubmitPayload
    >({
      query: ({ files = [], accessToken, ...complaint }) => {
        const authHeaders = accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined;

        if (files.length > 0) {
          const formData = new FormData();
          formData.append(
            'complaint',
            new Blob([JSON.stringify(complaint)], { type: 'application/json' })
          );
          files.forEach(file => formData.append('files', file));
          return {
            url: '/api/patient/patient-complaints/submit',
            method: 'POST',
            body: formData,
            ...(authHeaders ? { headers: authHeaders } : {})
          };
        }

        return {
          url: '/api/patient/patient-complaints/submit',
          method: 'POST',
          body: complaint,
          ...(authHeaders ? { headers: authHeaders } : {})
        };
      }
    }),

    requestPatientPortalOtp: builder.mutation<string, PatientPortalOtpRequest>({
      query: body => ({
        url: '/api/patient/patient-portal/request-otp',
        method: 'POST',
        body,
        responseHandler: 'text',
        headers: { 'X-Portal-Secret': 'k7Qm2pL9xR4vN8sT1wY6cH3bF5dJ0aZ' }
      })
    }),

    verifyPatientPortalLoginOtp: builder.mutation<
      PatientPortalLoginResult,
      PatientPortalOtpVerifyRequest
    >({
      query: body => ({
        url: '/api/patient/patient-portal/verify-login-otp',
        method: 'POST',
        body,
        headers: { 'X-Portal-Secret': 'k7Qm2pL9xR4vN8sT1wY6cH3bF5dJ0aZ' }
      })
    }),


    lookupPatientComplaintByDocument: builder.mutation<
      PatientComplaintPublicLookupResult,
      PatientComplaintPublicLookupRequest
    >({
      query: ({ documentType, documentNumber, accessToken }) => ({
        url: '/api/patient/patient-complaints/lookup-by-document',
        method: 'POST',
        body: { documentType, documentNumber },
        ...(accessToken
          ? { headers: { Authorization: `Bearer ${accessToken}` } }
          : {})
      })
    })
  })
});

export const patientComplaintService = createApi({
  reducerPath: 'patientComplaintApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientComplaints', 'PatientComplaintDetail', 'PatientComplaintSummary'],
  endpoints: builder => ({
    searchPatientComplaints: builder.query<
      PatientComplaintPagedResult,
      PatientComplaintSearchParams
    >({
      query: ({
        page = 0,
        size = 15,
        sort = 'receivedDate,desc',
        search,
        status,
        assignedUserId,
        receivedFrom,
        receivedTo,
        summaryFilter
      }) => ({
        url: '/api/patient/patient-complaints',
        method: 'GET',
        params: {
          page,
          size,
          sort,
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
          ...(assignedUserId != null ? { assignedUserId } : {}),
          ...(receivedFrom ? { receivedFrom } : {}),
          ...(receivedTo ? { receivedTo } : {}),
          ...(summaryFilter ? { summaryFilter } : {})
        }
      }),
      transformResponse: (
        response: PatientComplaintListItem[],
        meta
      ): PatientComplaintPagedResult => {
        const headers = meta?.response?.headers;
        return {
          data: Array.isArray(response) ? response : [],
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: result =>
        result?.data?.length
          ? [
              ...result.data.map(item => ({
                type: 'PatientComplaintDetail' as const,
                id: item.id
              })),
              { type: 'PatientComplaints' as const, id: 'LIST' }
            ]
          : [{ type: 'PatientComplaints' as const, id: 'LIST' }]
    }),

    getPatientComplaintSummary: builder.query<PatientComplaintSummary, void>({
      query: () => ({
        url: '/api/patient/patient-complaints/summary',
        method: 'GET'
      }),
      providesTags: [{ type: 'PatientComplaintSummary', id: 'COUNTS' }]
    }),

    getPatientComplaintById: builder.query<PatientComplaintDetail, number>({
      query: id => ({
        url: `/api/patient/patient-complaints/${id}`,
        method: 'GET'
      }),
      providesTags: (_result, _error, id) => [{ type: 'PatientComplaintDetail', id }]
    }),

    getPatientComplaintAttachmentDownloadUrl: builder.query<
      PatientComplaintAttachmentDownload,
      { complaintId: number; attachmentId: number }
    >({
      query: ({ complaintId, attachmentId }) => ({
        url: `/api/patient/patient-complaints/${complaintId}/attachments/${attachmentId}/download-url`,
        method: 'GET'
      })
    }),

    assignPatientComplaint: builder.mutation<
      PatientComplaintDetail,
      { id: number; assignedUserId: number }
    >({
      query: ({ id, assignedUserId }) => ({
        url: `/api/patient/patient-complaints/${id}/assign`,
        method: 'PUT',
        body: { assignedUserId }
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'PatientComplaintDetail', id },
        { type: 'PatientComplaints', id: 'LIST' },
        { type: 'PatientComplaintSummary', id: 'COUNTS' }
      ]
    }),

    setPatientComplaintDeadline: builder.mutation<
      PatientComplaintDetail,
      { id: number; targetDeadline: string }
    >({
      query: ({ id, targetDeadline }) => ({
        url: `/api/patient/patient-complaints/${id}/deadline`,
        method: 'PUT',
        body: { targetDeadline }
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'PatientComplaintDetail', id },
        { type: 'PatientComplaints', id: 'LIST' },
        { type: 'PatientComplaintSummary', id: 'COUNTS' }
      ]
    }),

    startPatientComplaintHandling: builder.mutation<PatientComplaintDetail, number>({
      query: id => ({
        url: `/api/patient/patient-complaints/${id}/start-handling`,
        method: 'POST'
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'PatientComplaintDetail', id },
        { type: 'PatientComplaints', id: 'LIST' },
        { type: 'PatientComplaintSummary', id: 'COUNTS' }
      ]
    }),

    addPatientComplaintAction: builder.mutation<
      PatientComplaintDetail,
      { id: number; description: string; assignedUserId: number; deadline: string }
    >({
      query: ({ id, description, assignedUserId, deadline }) => ({
        url: `/api/patient/patient-complaints/${id}/actions`,
        method: 'POST',
        body: { description, assignedUserId, deadline }
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'PatientComplaintDetail', id },
        { type: 'PatientComplaints', id: 'LIST' },
        { type: 'PatientComplaintSummary', id: 'COUNTS' }
      ]
    }),

    startPatientComplaintAction: builder.mutation<
      PatientComplaintDetail,
      { id: number; actionId: number }
    >({
      query: ({ id, actionId }) => ({
        url: `/api/patient/patient-complaints/${id}/actions/${actionId}/start`,
        method: 'POST'
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'PatientComplaintDetail', id },
        { type: 'PatientComplaints', id: 'LIST' },
        { type: 'PatientComplaintSummary', id: 'COUNTS' }
      ]
    }),

    completePatientComplaintAction: builder.mutation<
      PatientComplaintDetail,
      { id: number; actionId: number; result: string }
    >({
      query: ({ id, actionId, result }) => ({
        url: `/api/patient/patient-complaints/${id}/actions/${actionId}/complete`,
        method: 'POST',
        body: { result }
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'PatientComplaintDetail', id },
        { type: 'PatientComplaints', id: 'LIST' },
        { type: 'PatientComplaintSummary', id: 'COUNTS' }
      ]
    }),

    resolvePatientComplaint: builder.mutation<
      PatientComplaintDetail,
      { id: number; resolutionSummary: string }
    >({
      query: ({ id, resolutionSummary }) => ({
        url: `/api/patient/patient-complaints/${id}/resolve`,
        method: 'POST',
        body: { resolutionSummary }
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'PatientComplaintDetail', id },
        { type: 'PatientComplaints', id: 'LIST' },
        { type: 'PatientComplaintSummary', id: 'COUNTS' }
      ]
    }),

    closePatientComplaint: builder.mutation<PatientComplaintDetail, number>({
      query: id => ({
        url: `/api/patient/patient-complaints/${id}/close`,
        method: 'POST'
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'PatientComplaintDetail', id },
        { type: 'PatientComplaints', id: 'LIST' },
        { type: 'PatientComplaintSummary', id: 'COUNTS' }
      ]
    }),

    reopenPatientComplaint: builder.mutation<
      PatientComplaintDetail,
      { id: number; reopenReason: string }
    >({
      query: ({ id, reopenReason }) => ({
        url: `/api/patient/patient-complaints/${id}/reopen`,
        method: 'POST',
        body: { reopenReason }
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'PatientComplaintDetail', id },
        { type: 'PatientComplaints', id: 'LIST' },
        { type: 'PatientComplaintSummary', id: 'COUNTS' }
      ]
    })
  })
});

export const {
  useGetPublicActiveFacilitiesQuery,
  useGetPublicActiveDepartmentsByFacilityQuery,
  useSubmitPatientComplaintMutation,
  useRequestPatientPortalOtpMutation,
  useVerifyPatientPortalLoginOtpMutation,
  useLookupPatientComplaintByDocumentMutation
} = patientComplaintPublicService;

export const {
  useSearchPatientComplaintsQuery,
  useGetPatientComplaintSummaryQuery,
  useGetPatientComplaintByIdQuery,
  useLazyGetPatientComplaintAttachmentDownloadUrlQuery,
  useAssignPatientComplaintMutation,
  useSetPatientComplaintDeadlineMutation,
  useStartPatientComplaintHandlingMutation,
  useAddPatientComplaintActionMutation,
  useStartPatientComplaintActionMutation,
  useCompletePatientComplaintActionMutation,
  useResolvePatientComplaintMutation,
  useClosePatientComplaintMutation,
  useReopenPatientComplaintMutation
} = patientComplaintService;
