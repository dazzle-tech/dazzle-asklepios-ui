import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import { useAppDispatch } from "@/hooks";
import GenericAdministeredMedications from "@/pages/encounter/encounter-component/procedure/Post-ProcedureCare/AdministeredMedications ";
import { useGetAntimicrobialProphylaxisGivenListQuery, useSaveAntimicrobialProphylaxisGivenMutation, useSaveSurgicalPreparationIncisionMutation } from "@/services/operationService";
import { useGetLovValuesByCodeQuery, useGetUsersQuery } from "@/services/setupService";
import { newApOperationAntimicrobialProphylaxisGiven, newApOperationSurgicalPreparationIncision } from "@/types/model-types-constructor";
import { initialListRequest } from "@/types/types";
import { notify } from "@/utils/uiReducerActions";
import React, { useState } from "react";
import { Col, Divider, Form, Row, Text } from "rsuite";
const SurgicalPreparation = ({ operation }) => {
    const dispatch = useAppDispatch();
    const [surgical, setSergical] = useState({ ...newApOperationSurgicalPreparationIncision });

    const { data: positionLovQueryResponse } = useGetLovValuesByCodeQuery('OPERATION_POSITION');

    const [save] = useSaveSurgicalPreparationIncisionMutation();
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


    const handleSave = async () => {
        try {
            await save({ ...surgical, operationRequestKey: operation.key
                ,siteDriedTime:new Date(surgical.siteDriedTime).getTime(),
                timeOfIncision:new Date(surgical.timeOfIncision).getTime(),
                skinOpenedTime:new Date(surgical.skinOpenedTime).getTime()
             }).unwrap();
            dispatch(notify({ msg: "Saved Successfly", sev: "success" }));
        }
        catch (error) {
            dispatch(notify({ msg: "Faild to Save", sev: "error" }));
        }
    }
    return (<Form fluid>
        <Row gutter={15}>
            <Col md={12}>
                <Row>
                    <Col md={24} >
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Patient Preparation</Text>
                            </div>
                            <Divider />
                            <Row>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldName="surgicalSitePreppedWith"
                                        record={surgical}
                                        setRecord={setSergical}
                                    />
                                </Col>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="time"
                                        fieldLabel="Site Dried Time"
                                        fieldName="siteDriedTime"
                                        record={surgical}
                                        setRecord={setSergical}
                                    /></Col>
                            </Row>
                            <Row>
                                <Col md={12}><MyInput
                                    width="100%"

                                    fieldType="select"

                                    selectData={positionLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName="positionLkey"
                                    record={surgical}
                                    setRecord={setSergical}
                                /></Col>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Site Prep Completed By"
                                        selectData={userList?.object ?? []}
                                        selectDataLabel="username"
                                        selectDataValue="key"
                                        fieldName="sitePrepCompletedKey"
                                        record={surgical}
                                        setRecord={setSergical}
                                    />
                                </Col>
                            </Row>
                            <Row>
                                <Col md={12}><MyInput
                                    width="100%"
                                    fieldType="check"
                                    fieldName="paddingSafetyApplied"
                                    record={surgical}
                                    setRecord={setSergical}
                                    showLabel={false}
                                /></Col>

                            </Row>


                        </div></Col>

                </Row>


                <GenericAdministeredMedications
                    title="Antimicrobial Prophylaxis Given"
                    parentKey={operation?.key}
                    filterFieldName="operationRequestKey"
                    medicationService={{
                        useGetQuery: useGetAntimicrobialProphylaxisGivenListQuery,
                        useSaveMutation: useSaveAntimicrobialProphylaxisGivenMutation
                    }}

                    newMedicationTemplate={newApOperationAntimicrobialProphylaxisGiven}
                />

            </Col>
            <Col md={12}>
                <Row>
                    <Col md={24} >
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Instruments & Implants Verification</Text>
                            </div>
                            <Divider />
                            <Row>
                                <Col md={8}><MyInput
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="First Instrument Count By"
                                    selectData={userList?.object ?? []}
                                    selectDataLabel="username"
                                    selectDataValue="key"
                                    fieldName="firstInstrumentCountKey"
                                    record={surgical}
                                    setRecord={setSergical}
                                /></Col>
                                <Col md={8}><MyInput
                                    width="100%"
                                    fieldType="check"
                                    fieldName="instrumentCountStarted"
                                    record={surgical}
                                    setRecord={setSergical}
                                    showLabel={false}
                                /></Col>
                                <Col md={8}><MyInput
                                    width="100%"
                                    fieldType="check"
                                    fieldName="implantsReady"
                                    record={surgical}
                                    setRecord={setSergical}
                                    showLabel={false}
                                /></Col>
                            </Row>
                            <Row>
                                <Col md={8}><MyInput
                                    width="100%"
                                    fieldType="check"
                                    fieldName="implantsBarcodeScanned"
                                    record={surgical}
                                    setRecord={setSergical}
                                    showLabel={false}
                                /></Col>
                                <Col md={8}><MyInput
                                    width="100%"
                                    fieldType="check"
                                    fieldName="sterilityConfirmed"
                                    record={surgical}
                                    setRecord={setSergical}
                                    showLabel={false}
                                /></Col>
                                <Col md={8}><MyInput
                                    width="100%"
                                    fieldType="check"
                                    fieldName="disposableDevicesReady"
                                    record={surgical}
                                    setRecord={setSergical}
                                    showLabel={false}
                                /></Col>
                            </Row>


                        </div></Col>

                </Row>
                <Row>
                    <Col md={24} >
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Surgical Start & Incision</Text>
                            </div>
                            <Divider />
                            <Row>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="time"

                                        fieldName="timeOfIncision"
                                        record={surgical}
                                        setRecord={setSergical}
                                    />
                                </Col>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="time"

                                        fieldName="skinOpenedTime"
                                        record={surgical}
                                        setRecord={setSergical}
                                    /></Col>
                            </Row>
                            <Row>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="Surgical Start Marked By"
                                        selectData={userList?.object ?? []}
                                        selectDataLabel="username"
                                        selectDataValue="key"
                                        fieldName="surgicalStartMarkedKey"
                                        record={surgical}
                                        setRecord={setSergical}
                                    /></Col>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldName="estimatedSurgeryDuration"
                                        record={surgical}
                                        setRecord={setSergical}
                                    />
                                </Col>
                            </Row>


                        </div></Col>

                </Row></Col>
        </Row>
             <div className='bt-div'>
            <div className="bt-right">
                <MyButton onClick={handleSave}>Save</MyButton>
              
            </div></div>
    </Form>);
}
export default SurgicalPreparation;