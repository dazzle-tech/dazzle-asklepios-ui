import MyModal from '@/components/MyModal/MyModal';
import React, { useMemo } from 'react';
import PatientHistorySummary from './PatientHistorySummary';
import { ApEncounter, ApPatient } from '@/types/model-types';
import { useGetMiniSummaryQuery } from '@/services/encounterService';

import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { useGetPractitionerByUserIdQuery } from '@/services/setup/practitioner/PractitionerService';

interface AiAssistantPopupProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  encounter?: ApEncounter;
  patient?: ApPatient;
}

// ==========================
// helpers
// ==========================
const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));

const capLabel = (s: string) => {
  const x = toStr(s).trim();
  if (!x) return '';
  return x.charAt(0).toUpperCase() + x.slice(1).toLowerCase();
};

// removes duplicates (NURSE / nurse / NURSE) and keeps first casing
const uniqKeepFirst = (arr: string[]) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of arr) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return out;
};

const parseDiagnosis = (raw: any) => {
  const text = String(raw ?? '').trim();
  if (!text) return null;

  if (!text.includes('-')) {
    return {
      type: '',
      value: text
    };
  }

  const [typePart, ...rest] = text.split('-');

  return {
    type: typePart.trim(),
    value: rest.join('-').trim()
  };
};

// "Role: NURSE | Specialty: RESIDENT_DOCTOR"
const formatPractitioner = (practitioner: any) => {
  if (!practitioner) return '';

  const roleRaw = toStr(
    practitioner?.jobRole ||
      practitioner?.role ||
      practitioner?.roleName ||
      practitioner?.roleCode ||
      practitioner?.jobRoleName ||
      practitioner?.jobRoleCode
  ).trim();

  const specialtyRaw = toStr(
    practitioner?.specialty ||
      practitioner?.specialtyName ||
      practitioner?.specialtyCode
  ).trim();

  const role = uniqKeepFirst(
    roleRaw
      .split(/[+|,]/g)
      .map(s => s.trim())
      .filter(Boolean)
  ).join(' + ');

  const specialty = uniqKeepFirst(
    specialtyRaw
      .split(/[+|,]/g)
      .map(s => s.trim())
      .filter(Boolean)
  ).join(' + ');

  const parts: string[] = [];
  if (role) parts.push(`${capLabel('role')}: ${role}`);
  if (specialty) parts.push(`${capLabel('specialty')}: ${specialty}`);

  return parts.join(' | ');
};

const buildPatientInfo = (patient: any) => {
  return {
    mrn: toStr(patient?.patientMrn || patient?.mrn),
    fullName: toStr(patient?.fullName || patient?.patientFullName),
    gender: toStr(patient?.genderLvalue?.lovDisplayVale || patient?.gender),
    dob: toStr(patient?.dob)
  };
};

const buildVisitInfo = (encounter: any) => {
  return {
    visitId: toStr(encounter?.visitId),
    visitType: toStr(encounter?.visitTypeLvalue?.lovDisplayVale || encounter?.visitType),
    plannedStartDate: toStr(encounter?.plannedStartDate),
    chiefComplaint: toStr(encounter?.chiefComplaint),
    patientAge: toStr(encounter?.patientAge)
  };
};

const AiAssistantPopup: React.FC<AiAssistantPopupProps> = ({
  open,
  setOpen,
  encounter,
  patient
}) => {
  const handleCancel = () => setOpen(false);

  const patientKey = patient?.key;
  const encounterKey = encounter?.key;

  // user from redux
  const user = useSelector((state: RootState) => state.auth.user);
  const userId = user?.id;

  // practitioner by userId
  const {
    data: practitioner,
    isLoading: practitionerLoading,
    error: practitionerError
  } = useGetPractitionerByUserIdQuery(userId as number, {
    skip: !open || !userId
  });

  // mini summary
  const { data: miniSummary, isLoading, error } = useGetMiniSummaryQuery(
    { patientKey, encounterKey, lang: 'en' },
    { skip: !patientKey || !encounterKey || !open }
  );


  // ✅ Payload مثل الصورة (UserRoleRecommendationRequest shape)
  const aiPayload = useMemo(() => {
    const practitionerStr = formatPractitioner(practitioner);
    const diagnosisParsed = parseDiagnosis(miniSummary?.diagnosis);

    const allergiesArr: string[] = Array.isArray(miniSummary?.allergies)
      ? miniSummary.allergies
      : [];

    const warningsStr: string = toStr(miniSummary?.medicalWarnings || miniSummary?.warnings).trim();

    return {
      patient: buildPatientInfo(patient),
      visit: buildVisitInfo(encounter),
      complain: toStr(encounter?.chiefComplaint),

      diagnosis: diagnosisParsed && {
        type: diagnosisParsed.type,
        value: diagnosisParsed.value
      },

      practitioner: practitionerStr,
      miniSummary: {
        allergies: allergiesArr,
        medicalWarnings: warningsStr
      }
    };
  }, [practitioner, patient, encounter, miniSummary]);


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Clinical Recommendations"
      size="md"
      bodyheight="80vh"
      hideActionBtn={true}
      handleCancelFunction={handleCancel}
      content={
        <PatientHistorySummary
          title="Clinical Recommendations"
          data={miniSummary}
          aiPayload={aiPayload}
          loading={isLoading || practitionerLoading}
          error={error || practitionerError}
        />
      }
    />
  );
};

export default AiAssistantPopup;