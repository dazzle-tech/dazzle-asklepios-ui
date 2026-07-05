import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import {
  useAddPatientMutation,
  useGetDuplicationCandidatesMutation,
  useLazyGetPatientsByMedicalRecordNumberQuery,
  useUpdatePatientMutation
} from '@/services/patient/patientService';
import { newApEncounter } from '@/types/model-types-constructor';
import { newPatient } from '@/types/model-types-constructor-new';
import { notify } from '@/utils/uiReducerActions';
import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Col, DOMHelper, Panel, Row } from 'rsuite';
import BedsideRegistrationsModal from './BedsideRegistrations';
import BulkRegistration from './BulkRegistration';
import PatientAppointments from './PatientAppointments';
import PatientQuickAppointment from './PatientQuickAppoinment/PatientQuickAppointment';
import PatientDuplicate from './patientsDuplicate';
import PatientVisitHistory from './PatientVisitHistory';
import PatientVisitHistoryTable from './PatientVisitHistoryTable';
import ProfileHeader from './ProfileHeader-new';
import { buildPatientSavePayload } from './cchiMappers';
import ProfileSidebar from './ProfileSidebar-new';
import ProfileTabs from './ProfileTabs-new';
import RegistrationWarningsSummary from './RegistrationWarningsSummary';
import { useGetFacilityByIdQuery } from '@/services/security/facilityService';
import IncomingReferralRequestsByFacility from './IncomingReferralRequestsByFacility';
import { Patient, Address } from '@/types/model-types-new';

const { getHeight } = DOMHelper;

const resolveBackendErrorKey = (data: any): string => {
  const raw = data?.errorKey || data?.message || data?.properties?.message || '';
  return String(raw).replace(/^error\./, '');
};

const isTechnicalErrorText = (value: unknown): boolean => {
  const text = String(value ?? '');
  return /ProblemDetail|BAD_REQUEST|with-message|instance='null'/i.test(text);
};

const toHumanBackendError = (err: any, fieldLabels: Record<string, string> = {}): string => {
  const data = err?.data ?? {};
  const errorKey = resolveBackendErrorKey(data);
  const title = data?.title || '';
  const detail =
    data?.detail && data.detail !== 'null' && !isTechnicalErrorText(data.detail)
      ? data.detail
      : '';
  const message =
    data?.message && !isTechnicalErrorText(data.message) ? data.message : '';
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
                : v?.message || v?.defaultMessage || 'Invalid value'
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

  if (errorKey === 'payload.required') {
    return 'Patient payload is required.' + traceId;
  }

  if (errorKey === 'notfound') {
    return (detail || 'Patient not found.') + traceId;
  }

  if (errorKey === 'unique.medical_record_number') {
    return 'A patient with the same medical record number already exists.' + traceId;
  }

  if (errorKey === 'unique.document_id') {
    return 'A patient with the same document ID already exists.' + traceId;
  }

  if (errorKey === 'required.fields.when.not.unknown' || errorKey === 'required.fields') {
    return (
      detail ||
      'Required patient fields are missing: first name, last name, gender, date of birth, primary mobile number, and email are required unless the patient is marked as unknown.'
    ) + traceId;
  }

  if (errorKey === 'mrn.not.generated') {
    return 'Medical record number was not generated by the database.' + traceId;
  }

  if (errorKey === 'created_by.required') {
    return 'Created by is required while saving patient.' + traceId;
  }

  if (errorKey === 'is_unknown.required') {
    return 'Unknown patient flag is required.' + traceId;
  }

  if (errorKey === 'is_verified.required') {
    return 'Verified patient flag is required.' + traceId;
  }

  if (errorKey === 'is_completed_patient.required') {
    return 'Completed patient flag is required.' + traceId;
  }

  if (errorKey === 'db.constraint') {
    return (
      detail ||
      message ||
      'Could not save patient. A value may already exist or a required field is invalid. Check names, mobile number, document ID, and document details, then try again.'
    ) + traceId;
  }

  if (message && message.startsWith('error.')) {
    return message.replace(/^error\./, '') + traceId;
  }

  return (
    detail ||
    (!isTechnicalErrorText(title) ? title : '') ||
    message ||
    'Unexpected server error occurred.'
  ) + traceId;
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

const PatientProfile = () => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);

  const [localVisit] = useState({ ...newApEncounter, discharge: false });
  const [windowHeight] = useState(getHeight(window));
  const [expand, setExpand] = useState(false);

  const [openReferralRequestModal, setOpenReferralRequestModal] = useState(false);
  const [checkDuplication] = useGetDuplicationCandidatesMutation();

  const [localPatient, setLocalPatient] = useState<Patient>({ ...newPatient });
  const [validationResult, setValidationResult] = useState({});
  const [quickAppointmentModel, setQuickAppointmentModel] = useState(false);
  const [visitHistoryModel, setVisitHistoryModel] = useState(false);

  const location = useLocation();
  const propsData = location.state;

  const [addPatient, addResult] = useAddPatientMutation();
  const [updatePatient, updateResult] = useUpdatePatientMutation();

  const [refetchData, setRefetchData] = useState(false);
  const [refetchAttachmentList, setRefetchAttachmentList] = useState(false);

  const [openPatientsDuplicateModal, setOpenPatientsDuplicateModal] = useState(false);
  const [openBedsideRegistrations, setOpenBedsideRegistrations] = useState<boolean>(false);

  const [cchiAddress, setCchiAddress] = useState<Address | null>(null);
  const [cchiDocument, setCchiDocument] = useState<any>(null);
  const [cchiInsurance, setCchiInsurance] = useState<any>(null);
  const [openCchiDocumentPopup, setOpenCchiDocumentPopup] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<string>('1');

  const [openRegistrationWarningsSummary, setOpenRegistrationWarningsSummary] =
    useState<boolean>(false);

  const [openBulkRegistrationModal, setOpenBulkRegistrationModal] = useState<boolean>(false);
  const [patientList, setPatientList] = useState([]);
  const [encounterRefetchTrigger, setEncounterRefetchTrigger] = useState(0);

  const divContent = 'Patient Registration';
  const searchRef = useRef<(() => void) | null>(null);

  const selectedFacilityIdRaw =
    authSlice?.selectedDepartment?.facilityId ?? authSlice?.tenant?.selectedFacility?.id;

  const selectedFacilityId =
    typeof selectedFacilityIdRaw === 'object'
      ? (selectedFacilityIdRaw as any)?.id
      : selectedFacilityIdRaw;

  const { data: selectedFacility } = useGetFacilityByIdQuery(selectedFacilityId, {
    skip: !selectedFacilityId
  });

  const shouldOpenCchiDocumentAfterSave = (patientBeforeSave: any, document: any) => {
    return Boolean(
      patientBeforeSave?.isCchiPatient &&
      patientBeforeSave?.documentId &&
      document &&
      (document?.number || document?.documentNumber)
    );
  };

  const openCchiDocumentModalAfterSave = () => {
    setProfileActiveTab('2');
    setOpenCchiDocumentPopup(true);
  };

  const handleSave = async () => {
    const nameError = validatePatientNameFields(localPatient);
    if (nameError) {
      dispatch(notify({ msg: nameError, sev: 'warning' }));
      return;
    }

    try {
      if (localPatient?.id) {
        const updated = await updatePatient({
          id: localPatient.id,
          data: buildPatientSavePayload(localPatient)
        }).unwrap();

        setLocalPatient(updated);
        dispatch(setPatient(updated));
        setValidationResult(undefined);
        setRefetchData(true);

        dispatch(
          notify({
            msg: 'Patient Updated Successfully',
            sev: 'success'
          })
        );

        if (searchRef.current) {
          setTimeout(() => {
            searchRef.current?.();
          }, 500);
        }

        return;
      }

      const duplicationResponse = await checkDuplication({
        dto: {
          ruleId: selectedFacility?.ruleId,
          dateOfBirth: localPatient?.dateOfBirth
            ? new Date(localPatient.dateOfBirth).toISOString().split('T')[0]
            : null,
          gender: localPatient?.sexAtBirth,
          firstName: localPatient?.firstName,
          lastName: localPatient?.lastName,
          documentNo: '',
          mobileNumber: localPatient?.primaryMobileNumber
        },
        page: 0,
        size: 20
      }).unwrap();

      if (duplicationResponse?.length > 0) {
        setPatientList(duplicationResponse);
        setOpenPatientsDuplicateModal(true);
        return;
      }

      const patientBeforeSave = { ...localPatient };

      const saved = await addPatient(buildPatientSavePayload(localPatient)).unwrap();

      setLocalPatient(saved);
      dispatch(setPatient(saved));
      setValidationResult(undefined);
      setRefetchData(true);

      dispatch(
        notify({
          msg: 'Patient Saved Successfully',
          sev: 'success'
        })
      );

      if (shouldOpenCchiDocumentAfterSave(patientBeforeSave, cchiDocument)) {
        openCchiDocumentModalAfterSave();
      }

      if (searchRef.current) {
        setTimeout(() => {
          searchRef.current?.();
        }, 500);
      }
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
    }
  };

  const handleClear = () => {
    setLocalPatient({ ...newPatient });
    setCchiAddress(null);
    setCchiDocument(null);
    setCchiInsurance(null);
    setOpenCchiDocumentPopup(false);
    setProfileActiveTab('1');
    setValidationResult(undefined);
    dispatch(setPatient(null));
    dispatch(setEncounter(null));
  };

  useEffect(() => {
    dispatch(setPageCode('Patient_Registration'));
    dispatch(setDivContent(divContent));
    dispatch(setPatient({ ...newPatient }));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    if (propsData && propsData.patient) {
      setLocalPatient(propsData.patient);
    }
  }, [propsData]);

  useEffect(() => {
    if (addResult?.status === 'fulfilled') {
      setLocalPatient(addResult.data);
      dispatch(setPatient(addResult.data));
    }
  }, [addResult, dispatch]);

  useEffect(() => {
    if (updateResult?.status === 'fulfilled') {
      setLocalPatient(updateResult.data);
      dispatch(setPatient(updateResult.data));
    }
  }, [updateResult, dispatch]);

  const [getPatientsByMedicalRecordNumber] = useLazyGetPatientsByMedicalRecordNumberQuery();

  const handleSelectExistingPatient = async (patient: any) => {
    try {
      if (!patient?.medicalRecordNumber) return;

      const res = await getPatientsByMedicalRecordNumber({
        medicalRecordNumber: patient.medicalRecordNumber,
        page: 0,
        size: 1
      }).unwrap();

      const fullPatient = res.data?.[0];

      if (!fullPatient) return;

      setLocalPatient(fullPatient);
      dispatch(setPatient(fullPatient));
      setOpenPatientsDuplicateModal(false);
    } catch (err) {
      dispatch(notify({ msg: 'Failed to load patient', sev: 'warning' }));
    }
  };

  const handleEncounterSaved = () => {
    setEncounterRefetchTrigger(prev => prev + 1);
  };

  const handleQuickAppointmentClose = (val: boolean) => {
    setQuickAppointmentModel(val);
    if (!val) setEncounterRefetchTrigger(prev => prev + 1);
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <div className="patient-profile-container">
        <Panel
          bordered
          className={clsx('patient-profile-info', {
            expanded: expand
          })}
        >
          <ProfileHeader
            localPatient={localPatient}
            setLocalPatient={setLocalPatient}
            setCchiAddress={setCchiAddress}
            setCchiDocument={setCchiDocument}
            setCchiInsurance={setCchiInsurance}
            handleSave={handleSave}
            handleClear={handleClear}
            setVisitHistoryModel={setVisitHistoryModel}
            setQuickAppointmentModel={setQuickAppointmentModel}
            validationResult={validationResult}
            setRefetchAttachmentList={setRefetchAttachmentList}
            setOpenBedsideRegistrations={setOpenBedsideRegistrations}
            setOpenRegistrationWarningsSummary={setOpenRegistrationWarningsSummary}
            setOpenBulkRegistrationModal={setOpenBulkRegistrationModal}
            setOpenReferralRequestModal={setOpenReferralRequestModal}
          />

          <div className="container-of-tabs-reg">
            <ProfileTabs
              key={localPatient?.id || 'new'}
              localPatient={localPatient}
              setLocalPatient={setLocalPatient}
              validationResult={validationResult}
              setRefetchAttachmentList={setRefetchAttachmentList}
              refetchAttachmentList={refetchAttachmentList}
              cchiAddress={cchiAddress}
              setCchiAddress={setCchiAddress}
              cchiDocument={cchiDocument}
              cchiInsurance={cchiInsurance}
              setCchiInsurance={setCchiInsurance}
              openCchiDocumentPopup={openCchiDocumentPopup}
              setOpenCchiDocumentPopup={setOpenCchiDocumentPopup}
              activeTab={profileActiveTab}
              setActiveTab={setProfileActiveTab}
            />
          </div>

          <br />
          <br />

          {localPatient?.id && (
            <Row className="btm-sections">
              <Col md={12}>
                <SectionContainer
                  title={<Translate>Visit history</Translate>}
                  content={
                    <PatientVisitHistoryTable
                      key={localPatient?.id || 'empty'}
                      localPatient={localPatient}
                      encounterRefetchTrigger={encounterRefetchTrigger}
                    />
                  }
                />
              </Col>

              <Col md={12}>
                <SectionContainer
                  title="Appointment"
                  content={<PatientAppointments patient={localPatient} />}
                />
              </Col>
            </Row>
          )}
        </Panel>

        <ProfileSidebar
          expand={expand}
          setExpand={setExpand}
          windowHeight={windowHeight}
          setLocalPatient={setLocalPatient}
          refetchData={refetchData}
          setRefetchData={setRefetchData}
          searchRef={searchRef}
        />
      </div>

      {quickAppointmentModel && (
        <PatientQuickAppointment
          quickAppointmentModel={quickAppointmentModel}
          localPatient={localPatient}
          setQuickAppointmentModel={handleQuickAppointmentClose}
          localVisit={localVisit}
          onEncounterSaved={handleEncounterSaved}
        />
      )}

      {visitHistoryModel && (
        <PatientVisitHistory
          visitHistoryModel={visitHistoryModel}
          localPatient={localPatient}
          setVisitHistoryModel={setVisitHistoryModel}
        />
      )}

      <BedsideRegistrationsModal
        open={openBedsideRegistrations}
        setOpen={setOpenBedsideRegistrations}
        setLocalPatient={setLocalPatient}
      />

      <RegistrationWarningsSummary
        open={openRegistrationWarningsSummary}
        setOpen={setOpenRegistrationWarningsSummary}
      />

      <BulkRegistration open={openBulkRegistrationModal} setOpen={setOpenBulkRegistrationModal} />

      <IncomingReferralRequestsByFacility
        open={openReferralRequestModal}
        setOpen={setOpenReferralRequestModal}
      />

      <PatientDuplicate
        open={openPatientsDuplicateModal}
        setOpen={setOpenPatientsDuplicateModal}
        list={patientList}
        handleSelect={handleSelectExistingPatient}
        handleSave={() =>
          addPatient({
            ...buildPatientSavePayload(localPatient),
            isCompletedPatient: false
          })
            .unwrap()
            .then(saved => {
              setLocalPatient(saved);
              dispatch(setPatient(saved));
              dispatch(notify({ msg: 'Patient Saved Successfully', sev: 'success' }));
              setOpenPatientsDuplicateModal(false);

              if (shouldOpenCchiDocumentAfterSave(localPatient, cchiDocument)) {
                openCchiDocumentModalAfterSave();
              }

              if (searchRef.current) {
                setTimeout(() => {
                  searchRef.current?.();
                }, 500);
              }
            })
            .catch((err: any) => {
              const msg = toHumanBackendError(err, {
                firstName: 'First Name',
                lastName: 'Last Name',
                dateOfBirth: 'Date of Birth',
                primaryMobileNumber: 'Primary Mobile Number',
                sexAtBirth: 'Sex At Birth',
                documentId: 'Document ID',
                medicalRecordNumber: 'Medical Record Number'
              });

              dispatch(notify({ msg, sev: 'warning' }));
            })
        }
      />
    </div>
  );
};

export default PatientProfile;