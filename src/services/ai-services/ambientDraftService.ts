import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

/**
 * Ambient draft (ConvoVoiceAgent through analytics): visit recording -> draft the doctor reviews.
 * The response is the agent's JSON as it is (transcript, sections, soap_note, diagnoses, orders, record, ...).
 */
export const ambientDraftService = createApi({
  reducerPath: 'ambientDraftService',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    createAmbientDraft: builder.mutation<any, FormData>({
      query: formData => ({
        url: '/api/analytics/ambient-draft',
        method: 'POST',
        body: formData
      })
    })
  })
});

export const { useCreateAmbientDraftMutation } = ambientDraftService;
