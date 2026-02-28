import { createApi } from '@reduxjs/toolkit/query/react';
import {BaseQuery } from '../../newApi';

export const organizationDefinitionService = createApi({
  reducerPath: 'organizationDefinitionApi',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    createOrganizationDefinition: builder.mutation({
      query: organization => ({
        url: '/api/setup/organization-definition',
        method: 'POST',
        body: organization,
      }),
    }),
    updateOrganizationDefinition: builder.mutation({
      query: (organization) => ({
        url: `/api/setup/organization-definition/${organization.id}`,
        method: 'PUT',
        body: organization,
      }),
    }),

    getAllOrganizationDefinitions: builder.query({
      query: () => ({
        url: '/api/setup/organization-definition',
        method: 'GET',
      }),
    }),

    getOrganizationDefinitionById: builder.query({
      query: (organizationId) => ({
        url: `/api/setup/organization-definition/${organizationId}`,
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useCreateOrganizationDefinitionMutation,
  useUpdateOrganizationDefinitionMutation,
  useGetAllOrganizationDefinitionsQuery,
  useGetOrganizationDefinitionByIdQuery,
} = organizationDefinitionService;

