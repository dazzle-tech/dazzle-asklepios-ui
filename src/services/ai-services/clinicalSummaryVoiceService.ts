
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { ClinicalSummaryVoiceResponse } from '@/types/model-types-new';


export const clinicalSummaryVoiceService = createApi({
  reducerPath: 'clinicalSummaryVoiceService',
  baseQuery: BaseQuery,
  tagTypes: ['ClinicalSummaryVoice'],
  endpoints: builder => ({
    summarizeClinicalVoice: builder.mutation<
      ClinicalSummaryVoiceResponse,
      FormData
    >({
      query: formData => ({
        url: '/api/analytics/clinical-summary-voice/summarize',
        method: 'POST',
        body: formData,
      }),
    }),
  }),
});

export const {
  useSummarizeClinicalVoiceMutation,
} = clinicalSummaryVoiceService;
