import BackButton from "@/components/BackButton/BackButton";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import Translate from "@/components/Translate";
import { faCheckDouble, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { Col, Divider, Form, Panel, Row } from "rsuite";
import GeneralAssessmentTriage from "./GeneralAssessmentTriage";
import SectionContainer from "@/components/SectionsoContainer";
import ChiefComplainTriage from "./ChiefComplainTriage";
import { useCompleteEncounterMutation, useGetEmergencyTriagesListQuery, useSaveEmergencyTriagesMutation } from "@/services/encounterService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { newApEmergencyTriage } from "@/types/model-types-constructor";
import { initialListRequest, ListRequest } from "@/types/types";
import MyLabel from "@/components/MyLabel";
import MyBadgeStatus from "@/components/MyBadgeStatus/MyBadgeStatus";
import VitalSignsTriage from "./VitalSignsTriage";
import { notify } from "@/utils/uiReducerActions";
import SendToModal from "./SendToModal";

const StartTriage = ({ patient, encounter ,sourcePage}) => {
    const authSlice = useAppSelector(state => state.auth);

    const navigate = useNavigate();
    const [completeEncounter, completeEncounterMutation] = useCompleteEncounterMutation();
    const [saveTriage, saveTriageMutation] = useSaveEmergencyTriagesMutation();
    const dispatch = useAppDispatch();
    const [isHiddenFields, setIsHiddenFields] = useState(false);
    const [emergencyTriage, setEmergencyTriage] = useState<any>({ ...newApEmergencyTriage });
    const [refetchPatientObservations, setRefetchPatientObservations] = useState(false);
    const [openSendToModal, setOpenSendToModal] = useState(false);
    const [patientPriority, setPatientPriority] = useState({ key: '' });
    const YES_KEY = '1476229927081534';
    const NO_KEY = '1476240934233400';
    // Initialize list request with default filters
    const [triageListRequest, setTriageListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            },
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
            },
            {
                fieldName: 'encounter_key',
                operator: 'match',
                value: encounter?.key
            }
        ]
    });


    const {
        data: triageResponse,
        refetch,
        isLoading
    } = useGetEmergencyTriagesListQuery(triageListRequest);
    // Fetch LOV data for various fields
    const { data: sizeLovQueryResponse } = useGetLovValuesByCodeQuery('SIZE');
    const { data: booleanLovQuery } = useGetLovValuesByCodeQuery('BOOLEAN');
    const { data: painScoreLovQuery } = useGetLovValuesByCodeQuery('NUMBERS');
    const { data: levelOfConscLovQuery } = useGetLovValuesByCodeQuery('LEVEL_OF_CONSC');
    const { data: emergencyLevelLovQuery } = useGetLovValuesByCodeQuery('EMERGENCY_LEVEL');
    const { data: patientPriorityLov } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
    // Find the selected emergency level object from the list based on the selected key
    const selectedEmergencyLevel = (emergencyLevelLovQuery?.object ?? []).find(
        item => item.key === emergencyTriage?.emergencyLevelLkey
    );

    useEffect(() => {
        if (saveTriageMutation && saveTriageMutation.status === 'fulfilled') {
            setEmergencyTriage(saveTriageMutation.data);
            //   setEncounter({ ...encounter, emergencyLevelLkey: emergencyTriage?.emergencyLevelLkey });
        }
    }, [saveTriageMutation]);
    useEffect(() => {
        if (triageResponse?.object?.length === 1) {
            setEmergencyTriage(triageResponse.object[0]);
        }
    }, [triageResponse]);
    useEffect(() => {
        let newLevel = null;
        const YES_KEY = '1476229927081534';
        const criticalPainKeys = [
            '3108900351014435',
            '3108904932420860',
            '3108911826984089',
            '3108917698391821'
        ];

        if (
            emergencyTriage.lifeSavingLkey === YES_KEY ||
            emergencyTriage.unresponsiveLkey === YES_KEY
        ) {
            newLevel = '6859764100147954'; // critical
        } else if (
            emergencyTriage.highRiskLkey === YES_KEY ||
            emergencyTriage.avpuScaleLkey === '6044173055578557' ||
            (emergencyTriage.painScoreLkey && criticalPainKeys.includes(emergencyTriage.painScoreLkey))
        ) {
            newLevel = '6859787815891749'; // serious
        } else if (
            emergencyTriage.highRiskLkey != null &&
            emergencyTriage.avpuScaleLkey != null &&
            emergencyTriage.painScoreLkey != null &&
            emergencyTriage.highRiskLkey !== YES_KEY &&
            emergencyTriage.avpuScaleLkey !== '6044173055578557' &&
            !['3108900351014435', '3108904932420860', '3108911826984089', '3108917698391821'].includes(
                emergencyTriage.painScoreLkey
            )
        ) {
            setIsHiddenFields(true);
            const YES_KEY = '1476229927081534';

            const selectedServices = [
                emergencyTriage.labsLkey,
                emergencyTriage.imagingLkey,
                emergencyTriage.ivFluidsLkey,
                emergencyTriage.medicationLkey,
                emergencyTriage.ecgLkey,
                emergencyTriage.consultationLkey
            ];

            const count = selectedServices.filter(value => value === YES_KEY).length;
            if (count >= 2) {
                newLevel = '6859815212595414'; // high
            } else if (count === 1) {
                newLevel = '6859834949140744'; // medium
            } else {
                newLevel = '6859862840597358'; // low
            }
        }

        if (newLevel && newLevel !== emergencyTriage.emergencyLevelLkey) {
            setEmergencyTriage(prev => ({ ...prev, emergencyLevelLkey: newLevel }));
        }
    }, [
        emergencyTriage.lifeSavingLkey,
        emergencyTriage.unresponsiveLkey,
        emergencyTriage.highRiskLkey,
        emergencyTriage.avpuScaleLkey,
        emergencyTriage.painScoreLkey,
        emergencyTriage.labsLkey,
        emergencyTriage.imagingLkey,
        emergencyTriage.ivFluidsLkey,
        emergencyTriage.medicationLkey,
        emergencyTriage.ecgLkey,
        emergencyTriage.consultationLkey
    ]);
    // useEffect(() => {
    //   setEncounter({ ...propsData?.encounter });
    // }, [propsData]);
    const handleCompleteEncounter = async () => {
        try {
            await completeEncounter(encounter).unwrap();
            dispatch(notify({ msg: 'Completed Successfully', sev: 'success' }));
        } catch (error) {
            console.error('Encounter completion error:', error);
            dispatch(notify({ msg: 'An error occurred while completing the encounter', sev: 'error' }));
        }
    };
    // handle Save Triage Function
    const handleSave = async () => {
        //  TODO convert key to code
        try {
            if (emergencyTriage.key === undefined) {
                await saveTriage({
                    ...emergencyTriage,
                    patientKey: patient?.key,
                    encounterKey: encounter?.key,
                    createdBy: authSlice.user.key
                }).unwrap();
                refetch();
                dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
            } else {
                await saveTriage({
                    ...emergencyTriage,
                    patientKey: patient?.key,
                    encounterKey: encounter?.key,
                    updatedBy: authSlice.user.key
                }).unwrap();
                dispatch(notify({ msg: ' Updated Successfully', sev: 'success' }));
                refetch();
            }
        } catch (error) {
            console.error('Error saving ', error);
            dispatch(notify({ msg: 'Failed to Save ', sev: 'error' }));
        }
    };

    return <div>
    
            <div className="bt-field-div">
             { sourcePage==="Emergency"&&( <> <BackButton
                    onClick={() => {
                        navigate('/ER-triage');
                    }}
                />
                <MyButton
                    prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                    onClick={handleCompleteEncounter}
                    appearance="ghost"
                >
                    <Translate> Complete Visit </Translate>
                </MyButton>
                <MyButton
                    prefixIcon={() => <FontAwesomeIcon icon={faPaperPlane} />}
                    onClick={() => {
                        setOpenSendToModal(true);
                    }}
                    disabled={!emergencyTriage?.emergencyLevelLkey || !encounter?.emergencyLevelLkey}
                >
                    <Translate> Send to </Translate>
                </MyButton></>)}
                <div className="bt-right">
                    <Form fluid className="patient-priority-er-level-handle-position">
                        <MyInput
                            width={200}
                            fieldType="select"
                            fieldLabel="Patient Priority"
                            fieldName="key"
                            selectData={patientPriorityLov?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={patientPriority}
                            setRecord={setPatientPriority}
                        />
                        <MyLabel label="Emergency Level" />
                        {emergencyTriage?.emergencyLevelLkey && (
                            <MyBadgeStatus
                                color={selectedEmergencyLevel?.valueColor}
                                contant={
                                    selectedEmergencyLevel?.lovDisplayVale ?? emergencyTriage?.emergencyLevelLkey
                                }
                            />
                        )}
                    </Form>
                </div>{' '}
            </div>
            <Row gutter={30}>
                <Divider />
            </Row>
            <Row gutter={30}>
                <Panel header="Emergency Level Assessment">
                    <Form fluid layout="inline">
                        <MyInput
                            column
                            width={200}
                            fieldLabel="Life-saving Interventions Required?"
                            fieldType="select"
                            fieldName="lifeSavingLkey"
                            selectData={booleanLovQuery?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={emergencyTriage}
                            setRecord={setEmergencyTriage}
                            searchable={false}
                        />
                    </Form>
                    <Form fluid layout="inline">
                        {emergencyTriage.lifeSavingLkey === NO_KEY && (
                            <Form fluid layout="inline">
                                <MyInput
                                    column
                                    width={200}
                                    fieldLabel="Is the patient unresponsive or acutely mentally altered?"
                                    fieldType="select"
                                    fieldName="unresponsiveLkey"
                                    selectData={booleanLovQuery?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    searchable={false}
                                />
                            </Form>
                        )}

                        {emergencyTriage.lifeSavingLkey === NO_KEY &&
                            emergencyTriage.unresponsiveLkey === NO_KEY && (
                                <Form fluid layout="inline">
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLabel="High-risk situation?"
                                        fieldType="select"
                                        fieldName="highRiskLkey"
                                        selectData={booleanLovQuery?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        record={emergencyTriage}
                                        setRecord={setEmergencyTriage}
                                        searchable={false}
                                    />

                                    <MyInput
                                        column
                                        width={200}
                                        fieldLabel="AVPU Scale"
                                        fieldType="select"
                                        fieldName="avpuScaleLkey"
                                        selectData={levelOfConscLovQuery?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        record={emergencyTriage}
                                        setRecord={setEmergencyTriage}
                                        searchable={false}
                                    />

                                    <MyInput
                                        column
                                        width={200}
                                        fieldLabel="Pain Score"
                                        fieldType="select"
                                        fieldName="painScoreLkey"
                                        selectData={painScoreLovQuery?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        record={emergencyTriage}
                                        setRecord={setEmergencyTriage}
                                        searchable={false}
                                    />
                                </Form>
                            )}

                        {emergencyTriage.lifeSavingLkey === NO_KEY &&
                            emergencyTriage.unresponsiveLkey === NO_KEY &&
                            isHiddenFields && (
                                <Form fluid layout="inline">
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLabel="Labs Required"
                                        fieldType="select"
                                        fieldName="labsLkey"
                                        selectData={booleanLovQuery?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        record={emergencyTriage}
                                        setRecord={setEmergencyTriage}
                                        searchable={false}
                                    />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLabel="Imaging Required"
                                        fieldType="select"
                                        fieldName="imagingLkey"
                                        selectData={booleanLovQuery?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        record={emergencyTriage}
                                        setRecord={setEmergencyTriage}
                                        searchable={false}
                                    />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLabel="IV Fluids Required"
                                        fieldType="select"
                                        fieldName="ivFluidsLkey"
                                        selectData={booleanLovQuery?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        record={emergencyTriage}
                                        setRecord={setEmergencyTriage}
                                        searchable={false}
                                    />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLabel="Medication Required"
                                        fieldType="select"
                                        fieldName="medicationLkey"
                                        selectData={booleanLovQuery?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        record={emergencyTriage}
                                        setRecord={setEmergencyTriage}
                                        searchable={false}
                                    />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLabel="ECG Required"
                                        fieldType="select"
                                        fieldName="ecgLkey"
                                        selectData={booleanLovQuery?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        record={emergencyTriage}
                                        setRecord={setEmergencyTriage}
                                        searchable={false}
                                    />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLabel="Consultation Required"
                                        fieldType="select"
                                        fieldName="consultationLkey"
                                        selectData={booleanLovQuery?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        record={emergencyTriage}
                                        setRecord={setEmergencyTriage}
                                        searchable={false}
                                    />
                                </Form>
                            )}
                        <div className="button-right">
                            <MyButton
                                prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                                className="button-bottom-align"
                                onClick={handleSave}
                            >
                                <Translate>Save</Translate>
                            </MyButton>
                        </div>
                    </Form>
                </Panel>
            </Row>
            <Row gutter={30}>
                <VitalSignsTriage
                    patient={patient}
                    encounter={encounter}
                    setRefetchPatientObservations={setRefetchPatientObservations}
                />
            </Row>
            <Row gutter={30}>
                <GeneralAssessmentTriage patient={patient} encounter={encounter} />
            </Row>
            <Row>
                <Col md={12}>
                    <SectionContainer
                        title="Right Eye"
                        content={
                            <Form fluid layout="inline">
                                <MyInput
                                    width={200}
                                    column
                                    fieldLabel="Reacting to light"
                                    fieldType="checkbox"
                                    fieldName="rightEyeLightResponse"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                />
                                <MyInput
                                    column
                                    width={200}
                                    fieldLabel="Pupil Size"
                                    fieldType="select"
                                    fieldName="rightEyePupilSizeLkey"
                                    selectData={sizeLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    searchable={false}
                                />
                            </Form>
                        }
                    />
                </Col>
                <Col md={12}>
                    <SectionContainer
                        title="Left Eye"
                        content={
                            <Form fluid layout="inline">
                                <MyInput
                                    width={200}
                                    column
                                    fieldLabel="Reacting to light"
                                    fieldType="checkbox"
                                    fieldName="leftEyeLightResponse"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                />
                                <MyInput
                                    column
                                    width={200}
                                    fieldLabel="Pupil Size"
                                    fieldType="select"
                                    fieldName="leftEyePupilSizeLkey"
                                    selectData={sizeLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    searchable={false}
                                />
                            </Form>
                        }
                    />
                </Col>
            </Row>
            <Row>
                <Col md={12}>
                    <ChiefComplainTriage patient={patient} encounter={encounter} />
                </Col>
                <Col md={12}>
                    <SectionContainer
                        title="HPI"
                        content={
                            <Form fluid layout="inline" className="form-inline-wrap bt-div">
                                <MyInput
                                    column
                                    fieldType="textarea"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    fieldLabel="History of Present Illness"
                                    fieldName="historyOfPresentIllness"
                                    width={400}
                                />
                                <MyInput
                                    column
                                    fieldType="textarea"
                                    record={emergencyTriage}
                                    setRecord={setEmergencyTriage}
                                    fieldLabel="Additional Notes"
                                    fieldName="additionalNotes"
                                    width={400}
                                />
                                {patient?.genderLvalue?.valueCode === 'F' && (
                                    <MyInput
                                        width={150}
                                        column
                                        fieldLabel="Pregnancy"
                                        fieldType="checkbox"
                                        fieldName="isPregnancy"
                                        record={emergencyTriage}
                                        setRecord={setEmergencyTriage}
                                    />
                                )}
                                <MyButton
                                    prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                                    className="button-bottom-align"
                                    onClick={handleSave}
                                >
                                    <Translate> Save </Translate>
                                </MyButton>
                            </Form>
                        }
                    />
                </Col>
            </Row>
       
        <SendToModal
            open={openSendToModal}
            setOpen={setOpenSendToModal}
            encounter={encounter}
            triage={emergencyTriage}
        />
    </div>;
}
export default StartTriage;