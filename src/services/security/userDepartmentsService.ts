import { BaseQuery } from "@/newApi";
import { UserDepartment } from "@/types/model-types-new";
import { createApi } from "@reduxjs/toolkit/dist/query/react";

export const userDepartmentService = createApi({
    reducerPath: 'newUserDepartmentApi',
    baseQuery: BaseQuery,
    tagTypes: ['UserDepartment'],
    endpoints: builder => ({
      // GET /api/user-departments/user/{userId}
      getUserDepartmentsByUser: builder.query<UserDepartment[], number | string>({
        query: (userId) => ({
          url: `/api/setup/user-departments/user/${userId}`,
        }),
      }),
  
      // GET /api/user-departments/exists?facilityId=&userId=&departmentId=
      existsUfd: builder.query<boolean, { facilityId: string | number; userId: string | number; departmentId: string | number }>({
        query: ({ facilityId, userId, departmentId }) => ({
          url: '/api/setup/user-departments/exists',
          params: { facilityId, userId, departmentId },
        }),
      }),
  
      // POST /api/user-departments
      addUserDepartment: builder.mutation<UserDepartment, UserDepartment>({
        query: (ufd) => ({
          url: '/api/setup/user-departments',
          method: 'POST',
          body: ufd,
        }),
      }),
  
      // PATCH /api/user-departments/{id}/toggle
      toggleUserDepartmentIsActive: builder.mutation<void, number | string>({
        query: (id) => ({
          url: `/api/setup/user-departments/${id}/toggle`,
          method: 'PATCH',
        }),
      }),
    }),
  });
  
  export const {
    useGetUserDepartmentsByUserQuery,
    useLazyGetUserDepartmentsByUserQuery,
    useExistsUfdQuery,
    useAddUserDepartmentMutation,
    useToggleUserDepartmentIsActiveMutation,
  } = userDepartmentService;