import React, { useEffect, useState } from 'react';
import { Col, Divider, Row } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import { forwardRef, useImperativeHandle } from 'react';
import './styles.less';
import { Text, Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChildReaching, faPerson } from '@fortawesome/free-solid-svg-icons';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetObservationSummariesQuery,
  useSaveObservationSummaryMutation
} from '@/services/observationService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ApPatientObservationSummary } from '@/types/model-types';
import { newApPatientObservationSummary } from '@/types/model-types-constructor';
import { ApPatient } from '@/types/model-types';
import { initialListRequest, ListRequest } from '@/types/types';
import MyLabel from '@/components/MyLabel';
import { useLocation } from 'react-router-dom';
import MyButton from '@/components/MyButton/MyButton';
import clsx from 'clsx';
import VitalSigns from '@/pages/medical-component/vital-signs/VitalSigns';
import { useGetAgeGroupValueQuery } from '@/services/patientService';
import { useSaveEncounterChangesMutation } from '@/services/encounterService';
import { setRefetchPatientSide } from '@/reducers/refetchPatientSide';
export type ObservationsRef = {
  handleSave: () => void;
};
type ObservationsProps = {
  patient?: any;
  encounter?: any;
  edit?: boolean;
}; //edit
const Observations = forwardRef<ObservationsRef, ObservationsProps>((props, ref) => {
  useImperativeHandle(ref, () => ({
    handleSave,
    handleClear
  }));
  const location = useLocation();
  const state = location.state || {};
  const patient = props.patient || state.patient;
  const encounter = props.encounter || state.encounter;
  const edit = props.edit ?? state.edit;
  const dispatch = useAppDispatch();
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...patient });
  const { data: painDegreesLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_DEGREE');
  const { data: numbersLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
  const [localEncounter, setLocalEncounter] = useState<any>({ ...encounter });

  const [bmi, setBmi] = useState('');
  const [bsa, setBsa] = useState('');
  const [vital, setVital] = useState({
    bloodPressureSystolic: 0,
    bloodPressureDiastolic: 0,
    heartRate: 0,
    temperature: 0,
    oxygenSaturation: 0,
    measurementSiteLkey: '',
    respiratoryRate: 0
  });
  const [saveObservationSummary, saveObservationsMutation] = useSaveObservationSummaryMutation();
  const [saveencounter] = useSaveEncounterChangesMutation();
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
  const { data: getObservationSummaries } = useGetObservationSummariesQuery({
    ...patientLastVisitObservationsListRequest
  });
  const { data: encounterPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');

  // Get the last observation summary if available, otherwise set it to null
  const lastObservationSummary =
    getObservationSummaries?.object?.length > 0 ? getObservationSummaries.object[0] : null;
  const lastencounterop =
    getObservationSummaries?.object?.length > 0
      ? getObservationSummaries?.object?.findLast(item => item.visitKey === encounter?.key)
      : null;

  const [patientObservationSummary, setPatientObservationSummary] =
    useState<ApPatientObservationSummary>({
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
  // Fetch patient's age group based on their date of birth
  const { data: patientAgeGroupResponse, refetch: patientAgeGroupRefetch } =
    useGetAgeGroupValueQuery(
      {
        dob: patient?.dob ? new Date(patient.dob).toISOString() : null
      },
      { skip: !patient?.dob }
    );

  useEffect(() => {
    if (lastencounterop) {
      setPatientObservationSummary({
        ...lastencounterop
      });
    }
  }, [lastencounterop]);
  useEffect(() => {
    setVital({
      ...vital,
      bloodPressureSystolic: patientObservationSummary.latestbpSystolic || 0,
      bloodPressureDiastolic: patientObservationSummary.latestbpDiastolic || 0,
      heartRate: patientObservationSummary.latestheartrate || 0,
      temperature: patientObservationSummary.latesttemperature || 0,
      oxygenSaturation: patientObservationSummary.latestoxygensaturation || 0,
      // measurementSiteLkey: patientObservationSummary.measurementSiteLkey || '',
      respiratoryRate: patientObservationSummary.latestrespiratoryrate || 0
    });
  }, [patientObservationSummary]);

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
        latestrespiratoryrate: vital?.respiratoryRate,
        prevRecordKey: lastObservationSummary?.key || null,
        plastDate: lastObservationSummary?.lastDate || null,
        platesttemperature: lastObservationSummary?.latesttemperature || null,
        platestbpSystolic: lastObservationSummary?.latestbpSystolic || null,
        platestbpDiastolic: lastObservationSummary?.latestbpDiastolic || null,
        platestheartrate: lastObservationSummary?.latestheartrate || null,
        platestrespiratoryrate: lastObservationSummary?.latestrespiratoryrate || null,
        platestoxygensaturation: lastObservationSummary?.latestoxygensaturation || null,
        platestweight:
          lastObservationSummary?.latestweight || lastObservationSummary?.platestweight,
        platestheight:
          lastObservationSummary?.latestheight || lastObservationSummary?.platestheight,
        platestheadcircumference:
          lastObservationSummary?.latestheadcircumference ||
          lastObservationSummary?.platestheadcircumference,
        platestnotes: lastObservationSummary?.latestnotes || '',
        platestpaindescription: lastObservationSummary?.latestpaindescription || '',
        platestpainlevelLkey: lastObservationSummary?.latestpainlevelLkey || '',
        platestbmi: lastObservationSummary?.latestbmi,
        page: lastObservationSummary?.age
      }).unwrap();
      if (encounter.chiefComplaint !== localEncounter.chiefComplaint) {
        console.log('true');
        await saveencounter(localEncounter).unwrap();
      }
      dispatch(setRefetchPatientSide(true));
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
  };

  // Effects
  useEffect(() => {
    console.log(`lastencounterop`, lastencounterop);
    if (lastencounterop) {
      setPatientObservationSummary({
        ...lastencounterop
      });
      console.log(patientObservationSummary.latestbpSystolic);
    }
  }, [lastencounterop]);
  useEffect(() => {
    setVital({
      ...vital,
      bloodPressureSystolic: patientObservationSummary.latestbpSystolic || 0,
      bloodPressureDiastolic: patientObservationSummary.latestbpDiastolic || 0,
      heartRate: patientObservationSummary.latestheartrate || 0,
      temperature: patientObservationSummary.latesttemperature || 0,
      oxygenSaturation: patientObservationSummary.latestoxygensaturation || 0
    });
  }, [patientObservationSummary]);
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
      const calculatedBmi = (latestweight / (latestheight / 100) ** 2).toFixed(2);
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
        {!(location.pathname == '/nurse-station') && (
          <Row>
            <Col md={23}></Col>
            <Col md={1}>
              <MyButton onClick={handleSave}>Save</MyButton>
            </Col>
          </Row>
        )}
        <Row>
          <Col md={12}>
            <Row>
              <Col md={24}>
                <div className="container-form">
                  <div className="title-div">
                    <Text>Vital Signs</Text>
                  </div>
                  <Divider />
                  <VitalSigns
                    object={vital}
                    setObject={setVital}
                    disabled={true}
                    width="28vw"
                    showNoteField={true}
                  />
                </div>
              </Col>
            </Row>
            <Row>
              <Col md={24}>
                <div className="container-form">
                  <div className="title-div">
                    <Text> Patient Observations & Complaints</Text>
                  </div>
                  <Divider />
                  <Row>
                    <Col md={24}>
                      <MyInput
                        fieldLabel="Functional Status"
                        width="100%"
                        fieldName="latestFunctionalStatus"
                        disabled={isEncounterStatusClosed || readOnly}
                        fieldType="textarea"
                        record={patientObservationSummary}
                        setRecord={setPatientObservationSummary}
                      />
                    </Col>
                  </Row>

                  <Row>
                    <Col md={24}>
                      <MyInput
                        fieldLabel="Cognitive Check"
                        width="100%"
                        fieldName="latestCognitiveCheck"
                        disabled={isEncounterStatusClosed || readOnly}
                        fieldType="textarea"
                        record={patientObservationSummary}
                        setRecord={setPatientObservationSummary}
                      />
                    </Col>
                  </Row>

                  <Row>
                    <Col md={24}>
                      <MyInput
                        width="100%"
                        fieldName="chiefComplaint"
                        disabled={isEncounterStatusClosed || readOnly}
                        fieldType="textarea"
                        record={localEncounter}
                        setRecord={setLocalEncounter}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col md={24}>
                      <MyInput
                        width={'100%'}
                        fieldLabel="Priority"
                        fieldType="select"
                        fieldName="encounterPriorityLkey"
                        selectData={encounterPriorityLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={localEncounter}
                        setRecord={setLocalEncounter}
                        disabled={isEncounterStatusClosed || readOnly}
                        searchable={false}
                      />
                    </Col>
                  </Row>
                </div>{' '}
              </Col>
            </Row>
          </Col>
          <Col md={12}>
            <Row>
              <div className="container-form">
                <div className="title-div">
                  <Text>Body Measurements</Text>
                </div>
                <Divider />
                <Row className="rows-gap">
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldLabel="Weight"
                      fieldName="latestweight"
                      rightAddon="Kg"
                      disabled={isEncounterStatusClosed || readOnly}
                      fieldType="number"
                      record={patientObservationSummary}
                      setRecord={setPatientObservationSummary}
                    ></MyInput>
                  </Col>
                  <Col md={12}>
                    <div className="container-Column">
                      <MyLabel label="BMI" />
                      <div>
                        <FontAwesomeIcon icon={faPerson} className="my-icon" />
                        <text>{bmi}</text>
                      </div>
                    </div>
                  </Col>
                </Row>
                <Row className="rows-gap">
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldLabel="Height"
                      fieldName="latestheight"
                      rightAddon="Cm"
                      disabled={isEncounterStatusClosed || readOnly}
                      fieldType="number"
                      record={patientObservationSummary}
                      setRecord={setPatientObservationSummary}
                    ></MyInput>
                  </Col>
                  <Col md={12}>
                    <div className="container-Column">
                      <MyLabel label="BSA" />
                      <div>
                        <FontAwesomeIcon icon={faChildReaching} className="my-icon" />
                        <text>{bsa}</text>
                      </div>
                    </div>
                  </Col>
                </Row>
                <Row className="rows-gap">
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldLabel="Head circumference"
                      rightAddon="Cm"
                      rightAddonwidth={40}
                      fieldName="latestheadcircumference"
                      disabled={isEncounterStatusClosed || readOnly}
                      fieldType="number"
                      record={patientObservationSummary}
                      setRecord={setPatientObservationSummary}
                    />
                  </Col>
                  <Col md={12}></Col>
                </Row>
              </div>
            </Row>
            <Row>
              <div className="container-form">
                <div className="title-div">
                  <Text>Pain Assessment</Text>
                </div>
                <Divider />
                <Row>
                  <Col md={12}>
                    <MyInput
                      disabled={isEncounterStatusClosed || readOnly}
                      width="100%"
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
                  <Col md={12}>
                    <MyInput
                      disabled={isEncounterStatusClosed || readOnly}
                      width="100%"
                      fieldLabel="Pain Score"
                      fieldType="select"
                      fieldName=""
                      selectData={numbersLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={patientObservationSummary}
                      setRecord={setPatientObservationSummary}
                      menuMaxHeight={150}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={24}>
                    <MyInput
                      fieldType="textarea"
                      width="100%"
                      fieldLabel="Pain Description"
                      fieldName="latestpaindescription"
                      record={patientObservationSummary}
                      setRecord={setPatientObservationSummary}
                    />
                  </Col>
                </Row>
              </div>
            </Row>

            {(patientAgeGroupResponse?.object?.valueCode === 'AG_INFANT' ||
              patientAgeGroupResponse?.object?.valueCode === 'AG_NEONATE') && (
              <Row>
                <Col md={24}>
                  <div className="container-form">
                    <div className="title-div">
                      <Text>Additional Measurements</Text>
                    </div>
                    <Divider />
                    <Row className="rows-gap">
                      <Col md={24}>
                        <MyInput
                          width="100%"
                          fieldName="latesthearingtest"
                          fieldLabel="Hearing Test"
                          record={patientObservationSummary}
                          disabled={isEncounterStatusClosed || readOnly}
                          setRecord={setPatientObservationSummary}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col md={8}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="latestDehydration"
                          fieldLabel="Dehydration"
                          checkedLabel="positive"
                          unCheckedLabel="negative"
                          record={patientObservationSummary}
                          disabled={isEncounterStatusClosed || readOnly}
                          setRecord={setPatientObservationSummary}
                        />
                      </Col>
                      <Col md={8}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="latestNasalFlaring"
                          fieldLabel="Nasal Flaring"
                          checkedLabel="positive"
                          unCheckedLabel="negative"
                          record={patientObservationSummary}
                          disabled={isEncounterStatusClosed || readOnly}
                          setRecord={setPatientObservationSummary}
                        />
                      </Col>
                      <Col md={8}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="latestResponseToLight"
                          fieldLabel="Response to Light"
                          checkedLabel="positive"
                          unCheckedLabel="negative"
                          record={patientObservationSummary}
                          disabled={isEncounterStatusClosed || readOnly}
                          setRecord={setPatientObservationSummary}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col md={8}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="latestPupilResponse"
                          fieldLabel="Pupil Response"
                          checkedLabel="positive"
                          unCheckedLabel="negative"
                          record={patientObservationSummary}
                          disabled={isEncounterStatusClosed || readOnly}
                          setRecord={setPatientObservationSummary}
                        />
                      </Col>
                      <Col md={8}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="latestAbilityToFollowTarget"
                          fieldLabel="Ability to Follow Target"
                          checkedLabel="positive"
                          unCheckedLabel="negative"
                          record={patientObservationSummary}
                          disabled={isEncounterStatusClosed || readOnly}
                          setRecord={setPatientObservationSummary}
                        />
                      </Col>
                      <Col md={8}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="latestColorTesting"
                          fieldLabel="Color Testing"
                          checkedLabel="positive"
                          unCheckedLabel="negative"
                          record={patientObservationSummary}
                          disabled={isEncounterStatusClosed || readOnly}
                          setRecord={setPatientObservationSummary}
                        />
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
            )}
            {patientAgeGroupResponse?.object?.valueCode === 'AG_GER' && (
              <Row>
                <Col md={24}>
                  <div className="container-form">
                    <div className="title-div">
                      <Text>Additional Measurements</Text>
                    </div>
                    <Divider />
                    <Row>
                      <Col md={24}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldLabel="Full Risk"
                          fieldName="latestFallRisk"
                          record={patientObservationSummary}
                          disabled={isEncounterStatusClosed || readOnly}
                          setRecord={setPatientObservationSummary}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col md={24}>
                        <MyInput
                          width="100%"
                          fieldName="latestFallRiskDetails"
                          fieldLabel="Details"
                          fieldType="textarea"
                          record={patientObservationSummary}
                          disabled={isEncounterStatusClosed || readOnly}
                          setRecord={setPatientObservationSummary}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col md={24}>
                        <MyInput
                          width="100%"
                          fieldName="latestActionToTake"
                          fieldLabel="Action to Take"
                          fieldType="textarea"
                          record={patientObservationSummary}
                          disabled={isEncounterStatusClosed || readOnly}
                          setRecord={setPatientObservationSummary}
                        />
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
            )}
          </Col>
        </Row>
      </Form>
    </div>
  );
});

export default Observations;
