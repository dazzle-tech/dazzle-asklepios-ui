import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import type {
  ActivityCategory,
  ActivityPlan,
  ActivityTemplate,
  PatientActivity,
  PatientActivityApplyPlanDTO,
  PatientActivityAssignDTO,
  PatientActivityCancelDTO,
  PatientActivityCompleteDTO,
  PatientActivityCreateDTO,
  PatientActivityUpdateDTO
} from '@/types/model-types-new';

type Id = number | string;

export type PatientActivityPage = {
  data: PatientActivity[];
  totalCount: number;
};

export type PatientActivitySummary = {
  openTasks: number;
  dueToday: number;
  overdue: number;
  completed: number;
};

export type PatientActivityQuery = {
  patientId: Id;
  page?: number;
  size?: number;
  sort?: string;
  category?: string;
  status?: string | string[];
  source?: string;
  search?: string;
};

const listTag = (patientId: Id) => ({ type: 'PatientActivity' as const, id: `LIST-${patientId}` });

/** A change to one patient's activity also changes the cross-patient task lists. */
const changedTags = (patientId: Id) => [listTag(patientId), { type: 'PatientTask' as const, id: 'LIST' }];

export type TaskScope = 'MINE' | 'TEAM' | 'ALL';

export type PatientTaskRow = {
  task: PatientActivity;
  patientName?: string | null;
  medicalRecordNumber?: string | null;
};

export type PatientTaskQuery = {
  scope: TaskScope;
  page?: number;
  size?: number;
  sort?: string;
  status?: string[];
  category?: string;
  priority?: string[];
  planCode?: string;
  unassigned?: boolean;
  overdue?: boolean;
  dueFrom?: string;
  dueTo?: string;
  search?: string;
};

export type PatientTaskSummary = {
  open: number;
  dueToday: number;
  overdue: number;
  unassigned: number;
  completedToday: number;
};

export const patientActivityService = createApi({
  reducerPath: 'patientActivityApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientActivity', 'ActivitySetup', 'PatientTask'],
  endpoints: builder => ({
    getPatientActivitySummary: builder.query<PatientActivitySummary, Id>({
      query: patientId => ({
        url: `/api/patient/activities/patient/${patientId}/summary`
      }),
      providesTags: (_result, _error, patientId) => [listTag(patientId)]
    }),

    getPatientActivities: builder.query<PatientActivityPage, PatientActivityQuery>({
      query: ({ patientId, page = 0, size = 15, sort = 'createdDate,desc', category, status, source, search }) => ({
        url: `/api/patient/activities/patient/${patientId}`,
        params: {
          page,
          size,
          sort,
          ...(category ? { category } : {}),
          ...(status ? { status: Array.isArray(status) ? status.join(',') : status } : {}),
          ...(source ? { source } : {}),
          ...(search ? { search } : {})
        }
      }),
      transformResponse: (response: PatientActivity[], meta) => ({
        data: response ?? [],
        totalCount: Number(meta?.response?.headers?.get('X-Total-Count') ?? response?.length ?? 0)
      }),
      providesTags: (_result, _error, { patientId }) => [listTag(patientId)]
    }),

    addPatientActivity: builder.mutation<PatientActivity, PatientActivityCreateDTO>({
      query: body => ({
        url: '/api/patient/activities',
        method: 'POST',
        body
      }),
      invalidatesTags: (_result, _error, body) => changedTags(body.patientId)
    }),

    updatePatientActivity: builder.mutation<
      PatientActivity,
      { id: Id; patientId: Id; body: PatientActivityUpdateDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/activities/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (_result, _error, { patientId }) => changedTags(patientId)
    }),

    completePatientActivity: builder.mutation<
      PatientActivity,
      { id: Id; patientId: Id; body: PatientActivityCompleteDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/activities/${id}/complete`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (_result, _error, { patientId }) => changedTags(patientId)
    }),

    cancelPatientActivity: builder.mutation<
      PatientActivity,
      { id: Id; patientId: Id; body: PatientActivityCancelDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/activities/${id}/cancel`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (_result, _error, { patientId }) => changedTags(patientId)
    }),

    applyActivityPlan: builder.mutation<PatientActivity[], PatientActivityApplyPlanDTO>({
      query: body => ({
        url: '/api/patient/activities/apply-plan',
        method: 'POST',
        body
      }),
      invalidatesTags: (_result, _error, body) => changedTags(body.patientId)
    }),

    assignPatientActivity: builder.mutation<
      PatientActivity,
      { id: Id; patientId: Id; body: PatientActivityAssignDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/activities/${id}/assign`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (_result, _error, { patientId }) => changedTags(patientId)
    }),

    claimPatientActivity: builder.mutation<PatientActivity, { id: Id; patientId: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/activities/${id}/claim`,
        method: 'PATCH'
      }),
      invalidatesTags: (_result, _error, { patientId }) => changedTags(patientId)
    }),

    markPatientActivityChecklist: builder.mutation<
      PatientActivity,
      { id: Id; patientId: Id; index: number; done: boolean }
    >({
      query: ({ id, index, done }) => ({
        url: `/api/patient/activities/${id}/checklist`,
        method: 'PATCH',
        body: { index, done }
      }),
      invalidatesTags: (_result, _error, { patientId }) => changedTags(patientId)
    }),

    getActivityCategories: builder.query<ActivityCategory[], void>({
      query: () => ({ url: '/api/patient/activity-categories' }),
      providesTags: [{ type: 'ActivitySetup', id: 'CATEGORIES' }]
    }),

    saveActivityCategory: builder.mutation<ActivityCategory, ActivityCategory>({
      // Only the DTO fields: the backend rejects unknown ones such as the audit columns
      query: ({ id, code, name, icon, color, viewOrder, isActive }) => ({
        url: id ? `/api/patient/activity-categories/${id}` : '/api/patient/activity-categories',
        method: id ? 'PUT' : 'POST',
        body: { code, name, icon, color, viewOrder, isActive }
      }),
      invalidatesTags: [{ type: 'ActivitySetup', id: 'CATEGORIES' }]
    }),

    toggleActivityCategory: builder.mutation<ActivityCategory, Id>({
      query: id => ({
        url: `/api/patient/activity-categories/${id}/toggle-active`,
        method: 'PUT'
      }),
      invalidatesTags: [{ type: 'ActivitySetup', id: 'CATEGORIES' }]
    }),

    getActivityTemplates: builder.query<ActivityTemplate[], void>({
      query: () => ({ url: '/api/patient/activity-templates' }),
      providesTags: [{ type: 'ActivitySetup', id: 'TEMPLATES' }]
    }),

    saveActivityTemplate: builder.mutation<ActivityTemplate, ActivityTemplate>({
      query: ({ id, ...template }) => ({
        url: id ? `/api/patient/activity-templates/${id}` : '/api/patient/activity-templates',
        method: id ? 'PUT' : 'POST',
        body: {
          code: template.code,
          name: template.name,
          description: template.description,
          categoryCode: template.categoryCode,
          kind: template.kind,
          defaultPriority: template.defaultPriority,
          dueOffset: template.dueOffset,
          dueUnit: template.dueUnit,
          assigneeRoles: template.assigneeRoles,
          creatorRoles: template.creatorRoles,
          outcomeOptions: template.outcomeOptions,
          checklist: template.checklist,
          requireOutcome: template.requireOutcome,
          viewOrder: template.viewOrder,
          isActive: template.isActive
        }
      }),
      invalidatesTags: [{ type: 'ActivitySetup', id: 'TEMPLATES' }]
    }),

    toggleActivityTemplate: builder.mutation<ActivityTemplate, Id>({
      query: id => ({
        url: `/api/patient/activity-templates/${id}/toggle-active`,
        method: 'PUT'
      }),
      invalidatesTags: [{ type: 'ActivitySetup', id: 'TEMPLATES' }]
    }),

    getPatientTasks: builder.query<{ data: PatientTaskRow[]; totalCount: number }, PatientTaskQuery>({
      query: ({ page = 0, size = 20, sort = 'dueAt,asc', status, priority, ...rest }) => ({
        url: '/api/patient/tasks',
        params: {
          page,
          size,
          sort,
          ...(status?.length ? { status: status.join(',') } : {}),
          ...(priority?.length ? { priority: priority.join(',') } : {}),
          ...Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined && value !== '' && value !== false))
        }
      }),
      transformResponse: (response: PatientTaskRow[], meta) => ({
        data: response ?? [],
        totalCount: Number(meta?.response?.headers?.get('X-Total-Count') ?? response?.length ?? 0)
      }),
      providesTags: [{ type: 'PatientTask', id: 'LIST' }]
    }),

    getPatientTaskSummary: builder.query<PatientTaskSummary, TaskScope>({
      query: scope => ({ url: '/api/patient/tasks/summary', params: { scope } }),
      providesTags: [{ type: 'PatientTask', id: 'LIST' }]
    }),

    getActivityPlans: builder.query<ActivityPlan[], void>({
      query: () => ({ url: '/api/patient/activity-plans' }),
      providesTags: [{ type: 'ActivitySetup', id: 'PLANS' }]
    }),

    saveActivityPlan: builder.mutation<ActivityPlan, ActivityPlan>({
      query: ({ id, code, name, description, items, viewOrder, isActive }) => ({
        url: id ? `/api/patient/activity-plans/${id}` : '/api/patient/activity-plans',
        method: id ? 'PUT' : 'POST',
        body: {
          code,
          name,
          description,
          items: items.map(({ templateCode, dueOffset, dueUnit, note }) => ({
            templateCode,
            dueOffset,
            dueUnit,
            note
          })),
          viewOrder,
          isActive
        }
      }),
      invalidatesTags: [{ type: 'ActivitySetup', id: 'PLANS' }]
    }),

    toggleActivityPlan: builder.mutation<ActivityPlan, Id>({
      query: id => ({
        url: `/api/patient/activity-plans/${id}/toggle-active`,
        method: 'PUT'
      }),
      invalidatesTags: [{ type: 'ActivitySetup', id: 'PLANS' }]
    })
  })
});

export const {
  useGetPatientActivitySummaryQuery,
  useGetPatientActivitiesQuery,
  useAddPatientActivityMutation,
  useUpdatePatientActivityMutation,
  useCompletePatientActivityMutation,
  useCancelPatientActivityMutation,
  useAssignPatientActivityMutation,
  useClaimPatientActivityMutation,
  useMarkPatientActivityChecklistMutation,
  useGetActivityCategoriesQuery,
  useSaveActivityCategoryMutation,
  useToggleActivityCategoryMutation,
  useGetActivityTemplatesQuery,
  useSaveActivityTemplateMutation,
  useToggleActivityTemplateMutation,
  useApplyActivityPlanMutation,
  useGetActivityPlansQuery,
  useSaveActivityPlanMutation,
  useToggleActivityPlanMutation,
  useGetPatientTasksQuery,
  useGetPatientTaskSummaryQuery
} = patientActivityService;
