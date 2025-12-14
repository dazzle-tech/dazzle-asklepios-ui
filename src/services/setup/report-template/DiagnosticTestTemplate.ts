// diagnosticTestTemplateService.ts
import { BaseQuery } from "@/newApi";
import { createApi } from "@reduxjs/toolkit/dist/query/react";

// --------- Types ----------
export type DiagnosticTestTemplate = {
  id?: number;
  diagnosticTestId: number;
  name: string;
  templateValue: string; // HTML
  isActive?: boolean;
  createdDate?: string;
  lastModifiedDate?: string;
};

export type DiagnosticTestTemplateCreateVM = {
  diagnosticTestId: number;
  name: string;
  templateValue: string;
  isActive?: boolean;
};

export type DiagnosticTestTemplateUpdateVM = {
  diagnosticTestId: number; // testId is the identifier for update
  name: string;
  templateValue: string;
  isActive?: boolean;
};

export const DiagnosticTestTemplateService = createApi({
  reducerPath: "diagnosticTestTemplateApi",
  baseQuery: BaseQuery,
  tagTypes: ["DiagnosticTestTemplate"],
  endpoints: (builder) => ({

    // 🔹 Assign library template to test (copy)
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

    // 🔹 Create test template (manual)
    createDiagnosticTestTemplate: builder.mutation<
      DiagnosticTestTemplate,
      DiagnosticTestTemplateCreateVM
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

    // 🔹 Update test template by testId
    updateDiagnosticTestTemplate: builder.mutation<
      DiagnosticTestTemplate,
      DiagnosticTestTemplateUpdateVM
    >({
      query: (body) => ({
        url: `/api/setup/diagnostic-test/${body.diagnosticTestId}/template`,
        method: "PUT",
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
      providesTags: (r, e, testId) => [
        { type: "DiagnosticTestTemplate", id: testId },
      ],
    }),

    // 🔹 Delete test template (by template record id)
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
  useCreateDiagnosticTestTemplateMutation,
  useUpdateDiagnosticTestTemplateMutation,
  useGetDiagnosticTestTemplateByTestIdQuery,
  useLazyGetDiagnosticTestTemplateByTestIdQuery,
  useDeleteDiagnosticTestTemplateMutation,
} = DiagnosticTestTemplateService;
