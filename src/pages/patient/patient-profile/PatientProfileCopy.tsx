import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { type ApPatient } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { useLocation } from 'react-router-dom';
import ReactDOMServer from 'react-dom/server';
import { Col, DOMHelper, Form, Panel, Row, Text, Tooltip, Whisper } from 'rsuite';
import type { RootState } from '@/store';
import { useSelector } from 'react-redux';
import ProfileHeader from './ProfileHeader';
import ProfileSidebar from './ProfileSidebar';
import ProfileTabs from './ProfileTabs';
import PatientQuickAppointment from './PatientQuickAppoinment/PatientQuickAppointment';
import PatientVisitHistory from './PatientVisitHistory';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import {
  usePatientListByRoleCandidateMutation,
  useSavePatientMutation
} from '@/services/patientService';
import clsx from 'clsx';
import { useLazyGetCandidatesByDepartmentKeyQuery } from '@/services/setupService';
import PatientDuplicate from './patientsDuplicate';
import MyButton from '@/components/MyButton/MyButton';
import SectionContainer from '@/components/SectionsoContainer';
import MyTable from '@/components/MyTable';
import { useGetEncountersQuery } from '@/services/encounterService';
import { initialListRequest, ListRequest } from '@/types/types';
import Translate from '@/components/Translate';
import PatientVisitHistoryTable from './PatientVisitHistoryTable';

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
  const [patientList, setPatientList] = useState([]);
  const [trigger, { data: candidate, isLoading, isError, error }] =
    useLazyGetCandidatesByDepartmentKeyQuery();
  const [patientListByRoleCandidate, { data, isLoading: isPatientsLoading, error: e }] =
    usePatientListByRoleCandidateMutation();
  console.log('Candidate ', candidate?.object);
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

  useEffect(() => {
     console.log("pat: " + localPatient.key + " kmn " + localPatient.fullName);
  },[localPatient]);

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
  useEffect(() => {
    dispatch(setPageCode('Patient_Registration'));
    dispatch(setDivContent(divContentHTML));
    dispatch(setPatient({ ...newApPatient }));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  // Request object for encounter list API
  const [visitHistoryListRequest, setVisitHistoryListRequest] = useState<ListRequest>({
    ...initialListRequest,
    sortBy: 'plannedStartDate',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: localPatient.key || undefined
      }
    ]
  });
  // Query for encounter list
  const { data: visiterHistoryResponse } = useGetEncountersQuery(visitHistoryListRequest);

  // Table columns definition
  const tableColumns = [
    {
      key: 'visitId',
      title: <Translate>key</Translate>,
      flexGrow: 4,
      render: (rowData: any) => (
        <a
          style={{ cursor: 'pointer' }}
          onClick={() => {
            // setSelectedVisit(rowData);
            setQuickAppointmentModel(true);
          }}
        >
          {rowData.visitId}
        </a>
      )
    },
    {
      key: 'plannedStartDate',
      title: <Translate>Date</Translate>,
      flexGrow: 4,
      dataKey: 'plannedStartDate'
    },
    {
      key: 'departmentName',
      title: <Translate>Department</Translate>,
      flexGrow: 4,
      dataKey: 'departmentName',
      render: (rowData: any) =>
        rowData?.resourceTypeLkey === '2039534205961578'
          ? rowData?.departmentName
          : rowData.resourceObject?.name
    },
    {
      key: 'encountertype',
      title: <Translate>Encounter Type</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.resourceObject?.departmentTypeLkey
          ? rowData.resourceObject?.departmentTypeLvalue?.lovDisplayVale
          : rowData.resourceObject?.departmentTypeLkey
    },
    {
      key: 'physician',
      title: <Translate>Physician</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData?.resourceTypeLkey === '2039534205961578'
          ? rowData?.resourceObject?.practitionerFullName
          : ''
    },
    {
      key: 'priority',
      title: <Translate>Priority</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.encounterPriorityLvalue
          ? rowData.encounterPriorityLvalue.lovDisplayVale
          : rowData.encounterPriorityLkey
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.encounterStatusLvalue
          ? rowData.encounterStatusLvalue.lovDisplayVale
          : rowData.encounterStatusLkey
    },
    {
      key: 'actions',
      title: <Translate> </Translate>,
      render: rowData => {
        const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;
        const tooltipComplete = <Tooltip>Complete Visit</Tooltip>;
        const tooltipDischarge = <Tooltip>Discharge Visit</Tooltip>;
        const dischargeResources = ['BRT_INPATIENT', 'BRT_DAYCASE', 'BRT_PROC', 'BRT_EMERGENCY'];
        const isDischargeResource = dischargeResources.includes(
          rowData?.resourceTypeLvalue?.valueCode
        );

        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            {rowData?.encounterStatusLvalue?.valueCode === 'NEW' && (
              <Whisper trigger="hover" placement="top" speaker={tooltipCancel}>
                <div>
                  <MyButton
                    size="small"
                    appearance="subtle"
                    // onClick={() => {
                    //   setSelectedVisit(rowData);
                    //   setOpen(true);
                    // }}
                  >
                    {/* <FontAwesomeIcon icon={faRectangleXmark} /> */}
                  </MyButton>
                </div>
              </Whisper>
            )}

            {rowData?.encounterStatusLvalue?.valueCode === 'ONGOING' && (
              <Whisper
                trigger="hover"
                placement="top"
                speaker={isDischargeResource ? tooltipDischarge : tooltipComplete}
              >
                <div>
                  <MyButton
                    size="small"
                    appearance="subtle"
                    // onClick={() => {
                    //   if (isDischargeResource) {
                    //     setSelectedVisit(rowData);
                    //     setOpenDischargeModal(true);
                    //   } else {
                    //     setSelectedVisit(rowData);
                    //     handleCompleteEncounter();
                    //   }
                    // }}
                  >
                    {/* <FontAwesomeIcon icon={faPowerOff} /> */}
                  </MyButton>
                </div>
              </Whisper>
            )}
          </Form>
        );
      }
    }
  ];

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

          <div className="container-of-tabs-reg">
            <ProfileTabs
              localPatient={localPatient}
              setLocalPatient={setLocalPatient}
              validationResult={validationResult}
              setRefetchAttachmentList={setRefetchAttachmentList}
              refetchAttachmentList={refetchAttachmentList}
            />
          </div>
          <Row className="btm-sections">
            <Col md={12}>
              <SectionContainer
                title={<Text>Visit history</Text>}
                content={
                  // <MyTable
                  //   data={visiterHistoryResponse?.object ?? []}
                  //   columns={tableColumns}
                  //   height={580}
                  //   loading={isLoading}
                  // />
                  <PatientVisitHistoryTable
                    visitHistoryModel={visitHistoryModel}
                    quickAppointmentModel={quickAppointmentModel}
                    setVisitHistoryModel={setVisitHistoryModel}
                    setQuickAppointmentModel={setQuickAppointmentModel}
                   localPatient={localPatient}
                  />
                }
              />
            </Col>
            <Col md={12}>
              <SectionContainer
                title={<Text>Appointments</Text>}
                content={
                  <MyTable
                    data={visiterHistoryResponse?.object ?? []}
                    columns={tableColumns}
                    height={580}
                    loading={isLoading}
                  />
                }
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
