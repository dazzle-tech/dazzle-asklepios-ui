import React, { useEffect, useState, useContext, useRef } from 'react';
import { TagInput, Panel, Divider } from 'rsuite';

import './styles.less';
import MyInput from '@/components/MyInput';
import EncounterPreObservations from '../../encounter-pre-observations/EncounterPreObservations';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import VoiceCitation from '@/components/VoiceCitation';
import CheckOutlineIcon from '@rsuite/icons/CheckOutline';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import {
  Input,
  Table,
  Text,
  Button,
  Form,
  Tabs
} from 'rsuite';

const { Column, HeaderCell, Cell } = Table;

import PatientDiagnosis from '../../medical-notes-and-assessments/patient-diagnosis';
import ReviewOfSystems from '../../medical-notes-and-assessments/review-of-systems';

import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { useSaveEncounterChangesMutation } from '@/services/encounterService';
import { initialListRequest, ListRequest } from '@/types/types';

import { useAppDispatch } from '@/hooks';
import {
  useGetObservationSummariesQuery,

} from '@/services/observationService';
import {
  ApPatientObservationSummary
} from '@/types/model-types';
import {
  newApEncounter,
  newApPatientObservationSummary
} from '@/types/model-types-constructor';
import { values } from 'lodash';
import { notify } from '@/utils/uiReducerActions';
import MyButton from '@/components/MyButton/MyButton';


const SOAP = ({ edit, patient, encounter, setEncounter }) => {
  const dispatch = useAppDispatch();
  const [localEncounter, setLocalEncounter] = useState({ ...encounter });

  const { data: planLovQueryResponse } = useGetLovValuesByCodeQuery('VISIT_CAREPLAN_OPT');


  const [saveEncounterChanges, saveEncounterChangesMutation] = useSaveEncounterChangesMutation();

  const [patientObservationsListRequest, setPatientObservationsListRequest] =
    useState<ListRequest>({
      ...initialListRequest,
      timestamp: new Date().getMilliseconds(),
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient.key
        }
        ,
        {
          fieldName: 'visit_key',
          operator: 'match',
          value: encounter.key
        }
      ]
    });
  const { data: getCurrenttObservationSummaries } = useGetObservationSummariesQuery({
    ...patientObservationsListRequest,
  });
  const currentObservationSummary = getCurrenttObservationSummaries?.object?.length > 0 ? getCurrenttObservationSummaries.object[0] : null;
  const [patientObservationSummary, setPatientObservationSummary] = useState<ApPatientObservationSummary>({
    ...newApPatientObservationSummary,
    latesttemperature: null,
    latestbpSystolic: null,
    latestbpDiastolic: null,
    latestheartrate: null,
    latestrespiratoryrate: null,
    latestoxygensaturation: null,
    latestglucoselevel: null,
    latestweight: null,
    latestheight: null,
    latestheadcircumference: null,
    latestpainlevelLkey: null
  });



  useEffect(() => {
    if (saveEncounterChangesMutation.status === 'fulfilled') {
      setEncounter(saveEncounterChangesMutation.data);
      setLocalEncounter(saveEncounterChangesMutation.data);
    }
  }, [saveEncounterChangesMutation]);

  useEffect(() => {

    setPatientObservationSummary((prevSummary) => ({
      ...prevSummary,
      latesttemperature: currentObservationSummary?.latesttemperature,
      latestbpSystolic: currentObservationSummary?.latestbpSystolic,
      latestbpDiastolic: currentObservationSummary?.latestbpDiastolic,
      latestheartrate: currentObservationSummary?.latestheartrate,
      latestrespiratoryrate: currentObservationSummary?.latestrespiratoryrate,
      latestglucoselevel: currentObservationSummary?.latestglucoselevel,
      latestoxygensaturation: currentObservationSummary?.latestoxygensaturation,
      latestweight: currentObservationSummary?.latestweight,
      latestheight: currentObservationSummary?.latestheight,
      latestheadcircumference: currentObservationSummary?.latestheadcircumference,
      latestpainlevelLkey: currentObservationSummary?.latestpainlevelLkey,
      latestnotes: currentObservationSummary?.latestnotes,
      latestpaindescription: currentObservationSummary?.latestpaindescription,
      key: currentObservationSummary?.key,

    }));
  }, [currentObservationSummary]);

  const saveChanges = async () => {
    try {
      await saveEncounterChanges(localEncounter).unwrap();
      dispatch(notify({ msg: '  Saved Successfully', sev: 'success' }));
    } catch (error) {


      dispatch(notify('Save Failed'));
    }
  };
  const savePlan = async () => {

    try {
      await saveEncounterChanges({ ...localEncounter }).unwrap();
      dispatch(notify({msg:'Saved Successfully',sev:'success'}));
    } catch (error) {


      dispatch(notify('Save Failed'));
    }
  };

  return (
    <div className='patient-summary-container'>
      <Tabs defaultActiveKey="1" appearance="subtle">
        <Tabs.Tab eventKey="1" title="Chief Complain" >

          <div className={`column-container ${edit ? "disabled-panel" : ""}`}>
            <div className='top-section'>
              <div className='flex1' >
                <div className='title-div'>
                  <Text>Chief Complaint </Text>
                  <MyButton
                    size='small'
                   
                    onClick={saveChanges}

                  >Save</MyButton>
                </div>
                <Divider />
                <Form fluid>  
                <MyInput 
                width='100%'
                height="95px"

                showLabel={false}
                fieldType='textarea'
                fieldName="chiefComplaint"
                record={localEncounter}
                setRecord={setLocalEncounter}/></Form>



              </div>
              <div className='flex1' >
                <div className='title-div'>
                  <Text>Assessment</Text>
                  <MyButton
                    size='small'
                   
                    onClick={saveChanges}

                  >Save</MyButton>
                </div>
                <Divider />
                <Form fluid>
                <MyInput 
                width='100%'
                height="95px"
                showLabel={false}
                placeholder={'Only you can see this Assessment'}
                fieldType='textarea'
                fieldName="assessmentSummery"
                record={localEncounter}
                setRecord={setLocalEncounter}/></Form>
              
              </div>
            </div>





            <div className='flex1' >
              <div className='title-div'>
                <Text>Patient Diagnosis </Text>

              </div>
              <Divider />
              <PatientDiagnosis patient={patient} encounter={encounter} setEncounter={setEncounter} />
            </div>
            <div className='flex1' >

              <div className='title-div'>
                <Text>Plan </Text>

              </div>
              <Divider />

              <Form fluid>

                <MyInput

                  width='100%'
                  fieldType="select"
                  selectData={planLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"

                  fieldName='planInstructionsLkey'

                  record={localEncounter}
                  setRecord={setLocalEncounter}
                />
                <MyInput

                  width='100%'
                  fieldType='textarea'
                  fieldName='planInstructionsNote'

                  record={localEncounter}
                  setRecord={setLocalEncounter}
                  row={4}
                />

              </Form>

              <div className='flex-end'>
                <MyButton
                  size='small'
                 
                  onClick={savePlan}

                >Save</MyButton>
              </div>
            </div>




          </div>



        </Tabs.Tab>
        <Tabs.Tab eventKey="2" title="Physical Examination & Findings">


          <fieldset>

            <legend> Physical Examination & Findings</legend>
            <ReviewOfSystems patient={patient} encounter={encounter} />
          </fieldset>
        </Tabs.Tab>
        <Tabs.Tab eventKey="3" title="Physical Examination & Findings BY Image">

          hhn
        </Tabs.Tab>
      </Tabs>

    </div>);
};
export default SOAP;