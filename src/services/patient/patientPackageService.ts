import { BaseQuery } from './../../newApi';
import { createApi } from '@reduxjs/toolkit/query/react';

type Id = number | string;

export type PatientPackageStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface PatientPackageItem {
  id: number;
  packageSetupItemId?: number | null;
  itemType: string;
  sourceId: number;
  itemCode?: string;
  itemName?: string;
  quantityTotal: number;
  quantityUsed: number;
  quantityRemaining: number;
}

export interface PatientPackage {
  id: number;
  patientId: number;
  encounterId?: number | null;
  packageSetupId: number;
  packageCode?: string;
  packageName?: string;
  packagePrice: number;
  status: PatientPackageStatus;
  cancelReason?: string | null;
  createdBy?: string;
  createdDate?: string;
  quantityTotal: number;
  quantityUsed: number;
  items: PatientPackageItem[];
}

export const patientPackageService = createApi({
  reducerPath: 'patientPackageApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientPackage'],
  endpoints: builder => ({
    // Give a package to a patient (right after the visit is opened)
    assignPatientPackage: builder.mutation<
      PatientPackage,
      { patientId: number; encounterId?: number | null; packageSetupId: number }
    >({
      query: body => ({ url: '/api/patient/patient-packages', method: 'POST', body }),
      invalidatesTags: ['PatientPackage']
    }),

    getPatientPackagesByPatient: builder.query<PatientPackage[], { patientId: Id; activeOnly?: boolean }>({
      query: ({ patientId, activeOnly = false }) => ({
        url: `/api/patient/patient-packages/by-patient/${patientId}`,
        params: { activeOnly }
      }),
      providesTags: ['PatientPackage']
    }),

    getPatientPackagesByEncounter: builder.query<PatientPackage[], Id>({
      query: encounterId => ({ url: `/api/patient/patient-packages/by-encounter/${encounterId}` }),
      providesTags: ['PatientPackage']
    }),

    // Order one package item in this visit; the quantity is taken in the same transaction
    orderPatientPackageItem: builder.mutation<
      { usageId: number; orderSource: string; orderId: number; patientPackage: PatientPackage },
      { itemId: Id; body: Record<string, any> & { encounterId: number; quantity?: number } }
    >({
      query: ({ itemId, body }) => ({
        url: `/api/patient/patient-packages/items/${itemId}/order`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['PatientPackage']
    }),

    // Several package tests in ONE diagnostic order (submitted once); all or nothing
    orderPackageDiagnostics: builder.mutation<
      { diagnosticOrderId: number; diagnosticOrderTestIds: number[]; patientPackages: PatientPackage[] },
      {
        encounterId: number;
        isUrgent?: boolean;
        notes?: string | null;
        icdDiagnosisId?: number | null;
        items: { itemId: number; reason?: string | null }[];
      }
    >({
      query: body => ({ url: '/api/patient/patient-packages/order-diagnostics', method: 'POST', body }),
      invalidatesTags: ['PatientPackage']
    }),

    // Allowed only while nothing has been ordered from the package
    cancelPatientPackage: builder.mutation<PatientPackage, { id: Id; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/api/patient/patient-packages/${id}/cancel`,
        method: 'POST',
        body: { reason: reason ?? null }
      }),
      invalidatesTags: ['PatientPackage']
    })
  })
});

export const {
  useAssignPatientPackageMutation,
  useGetPatientPackagesByPatientQuery,
  useGetPatientPackagesByEncounterQuery,
  useCancelPatientPackageMutation,
  useOrderPatientPackageItemMutation,
  useOrderPackageDiagnosticsMutation
} = patientPackageService;
