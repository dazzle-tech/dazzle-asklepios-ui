import { BaseQuery } from "@/newApi";
import { createApi } from "@reduxjs/toolkit/dist/query/react";


export const userStickyNotesService = createApi({
  reducerPath: "userStickyNotesApi",
  baseQuery: BaseQuery,
  tagTypes: ["UserStickyNotesResponseVM", "UserStickyNotesCreateVM"],
  endpoints: builder => ({

    // 🔹 Get user sticky notes
    getAlluserStickyNotesByUserId: builder.query({
      query: user_id => ({
        url: `/api/patient/user-sticky-notes/${user_id}`,
        method: "GET",
      }),
      providesTags: ["UserStickyNotesResponseVM"],
    }),

     createUserStickyNotes: builder.mutation({
      query: userStickyNotesCreateVM => ({
        url: "/api/patient/user-sticky-notes",
        method: "POST",
        body: userStickyNotesCreateVM,
      }),
      invalidatesTags: ["UserStickyNotesCreateVM"],
    }),

    deleteUserStickyNotes: builder.mutation({
      query: id => ({
        url: `/api/patient/user-sticky-notes/${id}`,
        method: "DELETE",
      }),
    }),

  }),
});

export const {
    useGetAlluserStickyNotesByUserIdQuery,
    useCreateUserStickyNotesMutation,
    useDeleteUserStickyNotesMutation
} = userStickyNotesService;
