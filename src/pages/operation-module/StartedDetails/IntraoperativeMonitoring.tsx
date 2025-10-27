import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { useGetIntraoperativeMonitoringListQuery, useGetOperationAnesthesiaInductionMonitoringListQuery, useSaveIntraoperativeMonitoringMutation, useSaveOperationRequestsMutation } from "@/services/operationService";
import { newApOperationIntraoperativeMonitoring, newApOperationRequests } from "@/types/model-types-constructor";
import { initialListRequest } from "@/types/types";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { Col, Form, Row, Text } from "rsuite";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";



const IntraoperativeMonitoring = ({ operation, editable }) => {
    const [operationReq, setOperationReq] = useState({ ...newApOperationRequests });
    const dispatch = useAppDispatch();
    const [open, setOpen] = useState(false);
    const [monitor, setMonitor] = useState({ ...newApOperationIntraoperativeMonitoring });
    const [isSaved, setIsSaved] = useState(false);


    const [listRequest, setListRequest] = useState({
        ...initialListRequest,
        filters: [

            {
                fieldName: 'operation_request_key',
                operator: 'match',
                value: operation?.key
            },

        ]
    })
    const { data: monitorings, refetch } = useGetIntraoperativeMonitoringListQuery(listRequest);

    const [save] = useSaveIntraoperativeMonitoringMutation();
    const [saveOperation] = useSaveOperationRequestsMutation();

    useEffect(() => {
        setOperationReq(operation);
        if (operation.monitorSlot > 0) {
            setIsSaved(true)
        }
    }, [operation])

    const handelSave = async () => {
        try {
            await save({
                ...monitor,
                period: operationReq.monitorSlot * (monitorings?.object?.length + 1),
                operationRequestKey: operation?.key
            }).unwrap();

            refetch();
            setOpen(false);

            setMonitor({ ...newApOperationIntraoperativeMonitoring });
            dispatch(notify({ msg: "Intraoperative data saved successfully", sev: "success" }));
        } catch (error) {
            console.error(error);
            dispatch(notify({ msg: "Failed to save intraoperative data", sev: "error" }));
        }
    };


    const handleClear = () => {
        setMonitor({ ...newApOperationIntraoperativeMonitoring });
    };


    const saveOperationSlot = async () => {
        try {
            await saveOperation({ ...operationReq }).unwrap();
            console.log("saved");
            setIsSaved(true);
            dispatch(notify({ msg: "Interval saved successfully", sev: "success" }));
        } catch (error) {
            console.error(error);
            dispatch(notify({ msg: "Failed to save interval", sev: "error" }));
        }
    };

    const columns = [
        {
            key: 'period',
            title: <Translate>#</Translate>,
            render: (rowData: any) => (
                <div style={{ background: '#f0f0f0', padding: '4px 8px', fontWeight: 'bold' }}>
                    {rowData.period}
                </div>
            )
        },
        {
            key: 'heartRate',
            title: <Translate>Heart Rate (bpm)</Translate>,
            render: (rowData: any) => rowData.heartRate
        },
        {
            key: 'spo2',
            title: <Translate>SpO₂ (%)</Translate>,
            render: (rowData: any) => rowData.spo2
        },
        {
            key: 'bloodPressure',
            title: <Translate>Blood Pressure (mmHg)</Translate>,
            render: (rowData: any) =>
                `${rowData.bpSystolic ?? '-'} \\ ${rowData.bpDiastolic ?? '-'}`
        },
        {
            key: 'respiratoryRate',
            title: <Translate>Respiratory Rate (bpm)</Translate>,
            render: (rowData: any) => rowData.respiratoryRate
        },
        {
            key: 'temperature',
            title: <Translate>Temperature (°C)</Translate>,
            render: (rowData: any) => rowData.temperature
        },
        {
            key: 'etco2',
            title: <Translate>ETCO₂ (mmHg)</Translate>,
            render: (rowData: any) => rowData.etco2
        },
        {
            key: 'fluidsGiven',
            title: <Translate>Fluids Given (mL)</Translate>,
            render: (rowData: any) => rowData.fluidsGiven
        },
        {
            key: 'bloodGiven',
            title: <Translate>Blood Given (Units)</Translate>,
            render: (rowData: any) => rowData.bloodGiven
        },
        {
            key: 'urineOutput',
            title: <Translate>Urine Output (mL)</Translate>,
            render: (rowData: any) => rowData.urineOutput
        }
    ];

    return (<Form fluid className={clsx('', {
        'disabled-panel': !editable
    })}>
        <div className="bt-div">
            <Row>
                <Col md={10}>
                    <MyInput
                        width="100%"
                        disabled={isSaved}
                        fieldType="number"
                        fieldName="monitorSlot"
                        fieldLabel="Increase by"
                        rightAddon={"min"}
                        setRecord={setOperationReq}
                        record={operationReq}

                    /></Col>
                <Col md={2}>
                    <br />
                    <div className="button-check-intraoperative-monitoring">
                        <MyButton onClick={saveOperationSlot}>
                            <FontAwesomeIcon icon={faCircleCheck} />
                        </MyButton>
                    </div>

                </Col>
            </Row>


            <div
                className="bt-right"
            >
                <MyButton
                    disabled={!operationReq.monitorSlot}
                    onClick={() => setOpen(true)}
                >
                    <AddOutlineIcon style={{ marginRight: 8 }} />
                    Add
                </MyButton>

            </div>
        </div>
        <MyTable
            data={monitorings?.object || []}
            columns={columns}

        />
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add Intraoperative"
            actionButtonFunction={handelSave}
            content={<>
                <Row className="rows-gap">
                    <Col md={8}>
                        <MyInput
                            width="100%"
                            fieldType="number"
                            rightAddonwidth={50}
                            rightAddon="bpm"
                            fieldName="heartRate"
                            record={monitor}
                            setRecord={setMonitor}
                        />
                    </Col>
                    <Col md={8}>
                        <MyInput
                            width="100%"

                            fieldType="number"
                            rightAddon="%"
                            fieldName="spo2"
                            record={monitor}
                            setRecord={setMonitor}
                        /></Col>
                    <Col md={8}>
                        <MyInput
                            width="100%"
                            rightAddonwidth={50}
                            fieldType="number"
                            rightAddon="Units"
                            fieldName="bloodGiven"
                            record={monitor}
                            setRecord={setMonitor}
                        /></Col>
                </Row>

                <Row className="rows-gap">
                    <Col md={8}>
                        <MyInput
                            width="100%"
                            rightAddonwidth={50}
                            fieldType="number"
                            rightAddon="bpm"
                            fieldName="respiratoryRate"
                            record={monitor}
                            setRecord={setMonitor}
                        /></Col>
                    <Col md={8}>
                        <MyInput
                            width="100%"
                            fieldType="number"
                            rightAddon="°C"
                            fieldName="temperature"
                            record={monitor}
                            setRecord={setMonitor}
                        /></Col>
                    <Col md={8}>
                        <MyInput
                            width="100%"
                            fieldType="number"
                            rightAddon="mL"
                            fieldName="urineOutput"
                            record={monitor}
                            setRecord={setMonitor}
                        /></Col>
                </Row>


                <Row className="rows-gap">
                    <Col md={8}>
                        <MyInput
                            width="100%"
                            fieldType="number"
                            rightAddon="mmHg"
                            rightAddonwidth={60}
                            fieldName="cvp"
                            fieldLabel="CVP"
                            record={monitor}
                            setRecord={setMonitor}
                        /></Col>

                    <Col md={8}>
                        <MyInput
                            width="100%"
                            fieldType="number"
                            rightAddon="mmHg"
                            rightAddonwidth={60}
                            fieldLabel="IAP"
                            fieldName="iap"
                            record={monitor}
                            setRecord={setMonitor}
                        /></Col>

                    <Col md={8}>
                        <MyInput
                            width="100%"
                            fieldType="number"
                            rightAddon="mmHg"
                            rightAddonwidth={60}
                            fieldLabel="EVD"
                            fieldName="evd"
                            record={monitor}
                            setRecord={setMonitor}
                        /></Col>


                </Row>


                <Row className="rows-gap">
                    <Col md={8}>
                        <MyInput
                            width="100%"
                            fieldType="number"
                            rightAddonwidth={60}
                            rightAddon="mmHg"
                            fieldName="etco2"
                            record={monitor}
                            setRecord={setMonitor}
                        /></Col>
                    <Col md={8}>
                        <MyInput
                            width="100%"
                            fieldType="number"
                            rightAddon="mL"
                            fieldName="fluidsGiven"
                            record={monitor}
                            setRecord={setMonitor}
                        /></Col>

                    <Col md={8}>
                        <MyInput
                            width="100%"
                            fieldType="number"
                            rightAddon="%"
                            fieldName="ppv"
                            fieldLabel="PPV"
                            record={monitor}
                            setRecord={setMonitor}
                        /></Col>

                </Row>

                <Row className="rows-gap">
                    <Col md={10}>
                        <MyInput
                            width="100%"
                            fieldType="number"
                            fieldLabel="BP Systolic"
                            fieldName="bpSystolic"
                            record={monitor}
                            setRecord={setMonitor}
                        /></Col>
                    <Col md={2}>
                        <br />
                        <Text></Text>
                    </Col>

                    <Col md={2}>
                        <br />
                        <Text>/</Text>
                    </Col>
                    <Col md={10} >
                        <MyInput
                            width="100%"
                            fieldType="number"
                            fieldLabel="BP Diastolic"
                            fieldName="bpDiastolic"
                            record={monitor}
                            setRecord={setMonitor}
                        /></Col>
                </Row>
            </>}
            footerButtons={
                <MyButton onClick={handleClear}>
                    Clear
                </MyButton>
            }
        ></MyModal>


    </Form>);
}
export default IntraoperativeMonitoring;