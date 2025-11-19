import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { useAddPatientMutation, useUpdatePatientMutation } from '@/services/patient/patientService';
import { newApEncounter } from '@/types/model-types-constructor';
import { newPatient } from '@/types/model-types-constructor-new';
import { Patient } from '@/types/model-types-new';
import { notify } from '@/utils/uiReducerActions';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
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
import ProfileSidebar from './ProfileSidebar-new';
import ProfileTabs from './ProfileTabs-new';
import RegistrationWarningsSummary from './RegistrationWarningsSummary';

const { getHeight } = DOMHelper;

/* ========================================================= */
/* =============== Helper Functions ======================== */
/* ========================================================= */

const toHumanBackendError = (err: any, fieldLabels: Record<string, string> = {}): string => {
  const data = err?.data ?? {};
  const errorKey = data?.errorKey;
  const title = data?.title || '';
  const detail = data?.detail || '';
  const message = data?.message || '';
  const fieldErrors = data?.fieldErrors;

  const traceId =
    data?.traceId || data?.correlationId
      ? `\nTrace ID: ${data?.traceId || data?.correlationId}`
      : '';

  /* ========================================================= */
  /* =============== 1) Bean Validation Errors =============== */
  /* ========================================================= */
  if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
    const lines = fieldErrors.map((e: any) => {
      const label = fieldLabels[e.field] || e.field;
      return `• ${label}: ${e.message}`;
    });

    return `Please fix the following fields:\n${lines.join('\n')}${traceId}`;
  }

  /* ========================================================= */
  /* =============== 2) Specific Custom Errors ============== */
  /* ========================================================= */

  if (errorKey === 'payload.required') return 'Patient payload is required.' + traceId;

  if (errorKey === 'notfound') return (detail || 'Patient not found.') + traceId;

  if (errorKey === 'unique.mrn') return 'A patient with the same MRN already exists.' + traceId;

  if (errorKey === 'db.constraint')
    return detail || 'Database constraint violated while saving or updating patient.' + traceId;

  /* ========================================================= */
  /* =============== 3) Generic unknown error ================ */
  /* ========================================================= */

  return detail || title || message || 'Unexpected server error occurred.' + traceId;
};

/* ========================================================= */
/* ======================= Component ======================== */
/* ========================================================= */

const PatientProfile = () => {
  const dispatch = useAppDispatch();
  const [localVisit] = useState({ ...newApEncounter, discharge: false });
  const [windowHeight] = useState(getHeight(window));
  const [expand, setExpand] = useState(false);

  const [localPatient, setLocalPatient] = useState<Patient>({ ...newPatient });

  const [validationResult, setValidationResult] = useState({});
  const [quickAppointmentModel, setQuickAppointmentModel] = useState(false);
  const [visitHistoryModel, setVisitHistoryModel] = useState(false);

  const location = useLocation();
  const propsData = location.state;

  // Create new patient
  const [addPatient, addResult] = useAddPatientMutation();

  // Update existing patient
  const [updatePatient, updateResult] = useUpdatePatientMutation();

  const [refetchData, setRefetchData] = useState(false);
  const [refetchAttachmentList, setRefetchAttachmentList] = useState(false);

  const [openPatientsDuplicateModal, setOpenPatientsDuplicateModal] = useState(false);

  const [openBedsideRegistrations, setOpenBedsideRegistrations] = useState<boolean>(false);

  const [openRegistrationWarningsSummary, setOpenRegistrationWarningsSummary] =
    useState<boolean>(false);

  const [openBulkRegistrationModal, setOpenBulkRegistrationModal] = useState<boolean>(false);

  const [patientList, setPatientList] = useState([]);

  const divContent = 'Patient Registration';

  /* ========================================================= */
  /* ======================= SAVE / UPDATE ==================== */
  /* ========================================================= */

  const handleSave = async () => {
    try {
      const saved = localPatient?.id
        ? await updatePatient({ id: localPatient.id, data: localPatient }).unwrap()
        : await addPatient(localPatient).unwrap();

      setLocalPatient(saved);
      dispatch(setPatient(saved));
      setValidationResult(undefined);
      setRefetchData(true);

      dispatch(
        notify({
          msg: localPatient?.id ? 'Patient Updated Successfully' : 'Patient Saved Successfully',
          sev: 'success'
        })
      );
    } catch (err: any) {
      const msg = toHumanBackendError(err, {
        firstName: 'First Name',
        lastName: 'Last Name',
        dateOfBirth: 'Date of Birth',
        primaryMobileNumber: 'Primary Mobile Number',
        sexAtBirth: 'Sex At Birth',
        nationality: 'Nationality'
      });

      dispatch(notify({ msg, sev: 'error' }));
    }
  };

  /* ========================================================= */
  /* ======================= CLEAR ============================ */
  /* ========================================================= */

  const handleClear = () => {
    setLocalPatient({ ...newPatient });
    setValidationResult(undefined);
    dispatch(setPatient(null));
    dispatch(setEncounter(null));
  };

  /* ========================================================= */
  /* ======================== EFFECTS ========================= */
  /* ========================================================= */

  useEffect(() => {
    dispatch(setPageCode('Patient_Registration'));
    dispatch(setDivContent(divContent));
    dispatch(setPatient({ ...newPatient }));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

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
  }, [addResult]);

  useEffect(() => {
    if (updateResult?.status === 'fulfilled') {
      setLocalPatient(updateResult.data);
      dispatch(setPatient(updateResult.data));
    }
  }, [updateResult]);

  /* ========================================================= */
  /* ========================= RENDER ========================= */
  /* ========================================================= */

  return (
    <>
      <div className="patient-profile-container">
        <Panel
          bordered
          className={clsx('patient-profile-info', {
            expanded: expand
          })}
        >
          <ProfileHeader
            localPatient={localPatient}
            handleSave={handleSave}
            handleClear={handleClear}
            setVisitHistoryModel={setVisitHistoryModel}
            setQuickAppointmentModel={setQuickAppointmentModel}
            validationResult={validationResult}
            setRefetchAttachmentList={setRefetchAttachmentList}
            setOpenBedsideRegistrations={setOpenBedsideRegistrations}
            setOpenRegistrationWarningsSummary={setOpenRegistrationWarningsSummary}
            setOpenBulkRegistrationModal={setOpenBulkRegistrationModal}
          />

          <div className="container-of-tabs-reg">
            <ProfileTabs
              localPatient={localPatient}
              setLocalPatient={setLocalPatient}
              validationResult={validationResult}
              setRefetchAttachmentList={setRefetchAttachmentList}
              refetchAttachmentList={refetchAttachmentList}
            />
          </div>

          <br />
          <br />

          <Row className="btm-sections">
            <Col md={12}>
              <SectionContainer
                title={<Translate>Visit history</Translate>}
                content={
                  <PatientVisitHistoryTable
                    quickAppointmentModel={quickAppointmentModel}
                    setQuickAppointmentModel={setQuickAppointmentModel}
                    localPatient={localPatient}
                  />
                }
              />
            </Col>

            <Col md={12}>
              <SectionContainer
                title={<Translate>Appointments</Translate>}
                content={<PatientAppointments patient={localPatient} />}
              />
            </Col>
          </Row>
        </Panel>

        <ProfileSidebar
          expand={expand}
          setExpand={setExpand}
          windowHeight={windowHeight}
          setLocalPatient={setLocalPatient}
          refetchData={refetchData}
          setRefetchData={setRefetchData}
        />
      </div>

      {quickAppointmentModel && (
        <PatientQuickAppointment
          quickAppointmentModel={quickAppointmentModel}
          localPatient={localPatient}
          setQuickAppointmentModel={setQuickAppointmentModel}
          localVisit={localVisit}
        />
      )}

      {visitHistoryModel && (
        <PatientVisitHistory
          visitHistoryModel={visitHistoryModel}
          quickAppointmentModel={quickAppointmentModel}
          localPatient={localPatient}
          setVisitHistoryModel={setVisitHistoryModel}
          setQuickAppointmentModel={setQuickAppointmentModel}
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

      <PatientDuplicate
        open={openPatientsDuplicateModal}
        setOpen={setOpenPatientsDuplicateModal}
        list={patientList}
        setlocalPatient={setLocalPatient}
        handleSave={() =>
          addPatient({
            ...localPatient,
            isCompletedPatient: false,
            isUnknown: false
          })
            .unwrap()
            .then(() => {
              setRefetchData(true);
              dispatch(notify({ msg: 'Patient Saved Successfully', sev: 'success' }));
              setOpenPatientsDuplicateModal(false);
            })
        }
      />
    </>
  );
};

export default PatientProfile;
