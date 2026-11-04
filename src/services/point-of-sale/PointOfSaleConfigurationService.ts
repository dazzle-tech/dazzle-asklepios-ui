import { BaseQuery } from "@/newApi";
import { createApi } from "@reduxjs/toolkit/query/react";

export interface PointOfSaleConfigurationDTO {
  id: number;
  name: string;

  clientId: string;
  clientSecret: string;

  terminalId: string;
  terminalSerialNo?: string;
  terminalType?: string;

  counterNumber?: string;
  cashRegisterNo?: string;

  isActive: boolean;
  occupied: boolean;
}
export interface PointOfSaleconfigrationFilter {
    isActive?:boolean
}
export const PointOfSaleConfigurationService = createApi({
  reducerPath: "pointOfSaleConfigurationApi",
  baseQuery: BaseQuery,
  tagTypes: ["PointOfSaleConfiguration"],

  endpoints: builder => ({
    getPointOfSaleConfigurations: builder.query<
      PointOfSaleConfigurationDTO[],
      PointOfSaleconfigrationFilter
         
    >({
      query: filter => ({
        url: "/api/patient/pos-configration",
        method: "GET",
       params: filter,
      }),
      providesTags: ["PointOfSaleConfiguration"],
    }),

    getPointOfSaleConfiguration: builder.query<
      PointOfSaleConfigurationDTO,
      number
    >({
      query: id => ({
        url: `/api/patient/pos-configration/${id}`,
        method: "GET",
      }),
      providesTags: ["PointOfSaleConfiguration"],
    }),

    createPointOfSaleConfiguration: builder.mutation<
      PointOfSaleConfigurationDTO,
      Omit<PointOfSaleConfigurationDTO, "id">
    >({
      query: body => ({
        url: "/api/patient/pos-configration",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PointOfSaleConfiguration"],
    }),

    updatePointOfSaleConfiguration: builder.mutation<
      PointOfSaleConfigurationDTO,
      PointOfSaleConfigurationDTO
    >({
      query: body => ({
        url: `/api/patient/pos-configration/${body.id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["PointOfSaleConfiguration"],
    }),

    togglePointOfSaleConfigurationActive: builder.mutation<
      PointOfSaleConfigurationDTO,
      number
    >({
      query: id => ({
        url: `/api/patient/pos-configration/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: ["PointOfSaleConfiguration"],
    }),
    registerTerminal: builder.mutation<any, number>({
  query: id => ({
    url: `/api/patient/pos-configration/${id}/register`,
    method: "POST",
  }),
  invalidatesTags: ["PointOfSaleConfiguration"],
}),
  }),
});

export const {
  useGetPointOfSaleConfigurationsQuery,
  useLazyGetPointOfSaleConfigurationsQuery,

  useGetPointOfSaleConfigurationQuery,
  useLazyGetPointOfSaleConfigurationQuery,

  useCreatePointOfSaleConfigurationMutation,
  useUpdatePointOfSaleConfigurationMutation,
  useTogglePointOfSaleConfigurationActiveMutation,
  useRegisterTerminalMutation
} = PointOfSaleConfigurationService;