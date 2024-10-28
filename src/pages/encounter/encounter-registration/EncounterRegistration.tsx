import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';

import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { ApPatient } from '@/types/model-types';
import DocPassIcon from '@rsuite/icons/DocPass';
import ChangeListIcon from '@rsuite/icons/ChangeList';
import ArowBackIcon from '@rsuite/icons/ArowBack';
import {
  addFilterToListRequest,
  conjureValueBasedOnKeyFromList,
 
} from '@/utils';
import {
  useGetUsersQuery
} from '@/services/setupService';
import { DatePicker } from 'rsuite';

const { Column, HeaderCell, Cell } = Table;

import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import { Block, Check, DocPass, Edit, Icon, PlusRound } from '@rsuite/icons';
import { Modal, Placeholder,PanelGroup } from 'rsuite';
import React, { useEffect, useState } from 'react';
import {
  InputGroup,
  ButtonToolbar,
  FlexboxGrid,
  Form,
  IconButton,
  Input,
  Panel,
  Stack,
  Divider,
  Drawer,
  Table,
  Pagination,
  Button
} from 'rsuite';

import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { calculateAge, fromCamelCaseToDBName } from '@/utils';
import { useSelector } from 'react-redux';

import {
  useGetDepartmentsQuery,
  useGetFacilitiesQuery,
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery,
  useGetPractitionersQuery
} from '@/services/setupService';
import { useNavigate } from 'react-router-dom';
import { initialListRequest, ListRequest } from '@/types/types';
import {
  useGetEncountersQuery,
  useCompleteEncounterRegistrationMutation
} from '@/services/encounterService';
import { notify } from '@/utils/uiReducerActions';

const EncounterRegistration = () => {
  const encounter = useSelector((state: RootState) => state.patient.encounter);

  const patientSlice = useAppSelector(state => state.patient);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [openModelVisitNote, setOpenModelVisitNote] = React.useState(false);
  const [openModelCompanionCard,setOpenModelCompanionCard]= React.useState(false);
  const [openModelAppointmentView,setOpenModelAppointmentView]= React.useState(false);
  const [localEncounter, setLocalEncounter] = useState({ ...newApEncounter });
  const [editing, setEditing] = useState(false);
  const [validationResult, setValidationResult] = useState({});
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const { data: userListResponse, refetch: refetchUsers } = useGetUsersQuery(listRequest);
  const [saveEncounter, saveEncounterMutation] = useCompleteEncounterRegistrationMutation();
  
  /* load page LOV */
  const { data: encounterStatusLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_STATUS');
  const { data: encounterClassLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_CLASS');
  const { data: encounterPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
  const { data: encounterReasonLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_REASON');
  const { data: encounterTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_TYPE');
  const { data: serviceTypeLovQueryResponse } = useGetLovValuesByCodeQuery('SERVICE_TYPE');
  const { data: patientStatusLovQueryResponse } = useGetLovValuesByCodeQuery('PATIENT_STATUS');
  const { data: encounterBasedOnLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_BASED_ON');
  const { data: dietPreferenceLovQueryResponse } = useGetLovValuesByCodeQuery('DIET_PREF');
  const { data: specialArrangementLovQueryResponse } =
    useGetLovValuesByCodeQuery('ENC_SPECIAL_ARNG');
  const { data: specialCourtesyLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_SPECIAL_COURT');
  const { data: locationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('LOCATION_TYPE');
  const { data: paymentTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PAYMENT_TYPE');
  const { data: payerTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PAYER_TYPE');
  const { data: patOriginLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_ORIGIN');
  const { data: relationsLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
  const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
  const { data: bookingstatusLovQueryResponse } = useGetLovValuesByCodeQuery('BOOKING_STATUS');
  const { data: practitionerListResponse } = useGetPractitionersQuery({ ...initialListRequest });
  const { data: facilityListResponse } = useGetFacilitiesQuery({ ...initialListRequest });
  const { data: departmentListResponse } = useGetDepartmentsQuery({ ...initialListRequest });
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };
  const initEncounterFromPatient = () => {
    if (patientSlice.patient) {
      setLocalEncounter({
        ...newApEncounter,
        patientKey: patientSlice.patient.key,
        patientFullName: patientSlice.patient.fullName,
        patientAge: patientSlice.patient.dob ? calculateAge(patientSlice.patient.dob) + '' : '',
        encounterStatusLkey: '91063195286200' //change this to be loaded from cache lov values by code
      });
    } else if (localStorage.getItem('patient')) {
      const cachedPatient = JSON.parse(localStorage.getItem('patient'));
      dispatch(setPatient(cachedPatient));
      setLocalEncounter({
        ...newApEncounter,
        patientKey: cachedPatient.key,
        patientFullName: cachedPatient.fullName,
        patientAge: cachedPatient.dob ? calculateAge(cachedPatient.dob) + '' : ''
      });
    }

    // dispatch(setEncounter(null));
  };

  useEffect(() => {
    if (!patientSlice.patient && !localStorage.getItem('patient') && !localEncounter.patientKey) {
      navigate('/patient-profile');
    } else {
      setEditing(true);
      initEncounterFromPatient();
    }
  }, [patientSlice.patient]);

  const handleCancel = () => {
    dispatch(setEncounter(null));
    setLocalEncounter({ ...newApEncounter });
    navigate('/patient-profile');
  };
  const handleGoToPatientAppointment = () => {
    navigate('/patient-appointment-view');
  };
  const handleGoBack=()=>{
    navigate(-1);
  };
  const handleOpenCompanionCardModel = () => setOpenModelCompanionCard(true);
  const handleCloseCompanionCardModel = () => setOpenModelCompanionCard(false);
  const handleSaveCompanionCard=()=>{
    //add logic to cave note
    setOpenModelCompanionCard(false);
  };
  const handleOpenNoteModel = () => setOpenModelVisitNote(true);
  const handleCloseNoteModel = () => setOpenModelVisitNote(false);
  const handleSaveNote=()=>{
    //add logic to cave note
    setOpenModelVisitNote(false);
  };
  const handleOpenAppointmentViewModel = () => setOpenModelAppointmentView(true);
  const handleCloseAppointmentViewModel = () => setOpenModelAppointmentView(false);
  const handleSave = () => {
    if (localEncounter && localEncounter.patientKey) {
      saveEncounter(localEncounter).unwrap();
    } else {
      dispatch(notify({ msg: 'encounter not linked to patient', sev: 'error' }));
    }
  };

  useEffect(() => {
    if (saveEncounterMutation && saveEncounterMutation.status === 'fulfilled') {
      setLocalEncounter(saveEncounterMutation.data);
      dispatch(setEncounter(saveEncounterMutation.data));
      // setEditing(false);
      setValidationResult(undefined);
      dispatch(notify('Encounter Saved!'));
    } else if (saveEncounterMutation && saveEncounterMutation.status === 'rejected') {
      setValidationResult(saveEncounterMutation.error.data.validationResult);
    }
  }, [saveEncounterMutation]);

  const handleChangePatient = () => {
    setEditing(true);
    dispatch(setPatient(null));
    dispatch(setEncounter(null));
    setLocalEncounter({ ...newApEncounter });
    navigate('/patient-profile');
  };

  return (
    <>
      {patientSlice.patient && (
        <Panel
          header={
            <h3 className="title">
              <Translate>{encounter ? ' Quick Appointment' : 'New Quick Appointment'}</Translate>
            </h3>
          }
        >
          <Panel bordered>
            <ButtonToolbar>
            <IconButton
                disabled={encounter}
                appearance="primary"
                color="violet"
                icon={<ArowBackIcon />}
                onClick={handleGoBack}
              >
                <Translate>Go Back</Translate>
              </IconButton>
              <IconButton appearance="primary" color="blue" icon={<Block />} onClick={handleCancel}>
                <Translate>Cancel</Translate>
              </IconButton>
              <IconButton
                disabled={encounter}
                appearance="primary"
                color="violet"
                icon={<Check />}
                onClick={handleSave}
              >
                <Translate>Save</Translate>
              </IconButton>
              <Divider vertical />
              <IconButton
                disabled={encounter}
                appearance="primary"
                color="orange"
                icon={<icons.Danger />}
              >
                <Translate>Administrative Warnings</Translate>
              </IconButton>
              <IconButton appearance="primary" color='cyan'  onClick={()=>handleOpenAppointmentViewModel()}  icon={<ChangeListIcon />} >
                <Translate>Patient Appointment</Translate>
              </IconButton>

              <IconButton disabled={encounter}  onClick={()=>handleOpenNoteModel()}  appearance="primary" color='cyan' icon={<icons.PublicOpinion />}>
                <Translate>Visit Note</Translate>
              </IconButton>
              <IconButton
                appearance="ghost"
                color="violet"
                icon={<icons.Reload />}
                onClick={handleChangePatient}
              >
                <Translate>Change Patient</Translate>
              </IconButton>
            </ButtonToolbar>
            <Modal open={openModelVisitNote}  onClose={handleCloseNoteModel}>
        <Modal.Header>
          <Modal.Title>Visit Note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          
          <Form layout="inline" fluid>
                  <MyInput
                    width={250}
                    column
                    disabled={false}
                    fieldType='textarea'
                    fieldLabel="Note"
                    fieldName={'VisitNote'}
                    setRecord={setLocalEncounter}
                    vr={validationResult}
                    record={encounter ? encounter : localEncounter}
                   
                  />
                  </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSaveNote} appearance="primary">
             Save
          </Button>
          <Button onClick={handleCloseNoteModel} appearance="subtle">
             Cancle
          </Button>
        </Modal.Footer>
      </Modal>
          </Panel>
          <br />
          <Panel
            bordered
            header={
              <h5 className="title">
                <Translate>Patient Information</Translate>
              </h5>
            }
          >
            <Stack>
              <Stack.Item grow={4}>
                <Form layout="inline" fluid>
                <MyInput
                    width={150}
                    column
                    disabled={true}
                    fieldLabel="MRN"
                    fieldName={'patientMrn'}
                    record={patientSlice.patient}
                    setRecord={undefined}
                  />
                  <MyInput
                    column
                    disabled={true}
                    fieldName={'patientFullName'}
                    record={localEncounter}
                    setRecord={undefined}
                  />
                  <MyInput
                    width={200}
                    column
                    disabled={true}
                    fieldName={'documentNo'}
                    record={patientSlice.patient}
                    setRecord={undefined}
                  />
                   
                  <MyInput
                 
                  vr={validationResult}
                  column
                  fieldLabel="Document Type"
                  fieldType="select"
                  fieldName="documentTypeLkey"
                  selectData={docTypeLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={patientSlice.patient}
                  setRecord={undefined}
                  disabled={true}
                          />
                  <MyInput
                    width={100}
                    column
                    disabled={true}
                    fieldName={'patientAge'}
                    record={localEncounter}
                    setRecord={undefined}
                  />
                  <MyInput
                    width={150}
                    column
                    disabled={true}
                    fieldLabel="Gender"
                    fieldName={patientSlice.patient.genderLvalue ? 'lovDisplayVale' : 'genderLkey'}
                    record={
                      patientSlice.patient.genderLvalue
                        ? patientSlice.patient.genderLvalue
                        : patientSlice.patient
                    }
                    setRecord={undefined}
                  />
                </Form>
              </Stack.Item>
            </Stack>
          </Panel>
          <br />
          <Panel
            bordered
            header={
              <h5 className="title">
                <Translate>Main Visit Details</Translate>
              </h5>
            }
          >
            <Stack>
              <Stack.Item grow={4}>
                <Form layout="inline" fluid>
                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldLabel="Visit ID"
                    fieldName="visitId"
                    record={encounter ? encounter : localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldLabel="Date"
                    fieldType="date"
                    fieldName="plannedStartDate"
                    record={
                      encounter
                        ? encounter
                        : {
                            ...localEncounter,
                            plannedStartDate:
                              localEncounter?.plannedStartDate ||
                              new Date().toISOString().split('T')[0]
                          }
                    }
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="select"
                    fieldLabel="Visit Type"
                    fieldName="encounterTypeLkey"
                    selectData={encounterTypeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={encounter ? encounter : localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="select"
                    fieldName="departmentKey"
                    selectData={departmentListResponse?.object ?? []}
                    selectDataLabel="name"
                    selectDataValue="key"
                    record={encounter ? encounter : localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="select"
                    fieldLabel="Physician"
                    fieldName="responsiblePhysicianKey"
                    selectData={practitionerListResponse?.object ?? []}
                    selectDataLabel="practitionerFullName"
                    selectDataValue="key"
                    record={encounter ? encounter : localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  
                  {/* <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing}
                    fieldType="select"
                    fieldLabel='Visit Status'
                    fieldName="encounterStatusLkey"
                    selectData={encounterStatusLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  /> */}
                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="select"
                    fieldLabel="Priority"
                    fieldName="encounterPriorityLkey"
                    selectData={encounterPriorityLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={encounter ? encounter : localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  <br />
                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="select"
                    fieldName="reasonLkey"
                    selectData={encounterReasonLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={encounter ? encounter : localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="select"
                    fieldName="originLkey"
                    selectData={patOriginLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={encounter ? encounter : localEncounter}
                    setRecord={setLocalEncounter}
                  />
                   <MyInput
                    vr={validationResult}
                    column
                    
                    fieldLabel="Source Name"
                    fieldName="source"
                    record={encounter ? encounter : localEncounter}
                    setRecord={setLocalEncounter}
                  />
                   {/* <MyInput
                    vr={validationResult}
                    column
                    disabled={true}
                    fieldLabel="Booking Status"
                    fieldName="encounterStatusLkey"
                    record={encounter ? encounter : localEncounter}
                    setRecord={setLocalEncounter}
                  /> */}
                   <MyInput
                 
                 vr={validationResult}
                 column
                 fieldLabel="Booking Status"
                 fieldType="select"
                 fieldName="encounterStatusLkey"
                 selectData={bookingstatusLovQueryResponse?.object ?? []}
                 selectDataLabel="lovDisplayVale"
                 selectDataValue="key"
                 record={encounter ? encounter : localEncounter}
                 setRecord={setLocalEncounter}
                 disabled={true}
                         />
                </Form>
              </Stack.Item>
            </Stack>
          </Panel>
          {/* <br /> */}
          {false && (
            <Panel
              bordered
              header={
                <h5 className="title">
                  <Translate>Secondary Information</Translate>
                </h5>
              }
            >
              <Stack>
                <Stack.Item grow={4}>
                  <Form layout="inline" fluid>
                    <MyInput
                      vr={validationResult}
                      column
                      disabled={!editing || encounter}
                      fieldType="select"
                      fieldName="basedOnLkey"
                      selectData={encounterBasedOnLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={encounter ? encounter : localEncounter}
                      setRecord={setLocalEncounter}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      disabled={!editing || encounter}
                      fieldType="select"
                      fieldLabel="Based On Detail"
                      fieldName="basedOnKey"
                      selectData={[]}
                      selectDataLabel=""
                      selectDataValue="key"
                      record={encounter ? encounter : localEncounter}
                      setRecord={setLocalEncounter}
                    />

                    <MyInput
                      vr={validationResult}
                      column
                      disabled={!editing || encounter}
                      fieldType="select"
                      fieldName="episodeCareKey"
                      selectData={[]}
                      selectDataLabel=""
                      selectDataValue="key"
                      record={encounter ? encounter : localEncounter}
                      setRecord={setLocalEncounter}
                    />
                    <br />
                    <MyInput
                      vr={validationResult}
                      column
                      disabled={!editing || encounter}
                      fieldType="select"
                      fieldName="serviceTypeLkey"
                      selectData={serviceTypeLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={encounter ? encounter : localEncounter}
                      setRecord={setLocalEncounter}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      disabled={!editing || encounter}
                      fieldType="checkbox"
                      fieldName="virtualService"
                      record={encounter ? encounter : localEncounter}
                      setRecord={setLocalEncounter}
                    />
                    <br />
                    <MyInput
                      vr={validationResult}
                      column
                      disabled={!editing || encounter}
                      fieldType="select"
                      fieldName="dietPreferenceLkey"
                      selectData={dietPreferenceLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={encounter ? encounter : localEncounter}
                      setRecord={setLocalEncounter}
                    />

                    <MyInput
                      vr={validationResult}
                      column
                      disabled={!editing || !localEncounter.dietPreferenceLkey || encounter}
                      fieldType="textarea"
                      fieldName="dietPreferenceText"
                      record={encounter ? encounter : localEncounter}
                      setRecord={setLocalEncounter}
                    />
                    <br />

                    <MyInput
                      vr={validationResult}
                      column
                      disabled={!editing || encounter}
                      fieldType="select"
                      fieldName="specialArrangementLkey"
                      selectData={specialArrangementLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={encounter ? encounter : localEncounter}
                      setRecord={setLocalEncounter}
                    />

                    <MyInput
                      vr={validationResult}
                      column
                      disabled={!editing || !localEncounter.specialArrangementLkey || encounter}
                      fieldType="textarea"
                      fieldName="specialArrangementText"
                      record={encounter ? encounter : localEncounter}
                      setRecord={setLocalEncounter}
                    />
                    <br />
                    <MyInput
                      vr={validationResult}
                      column
                      disabled={!editing || encounter}
                      fieldType="textarea"
                      fieldName="valuableItemsText"
                      record={encounter ? encounter : localEncounter}
                      setRecord={setLocalEncounter}
                    />
                    <br />
                    <MyInput
                      vr={validationResult}
                      column
                      disabled={!editing || encounter}
                      fieldType="select"
                      fieldName="specialCourtesyLkey"
                      selectData={specialCourtesyLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={encounter ? encounter : localEncounter}
                      setRecord={setLocalEncounter}
                    />

                    <MyInput
                      vr={validationResult}
                      column
                      disabled={!editing || encounter}
                      fieldName="adminssionOrigin"
                      record={encounter ? encounter : localEncounter}
                      setRecord={setLocalEncounter}
                    />

                    <MyInput
                      vr={validationResult}
                      column
                      disabled={!editing || encounter}
                      fieldName="adminssionSource"
                      record={encounter ? encounter : localEncounter}
                      setRecord={setLocalEncounter}
                    />

                    <MyInput
                      vr={validationResult}
                      column
                      disabled={!editing || encounter}
                      fieldType="checkbox"
                      fieldName="readminssion"
                      record={encounter ? encounter : localEncounter}
                      setRecord={setLocalEncounter}
                    />

                    <br />

                    <MyInput
                      vr={validationResult}
                      column
                      disabled={!editing || encounter}
                      fieldType="select"
                      fieldName="locationTypeLkey"
                      selectData={locationTypeLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={encounter ? encounter : localEncounter}
                      setRecord={setLocalEncounter}
                    />
                    <MyInput
                      vr={validationResult}
                      column
                      disabled={!editing || encounter}
                      fieldType="select"
                      fieldName="locationKey"
                      selectData={[]}
                      selectDataLabel=""
                      selectDataValue="key"
                      record={encounter ? encounter : localEncounter}
                      setRecord={setLocalEncounter}
                    />
                  </Form>
                </Stack.Item>
              </Stack>
            </Panel>
          )}
          <br />
          <Panel
            bordered
            header={
              <h5 className="title">
                <Translate>Payment Detail</Translate>
              </h5>
            }
          >
            <Stack>
              <Stack.Item grow={4}>
                <Form layout="inline" fluid>
                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="select"
                    fieldName="billingAccountKey"
                    selectData={[]}
                    selectDataLabel=""
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="select"
                    fieldName="paymentTypeLkey"
                    selectData={paymentTypeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="select"
                    fieldName="payerTypeLkey"
                    selectData={payerTypeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="select"
                    fieldName="payerKey"
                    selectData={[]}
                    selectDataLabel=""
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldName="payerMemberId"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldName="insurancePlan"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldName="referralNumber"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />
                </Form>
              </Stack.Item>
            </Stack>
          </Panel>
          <br/>
            <Panel
            bordered
            header={
              <h5 className="title">
                <Translate>Print Reports</Translate>
              </h5>
            }
          >
             <ButtonToolbar>
              <IconButton appearance="primary" color='cyan' icon={<DocPassIcon />} >
                <Translate>Patient wrist band</Translate>
              </IconButton>

              <Divider vertical />

              <IconButton
                disabled={encounter}
                appearance="primary"
                color="violet"
                icon={<DocPassIcon/>}
              >
                <Translate>Patient label</Translate>
              </IconButton>

              <Divider vertical />

              <IconButton appearance="primary" color='cyan' icon={<DocPassIcon />} >
                <Translate>Appointment Card</Translate>
              </IconButton>

              <Divider vertical />
              <IconButton
                disabled={encounter}
                appearance="primary"
                color="violet"
                icon={<DocPassIcon />}
              >
                <Translate>Visit Clinical Report</Translate>
              </IconButton>

              <Divider vertical />
              
              <IconButton appearance="primary" color='cyan' icon={<DocPassIcon/>} >
                <Translate>Visit Finance Report</Translate>
              </IconButton>

              <Divider vertical />

              <IconButton
                disabled={encounter}
                appearance="primary"
                color="violet"
                icon={<DocPassIcon />}
                onClick={handleOpenCompanionCardModel}
              >
                <Translate>Companion Card</Translate>
              </IconButton>
            </ButtonToolbar>
            <Modal open={openModelCompanionCard}  onClose={handleCloseCompanionCardModel}>
        <Modal.Header>
          <Modal.Title>Companion Card</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          
          <Form layout="inline" fluid>
                  <MyInput
                    width={250}
                    column
                    disabled={false}
                    
                    fieldLabel="Companion Name"
                    fieldName={'VisitNote'}
                    setRecord={setLocalEncounter}
                    vr={validationResult}
                    record={encounter ? encounter : localEncounter}
                   
                  />
                  <br/>
                    <MyInput
                    width={250}
                    column
                    disabled={false}
                    fieldType='number'
                    fieldLabel="Phone Number"
                    fieldName={'Visitname'}
                    setRecord={setLocalEncounter}
                    vr={validationResult}
                    record={encounter ? encounter : localEncounter}
                   
                  />
                  <br/>
                  {//relation
                  }
                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="select"
                    fieldLabel="Relation"
                    fieldName="relationTypeLkey"
                    selectData={relationsLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={encounter ? encounter : localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSaveCompanionCard} appearance="primary">
             Save
          </Button>
          <Button onClick={handleCloseCompanionCardModel} appearance="subtle">
             Cancle
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal open={openModelAppointmentView}  onClose={handleCloseAppointmentViewModel}>
        <Modal.Header>
          <Modal.Title>Patient's Appointment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          
        <div style={{ padding: '20px' }}>
            <PanelGroup>
                {/* First Panel with a title on the border */}
                <fieldset style={{ border: '2px solid #38d3e8',  marginBottom: '10px' }}>
                    <legend style={{ padding: '10px', fontWeight: 'bold', color: '#ffffff',fontSize:"20px" ,backgroundColor:"#38d3e8" }}>Search</legend>
                    <Panel style={{ height: '130px', display: 'flex', alignItems: 'center' }}>
            <label htmlFor="fromDate" style={{ margin: '0 5px', fontWeight: 'bold' ,fontSize:"17px" }}>From Date</label>
            <DatePicker id="fromDate" style={{ width: '240px' }} format="MM/dd/yyyy" />
             
            <label htmlFor="toDate" style={{ margin: '0 5px', fontWeight: 'bold',fontSize:"17px" }}>To Date</label>
            <DatePicker id="toDate" style={{ width: '240px' }} format="MM/dd/yyyy" />
                    </Panel>
                </fieldset>

                {/* Second Panel with a title on the border */}
                <fieldset style={{ border: '2px solid #38d3e8',  marginBottom: '10px' }}>
                    <legend  style={{ padding: '10px', fontWeight: 'bold', color: '#ffffff',fontSize:"20px" ,backgroundColor:"#38d3e8" }}>Patient's Appointment</legend>
                    <Panel>
                    <Table
                height={400}
                sortColumn={listRequest.sortBy}
                sortType={listRequest.sortType}
                onSortColumn={(sortBy, sortType) => {
                  if (sortBy)
                    setListRequest({
                      ...listRequest,
                      sortBy,
                      sortType
                    });
                }}
                headerHeight={80}
                rowHeight={60}
                bordered
                cellBordered
                data={userListResponse?.object ?? []}
              
              
              >

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('AppointmentDate', e)} />
                    <Translate>Appointment Date</Translate>
                  </HeaderCell>
                  <Cell dataKey="AppointmentDate " />
                </Column>

                <Column sortable flexGrow={3}>
                  <HeaderCell align="center">
                  <Input onChange={e => handleFilterChange('Status', e)} />
                    <Translate>Status</Translate>
                  </HeaderCell>
                  <Cell dataKey="Status" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('Department', e)} />
                    <Translate>Department</Translate>
                  </HeaderCell>
                  <Cell dataKey="Department" />
                </Column>
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('Physician', e)} />
                    <Translate>Physician</Translate>
                    
                  </HeaderCell>
                  <Cell dataKey="Physician" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('BookingSource', e)} />
                    <Translate>Booking Source</Translate>
                    
                  </HeaderCell>
                  <Cell dataKey="BookingSource" />
                </Column>
                 <Column sortable flexGrow={4}>
                  <HeaderCell>
                    
                    
                    <Input onChange={e => handleFilterChange('Follow-up', e)} />
                    <Translate>Follow-up</Translate>
                  </HeaderCell>
                  <Cell dataKey="Follow-up" />
                </Column>
                 <Column sortable flexGrow={4}>
                  <HeaderCell>
                    
                    
                    <Input onChange={e => handleFilterChange('Bookingdate', e)} />
                    <Translate>Booking date</Translate>
                  </HeaderCell>
                  <Cell dataKey="Bookingdate" />
                </Column> 
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('CompleteDate', e)} />
                    <Translate>Complete Date</Translate>
                    
                  </HeaderCell>
                  <Cell dataKey="CompleteDate" />
                </Column> 
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('CancelDate', e)} />
                    <Translate>Cancel Date </Translate>
                    
                  </HeaderCell>
                  <Cell dataKey="CancelDate" />
                </Column> 
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('CancellationReason', e)} />
                    <Translate>Cancellation Reason</Translate>
                    
                  </HeaderCell>
                  <Cell dataKey="CancellationReason" />
                </Column> 
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('BookedBy', e)} />
                    <Translate>Booked By</Translate>
                    
                  </HeaderCell>
                  <Cell dataKey="BookedBy" />
                </Column> 
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                  <Input onChange={e => handleFilterChange('CancelledBy ', e)} />
                    <Translate>Cancelled By </Translate>
                    
                  </HeaderCell>
                  <Cell dataKey="CancelledBy " />
                </Column> 

              </Table>
              <div style={{ padding: 20 }}>
                <Pagination
                  prev
                  next
                  first
                  last
                  ellipsis
                  boundaryLinks
                  maxButtons={5}
                  size="xs"
                  layout={['limit', '|', 'pager']}
                  limitOptions={[5, 15, 30]}
                  limit={listRequest.pageSize}
                  activePage={listRequest.pageNumber}
                  onChangePage={pageNumber => {
                    setListRequest({ ...listRequest, pageNumber });
                  }}
                  onChangeLimit={pageSize => {
                    setListRequest({ ...listRequest, pageSize });
                  }}
                  total={userListResponse?.extraNumeric ?? 0}
                />
              </div>
                    </Panel>
                </fieldset>
            </PanelGroup>
        </div>ll
        </Modal.Body>
        <Modal.Footer>
         
          <Button onClick={handleCloseAppointmentViewModel} appearance="subtle">
             Cancle
          </Button>
        </Modal.Footer>
      </Modal>
          </Panel>
        </Panel>
      )}
    </>
  );
};

export default EncounterRegistration;
