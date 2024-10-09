import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { ApPatient } from '@/types/model-types';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import { Block, Check, DocPass, Edit, Icon, PlusRound } from '@rsuite/icons';
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
const { Column, HeaderCell, Cell } = Table;
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { addFilterToListRequest, calculateAge, fromCamelCaseToDBName } from '@/utils';
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

  const [localEncounter, setLocalEncounter] = useState({ ...newApEncounter });
  const [editing, setEditing] = useState(false);
  const [validationResult, setValidationResult] = useState({});

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
  const { data: practitionerListResponse } = useGetPractitionersQuery({ ...initialListRequest });
  const { data: facilityListResponse } = useGetFacilitiesQuery({ ...initialListRequest });
  const { data: departmentListResponse } = useGetDepartmentsQuery({ ...initialListRequest });

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
              <Translate>{encounter?"Visit Registration":"New Visit Registration"}</Translate>
            </h3>
          }
        >
          <Panel bordered>
            <ButtonToolbar>
              <IconButton   appearance="primary" color="red" icon={<Block />} onClick={handleCancel}>
                <Translate>Cancel</Translate>
              </IconButton>
              <IconButton disabled={encounter} appearance="primary" color="green" icon={<Check />} onClick={handleSave}>
                <Translate>Save</Translate>
              </IconButton>
              <Divider vertical />
              <IconButton  disabled={encounter} appearance="primary" color="orange" icon={<icons.Danger />}>
                <Translate>Warnings</Translate>
              </IconButton>
              <IconButton disabled={encounter} appearance="primary" icon={<icons.PublicOpinion />}>
                <Translate>Medical Notes</Translate>
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
                    fieldName="visitId"
                    record={encounter?encounter:localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldLabel="Date"
                    fieldType="date"
                    fieldName="plannedStartDate"
                    record={encounter?encounter:localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="select"
                    fieldLabel='Visit Type'
                    fieldName="encounterTypeLkey"
                    selectData={encounterTypeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={encounter?encounter:localEncounter}
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
                    record={encounter?encounter:localEncounter}
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
                    record={encounter?encounter:localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  <br />
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
                    fieldLabel='Priority'
                    fieldName="encounterPriorityLkey"
                    selectData={encounterPriorityLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={encounter?encounter:localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  <MyInput
                  
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="select"
                    fieldName="reasonLkey"
                    selectData={encounterReasonLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={encounter?encounter:localEncounter}
                    setRecord={setLocalEncounter}
                  />
                </Form>
              </Stack.Item>
            </Stack>
          </Panel>
          {/* <br /> */}
          {false && <Panel
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
                    record={encounter?encounter:localEncounter}
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
                    record={encounter?encounter:localEncounter}
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
                    record={encounter?encounter:localEncounter}
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
                    record={encounter?encounter:localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="checkbox"
                    fieldName="virtualService"
                    record={encounter?encounter:localEncounter}
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
                    record={encounter?encounter:localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || !localEncounter.dietPreferenceLkey || encounter}
                    fieldType="textarea"
                    fieldName="dietPreferenceText"
                    record={encounter?encounter:localEncounter}
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
                    record={encounter?encounter:localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || !localEncounter.specialArrangementLkey || encounter}
                    fieldType="textarea"
                    fieldName="specialArrangementText"
                    record={encounter?encounter:localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  <br />
                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="textarea"
                    fieldName="valuableItemsText"
                    record={encounter?encounter:localEncounter}
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
                    record={encounter?encounter:localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldName="adminssionOrigin"
                    record={encounter?encounter:localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldName="adminssionSource"
                    record={encounter?encounter:localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="checkbox"
                    fieldName="readminssion"
                    record={encounter?encounter:localEncounter}
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
                    record={encounter?encounter:localEncounter}
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
                    record={encounter?encounter:localEncounter}
                    setRecord={setLocalEncounter}
                  />
                </Form>
              </Stack.Item>
            </Stack>
          </Panel>}
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
                    disabled={!editing || encounter }
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
        </Panel>
      )}
    </>
  );
};

export default EncounterRegistration;
