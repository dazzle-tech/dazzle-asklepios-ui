import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { LanguageTranslation } from '@/types/model-types-new';
type PagedParams = { page?: number; size?: number; sort?: string };
type LinkMap = { next?: string | null; prev?: string | null; first?: string | null; last?: string | null };
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

const parseLinkHeader = (linkHeader?: string | null): LinkMap | undefined => {
  if (!linkHeader) return undefined;
  const parts = linkHeader.split(',');
  const map: LinkMap = {};
  for (const p of parts) {
    const m = p.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (m) {
      const [, url, rel] = m;
      (map as any)[rel] = url;
    }
  }
  return map;
};

const qs = (o: Record<string, unknown>) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

export const translationService = createApi({
  reducerPath: 'translationApi',
   tagTypes: ['Translations'],
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
      query: (langKey: string , ) => ({
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
  getTranslations: builder.query<
      PagedResult<LanguageTranslation>,
      { lang?: string; value?: string } & PagedParams | void
    >({
      query: (args) => {
        if (!args) return { url: '/api/setup/translations', method: 'GET' };
        const queryString = qs({
          lang: args.lang,
          value: args.value,
          page: args.page ?? 0,
          size: args.size ?? 10,
          sort: args.sort ?? 'id,asc',
        });
        return { url: `/api/setup/translations?${queryString}`, method: 'GET' };
      },
      transformResponse: (rows: LanguageTranslation[], meta): PagedResult<LanguageTranslation> => {
        const headers = meta?.response?.headers;
        // Header names are case-insensitive, but .get expects exact string; most servers send 'X-Total-Count'
        const total = Number(headers?.get('X-Total-Count') ?? rows?.length ?? 0);
        return {
          data: rows,
          totalCount: total,
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['Translations'],
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
  useLazyGetDictionaryQuery,
  useGetTranslationsQuery,
} = translationService;
