import type { PatientEncounter } from '@/types/model-types-new';

/** The encounter update body (PUT) built from an encounter, as the SOAP sheet sends it */
export const toEncounterPayload = (
  encounter: any
): PatientEncounter => ({
  id: Number(encounter?.id),
  patientId: Number(
    encounter?.patientId ??
    encounter?.patient?.id
  ),
  encounterNumber:
    encounter?.encounterNumber ?? null,
  facilityId: Number(encounter?.facilityId),
  departmentId: Number(encounter?.departmentId),
  practitionerId:
    encounter?.practitionerId ?? null,
  paymentDate: encounter?.paymentDate,
  amount: encounter?.amount,
  encounterType: encounter?.encounterType,
  encounterReason: encounter?.encounterReason,
  followUpEncounterId:
    encounter?.followUpEncounterId ??
    encounter?.followUpEncounter?.id ??
    null,
  priorityLevel: encounter?.priorityLevel,
  originType: encounter?.originType ?? null,
  originName: encounter?.originName ?? null,
  notes: encounter?.notes ?? null,
  departmentDailySequenceNumber:
    encounter?.departmentDailySequenceNumber ??
    null,
  encounterDate:
    encounter?.encounterDate ?? null,
  status: encounter?.status,
  chiefComplaint:
    encounter?.chiefComplaint ?? null,
  hasPrescription: Boolean(
    encounter?.hasPrescription
  ),
  hasOrder: Boolean(encounter?.hasOrder),
  isObserved: Boolean(encounter?.isObserved),
  physicalExaminationSummery:
    encounter?.physicalExaminationSummery ??
    null
});
