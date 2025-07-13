import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import { useAppDispatch } from "@/hooks";
import StaffAssignment from "@/pages/encounter/encounter-component/procedure/StaffMember";
import { useGetResourceTypeQuery } from "@/services/appointmentService";
import { useDeleteOperationStaffMutation, useGetIntraoperativeEventsByOperationKeyQuery, useGetLatestSurgicalPreparationByOperationKeyQuery, useGetOperationListQuery, useGetOperationStaffListQuery, useSaveOperationRequestsMutation, useSaveOperationStaffMutation, useSavePostOpNotesHandoverMutation } from "@/services/operationService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { newApOperationIntraoperativeEvents, newApOperationPostOpNotesHandover, newApOperationStaff, newApOperationSurgicalPreparationIncision } from "@/types/model-types-constructor";
import { initialListRequest } from "@/types/types";
import { notify } from "@/utils/uiReducerActions";
import React, { useState, useEffect, useMemo } from "react";
import { Col, Divider, Form, Row, Text } from "rsuite";
const PostOperativeNote = ({ operation }) => {
    const dispatch = useAppDispatch();
    const [operativeNote, setOperativeNote] = useState({ ...newApOperationPostOpNotesHandover });

    const [save] = useSavePostOpNotesHandoverMutation();
    const { data: inpatientDepartmentListResponse } = useGetResourceTypeQuery("4217389643435490");
    const { data: outcomelovqueryresponse } = useGetLovValuesByCodeQuery('PROC_OUTCOMES');
    const { data: statuslovqueryresponse } = useGetLovValuesByCodeQuery('PATIENT_STATUS');
    const { data: event, refetch } = useGetIntraoperativeEventsByOperationKeyQuery(operation?.key);
    const [eventTrak, setEventTrak] = useState({ ...newApOperationIntraoperativeEvents });

    //for operations
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [textareaValue, setTextareaValue] = useState({ value: '' });
    const { data: operations } = useGetOperationListQuery({ ...initialListRequest });
    const { data: surgical, refetch: refetchs } = useGetLatestSurgicalPreparationByOperationKeyQuery(operation?.key);
    const [surgicalP, setSurgicalP] = useState({ ...newApOperationSurgicalPreparationIncision });
    const selectedNames = useMemo(() => {
        return operations?.object
            ?.filter(item => selectedKeys.includes(item.key))
            .map(item => item.name) ?? [];
    }, [operations, selectedKeys]);



    const durationInMinutes = useMemo(() => {
        const timeOfIncision = surgicalP?.timeOfIncision;
        const timeOfClosure = eventTrak.skinClosureTime;

        if (!timeOfIncision || !timeOfClosure) return '';

        const diff = Math.abs(timeOfClosure - timeOfIncision);
        return Math.round(diff / 60000);
    }, [surgicalP, eventTrak]);

    useEffect(() => {
        if (surgical?.object?.key != null) {
            setSurgicalP({ ...surgical.object });
        } else {
            setSurgicalP({ ...newApOperationSurgicalPreparationIncision, });
        }
    }, [surgical]);
    useEffect(() => {
        if (event?.object?.key != null) {
            setEventTrak({ ...event.object });
            setSelectedKeys(event?.object?.actualOperationPerformed.split(","));

        } else {
            setEventTrak({ ...newApOperationIntraoperativeEvents, skinClosureTime: 0 });
            setSelectedKeys([]);
        }
    }, [event]);

    useEffect(() => {
        setTextareaValue({ value: selectedNames.join('\n') });
    }, [selectedNames]);

    useEffect(() => {
        refetch();
        refetchs()
    }, [operation]);
    const hanelSave = async () => {
        try {
            await save({
                ...operativeNote,
                operationRequestKey:operation?.key,
                handoverTime: new Date(operativeNote.handoverTime).getTime,
                completedAt: new Date(operativeNote.completedAt).getTime()
            }).unwrap();
            dispatch(notify({ msg: "Saved Successfly", sev: "success" }));
        }
        catch (error) {
            dispatch(notify({ msg: " Fiald to Save ", sev: "error" }));
        }
    }
    return (<Form fluid>
        <Row gutter={15}>
            <Col md={12}>
                <Row>
                    <Col md={24} >
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Surgical Summary</Text>
                            </div>
                            <Divider />


                            <Row>

                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldName="indications"
                                        record={operativeNote}
                                        setRecord={setOperativeNote}
                                    />
                                </Col>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="number"
                                        rightAddon="min"
                                        disabled
                                        fieldLabel="Operation Duration"
                                        fieldName="duration"
                                        record={{ duration: durationInMinutes }}
                                        setRecord={() => { }}
                                    /></Col>
                            </Row>
                            <Row>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="textarea"
                                        fieldName="operativeFindings"
                                        record={operativeNote}
                                        setRecord={setOperativeNote}
                                    />
                                </Col>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="textarea"
                                        fieldName="operationPerformedSummary"
                                        record={operativeNote}
                                        setRecord={setOperativeNote}
                                    /></Col></Row>
                            <Row >
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="textarea"
                                        fieldName="variationsFromPlan"
                                        record={operativeNote}
                                        setRecord={setOperativeNote}
                                    /></Col>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="textarea"
                                        fieldName="value"
                                        fieldLabel="Final operation  Performed"
                                        record={textareaValue}
                                        setRecord={setTextareaValue}
                                        readOnly
                                       
                                    /></Col>
                            </Row>

                        </div></Col>

                </Row>
                <Row>
                    <Col md={24} >
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Post-Operative Orders</Text>
                            </div>
                            <Divider />

                            <Row>
                                <Col md={8}>
                                    <MyInput
                                        require

                                        fieldLabel="Post-op Destination"
                                        fieldType="select"
                                        fieldName="postOpDestinationKey"
                                        selectData={inpatientDepartmentListResponse?.object ?? []}
                                        selectDataLabel="name"
                                        selectDataValue="key"
                                        record={operativeNote}
                                        setRecord={setOperativeNote}
                                        width="100%"
                                    />
                                </Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="checkbox"
                                        fieldName="oxygenRequired"
                                        record={operativeNote}
                                        setRecord={setOperativeNote}
                                    />
                                </Col>
                                {operativeNote?.oxygenRequired &&
                                    <Col md={8}>
                                        <MyInput
                                            width="100%"
                                            fieldType="number"
                                            rightAddonwidth={50}
                                            rightAddon="L\min"
                                            fieldName="oxygenFlowRate"
                                            record={operativeNote}
                                            setRecord={setOperativeNote}
                                        />
                                    </Col>}
                            </Row>

                            <Row>
                                <Col md={24}>
                                    <MyInput
                                        width="100%"
                                        fieldType="textarea"
                                        fieldName="specialInstructions"
                                        record={operativeNote}
                                        setRecord={setOperativeNote}
                                    />
                                </Col></Row>
                            <Row>
                                <Col md={12}>
                                    <MyButton
                                        width="100%"
                                    >Medications</MyButton>
                                </Col>
                                <Col md={12}>
                                    <MyButton
                                        width="100%"
                                    >IV Fluids Ordered</MyButton>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={8}>
                                    <MyButton
                                        width="100%"
                                    >Pain Management</MyButton>
                                </Col>
                                <Col md={8}>
                                    <MyButton
                                        width="100%"
                                    >Antibiotics Ordered</MyButton>
                                </Col>
                                <Col md={8}>
                                    <MyButton
                                        width="100%"
                                    >DVT Prophylaxis</MyButton>
                                </Col>
                            </Row>

                        </div></Col>

                </Row>
            </Col>
            <Col md={12}>
                <Row>
                    <Col md={24} >
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Closure & Final Status</Text>
                            </div>
                            <Divider />

                            <Row>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="time"
                                        fieldName="handoverTime"
                                        record={operativeNote}
                                        setRecord={setOperativeNote}
                                    />
                                </Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldName="handoverNotes"
                                        record={operativeNote}
                                        setRecord={setOperativeNote}
                                    />
                                </Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="checkbox"
                                        fieldName="verbalSummaryGiven"
                                        record={operativeNote}
                                        setRecord={setOperativeNote}
                                    />
                                </Col>
                            </Row>
                            <StaffAssignment
                                parentKey={operation?.key}
                                label="Operation Staff"
                                getQuery={useGetOperationStaffListQuery}
                                saveMutation={useSaveOperationStaffMutation}
                                deleteMutation={useDeleteOperationStaffMutation}
                                newStaffObj={newApOperationStaff}
                                filterFieldName="operationRequestKey"
                                disabled={true} />


                        </div></Col>

                </Row>
                <Row>
                    <Col md={24} >
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Handover to Recovery Team</Text>
                            </div>
                            <Divider />

                            <Row>
                                <Col md={8}>  <MyInput
                                    width="100%"
                                    fieldType="select"
                                    selectData={statuslovqueryresponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName="recoveryConditionLkey"
                                    record={operativeNote}
                                    setRecord={setOperativeNote}
                                />
                                </Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="select"
                                        selectData={outcomelovqueryresponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName="surgeryStatusLkey"
                                        record={operativeNote}
                                        setRecord={setOperativeNote}
                                    />
                                </Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="time"
                                        fieldName="completedAt"
                                        record={operativeNote}
                                        setRecord={setOperativeNote}
                                    />
                                </Col>
                            </Row>

                        </div></Col>

                </Row></Col>
        </Row>
        <div className="bt-div">
            <div
                className="bt-right"
            >
             
                <MyButton onClick={hanelSave}>Save</MyButton>
            </div>
        </div>
    </Form>)
}
export default PostOperativeNote;