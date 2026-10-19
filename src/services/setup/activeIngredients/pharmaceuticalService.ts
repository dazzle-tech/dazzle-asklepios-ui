import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { Pharmaceutical } from '@/types/model-types-new';

type Id = number | string;

type PharmaceuticalPayload = Pharmaceutical & { id?: Id };

export const pharmaceuticalService = createApi({
  reducerPath: 'pharmaceuticalApi',
  baseQuery: BaseQuery,
  tagTypes: ['Pharmaceuticals'],
  endpoints: (builder) => ({
    getPharmaceuticalsByActiveIngredient: builder.query<Pharmaceutical[], Id>({
      query: (activeIngredientId) => ({
        url: `/api/setup/pharmaceuticals/by-active-ingredient/${activeIngredientId}`,
      }),
      providesTags: [{ type: 'Pharmaceuticals', id: 'LIST' }],
    }),

    // Active pharmaceuticals for the prescription picker.
    searchPharmaceuticals: builder.query<Pharmaceutical[], string | void>({
      query: (search) => ({
        url: '/api/setup/pharmaceuticals',
        params: search ? { search } : undefined,
      }),
      providesTags: [{ type: 'Pharmaceuticals', id: 'LIST' }],
    }),

    getPharmaceuticalById: builder.query<Pharmaceutical, Id>({
      query: (id) => ({
        url: `/api/setup/pharmaceuticals/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'Pharmaceuticals', id }],
    }),

    // Includes inactive pharmaceuticals, so existing prescriptions keep showing their names.
    getPharmaceuticalsByIds: builder.query<Pharmaceutical[], Id[]>({
      query: (ids) => ({
        url: '/api/setup/pharmaceuticals/by-ids',
        params: { ids: ids.join(',') },
      }),
      providesTags: [{ type: 'Pharmaceuticals', id: 'LIST' }],
    }),

    createPharmaceutical: builder.mutation<Pharmaceutical, PharmaceuticalPayload>({
      query: (body) => ({
        url: '/api/setup/pharmaceuticals',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Pharmaceuticals', id: 'LIST' }],
    }),

    updatePharmaceutical: builder.mutation<Pharmaceutical, PharmaceuticalPayload>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/pharmaceuticals/${id}`,
        method: 'PUT',
        body: { id, ...body },
      }),
      invalidatesTags: (_result, _error, { id }) =>
        id != null
          ? [
              { type: 'Pharmaceuticals', id },
              { type: 'Pharmaceuticals', id: 'LIST' },
            ]
          : [{ type: 'Pharmaceuticals', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetPharmaceuticalsByActiveIngredientQuery,
  useSearchPharmaceuticalsQuery,
  useGetPharmaceuticalByIdQuery,
  useGetPharmaceuticalsByIdsQuery,
  useCreatePharmaceuticalMutation,
  useUpdatePharmaceuticalMutation,
} = pharmaceuticalService;

export default pharmaceuticalService;
