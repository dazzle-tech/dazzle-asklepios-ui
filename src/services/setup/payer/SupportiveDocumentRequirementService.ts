import { BaseQuery } from '@/newApi';
import { createApi } from '@reduxjs/toolkit/dist/query/react';

export type SupportiveDocumentMedicalSheetRef = {
  medicalSheetCode: string;
  medicalSheetName: string;
  medicalSheetPath: string;
};

export type SupportiveDocumentRequirementCatalogItem = {
  code: string;
  label: string;
  medicalSheetCode: string;
  medicalSheetName: string;
  medicalSheetPath: string;
  displayOrder: number;
  /** Extra Medical Sheet groups that display the same requirement code (shared sections). */
  additionalMedicalSheets?: SupportiveDocumentMedicalSheetRef[];
};

/** Exhaustive MedicalSheets availability from setup-service (supported + unsupported). */
export type SupportiveDocumentMedicalSheetAvailability = {
  medicalSheetCode: string;
  medicalSheetName: string;
  medicalSheetPath: string;
  supported: boolean;
  unsupportedReason?: string | null;
  displayOrder: number;
};

export type PayorSupportiveDocumentRequirement = {
  payorId: number;
  configured: boolean;
  requirementCodes: string[];
};

export type PayorSupportiveDocumentRequirementUpdate = {
  requirementCodes: string[];
};

export const SupportiveDocumentRequirementService = createApi({
  reducerPath: 'supportiveDocumentRequirementApi',
  baseQuery: BaseQuery,
  tagTypes: [
    'SupportiveDocumentCatalog',
    'SupportiveDocumentMedicalSheets',
    'PayorSupportiveDocumentRequirement'
  ],
  endpoints: builder => ({
    getSupportiveDocumentRequirementCatalog: builder.query<
      SupportiveDocumentRequirementCatalogItem[],
      void
    >({
      query: () => ({
        url: '/api/setup/supportive-document-requirements',
        method: 'GET'
      }),
      providesTags: ['SupportiveDocumentCatalog']
    }),

    getSupportiveDocumentMedicalSheets: builder.query<
      SupportiveDocumentMedicalSheetAvailability[],
      void
    >({
      query: () => ({
        url: '/api/setup/supportive-document-medical-sheets',
        method: 'GET'
      }),
      providesTags: ['SupportiveDocumentMedicalSheets']
    }),

    getPayorSupportiveDocumentRequirements: builder.query<
      PayorSupportiveDocumentRequirement,
      number | string
    >({
      query: payorId => ({
        url: `/api/setup/payor/${payorId}/supportive-document-requirements`,
        method: 'GET'
      }),
      providesTags: (_result, _error, payorId) => [
        { type: 'PayorSupportiveDocumentRequirement', id: String(payorId) }
      ]
    }),

    replacePayorSupportiveDocumentRequirements: builder.mutation<
      PayorSupportiveDocumentRequirement,
      { payorId: number | string; body: PayorSupportiveDocumentRequirementUpdate }
    >({
      query: ({ payorId, body }) => ({
        url: `/api/setup/payor/${payorId}/supportive-document-requirements`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'PayorSupportiveDocumentRequirement', id: String(arg.payorId) }
      ]
    })
  })
});

export const {
  useGetSupportiveDocumentRequirementCatalogQuery,
  useGetSupportiveDocumentMedicalSheetsQuery,
  useGetPayorSupportiveDocumentRequirementsQuery,
  useLazyGetPayorSupportiveDocumentRequirementsQuery,
  useReplacePayorSupportiveDocumentRequirementsMutation
} = SupportiveDocumentRequirementService;
