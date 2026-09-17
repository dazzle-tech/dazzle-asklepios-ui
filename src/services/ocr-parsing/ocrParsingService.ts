import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

import * as modelTypes from '@/types/model-types-new';

export const ocrParsingService = createApi({
  reducerPath: 'ocrParsingApi',
  baseQuery: BaseQuery,
  tagTypes: ['OCRParsing'],

  endpoints: builder => ({

    // ============================
    // 🔹 EXTRACT & PARSE OCR FILE
    // ============================
    extractAndParse: builder.mutation<
      modelTypes.OCRParsingResponseDTO,
      { file: File }
    >({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: '/api/analytics/ocr/extract-and-parse',
          method: 'POST',
          body: formData
        };
      },
      invalidatesTags: ['OCRParsing']
    })

  })
});

export const {
  useExtractAndParseMutation
} = ocrParsingService;