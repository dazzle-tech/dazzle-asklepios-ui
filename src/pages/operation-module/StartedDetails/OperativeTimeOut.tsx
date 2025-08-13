import React, { useEffect, useState } from "react";
import {
    useGetOperativeTimeoutByOperationQuery,
    useGetPreOperativeTimeoutQuery,
    useSavePreOperativeTimeoutMutation
} from '@/services/operationService';
import { useAppDispatch } from "@/hooks";
import { Col, Divider, Form, Row, Text } from "rsuite";
import MyInput from "@/components/MyInput";
import { newApPreOperativeTimeout } from "@/types/model-types-constructor";
import { useGetUsersQuery } from "@/services/setupService";
import { initialListRequest } from "@/types/types";
import { notify } from "@/utils/uiReducerActions";
import MyButton from "@/components/MyButton/MyButton";
import clsx from "clsx";
const OperativeTimeOut = ({operation ,refetch ,editable}) => {
    const dispatch = useAppDispatch();
    const [timeout, setTimeOut] = useState({ ...newApPreOperativeTimeout });
    const { data: timeoutData } = useGetOperativeTimeoutByOperationQuery(operation?.key, {
        skip: !operation?.key,
        refetchOnMountOrArgChange: true
    });

    const { data: userList } = useGetUsersQuery({ ...initialListRequest });
    const [save] = useSavePreOperativeTimeoutMutation();

    useEffect(() => {
        if (timeoutData) {
            setTimeOut({...timeoutData?.object, 
            timeoutStartTime:timeout.timeoutStartTime? new Date(timeoutData?.object?.timeoutStartTime):null });
        }   
    }, [timeoutData]);

   const handleSave=async()=>{
    try{
      const Response= await save({...timeout,operationRequestKey:operation?.key,timeoutStartTime:new Date(timeout.timeoutStartTime).getTime()});
        refetch();
       dispatch(notify({msg:"Saved Successfly",sev:"success"}));
    }
    catch(error){
        dispatch(notify({msg:"Faild to Save",sev:"error"}));
         
    }
   }
    return (<Form fluid className={clsx('', {
                                                            'disabled-panel': !editable
                                                          })}>
        <Row gutter={15}>
            <Col md={12}>
                <Row>
                    <Col md={24}>
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Patient & Procedure Confirmation</Text>

                            </div>
                            <Divider />
                            <Row>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="patientIdentityConfirmed"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                        showLabel={false}
                                    />
                                </Col>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="surgicalSiteConfirmed"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                        showLabel={false}
                                    /></Col>
                            </Row>
                            <Row>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="procedureConfirmed"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                        showLabel={false}
                                    /></Col>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="consentFormPresent"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                        showLabel={false}
                                    /></Col>
                            </Row>

                        </div>
                    </Col>
                </Row>





                <Row>
                    <Col md={24}>
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Anesthesia Safety Check</Text>

                            </div>
                            <Divider />
                            <Row>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="anesthesiaMachineChecked"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                        showLabel={false}
                                    /></Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="medicationPrepared"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                        showLabel={false}
                                    /></Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="allergyRiskReviewed"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                        showLabel={false}
                                    /></Col>
                            </Row>
                            <Row>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="checkbox"
                                        fieldName="difficultAirwayRisk"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                    />
                                </Col>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="checkbox"
                                        fieldLabel="ASA Classification"
                                        fieldName="asaClassification"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                    /></Col>
                            </Row>


                        </div>
                    </Col>
                </Row>

            </Col>
            <Col md={12}>
                <Row>
                    <Col md={24}>
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Start of Time-Out</Text>

                            </div>
                            <Divider />
                            <Row>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="time"
                                        fieldName="timeoutStartTime"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                    />
                                </Col>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="select"
                                        fieldLabel="User"
                                        selectData={userList?.object ?? []}
                                        selectDataLabel="username"
                                        selectDataValue="key"
                                        fieldName="initiatedBy"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                    />
                                </Col>

                            </Row>

                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col md={24}>
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Team Introduction</Text>

                            </div>
                            <Divider />
                            <Row>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="teamIntroductionComplete"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                        showLabel={false}
                                    />

                                </Col></Row>
                            <Row>
                                <Col md={24}>
                                    <MyInput
                                    width="100%"
                                        fieldType="textarea"
                                        fieldName="specialConcerns"
                                        record={timeout}
                                        setRecord={setTimeOut}

                                    />

                                </Col>

                            </Row>
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col md={24}>
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Surgical Safety</Text>

                            </div>
                            <Divider />
                              <Row>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="equipmentAvailable"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                        showLabel={false}
                                    /></Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="bloodUnitsAvailable"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                        showLabel={false}
                                    /></Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="bloodLossExpected"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                        showLabel={false}
                                        
                                    /></Col>
                            </Row>
                            <Row>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="instrumentCountPrepared"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                        showLabel={false}
                                    />
                                </Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="imagingDisplayed"
                                        record={timeout}
                                        setRecord={setTimeOut}
                                        showLabel={false}
                                    /></Col>
                            </Row>

                        </div>
                    </Col>
                </Row>
            </Col>
        </Row>
         <div className='bt-div'>
            <div className="bt-right">
                <MyButton onClick={handleSave}>Save</MyButton>
              
            </div></div>
    </Form>)
}
export default OperativeTimeOut;