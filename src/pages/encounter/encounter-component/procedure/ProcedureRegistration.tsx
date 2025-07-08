import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyTagInput from "@/components/MyTagInput/MyTagInput";
import Translate from "@/components/Translate";
import { useAppDispatch } from "@/hooks";
import {
    useDeleteProceduresStaffMutation,
    useGetProceduresStaffQuery,
    useSaveProceduresRegistrationMutation,
    useSaveProceduresStaffMutation
} from '@/services/procedureService';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery, useGetPractitionersQuery, useGetUserRecordQuery, useGetUsersQuery } from "@/services/setupService";
import { newApProcedureRegistration, newApProcedureStaff } from "@/types/model-types-constructor";
import { initialListRequest, ListRequest } from "@/types/types";
import { notify } from "@/utils/uiReducerActions";
import React, { useEffect, useState } from "react";
import { Col, Form, Panel, Row } from "rsuite";
import StaffMember from "./StaffMember";
const ProcedureRegistration = ({ procedure, user, setActiveTab }) => {
    const dispatch = useAppDispatch();

    const { data: proUser } = useGetUserRecordQuery(procedure?.createdBy, { skip: !procedure?.createdBy });
    const [proReg, setProReg] = useState({ ...newApProcedureRegistration });
    const { data: consentLovQueryResponse } = useGetLovValuesByCodeQuery('CONSENT_FORM');
    const [departmentListRequest, setDepartmentListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
        ],
    });
    const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);
    const { data: practitionerListResponse } = useGetPractitionersQuery({ ...initialListRequest });

    const [saveRegis] = useSaveProceduresRegistrationMutation();

    const handleSave = async () => {
        try {
            saveRegis({ ...proReg, dateTime: new Date(proReg?.dateTime).getTime(), requestedBy: user?.key, procedureKey: procedure?.key }).unwrap()
            dispatch(notify({ msg: 'Saved  Successfully', sev: "success" }));
        } catch (error) {

            dispatch(notify({ msg: 'Saved  Faild', sev: "error" }));
        }
    }
    const handleClear = () => {

    }
    return (<>
        <Panel>
            <Form fluid >
                <Row>
                    <Col md={5}>
                        <MyInput
                            width="100%"
                            fieldType="select"
                            selectData={consentLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName='consentFormLkey'
                            record={proReg}
                            setRecord={setProReg}
                        />
                    </Col>
                    <Col md={5}>
                        <MyInput
                            width="100%"
                            fieldType="datetime"
                            fieldName='dateTime'
                            record={proReg}
                            setRecord={setProReg}

                        /></Col>
                    <Col md={5}>
                        <MyInput

                            width="100%"
                            fieldLabel="Procedure Location"
                            fieldName="departmentKey"
                            fieldType="select"
                            selectData={departmentListResponse?.object ?? []}
                            selectDataLabel="name"
                            selectDataValue="key"
                            record={proReg}
                            setRecord={setProReg}
                        /></Col>
                    <Col md={5}>
                        <MyInput
                            menuMaxHeight={140}
                            width="100%"
                            fieldName="practitionersKey"
                            fieldType="select"
                            selectData={practitionerListResponse?.object ?? []}
                            selectDataLabel="practitionerFirstName"
                            selectDataValue="key"
                            record={proReg}
                            setRecord={setProReg}
                        /></Col>
                    <Col md={4}>
                        {proUser?.fullName}
                    </Col>


                </Row>
                <Row>
                    <Col md={22}></Col>
                    <Col md={1}><MyButton onClick={handleSave}>Save</MyButton></Col>

                </Row>

            </Form>
        </Panel>
        <StaffMember
            parentKey={procedure?.key}
            label="Procedure Staff"
            getQuery={useGetProceduresStaffQuery}
            saveMutation={useSaveProceduresStaffMutation}
            deleteMutation={useDeleteProceduresStaffMutation}
            newStaffObj={newApProcedureStaff}
            filterFieldName="procedureKey" />
        <Panel>
            <div className='bt-div'>

                <div className="bt-right">
                    <MyButton onClick={() => setActiveTab("2")}>Complete and Next</MyButton>
                </div>
            </div>
        </Panel>


    </>);
}
export default ProcedureRegistration;
