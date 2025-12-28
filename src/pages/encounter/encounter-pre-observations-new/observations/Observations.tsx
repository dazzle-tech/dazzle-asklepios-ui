// src/pages/medical-component/observations/Observations.tsx

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import VitalSigns from '@/pages/medical-component/vital-signs/VitalSigns';
import { setRefetchPatientSide } from '@/reducers/refetchPatientSide';
import { useSaveEncounterChangesMutation } from '@/services/encounterService';
import {
  useGetObservationSummariesQuery,
  useSaveObservationSummaryMutation,
  useGenerateNurseSummaryReportMutation
} from '@/services/observationService';
import { useGetAgeGroupValueQuery } from '@/services/patientService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ApEncounter, ApPatient, ApPatientObservationSummary } from '@/types/model-types';
import { newApPatientObservationSummary } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { faChildReaching, faPerson } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Col, Form, Row, Slider } from 'rsuite';
import './styles.less';

export type ObservationsRef = {
  handleSave: () => void;
  handleClear: () => void;
  handleGenerateReport: () => void;
};

type ObservationsProps = {
  patient?: ApPatient;
  encounter?: ApEncounter;
  edit?: boolean;
};
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
const Observations = forwardRef<ObservationsRef, ObservationsProps>((props, ref) => {
  const location = useLocation();
  const state = location.state || {};
  const patient = props.patient || (state.patient as ApPatient);
  const encounter = props.encounter || (state.encounter as ApEncounter);
  const edit = props.edit ?? state.edit;

  const dispatch = useAppDispatch();

  const [localPatient] = useState<ApPatient>({ ...patient });
  const [localEncounter, setLocalEncounter] = useState<ApEncounter>({ ...(encounter as any) });
const setLocalEncounterSafe = useMemo(() => mergeSetter(setLocalEncounter), []);
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
    measurementSiteLkey: '',
    respiratoryRate: 0
  });

const [saveObservationSummary, saveObservationsMutation] = useSaveObservationSummaryMutation();
  const [saveEncounter] = useSaveEncounterChangesMutation();
  const [generateNurseReport] = useGenerateNurseSummaryReportMutation();

  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [readOnly] = useState(false);
 const [painLevel, setPainLevel] = useState({ latestpainlevel: 0 });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

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

  const lastObservationSummary =getObservationSummaries?.object?.length > 0 ? getObservationSummaries.object[0] : null;
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
      latestpainlevelLkey: null
    });

  const { data: patientAgeGroupResponse } = useGetAgeGroupValueQuery(
    {
      dob: patient?.dob ? new Date(patient.dob).toISOString() : null
    },
    { skip: !patient?.dob }
  );
 const setPatientObservationSummarySafe = useMemo(
    () => mergeSetter(setPatientObservationSummary),
    []
  );
  useEffect(() => {
    if (lastencounterop) {
      setPatientObservationSummary({
        ...lastencounterop
      });
    }
  }, [lastencounterop]);

  useEffect(() => {
    setVital(prev => ({
      ...prev,
      bloodPressureSystolic: patientObservationSummary.latestbpSystolic || 0,
      bloodPressureDiastolic: patientObservationSummary.latestbpDiastolic || 0,
      heartRate: patientObservationSummary.latestheartrate || 0,
      temperature: patientObservationSummary.latesttemperature || 0,
      oxygenSaturation: patientObservationSummary.latestoxygensaturation || 0,
      respiratoryRate: patientObservationSummary.latestrespiratoryrate || 0
    }));
 }, [
    patientObservationSummary.latestbpSystolic,
    patientObservationSummary.latestbpDiastolic,
    patientObservationSummary.latestheartrate,
    patientObservationSummary.latesttemperature,
    patientObservationSummary.latestoxygensaturation,
    patientObservationSummary.latestrespiratoryrate
  ]);
  useEffect(() => {
    if (saveObservationsMutation && saveObservationsMutation.status === 'fulfilled') {
      setPatientObservationSummary(saveObservationsMutation.data as ApPatientObservationSummary);
    }
  }, [saveObservationsMutation]);

  useEffect(() => {
    if (localEncounter?.encounterStatusLkey === '91109811181900') {
      setIsEncounterStatusClosed(true);
    }
    else {
      setIsEncounterStatusClosed(false);
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
    }, [patientObservationSummary.latestweight, patientObservationSummary.latestheight]);

  useEffect(() => {
    if (patientObservationSummary?.latestpainlevel != null) {
      setPainLevel({
        latestpainlevel: patientObservationSummary.latestpainlevel as number
      });
    }
  }, [patientObservationSummary.latestpainlevel]);

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
        plastDate: lastObservationSummary?.lastDate || null,
        platesttemperature: lastObservationSummary?.latesttemperature || null,
        platestbpSystolic: lastObservationSummary?.latestbpSystolic || null,
        platestbpDiastolic: lastObservationSummary?.latestbpDiastolic || null,
        platestheartrate: lastObservationSummary?.latestheartrate || null,
        platestrespiratoryrate:
          lastObservationSummary?.latestrespiratoryrate || null,
        platestoxygensaturation:
          lastObservationSummary?.latestoxygensaturation || null,
        platestweight:
          lastObservationSummary?.latestweight ||
          lastObservationSummary?.platestweight,
        platestheight:
          lastObservationSummary?.latestheight ||
          lastObservationSummary?.platestheight,
        platestheadcircumference:
          lastObservationSummary?.latestheadcircumference ||
          lastObservationSummary?.platestheadcircumference,
        platestnotes: lastObservationSummary?.latestnotes || '',
        platestpaindescription:
          lastObservationSummary?.latestpaindescription || '',
        platestpainlevelLkey:
          lastObservationSummary?.latestpainlevelLkey || '',
        platestbmi: lastObservationSummary?.latestbmi,
        page: lastObservationSummary?.age,
        latestpainlevel: painLevel.latestpainlevel as any
      }).unwrap();

      if (encounter.chiefComplaint !== localEncounter.chiefComplaint) {
        await saveEncounter(localEncounter).unwrap();
      }

      dispatch(setRefetchPatientSide(true));
      dispatch(
        notify({ msg: 'Saved Successfully', sev: 'success' })
      );
    } catch (error) {
      console.error('Error while saving observation summary:', error);
      dispatch(
        notify({ msg: 'Error occurred while saving', sev: 'error' })
      );
    }
  };

  const handleClear = () => {
    setPatientObservationSummary({
      ...newApPatientObservationSummary,
      latestpainlevelLkey: null
  } as any);
    setPainLevel({ latestpainlevel: 0 });
    setBmi('');
    setBsa('');
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const blob = await generateNurseReport({
        patient: localPatient,
        encounter: localEncounter
      }).unwrap();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nurse-summary-${localEncounter.key}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        'Error generating nurse summary report:',
        error
      );
      dispatch(
        notify({
          msg: 'Error while generating report',
          sev: 'error'
        })
      );
    } finally {
      setIsGeneratingReport(false);
    }
  };

  useImperativeHandle(ref, () => ({
    handleSave,
    handleClear,
    handleGenerateReport
  }));
 useEffect(() => {
    if (patientObservationSummary?.latestpainlevel != null) {
      setPainLevel({
        latestpainlevel: patientObservationSummary.latestpainlevel as number
      });
    }
  }, [patientObservationSummary]);
  return (
    <div ref={ref as any} className={clsx('basuc-div', { 'disabled-panel': edit })}>
      <Form fluid>
        <Row className="action-row" >
          <Col>
            <MyButton onClick={handleSave}>Save</MyButton>
          </Col>

          <Col>
            <MyButton
              onClick={handleGenerateReport}
              loading={isGeneratingReport}
              disabled={isGeneratingReport}
            >
              Generate Report
            </MyButton>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Row>
              <Col md={24}>
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
                            setRecord={setPatientObservationSummary}
                          />
                        </Col>
                      </Row>

                      <Row>
                        <Col md={24}>
                          <MyInput
                            width="100%"
                            fieldLabel="Priority"
                            fieldType="select"
                            fieldName="encounterPriorityLkey"
                            selectData={encounterPriorityLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={localEncounter}
                            setRecord={setLocalEncounterSafe}
                            disabled={isEncounterStatusClosed || readOnly}
                            searchable={false}
                          />
                        </Col>
                      </Row>
                    </>
                  }
                />
              </Col>
            </Row>

            <Row>
              <Col md={24}>
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
            </Row>
          </Col>

          {/* RIGHT SIDE PANELS — NO CHANGES */}

          <Col md={12}>
            <Row>
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
            </Row>

            <Row>
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
                               onChange={value =>
                                setPainLevel({ latestpainlevel: value as number })
                              }
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
            </Row>

            {(patientAgeGroupResponse?.object?.valueCode === 'AG_INFANT' ||
              patientAgeGroupResponse?.object?.valueCode === 'AG_NEONATE') && (
              <Row>
                <Col md={24}>
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
                              setRecord={setPatientObservationSummarySafe}
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
                             setRecord={setPatientObservationSummarySafe}
                            />
                          </Col>
                        </Row>
                      </>
                    }
                  />
                </Col>
              </Row>
            )}

            {patientAgeGroupResponse?.object?.valueCode === 'AG_GER' && (
              <Row>
                <Col md={24}>
                  <SectionContainer
                    title="Additional Measurements"
                    content={
                      <>
                        <Row>
                          <Col md={24}>
                            <MyInput
                              width="100%"
                              fieldType="checkbox"
                              fieldLabel="Full Risk"
                              fieldName="latestFallRisk"
                              record={patientObservationSummary}
                              disabled={isEncounterStatusClosed || readOnly}
                             setRecord={setPatientObservationSummarySafe}
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
                             setRecord={setPatientObservationSummarySafe}
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
                             setRecord={setPatientObservationSummarySafe}
                            />
                          </Col>
                        </Row>
                      </>
                    }
                  />
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
