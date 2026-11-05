import MyButton from '@/components/MyButton/MyButton';
import React, { useEffect, useState } from 'react';
import { Col, Form, Row, Text } from 'rsuite';
import '../styles.less';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer/SectionsoContainer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileWaveform, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import AttachmentUploadModal from '@/components/AttachmentUploadModal';
import {
  useGetProcedurePreAssessmentQuery,
  useSaveProcedurePreAssessmentMutation
} from '@/services/patients/patientProcedureService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import VitalSigns from '@/pages/medical-component/vital-signs/VitalSigns';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyModal from '@/components/MyModal/MyModal';
import DiagnosticsResult from '../../diagnostics-result/DiagnosticsResult';

const PreProcedureAssessment = ({ procedure, setActiveTab, patient }) => {
  const dispatch = useAppDispatch();
  const [procedureAssessment, setProocedureAssessment] = useState<any>({});
  const [diagnosticTestResults, setDiagnosticTestResults] = useState(false);

  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const { data: savedAssessment } = useGetProcedurePreAssessmentQuery(procedure?.id, {
    skip: !procedure?.id
  });
  const [saveAssessment] = useSaveProcedurePreAssessmentMutation();
  const { data: airwayLovQueryResponse } = useGetLovValuesByCodeQuery('AIRWAY_GRADES');
  const { data: asaLovQueryResponse } = useGetLovValuesByCodeQuery('ASA_SCORE');

  useEffect(() => {
    if (savedAssessment) setProocedureAssessment(savedAssessment);
  }, [savedAssessment]);

  const handleSave = async () => {
    try {
      await saveAssessment({ id: procedure.id, body: procedureAssessment }).unwrap();
      dispatch(notify({ msg: ' Saved successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: 'Saved failed', sev: 'error' }));
    }
  };

  const handleClear = () => {
    setProocedureAssessment({});
  };

  return (
    <>
      <Row gutter={15} className="d">
        <Form fluid>
          <Col md={12}>
            <Row>
              <SectionContainer
                title={<Text>Preparation</Text>}
                content={
                  <>
                    <Row>
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="fastingRequired"
                          record={procedureAssessment}
                          setRecord={setProocedureAssessment}
                        />
                      </Col>
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="checkbox"
                          fieldName="patientPrepared"
                          record={procedureAssessment}
                          setRecord={setProocedureAssessment}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col md={24}>
                        <MyInput
                          width="100%"
                          fieldType="textarea"
                          fieldName="specialInstructions"
                          record={procedureAssessment}
                          setRecord={setProocedureAssessment}
                        />
                      </Col>
                    </Row>
                  </>
                }
              />
            </Row>

            <Row>
              <SectionContainer
                title={<Text>Pre-Procedure Checklist</Text>}
                content={
                  <>
                    <Row>
                      <Col md={8}>
                        <MyInput
                          width="100%"
                          fieldType="check"
                          fieldName="patientIdentityVerified"
                          record={procedureAssessment}
                          setRecord={setProocedureAssessment}
                          showLabel={false}
                        />
                      </Col>
                      <Col md={8}>
                        <MyInput
                          width="100%"
                          fieldType="check"
                          fieldName="consentConfirmed"
                          record={procedureAssessment}
                          setRecord={setProocedureAssessment}
                          showLabel={false}
                        />
                      </Col>
                      <Col md={8}>
                        <MyInput
                          width="100%"
                          fieldType="check"
                          fieldName="procedureSiteMarked"
                          record={procedureAssessment}
                          setRecord={setProocedureAssessment}
                          showLabel={false}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col md={8}>
                        <MyInput
                          width="100%"
                          fieldType="check"
                          fieldName="allergiesConfirmed"
                          record={procedureAssessment}
                          setRecord={setProocedureAssessment}
                          showLabel={false}
                        />
                      </Col>
                      <Col md={8}>
                        <MyInput
                          width="100%"
                          fieldType="check"
                          fieldName="patientPremedicated"
                          record={procedureAssessment}
                          setRecord={setProocedureAssessment}
                          showLabel={false}
                        />
                      </Col>
                      <Col md={8}>
                        <MyInput
                          width="100%"
                          fieldType="check"
                          fieldName="equipmentCountingDone"
                          record={procedureAssessment}
                          setRecord={setProocedureAssessment}
                          showLabel={false}
                        />
                      </Col>
                    </Row>
                  </>
                }
              />
            </Row>
          </Col>

          <Col md={12}>
            <Row>
              <SectionContainer
                title={<Text>Pre-Procedure Vitals</Text>}
                content={
                  <VitalSigns object={procedureAssessment} setObject={setProocedureAssessment} />
                }
              />
            </Row>

            <Row>
              <SectionContainer
                title={<Text>Pre Anesthesia</Text>}
                content={
                  <Row>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        selectData={asaLovQueryResponse?.object ?? []}
                         selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                        selectDataValue="lovDisplayVale"
                        fieldType="select"
                        fieldName="asaScore"
                        fieldLabel="ASA Score"
                        record={procedureAssessment}
                        setRecord={setProocedureAssessment}
                        searchable={false}
                      />
                    </Col>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        selectData={airwayLovQueryResponse?.object ?? []}
                         selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                        selectDataValue="lovDisplayVale"
                        fieldType="select"
                        fieldName="airwayGrade"
                        record={procedureAssessment}
                        setRecord={setProocedureAssessment}
                        searchable={false}
                      />
                    </Col>
                  </Row>
                }
              />
            </Row>

            <Row>
              <SectionContainer
                title={<Text>Lab and Imaging Results</Text>}
                content={
                  <div className="container">
                    <MyButton
                      appearance="ghost"
                      prefixIcon={() => <FontAwesomeIcon icon={faPaperclip} />}
                      onClick={() => setAttachmentsModalOpen(true)}
                    >
                      Attachments File
                    </MyButton>
                    <MyButton
                      onClick={() => setDiagnosticTestResults(true)}
                      prefixIcon={() => <FontAwesomeIcon icon={faFileWaveform} />}
                    >
                      Open Results Screen
                    </MyButton>
                  </div>
                }
              />
            </Row>
          </Col>
        </Form>
      </Row>
      <div className="bt-div">
        <div className="bt-right">
          <MyButton onClick={handleClear}>Clear</MyButton>
          <MyButton onClick={handleSave}>Save</MyButton>
          <MyButton onClick={() => setActiveTab('3')}>Complete and Next</MyButton>
        </div>
      </div>

      <AttachmentUploadModal
        isOpen={attachmentsModalOpen}
        setIsOpen={setAttachmentsModalOpen}
        actionType={'add'}
        attachmentSource={procedure}
        attatchmentType="PROCEDURE_ASSESSMENT"
        patientKey={patient?.key}
      />
      <MyModal
        open={diagnosticTestResults}
        setOpen={setDiagnosticTestResults}
        content={<DiagnosticsResult />}
        title={'Diagnostic Test Results'}
        size="70vw"
        bodyheight="80vh"
      />
    </>
  );
};

export default PreProcedureAssessment;
