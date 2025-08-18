import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { type ApPatient } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { useLocation } from 'react-router-dom';
import ReactDOMServer from 'react-dom/server';
import { DOMHelper, Panel } from 'rsuite';
import type { RootState } from '@/store';
import { useSelector } from 'react-redux';
import ProfileHeader from './ProfileHeader';
import ProfileSidebar from './ProfileSidebar';
import ProfileTabs from './ProfileTabs';
import PatientQuickAppointment from './PatientQuickAppoinment/PatientQuickAppointment';
import PatientVisitHistory from './PatientVisitHistory';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import { usePatientListByRoleCandidateMutation, useSavePatientMutation } from '@/services/patientService';
import clsx from 'clsx';
import { useLazyGetCandidatesByDepartmentKeyQuery } from '@/services/setupService';
import PatientDuplicate from './patientsDuplicate';
import MyButton from '@/components/MyButton/MyButton';

const { getHeight } = DOMHelper;

const PatientProfile = () => {
  const authSlice = useAppSelector(state => state.auth);

  const dispatch = useAppDispatch();
  const [localVisit, setLocalVisit] = useState({ ...newApEncounter, discharge: false });
  const [windowHeight, setWindowHeight] = useState(getHeight(window));
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
  const [patientList, setPatientList] = useState([])
  const [trigger, { data: candidate, isLoading, isError, error }] = useLazyGetCandidatesByDepartmentKeyQuery();
  const [patientListByRoleCandidate, { data, isLoading: isPatientsLoading, error: e }] = usePatientListByRoleCandidateMutation();
  console.log("Candidate ", candidate?.object)
  // Page header setup
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Patient Registration</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);

  // Handle save patient
const handleSave = async () => {
  try {
    
    const { data: candidateData } = await trigger(authSlice.user.departmentKey);

    if (localPatient.key == undefined) {
      const Response = await patientListByRoleCandidate({
        patient: localPatient,
        role: candidateData?.object // بدل candidate?.object
      }).unwrap();

      if (Response.extraNumeric > 0) {
        setPatientList(Response?.object);
        setOpenPatientsDuplicateModal(true);
      } else {
        await savePatient({
          ...localPatient,
          incompletePatient: false,
          unknownPatient: false
        }).unwrap();

        setRefetchData(true);
        dispatch(notify({ msg: 'Patient Saved Successfully', sev: 'success' }));
      }
    } else {
      await savePatient({
        ...localPatient,
        incompletePatient: false,
        unknownPatient: false
      }).unwrap();

      setRefetchData(true);
      dispatch(notify({ msg: 'Patient Saved Successfully', sev: 'success' }));
    }
  } catch (error) {
    console.log(error);
  }
};


// Handle clear patient data
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

// Effects
useEffect(() => {
  dispatch(setPageCode('Patient_Registration'));
  dispatch(setDivContent(divContentHTML));
  dispatch(setPatient({ ...newApPatient }));

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
  if (savePatientMutation && savePatientMutation.status === 'fulfilled') {
    setLocalPatient(savePatientMutation.data);
    dispatch(setPatient(savePatientMutation.data));
    setValidationResult(undefined);
  } else if (savePatientMutation && savePatientMutation.status === 'rejected') {
    setValidationResult(savePatientMutation.error.data.validationResult);
  }
}, [savePatientMutation]);

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
        />
            <div className='header-buttons-patient-profile'>

        <MyButton>Print Patient Label</MyButton>
                <MyButton>Scan Document</MyButton>

            </div>

        <ProfileTabs
          localPatient={localPatient}
          setLocalPatient={setLocalPatient}
          validationResult={validationResult}
          setRefetchAttachmentList={setRefetchAttachmentList}
          refetchAttachmentList={refetchAttachmentList}

        />
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
    <PatientDuplicate open={openPatientsDuplicateModal} setOpen={setOpenPatientsDuplicateModal}
      list={patientList}
      setlocalPatient={setLocalPatient}
      handleSave={() => savePatient({ ...localPatient, incompletePatient: false, unknownPatient: false })
        .unwrap()
        .then(() => {
          setRefetchData(true);
          dispatch(notify({ msg: 'Patient Saved Successfully', sev: 'success' }));
          setOpenPatientsDuplicateModal(false);
        })} />
  </>
);
};

export default PatientProfile;
