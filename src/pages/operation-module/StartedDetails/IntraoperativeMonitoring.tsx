import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetIntraoperativeMonitoringListQuery, useGetOperationAnesthesiaInductionMonitoringListQuery, useSaveIntraoperativeMonitoringMutation, useSaveOperationRequestsMutation } from "@/services/operationService";
import { newApOperationIntraoperativeMonitoring, newApOperationRequests } from "@/types/model-types-constructor";
import { initialListRequest } from "@/types/types";
import { CheckOutline } from "@rsuite/icons";
import React, { useEffect, useState } from "react";
import { Col, Form, Row, Text } from "rsuite";
const IntraoperativeMonitoring = ({ operation }) => {
    const [operationReq, setOperationReq] = useState({ ...newApOperationRequests });
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
    const [saveOperation]=useSaveOperationRequestsMutation();

    useEffect(() => {
        setOperationReq(operation);
        if(operation.monitorSlot>0){
            setIsSaved(true)
        }
    }, [operation])
    const handelSave = async () => {
        try {
            await save({ ...monitor, period: operationReq.monitorSlot *( monitorings?.object?.length+1), operationRequestKey: operation?.key }).unwrap();
            refetch();
            setOpen(false)
        }
        catch (error) {

        }
    };
    const saveOperationSlot=async()=>{
         try{
                      await  saveOperation({...operationReq}).unwrap();
                        console.log("saved");
                        setIsSaved(true);
                    }
                    catch(error){

                    }

    }
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

    return (<Form fluid >
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
                <br/>
             
                 <CheckOutline color="green" onClick={saveOperationSlot}/>
                </Col>
            </Row>
           
           
            <div
                className="bt-right"
            >
                <MyButton
                    disabled={!operationReq.monitorSlot}
                    onClick={() => setOpen(true)} >Add</MyButton>

            </div>
        </div>
        <MyTable 
        data={monitorings?.object||[]}
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
                    <Col md={12}>
                        <MyInput
                            width="100%"
                            fieldType="number"
                            rightAddonwidth={60}
                            rightAddon="mmHg"
                            fieldName="etco2"
                            record={monitor}
                            setRecord={setMonitor}
                        /></Col>
                    <Col md={12}>
                        <MyInput
                            width="100%"
                            fieldType="number"
                            rightAddon="mL"
                            fieldName="fluidsGiven"
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
                        <Col md={1}>
                        <br/>
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
        ></MyModal>


    </Form>);
}
export default IntraoperativeMonitoring;