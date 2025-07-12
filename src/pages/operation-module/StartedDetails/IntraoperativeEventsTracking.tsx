import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import MyTagInput from "@/components/MyTagInput/MyTagInput";
import Translate from "@/components/Translate";
import { useAppDispatch } from "@/hooks";
import StaffAssignment from "@/pages/encounter/encounter-component/procedure/StaffMember";
import MultiSelectAppender from "@/pages/medical-component/multi-select-appender/MultiSelectAppender";
import { useDeleteOperationStaffMutation, useGetLatestSurgicalPreparationByOperationKeyQuery, useGetOperationListQuery, useGetOperationPatientArrivalByOperationQuery, useGetOperationStaffListQuery, useSaveIntraoperativeEventsMutation, useSaveOperationStaffMutation } from "@/services/operationService";
import { useGetLovValuesByCodeQuery, useGetPractitionersQuery, useGetUsersQuery } from "@/services/setupService";
import { newApOperationIntraoperativeEvents, newApOperationStaff, newApOperationSurgicalPreparationIncision } from "@/types/model-types-constructor";
import { initialListRequest } from "@/types/types";
import { notify } from "@/utils/uiReducerActions";
import React, { useEffect, useMemo, useState } from "react";
import { Col, Divider, Form, Radio, RadioGroup, Row, Text } from "rsuite";
import PatientOrder from '@/pages/encounter/encounter-component/diagnostics-order';
const IntraoperativeEventsTracking = ({ operation, patient,encounter }) => {
    const dispatch = useAppDispatch();
    const [intraoperative, setIntraoperative] = useState({ ...newApOperationIntraoperativeEvents });
    const { data: complicLovQueryResponse } = useGetLovValuesByCodeQuery('ROC_COMPLIC');
    const { data: severitylovqueryresponse } = useGetLovValuesByCodeQuery('SEVERITY');
    const { data: surgical, refetch } = useGetLatestSurgicalPreparationByOperationKeyQuery(operation?.key);
    const [surgicalP,setSurgicalP]=useState({...newApOperationSurgicalPreparationIncision});
    console.log("SU",surgicalP.timeOfIncision)
    const { data: registration } = useGetOperationPatientArrivalByOperationQuery(operation?.key);
    const { data: practtionerList } = useGetPractitionersQuery({ ...initialListRequest });
    const [save] = useSaveIntraoperativeEventsMutation();
    const [tag, setTag] = useState([]);
    const [status, setStatus] = useState<string>('');
    const { data: operations } = useGetOperationListQuery({ ...initialListRequest });
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [instr, setInstruc] = useState(null);
    const [openOrderModel, setOpenOrderModel] = useState(false);
    const { data: userList } = useGetUsersQuery({
        ...initialListRequest,
        //to do Nurse code
        filters: [
            {
                fieldName: 'job_role_lkey',
                operator: 'match',
                value: '157153858530600'
            }
        ]
    });
    const selectedNames = useMemo(() => {
        return operations?.object
            ?.filter(item => selectedKeys.includes(item.key))
            .map(item => item.name) ?? [];
    }, [operations, selectedKeys]);

    const [textareaValue, setTextareaValue] = useState({ value: '' });
    useEffect(() => {
        setIntraoperative({ ...intraoperative, eventOutcome: status })
    }, [status])
    useEffect(() => {
        setTextareaValue({ value: selectedNames.join('\n') });
    }, [selectedNames]);

 useEffect(() => {
    if (!operation?.key) return;

    refetch();

}, [operation]);

useEffect(() => {
    if (surgical?.object?.key != null) {
        setSurgicalP({ ...surgical.object });
    } else {
        setSurgicalP({ ...newApOperationSurgicalPreparationIncision });
    }
}, [surgical]);

    const handleSave = async () => {
        try {
            await save({
                ...intraoperative,
                operationRequestKey: operation?.key,
                firstCountTime: new Date(intraoperative.firstCountTime).getTime(),
                secondCountTime: new Date(intraoperative.secondCountTime).getTime(),
                skinClosureTime: new Date(intraoperative.skinClosureTime).getTime(),
                surgeryEndTime: new Date(intraoperative.surgeryEndTime).getTime(),


            }).unwrap();
            dispatch(notify({ msg: "Saved Successfly", sev: 'success' }));
        }
        catch (error) {
            dispatch(notify({ msg: "Faild to Save", sev: 'error' }));
        }
    }
    // Table Columns
    const MedicationsGivenColumns = [
        {
            key: '',
            title: <Translate>dose</Translate>,
            render: (rowData: any) => ""
        },
        {
            key: '',
            title: <Translate>route</Translate>,
            render: (rowData: any) => ''
        },
        ,
        {
            key: "",

            title: <Translate>time</Translate>,
            flexGrow: 1,
            render: (rowData: any) => ""
        },
    ];
    const FluidsGivenColumns = [
        {
            key: '',
            title: <Translate>Quantity</Translate>,
            render: (rowData: any) => ""
        }

    ];
    const BloodProductsGivenColumns = [
        {
            key: '',
            title: <Translate>Type</Translate>,
            render: (rowData: any) => ""
        },
        {
            key: '',
            title: <Translate>units</Translate>,
            render: (rowData: any) => ''
        },
        ,
        {
            key: "",

            title: <Translate>start time</Translate>,
            flexGrow: 1,
            render: (rowData: any) => ""
        },
    ];






    return (<Form fluid>
        <Row gutter={15}>
            <Col md={12}>
                <Row>
                    <Col md={24} >
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Operation Details</Text>
                            </div>
                            <Divider />
                            <Row>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="checkbox"
                                        fieldName="conversionOccurred"
                                        record={intraoperative}
                                        setRecord={setIntraoperative} />
                                </Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="checkbox"
                                        fieldName="conversionType"
                                        record={intraoperative}
                                        setRecord={setIntraoperative} />

                                </Col>
                                {intraoperative.conversionType &&
                                    <Col md={8}>
                                        <MyInput
                                            width="100%"
                                            fieldName="conversionTypeNote"
                                            record={intraoperative}
                                            setRecord={setIntraoperative} />
                                    </Col>}
                            </Row>
                            <Row>
                                <Col md={8}>
                                    <MyInput
                                        fieldType="time"
                                        disabled={true}
                                        fieldName="timeOfIncision"
                                        record={surgicalP}
                                        setRecord={setSurgicalP}
                                    />
                                </Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldName="incisionType"
                                        record={intraoperative}
                                        setRecord={setIntraoperative} />
                                </Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="number"
                                        rightAddon="ml"
                                        fieldName="estimatedBloodLossMl"
                                        record={intraoperative}
                                        setRecord={setIntraoperative} />
                                </Col>
                            </Row>
                            <Row>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="checkbox"
                                        fieldName="safetyPauseTaken"
                                        record={intraoperative}
                                        setRecord={setIntraoperative}
                                    />
                                </Col>
                                <Col md={8}>
                                    <MyTagInput tags={tag} setTags={setTag} labelText="" />
                                </Col>
                                <Col md={8}>
                                    <MyButton onClick={()=>setOpenOrderModel(true)}>Diagnostic Order </MyButton>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="textarea"
                                        fieldName="operationNotes"
                                        record={intraoperative}
                                        setRecord={setIntraoperative}
                                    />
                                </Col>
                                <Col md={12}>
                                    <MultiSelectAppender
                                        label="Surgical Complications"
                                        options={complicLovQueryResponse?.object ?? []}
                                        optionLabel="lovDisplayVale"
                                        optionValue="key"
                                        setObject={setInstruc}
                                        object={instr}
                                    /></Col>
                            </Row>
                            <Row>
                                <Col md={24}>
                                    <MyInput
                                        width="100%"
                                        fieldType="checkPicker"
                                        showLabel={false}
                                        plaplaceholder="Operations"
                                        fieldName="selectedKeys"
                                        record={{ selectedKeys }}
                                        setRecord={({ selectedKeys }) => setSelectedKeys(selectedKeys)}
                                        selectData={operations?.object ?? []}
                                        selectDataLabel="name"
                                        selectDataValue="key"

                                    />
                                </Col>

                                <Col md={24}>
                                    <MyInput
                                        width="100%"
                                        fieldType="textarea"
                                        fieldName="value"
                                        record={textareaValue}
                                        setRecord={setTextareaValue}
                                        readOnly
                                        showLabel={false}
                                    />
                                </Col>
                            </Row>


                        </div>
                    </Col>

                </Row>
                <Row>
                    <Col md={24} >
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Intraoperative Events & Interventions</Text>
                            </div>
                            <Divider />

                            <Row>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldName="eventDescription"
                                        record={intraoperative}
                                        setRecord={setIntraoperative} />
                                </Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldName="teamResponse"
                                        record={intraoperative}
                                        setRecord={setIntraoperative} /></Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="checkbox"
                                        fieldName="unexpectedEventOccurred"
                                        record={intraoperative}
                                        setRecord={setIntraoperative} /></Col>
                            </Row>
                            <Row>
                                <RadioGroup
                                    name="status"
                                    inline
                                    value={status}
                                    onChange={(value, _event) => setStatus(value as string)}
                                >
                                    <Col md={8}>
                                        <Radio value="Resolved">Resolved</Radio></Col>
                                    <Col md={8}>
                                        <Radio value="Escalated">Escalated</Radio></Col>
                                    <Col md={8}>
                                        <Radio value="Fatal">Fatal</Radio></Col>

                                </RadioGroup>
                            </Row>
                            <Row>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="select"
                                        selectData={severitylovqueryresponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName="complicationSeverityLkey"
                                        record={intraoperative}
                                        setRecord={setIntraoperative}
                                    />
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
                                <Text>Surgical Instrument Tracking</Text>
                            </div>
                            <Divider />
                            <Row>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="time"
                                        fieldLabel="First Count"
                                        fieldName="firstCountTime"
                                        record={intraoperative}
                                        setRecord={setIntraoperative}
                                    />
                                </Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="select"
                                        selectData={userList?.object ?? []}
                                        selectDataLabel="username"
                                        selectDataValue="key"
                                        fieldName="firstCountByKey"
                                        record={intraoperative}
                                        setRecord={setIntraoperative}
                                    />
                                </Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"

                                        fieldName="finalCountVerified"
                                        record={intraoperative}
                                        setRecord={setIntraoperative}
                                        showLabel={false}
                                    />
                                </Col>
                            </Row>
                            <Row>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="time"
                                        fieldLabel="Second Count"
                                        fieldName="secondCountTime"
                                        record={intraoperative}
                                        setRecord={setIntraoperative}
                                    /></Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="select"
                                        selectData={userList?.object ?? []}
                                        selectDataLabel="username"
                                        selectDataValue="key"
                                        fieldName="secondCountByKey"
                                        record={intraoperative}
                                        setRecord={setIntraoperative}
                                    /></Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="checkbox"
                                        fieldName="countDiscrepancy"
                                        record={intraoperative}
                                        setRecord={setIntraoperative}
                                    /></Col>
                            </Row>

                            {intraoperative.countDiscrepancy && <Row>
                                <Col md={24}>
                                    <MyInput
                                        width="100%"
                                        fieldType="textarea"
                                        fieldName="countDiscrepancyAction"
                                        record={intraoperative}
                                        setRecord={setIntraoperative}
                                    />
                                </Col>
                            </Row>}

                        </div></Col>

                </Row>
                <Row>
                    <Col md={24} >
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Time & Role Tracking</Text>
                            </div>
                            <Divider />
                            <Row>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="time"
                                        fieldName="skinClosureTime"
                                        record={intraoperative}
                                        setRecord={setIntraoperative} />
                                </Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="time"
                                        fieldName="surgeryEndTime"
                                        record={intraoperative}
                                        setRecord={setIntraoperative} /></Col>
                                <Col md={8}>
                                    <MyInput
                                        disabled={true}
                                        fieldType="select"
                                        fieldLabel="Surgeon"
                                        selectData={practtionerList?.object ?? []}
                                        selectDataLabel="practitionerFullName"
                                        selectDataValue="key"
                                        width="100%"
                                        fieldName="surgeonKey"
                                        record={registration}
                                        setRecord={() => ""}
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
            </Col>
            <Row>
                <Col md={24} >
                    <div className='container-form'>
                        <div className='title-div'>
                            <Text>Medications, Fluids, and Transfusions</Text>
                        </div>
                        <Divider />
                        <Row>
                            <Col md={8}>
                                <div className='medical-dashboard-main-container'>
                                    <div className='medical-dashboard-container-div'>
                                        <div className='medical-dashboard-header-div'>
                                            <div className='medical-dashboard-title-div'>
                                                Medications Given
                                            </div>
                                        </div>
                                        <Divider className="divider-line" />
                                        <div className='medical-dashboard-table-div'>
                                            <MyTable
                                                data={[]}
                                                columns={MedicationsGivenColumns}
                                                height={250}

                                                onRowClick={(rowData) => { }}
                                            />
                                        </div>
                                    </div>
                                </div></Col>

                            <Col md={8}>
                                <div className='medical-dashboard-main-container'>
                                    <div className='medical-dashboard-container-div'>
                                        <div className='medical-dashboard-header-div'>
                                            <div className='medical-dashboard-title-div'>
                                                Fluids Given
                                            </div>
                                        </div>
                                        <Divider className="divider-line" />
                                        <div className='medical-dashboard-table-div'>
                                            <MyTable
                                                data={[]}
                                                columns={FluidsGivenColumns}
                                                height={250}

                                                onRowClick={(rowData) => { }}
                                            />
                                        </div>
                                    </div>
                                </div></Col>
                            <Col md={8}>
                                <div className='medical-dashboard-main-container'>
                                    <div className='medical-dashboard-container-div'>
                                        <div className='medical-dashboard-header-div'>
                                            <div className='medical-dashboard-title-div'>
                                                Blood Products Given
                                            </div>
                                        </div>
                                        <Divider className="divider-line" />
                                        <div className='medical-dashboard-table-div'>
                                            <MyTable
                                                data={[]}
                                                columns={BloodProductsGivenColumns}
                                                height={250}

                                                onRowClick={(rowData) => { }}
                                            />
                                        </div>
                                    </div>
                                </div></Col>
                        </Row>




                    </div></Col>

            </Row>
        </Row>
        <div className='bt-div'>
            <div className="bt-right">
                <MyButton onClick={handleSave}>Save</MyButton>

            </div></div>

        <MyModal
            open={openOrderModel}
            setOpen={setOpenOrderModel}
            size={'full'}
            title="Add Order"
            content={<PatientOrder  patient={patient} encounter={encounter} edit={false}/>}
        ></MyModal>
    </Form>)
}
export default IntraoperativeEventsTracking;