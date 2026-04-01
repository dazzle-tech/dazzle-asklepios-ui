// ObservationsStandalone.tsx
import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Col, Form, Row, Slider } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPerson, faChildReaching } from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import SectionContainer from '@/components/SectionsoContainer';
import VitalSigns from '@/pages/medical-component/vital-signs/VitalSigns';

import { useAppDispatch } from '@/hooks';
import { setRefetchPatientSide } from '@/reducers/refetchPatientSide';
import { useSaveEncounterChangesMutation } from '@/services/encounterService';
import {
  useGetObservationSummariesQuery,
  useSaveObservationSummaryMutation
} from '@/services/observationService';
import { useGetAgeGroupValueQuery } from '@/services/patientService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

import { ApEncounter, ApPatient, ApPatientObservationSummary } from '@/types/model-types';
import { newApPatientObservationSummary } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';

import './styles.less';

// ---------- Helper for safe setState merging ----------
function mergeSetter<T extends Record<string, any>>(
  setState: React.Dispatch<React.SetStateAction<T>>
) {
  return (next: any) => {
    if (typeof next === 'function') {
      setState(prev => {
        const computed = next(prev);
        if (computed && typeof computed === 'object') return { ...prev, ...computed };
        return prev;
      });
      return;
    }
    if (next && typeof next === 'object') {
      setState(prev => ({ ...prev, ...next }));
      return;
    }
  };
}

// ---------- Props ----------
type ObservationsStandaloneProps = {
  patient: ApPatient;
  encounter: ApEncounter;
  edit?: boolean;
  setOpen: any
};

// ---------- Main Component ----------
const Observations: React.FC<ObservationsStandaloneProps> = ({
  patient,
  encounter,
  edit,
  setOpen
}) => {
  const dispatch = useAppDispatch();
  const [localPatient] = useState<ApPatient>({ ...patient });
  const [localEncounter, setLocalEncounter] = useState<ApEncounter>({ ...encounter });

  const { data: painDegreesLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_DEGREE');
  const { data: encounterPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');

  const [bmi, setBmi] = useState('');
  const [bsa, setBsa] = useState('');
  const [vital, setVital] = useState({
    bloodPressureSystolic: 0,
    bloodPressureDiastolic: 0,
    heartRate: 0,
    temperature: 0,
    oxygenSaturation: 0,
    respiratoryRate: 0,
    measurementLkey: '',
    notes: ''
  });

  const [saveObservationSummary] = useSaveObservationSummaryMutation();
  const [saveEncounter] = useSaveEncounterChangesMutation();

  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [readOnly] = useState(false);
  const [painLevel, setPainLevel] = useState({ latestpainlevel: 0 });

  const getTrackColor = (value: number): string => {
    if (value === 0) return 'transparent';
    if (value >= 1 && value <= 3) return '#28a745';
    if (value >= 4 && value <= 7) return 'orange';
    return 'red';
  };

  const [patientLastVisitObservationsListRequest] = useState<ListRequest>({
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

  const { data: getObservationSummaries } = useGetObservationSummariesQuery({
    ...patientLastVisitObservationsListRequest
  });

  const lastObservationSummary =
    getObservationSummaries?.object?.length > 0 ? getObservationSummaries.object[0] : null;

  const lastencounterop =
    getObservationSummaries?.object?.length > 0
      ? getObservationSummaries.object.findLast(
          (item: ApPatientObservationSummary) => item.visitKey === encounter?.key
        )
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
      latestpainlevelLkey: null,
      measurementLkey: null,
      notes: ''
    });

  const { data: patientAgeGroupResponse } = useGetAgeGroupValueQuery(
    { dob: patient?.dob ? new Date(patient.dob).toISOString() : null },
    { skip: !patient?.dob }
  );

  const setPatientObservationSummarySafe = useMemo(
    () => mergeSetter(setPatientObservationSummary),
    []
  );

  // ---------- Initialize last encounter observation ----------
  useEffect(() => {
    if (lastencounterop) setPatientObservationSummary({ ...lastencounterop });
  }, [lastencounterop]);

  // ---------- Sync vitals ----------
  useEffect(() => {
    setVital(prev => ({
      ...prev,
      bloodPressureSystolic: patientObservationSummary.latestbpSystolic || 0,
      bloodPressureDiastolic: patientObservationSummary.latestbpDiastolic || 0,
      heartRate: patientObservationSummary.latestheartrate || 0,
      temperature: patientObservationSummary.latesttemperature || 0,
      oxygenSaturation: patientObservationSummary.latestoxygensaturation || 0,
      respiratoryRate: patientObservationSummary.latestrespiratoryrate || 0,
      measurementLkey: patientObservationSummary.measurementLkey || '',
      notes: patientObservationSummary.notes || ''
    }));
  }, [
    patientObservationSummary.latestbpSystolic,
    patientObservationSummary.latestbpDiastolic,
    patientObservationSummary.latestheartrate,
    patientObservationSummary.latesttemperature,
    patientObservationSummary.latestoxygensaturation,
    patientObservationSummary.latestrespiratoryrate,
    patientObservationSummary.measurementLkey,
    patientObservationSummary.notes
  ]);

  // ---------- Check encounter status ----------
  useEffect(() => {
    setIsEncounterStatusClosed(localEncounter?.encounterStatusLkey === '91109811181900');
  }, [localEncounter?.encounterStatusLkey]);

  // ---------- Calculate BMI & BSA ----------
  useEffect(() => {
    const { latestweight, latestheight } = patientObservationSummary;
    if (latestweight && latestheight) {
      setBmi((latestweight / (latestheight / 100) ** 2).toFixed(2));
      setBsa(Math.sqrt((latestweight * latestheight) / 3600).toFixed(2));
    } else {
      setBmi('');
      setBsa('');
    }
  }, [patientObservationSummary.latestweight, patientObservationSummary.latestheight]);

  // ---------- Sync pain level ----------
  useEffect(() => {
    if (patientObservationSummary?.latestpainlevel != null) {
      setPainLevel({ latestpainlevel: patientObservationSummary.latestpainlevel as number });
    }
  }, [patientObservationSummary.latestpainlevel]);

  // ---------- ===== Methods ===== ----------
  const handleSave = async () => {
    try {
      await saveObservationSummary({
        ...patientObservationSummary,
        visitKey: localEncounter.key,
        patientKey: localPatient.key,
        createdBy: 'Administrator',
        lastDate: new Date() as any,
        latestbmi: bmi as any,
        age: lastObservationSummary?.age,
        latestbpSystolic: vital?.bloodPressureSystolic as any,
        latestbpDiastolic: vital?.bloodPressureDiastolic as any,
        latestheartrate: vital?.heartRate as any,
        latestoxygensaturation: vital?.oxygenSaturation as any,
        latesttemperature: vital?.temperature as any,
        latestrespiratoryrate: vital?.respiratoryRate as any,
        prevRecordKey: lastObservationSummary?.key || null,
        notes: vital.notes,
        measurementLkey: vital.measurementLkey
      }).unwrap();

      if (encounter.chiefComplaint !== localEncounter.chiefComplaint) {
        await saveEncounter(localEncounter).unwrap();
      }
      setOpen(false);
      dispatch(setRefetchPatientSide(true));
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: 'Error occurred while saving', sev: 'error' }));
    }
  };
      // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  // ---------- Render ----------
  return (
    <div className={clsx('basuc-div', { 'disabled-panel': edit })} dir={dir}>
      <Form fluid>
        {/* Save / Clear buttons */}
        <Row className="action-row">
          <Col>
            <MyButton onClick={handleSave}>Save</MyButton>
          </Col>
        </Row>

        <Row>
          {/* LEFT PANEL */}
          <Col md={12}>
            {/* Patient Observations & Complaints */}
            <SectionContainer
              title="Patient Observations & Complaints"
              content={
                <>
                  <Row>
                    <Col md={24}>
                      <MyInput
                        width="100%"
                        fieldName="reasonOfVisit"
                        disabled={isEncounterStatusClosed || readOnly}
                        fieldType="textarea"
                        record={patientObservationSummary}
                        setRecord={setPatientObservationSummarySafe}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col md={24}>
                      <MyInput
                        fieldLabel="Functional Status"
                        width="100%"
                        fieldName="latestFunctionalStatus"
                        disabled={isEncounterStatusClosed || readOnly}
                        fieldType="textarea"
                        record={patientObservationSummary}
                        setRecord={setPatientObservationSummarySafe}
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
                        setRecord={setPatientObservationSummarySafe}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col md={24}>
                      <MyInput
                        width="100%"
                        fieldLabel="Priority"
                        fieldType="select"
                        fieldName="priorityLkey"
                        selectData={encounterPriorityLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={patientObservationSummary}
                        setRecord={setPatientObservationSummary}
                        disabled={isEncounterStatusClosed || readOnly}
                        searchable={false}
                      />
                    </Col>
                  </Row>
                </>
              }
            />

            {/* Vital Signs */}
            <SectionContainer
              title="Vital Signs"
              content={
                <VitalSigns
                  width="28vw"
                  object={vital}
                  setObject={setVital}
                  disabled={false}
                  showNoteField={true}
                />
              }
            />
          </Col>

          {/* RIGHT PANEL */}
          <Col md={12}>
            {/* Body Measurements */}
            <SectionContainer
              title="Body Measurements"
              content={
                <>
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
                        setRecord={setPatientObservationSummarySafe}
                      />
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
                        setRecord={setPatientObservationSummarySafe}
                      />
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
                        setRecord={setPatientObservationSummarySafe}
                      />
                    </Col>
                    <Col md={12}></Col>
                  </Row>
                </>
              }
            />

            {/* Pain Assessment */}
            <SectionContainer
              title="Pain Assessment"
              content={
                <>
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
                        setRecord={setPatientObservationSummarySafe}
                        searchable={false}
                      />
                    </Col>

                    <Col md={12}>
                      <div className="pain-level-container">
                        <MyLabel label={`Pain Level (${painLevel.latestpainlevel}-10)`} />
                        <div className="slider-class" style={{ position: 'relative' }}>
                          <Slider
                            value={painLevel.latestpainlevel}
                            onChange={value => setPainLevel({ latestpainlevel: value as number })}
                            min={0}
                            max={10}
                            step={1}
                            progress
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: '52%',
                              left: 0,
                              height: '7px',
                              width: `${(painLevel.latestpainlevel / 10) * 100}%`,
                              backgroundColor: getTrackColor(painLevel.latestpainlevel),
                              transform: 'translateY(-50%)',
                              zIndex: 1,
                              transition: 'background-color 0.2s ease',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                      </div>
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
                        setRecord={setPatientObservationSummarySafe}
                      />
                    </Col>
                  </Row>
                </>
              }
            />

            {/* Additional Measurements for infants/neonates */}
            {(patientAgeGroupResponse?.object?.valueCode === 'AG_INFANT' ||
              patientAgeGroupResponse?.object?.valueCode === 'AG_NEONATE') && (
              <SectionContainer
                title="Additional Measurements"
                content={
                  <>
                    <Row className="rows-gap">
                      <Col md={24}>
                        <MyInput
                          width="100%"
                          fieldName="latesthearingtest"
                          fieldLabel="Hearing Test"
                          record={patientObservationSummary}
                          disabled={isEncounterStatusClosed || readOnly}
                          setRecord={setPatientObservationSummarySafe}
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
                          setRecord={setPatientObservationSummarySafe}
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
                          setRecord={setPatientObservationSummarySafe}
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
                          setRecord={setPatientObservationSummarySafe}
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
                          setRecord={setPatientObservationSummarySafe}
                        />
                      </Col>
                    </Row>
                  </>
                }
              />
            )}
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default Observations;
