import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import { useAppDispatch } from "@/hooks";
import { useSavePostProcedureVitalsMutation } from "@/services/procedureService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import {  newApPostProcedureVitals } from "@/types/model-types-constructor";
import { notify } from "@/utils/uiReducerActions";
import { tr } from "date-fns/locale";
import { create } from "lodash";
import React, { useState } from "react";
import { Col, Divider, Form, Row, Text } from "rsuite";
const ProcedureVitals = ({ procedure, user }) => {
    const dispatch = useAppDispatch();
    const [vitals, setVitals] = useState({ ...newApPostProcedureVitals });
    const { data: numbersLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
    const { data: correctLovQueryResponse } = useGetLovValuesByCodeQuery('CORRECT_INCORRECT');
    const [saveVitals]=useSavePostProcedureVitalsMutation();
    const handleSave = async () => {
        try {
            const response = await saveVitals({...vitals, procedureKey: procedure.key, createdBy: user?.key }).unwrap();
             dispatch(notify({ msg: 'Saved Successfully', sev: "success" }));
        }catch (error) {
            dispatch(notify({ msg: 'Saved Faild', sev: "error" }));
        }}
    return (<>  <div className='container-form'>
        <div className='title-div'>
            <Text>Post-Procedure Vitals</Text>
        </div>
        <Divider />
        <Form fluid >
            <Row>
                <Col md={11}>
                    <MyInput
                        width="100%"
                        fieldType="number"
                        fieldName="bloodPressureSystolic"
                        record={vitals}
                        setRecord={setVitals} />
                </Col>
                <Col md={2}><div style={{ padding: '20px', paddingTop: '30px' }}>/</div></Col>
                <Col md={11}>
                    <MyInput
                        width="100%"
                        fieldType="number"
                        fieldName="bloodPressureDiastolic"
                        record={vitals}
                        setRecord={setVitals} />
                </Col>
            </Row>
            <Row>
                <Col md={11}>
                    <MyInput
                        width="100%"
                        fieldType="number"
                        fieldName="heartRate"
                        rightAddon="bpm"
                        rightAddonwidth={45}
                        record={vitals}
                        setRecord={setVitals} /></Col>
                <Col md={2}></Col>
                <Col md={11}>
                    <MyInput
                        width="100%"
                        fieldType="number"
                        rightAddon="C"
                        fieldName="temperature"
                        record={vitals}
                        setRecord={setVitals} /></Col>
            </Row>
            <Row>
                <Col md={11}>
                    <MyInput
                        width="100%"
                        fieldType="number"
                        rightAddon=" % "
                        fieldName="oxygenSaturation"
                        record={vitals}
                        setRecord={setVitals} />
                </Col>
                <Col md={2}></Col>
                <Col md={11}>
                    <MyInput
                        width="100%"
                        fieldType="checkbox"
                        fieldName="equipmentCountDone"
                        record={vitals}
                        setRecord={setVitals} />
                </Col>
            </Row>
            <Row>
                <Col md={11}>
                    <MyInput
                        width="100%"
                        fieldType="select"
                        selectData={numbersLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName="painScoreLkey"
                        record={vitals}
                        setRecord={setVitals} />
                </Col>
                <Col md={2}></Col>
                <Col md={11}>
                    <MyInput
                        width="100%"
                        fieldType="select"
                        selectData={correctLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName="countStatusLkey"
                        record={vitals}
                        setRecord={setVitals} />
                </Col>
            </Row>
            <Row>
                <Col md={11}>
                    <MyInput
                        width="100%"
                        fieldType="textarea"
                        fieldName="painDescription"
                        record={vitals}
                        setRecord={setVitals} />
                </Col>
                <Col md={2}></Col>
                <Col md={11}>
                    <MyInput
                        width="100%"
                        fieldType="textarea"
                        fieldName="recoveryNotes"
                        record={vitals}
                        setRecord={setVitals} />
                </Col>
            </Row>
            <Row>
                <Col md={11}>
                    <MyInput
                        width="100%"
                        fieldType="textarea"
                        fieldName="additionalObservations"
                        record={vitals}
                        setRecord={setVitals} />
                </Col>
                <Col md={2}></Col>
                <Col md={11}>
                 
                </Col>
            </Row>
        </Form>
          <div className='bt-div'>
                    <div className="bt-right">
                        <MyButton onClick={handleSave}>Save</MyButton>
                    </div>
                   </div>
    </div></>)
}
export default ProcedureVitals;