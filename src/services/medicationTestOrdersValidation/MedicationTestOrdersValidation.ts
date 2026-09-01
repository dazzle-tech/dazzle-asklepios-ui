import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

import * as modelTypes from '@/types/model-types-new';

export const medicationValidationService = createApi({
  reducerPath: 'medicationValidationApi',
  baseQuery: BaseQuery,
  tagTypes: ['MedicationValidation'],

  endpoints: builder => ({

    // ============================
    // 🔹 VALIDATE MEDICATION
    // ============================
    validateMedication: builder.mutation<
      modelTypes.ValidationResponseDTO,
      modelTypes.MedicationValidationRequestDTO
    >({
      query: body => ({
        url: '/api/analytics/validate/medication',
        method: 'POST',
        body
      }),
      invalidatesTags: ['MedicationValidation']
    }),

    // ============================
    // 🔹 VALIDATE TESTS
    // ============================
    validateTests: builder.mutation<
      modelTypes.ValidationResponseDTO,
      modelTypes.TestValidationRequestDTO
    >({
      query: body => ({
        url: '/api/analytics/validate/tests',
        method: 'POST',
        body
      }),
      invalidatesTags: ['MedicationValidation']
    })

  })
});

export const {
  useValidateMedicationMutation,
  useValidateTestsMutation
} = medicationValidationService;
