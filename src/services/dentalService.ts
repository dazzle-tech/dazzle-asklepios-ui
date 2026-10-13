import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ApDentalChartProgressNote } from '@/types/model-types';

/**
 * NOTE (Phase C dental-chart migration): the dental-chart-specific endpoints that used
 * to live here (`getActions`, `getDentalChartsByEncounter`, `modifyToothAction`,
 * `saveChart`, `getChartData`, `modifyToothService`, `fetchTreatmentPlan`,
 * `savePlannedTreatment`, `deletePlannedTreatment`) have all been migrated to the new
 * patient-service-backed `src/services/dental/dentalChartService.ts` and
 * `src/services/dental/dentalTreatmentPlanService.ts`.
 *
 * `saveProgressNotes` / `deleteProgressNote` are kept here (unchanged, still pointed at
 * the legacy general-service `/dental/save-progress-notes` and `/dental/delete-progress-note`
 * endpoints) because they are also reused by the generic, non-dental
 * `src/components/ProgressNotes/ProgressNotes.tsx` component for occupational-therapy,
 * physiotherapy, and tele-consultation progress notes — those call sites are out of scope
 * for this dental-chart migration. Once that generic component is migrated/retired
 * (a separate piece of work), this file can be deleted entirely.
 */
export const dentalService = createApi({
  reducerPath: 'dentalApi',
  baseQuery: baseQuery,
  endpoints: builder => ({
    saveProgressNotes: builder.mutation({
      query: (notes: any) => ({
        url: `/dental/save-progress-notes`,
        method: 'POST',
        body: notes
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    deleteProgressNote: builder.mutation({
      query: (note: ApDentalChartProgressNote) => ({
        url: `/dental/delete-progress-note`,
        method: 'POST',
        body: note
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    })
  })
});

export const { useSaveProgressNotesMutation, useDeleteProgressNoteMutation } = dentalService;
