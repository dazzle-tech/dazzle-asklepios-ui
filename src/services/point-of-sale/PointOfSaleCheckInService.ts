import { BaseQuery } from "@/newApi";
import { createApi } from "@reduxjs/toolkit/dist/query/react";

export interface PointOfSaleCheckInDTO {
    id: number;
    userLogin: string;
    configurationId: number;
    configurationName: string;
    active: boolean;
    checkInDate: string;
    checkOutDate: string | null;
}
export interface PointOfSaleHistoryFilter {
    userLogin?: string;
    configurationId?: number;
    active?: boolean;

    checkInDateFrom?: string;
    checkInDateTo?: string;

    checkOutDateFrom?: string;
    checkOutDateTo?: string;

    page?: number;
    size?: number;
    sort?: string;
}

export const PointOfSaleCheckInService = createApi({
    reducerPath: "pointOfSaleCheckInApi",
    baseQuery: BaseQuery,
    tagTypes: ["PointOfSaleCheckIn"],

    endpoints: (builder) => ({

        // 🔹 Check In
        checkInPointOfSale: builder.mutation<
            PointOfSaleCheckInDTO,
            number
        >({
            query: (configurationId) => ({
                url: `/api/patient/pos/check-in/${configurationId}`,
                method: "POST",
            }),
            invalidatesTags: ["PointOfSaleCheckIn"],
        }),

        // 🔹 Check Out
        checkOutPointOfSale: builder.mutation<void, void>({
            query: () => ({
                url: "/api/patient/pos/check-out",
                method: "POST",
            }),
            invalidatesTags: ["PointOfSaleCheckIn"],
        }),

        // 🔹 Get Current Check In
        getCurrentPointOfSaleCheckIn: builder.query<
            PointOfSaleCheckInDTO,
            void
        >({
            query: () => ({
                url: "/api/patient/pos/current",
                method: "GET",
            }),
            providesTags: ["PointOfSaleCheckIn"],
        }),
        getPointOfSaleHistory: builder.query<
            PointOfSaleCheckInDTO[],
            PointOfSaleHistoryFilter
        >({
            query: filter => ({
                url: '/api/patient/pos/history',
                method: 'GET',
                params: filter,
            }),
            providesTags: ['PointOfSaleCheckIn'],
        }),
    }),
});

export const {
    useCheckInPointOfSaleMutation,
    useCheckOutPointOfSaleMutation,
    useGetCurrentPointOfSaleCheckInQuery,
    useLazyGetCurrentPointOfSaleCheckInQuery,
    useGetPointOfSaleHistoryQuery,
    useLazyGetPointOfSaleHistoryQuery
} = PointOfSaleCheckInService;