import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import * as modelTypes from '@/types/model-types-new';

export const externalDocumentService = createApi({
  reducerPath: 'externalDocumentApi',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    processExternalDocument: builder.mutation<
      modelTypes.ProcessExternalDocumentResponse,
      modelTypes.ProcessExternalDocumentRequest
    >({
      query: ({ file, documentType, patientId, translate = false, targetLanguage = 'en' }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        formData.append('patientId', String(patientId));
        formData.append('translate', String(translate));
        formData.append('targetLanguage', targetLanguage);

        return {
          url: '/api/analytics/external-documents/process',
          method: 'POST',
          body: formData
        };
      }
    })
  })
});

export const { useProcessExternalDocumentMutation } = externalDocumentService;
