import React, { useState } from 'react';
import { Panel } from 'rsuite';
import { Col, Divider, Row, Form, Text } from 'rsuite';
import './styles.less';
import VitalSigns from '@/pages/medical-component/vital-signs/VitalSigns';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import GenericAdministeredMedications from "@/pages/encounter/encounter-component/procedure/Post-ProcedureCare/AdministeredMedications ";
import { ApPreOperationAssessment } from '@/types/model-types';
import { newApPreOperationAdministeredMedications, newApPreOperationAssessment } from '@/types/model-types-constructor';
import { useGetPreOperationMedicationsListQuery, useSavePreOperationMedicationsMutation } from '@/services/encounterService';
const PreOperationAssessment = () => {
    const [preOperationAssessment, setPreOperationAssessment] = useState<ApPreOperationAssessment>({ ...newApPreOperationAssessment });

    const [vital, setVital] = useState({
        bloodPressureSystolic: 0,
        bloodPressureDiastolic: 0,
        heartRate: 0,
        temperature: 0,
        oxygenSaturation: 0,
    });
    // Fetch LOV data for various fields
    const { data: scoreLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
    const { data: ASALovQueryResponse } = useGetLovValuesByCodeQuery('ASA_SCORE');

    return (
        <Panel>
            <Form fluid  layout='inline'>
                <Row className='pre-operation-container'>
                    <Col md={12}>
                        <Row>
                            <div className='container-form'>
                                <div className='title-div'>
                                    <Text>Pre-Operation Assessment</Text>
                                </div>
                                <Divider />
                                <Form fluid layout='inline'  >
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLable="NPO Status Confirmed"
                                        fieldName="nopStatusConfirmed"
                                        fieldType="checkbox"
                                        record={preOperationAssessment}
                                        setRecord={setPreOperationAssessment} />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLabel="Score"
                                        fieldType="select"
                                        fieldName="painScoreLkey"
                                        selectData={scoreLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        record={preOperationAssessment}
                                        setRecord={setPreOperationAssessment} />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLable="Allergies Reviewed"
                                        fieldName="allergiesReviewed"
                                        fieldType="checkbox"
                                        record={preOperationAssessment}
                                        setRecord={setPreOperationAssessment} />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLable="Consent for Procedure Signed"
                                        fieldName="consentForProcedureSigned"
                                        fieldType="checkbox"
                                        record={preOperationAssessment}
                                        setRecord={setPreOperationAssessment} />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLable="Consent for Anesthesia Signed"
                                        fieldName="consentForAnesthesiaSigned"
                                        fieldType="checkbox"
                                        record={preOperationAssessment}
                                        setRecord={setPreOperationAssessment} />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLable="IV Access Status"
                                        fieldName="ivAccessStatus"
                                        fieldType="checkbox"
                                        record={preOperationAssessment}
                                        setRecord={setPreOperationAssessment}
                                        unCheckedLabel="Inserted Blue"
                                        checkedLabel="Not inserted Grey" />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLable="Site Marked by Surgeon"
                                        fieldName="siteMarkedBySurgeon"
                                        fieldType="checkbox"
                                        record={preOperationAssessment}
                                        setRecord={setPreOperationAssessment} />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLable="Lab/Imaging Reviewed"
                                        fieldName="labImagingReviewed"
                                        fieldType="checkbox"
                                        record={preOperationAssessment}
                                        setRecord={setPreOperationAssessment} />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLable="Anesthetist Assessment Done"
                                        fieldName="anesthetistAssessmentDone"
                                        fieldType="checkbox"
                                        record={preOperationAssessment}
                                        setRecord={setPreOperationAssessment} />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLabel="ASA Classification"
                                        fieldType="select"
                                        fieldName="asaClassificationLkey"
                                        selectData={ASALovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        record={preOperationAssessment}
                                        setRecord={setPreOperationAssessment} />
                                </Form>
                            </div>
                        </Row>
                    </Col>
                    <Col md={12}>
                        <Row>
                            <div className='container-form'>
                                <div className='title-div'>
                                    <Text>Vitals on Admission</Text>
                                </div>
                                <Divider />
                                <VitalSigns object={vital} setObject={setVital} />
                            </div>
                        </Row>
                        <Row>
                            <div className='container-form'>
                                <div className='title-div'>
                                    <Text>Pre-Medication Given</Text>
                                </div>
                                <Divider />
                                <GenericAdministeredMedications
                                    title="Induction Medications"
                                    parentKey={"operation?.key"}
                                    filterFieldName="operationRequestKey"
                                    medicationService={{
                                        useGetQuery: useGetPreOperationMedicationsListQuery,
                                        useSaveMutation: useSavePreOperationMedicationsMutation
                                    }}
                                    newMedicationTemplate={newApPreOperationAdministeredMedications}
                                />
                            </div>
                        </Row>
                    </Col>
                </Row>
            </Form>
        </Panel>
    );
};
export default PreOperationAssessment;


