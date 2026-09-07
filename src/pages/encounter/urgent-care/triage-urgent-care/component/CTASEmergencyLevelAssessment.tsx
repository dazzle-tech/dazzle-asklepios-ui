import React from "react";
import "../../styles.less";
import { Form } from "rsuite";
import MyInput from "@/components/MyInput";
import MyButton from "@/components/MyButton/MyButton";
import SectionContainer from "@/components/SectionsoContainer";
import { useEnumOptions } from "@/services/enumsApi";
import Translate from "@/components/Translate";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";

type EmergencyLevelAssessmentProps = {
    triage: any;
    setTriage: (next: any) => void;
    onSave: () => void;
    readOnly?: boolean;
};

const CTASEmergencyLevelAssessment = ({
    triage,
    setTriage,
    onSave,
    readOnly = false,
}: EmergencyLevelAssessmentProps) => {
    const dispatch = useAppDispatch();

    const emergencyLevelEnum = useEnumOptions('EmergencyLevel');

    const isBlank = (v: any) => v == null || String(v).trim() === "";
    const handleSave = () => {
        if (readOnly) return;
        if (isBlank(triage?.emergencyLevel)) {
            dispatch(
                notify({
                    msg: "Please fill required field: Emergency Level Required",
                    sev: "error",
                })
            );
            return;
        }
        onSave();
    };



    return (
        <SectionContainer
            title="CTAS Levels"
            content={
                <Form fluid layout="inline" className="form-inline-wrap">
                    <MyInput
                        height={35}
                        width={'11.5vw'}
                        column
                        fieldType="select"
                        fieldName="emergencyLevel"
                        selectData={emergencyLevelEnum ?? []}
                        selectDataLabel="label"
                        selectDataValue="value"
                        record={triage}
                        setRecord={setTriage}
                        required
                    />

                    {!readOnly && (
                        <MyButton onClick={handleSave} appearance="primary">
                            <Translate> Save </Translate>
                        </MyButton>
                    )}
                </Form>

            }
        />
    );
};

export default CTASEmergencyLevelAssessment;


