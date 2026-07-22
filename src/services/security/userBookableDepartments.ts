import { BaseQuery } from "@/newApi";
import {
  UserBookableDepartment,
  UserBookableDepartmentCreateVM,
  UserBookableDepartmentResponseVM,
} from "@/types/model-types-new";
import { createApi } from '@reduxjs/toolkit/query/react';

/** Backend may return JPA entities with circular refs — malformed JSON on mutations. */
const parseJsonUserBookableDepartment = (response: string): UserBookableDepartment => {
  if (!response) return {} as UserBookableDepartment;
  try {
    return JSON.parse(response) as UserBookableDepartment;
  } catch {
    return {} as UserBookableDepartment;
  }
};

const parseJsonUserBookableDepartmentList = (response: string): UserBookableDepartmentResponseVM[] => {
  if (!response) return [];
  try {
    const parsed = JSON.parse(response);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const userBookableDepartmentService = createApi({
  reducerPath: 'newUserBookableDepartmentApi',
  baseQuery: BaseQuery,
  tagTypes: ['UserBookableDepartment'],
  endpoints: builder => ({
    // POST /api/setup/user-bookable-departments
    addUserBookableDepartment: builder.mutation<UserBookableDepartment, UserBookableDepartmentCreateVM>({
      query: (body) => ({
        url: '/api/setup/user-bookable-departments',
        method: 'POST',
        body,
        responseHandler: 'text',
      }),
      transformResponse: parseJsonUserBookableDepartment,
      invalidatesTags: ['UserBookableDepartment'],
    }),

    // GET /api/setup/user-bookable-departments/exists?userId=&departmentId=
    existsUserBookableDepartment: builder.query<
      boolean,
      { userId: string | number; departmentId: string | number }
    >({
      query: ({ userId, departmentId }) => ({
        url: '/api/setup/user-bookable-departments/exists',
        params: { userId, departmentId },
      }),
    }),

    // DELETE /api/setup/user-bookable-departments/{id}
    deleteUserBookableDepartment: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/api/setup/user-bookable-departments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UserBookableDepartment'],
    }),

    // GET /api/setup/user-bookable-departments/user/{userId}/active
    getActiveUserBookableDepartmentsByUser: builder.query<
      UserBookableDepartmentResponseVM[],
      number | string
    >({
      query: (userId) => ({
        url: `/api/setup/user-bookable-departments/user/${userId}/active`,
        responseHandler: 'text',
      }),
      transformResponse: parseJsonUserBookableDepartmentList,
      providesTags: ['UserBookableDepartment'],
    }),
  }),
});

export const {
  useAddUserBookableDepartmentMutation,
  useExistsUserBookableDepartmentQuery,
  useLazyExistsUserBookableDepartmentQuery,
  useDeleteUserBookableDepartmentMutation,
  useGetActiveUserBookableDepartmentsByUserQuery,
  useLazyGetActiveUserBookableDepartmentsByUserQuery,
} = userBookableDepartmentService;
