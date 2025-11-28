// diagnosticTestTemplateService.ts
import { BaseQuery } from "@/newApi";
import { createApi } from "@reduxjs/toolkit/dist/query/react";

// --------- Types (adjust to your model) ----------
export type DiagnosticTestTemplate = {
  id?: number;
  diagnosticTestId: number;
  name: string;
  templateValue: string; // HTML
  isActive?: boolean;
  createdDate?: string;
  lastModifiedDate?: string;
};

export type DiagnosticTestTemplateSaveVM = {
  diagnosticTestId: number;
  name: string;
  templateValue: string;
  isActive?: boolean;
};

export const DiagnosticTestTemplateService = createApi({
  reducerPath: "diagnosticTestTemplateApi",
  baseQuery: BaseQuery,
  tagTypes: ["DiagnosticTestTemplate"],
  endpoints: (builder) => ({

    // 🔹 Assign library template to test
    assignLibraryTemplateToTest: builder.mutation<
      DiagnosticTestTemplate,
      { testId: number; templateId: number }
    >({
      query: ({ testId, templateId }) => ({
        url: `/api/setup/diagnostic-test/${testId}/template/assign/${templateId}`,
        method: "POST",
      }),
      invalidatesTags: (r, e, { testId }) => [
        { type: "DiagnosticTestTemplate", id: testId },
        "DiagnosticTestTemplate",
      ],
    }),

    // 🔹 Save test template (manual create/update)
    saveDiagnosticTestTemplate: builder.mutation<
      DiagnosticTestTemplate,
      DiagnosticTestTemplateSaveVM
    >({
      query: (body) => ({
        url: "/api/setup/diagnostic-test/template",
        method: "POST",
        body,
      }),
      invalidatesTags: (r, e, body) => [
        { type: "DiagnosticTestTemplate", id: body.diagnosticTestId },
        "DiagnosticTestTemplate",
      ],
    }),

    // 🔹 Get test template by testId
    getDiagnosticTestTemplateByTestId: builder.query<
      DiagnosticTestTemplate | null,
      number
    >({
      query: (testId) => ({
        url: `/api/setup/diagnostic-test/${testId}/template`,
        method: "GET",
      }),
      // backend returns 204 noContent if none, RTK will treat as error unless handled by BaseQuery
      // if BaseQuery already maps 204 to null you're good. otherwise keep as-is.
      providesTags: (r, e, testId) => [{ type: "DiagnosticTestTemplate", id: testId }],
    }),

    // 🔹 Delete test template (optional)
    deleteDiagnosticTestTemplate: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/setup/diagnostic-test/template/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DiagnosticTestTemplate"],
    }),
  }),
});

export const {
  useAssignLibraryTemplateToTestMutation,
  useSaveDiagnosticTestTemplateMutation,
  useGetDiagnosticTestTemplateByTestIdQuery,
  useLazyGetDiagnosticTestTemplateByTestIdQuery,
  useDeleteDiagnosticTestTemplateMutation,
} = DiagnosticTestTemplateService;
