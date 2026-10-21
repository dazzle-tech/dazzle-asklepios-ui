import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

export type AmbientScribePractitioner = {
  id: number;
  name: string;
  enabled: boolean;
};

export type AmbientScribeClinic = {
  id: number | null;
  departmentId: number;
  departmentName: string;
  enabled: boolean;
  practitioners: AmbientScribePractitioner[];
};

export type AmbientScribeSetting = {
  id: number | null;
  facilityId: number;
  noteLanguage: string;
  instructionLanguage: string;
  noteStyle: string;
  suggestIcd10: boolean;
  suggestOrders: boolean;
  audioRetention: string;
  consentVerbal: boolean;
  consentTablet: boolean;
  recordingAccess: string;
  allowAnonymizedAudio: boolean;
  clinics: AmbientScribeClinic[];
};

export type AmbientScribeUpdate = {
  noteLanguage: string;
  instructionLanguage: string;
  noteStyle: string;
  suggestIcd10: boolean;
  suggestOrders: boolean;
  audioRetention: string;
  consentVerbal: boolean;
  consentTablet: boolean;
  recordingAccess: string;
  allowAnonymizedAudio: boolean;
  clinics: {
    departmentId: number;
    enabled: boolean;
    practitionerIds: number[];
  }[];
};

export const toAmbientScribeUpdate = (setting: AmbientScribeSetting): AmbientScribeUpdate => ({
  noteLanguage: setting.noteLanguage,
  instructionLanguage: setting.instructionLanguage,
  noteStyle: setting.noteStyle,
  suggestIcd10: setting.suggestIcd10,
  suggestOrders: setting.suggestOrders,
  audioRetention: setting.audioRetention,
  consentVerbal: setting.consentVerbal,
  consentTablet: setting.consentTablet,
  recordingAccess: setting.recordingAccess,
  allowAnonymizedAudio: setting.allowAnonymizedAudio,
  clinics: setting.clinics.map(clinic => ({
    departmentId: clinic.departmentId,
    enabled: clinic.enabled,
    practitionerIds: clinic.practitioners
      .filter(practitioner => practitioner.enabled)
      .map(practitioner => practitioner.id)
  }))
});

export const ambientScribeSetupService = createApi({
  reducerPath: 'ambientScribeSetupService',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    getAmbientScribeSetup: builder.query<AmbientScribeSetting, number | string>({
      query: facilityId => `/api/setup/ambient-scribe/by-facility/${facilityId}`
    }),
    saveAmbientScribeSetup: builder.mutation<
      AmbientScribeSetting,
      { facilityId: number | string; body: AmbientScribeUpdate }
    >({
      query: ({ facilityId, body }) => ({
        url: `/api/setup/ambient-scribe/by-facility/${facilityId}`,
        method: 'PUT',
        body
      })
    }),
    setAmbientScribeClinicsEnabled: builder.mutation<
      AmbientScribeSetting,
      { facilityId: number | string; enabled: boolean }
    >({
      query: ({ facilityId, enabled }) => ({
        url: `/api/setup/ambient-scribe/by-facility/${facilityId}/clinics-enabled`,
        method: 'POST',
        body: { enabled }
      })
    })
  })
});

export const {
  useGetAmbientScribeSetupQuery,
  useSaveAmbientScribeSetupMutation,
  useSetAmbientScribeClinicsEnabledMutation
} = ambientScribeSetupService;
