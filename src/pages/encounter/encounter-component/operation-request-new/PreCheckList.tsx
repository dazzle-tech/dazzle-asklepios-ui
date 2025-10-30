import { useAppDispatch } from "@/hooks";
import React, { useEffect, useState } from "react";
import { Col, Divider, Form, Row, Text } from "rsuite";
import MyInput from "@/components/MyInput";
import { newApPreOperationChecklist } from "@/types/model-types-constructor";
import { useGetLatestChecklistByOperationKeyQuery, useSavePreOperationChecklistMutation } from "@/services/operationService";
import { notify } from "@/utils/uiReducerActions";
import MyButton from "@/components/MyButton/MyButton";
import clsx from "clsx";

const PreCheckList = ({ operation, patient, encounter, user, disabled: disabled = false }) => {
    const dispatch = useAppDispatch();
    const [checkList, setCheckList] = useState({
        ...newApPreOperationChecklist,

    });

    const { data: checklists } = useGetLatestChecklistByOperationKeyQuery(operation?.key);

    const [save] = useSavePreOperationChecklistMutation();


    useEffect(() => {
        if (checklists?.object) {
            setCheckList(checklists.object);
        } else {
            setCheckList({ ...newApPreOperationChecklist });
        }
    }, [checklists]);
    const handelSave = async () => {
        try {
            await save({ ...checkList, operationKey: operation?.object?.key, encounterKey: encounter?.key, patientKey: patient?.key, createdBy: user.key });
            dispatch(notify({ msg: "Saved Successfly", sev: "success" }));
        }
        catch (error) {
            dispatch(notify({ msg: "Saved Faild", sev: "error" }));

        }
    }
    const renderCheckboxes = (fields: { fieldName: string; label: string }[]) => (
        <Row gutter={10}>
            {fields.map(({ fieldName, label }) => (
                <Col xs={24} sm={12} key={fieldName} className="rows-gap">
                    {label ? (
                        <MyInput
                            showLabel={false}
                            label={label}
                            fieldType="check"
                            fieldName={fieldName}
                            width="100%"
                            record={checkList}
                            setRecord={setCheckList}
                        />
                    ) : (
                        <MyInput
                            showLabel={false}
                            fieldType="check"
                            fieldName={fieldName}
                            width="100%"
                            record={checkList}
                            setRecord={setCheckList}
                        />
                    )}
                </Col>
            ))}
        </Row>
    );


    return (
        <Form fluid  >
            <Row gutter={15} className={clsx('', {
                'disabled-panel': disabled
            })}>

                <Col xs={24} sm={24} md={12}>
                    <Row gutter={10}>
                        {/* Patient Identification & Consent */}
                        <Col xs={24} className="rows-gap">
                            <div className="container-form">
                                <div className="title-div">
                                    <Text>Patient Identification & Consent</Text>
                                </div>
                                <Divider />
                                {renderCheckboxes([
                                    { fieldName: "patientIdentityVerified", label: "Patient Identity Verifieddd" },
                                    { fieldName: "consentSurgerySigned", label: "Surgery Consent Signed" },
                                    { fieldName: "consentAnesthesiaSigned", label: "Anesthesia Consent Signed" },
                                    { fieldName: "surgicalProcedureConfirmed", label: "Surgical Procedure Confirmed" },
                                ])}

                            </div>
                        </Col>

                        {/* Pre-Surgical Readiness */}
                        <Col xs={24} className="rows-gap">
                            <div className="container-form">
                                <div className="title-div">
                                    <Text>Pre-Surgical Readiness</Text>
                                </div>
                                <Divider />
                                {renderCheckboxes([
                                    { fieldName: "siteOfSurgeryMarked", label: "Site Of Surgery Marked" },
                                    { fieldName: "npoStatusConfirmed", label: "NPO Status Confirmed" },
                                    { fieldName: "preOpVitalsRecorded", label: "Pre-Op Vitals Recorded" },
                                    { fieldName: "patientBathed", label: "Patient Bathed" },
                                    { fieldName: "jewelryRemoved", label: "Jewelry Removed" },
                                    { fieldName: "denturesRemovedOrNoted", label: "Dentures Removed or Noted" },
                                    { fieldName: "prosthesisNotedOrRemoved", label: "Prosthesis Noted or Removed" },
                                    { fieldName: "clothingReplaced", label: "Clothing Replaced" },
                                ])}

                            </div>
                        </Col>

                        {/* Documentation & Equipment */}
                        <Col xs={24} className="rows-gap">
                            <div className="container-form">
                                <div className="title-div">
                                    <Text>Documentation & Equipment</Text>
                                </div>
                                <Divider />
                                {renderCheckboxes([
                                    { fieldName: "emrUpdated", label: "EMR Updated" },
                                    { fieldName: "labsImagingReviewed", label: "Labs/Imaging Reviewed" },
                                    { fieldName: "consentFormsAvailable", label: "Consent Forms Available" },
                                    { fieldName: "personalBelongingsSecured", label: "Personal Belongings Secured" },
                                    { fieldName: "interpreterArranged", label: "Interpreter Arranged" },
                                ])}

                            </div>
                        </Col>
                    </Row>
                </Col>


                <Col xs={24} sm={24} md={12}>
                    <Row gutter={10}>
                        {/* Medications & Allergies */}
                        <Col xs={24} className="rows-gap">
                            <div className="container-form">
                                <div className="title-div">
                                    <Text>Medications & Allergies</Text>
                                </div>
                                <Divider />

                                {renderCheckboxes([
                                    { fieldName: "allergiesReviewed", label: "Allergies Reviewed" },
                                    { fieldName: "preOpMedsGiven", label: "Pre-Op Meds Given" },
                                    { fieldName: "chronicMedsManaged", label: "Chronic Meds Managed" },
                                    { fieldName: "anticoagulantsManaged", label: "Anticoagulants Managed" },

                                ])}
                            </div>
                        </Col>

                        {/* IV & Fluids */}
                        <Col xs={24} className="rows-gap">
                            <div className="container-form">
                                <div className="title-div">
                                    <Text>IV & Fluids</Text>
                                </div>
                                <Divider />

                                {renderCheckboxes([
                                    { fieldName: "ivAccessSecured", label: "IV AccessSecured" },
                                    { fieldName: "ivFluidsStarted", label: "IV FluidsStarted" },
                                    { fieldName: "bloodProductsPrepared", label: null }

                                ])}
                            </div>
                        </Col>

                        {/* Pre-Transfer Readiness */}
                        <Col xs={24} className="rows-gap">
                            <div className="container-form">
                                <div className="title-div">
                                    <Text>Pre-Transfer Readiness</Text>
                                </div>
                                <Divider />
                              
                                {renderCheckboxes([
                                    {fieldName:"voidedOrCatheterPresent",label:null},
                                    {fieldName:"bedInLowestPosition",label:null},
                                    {fieldName:"transferModeArranged",label:null},
                                    {fieldName:"handoffToOrNursePrepared",label:null},
                                ])}
                            </div>
                        </Col>
                    </Row>
                </Col>
            </Row>

            {(!disabled) && <div className='bt-div'>
                <div className="bt-right">
                    <MyButton onClick={handelSave}>Save</MyButton>

                </div></div>}
        </Form>
    );
};

export default PreCheckList;
