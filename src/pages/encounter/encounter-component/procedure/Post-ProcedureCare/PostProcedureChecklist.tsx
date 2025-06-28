import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import { useAppDispatch } from "@/hooks";
import { useSavePostProcedureCheckListMutation } from "@/services/procedureService";
import { newApPostProcedureChecklist } from "@/types/model-types-constructor";
import { notify } from "@/utils/uiReducerActions";
import { ms } from "date-fns/locale";
import React, { useState } from "react";
import { Col, Divider, Form, Row, Text } from "rsuite";
const PostProcedureChecklist = ({ procedure, user }) => {
    const dispatch = useAppDispatch();
    const [checklist, setChecklist] = useState({ ...newApPostProcedureChecklist });
    const [saveChecklist, saveChecklistMutation] = useSavePostProcedureCheckListMutation();
    const handleSave = async () => {
        try {
            const response = await saveChecklist({
                ...checklist,
                procedureKey: procedure?.key,
                createdBy: user?.key,
            }).unwrap();
            setChecklist(response);
            dispatch(notify({msg: "Checklist saved successfully", sev: "success"}));
        }
        catch (error) {
            
            dispatch(notify({ msg: "Error saving checklist", sev: "error" }));
            console.error("Error saving checklist:", error);
        }
    }

    return (<div className='container-form'>
        <div className='title-div'>
            <Text>Post-Procedure Checklist</Text>
        </div>
        <Divider />
        <Form fluid>
            <Row>
                 <MyInput
                width="100%"
                record={checklist}
                setRecord={setChecklist}
                fieldType="checkbox"
                fieldName="nauseaVomiting"/>
            </Row>
          
            <Row>
                <Col md={8}>
                    <MyInput
                        width="100%"
                        record={checklist}
                        setRecord={setChecklist}
                        fieldType="check"
                        fieldName="awakeAndOriented"
                        showLabel={false}
                    />
                </Col>
                <Col md={8}>
                    <MyInput
                        width="100%"
                        record={checklist}
                        setRecord={setChecklist}
                        fieldType="check"
                        fieldName="toleratingOralFluids"
                        showLabel={false}
                    />
                </Col>
                <Col md={8}>
                    <MyInput
                        width="100%"
                        record={checklist}
                        setRecord={setChecklist}
                        fieldType="check"
                        fieldName="ambulatingIndependently"
                        showLabel={false}
                    />
                </Col>
            </Row>
            <Row>
                <Col md={8}>
                    <MyInput
                        width="100%"
                        record={checklist}
                        setRecord={setChecklist}
                        fieldType="check"
                        fieldName="voidedUrine"
                        showLabel={false}
                    />
                </Col>
                <Col md={8}>

                    <MyInput
                        width="100%"
                        record={checklist}
                        setRecord={setChecklist}
                        fieldType="check"
                        fieldName="noActiveBleeding"
                        showLabel={false}
                    />
                </Col>
                <Col md={8}>
                    <MyInput
                        width="100%"
                        record={checklist}
                        setRecord={setChecklist}
                        fieldType="check"
                        fieldName="painScore4"
                        showLabel={false}
                    />
                </Col>
            </Row></Form>
            <MyButton
                className="save-button"
                onClick={handleSave}
                loading={saveChecklistMutation.isLoading}> Save</MyButton>
    </div>);
}
export default PostProcedureChecklist;