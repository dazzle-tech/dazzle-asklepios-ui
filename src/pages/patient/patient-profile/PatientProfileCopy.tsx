import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import {
  usePatientListByRoleCandidateMutation,
  useSavePatientMutation
} from '@/services/patientService';
import { useLazyGetCandidatesByDepartmentKeyQuery } from '@/services/setupService';
import { type ApPatient } from '@/types/model-types';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { useLocation } from 'react-router-dom';
import { Col, DOMHelper, Panel, Row } from 'rsuite';
import BedsideRegistrationsModal from './BedsideRegistrations';
import BulkRegistration from './BulkRegistration';
import PatientAppointments from './PatientAppointments';
import PatientQuickAppointment from './PatientQuickAppoinment/PatientQuickAppointment';
import PatientDuplicate from './patientsDuplicate';
import PatientVisitHistory from './PatientVisitHistory';
import PatientVisitHistoryTable from './PatientVisitHistoryTable';
import ProfileHeader from './ProfileHeader';
import ProfileSidebar from './ProfileSidebar';
import ProfileTabs from './ProfileTabs';
import RegistrationWarningsSummary from './RegistrationWarningsSummary';

const { getHeight } = DOMHelper;

const PatientProfile = () => {
  const authSlice = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const [localVisit] = useState({ ...newApEncounter, discharge: false });
  const [windowHeight] = useState(getHeight(window));
  const [expand, setExpand] = useState(false);
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
  const [validationResult, setValidationResult] = useState({});
  const [quickAppointmentModel, setQuickAppointmentModel] = useState(false);
  const [visitHistoryModel, setVisitHistoryModel] = useState(false);
  const location = useLocation();
  const propsData = location.state;
  const [savePatient, savePatientMutation] = useSavePatientMutation();
  const [refetchData, setRefetchData] = useState(false);
  const [refetchAttachmentList, setRefetchAttachmentList] = useState(false);
  const [openPatientsDuplicateModal, setOpenPatientsDuplicateModal] = useState(false);
  const [openBedsideRegistrations, setOpenBedsideRegistrations] = useState<boolean>(false);
  const [openRegistrationWarningsSummary, setOpenRegistrationWarningsSummary] =
    useState<boolean>(false);
  const [openBulkRegistrationModal, setOpenBulkRegistrationModal] = useState<boolean>(false);
  const [patientList, setPatientList] = useState([]);

  const handleSave = async () => {
    try {
      await savePatient({
        ...localPatient,
        incompletePatient: false,
        unknownPatient: false
      }).unwrap();

      setRefetchData(true);
      dispatch(notify({ msg: 'Patient Saved Successfully', sev: 'success' }));
    } catch (error) {
      console.log(error);
    }
  };

  const handleClear = () => {
    setLocalPatient({
      ...newApPatient,
      documentCountryLkey: null,
      documentTypeLkey: null,
      specialCourtesyLkey: null,
      genderLkey: null,
      maritalStatusLkey: null,
      nationalityLkey: null,
      primaryLanguageLkey: null,
      religionLkey: null,
      ethnicityLkey: null,
      occupationLkey: null,
      emergencyContactRelationLkey: null,
      countryLkey: null,
      stateProvinceRegionLkey: null,
      cityLkey: null,
      patientClassLkey: null,
      securityAccessLevelLkey: null,
      responsiblePartyLkey: null,
      educationalLevelLkey: null,
      preferredContactLkey: null,
      roleLkey: null
    });
    setValidationResult(undefined);
    dispatch(setPatient(null));
    dispatch(setEncounter(null));
  };

  useEffect(() => {
    if (propsData && propsData.patient) {
      setLocalPatient(propsData.patient);
    }
  }, [propsData]);

  useEffect(() => {
    if (savePatientMutation && savePatientMutation.status === 'fulfilled') {
      setLocalPatient(savePatientMutation.data);
      dispatch(setPatient(savePatientMutation.data));
      setValidationResult(undefined);
    } else if (savePatientMutation && savePatientMutation.status === 'rejected') {
      setValidationResult(savePatientMutation.error.data.validationResult);
    }
  }, [savePatientMutation]);

  useEffect(() => {
    const divContent = (
      <div style={{ display: 'flex' }}>
        <h5>Patient Registration</h5>
      </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);

    dispatch(setPageCode('Patient_Registration'));
    dispatch(setDivContent(divContentHTML));
    dispatch(setPatient({ ...newApPatient }));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, location.pathname]);

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
          savePatient({ ...localPatient, incompletePatient: false, unknownPatient: false })
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
