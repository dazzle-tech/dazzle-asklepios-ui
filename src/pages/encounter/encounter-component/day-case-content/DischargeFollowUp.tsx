import React from 'react';
import { Panel} from 'rsuite';
import { Col, Divider, Row, Form, Text } from 'rsuite';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';

const DischargeFollowUp = () => {


    return (
        <Panel>
            <Form fluid layout='inline'>
                <Row className='pre-operation-container'>
                    <Col md={24}>
                        <Row>
                            <div className='container-form'>
                                <div className='title-div'>
                                    <Text>Discharge & Follow-Up</Text>
                                </div>
                                <Divider />
                                <Form fluid layout='inline'  >
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLable="Final Assessment Done"
                                        fieldName="finalAssessmentDone"
                                        fieldType="checkbox"
                                        record={""}
                                        setRecord={""} />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLable="Post-op Instructions Given"
                                        fieldName="PostOperationInstructions"
                                        fieldType="checkbox"
                                        record={""}
                                        setRecord={""} />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLabel="Discharge Summary"
                                        fieldType="textarea"
                                        fieldName="dischargeSummary"
                                        record={""}
                                        setRecord={""} />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLabel="Wound / Dressing Instructions"
                                        fieldType="textarea"
                                        fieldName="woundDressingInstructions"
                                        record={""}
                                        setRecord={""} />
                                    <MyInput
                                        column
                                        width={200}
                                        fieldLabel="Discharge Planned Time"
                                        fieldType="datetime"
                                        fieldName="dischargePlannedTime"
                                        record={""}
                                        setRecord={""} />
                                    <div className='bt-div'>
                                        <MyButton
                                        >Follow-up Appointment</MyButton>
                                        <MyButton
                                        >Take-home Medications</MyButton>
                                    </div>
                                </Form>
                            </div>
                        </Row>
                    </Col>

                </Row>
            </Form>
        </Panel>
    );
};
export default DischargeFollowUp;


