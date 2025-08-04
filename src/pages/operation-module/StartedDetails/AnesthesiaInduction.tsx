import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyTagInput from "@/components/MyTagInput/MyTagInput";
import { useAppDispatch } from "@/hooks";
import ActiveIngredient from "@/pages/encounter/encounter-component/drug-order/ActiveIngredient";
import GenericAdministeredMedications from "@/pages/encounter/encounter-component/procedure/Post-ProcedureCare/AdministeredMedications ";
import { useGetOperationInductionListQuery, useGetOperationPreMedicationListQuery, useSaveOperationAnesthesiaInductionMonitoringMutation, useSaveOperationInductionMutation, useSaveOperationPreMedicationMutation } from "@/services/operationService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { newApOperationAnesthesiaInductionMonitoring, newApOperationInduction, newApOperationPreMedication } from "@/types/model-types-constructor";
import { notify } from "@/utils/uiReducerActions";
import React, { useState } from "react";
import { Col, Divider, Form, Row, Text } from "rsuite";
import IntraoperativeMonitoring from "./IntraoperativeMonitoring";
import MyModal from "@/components/MyModal/MyModal";
import DrugOrder from "@/pages/encounter/encounter-component/drug-order";
const AnesthesiaInduction = ({ operation,patient,encounter }) => {
    const dispatch = useAppDispatch();
    const [anesthesiaInduction, setAnesthesiaInduction] = useState({ ...newApOperationAnesthesiaInductionMonitoring })
    const [tag, setTag] = useState([]);
    const[open,setOpen]=useState(false);
    const { data: anesthTypesLov } = useGetLovValuesByCodeQuery('ANESTH_TYPES');
    const { data: medadvirsedLov } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');
    const [save] = useSaveOperationAnesthesiaInductionMonitoringMutation();


    const handelSave = async () => {
        try {
            await save({
                ...anesthesiaInduction
                , operationRequestKey: operation?.key,
                monitorsConnected: joinValuesFromArray(tag),
                inductionStartTime: new Date(anesthesiaInduction.inductionStartTime).getTime()
            }).unwrap();
            dispatch(notify({ msg: "Saved Successfly", sev: "succss" }))
        } catch (error) {
            dispatch(notify({ msg: "Faild to Saved", sev: "error" }))
        }
    }
    const joinValuesFromArray = (values) => {
        return values?.filter(Boolean).join(', ');
    };
    return (<Form fluid >
        <Row>
            <Col md={12}>
                <Row>
                    <Col md={24}>
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Pre-Induction Checks</Text>

                            </div>
                            <Divider />
                            <Row>
                                <Col md={12}>
                                    <Row>
                                        <Col md={24}>
                                            <MyInput
                                                width="100%"
                                                fieldType="number"
                                                rightAddon="hours"
                                                rightAddonwidth={50}
                                                fieldName="fastingDuration"
                                                record={anesthesiaInduction}
                                                setRecord={setAnesthesiaInduction} />
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={24}></Col>
                                    </Row>
                                </Col>
                                <Col md={12}>
                                    <Row>
                                        <Col md={24}>
                                            <MyInput
                                                width="100%"
                                                unCheckedLabel="Not Established"
                                                checkedLabel="Established"
                                                fieldLabel="IV Line Established"
                                                fieldType="checkbox"
                                                fieldName="ivLineEstablished"
                                                record={anesthesiaInduction}
                                                setRecord={setAnesthesiaInduction}
                                            />
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={24}>
                                            <MyTagInput tags={tag} setTags={setTag} labelText="Monitors Connected" />
                                        </Col>
                                    </Row></Col>
                            </Row>

                        </div>
                    </Col>
                </Row>

                <GenericAdministeredMedications
                    title="Pre-Medication"
                    parentKey={operation?.key}
                    filterFieldName="operationRequestKey"
                    medicationService={{
                        useGetQuery: useGetOperationPreMedicationListQuery,
                        useSaveMutation: useSaveOperationPreMedicationMutation
                    }}

                    newMedicationTemplate={newApOperationPreMedication}
                />

            </Col>
            <Col md={12}>
                <Row>
                    <Col md={24}>
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text> Induction Details</Text>

                            </div>
                            <Divider />
                            <Row>
                                <Col md={12}>
                                    <Row >
                                        <Col md={24}>
                                            <MyInput
                                                disabled={true}
                                                fieldType="select"
                                                selectData={anesthTypesLov?.object ?? []}
                                                selectDataLabel="lovDisplayVale"
                                                selectDataValue="key"
                                                width="100%"
                                                fieldName="plannedAnesthesiaTypeLkey"
                                                record={operation}
                                                setRecord={() => ""}
                                            /></Col>
                                    </Row>
                                    <Row >
                                        <Col md={24}>
                                            <MyInput
                                                width="100%"
                                                fieldName="tubeSize"
                                                record={anesthesiaInduction}
                                                setRecord={setAnesthesiaInduction}
                                            />
                                        </Col>
                                    </Row>
                                    <Row >
                                        <Col md={24}>
                                            <MyInput
                                                width="100%"
                                                fieldType="checkbox"
                                                fieldName="intubationDone"
                                                record={anesthesiaInduction}
                                                setRecord={setAnesthesiaInduction} /></Col>
                                    </Row>
                                    <Row >

                                        {anesthesiaInduction.intubationDone &&
                                            <Col md={24}>
                                                <MyInput
                                                    width="100%"
                                                    fieldType="textarea"
                                                    fieldName="intubationDoneNote"
                                                    record={anesthesiaInduction}
                                                    setRecord={setAnesthesiaInduction}
                                                />
                                            </Col>}
                                    </Row>
                                </Col>
                                <Col md={12}>
                                    <Row >
                                        <Col md={24}>

                                            <MyInput
                                                width="100%"
                                                fieldType="time"
                                                fieldName="inductionStartTime"
                                                record={anesthesiaInduction}
                                                setRecord={setAnesthesiaInduction}
                                            /></Col>
                                    </Row>
                                    <Row >
                                        <Col md={24}> <MyInput
                                            width="100%"
                                            fieldName="tubeType"
                                            record={anesthesiaInduction}
                                            setRecord={setAnesthesiaInduction}
                                        /></Col>
                                    </Row>
                                    <Row >
                                        <Col md={24}> <MyInput
                                            width="100%"
                                            fieldName="securedBy"
                                            record={anesthesiaInduction}
                                            setRecord={setAnesthesiaInduction}
                                        /></Col>
                                    </Row></Col>
                            </Row>


                        </div>
                    </Col>
                </Row>


                <GenericAdministeredMedications
                    title="Induction Medications"
                    parentKey={operation?.key}
                    filterFieldName="operationRequestKey"
                    medicationService={{
                        useGetQuery: useGetOperationInductionListQuery,
                        useSaveMutation: useSaveOperationInductionMutation
                    }}

                    newMedicationTemplate={newApOperationInduction}
                />

            </Col>
        </Row>
        <Row>
            <Col md={24}>
                <div className='container-form'>
                    <div className='title-div'>
                        <Text>Intraoperative Monitoring</Text>

                    </div>
                    <Divider />

                 <IntraoperativeMonitoring operation={operation}/>
                </div>
            </Col>
        </Row>
        <Row>
            <Col md={24}>
                <div className='container-form'>
                    <div className='title-div'>
                        <Text>Events & Interventions</Text>

                    </div>
                    <Divider />
                    <Row>
                        <Col md={12}>
                            <MyInput
                                width="100%"
                                fieldType="check"
                                fieldName="surgeonNotified"
                                record={anesthesiaInduction}
                                setRecord={setAnesthesiaInduction}
                                showLabel={false}
                            /></Col>
                        <Col md={12}>
                            <MyInput
                                width="100%"
                                fieldType="select"
                                selectData={medadvirsedLov?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                fieldName="adverseEventsLkey"
                                record={anesthesiaInduction}
                                setRecord={setAnesthesiaInduction}
                            /></Col>

                    </Row>
                    <Row>
                        <Col md={12}>
                            <MyInput
                                width="100%"
                                fieldType="textarea"
                                fieldName="actionsTaken"
                                record={anesthesiaInduction}
                                setRecord={setAnesthesiaInduction}
                            /></Col>
                        <Col md={12}>
                            <MyInput
                                width="100%"
                                fieldType="textarea"
                                fieldName="adverseEventsNote"
                                record={anesthesiaInduction}
                                setRecord={setAnesthesiaInduction}
                            /></Col>

                    </Row>

                </div>
            </Col>
        </Row>
        <div className="bt-div">
            <div
                className="bt-right"
            >
                <MyButton >Complete</MyButton>
                <MyButton onClick={()=>setOpen(true)}>Drug Order</MyButton>
                <MyButton onClick={handelSave}>Save</MyButton>
            </div>
        </div>
        <MyModal 
        open={open}
        setOpen={setOpen}
        title={"Drug Order"}
        content={<DrugOrder patient={patient} encounter={encounter} edit={false} />} />
    </Form>)
}
export default AnesthesiaInduction;