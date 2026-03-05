import { BaseQuery } from "@/newApi";
import { createApi } from "@reduxjs/toolkit/dist/query/react";

export const ReviewOfSystemService = createApi({
  reducerPath: "reviewOfSystemApi",
  baseQuery: BaseQuery,
  tagTypes: ["ReviewOfSystem"],
  endpoints: (builder) => ({

    // Get all by encounter
    getReviewOfSystemByEncounter: builder.query<any[], string | number>({
      query: (encounterId) => ({
        url: `/api/patient/${encounterId}/review-of-system`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((r: any) => ({ type: "ReviewOfSystem" as const, id: r.id })),
              "ReviewOfSystem",
            ]
          : ["ReviewOfSystem"],
    }),

    // Get by id
    getReviewOfSystemById: builder.query<any, string | number>({
      query: (id) => ({
        url: `/api/patient/review-of-system/${id}`,
        method: "GET",
      }),
      providesTags: (r, e, id) => [{ type: "ReviewOfSystem", id }],
    }),

    // Create (upsert)
    createReviewOfSystem: builder.mutation<any, any>({
      query: (body) => ({
        url: "/api/patient/review-of-system",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ReviewOfSystem"],
    }),

    // Update
    updateReviewOfSystem: builder.mutation<any, any>({
      query: (body) => ({
        url: `/api/patient/review-of-system/${body.id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "ReviewOfSystem", id }, "ReviewOfSystem"],
    }),

    // Delete by id
    deleteReviewOfSystemById: builder.mutation<void, string | number>({
      query: (id) => ({
        url: `/api/patient/review-of-system/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (r, e, id) => [{ type: "ReviewOfSystem", id }, "ReviewOfSystem"],
    }),
  }),
});

export const {
  useGetReviewOfSystemByEncounterQuery,
  useGetReviewOfSystemByIdQuery,
  useCreateReviewOfSystemMutation,
  useUpdateReviewOfSystemMutation,
  useDeleteReviewOfSystemByIdMutation,
} = ReviewOfSystemService;
