import { BaseQuery } from "@/newApi";
import { UserFacilityDepartment } from "@/types/model-types-new";
import { createApi } from "@reduxjs/toolkit/dist/query/react";

export const userFacilityDepartmentService = createApi({
    reducerPath: 'newUserFacilityDepartmentApi',
    baseQuery: BaseQuery,
    tagTypes: ['UserFacilityDepartment'],
    endpoints: builder => ({
      // GET /api/user-facility-departments/user/{userId}
      getUserFacilityDepartmentsByUser: builder.query<UserFacilityDepartment[], number | string>({
        query: (userId) => ({
          url: `/api/setup/user-facility-departments/user/${userId}`,
        }),
      }),
  
      // GET /api/user-facility-departments/exists?facilityId=&userId=&departmentId=
      existsUfd: builder.query<boolean, { facilityId: string | number; userId: string | number; departmentId: string | number }>({
        query: ({ facilityId, userId, departmentId }) => ({
          url: '/api/setup/user-facility-departments/exists',
          params: { facilityId, userId, departmentId },
        }),
      }),
  
      // POST /api/user-facility-departments
      addUserFacilityDepartment: builder.mutation<UserFacilityDepartment, UserFacilityDepartment>({
        query: (ufd) => ({
          url: '/api/setup/user-facility-departments',
          method: 'POST',
          body: ufd,
        }),
      }),
  
      // PATCH /api/user-facility-departments/{id}/toggle
      toggleUserFacilityDepartmentIsActive: builder.mutation<void, number | string>({
        query: (id) => ({
          url: `/api/setup/user-facility-departments/${id}/toggle`,
          method: 'PATCH',
        }),
      }),
    }),
  });
  
  export const {
    useGetUserFacilityDepartmentsByUserQuery,
    useLazyGetUserFacilityDepartmentsByUserQuery,
    useExistsUfdQuery,
    useAddUserFacilityDepartmentMutation,
    useToggleUserFacilityDepartmentIsActiveMutation,
  } = userFacilityDepartmentService;