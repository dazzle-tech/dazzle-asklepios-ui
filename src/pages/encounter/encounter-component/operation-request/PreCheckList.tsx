import { useAppDispatch } from "@/hooks";
import React, { useState } from "react";
import { Col, Divider, Form, Row, Text } from "rsuite";
import MyInput from "@/components/MyInput";
import { newApPreOperationChecklist } from "@/types/model-types-constructor";
import { useSavePreOperationChecklistMutation } from "@/services/operationService";
import { notify } from "@/utils/uiReducerActions";
import MyButton from "@/components/MyButton/MyButton";

const PreCheckList = ({ operation, patient, encounter, user }) => {
    const dispatch = useAppDispatch();
    const [checkList, setCheckList] = useState({ ...newApPreOperationChecklist });
    
    const [save] = useSavePreOperationChecklistMutation();
    const handelSave = async () => {
        try {
            await save({ ...checkList, operationKey: operation?.object?.key, encounterKey: encounter?.key, patientKey: patient?.key, createdBy: user.key });
            dispatch(notify({ msg: "Saved Successfly", sev: "success" }));
        }
        catch (error) {
            dispatch(notify({ msg: "Saved Faild", sev: "error" }));

        }
    }
    const renderCheckboxes = (fields: string[]) => (
        <Row gutter={10}>
            {fields.map((field) => (
                <Col xs={24} sm={12} key={field} className="rows-gap">
                    <MyInput
                        fieldType="checkbox"
                        fieldName={field}
                        width="100%"
                        record={checkList}
                        setRecord={setCheckList}
                    />
                </Col>
            ))}
        </Row>
    );

    return (
        <Form fluid>
            <Row gutter={15}>

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
                                    "patientIdentityVerified",
                                    "consentSurgerySigned",
                                    "consentAnesthesiaSigned",
                                    "surgicalProcedureConfirmed",
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
                                    "siteOfSurgeryMarked",
                                    "npoStatusConfirmed",
                                    "preOpVitalsRecorded",
                                    "patientBathed",
                                    "jewelryRemoved",
                                    "denturesRemovedOrNoted",
                                    "prosthesisNotedOrRemoved",
                                    "clothingReplaced",
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
                                    "emrUpdated",
                                    "labsImagingReviewed",
                                    "consentFormsAvailable",
                                    "personalBelongingsSecured",
                                    "interpreterArranged",
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
                                    "allergiesReviewed",
                                    "preOpMedsGiven",
                                    "chronicMedsManaged",
                                    "anticoagulantsManaged",
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
                                    "ivAccessSecured",
                                    "ivFluidsStarted",
                                    "bloodProductsPrepared",
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
                                    "voidedOrCatheterPresent",
                                    "bedInLowestPosition",
                                    "transferModeArranged",
                                    "handoffToOrNursePrepared",
                                ])}
                            </div>
                        </Col>
                    </Row>
                </Col>
            </Row>

            <div className='bt-div'>
                <div className="bt-right">
                    <MyButton onClick={handelSave}>Save</MyButton>

                </div></div>
        </Form>
    );
};

export default PreCheckList;
