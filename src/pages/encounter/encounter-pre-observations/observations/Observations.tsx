import React, { useEffect, useState } from 'react';
import { Col, Divider, Row } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import { forwardRef, useImperativeHandle } from 'react';
import './styles.less';
import { Text, Form } from 'rsuite';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChildReaching, faHeartPulse, faPerson } from '@fortawesome/free-solid-svg-icons';
import { notify } from '@/utils/uiReducerActions';
import { useGetObservationSummariesQuery, useSaveObservationSummaryMutation } from '@/services/observationService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ApPatientObservationSummary } from '@/types/model-types';
import { newApPatientObservationSummary } from '@/types/model-types-constructor';
import { ApPatient } from '@/types/model-types';
import { initialListRequest, ListRequest } from '@/types/types';
import MyLabel from '@/components/MyLabel';
import { useLocation } from 'react-router-dom';
import MyButton from '@/components/MyButton/MyButton';
import clsx from 'clsx';
import InpatientObservations from './InpatientObservations';
import VitalSigns from '@/pages/medical-component/vital-signs/VitalSigns';
export type ObservationsRef = {
  handleSave: () => void;
};
type ObservationsProps = {
  patient?: any;
  encounter?: any;
  edit?: boolean;
};//edit
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
  const [localEncounter, setLocalEncounter] = useState<any>({ ...encounter })
  const [bmi, setBmi] = useState('');
  const [bsa, setBsa] = useState('');
  const [vital, setVital] = useState({
    bloodPressureSystolic: 0,
    bloodPressureDiastolic: 0,
    heartRate: 0,
    temperature: 0,
    oxygenSaturation: 0,
  });
  const [saveObservationSummary, saveObservationsMutation] = useSaveObservationSummaryMutation();
  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [readOnly, setReadOnly] = useState(false);

  // Define state for the request used to fetch the patient's last observations list
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

  // Fetch observation summaries using the useGetObservationSummariesQuery hook
  const { data: getObservationSummaries } = useGetObservationSummariesQuery({ ...patientLastVisitObservationsListRequest });

  // Get the last observation summary if available, otherwise set it to null
  const lastObservationSummary = getObservationSummaries?.object?.length > 0 ? getObservationSummaries.object[0] : null;
  const lastencounterop = getObservationSummaries?.object?.length > 0 ? getObservationSummaries?.object?.findLast(item => item.visitKey === encounter?.key) : null;

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
    console.log(`lastencounterop`, lastencounterop);
    if (lastencounterop) {
      setPatientObservationSummary({
        ...lastencounterop
      });
      console.log(patientObservationSummary.latestbpSystolic)
      

    }
  }, [lastencounterop])
  useEffect(()=>{
    setVital({
        ...vital,
        bloodPressureSystolic: patientObservationSummary.latestbpSystolic || 0,
        bloodPressureDiastolic: patientObservationSummary.latestbpDiastolic || 0,
        heartRate: patientObservationSummary.latestheartrate || 0,
        temperature: patientObservationSummary.latesttemperature || 0,
        oxygenSaturation: patientObservationSummary.latestoxygensaturation || 0,

      })
  },[patientObservationSummary])
  // Handle Save Observations Function
  const handleSave = async () => {
    try {
      await saveObservationSummary({
        ...patientObservationSummary,
        visitKey: localEncounter.key,
        patientKey: localPatient.key,
        createdBy: 'Administrator',
        lastDate: new Date(),
        latestbmi: bmi,
        age: lastObservationSummary?.age,
        latestbpSystolic: vital?.bloodPressureSystolic,
        latestbpDiastolic: vital?.bloodPressureDiastolic,
        latestheartrate: vital?.heartRate,
        latestoxygensaturation: vital?.oxygenSaturation,
        latesttemperature: vital?.temperature,
        prevRecordKey: lastObservationSummary?.key || null,
        plastDate: lastObservationSummary?.lastDate || null,
        platesttemperature: lastObservationSummary?.latesttemperature || null,
        platestbpSystolic: lastObservationSummary?.latestbpSystolic || null,
        platestbpDiastolic: lastObservationSummary?.latestbpDiastolic || null,
        platestheartrate: lastObservationSummary?.latestheartrate || null,
        platestrespiratoryrate: lastObservationSummary?.latestrespiratoryrate || null,
        platestoxygensaturation: lastObservationSummary?.latestoxygensaturation || null,
        platestweight: lastObservationSummary?.latestweight || lastObservationSummary?.platestweight,
        platestheight: lastObservationSummary?.latestheight || lastObservationSummary?.platestheight,
        platestheadcircumference: lastObservationSummary?.latestheadcircumference || lastObservationSummary?.platestheadcircumference,
        platestnotes: lastObservationSummary?.latestnotes || '',
        platestpaindescription: lastObservationSummary?.latestpaindescription || '',
        platestpainlevelLkey: lastObservationSummary?.latestpainlevelLkey || '',
        platestbmi: lastObservationSummary?.latestbmi,
        page: lastObservationSummary?.age,
      }).unwrap();
      setTimeout(() => {
        window.location.reload()
      }, 500);
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    } catch (error) {
      console.error('Error while saving observation summary:', error);
      dispatch(notify({ msg: 'Error occurred while saving', sev: 'error' }));
    }
  };
  // Handle Clear Fields 
  const handleClear = () => {
    setPatientObservationSummary({
      ...newApPatientObservationSummary,
      latestpainlevelLkey: null
    });
  }


  useEffect(() => {
    if (saveObservationsMutation && saveObservationsMutation.status === 'fulfilled') {
      setPatientObservationSummary(saveObservationsMutation.data);
    }
  }, [saveObservationsMutation]);
  useEffect(() => {
    // TODO update status to be a LOV value
    if (localEncounter?.encounterStatusLkey === '91109811181900') {
      setIsEncounterStatusClosed(true);
    }
  }, [localEncounter?.encounterStatusLkey]);
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

  return (
    <div ref={ref} className={clsx('basuc-div', { 'disabled-panel': edit })}>
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
                <VitalSigns object={vital} setObject={setVital} />

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