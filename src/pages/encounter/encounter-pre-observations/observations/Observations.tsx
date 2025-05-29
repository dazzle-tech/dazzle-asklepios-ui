import React, { useEffect, useState } from 'react';
import { Col, Divider, Row } from 'rsuite';
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
import MyButton from '@/components/MyButton/MyButton';

export type ObservationsRef = {
  handleSave: () => void;
};

type ObservationsProps = {
  patient?: any;
  encounter?: any;
  edit?: boolean;
};

const Observations = forwardRef<ObservationsRef, ObservationsProps>((props, ref) => {
  useImperativeHandle(ref, () => ({
    handleSave, handleClear
  }));
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
  const [map, setMap] = useState('');
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
  // TODO update status to be a LOV value
  useEffect(() => {
    if (localEncounter?.encounterStatusLkey === '91109811181900') {
      setIsEncounterStatusClosed(true);
    }
  }, [localEncounter?.encounterStatusLkey]);
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
    console.log('location.pathname', location.pathname);

  }, [location.pathname, dispatch]);

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
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    });;
  };



  useEffect(() => {
    const diastolic = Number(patientObservationSummary.latestbpDiastolic);
    const systolic = Number(patientObservationSummary.latestbpSystolic);

    // تأكد من أن القيم فعلاً أرقام وليست NaN
    if (!isNaN(diastolic) && !isNaN(systolic)) {
      const calculatedMap = ((2 * diastolic + systolic) / 3).toFixed(2);
      setMap(calculatedMap);
    }
  }, [patientObservationSummary.latestbpDiastolic, patientObservationSummary.latestbpSystolic]);

  const handleClear = () => {
    setPatientObservationSummary({
      ...newApPatientObservationSummary,
      latestpainlevelLkey: null
    });
  }


  return (

    <div ref={ref} className={`basuc-div ${edit ? "disabled-panel" : ""}`}>
      <Form fluid>
        {!(location.pathname == '/nurse-station') &&
          <Row>
            <Col md={23}></Col>
            <Col md={1}>

              <MyButton onClick={handleSave}>Save</MyButton>

            </Col>
          </Row>}
        <Row>
          <Col md={12}>
            <div className='container-form'>
              <div className='title-div'>
                <Text>Vital Signs</Text>

              </div>
              <Divider />

              <Row className="rows-gap">
                <Col md={7}>
                  <MyInput
                    width='100%'
                    fieldLabel='BP'
                    fieldName='latestbpSystolic'
                    disabled={isEncounterStatusClosed || readOnly}
                    fieldType='number'
                    record={patientObservationSummary}
                    setRecord={setPatientObservationSummary}
                  >

                  </MyInput>
                </Col>
                <Col md={2} >
                  <div style={{padding:'20px' ,paddingTop:'30px'}}>/</div>
                </Col>
                <Col md={7}>   <MyInput
                  width='100%'
                  fieldLabel='mmHg'
                  fieldName='latestbpDiastolic'
                  disabled={isEncounterStatusClosed || readOnly}
                  fieldType='number'
                  record={patientObservationSummary}
                  setRecord={setPatientObservationSummary}
                ></MyInput></Col>
                <Col md={8}>   <div className='container-Column'>
                  <MyLabel label="MAP" />
                  <div>
                    <FontAwesomeIcon icon={faHeartPulse} className='my-icon' />
                    <text>{
                      map
                    }</text></div>
                </div></Col>
              </Row>

              <Row className="rows-gap">
                <Col md={12}>
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
                  ></MyInput></Col>
                <Col md={12}>
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
                  ></MyInput></Col>
              </Row>
              <Row className="rows-gap">
                <Col md={12}>
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
                  ></MyInput></Col>
                <Col md={12}>
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
                  ></MyInput></Col>
              </Row>
              <Row className="rows-gap">
                <Col md={24}>
                  <MyInput
                    fieldLabel='Note'
                    height='100px'
                    width='100%'
                    fieldName='latestnotes'
                    disabled={isEncounterStatusClosed || readOnly}
                    fieldType='textarea'
                    record={patientObservationSummary}
                    setRecord={setPatientObservationSummary}
                  ></MyInput></Col>
              </Row>
            </div>
          </Col>
          <Col md={12}>
            <Row>
              <div className='container-form'>
                <div className='title-div'>
                  <Text>Body Measurements</Text>

                </div>
                <Divider />

                <Row className="rows-gap">
                  <Col md={12}>
                    <MyInput
                      width='100%'
                      fieldLabel='Weight'
                      fieldName='latestweight'
                      rightAddon="Kg"
                      disabled={isEncounterStatusClosed || readOnly}
                      fieldType='number'
                      record={patientObservationSummary}
                      setRecord={setPatientObservationSummary}
                    ></MyInput></Col>
                  <Col md={12}>
                    <div className='container-Column'>
                      <MyLabel label="BMI" />
                      <div>
                        <FontAwesomeIcon icon={faPerson} className='my-icon' />
                        <text>{bmi}</text>
                      </div>
                    </div>
                  </Col>
                </Row>
                <Row className="rows-gap">
                  <Col md={12}>
                    <MyInput
                      width='100%'
                      fieldLabel='Height'
                      fieldName='latestheight'
                      rightAddon="Cm"
                      disabled={isEncounterStatusClosed || readOnly}
                      fieldType='number'
                      record={patientObservationSummary}
                      setRecord={setPatientObservationSummary}
                    ></MyInput></Col>
                  <Col md={12}>
                    <div className='container-Column'>
                      <MyLabel label="BSA" />
                      <div>
                        <FontAwesomeIcon icon={faChildReaching} className='my-icon' />
                        <text>{bsa}</text>
                      </div>
                    </div>
                  </Col>
                </Row>
                <Row className='rows-gap'>
                  <Col md={12}>
                    <MyInput
                      width='100%'
                      fieldLabel='Head circumference'
                      rightAddon="Cm"
                      rightAddonwidth={40}
                      fieldName='latestheadcircumference'
                      disabled={isEncounterStatusClosed || readOnly}
                      fieldType='number'
                      record={patientObservationSummary}
                      setRecord={setPatientObservationSummary} />
                  </Col>
                  <Col md={12}></Col>
                </Row>


              </div></Row>
            <Row>
              <div className='container-form'>
                <div className='title-div'>
                  <Text>Pain Level</Text>

                </div>
                <Divider />
               
                  <Row>
                    <Col md={24}>
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
                    </Col>
                  </Row>
                  <Row>
                    <Col md={24}>
                      <MyInput
                        fieldType='textarea'
                        width='100%'
                        fieldLabel="Pain Description"
                        fieldName='latestpaindescription'
                        record={patientObservationSummary}
                        setRecord={setPatientObservationSummary} />
                    </Col>
                  </Row>

              </div>
            </Row>
          </Col>
        </Row>
      </Form>

    </div>


  );
});

export default Observations;
