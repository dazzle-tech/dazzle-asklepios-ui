import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

type Id = number | string;

export type SpringPage<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  sort?: unknown;
  pageable?: unknown;
};

export type PagedResult<T> = {
  data: T[];
  totalCount: number;
  totalPages?: number;
  page?: number;
  size?: number;
};

export type PageableParams = {
  page?: number;
  size?: number;
  sort?: string;
};

export type DocumentCategory = string;
export type DocumentStatus = string;
export type DocumentTargetType = string;
export type DocumentTriggerType = string;
export type DocumentRequirementStatus = string;

export type DocumentVersionResponseVM = {
  id: number;
  documentDefinitionId: number;
  version: number;
  fileName: string;
  mimeType: string;
  status: DocumentStatus;
  createdDate: string;
  effectiveFromDate?: string | null;
  effectiveToDate?: string | null;
  url?: string | null;
};

export type DocumentDefinitionResponseVM = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  category: DocumentCategory;
  status: DocumentStatus;
  activeVersion?: DocumentVersionResponseVM | null;
};

export type DocumentDefinitionDTO = {
  code: string;
  name: string;
  description?: string | null;
  category?: DocumentCategory;
  status?: DocumentStatus;
};

export type DocumentAssignmentResponseVM = {
  id: number;
  documentId: number;
  documentName: string;
  documentCode: string;
  documentVersion?: number | DocumentVersionResponseVM | null;
  documentVersionId?: number;
  targetType?: DocumentTargetType;
  triggerType?: DocumentTargetType | DocumentTriggerType;
  targetId?: number | null;
  trigger?: DocumentTriggerType;
  required: boolean;
  blocking: boolean;
  active?: boolean | null;
};

export type DocumentAssignmentDTO = {
  documentVersionId?: number | null;
  targetType: DocumentTargetType;
  targetId?: number | null;
  triggerType?: DocumentTriggerType | null;
  required: boolean;
  blocking: boolean;
  active?: boolean | null;
};

export type DocumentRequirementVM = {
  assignmentId: number;
  documentId: number;
  documentCode: string;
  documentName: string;
  documentVersionId: number;
  version: number;
  required: boolean;
  blocking: boolean;
  status: DocumentRequirementStatus;
};

export type DocumentTemplateDownloadVM = {
  url: string;
  expiresInSeconds: number;
};

export type SearchDocumentsParams = PageableParams & {
  search?: string;
  status?: DocumentStatus;
};

export type SearchAssignmentsParams = {
  targetType: DocumentTargetType;
  targetId?: number | null;
};

const toPagedResult = <T>(response: SpringPage<T> | T[] | undefined): PagedResult<T> => {
  if (Array.isArray(response)) {
    return { data: response, totalCount: response.length };
  }

  return {
    data: response?.content ?? [],
    totalCount: response?.totalElements ?? 0,
    totalPages: response?.totalPages,
    page: response?.number,
    size: response?.size
  };
};

const DMY_DATE = /^(\d{2})-(\d{2})-(\d{4})$/;
const YMD_DATE = /^(\d{4})-\d{2}-\d{2}$/;

const toCalendarDate = (value: string): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const dmy = trimmed.match(DMY_DATE);
  if (dmy) {
    return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  }

  if (YMD_DATE.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
};

const toIso8601Start = (value: string) => {
  const date = toCalendarDate(value);
  return date ? `${date}T00:00:00Z` : value;
};

const toIso8601End = (value: string) => {
  const date = toCalendarDate(value);
  return date ? `${date}T23:59:59Z` : value;
};

export const documentManagementService = createApi({
  reducerPath: 'documentManagementApi',
  baseQuery: BaseQuery,
  tagTypes: ['DocumentDefinition', 'DocumentVersion', 'DocumentAssignment', 'DocumentRequirement'],
  endpoints: builder => ({
    // ============================================================
    // DOCUMENT ADMINISTRATION
    // ============================================================

    searchDocuments: builder.query<PagedResult<DocumentDefinitionResponseVM>, SearchDocumentsParams>({
      query: ({ search, status, page = 0, size = 20, sort = 'id,desc' }) => ({
        url: '/api/patient/documents-management/search',
        method: 'GET',
        params: {
          ...(search != null && search !== '' ? { search } : {}),
          ...(status != null && status !== '' ? { status } : {}),
          page,
          size,
          sort
        }
      }),
      transformResponse: (response: SpringPage<DocumentDefinitionResponseVM> | DocumentDefinitionResponseVM[]) =>
        toPagedResult(response),
      providesTags: result =>
        result?.data?.length
          ? [
              ...result.data.map(({ id }) => ({ type: 'DocumentDefinition' as const, id })),
              { type: 'DocumentDefinition', id: 'LIST' }
            ]
          : [{ type: 'DocumentDefinition', id: 'LIST' }]
    }),

    createDocument: builder.mutation<DocumentDefinitionResponseVM, DocumentDefinitionDTO>({
      query: body => ({
        url: '/api/patient/documents-management',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'DocumentDefinition', id: 'LIST' }]
    }),

    getDocument: builder.query<DocumentDefinitionResponseVM, Id>({
      query: id => ({
        url: `/api/patient/documents-management/${id}`,
        method: 'GET'
      }),
      providesTags: (_result, _error, id) => [{ type: 'DocumentDefinition', id }]
    }),

    updateDocument: builder.mutation<
      DocumentDefinitionResponseVM,
      { id: Id; body: DocumentDefinitionDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/documents-management/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'DocumentDefinition', id },
        { type: 'DocumentDefinition', id: 'LIST' }
      ]
    }),

    // ============================================================
    // VERSIONS
    // ============================================================

    createDocumentVersion: builder.mutation<
      DocumentVersionResponseVM,
      { documentId: Id; file: File; effectiveFromDate: string; effectiveToDate?: string }
    >({
      query: ({ documentId, file, effectiveFromDate, effectiveToDate }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/api/patient/documents-management/${documentId}/versions`,
          method: 'POST',
          params: {
            effectiveFromDate: toIso8601Start(effectiveFromDate),
            ...(effectiveToDate ? { effectiveToDate: toIso8601End(effectiveToDate) } : {})
          },
          body: formData
        };
      },
      invalidatesTags: (_result, _error, { documentId }) => [
        { type: 'DocumentVersion', id: documentId },
        { type: 'DocumentDefinition', id: documentId },
        { type: 'DocumentDefinition', id: 'LIST' }
      ]
    }),

    getDocumentVersions: builder.query<DocumentVersionResponseVM[], Id>({
      query: id => ({
        url: `/api/patient/documents-management/${id}/versions`,
        method: 'GET'
      }),
      providesTags: (_result, _error, id) => [{ type: 'DocumentVersion', id }]
    }),

    // ============================================================
    // ASSIGNMENTS
    // ============================================================

    createDocumentAssignment: builder.mutation<
      DocumentAssignmentResponseVM,
      { id: Id; body: DocumentAssignmentDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/documents-management/${id}/assignments`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'DocumentAssignment', id },
        { type: 'DocumentAssignment', id: 'LIST' },
        'DocumentRequirement'
      ]
    }),

    getDocumentAssignments: builder.query<DocumentAssignmentResponseVM[], Id>({
      query: id => ({
        url: `/api/patient/documents-management/${id}/assignments`,
        method: 'GET'
      }),
      providesTags: (_result, _error, id) => [{ type: 'DocumentAssignment', id }]
    }),

    searchDocumentAssignments: builder.query<DocumentAssignmentResponseVM[], SearchAssignmentsParams>({
      query: ({ targetType, targetId }) => ({
        url: '/api/patient/documents-management/assignments/search',
        method: 'GET',
        params: {
          targetType,
          ...(targetId != null ? { targetId } : {})
        }
      }),
      providesTags: result =>
        result?.length
          ? [
              ...result.map(({ id }) => ({ type: 'DocumentAssignment' as const, id })),
              { type: 'DocumentAssignment', id: 'LIST' }
            ]
          : [{ type: 'DocumentAssignment', id: 'LIST' }]
    }),

    deleteDocumentAssignment: builder.mutation<void, Id>({
      query: assignmentId => ({
        url: `/api/patient/documents-management/assignments/${assignmentId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'DocumentAssignment', id },
        { type: 'DocumentAssignment', id: 'LIST' },
        'DocumentRequirement'
      ]
    }),

    toggleDocumentAssignmentActive: builder.mutation<DocumentAssignmentResponseVM, Id>({
      query: assignmentId => ({
        url: `/api/patient/documents-management/assignments/${assignmentId}/toggle-active`,
        method: 'PUT'
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'DocumentAssignment', id },
        { type: 'DocumentAssignment', id: 'LIST' },
        'DocumentRequirement'
      ]
    }),

    // ============================================================
    // RUNTIME
    // ============================================================

    getDocumentRequirements: builder.query<
      DocumentRequirementVM[],
      { sourceType: DocumentTargetType; sourceId: Id }
    >({
      query: ({ sourceType, sourceId }) => ({
        url: '/api/patient/documents-management/requirements',
        method: 'GET',
        params: { sourceType, sourceId }
      }),
      providesTags: ['DocumentRequirement']
    }),

    downloadDocumentTemplate: builder.query<DocumentTemplateDownloadVM, Id>({
      query: id => ({
        url: `/api/patient/documents-management/${id}/template`,
        method: 'GET'
      })
    })
  })
});

export const {
  useSearchDocumentsQuery,
  useLazySearchDocumentsQuery,
  useCreateDocumentMutation,
  useGetDocumentQuery,
  useLazyGetDocumentQuery,
  useUpdateDocumentMutation,
  useCreateDocumentVersionMutation,
  useGetDocumentVersionsQuery,
  useLazyGetDocumentVersionsQuery,
  useCreateDocumentAssignmentMutation,
  useGetDocumentAssignmentsQuery,
  useLazyGetDocumentAssignmentsQuery,
  useSearchDocumentAssignmentsQuery,
  useLazySearchDocumentAssignmentsQuery,
  useDeleteDocumentAssignmentMutation,
  useToggleDocumentAssignmentActiveMutation,
  useGetDocumentRequirementsQuery,
  useLazyGetDocumentRequirementsQuery,
  useDownloadDocumentTemplateQuery,
  useLazyDownloadDocumentTemplateQuery
} = documentManagementService;
