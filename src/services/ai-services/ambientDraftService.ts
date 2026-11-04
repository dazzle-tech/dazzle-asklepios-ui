import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import type { AmbientDraft } from './ambientDraft';
import { toSupportedAudioFile } from './supportedAudio';

export type AmbientDraftRequest = {
  audio: Blob;
  noteLanguage?: string | null;
  instructionLanguage?: string | null;
  specialty?: string | null;
  noteLength?: string | null;
  noteForm?: string | null;
  patientContext?: string | null;
  suggestIcd10?: boolean | null;
  suggestOrders?: boolean | null;
  ambientId?: number | string | null;
};

const appendDraftField = (
  formData: FormData,
  name: string,
  value: string | number | boolean | null | undefined,
  lowercase = false
) => {
  if (value == null || value === '') {
    return;
  }
  const text = String(value);
  formData.append(name, lowercase ? text.toLowerCase() : text);
};

export type AmbientRegenerateRequest = {
  transcript: unknown;
  section: string;
  instruction: string;
  noteLanguage?: string | null;
  instructionLanguage?: string | null;
  specialty?: string | null;
  noteLength?: string | null;
  noteForm?: string | null;
  patientContext?: string | Record<string, unknown> | null;
  suggestIcd10?: boolean | null;
  suggestOrders?: boolean | null;
};

const lowercaseField = (value?: string | null) => {
  const text = (value || '').trim();
  return text ? text.toLowerCase() : null;
};

const patientContextValue = (value?: string | Record<string, unknown> | null) => {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const ambientDraftService = createApi({
  reducerPath: 'ambientDraftService',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    createAmbientDraft: builder.mutation<AmbientDraft, AmbientDraftRequest>({
      queryFn: async (request, _api, _extraOptions, baseQuery) => {
        const audio = await toSupportedAudioFile(request.audio);
        const formData = new FormData();
        formData.append('audio', audio);
        appendDraftField(formData, 'noteLanguage', request.noteLanguage, true);
        appendDraftField(formData, 'instructionLanguage', request.instructionLanguage, true);
        appendDraftField(formData, 'specialty', request.specialty, true);
        appendDraftField(formData, 'noteLength', request.noteLength, true);
        appendDraftField(formData, 'noteForm', request.noteForm, true);
        appendDraftField(formData, 'patientContext', request.patientContext);
        appendDraftField(formData, 'suggestIcd10', request.suggestIcd10);
        appendDraftField(formData, 'suggestOrders', request.suggestOrders);
        appendDraftField(formData, 'ambientId', request.ambientId);
        const result = await baseQuery({
          url: '/api/analytics/ambient-draft',
          method: 'POST',
          body: formData
        });
        if (result.error) {
          return { error: result.error };
        }
        return { data: result.data as AmbientDraft };
      }
    }),
    regenerateAmbientSection: builder.mutation<unknown, AmbientRegenerateRequest>({
      query: request => ({
        url: '/api/analytics/ambient-draft/regenerate',
        method: 'POST',
        body: {
          transcript: request.transcript ?? [],
          section: request.section,
          instruction: request.instruction,
          noteLanguage: lowercaseField(request.noteLanguage),
          instructionLanguage: lowercaseField(request.instructionLanguage),
          specialty: lowercaseField(request.specialty),
          noteLength: lowercaseField(request.noteLength),
          noteForm: lowercaseField(request.noteForm),
          patientContext: patientContextValue(request.patientContext),
          suggestIcd10: Boolean(request.suggestIcd10),
          suggestOrders: Boolean(request.suggestOrders)
        }
      })
    })
  })
});

export const { useCreateAmbientDraftMutation, useRegenerateAmbientSectionMutation } = ambientDraftService;
