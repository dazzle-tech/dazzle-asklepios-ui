import React, { useEffect, useState } from 'react';
import { Col, Divider, Row} from 'rsuite';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import { forwardRef, useImperativeHandle } from 'react';
import './styles.less';
import {
  Text,
  Form
} from 'rsuite';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChildReaching,
  faHeartPulse,
  faPerson
} from '@fortawesome/free-solid-svg-icons';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetObservationSummariesQuery,
  useSaveObservationSummaryMutation
} from '@/services/observationService';
import {
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import {
  ApEncounter,
  ApPatientObservationSummary
} from '@/types/model-types';
import {
  newApPatientObservationSummary
} from '@/types/model-types-constructor';
import { ApPatient } from '@/types/model-types';
import { initialListRequest, ListRequest } from '@/types/types';
import MyLabel from '@/components/MyLabel';
import { useLocation } from 'react-router-dom';

export type ObservationsRef = {
  handleSave: () => void;
};

type ObservationsProps = {
  patient?: any;
  encounter?: any;
  edit?: boolean;
};

const Observations = forwardRef<ObservationsRef, ObservationsProps>((props, ref) => {
  const location = useLocation();
  const state = location.state || {};
  const patient = props.patient || state.patient;
  const encounter = props.encounter || state.encounter;
  const edit = props.edit ?? state.edit;
  const dispatch = useAppDispatch();
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...patient })
  const { data: painDegreesLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_DEGREE');
  const [localEncounter, setLocalEncounter] = useState<ApEncounter>({ ...encounter })
  const [bmi, setBmi] = useState('');
  const [bsa, setBsa] = useState('');
  const [saveObservationSummary, setSaveObservationSummary] = useSaveObservationSummaryMutation();
  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [patientLastVisitObservationsListRequest, setPatientLastVisitObservationsListRequest] =
    useState<ListRequest>({
      ...initialListRequest,
      sortBy: 'createdAt',
      sortType: 'desc',
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: localPatient?.key
        }
      ]
    });
  // TODO update status to be a LOV value
  useEffect(() => {
    if (localEncounter?.encounterStatusLkey === '91109811181900') {
      setIsEncounterStatusClosed(true);
    }
  }, [localEncounter?.encounterStatusLkey]);

  const [patientObservationsListRequest, setPatientObservationsListRequest] =
    useState<ListRequest>({
      ...initialListRequest,
      timestamp: new Date().getMilliseconds(),
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: localPatient?.key
        }
        ,
        {
          fieldName: 'visit_key',
          operator: 'match',
          value: localEncounter?.key
        }
      ]
    });
  const { data: getObservationSummaries } = useGetObservationSummariesQuery({
    ...patientLastVisitObservationsListRequest,

  });
  const { data: getCurrenttObservationSummaries } = useGetObservationSummariesQuery({
    ...patientObservationsListRequest,
  });
  const currentObservationSummary = getCurrenttObservationSummaries?.object?.length > 0 ? getCurrenttObservationSummaries.object[0] : null;
  const firstObservationSummary = getObservationSummaries?.object?.length > 0 ? getObservationSummaries.object[0] : null;
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

  const handleSave = () => {
    saveObservationSummary({
      observation: {
        ...patientObservationSummary,
        visitKey: localEncounter.key,
        patientKey: localPatient.key,
        createdBy: 'Administrator',
        key: currentObservationSummary?.key,
        lastDate: new Date(),
        latestbmi: bmi,
        age: firstObservationSummary?.age,
        prevRecordKey: firstObservationSummary?.key || null,
        plastDate: firstObservationSummary?.lastDate || null,
        platesttemperature: firstObservationSummary?.latesttemperature || null,
        platestbpSystolic: firstObservationSummary?.latestbpSystolic || null,
        platestbpDiastolic: firstObservationSummary?.latestbpDiastolic || null,
        platestheartrate: firstObservationSummary?.latestheartrate || null,
        platestrespiratoryrate: firstObservationSummary?.latestrespiratoryrate || null,
        platestoxygensaturation: firstObservationSummary?.latestoxygensaturation || null,
        platestweight: firstObservationSummary?.latestweight || firstObservationSummary?.platestweight,
        platestheight: firstObservationSummary?.latestheight || firstObservationSummary?.platestheight,
        platestheadcircumference: firstObservationSummary?.latestheadcircumference || firstObservationSummary?.platestheadcircumference,
        platestnotes: firstObservationSummary?.latestnotes || '',
        platestpaindescription: firstObservationSummary?.latestpaindescription || '',
        platestpainlevelLkey: firstObservationSummary?.latestpainlevelLkey || '',
        platestbmi: firstObservationSummary?.latestbmi,
        page: firstObservationSummary?.age,
      },
      listRequest: patientObservationsListRequest
    }).unwrap().then(() => {
      dispatch(notify({masg:'Saved Successfully' ,sev:'success'}));
    });;
  };
  useImperativeHandle(ref, () => ({
    handleSave,handleClear
  }));

  useEffect(() => {
    const { latestweight, latestheight } = patientObservationSummary;
    if (latestweight && latestheight) {
      const calculatedBmi = (latestweight / ((latestheight / 100) ** 2)).toFixed(2);
      const calculatedBsa = Math.sqrt((latestweight * latestheight) / 3600).toFixed(2);
      setBmi(calculatedBmi);
      setBsa(calculatedBsa);
    } else {
      setBmi('');
      setBsa('');
    }
  }, [patientObservationSummary]);

  useEffect(() => {
  }, [patientObservationSummary.latestbpSystolic])
 
  const handleClear = () => {
    setPatientObservationSummary({
      ...newApPatientObservationSummary,
      latestpainlevelLkey: null
    });
  }
 

  return (
   
      <div ref={ref} className={`basuc-div ${edit ? "disabled-panel" : ""}`}>
        <Form fluid>
        <Row>
          <Col md={12}>
           <div className='container-form'>
            <div className='title-div'>
              <Text>Vital Signs</Text>

            </div>
            <Divider />
            <div className='container-Column'>
              <div className='container-row'>
                  <MyInput
                    
                    fieldLabel='BP'
                    fieldName='latestbpSystolic'
                    disabled={isEncounterStatusClosed || readOnly}
                    fieldType='number'
                    record={patientObservationSummary}
                    setRecord={setPatientObservationSummary}
                  ></MyInput>

                <span style={{ marginTop: '36px' }}>/</span>
              
                  <MyInput
                    
                    fieldLabel='mmHg'
                    fieldName='latestbpDiastolic'
                    disabled={isEncounterStatusClosed || readOnly}
                    fieldType='number'
                    record={patientObservationSummary}
                    setRecord={setPatientObservationSummary}
                  ></MyInput>
                <div className='container-Column'>
                  <MyLabel label="MAP" />
                  <div>
                    <FontAwesomeIcon icon={faHeartPulse} className='my-icon' />
                    <text>{
                      patientObservationSummary.latestbpDiastolic != null && patientObservationSummary.latestbpSystolic != null
                        ? ((2 * patientObservationSummary.latestbpDiastolic + patientObservationSummary.latestbpSystolic) / 3).toFixed(2)
                        : ''
                    }</text></div>
                </div>
              </div>
              <div className='container-row'>
                <div style={{ flex: 1 }}>

                    <MyInput
                      
                      fieldLabel='Pulse'
                      rightAddon="bpm"
                      width='100%'
                      rightAddonwidth={50}
                      fieldName='latestheartrate'
                      disabled={isEncounterStatusClosed || readOnly}
                      fieldType='number'
                      record={patientObservationSummary}
                      setRecord={setPatientObservationSummary}
                    ></MyInput>
                </div>
                <div style={{ flex: 1 }}>
                    <MyInput
                      
                      fieldLabel='R.R'
                      rightAddon="bpm"
                      rightAddonwidth={50}
                      width='100%'
                      fieldName='latestrespiratoryrate'
                      disabled={isEncounterStatusClosed || readOnly}
                      fieldType='number'
                      record={patientObservationSummary}
                      setRecord={setPatientObservationSummary}
                    ></MyInput>
                </div>
              </div>
              <div className='container-row'>
                <div style={{ flex: 1 }}>
                    <MyInput
                      fieldLabel='SpO2'
                      rightAddon="%"
                      width='100%'
                      rightAddonwidth={40}
                      fieldName='latestoxygensaturation'
                      disabled={isEncounterStatusClosed || readOnly}
                      fieldType='number'
                      record={patientObservationSummary}
                      setRecord={setPatientObservationSummary}
                    ></MyInput>
                </div>
                <div style={{ flex: 1 }}>
                    <MyInput
                      fieldLabel='Temp'
                      rightAddon="°C"
                      rightAddonwidth={40}
                      width='100%'
                      fieldName='latesttemperature'
                      disabled={isEncounterStatusClosed || readOnly}
                      fieldType='number'
                      record={patientObservationSummary}
                      setRecord={setPatientObservationSummary}
                    ></MyInput>
                </div>
              </div>
              <div >
                  <MyInput
                 
                    fieldLabel='Note'
                    height='100px'
                    width='100%'
                    fieldName='latestnotes'
                    disabled={isEncounterStatusClosed || readOnly}
                    fieldType='textarea'
                    record={patientObservationSummary}
                    setRecord={setPatientObservationSummary}
                  ></MyInput>
              
              </div>

            </div>
          </div>
          </Col>
          <Col md={12}>
          <Row>
          <div className='container-form'>
            <div className='title-div'>
              <Text>Body Measurements</Text>

            </div>
            <Divider />
            <div className='container-Column'>
              <div className='container-row'>
                  <MyInput
                 
                    fieldLabel='Weight'
                    fieldName='latestweight'
                    rightAddon="Kg"
                    disabled={isEncounterStatusClosed || readOnly}
                    fieldType='number'
                    record={patientObservationSummary}
                    setRecord={setPatientObservationSummary}
                  ></MyInput>


                <div className='container-Column'>
                  <MyLabel label="BMI" />
                  <div>
                    <FontAwesomeIcon icon={faPerson} className='my-icon' />
                    <text>{bmi}</text>
                  </div>
                </div>
              </div>
              <div className='container-row'>
                  <MyInput
                 
                    fieldLabel='Height'
                    fieldName='latestheight'
                    rightAddon="Kg"
                    disabled={isEncounterStatusClosed || readOnly}
                    fieldType='number'
                    record={patientObservationSummary}
                    setRecord={setPatientObservationSummary}
                  ></MyInput>


                <div className='container-Column'>
                  <MyLabel label="BSA" />
                  <div>
                    <FontAwesomeIcon icon={faChildReaching} className='my-icon' />
                    <text>{bsa}</text>
                  </div>
                </div>
              </div>
              <div className='container-row'>
                  <MyInput
                   
                    fieldLabel='Head circumference'
                    rightAddon="Cm"
                    rightAddonwidth={40}
                    fieldName='latestheadcircumference'
                    disabled={isEncounterStatusClosed || readOnly}
                    fieldType='number'
                    record={patientObservationSummary}
                    setRecord={setPatientObservationSummary}
                  ></MyInput>
              </div>


            </div>
          </div></Row>
          <Row>
             <div className='container-form'>
            <div className='title-div'>
              <Text>Pain Level</Text>

            </div>
            <Divider />
            <div className='container-Column'>

                <MyInput
                  disabled={isEncounterStatusClosed || readOnly}
                  width='100%'
                  fieldLabel="Pain Degree"
                  fieldType="select"
                  fieldName="latestpainlevelLkey"
                  selectData={painDegreesLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={patientObservationSummary}
                  setRecord={setPatientObservationSummary}
                />
    
                <MyInput
                  fieldType='textarea'
                  width='100%'
                  fieldLabel="Pain Description"
                  fieldName='latestpaindescription'
                  record={patientObservationSummary}
                  setRecord={setPatientObservationSummary} />

            </div>
          </div>
          </Row>
          </Col>
        </Row>
      </Form>
       
      </div>
   

  );
});

export default Observations;
