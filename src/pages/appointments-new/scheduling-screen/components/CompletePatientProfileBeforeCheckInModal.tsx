import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Col, Divider, Form, Panel, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble, faUser } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useEnumOptions } from '@/services/enumsApi';
import { useLazyGetAgeGroupByBirthDateQuery } from '@/services/setup/ageGroupService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  useGetPatientByIdQuery,
  useUpdatePatientMutation
} from '@/services/patient/patientService';
import { useGetPatientProfilePictureQuery } from '@/services/patients/attachmentService';
import { calculateAgeFormat } from '@/utils';
import type { Patient } from '@/types/model-types-new';
import { newPatient } from '@/types/model-types-constructor-new';
import BasicInfo from '@/pages/patient/patient-profile/tabs/BasicInfo';
import ContactTab from '@/pages/patient/patient-profile/tabs/ContactTab';
import ProfileTabs from '@/pages/patient/patient-profile/ProfileTabs-new';

type CompletePatientProfileBeforeCheckInModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  patientId: number | null;
  onCompleted?: (patient: Patient) => void | Promise<void>;
};

const NAME_FIELDS: { key: keyof Patient; label: string }[] = [
  { key: 'firstName', label: 'First Name' },
  { key: 'secondName', label: 'Second Name' },
  { key: 'thirdName', label: 'Third Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'firstNameSecondaryLang', label: 'First Name (Sec. Lang)' },
  { key: 'secondNameSecondaryLang', label: 'Second Name (Sec. Lang)' },
  { key: 'thirdNameSecondaryLang', label: 'Third Name (Sec. Lang)' },
  { key: 'lastNameSecondaryLang', label: 'Last Name (Sec. Lang)' }
];

const INVALID_TRAILING_CHARS = /[\s\-#.]+$/;

const validatePatientNameFields = (patient: Patient): string | null => {
  for (const { key, label } of NAME_FIELDS) {
    const value = String((patient as any)[key] ?? '');
    if (!value) continue;
    if (INVALID_TRAILING_CHARS.test(value)) {
      return `${label} must not end with a space, hyphen (-), or hash (#).`;
    }
  }
  return null;
};

const toHumanBackendError = (err: any, fieldLabels: Record<string, string> = {}): string => {
  const data = err?.data ?? {};
  const errorKey = data?.errorKey;
  const title = data?.title || '';
  const detail = data?.detail || '';
  const message = data?.message || '';
  const rawFieldErrors = data?.fieldErrors;

  const fieldErrors = Array.isArray(rawFieldErrors)
    ? rawFieldErrors
    : rawFieldErrors && typeof rawFieldErrors === 'object'
      ? Object.entries(rawFieldErrors).flatMap(([field, value]) => {
          if (Array.isArray(value)) {
            return value.map(v => ({
              field,
              message:
                typeof v === 'string'
                  ? v
                  : (v as any)?.message || (v as any)?.defaultMessage || 'Invalid value'
            }));
          }
          return [
            {
              field,
              message:
                typeof value === 'string'
                  ? value
                  : (value as any)?.message || (value as any)?.defaultMessage || 'Invalid value'
            }
          ];
        })
      : [];

  const traceId =
    data?.traceId || data?.correlationId
      ? `\nTrace ID: ${data?.traceId || data?.correlationId}`
      : '';

  if (fieldErrors.length > 0) {
    const normalizedLines = fieldErrors.map((e: any) => {
      const rawField = e?.field || e?.path || 'Field';
      const label = fieldLabels[rawField] || rawField;
      const rawMessage = e?.message || e?.defaultMessage || 'Invalid value';
      let finalMessage = rawMessage;
      if (
        rawMessage === 'must not be null' ||
        rawMessage === 'must not be blank' ||
        rawMessage === 'must not be empty'
      ) {
        finalMessage = `${label} ${rawMessage}`;
      } else if (!rawMessage.toLowerCase().includes(String(label).toLowerCase())) {
        finalMessage = `${label}: ${rawMessage}`;
      }
      return `• ${finalMessage}`;
    });
    return `Please fix the following fields:\n${normalizedLines.join('\n')}${traceId}`;
  }

  if (errorKey === 'payload.required') return 'Patient payload is required.' + traceId;
  if (errorKey === 'notfound') return (detail || 'Patient not found.') + traceId;
  if (errorKey === 'unique.medical_record_number') {
    return 'A patient with the same medical record number already exists.' + traceId;
  }
  if (errorKey === 'db.constraint') {
    return (detail || 'Database constraint violated while saving or updating patient.') + traceId;
  }

  return detail || title || message || 'Unexpected server error occurred.' + traceId;
};

const CompletePatientProfileBeforeCheckInModal: React.FC<
  CompletePatientProfileBeforeCheckInModalProps
> = ({ open, setOpen, patientId, onCompleted }) => {
  const dispatch = useAppDispatch();
  const [localPatient, setLocalPatient] = useState<Patient>({ ...newPatient });
  const [validationResult, setValidationResult] = useState<any>(undefined);
  const [refetchAttachmentList, setRefetchAttachmentList] = useState(false);
  const [updatePatient, { isLoading: isSaving }] = useUpdatePatientMutation();

  const [ageGroupValue, setAgeGroupValue] = useState<{ ageGroup: string }>({ ageGroup: '' });
  const [ageFormatType, setAgeFormatType] = useState<{ ageFormat: string }>({ ageFormat: '' });
  const lastProcessedDOB = useRef<string | null>(null);

  const [fetchAgeGroupByBirthDate] = useLazyGetAgeGroupByBirthDateQuery();
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');

  const numericPatientId = Number(patientId);
  const skipPatientFetch = !open || !Number.isFinite(numericPatientId) || numericPatientId <= 0;

  const { data: fetchedPatient, isFetching: isLoadingPatient } = useGetPatientByIdQuery(
    { id: numericPatientId },
    { skip: skipPatientFetch, refetchOnMountOrArgChange: true }
  );

  const { data: profilePictureTicket } = useGetPatientProfilePictureQuery(
    { patientId: numericPatientId },
    { skip: skipPatientFetch, refetchOnMountOrArgChange: true }
  );

  const profileImageSrc = useMemo(() => {
    const fileContent = (profilePictureTicket as any)?.fileContent;
    const contentType = (profilePictureTicket as any)?.contentType || 'image/png';
    if (fileContent) return `data:${contentType};base64,${fileContent}`;
    return 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png';
  }, [profilePictureTicket]);

  useEffect(() => {
    if (!open) return;
    if (fetchedPatient) {
      setLocalPatient({
        ...(fetchedPatient as Patient),
        incompletePatient: fetchedPatient?.isCompletedPatient !== true
      } as Patient);
      setValidationResult(undefined);
    }
  }, [open, fetchedPatient]);

  useEffect(() => {
    const dob = localPatient?.dateOfBirth;
    if (!dob) {
      setAgeFormatType({ ageFormat: '' });
      setAgeGroupValue({ ageGroup: '' });
      lastProcessedDOB.current = null;
      return;
    }

    const dobStr =
      dob instanceof Date
        ? dayjs(dob).format('YYYY-MM-DD')
        : typeof dob === 'string'
          ? dob
          : dob != null
            ? String(dob)
            : '';

    if (lastProcessedDOB.current === dobStr) return;
    lastProcessedDOB.current = dobStr;

    setAgeFormatType({ ageFormat: calculateAgeFormat(dobStr) });
    const birthDate = dobStr.includes('T') ? dobStr.split('T')[0] : dobStr;

    fetchAgeGroupByBirthDate({ birthDate })
      .unwrap()
      .then(res => setAgeGroupValue({ ageGroup: res?.ageGroup ?? '' }))
      .catch(() => setAgeGroupValue({ ageGroup: '' }));
  }, [localPatient?.id, localPatient?.dateOfBirth, fetchAgeGroupByBirthDate]);

  const patientDisplayName = useMemo(() => {
    const joined = [
      localPatient?.firstName,
      localPatient?.secondName,
      localPatient?.thirdName,
      localPatient?.lastName
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
    return joined || (localPatient as any)?.fullName || (localPatient as any)?.name || 'N/A';
  }, [localPatient]);

  const patientGenderLabel = useMemo(() => {
    const key = localPatient?.sexAtBirth ?? (localPatient as any)?.genderLkey;
    if (!key) return 'N/A';
    const match = genderLovQueryResponse?.object?.find((item: any) => item.key === key);
    return match?.lovDisplayVale || match?.lovDisplayValue || String(key);
  }, [localPatient, genderLovQueryResponse]);

  const handleSave = async (): Promise<Patient | null> => {
    const nameError = validatePatientNameFields(localPatient);
    if (nameError) {
      dispatch(notify({ msg: nameError, sev: 'warning' }));
      return null;
    }

    if (!localPatient?.id) {
      dispatch(notify({ msg: 'Patient not found', sev: 'warning' }));
      return null;
    }

    if (!localPatient?.firstName?.trim() || !localPatient?.secondName?.trim() || !localPatient?.lastName?.trim()) {
      dispatch(notify({ msg: 'Please complete required name fields', sev: 'warning' }));
      return null;
    }

    if (!localPatient?.sexAtBirth || !localPatient?.dateOfBirth) {
      dispatch(notify({ msg: 'Please complete gender and date of birth', sev: 'warning' }));
      return null;
    }

    const primaryMobileRaw = localPatient?.primaryMobileNumber;
    const hasPrimaryMobile =
      typeof primaryMobileRaw === 'string'
        ? primaryMobileRaw.trim().length > 0
        : primaryMobileRaw != null &&
          typeof primaryMobileRaw === 'object' &&
          Boolean(
            (primaryMobileRaw as any).phone ||
              (primaryMobileRaw as any).phoneNumber ||
              (primaryMobileRaw as any).mobileNumber ||
              (primaryMobileRaw as any).localNumber
          );
    const email = String(localPatient?.email ?? '').trim();
    if (!hasPrimaryMobile) {
      dispatch(notify({ msg: 'Please enter primary mobile number', sev: 'warning' }));
      return null;
    }
    

    try {
      const updated = await updatePatient({
        id: localPatient.id,
        data: {
          ...localPatient,
          isCompletedPatient: true,
          isUnknown: false
        }
      }).unwrap();

      setLocalPatient(updated);
      setValidationResult(undefined);
      dispatch(notify({ msg: 'Patient profile completed successfully', sev: 'success' }));
      return updated;
    } catch (err: any) {
      const msg = toHumanBackendError(err, {
        firstName: 'First Name',
        secondName: 'Second Name',
        thirdName: 'Third Name',
        lastName: 'Last Name',
        firstNameSecondaryLang: 'First Name (Secondary Language)',
        secondNameSecondaryLang: 'Second Name (Secondary Language)',
        thirdNameSecondaryLang: 'Third Name (Secondary Language)',
        lastNameSecondaryLang: 'Last Name (Secondary Language)',
        dateOfBirth: 'Date of Birth',
        primaryMobileNumber: 'Primary Mobile Number',
        sexAtBirth: 'Sex At Birth',
        nationality: 'Nationality',
        medicalRecordNumber: 'Medical Record Number'
      });
      dispatch(notify({ msg, sev: 'warning' }));
      return null;
    }
  };

  const handleClose = () => setOpen(false);

  const handleSaveAndContinue = async () => {
    const updated = await handleSave();
    if (!updated) return;
    setOpen(false);
    await Promise.resolve(onCompleted?.(updated));
  };

 
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Complete Patient Profile"
      size="75vw"
      bodyheight="75vh"
      customClassName="complete-patient-profile-modal"
      cancelButtonLabel="Cancel"
      handleCancelFunction={handleClose}
      actionButtonLabel={isSaving ? 'Saving...' : 'Save & Continue Check-In'}
      actionButtonFunction={handleSaveAndContinue}
      isDisabledActionBtn={isSaving || isLoadingPatient || !localPatient?.id}
      actionButtonLoading={isSaving}
      content={
            <Form fluid>
          {isLoadingPatient ? (
            <Panel bordered style={{ padding: 12 }}>
              <Translate>Loading patient...</Translate>
            </Panel>
          ) : (
          <ProfileTabs
               localPatient={localPatient}
                          setLocalPatient={setLocalPatient}
 validationResult={validationResult}
   refetchAttachmentList={refetchAttachmentList}
  setRefetchAttachmentList={setRefetchAttachmentList}
             />
          )}
        </Form>
        
      }
    />
  );
};

export default CompletePatientProfileBeforeCheckInModal;
