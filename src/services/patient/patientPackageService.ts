import { BaseQuery } from './../../newApi';
import { createApi } from '@reduxjs/toolkit/query/react';

type Id = number | string;

export type PatientPackageStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface PatientPackageItem {
  id: number;
  packageSetupItemId?: number | null;
  itemType: string;
  /** Empty for a category line (any item of itemType). */
  sourceId: number | null;
  itemCode?: string;
  itemName?: string;
  quantityTotal: number;
  quantityUsed: number;
  quantityRemaining: number;
  isCategory?: boolean;
  /** Category lines: how many times the same item can be counted; empty = no limit. */
  maxRepeat?: number | null;
  /** The discount setup record the line was linked to. */
  discountId?: number | null;
}

export interface PatientPackage {
  id: number;
  patientId: number;
  encounterId?: number | null;
  packageSetupId: number;
  packageCode?: string;
  packageName?: string;
  packagePrice: number | null;
  /** true = the visit's default service is left out (the package replaces it). */
  overrideDefaultService?: boolean;
  status: PatientPackageStatus;
  cancelReason?: string | null;
  createdBy?: string;
  createdDate?: string;
  quantityTotal: number;
  quantityUsed: number;
  items: PatientPackageItem[];
}

/** One order counted against a package; RETURNED when the order was cancelled and the unit given back. */
export interface PackageUsageRow {
  id: number;
  itemId: number;
  itemType?: string | null;
  fromCategory?: boolean;
  /** the package line, e.g. "CBC" or "Any Laboratory" */
  lineName?: string | null;
  orderedItemId?: number | null;
  orderedItemCode?: string | null;
  orderedItemName?: string | null;
  quantity: number;
  /** LABORATORY / RADIOLOGY / PATHOLOGY / PROCEDURE / PACKAGE (panel service) / SERVICE (services, UCC, vaccination) */
  orderSource?: string | null;
  /** Ordered from the package panel rather than the item's own screen. */
  fromPanel?: boolean;
  orderId?: number | null;
  status: 'COUNTED' | 'RETURNED';
  countedBy?: string | null;
  countedDate?: string | null;
  returnedBy?: string | null;
  returnedDate?: string | null;
}

export interface PatientPackageHistory {
  patientPackageId: number;
  packageCode?: string | null;
  packageName?: string | null;
  status?: string | null;
  givenBy?: string | null;
  givenDate?: string | null;
  cancelReason?: string | null;
  usages: PackageUsageRow[];
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

    // When the package was given and every order counted against it or returned, newest first
    getPatientPackageHistory: builder.query<PatientPackageHistory, Id>({
      query: id => ({ url: `/api/patient/patient-packages/${id}/history` }),
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

    // Several tests in ONE diagnostic order (submitted once). Tests beyond the room left are still
    // ordered but charged as usual; countedTestIds are the ones taken from the package.
    orderPackageDiagnostics: builder.mutation<
      {
        diagnosticOrderId: number;
        diagnosticOrderTestIds: number[];
        countedTestIds: number[];
        patientPackages: PatientPackage[];
      },
      {
        encounterId: number;
        isUrgent?: boolean;
        notes?: string | null;
        icdDiagnosisId?: number | null;
        /** testId is needed for category lines (the test picked). */
        items: { itemId: number; testId?: number | null; reason?: string | null }[];
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
  useGetPatientPackageHistoryQuery,
  useCancelPatientPackageMutation,
  useOrderPatientPackageItemMutation,
  useOrderPackageDiagnosticsMutation
} = patientPackageService;
