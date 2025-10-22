import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi'; 

export const languageService = createApi({
  reducerPath: 'languageApi',
  baseQuery: BaseQuery,
  endpoints: (builder) => ({

   
    addLanguage: builder.mutation({
      query: (language) => ({
        url: '/api/setup/languages',
        method: 'POST',
        body: language, // { langKey, langName, direction, details? }
      }),
    }),

    
    deleteLanguage: builder.mutation({
      query: (id: number | string) => ({
        url: `/api/setup/languages/${id}`,
        method: 'DELETE',
      }),
    }),

   
    updateLanguage: builder.mutation({
      query: (language) => ({
        url: `/api/setup/languages/${language.id}`,
        method: 'PUT',
        body: language, // { langName, direction, details? } (id from path)
      }),
    }),

   
    getAllLanguages: builder.query({
      query: () => ({
        url: '/api/setup/languages',
        method: 'GET',
      }),
    }),

    
    getLanguage: builder.query({
      query: (id: number | string) => ({
        url: `/api/setup/languages/${id}`,
        method: 'GET',
      }),
    }),

    
    getLanguageByKey: builder.query({
      query: (langKey: string) => ({
        url: `/api/setup/languages/by-key/${encodeURIComponent(langKey)}`,
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useAddLanguageMutation,
  useDeleteLanguageMutation,
  useUpdateLanguageMutation,
  useGetAllLanguagesQuery,
  useGetLanguageQuery,
  useGetLanguageByKeyQuery,
} = languageService;
