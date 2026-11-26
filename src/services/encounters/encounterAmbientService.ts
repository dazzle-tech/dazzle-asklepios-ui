import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import type { AmbientDraft } from '@/services/ai-services/ambientDraft';

export type EncounterAmbientRecord = {
  id: number;
  encounterId: number;
  patientId: number;
  consentStatus: 'GIVEN' | 'DECLINED';
  consentMethod?: 'VERBAL' | 'TABLET' | null;
  microphoneSource?: 'COMPUTER' | 'PHONE' | null;
  consentAt?: string | null;
  recordingStartedAt?: string | null;
  recordingStoppedAt?: string | null;
  recordingDurationMs?: number | null;
  recordingContentType?: string | null;
  recordingFileName?: string | null;
  recordingByteSize?: number | null;
  hasRecording: boolean;
  draft?: AmbientDraft | null;
  draftCreatedAt?: string | null;
  createdDate?: string | null;
  lastModifiedDate?: string | null;
};

export const encounterAmbientService = createApi({
  reducerPath: 'encounterAmbientService',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    createEncounterAmbient: builder.mutation<EncounterAmbientRecord, FormData>({
      query: body => ({
        url: '/api/patient/encounter-ambient',
        method: 'POST',
        body
      })
    }),
    getEncounterAmbientByEncounter: builder.query<EncounterAmbientRecord[], number | string>({
      query: encounterId => `/api/patient/encounter-ambient/by-encounter/${encounterId}`
    }),
    getEncounterAmbient: builder.query<EncounterAmbientRecord, number | string>({
      query: id => `/api/patient/encounter-ambient/${id}`
    }),
    getEncounterAmbientRecording: builder.query<Blob, number | string>({
      query: id => ({
        url: `/api/patient/encounter-ambient/${id}/recording`,
        responseHandler: (response: Response) => response.blob()
      })
    }),
    updateEncounterAmbientDraft: builder.mutation<
      EncounterAmbientRecord,
      { id: number | string; draft: AmbientDraft }
    >({
      query: ({ id, draft }) => ({
        url: `/api/patient/encounter-ambient/${id}/draft`,
        method: 'PUT',
        body: { draft }
      })
    })
  })
});

export const {
  useCreateEncounterAmbientMutation,
  useLazyGetEncounterAmbientByEncounterQuery,
  useLazyGetEncounterAmbientQuery,
  useLazyGetEncounterAmbientRecordingQuery,
  useUpdateEncounterAmbientDraftMutation
} = encounterAmbientService;
