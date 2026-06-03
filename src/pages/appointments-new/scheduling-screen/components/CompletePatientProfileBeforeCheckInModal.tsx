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
  const [updatePatient, { isLoading: isSaving }] = useUpdatePatientMutation();

  const [ageGroupValue, setAgeGroupValue] = useState<{ ageGroup: string }>({ ageGroup: '' });
  const [ageFormatType, setAgeFormatType] = useState<{ ageFormat: string }>({ ageFormat: '' });
  const lastProcessedDOB = useRef<string | null>(null);

  const [fetchAgeGroupByBirthDate] = useLazyGetAgeGroupByBirthDateQuery();
  const genderEnum = useEnumOptions('Gender');
  const { data: patientClassLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_CLASS');
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
    if (!email) {
      dispatch(notify({ msg: 'Please enter email', sev: 'warning' }));
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

  const patientInformationSection = (
    <Panel bordered style={{ padding: 0 }}>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 2, display: 'flex', alignItems: 'center', padding: 12 }}>
          <Avatar size="md" circle src={profileImageSrc} />
          <div style={{ marginLeft: 8 }}>
            <p style={{ fontSize: 15, margin: 0 }}>{patientDisplayName}</p>
            <p style={{ fontSize: 12, color: '#A1A9B8', fontWeight: 600, margin: '4px 0' }}>
              <FontAwesomeIcon icon={faUser} /> {patientGenderLabel}
              {localPatient?.dateOfBirth
                ? `, ${calculateAgeFormat(String(localPatient.dateOfBirth))}`
                : ''}
            </p>
            <p style={{ fontSize: 12, color: '#A1A9B8', margin: 0 }}>
              {localPatient?.medicalRecordNumber
                ? `#${localPatient.medicalRecordNumber}`
                : ''}
            </p>
          </div>
        </div>

        <div
          style={{
            flex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 12
          }}
        >
          <Divider style={{ height: 50 }} vertical />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: '#A1A9B8', margin: 0 }}>Document Type</p>
            <p style={{ margin: 0 }}>{(localPatient as any)?.documentTypeLkey || '-'}</p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: '#A1A9B8', margin: 0 }}>Document No</p>
            <p style={{ margin: 0 }}>{(localPatient as any)?.documentNo || '-'}</p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: '#A1A9B8', margin: 0 }}>Mobile Number</p>
            <p style={{ margin: 0 }}>{localPatient?.primaryMobileNumber || '-'}</p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: '#A1A9B8', margin: 0 }}>Email</p>
            <p style={{ margin: 0 }}>{localPatient?.email || '-'}</p>
          </div>
        </div>
      </div>
    </Panel>
  );

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SectionContainer
                title="Patient Information"
                action={
                  <MyButton
                    prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                    onClick={() => void handleSave()}
                    disabled={isSaving || isLoadingPatient}
                    loading={isSaving}
                  >
                    <Translate>Edit</Translate>
                  </MyButton>
                }
                content={patientInformationSection}
              />

              <Row gutter={15}>
                <Col md={12}>
                  <SectionContainer
                    title="Basic Information"
                    content={
                      <Panel bordered style={{ padding: 12 }}>
                        <BasicInfo
                          validationResult={validationResult}
                          localPatient={localPatient}
                          setLocalPatient={setLocalPatient}
                          genderEnum={genderEnum}
                          ageFormatType={ageFormatType}
                          ageGroupValue={ageGroupValue}
                          patientClassLovQueryResponse={patientClassLovQueryResponse}
                        />
                      </Panel>
                    }
                  />
                </Col>
                <Col md={12}>
                  <SectionContainer
                    title="Contact"
                    content={
                      <Panel bordered style={{ padding: 12 }}>
                        <ContactTab
                          localPatient={localPatient}
                          setLocalPatient={setLocalPatient}
                          validationResult={validationResult}
                        />
                      </Panel>
                    }
                  />
                </Col>
              </Row>
            </div>
          )}
        </Form>
      }
    />
  );
};

export default CompletePatientProfileBeforeCheckInModal;
