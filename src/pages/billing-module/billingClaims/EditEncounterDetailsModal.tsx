
import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';

import {
    useGetClaimEncounterCopyQuery,
    useUpdateClaimEncounterCopyMutation
} from '@/services/billing/claimEncounterCopyService';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractErrorMessage } from '@/utils';

import MyTab from '@/components/MyTab/MyTab';
import ClaimEncounterDiagnoses from './ClaimEncounterDiagnoses';
import ClaimEncounterProgressNotes from './ClaimEncounterProgressNotes';
import MyButton from '@/components/MyButton/MyButton';
import PatientHistory from './PatientHistory';

const EditEncounterDetailsModal = ({
    open,
    setOpen,
    encounter
}) => {
    const dispatch = useAppDispatch();
    const [record, setRecord] = useState({});

    const {
        data: encounterCopy,
        isLoading,
        isFetching
    } = useGetClaimEncounterCopyQuery(
        { encounterId: encounter?.id },
        {
            skip: !encounter?.id,
            refetchOnMountOrArgChange: true,
            refetchOnFocus: true
        }
    );

    const [updateClaimEncounterCopy, { isLoading: isSaving }] =
        useUpdateClaimEncounterCopyMutation();

    useEffect(() => {
        if (encounterCopy) {
            setRecord(encounterCopy);
        }
    }, [encounterCopy]);

    const handleSave = async () => {
        if (!encounter?.id) return;

        try {
            await updateClaimEncounterCopy({
                encounterId: encounter.id,
                dto: {
                    chiefComplaint: record.chiefComplaint,
                    historyOfPresentIllness: record.historyOfPresentIllness,
                    physicalExamination: record.physicalExamination,
                    assessment: record.assessment,
                    treatmentPlan: record.treatmentPlan,
                    pulse: record.pulse,
                    temperature: record.temperature,
                    respiratoryRate: record.respiratoryRate,
                    oxygenSaturation: record.oxygenSaturation,
                    bloodPressureSystolic: record.bloodPressureSystolic,
                    bloodPressureDiastolic: record.bloodPressureDiastolic,
                    height: record.height,
                    weight: record.weight
                }
            }).unwrap();

            dispatch(
                notify({
                    msg: 'Saved Successfully',
                    sev: 'success'
                })
            );

            setOpen(false);
        } catch (error) {
            const errorMsg = extractErrorMessage(error) || 'Save Failed';

            dispatch(
                notify({
                    msg: errorMsg,
                    sev: 'warning'
                })
            );
        }
    };

    const supportiveInfoContent = () => (
        <Form fluid>
            <Row>
                <Col md={12}>
                    <MyInput
                        fieldName="chiefComplaint"
                        fieldLabel="Chief Complaint"
                        fieldType="textarea"
                        record={record}
                        setRecord={setRecord}
                        width="100%"
                    />
                </Col>
                <Col md={12}>
                    <MyInput
                        fieldName="historyOfPresentIllness"
                        fieldLabel="History Of Present Illness"
                        fieldType="textarea"
                        record={record}
                        setRecord={setRecord}
                        width="100%"
                    />
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <MyInput
                        fieldName="physicalExamination"
                        fieldLabel="Physical Examination"
                        fieldType="textarea"
                        record={record}
                        setRecord={setRecord}
                        width="100%"
                    />
                </Col>
                <Col md={12}>
                    <MyInput
                        fieldName="assessment"
                        fieldLabel="Assessment"
                        fieldType="textarea"
                        record={record}
                        setRecord={setRecord}
                        width="100%"
                    />

                </Col>
            </Row>
            <MyInput
                fieldName="treatmentPlan"
                fieldLabel="Treatment Plan"
                fieldType="textarea"
                record={record}
                setRecord={setRecord}
                width="100%"
            />
            <div className="vital-signs-handle-position-row">
                <MyInput
                    fieldName="pulse"
                    fieldLabel="Pulse"
                    fieldType="number"
                    rightAddon="bpm"
                    rightAddonwidth={45}
                    record={record}
                    setRecord={setRecord}
                    width="10vw"
                />

                <MyInput
                    fieldName="temperature"
                    fieldLabel="Temperature"
                    fieldType="number"
                    rightAddon="C"
                    record={record}
                    setRecord={setRecord}
                    width="10vw"
                    allowDecimal
                />
            </div>

            <div className="vital-signs-handle-position-row">
                <MyInput
                    fieldName="oxygenSaturation"
                    fieldLabel="Oxygen Saturation"
                    fieldType="number"
                    rightAddon="%"
                    record={record}
                    setRecord={setRecord}
                    width="10vw"
                    allowDecimal
                />

                <MyInput
                    fieldName="respiratoryRate"
                    fieldLabel="R.R"
                    fieldType="number"
                    rightAddon="bpm"
                    rightAddonwidth={45}
                    record={record}
                    setRecord={setRecord}
                    width="10vw"
                />
            </div>

            <div className="vital-signs-handle-position-row">
                <MyInput
                    fieldName="bloodPressureSystolic"
                    fieldLabel="Systolic"
                    fieldType="number"
                    record={record}
                    setRecord={setRecord}
                    width="10vw"
                />

                <div className="gap-betwen-blood-pressures">/</div>

                <MyInput
                    fieldName="bloodPressureDiastolic"
                    fieldLabel="Diastolic"
                    fieldType="number"
                    record={record}
                    setRecord={setRecord}
                    width="10vw"
                />
            </div>

            <div className="vital-signs-handle-position-row">
                <MyInput
                    fieldName="height"
                    fieldLabel="Height"
                    fieldType="number"
                    rightAddon="Cm"
                    record={record}
                    setRecord={setRecord}
                    width="10vw"
                    allowDecimal
                />

                <MyInput
                    fieldName="weight"
                    fieldLabel="Weight"
                    fieldType="number"
                    rightAddon="Kg"
                    record={record}
                    setRecord={setRecord}
                    width="10vw"
                    allowDecimal
                />
            </div>

            <MyButton onClick={handleSave}>Save</MyButton>
        </Form>
    );

    const diagnosesContent = () => (
        <ClaimEncounterDiagnoses
            encounter={encounter}
            disabled={false}
        />
    );

    const progressNotesContent = () => (
        <ClaimEncounterProgressNotes
            encounter={encounter}
            claimEncounterCopyId={encounterCopy?.id}
        />
    );

    const conjureFormContent = () => {
        if (isLoading || isFetching) {
            return <div>Loading...</div>;
        }

        return (
            <MyTab
                defaultActiveKey="1"
                appearance="subtle"
                lazy
                data={[
                    {
                        title: 'Supportive Info',
                        content: supportiveInfoContent()
                    },
                    {
                        title: 'Diagnoses',
                        content: diagnosesContent()
                    },
                    {
                        title: 'Progress Notes',
                        content: progressNotesContent()
                    },
                    {
                        title: 'Patient History',
                        content: (
                            <PatientHistory
                                claimEncounterCopyId={encounterCopy?.id}
                                encounterId={encounter?.id}
                            />
                        )
                    }
                ]}
            />
        );
    };

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Edit Encounter"
            content={conjureFormContent}
            actionButtonLabel="Save"
            hideActionBtn
            size="70vw"
        />
    );
};

export default EditEncounterDetailsModal;