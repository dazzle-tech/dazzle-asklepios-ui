import React, { useEffect, useState } from 'react';
import PatientSide from '../../encounter-main-info-section/PatienSide';
import { useLocation } from 'react-router-dom';
import '../styles.less';
import BackButton from '@/components/BackButton/BackButton';
import { useNavigate } from 'react-router-dom';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { Row, Col, Form, Divider, Panel } from 'rsuite';
import GeneralAssessmentTriage from './component/GeneralAssessmentTriage';
import ChiefComplainTriage from './component/ChiefComplainTriage';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetLatestEmergencyTriageByEncounterQuery } from '@/services/encounters/er-triage/emergencyTriageService';
import VitalSignsTriage from './VitalSignsTriage';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyLabel from '@/components/MyLabel';
import { ApEncounter } from '@/types/model-types';

const ViewTriage = () => {
    const location = useLocation();
    const propsData = location.state;
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [isHiddenFields, setIsHiddenFields] = useState(false);
    const [emergencyTriage, setEmergencyTriage] = useState<any>({});
    const [refetchPatientObservations, setRefetchPatientObservations] = useState(false);
    const [encounter, setEncounter] = useState<ApEncounter>({ ...propsData.encounter });
    const YES_KEY = 'YES';
    const NO_KEY = 'NO';
    
    // Fetch LOV data for various fields
    const { data: sizeLovQueryResponse } = useGetLovValuesByCodeQuery('SIZE');
    const painLevelEnumOptions = useEnumOptions('PainLevel');
    const avpuScaleEnumOptions = useEnumOptions('AVPUScale');
    const emergencyLevelEnumOptions = useEnumOptions('EmergencyLevel');
    const yesNoQuestionEnumOptions = useEnumOptions('YesNoQuestion');

    const isYes = (v: any) => String(v ?? '').toUpperCase().startsWith('Y');
    const isNo = (v: any) => String(v ?? '').toUpperCase().startsWith('N');

    const emergencyLevelColorMap = React.useMemo(() => {
      const byValue: Record<string, string> = {
        RESUSCITATION: '#7f1d1d',
        EMERGENT: '#dc2626',
        URGENT: '#f97316',
        LESS_URGENT: '#eab308',
        NON_URGENT: '#16a34a',
      };
      const palette = ['#dc2626', '#f97316', '#eab308', '#16a34a', '#0ea5e9', '#7c3aed'];
      const m = new Map<string, string>();
      emergencyLevelEnumOptions.forEach((opt, idx) => {
        if (opt?.value == null) return;
        const key = String(opt.value);
        const mapped = byValue[String(opt.value).toUpperCase()];
        m.set(key, mapped ?? palette[idx % palette.length]);
      });
      return m;
    }, [emergencyLevelEnumOptions]);

    const selectedEmergencyLevel = emergencyLevelEnumOptions.find(
      (item: any) => item.value === emergencyTriage?.emergencyLevel
    );

    const encounterId = Number(propsData?.encounter?.id ?? propsData?.encounter?.key);
    const { data: emergencyTriageNew } = useGetLatestEmergencyTriageByEncounterQuery(encounterId, {
      skip: !encounterId || Number.isNaN(encounterId)
    });

    // Header setup
    const divContent = "ER View Triage";
    
    useEffect(() => {
      if (emergencyTriageNew?.id) {
        setEmergencyTriage((prev: any) => ({ ...prev, ...emergencyTriageNew }));
      }
    }, [emergencyTriageNew]);

    useEffect(() => {
      // Controls whether the "required services" section is visible in view mode.
      // If any of the prerequisite answers are missing, keep it hidden.
      if (
        emergencyTriage?.lifeSaving == null ||
        emergencyTriage?.unresponsive == null ||
        emergencyTriage?.highRisk == null ||
        emergencyTriage?.avpuScale == null ||
        emergencyTriage?.painScore == null
      ) {
        setIsHiddenFields(false);
        return;
      }

      const criticalPainKeys = ['LEVEL_7', 'LEVEL_8', 'LEVEL_9', 'LEVEL_10'];
      const qualifiesForServices =
        !isYes(emergencyTriage.highRisk) &&
        String(emergencyTriage.avpuScale) !== 'UNRESPONSIVE' &&
        !criticalPainKeys.includes(String(emergencyTriage.painScore));

      setIsHiddenFields(qualifiesForServices);
    }, [
      emergencyTriage.lifeSaving,
      emergencyTriage.unresponsive,
      emergencyTriage.highRisk,
      emergencyTriage.avpuScale,
      emergencyTriage.painScore
    ]);

    useEffect(() => {
        if (propsData?.encounter) {
            setEncounter({ ...propsData.encounter });
        }
    }, [propsData?.encounter]);

    useEffect(() => {
        dispatch(setPageCode('ER_View_Triage'));
        dispatch(setDivContent(divContent));

        return () => {
            dispatch(setPageCode(''));
            dispatch(setDivContent('  '));
        };
    }, [dispatch]);

      const handleGoBack = () => {
        if (propsData?.from === 'ER_Triage') {
            navigate('/ER-triage');
        } else if (propsData?.from === 'ER_Waiting_List') {
            navigate(-1); 
        } else {
            navigate(-1);
        }
    };


    return (
        <div className="er-main-container">
            <div className="left-box">
                <div className='bt-field-div'>
                    <BackButton onClick={handleGoBack} />
                    <div className='bt-right'>
                        <Form fluid layout="inline">
                            <MyLabel label="Emergency Level" />
                            {emergencyTriage?.emergencyLevel && (
                                <MyBadgeStatus
                                    color={emergencyLevelColorMap.get(String(emergencyTriage?.emergencyLevel)) ?? '#98A2B4'}
                                    contant={selectedEmergencyLevel?.label ?? emergencyTriage?.emergencyLevel}
                                />
                            )}
                        </Form>
                    </div>
                </div>
                
                <Row gutter={30}><Divider /></Row>
                
                <Row gutter={30}>
                    <Panel header="Emergency Level Assessment">
                        <Form fluid layout="inline">
                            <MyInput
                                column
                                width={200}
                                fieldLabel="Life-saving Interventions Required?"
                                fieldType="select"
                                fieldName="lifeSaving"
                                selectData={yesNoQuestionEnumOptions}
                                selectDataLabel="label"
                                selectDataValue="value"
                                record={emergencyTriage}
                                setRecord={setEmergencyTriage}
                                searchable={false}
                                disabled={true}
                            />
                        </Form>
                        
                        {isNo(emergencyTriage.lifeSaving) && (
                            <Form fluid layout="inline">
                                <MyInput
                                    column
                                    width={200}
                                    fieldLabel="Is the patient unresponsive or acutely mentally altered?"
                                    fieldType="select"
                                    fieldName="unresponsive"
                                    selectData={yesNoQuestionEnumOptions}
                                    selectDataLabel="label"
                                    selectDataValue="value"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    searchable={false}
                                    disabled={true}
                                />
                            </Form>
                        )}
                        
                        {isNo(emergencyTriage.lifeSaving) && isNo(emergencyTriage.unresponsive) && (
                            <Form fluid layout="inline">
                                <MyInput
                                    column
                                    width={200}
                                    fieldLabel="High-risk situation?"
                                    fieldType="select"
                                    fieldName="highRisk"
                                    selectData={yesNoQuestionEnumOptions}
                                    selectDataLabel="label"
                                    selectDataValue="value"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    searchable={false}
                                    disabled={true}
                                />
                                <MyInput
                                    column
                                    width={200}
                                    fieldLabel="AVPU Scale"
                                    fieldType="select"
                                    fieldName="avpuScale"
                                    selectData={avpuScaleEnumOptions}
                                    selectDataLabel="label"
                                    selectDataValue="value"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    searchable={false}
                                    disabled={true}
                                />
                                <MyInput
                                    column
                                    width={200}
                                    fieldLabel="Pain Score"
                                    fieldType="select"
                                    fieldName="painScore"
                                    selectData={painLevelEnumOptions}
                                    selectDataLabel="label"
                                    selectDataValue="value"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    searchable={false}
                                    disabled={true}
                                />
                            </Form>
                        )}

                        {isNo(emergencyTriage.lifeSaving) && 
                         isNo(emergencyTriage.unresponsive) &&
                         isHiddenFields && (
                            <Form fluid layout="inline">
                                <MyInput
                                    column
                                    width={200}
                                    fieldLabel="Labs Required"
                                    fieldType="select"
                                    fieldName="labsRequired"
                                    selectData={yesNoQuestionEnumOptions}
                                    selectDataLabel="label"
                                    selectDataValue="value"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    searchable={false}
                                    disabled={true}
                                />
                                <MyInput
                                    column
                                    width={200}
                                    fieldLabel="Imaging Required"
                                    fieldType="select"
                                    fieldName="imagingRequired"
                                    selectData={yesNoQuestionEnumOptions}
                                    selectDataLabel="label"
                                    selectDataValue="value"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    searchable={false}
                                    disabled={true}
                                />
                                <MyInput
                                    column
                                    width={200}
                                    fieldLabel="IV Fluids Required"
                                    fieldType="select"
                                    fieldName="ivFluidsRequired"
                                    selectData={yesNoQuestionEnumOptions}
                                    selectDataLabel="label"
                                    selectDataValue="value"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    searchable={false}
                                    disabled={true}
                                />
                                <MyInput
                                    column
                                    width={200}
                                    fieldLabel="Medication Required"
                                    fieldType="select"
                                    fieldName="medicationRequired"
                                    selectData={yesNoQuestionEnumOptions}
                                    selectDataLabel="label"
                                    selectDataValue="value"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    searchable={false}
                                    disabled={true}
                                />
                                <MyInput
                                    column
                                    width={200}
                                    fieldLabel="ECG Required"
                                    fieldType="select"
                                    fieldName="ecgRequired"
                                    selectData={yesNoQuestionEnumOptions}
                                    selectDataLabel="label"
                                    selectDataValue="value"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    searchable={false}
                                    disabled={true}
                                />
                                <MyInput
                                    column
                                    width={200}
                                    fieldLabel="Consultation Required"
                                    fieldType="select"
                                    fieldName="consultationRequired"
                                    selectData={yesNoQuestionEnumOptions}
                                    selectDataLabel="label"
                                    selectDataValue="value"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    searchable={false}
                                    disabled={true}
                                />
                            </Form>
                        )}
                    </Panel>
                </Row>
                
                <Row gutter={30}>
                    <VitalSignsTriage 
                        patient={propsData.patient} 
                        encounter={propsData.encounter} 
                        setRefetchPatientObservations={setRefetchPatientObservations} 
                        readOnly={true} 
                    />
                </Row>
                
                <Row gutter={30}>
                    <GeneralAssessmentTriage 
                        patient={propsData.patient} 
                        encounter={propsData.encounter} 
                        readOnly={true} 
                    />
                </Row>
                
                <Row gutter={30}><Divider /></Row>
                
                <Row gutter={30}>
                    <Col md={12}>
                        <Row gutter={30}>
                            <Translate><h6>Right Eye</h6></Translate>
                        </Row>
                        <Row gutter={30}>
                            <Form fluid layout='inline'>
                                <MyInput
                                    width={200}
                                    column
                                    fieldLabel="Reacting to light"
                                    fieldType="checkbox"
                                    fieldName="rightEyeLightResponse"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    disabled={true}
                                />
                                <MyInput
                                    column
                                    width={200}
                                    fieldLabel="Pupil Size"
                                    fieldType="select"
                                    fieldName="rightEyePupilSize"
                                    selectData={sizeLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    searchable={false}
                                    disabled={true}
                                />
                            </Form>
                        </Row>
                    </Col>
                    <Col md={12}>
                        <Row gutter={30}>
                            <Translate><h6>Left Eye</h6></Translate>
                        </Row>
                        <Row gutter={30}>
                            <Form fluid layout='inline'>
                                <MyInput
                                    width={200}
                                    column
                                    fieldLabel="Reacting to light"
                                    fieldType="checkbox"
                                    fieldName="leftEyeLightResponse"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    disabled={true}
                                />
                                <MyInput
                                    column
                                    width={200}
                                    fieldLabel="Pupil Size"
                                    fieldType="select"
                                    fieldName="leftEyePupilSize"
                                    selectData={sizeLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    searchable={false}
                                    disabled={true}
                                />
                            </Form>
                        </Row>
                    </Col>
                </Row>
                
                <Row gutter={30}><Divider /></Row>
                
                <Row gutter={30}>
                    <ChiefComplainTriage 
                        patient={propsData.patient} 
                        encounter={propsData.encounter} 
                        readOnly={true} 
                    />
                </Row>
                
                <Row gutter={30}><Divider /></Row>
                
                <Row gutter={30}>
                    <Form fluid layout='inline' className='form-inline-wrap bt-div'>
                        <MyInput
                            column
                            fieldType="textarea"
                            record={emergencyTriage}
                            setRecord={setEmergencyTriage}
                            fieldLabel="History of Present Illness"
                            fieldName="historyOfPresentIllness"
                            width={400}
                            disabled={true}
                        />
                        <MyInput
                            column
                            fieldType="textarea"
                            record={emergencyTriage}
                            setRecord={setEmergencyTriage}
                            fieldLabel="Additional Notes"
                            fieldName="hpiAdditionalNotes"
                            width={400}
                            disabled={true}
                        />
                        {propsData?.patient?.genderLvalue?.valueCode === "F" && (
                            <MyInput
                                width={150}
                                column
                                fieldLabel="Pregnancy"
                                fieldType="checkbox"
                                fieldName="isPregnancy"
                                record={emergencyTriage}
                                setRecord={setEmergencyTriage}
                                disabled={true}
                            />
                        )}
                    </Form>
                </Row>
            </div>
            
            <div className="right-box">
                <PatientSide 
                    patient={propsData.patient} 
                    encounter={propsData.encounter} 
                    refetchList={refetchPatientObservations} 
                />
            </div>
        </div>
    );
};

export default ViewTriage;