import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import type { AmbientDraft } from './ambientDraft';

export const ambientDraftService = createApi({
  reducerPath: 'ambientDraftService',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    createAmbientDraft: builder.mutation<AmbientDraft, FormData>({
      query: formData => ({
        url: '/api/analytics/ambient-scribe/drafts',
        method: 'POST',
        body: formData
      })
    })
  })
});

export const { useCreateAmbientDraftMutation } = ambientDraftService;
