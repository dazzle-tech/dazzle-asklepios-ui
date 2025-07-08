import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyModal from "@/components/MyModal/MyModal";
import { useAppDispatch } from "@/hooks";
import PreCheckList from "@/pages/encounter/encounter-component/operation-request/PreCheckList";
import { useDeleteOperationStaffMutation, useGetLatestChecklistByOperationKeyQuery, useGetOperationStaffListQuery, useSaveOperationPatientArrivalMutation, useSaveOperationStaffMutation, useSavePreOperationChecklistMutation } from '@/services/operationService';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery, useGetPractitionersQuery, useGetRoomListQuery, useGetUsersQuery } from "@/services/setupService";
import { newApOperationPatientArrival, newApOperationStaff, newApPreOperationChecklist } from "@/types/model-types-constructor";
import { initialListRequest } from "@/types/types";
import { notify } from "@/utils/uiReducerActions";
import React, { useEffect, useState } from "react";
import { Col, Divider, Form, Row, Text } from "rsuite";
import StaffMember from "@/pages/encounter/encounter-component/procedure/StaffMember";
const PatientArrival = ({ operation, patient, encounter, user }) => {
    const dispatch = useAppDispatch();
    const [openCheckLit, setOpenCheckList] = useState(false);
    const [checkList, setCheckList] = useState({ ...newApPreOperationChecklist });
    const [arraivel, setArrival] = useState({ ...newApOperationPatientArrival })

    const [saveCheckList] = useSavePreOperationChecklistMutation();
    const [save]=useSaveOperationPatientArrivalMutation();
    // get lists
    const { data: checklists, refetch } = useGetLatestChecklistByOperationKeyQuery(operation?.key);
    const { data: ConsentFormLovQueryResponse } = useGetLovValuesByCodeQuery('CONSENT_FORM');
    const { data: practtionerList } = useGetPractitionersQuery({ ...initialListRequest });
    console.log("Pra",practtionerList?.object)
    const { data: roomsList } = useGetRoomListQuery({ ...initialListRequest });
    const { data: userList } = useGetUsersQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'job_role_lkey',
                operator: 'match',
                value: '157153858530600'
            }
        ]

    });
    const { data: departmentList } = useGetDepartmentsQuery({
        ...initialListRequest,
        filters: [

            {
                fieldName: 'department_type_lkey',
                operator: 'match',
                //Operation Theater
                value: '5673990729647006'
            }

        ]
    });



    useEffect(() => {
        if (checklists?.object?.key !== null) {
            setCheckList({ ...checklists?.object, confirmTime: 0 });
        }
        else {
            setCheckList({ ...newApPreOperationChecklist, confirmTime: 0 });

        }
    }, [checklists]);

    const handleConfirm = async () => {
        try {
            await saveCheckList({ ...checkList, isConfirm: true, confirmTime: new Date(checkList.confirmTime).getTime() }).unwrap();
            dispatch(notify({ msg: "Confermed ", sev: "success" }));
            refetch();

        }
        catch (error) {

        }
    }
    const handleSave=async()=>{
        try{
           await save({...arraivel,operationRequestKey:operation?.key ,datetime:new Date(arraivel?.dateTime).getTime()}).unwrap();
           dispatch(notify({ msg: "Saved Successfly", sev: "success" }));
        }
        catch(error){

        }
    }
    return (<Form fluid>
        <Row gutter={15}>
            <Row>
                <Col md={24} >
                    <div className='container-form'>
                        <div className='title-div'>
                            <Text>Confirm Checklist</Text>
                        </div>
                        <Divider />

                        <Row>
                            <Col md={3}>
                                <br />
                                <MyButton onClick={() => setOpenCheckList(true)}>pre-op checklist</MyButton></Col>
                            <Col md={6}>
                                <MyInput
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="User"
                                    selectData={userList?.object ?? []}
                                    selectDataLabel="username"
                                    selectDataValue="key"
                                    fieldName="userKey"
                                    record={checkList}
                                    setRecord={setCheckList}
                                />
                            </Col>
                            <Col md={6}>
                                <MyInput
                                    width="100%"
                                    fieldType="time"
                                    fieldName="confirmTime"
                                    record={checkList}
                                    setRecord={setCheckList}
                                />
                            </Col>

                            <Col md={3}>
                                <br />
                                {!checkList?.isConfirm ? <MyButton onClick={handleConfirm}>Confirm</MyButton> : <MyButton appearance="ghost">Confiermed</MyButton>}
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}></Col>
                            <Col md={12}></Col>
                        </Row>

                    </div></Col>

            </Row>
            <Row>
                <Col md={24}>
                    <div className='container-form'>
                        <div className='title-div'>
                            <Text> Room Registration </Text>
                            <MyButton onClick={handleSave} >Save</MyButton>
                        </div>
                        <Divider />
                        <Row>
                            <Col md={5}>
                                <MyInput
                                    fieldType="select"
                                    selectData={departmentList?.object ?? []}
                                    selectDataLabel="name"
                                    selectDataValue="key"
                                    width="100%"
                                    fieldName="departmentKey"
                                    record={arraivel}
                                    setRecord={setArrival}
                                />
                            </Col>
                            <Col md={5}>
                                <MyInput
                                    fieldType="select"
                                    selectData={roomsList?.object ?? []}
                                    selectDataLabel="name"
                                    selectDataValue="key"
                                    width="100%"
                                    fieldName="roomKey"
                                    record={arraivel}
                                    setRecord={setArrival}
                                /></Col>
                            <Col md={5}>
                                <MyInput
                                    fieldType="select"
                                    fieldLabel="Surgeon"
                                    selectData={practtionerList?.object ?? []}
                                    selectDataLabel="practitionerFullName"
                                    selectDataValue="key"
                                    width="100%"
                                    fieldName="surgeonKey"
                                    record={arraivel}
                                    setRecord={setArrival}
                                /></Col>
                            <Col md={5}>
                                <MyInput
                                    fieldType="select"
                                    selectData={ConsentFormLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    width="100%"
                                    fieldName="consentLkey"
                                    record={arraivel}
                                    setRecord={setArrival}
                                /></Col>
                            <Col md={4}>
                                <MyInput                         
                                    width="100%"
                                    fieldType="datetime"
                                    fieldName="dateTime"
                                    record={arraivel}
                                    setRecord={setArrival}
                                /></Col>
                        </Row>
                    </div></Col>

            </Row>
            <Row>
                <Col md={24}>
                    <div className='container-form'>
                       
                        <StaffMember
                                    parentKey={operation?.key}
                                    label="Operation Staff"
                                    getQuery={useGetOperationStaffListQuery}
                                    saveMutation={useSaveOperationStaffMutation}
                                    deleteMutation={useDeleteOperationStaffMutation}
                                    newStaffObj={newApOperationStaff}
                                    filterFieldName="operationRequestKey" />   
                    </div>
                    </Col>

            </Row>
        </Row>
        <MyModal
            open={openCheckLit}
            setOpen={setOpenCheckList}
            title={"Check List"}
            hideActionBtn={true}

            content={<PreCheckList operation={operation} patient={patient} encounter={encounter} user={user} />}
        />
    </Form>)
};
export default PatientArrival;