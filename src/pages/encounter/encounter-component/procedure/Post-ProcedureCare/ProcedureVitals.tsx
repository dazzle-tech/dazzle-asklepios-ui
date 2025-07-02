import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import { useAppDispatch } from "@/hooks";
import VitalSigns from "@/pages/medical-component/vital-signs/VitalSigns";
import { useSavePostProcedureVitalsMutation } from "@/services/procedureService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { newApPostProcedureVitals } from "@/types/model-types-constructor";
import { notify } from "@/utils/uiReducerActions";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Col, Divider, Form, Row, Text } from "rsuite";
export type VitalRef = {
    handleSave: () => void;
};
type VitalProps = {
    procedure: any,
    user: any
};
const ProcedureVitals = forwardRef<VitalRef, VitalProps>(({ procedure, user }, ref) => {
    const dispatch = useAppDispatch();
    const [vitals, setVitals] = useState({ ...newApPostProcedureVitals });
    const { data: numbersLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
    const { data: correctLovQueryResponse } = useGetLovValuesByCodeQuery('CORRECT_INCORRECT');
    const [saveVitals] = useSavePostProcedureVitalsMutation();
    const handleSave = async () => {
        try {
            const response = await saveVitals({ ...vitals, procedureKey: procedure.key, createdBy: user?.key }).unwrap();
            dispatch(notify({ msg: 'Saved Successfully', sev: "success" }));
        } catch (error) {
            dispatch(notify({ msg: 'Saved Faild', sev: "error" }));
        }
    };
    useImperativeHandle(ref, () => ({
        handleSave
    }));
    return (<>  <div className='container-form'  ref={ref}>
        <div className='title-div'>
            <Text>Post-Procedure Vitals</Text>
        </div>
        <Divider />
        <VitalSigns setObject={setVitals} object={vitals} />
        <Form fluid >


            <Row>
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
                        fieldType="textarea"
                        fieldName="additionalObservations"
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

        </Form>
     
    </div></>)
});
export default ProcedureVitals;