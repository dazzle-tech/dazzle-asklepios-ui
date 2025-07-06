import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { newApFunctionalAssessment } from '@/types/model-types-constructor';
import { ApFunctionalAssessment } from '@/types/model-types';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';


const ViewFunctionalAssessment = ({ open, setOpen, functionalAssessmentObj }) => {
    const [functionalAssessment, setFunctionalAssessment] = useState<ApFunctionalAssessment>({ ...newApFunctionalAssessment });


    // Effects
    useEffect(() => {
        setFunctionalAssessment({ ...functionalAssessmentObj });
    }, [functionalAssessmentObj]);


    // Modal Content 
    const content = (
            <Form fluid layout='inline' disabled={true} >
                <MyInput
                    column
                    width={200}
                    fieldLable="Mobility / Ambulation"
                    fieldName="mobilityAmbulation"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Transferring (Bed ↔ Wheelchair)"
                    fieldName="transferringBedChair"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Stair Climbing Ability"
                    fieldName="stairClimbingAbility"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Feeding (Eating ability)"
                    fieldName="feeding"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Toileting Ability"
                    fieldName="toiletingAbility"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Dressing Ability"
                    fieldName="dressingAbility"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Bathing Ability"
                    fieldName="bathingAbility"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Grooming Ability"
                    fieldName="groomingAbility"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Walking Distance"
                    fieldName="walkingDistance"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Balance (Standing/Sitting)"
                    fieldName="balance"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Urinary Continence"
                    fieldName="urinaryContinence"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Bowel Continence"
                    fieldName="bowelContinence"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Use of Assistive Devices"
                    fieldName="useOfAssistiveDevices"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Need for Assistance in ADLs"
                    fieldName="needForAssistance"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Fall History"
                    fieldName="fallHistory"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Pain during Movement"
                    fieldName="painDuringMovement"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Need for Rehab/PT Referral"
                    fieldName="needForRehab"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={true} />
            </Form>
       
    )
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="View Functional Assessment"
            position='center'
            size='60vw'
            steps={[{
                title: "Functional Assessment",
                icon: <FontAwesomeIcon icon={faClipboardList} />,
            },]}
            content={content}
            hideActionBtn={true}
        ></MyModal>
    );
};
export default ViewFunctionalAssessment;