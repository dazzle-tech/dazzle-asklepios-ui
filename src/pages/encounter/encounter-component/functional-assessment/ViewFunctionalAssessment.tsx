import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { newApFunctionalAssessment } from '@/types/model-types-constructor';
import { ApFunctionalAssessment } from '@/types/model-types';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';

const ViewFunctionalAssessment = ({ open, setOpen, functionalAssessmentObj }) => {
    // Local state to store the current functional assessment data
    const [functionalAssessment, setFunctionalAssessment] = useState<ApFunctionalAssessment>({ ...newApFunctionalAssessment });

    // List of fields to display in the form
    // Each field contains: label (title), name (key in the object), and optionally unChecked/checked labels
    const fields = [
        { label: "Mobility / Ambulation", name: "mobilityAmbulation", unCheckedLabel: "Independent", checkedLabel: "Needs assistance" },
        { label: "Transferring (Bed ↔ Wheelchair)", name: "transferringBedChair", unCheckedLabel: "Independent", checkedLabel: "Needs assistance" },
        { label: "Stair Climbing Ability", name: "stairClimbingAbility", unCheckedLabel: "Independent", checkedLabel: "Needs assistance" },
        { label: "Feeding (Eating ability)", name: "feeding", unCheckedLabel: "Independent", checkedLabel: "Needs assistance" },
        { label: "Toileting Ability", name: "toiletingAbility", unCheckedLabel: "Independent", checkedLabel: "Needs assistance" },
        { label: "Dressing Ability", name: "dressingAbility", unCheckedLabel: "Independent", checkedLabel: "Needs assistance" },
        { label: "Bathing Ability", name: "bathingAbility", unCheckedLabel: "Independent", checkedLabel: "Needs assistance" },
        { label: "Grooming Ability", name: "groomingAbility", unCheckedLabel: "Independent", checkedLabel: "Needs assistance" },
        { label: "Walking Distance", name: "walkingDistance", unCheckedLabel: "Unlimited", checkedLabel: "Limited" },
        { label: "Balance (Standing/Sitting)", name: "balance", unCheckedLabel: "Stable", checkedLabel: "Unable" },
        { label: "Urinary Continence", name: "urinaryContinence" },
        { label: "Bowel Continence", name: "bowelContinence" },
        { label: "Use of Assistive Devices", name: "useOfAssistiveDevices" },
        { label: "Need for Assistance in ADLs", name: "needForAssistance" },
        { label: "Fall History", name: "fallHistory" },
        { label: "Pain during Movement", name: "painDuringMovement" },
        { label: "Need for Rehab/PT Referral", name: "needForRehab" },
    ];


    // Modal content
    // Only display fields that have a truthy value (checked)
    const content = (
        <Form fluid layout='inline' disabled>
            {fields
                .filter(field => functionalAssessment[field.name])
                .map((field, idx) => (
                    <MyInput
                        key={idx}
                        column
                        width={200}
                        fieldLable={field.label}
                        fieldName={field.name}
                        fieldType="checkbox"
                        record={functionalAssessment}
                        setRecord={setFunctionalAssessment}
                        disabled={true}
                        unCheckedLabel={field.unCheckedLabel}
                        checkedLabel={field.checkedLabel}
                    />
                ))}
        </Form>
    );

    // Effects
    useEffect(() => {
        setFunctionalAssessment({ ...functionalAssessmentObj });
    }, [functionalAssessmentObj]);

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
            }]}
            content={content}
            hideActionBtn={true}
        />
    );
};

export default ViewFunctionalAssessment;
