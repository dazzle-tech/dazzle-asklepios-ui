import MyButton from "@/components/MyButton/MyButton";
import React, { useState } from "react";
import { Col, Divider, Form, Row, Text } from "rsuite";
import '../styles.less';
import MyInput from "@/components/MyInput";
import { newApPreProcedureAssessment } from "@/types/model-types-constructor";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileWaveform, faPaperclip } from "@fortawesome/free-solid-svg-icons";
import AttachmentUploadModal from "@/components/AttachmentUploadModal";
import { useSavePreProcedureAssessmentMutation } from "@/services/procedureService";
import { notify } from "@/utils/uiReducerActions";
import { useAppDispatch } from "@/hooks";
const handleDownload = attachment => {
    const byteCharacters = atob(attachment.fileContent);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: attachment.contentType });

    // Create a temporary  element and trigger the download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = attachment.fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
};

const PreProcedureAssessment = ({ procedure, setActiveTab, user, patient }) => {
    const dispatch = useAppDispatch();
    const [procedureAssessment, setProocedureAssessment] = useState({ ...newApPreProcedureAssessment });
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const [saveAssessment] = useSavePreProcedureAssessmentMutation();


    const handleSave = async () => {
        try {
            saveAssessment({ ...procedureAssessment,procedureKey:procedure?.key }).unwrap();
            dispatch(notify({ msg: ' Saved successfully', sev: "success" }));

        }
        catch (error) {
            dispatch(notify({ msg: 'Saved failed', sev: 'error' }));
        }
    }
    const handleClear=()=>{
         setProocedureAssessment({...newApPreProcedureAssessment})
     }
     
    return (<>
        <Row gutter={15} className="d">
            <Form fluid>
                <Col md={12}>
                    <Row>
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Preparation </Text>

                            </div>
                            <Divider />
                            <Row>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="checkbox"
                                        fieldName="fastingRequired"
                                        record={procedureAssessment}
                                        setRecord={setProocedureAssessment} />
                                </Col>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldType="checkbox"
                                        fieldName="patientPrepared"
                                        record={procedureAssessment}
                                        setRecord={setProocedureAssessment} /></Col>
                            </Row>
                            <Row>
                                <Col md={24}>
                                    <MyInput
                                        width="100%"
                                        fieldType="textarea"
                                        fieldName="specialInstructions"
                                        record={procedureAssessment}
                                        setRecord={setProocedureAssessment}
                                    /></Col>
                            </Row>
                        </div>
                    </Row>
                    <Row>
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Pre-Procedure Checklist </Text>

                            </div>
                            <Divider />
                            <Row>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="patientIdentityVerified"
                                        record={procedureAssessment}
                                        setRecord={setProocedureAssessment}
                                        showLabel={false} />
                                </Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="consentConfirmed"
                                        record={procedureAssessment}
                                        setRecord={setProocedureAssessment}
                                        showLabel={false} /></Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="procedureSiteMarked"
                                        record={procedureAssessment}
                                        setRecord={setProocedureAssessment}
                                        showLabel={false} /></Col>
                            </Row>
                            <Row>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="allergiesConfirmed"
                                        record={procedureAssessment}
                                        setRecord={setProocedureAssessment}
                                        showLabel={false} /></Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="patientPremedicated"
                                        record={procedureAssessment}
                                        setRecord={setProocedureAssessment}
                                        showLabel={false} /></Col>
                                <Col md={8}>
                                    <MyInput
                                        width="100%"
                                        fieldType="check"
                                        fieldName="equipmentCountingDone"
                                        record={procedureAssessment}
                                        setRecord={setProocedureAssessment}
                                        showLabel={false} /></Col>
                            </Row>
                        </div>
                    </Row>
                </Col>
                <Col md={12}>
                    <Row>
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Pre-Procedure Vitals</Text>

                            </div>
                            <Divider /> 
                            <Row>
                                <Col md={11}>
                                    <MyInput
                                        width="100%"
                                        fieldType="number"
                                        fieldName="bloodPressureSystolic"
                                        record={procedureAssessment}
                                        setRecord={setProocedureAssessment} />
                                </Col>
                                <Col md={2}><div style={{ padding: '20px', paddingTop: '30px' }}>/</div></Col>
                                <Col md={11}>
                                    <MyInput
                                        width="100%"
                                        fieldType="number"
                                        fieldName="bloodPressureDiastolic"
                                        record={procedureAssessment}
                                        setRecord={setProocedureAssessment} />
                                </Col>
                            </Row>
                            <Row>
                                <Col md={11}>
                                    <MyInput
                                        width="100%"
                                        fieldType="number"
                                        fieldName="heartRate"
                                        rightAddon={"bpm"}
                                        rightAddonwidth={45}
                                        record={procedureAssessment}
                                        setRecord={setProocedureAssessment} /></Col>
                                <Col md={2}></Col>
                                <Col md={11}>
                                    <MyInput
                                        width="100%"
                                        fieldType="number"
                                        rightAddon={"C"}
                                        fieldName="temperature"
                                        record={procedureAssessment}
                                        setRecord={setProocedureAssessment} /></Col>
                            </Row>
                            <Row>
                                <Col md={11}>
                                    <MyInput
                                        width="100%"
                                        fieldType="number"
                                        rightAddon={" % "}
                                        fieldName="oxygenSaturation"
                                        record={procedureAssessment}
                                        setRecord={setProocedureAssessment} />
                                </Col>
                            </Row>
                            </div>
                    </Row>
                    <Row>
                        <div className='container-form'>
                            <div className='title-div'>
                                <Text>Lab and Imaging Results</Text>

                            </div>
                            <Divider />
                            <div className='container'>
                                <MyButton
                                    appearance="ghost"
                                    prefixIcon={() => <FontAwesomeIcon icon={faPaperclip} />}
                                    onClick={() => setAttachmentsModalOpen(true)}
                                >
                                    Attachments File
                                </MyButton>
                                <MyButton
                                    prefixIcon={() => <FontAwesomeIcon icon={faFileWaveform} />}
                                >Open Results Screen</MyButton>
                            </div>

                        </div>
                    </Row>
                </Col>
            </Form>


        </Row>
        <div className='bt-div'>

            <div className="bt-right">
                 <MyButton onClick={handleClear}>Clear</MyButton>
                <MyButton onClick={handleSave} >Save</MyButton>
                <MyButton onClick={() => setActiveTab("3")}>Complate and Next</MyButton>
            </div>
        </div>

        <AttachmentUploadModal
            isOpen={attachmentsModalOpen}
            setIsOpen={setAttachmentsModalOpen}
            actionType={'add'}
            // refecthData={attachmentRefetch}
            attachmentSource={procedure}
            attatchmentType="PROCEDURE_ASSESSMENT"
            patientKey={patient?.key} />
    </>)
}
export default PreProcedureAssessment;