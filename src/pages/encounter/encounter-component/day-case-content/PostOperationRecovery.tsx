import React, { useState } from 'react';
import { Panel } from 'rsuite';
import { Col, Divider, Row, Form, Text } from 'rsuite';
import './styles.less';
import VitalSigns from '@/pages/medical-component/vital-signs/VitalSigns';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ApPostOperationRecovery } from '@/types/model-types';
import { newApPostOperationRecovery } from '@/types/model-types-constructor';
const PostOperationRecovery = () => {
    const [postOperationAssessment, setPostOperationAssessment] = useState<ApPostOperationRecovery>({ ...newApPostOperationRecovery });

    const [vital, setVital] = useState({
        bloodPressureSystolic: 0,
        bloodPressureDiastolic: 0,
        heartRate: 0,
        temperature: 0,
        oxygenSaturation: 0,
    });
    // Fetch LOV data for various fields
    const { data: scoreLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
 
    // Fetching the LOV values for Aldrete score components
    const { data: oxsatQueryResponse } = useGetLovValuesByCodeQuery('ALDRETE_OXSAT');
    const { data: conscLovQueryResponse } = useGetLovValuesByCodeQuery('ALDRETE_CONSC');
    const { data: circuLovQueryResponse } = useGetLovValuesByCodeQuery('ALDRETE_CIRCU');
    const { data: respirLovQueryResponse } = useGetLovValuesByCodeQuery('ALDRETE_RESPIR');
    const { data: activityLovQueryResponse } = useGetLovValuesByCodeQuery('ALDRETE_ACTIVITY');
    return (
        <Panel>
            <Form fluid layout='inline'>
                <Row className='pre-operation-container'>
                    <Col md={12}>
                        <Row>
                            <div className='container-form'>
                                <div className='title-div'>
                                    <Text>Post-Operation Recovery</Text>
                                </div>
                                <Divider />
                                <Form fluid layout='inline'  >
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLable="PACU Arrival Time"
                                        fieldName="nopStatusConfirmed"
                                        fieldType="time"
                                        record={postOperationAssessment}
                                        setRecord={setPostOperationAssessment} />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLabel="Pain Score Post-op"
                                        fieldType="select"
                                        fieldName="painScoreLkey"
                                        selectData={scoreLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        record={postOperationAssessment}
                                        setRecord={setPostOperationAssessment} />
                                    <MyInput
                                        column
                                        width={100}
                                        fieldLable="Nausea"
                                        fieldName="nausea"
                                        fieldType="checkbox"
                                        record={postOperationAssessment}
                                        setRecord={setPostOperationAssessment} />
                                    <MyInput
                                        column
                                        width={90}
                                        fieldLable="Consent for Procedure Signed"
                                        fieldName="consentForProcedureSigned"
                                        fieldType="checkbox"
                                        record={postOperationAssessment}
                                        setRecord={setPostOperationAssessment} />
                                    <MyInput
                                        column
                                        width={90}
                                        fieldLable="Vomiting"
                                        fieldName="vomiting"
                                        fieldType="checkbox"
                                        record={postOperationAssessment}
                                        setRecord={setPostOperationAssessment} />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLable="Recovery Status"
                                        fieldName="recoveryStatus"
                                        fieldType="textarea"
                                        record={postOperationAssessment}
                                        setRecord={setPostOperationAssessment} />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLable="Nursing Notes"
                                        fieldName="nursingNotes"
                                        fieldType="textarea"
                                        record={postOperationAssessment}
                                        setRecord={setPostOperationAssessment} />
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
                                    <Text>Aldrete Score</Text>
                                </div>
                                <Divider />
                                <Form fluid layout='inline'>
                                    <MyInput
                                        column
                                        width={200}
                                        da selectData={oxsatQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldType="select"
                                        fieldName={"oxygenSaturationLkey"}
                                        record={postOperationAssessment}
                                        setRecord={setPostOperationAssessment}
                                    />
                                    <MyInput
                                        column
                                        width={200}
                                        selectData={conscLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldType="select"
                                        fieldName={"consciousnessLkey"}
                                        record={postOperationAssessment}
                                        setRecord={setPostOperationAssessment} />
                                    <MyInput
                                        column
                                        width={200}
                                        selectData={circuLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldType="select"
                                        fieldName={"circulationLkey"}
                                        record={postOperationAssessment}
                                        setRecord={setPostOperationAssessment} />
                                    <MyInput
                                        width={200}
                                        column
                                        selectData={respirLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldType="select"
                                        fieldName={"respirationLkey"}
                                        record={postOperationAssessment}
                                        setRecord={setPostOperationAssessment} />
                                    <MyInput
                                        column
                                        width={200}
                                        selectData={activityLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldType="select"
                                        fieldName={"activityLkey"}
                                        record={postOperationAssessment}
                                        setRecord={setPostOperationAssessment} />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldType="number"
                                        fieldName='aldreteScore'
                                        record={postOperationAssessment}
                                        setRecord={setPostOperationAssessment} />
                                </Form>
                            </div>
                        </Row>
                    </Col>
                </Row>
            </Form>
        </Panel>
    );
};
export default PostOperationRecovery;


