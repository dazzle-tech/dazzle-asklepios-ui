import { BaseQuery } from "@/newApi";
import { UserDepartment } from "@/types/model-types-new";
import { createApi } from '@reduxjs/toolkit/query/react';

/** Backend may return JPA entities with circular refs — malformed JSON on mutations. */
const parseJsonUserDepartment = (response: string): UserDepartment => {
  if (!response) return {} as UserDepartment;
  try {
    return JSON.parse(response) as UserDepartment;
  } catch {
    return {} as UserDepartment;
  }
};

const mapUserDepartment = (item: any): UserDepartment => ({
  id: item?.id,
  userId: item?.userId,
  facilityId:
    item?.facilityId != null
      ? String(item.facilityId)
      : item?.department?.facility?.id != null
        ? String(item.department.facility.id)
        : null,
  departmentId: item?.departmentId ?? item?.department?.id,
  isActive: item?.isActive,
  isDefault: item?.isDefault,
  departmentName:
    item?.departmentName ?? item?.department?.name ?? item?.name ?? null,
  facilityName:
    item?.facilityName ??
    item?.department?.facility?.name ??
    item?.facility?.name ??
    null,
});

const parseJsonUserDepartmentList = (response: string): UserDepartment[] => {
  if (!response) return [];
  try {
    const parsed = JSON.parse(response);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(mapUserDepartment);
  } catch {
    return [];
  }
};

export const userDepartmentService = createApi({
  reducerPath: 'newUserDepartmentApi',
  baseQuery: BaseQuery,
  tagTypes: ['UserDepartment'],
  endpoints: builder => ({
    // GET /api/user-departments/user/{userId}
    getUserDepartmentsByUser: builder.query<UserDepartment[], number | string>({
      query: (userId) => ({
        url: `/api/setup/user-departments/user/${userId}`,
        responseHandler: 'text',
      }),
      transformResponse: parseJsonUserDepartmentList,
      providesTags: ['UserDepartment'],
    }),

    // GET /api/user-departments/exists?facilityId=&userId=&departmentId=
    existsUfd: builder.query<boolean, { facilityId: string | number; userId: string | number; departmentId: string | number }>({
      query: ({ facilityId, userId, departmentId }) => ({
        url: '/api/setup/user-departments/exists',
        params: { facilityId, userId, departmentId },
      }),
    }),

    // GET /api/user-departments/user/{userId}/active
    getActiveUserDepartmentsByUser: builder.query<
      UserDepartment[],
      { userId: number; facilityId: number | string }
    >({
      query: ({ userId }) => ({
        url: `/api/setup/user-departments/user/${userId}/active`,
        responseHandler: 'text',
      }),
      transformResponse: parseJsonUserDepartmentList,
      providesTags: ['UserDepartment'],
    }),


    // GET /api/user-departments/user/{userId}/default
    getDefaultUserDepartmentByUser: builder.query<UserDepartment | null, number | string>({
      query: userId => ({
        url: `/api/setup/user-departments/user/${userId}/default`,
        responseHandler: 'text',
      }),
      transformResponse: (response: string) => {
        const parsed = parseJsonUserDepartment(response);
        return parsed?.id != null ? parsed : null;
      },
      providesTags: ['UserDepartment']
    }),

    // POST /api/user-departments
    addUserDepartment: builder.mutation<UserDepartment, UserDepartment>({
      query: (ufd) => ({
        url: '/api/setup/user-departments',
        method: 'POST',
        body: ufd,
        responseHandler: 'text',
      }),
      transformResponse: parseJsonUserDepartment,
      invalidatesTags: ['UserDepartment'],
    }),

    // DELETE /api/user-departments/{id}
    deleteUserDepartment: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/api/setup/user-departments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UserDepartment'],
    }),

    // PATCH /api/setup/user-departments/{id}/toggles
    updateUserDepartmentToggles: builder.mutation<
      UserDepartment,
      {
        id: number | string;
        isDefault?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/setup/user-departments/${id}/toggles`,
        method: 'PATCH',
        body,
        responseHandler: 'text',
      }),
      transformResponse: parseJsonUserDepartment,
      invalidatesTags: ['UserDepartment'],
    }),

  }),
});

export const {
  useGetUserDepartmentsByUserQuery,
  useLazyGetUserDepartmentsByUserQuery,
  useExistsUfdQuery,
  useGetActiveUserDepartmentsByUserQuery,
  useLazyGetActiveUserDepartmentsByUserQuery,
  useGetDefaultUserDepartmentByUserQuery,
  useLazyGetDefaultUserDepartmentByUserQuery,
  useAddUserDepartmentMutation,
  useDeleteUserDepartmentMutation,
  useUpdateUserDepartmentTogglesMutation,

} = userDepartmentService;
