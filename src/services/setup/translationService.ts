import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi'; 
import { LanguageTranslation } from '@/types/model-types-new';

export const translationService = createApi({
  reducerPath: 'translationApi',
  baseQuery: BaseQuery,
  endpoints: (builder) => ({

    addTranslation: builder.mutation({
      query: (translation) => ({
        url: '/api/setup/translations',
        method: 'POST',
        body: translation, 
        // { langKey, translationKey, originalText, translationText?, verified?, translated? }
      }),
    }),

    deleteTranslation: builder.mutation({
      query: (id: number | string) => ({
        url: `/api/setup/translations/${id}`,
        method: 'DELETE',
      }),
    }),

    
    updateTranslation: builder.mutation({
      query: (translation) => ({
        url: `/api/setup/translations/${translation.id}`,
        method: 'PUT',
        body: translation, 
        // { originalText, translationText?, verified?, translated? } (id from path)
      }),
    }),

    getAllTranslations: builder.query({
      query: () => ({
        url: '/api/setup/translations',
        method: 'GET',
      }),
    }),

      getTranslationsByLang: builder.query({
      query: (langKey: string) => ({
        url: `/api/setup/translations/by-lang/${encodeURIComponent(langKey)}`,
        method: 'GET',
      }),
    }),

    getTranslation: builder.query({
      query: (id: number | string) => ({
        url: `/api/setup/translations/${id}`,
        method: 'GET',
      }),
    }),

    
    //get Dictonary for all languages

     getDictionary: builder.query({
      query: langKey => `/api/setup/translations`,
      transformResponse: (rows: LanguageTranslation[]) => {
        // const dict: Record<string, string> = {};
        // for (const r of rows) {
        //   const value =
        //      r.translationText?.trim();
        //   dict[r.translationKey] = value;
        // }
        // return dict;
        const all: Record<string, Record<string, string>> = {};
        for (const r of rows) {
          const value = (r.translationText?.trim());
          if (!all[r.langKey]) all[r.langKey] = {};
          // If you want only verified, add: if (!r.verified) continue;
          all[r.langKey][r.translationKey] = value;
        }
        return all;
      },
    }),

    // GET by pair (lang_key + translation_key)
    getTranslationByPair: builder.query({
      query: ({ lang, key }: { lang: string; key: string }) => ({
        url: `/api/setup/translations/by-pair?lang=${encodeURIComponent(lang)}&key=${encodeURIComponent(key)}`,
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useAddTranslationMutation,
  useDeleteTranslationMutation,
  useUpdateTranslationMutation,
  useGetAllTranslationsQuery,
  useGetTranslationsByLangQuery,
  useGetTranslationQuery,
  useGetTranslationByPairQuery,
  useGetDictionaryQuery,
  useLazyGetDictionaryQuery
} = translationService;
