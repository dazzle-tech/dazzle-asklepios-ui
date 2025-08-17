import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyLabel from "@/components/MyLabel";
import MyModal from "@/components/MyModal/MyModal";
import PatientSide from "@/pages/encounter/encounter-main-info-section/PatienSide";
import { useGetOperationListQuery, useSaveOperationRequestsMutation } from "@/services/operationService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { initialListRequest } from "@/types/types";
import React, { useState } from "react";
import { Col, Divider, Form, Row, Tabs } from "rsuite";
import PatientArrival from "./PatientArrival";
import { useAppSelector } from "@/hooks";
import OperativeTimeOut from "./OperativeTimeOut";
import AnesthesiaInduction from "./AnesthesiaInduction";
import SurgicalHistory from "@/pages/encounter/encounter-component/patient-history/SurgicalHistory";
import SurgicalPreparation from "./SurgicalPreparation";
import IntraoperativeEventsTracking from "./IntraoperativeEventsTracking";
import PostOperativeNote from "./PostOperativeNote";
const StartedDetails = ({ open, setOpen, patient, encounter, operation, setOperation, refetch, editable }) => {

    const authSlice = useAppSelector(state => state.auth);
    const [save, saveMutation] = useSaveOperationRequestsMutation();
    const { data: bodypartLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
    const { data: sideLovQueryResponse } = useGetLovValuesByCodeQuery('SIDES');
    const { data: anesthTypesLov } = useGetLovValuesByCodeQuery('ANESTH_TYPES');
    const { data: operationList } = useGetOperationListQuery({ ...initialListRequest })
    const [activeTab, setActiveTab] = useState<string>('1');
    return (<>
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Operation Progress"
            size='full'
            hideActionBtn
            content={<div className='container'>
                <div className='left-box'>
                    <Form fluid >
                        <Row>
                            <Col md={5}>
                                <MyInput
                                    fieldType="select"
                                    selectData={operationList?.object ?? []}
                                    selectDataLabel="name"
                                    selectDataValue="key"
                                    width="100%"
                                    fieldName="operationKey"
                                    record={operation}
                                    setRecord={setOperation}
                                />
                            </Col>
                            <Col md={5}>
                                <MyInput
                                    disabled={true}
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Body Part "
                                    selectData={bodypartLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'bodyPartLkey'}
                                    record={operation}
                                    setRecord={setOperation}
                                />
                            </Col>
                            <Col md={5}>
                                <MyInput
                                    disabled={true}
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Side"
                                    selectData={sideLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'sideLkey'}
                                    record={operation}
                                    setRecord={setOperation}
                                />
                            </Col>
                            <Col md={5}>
                                <MyInput
                                    disabled={true}
                                    fieldType="select"
                                    selectData={anesthTypesLov?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    width="100%"
                                    fieldName="plannedAnesthesiaTypeLkey"
                                    record={operation}
                                    setRecord={setOperation}
                                />
                            </Col>
                            <Col md={4}>
                                <br />
                                <MyButton onClick={() => {
                                    try { save({ ...operation }) } catch (error) {
                                        console.log("Error in save")
                                    }
                                }}>Save</MyButton>
                            </Col>
                        </Row>




                    </Form>

                    <Divider />


                    <Tabs activeKey={activeTab} onSelect={(key) => {
                        if (key) setActiveTab(key.toString());
                    }} appearance="subtle"
                        style={{ flexGrow: 1, maxHeight: 500, height: '100%' }}
                    >
                        <Tabs.Tab eventKey="1" title="Patient Arrival & Registration" >
                            <PatientArrival operation={operation} patient={patient} encounter={encounter} user={authSlice.user} editable={editable} />
                        </Tabs.Tab>

                        <Tabs.Tab eventKey="2" title="Pre-Operative Time-out" >
                            <OperativeTimeOut operation={operation} refetch={refetch} editable={editable} />
                        </Tabs.Tab>

                        <Tabs.Tab
                            disabled={!["PROC_INPROGRESS", "PROC_COMPLETED"].includes(
                                operation?.operationStatusLvalue?.valueCode
                            )}
                            eventKey="3" title="Anesthesia Induction & Monitoring" >
                            <AnesthesiaInduction operation={operation} patient={patient} encounter={encounter} editable={editable} />
                        </Tabs.Tab>
                        <Tabs.Tab
                            disabled={!["PROC_INPROGRESS", "PROC_COMPLETED"].includes(
                                operation?.operationStatusLvalue?.valueCode
                            )}
                            eventKey="4" title="Surgical Preparation & Incision" >
                            <SurgicalPreparation operation={operation} editable={editable} />
                        </Tabs.Tab>
                        <Tabs.Tab
                            disabled={!["PROC_INPROGRESS", "PROC_COMPLETED"].includes(
                                operation?.operationStatusLvalue?.valueCode
                            )}
                            eventKey="5" title="Intraoperative & Events Tracking" >
                            <IntraoperativeEventsTracking operation={operation} patient={patient} encounter={encounter} editable={editable} />
                        </Tabs.Tab>
                        <Tabs.Tab
                            disabled={!["PROC_INPROGRESS", "PROC_COMPLETED"].includes(
                                operation?.operationStatusLvalue?.valueCode
                            )}
                            eventKey="6" title="Post-Operative Notes & Handover" >
                            <PostOperativeNote operation={operation} editable={editable} refetch={refetch} />
                        </Tabs.Tab>

                    </Tabs>
                </div>
                <div className='right-box'>
                    <PatientSide patient={patient} encounter={encounter} />
                </div>
            </div>}
        ></MyModal></>)
}
export default StartedDetails;