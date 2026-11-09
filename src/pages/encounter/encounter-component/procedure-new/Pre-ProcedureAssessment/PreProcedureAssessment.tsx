import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import SectionContainer from '@/components/SectionsoContainer/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';
import {
  useGetProcedurePreAssessmentQuery,
  useSaveProcedurePreAssessmentMutation
} from '@/services/patients/patientProcedureService';
import { useSortedLovQuery } from '../useSortedLovQuery';
import { notify } from '@/utils/uiReducerActions';
import { faFileWaveform, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Form, Text } from 'rsuite';
import DiagnosticsResult from '../../diagnostics-result/DiagnosticsResult';
import ProcedureVitalsFields from '../ProcedureVitalsFields';
import '../styles.less';
import { ProcedureStepHandle, useStepForm } from '../useStepForm';

const CHECKLIST = [
  'patientIdentityVerified',
  'consentConfirmed',
  'procedureSiteMarked',
  'allergiesConfirmed',
  'patientPremedicated',
  'equipmentCountingDone'
];

const PreProcedureAssessment = forwardRef<ProcedureStepHandle, any>(
  ({ procedure, patient, encounter, onDirtyChange }, ref) => {
    const dispatch = useAppDispatch();
    const [diagnosticTestResults, setDiagnosticTestResults] = useState(false);
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);

    const { data: savedAssessment } = useGetProcedurePreAssessmentQuery(procedure?.id, {
      skip: !procedure?.id
    });
    const [saveAssessment] = useSaveProcedurePreAssessmentMutation();
    const { data: airwayLovQueryResponse } = useSortedLovQuery('AIRWAY_GRADES');
    const { data: asaLovQueryResponse } = useSortedLovQuery('ASA_SCORE');
    const { form, setForm, markSaved } = useStepForm(savedAssessment, onDirtyChange);

    useImperativeHandle(ref, () => ({
      save: async () => {
        try {
          await saveAssessment({ id: procedure.id, body: form }).unwrap();
          markSaved();
          dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
          return true;
        } catch {
          dispatch(notify({ msg: 'Save failed', sev: 'error' }));
          return false;
        }
      }
    }));

    return (
      <div className="perform-columns">
        <div className="perform-step-body">
          <SectionContainer
            title={<Text>Preparation</Text>}
            content={
              <Form fluid>
                <div className="procedure-field-grid">
                  <MyInput
                    width="100%"
                    fieldType="checkbox"
                    fieldName="fastingRequired"
                    record={form}
                    setRecord={setForm}
                  />
                  <MyInput
                    width="100%"
                    fieldType="checkbox"
                    fieldName="patientPrepared"
                    record={form}
                    setRecord={setForm}
                  />
                </div>
                <MyInput
                  width="100%"
                  fieldType="textarea"
                  fieldName="specialInstructions"
                  record={form}
                  setRecord={setForm}
                />
              </Form>
            }
          />
          <SectionContainer
            title={<Text>Safety Checklist</Text>}
            content={
              <Form fluid>
                <div className="procedure-field-grid is-wide">
                  {CHECKLIST.map(fieldName => (
                    <MyInput
                      key={fieldName}
                      width="100%"
                      fieldType="check"
                      fieldName={fieldName}
                      record={form}
                      setRecord={setForm}
                      showLabel={false}
                    />
                  ))}
                </div>
              </Form>
            }
          />
        </div>

        <div className="perform-step-body">
          <ProcedureVitalsFields
            title="Pre-Procedure Vitals"
            record={form}
            setRecord={setForm}
          />
          <SectionContainer
            title={<Text>Pre Anesthesia</Text>}
            content={
              <Form fluid>
                <div className="procedure-field-grid">
                  <MyInput
                    width="100%"
                    selectData={asaLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    disableByField="isValid"
                    selectDataValue="lovDisplayVale"
                    fieldType="select"
                    fieldName="asaScore"
                    fieldLabel="ASA Score"
                    record={form}
                    setRecord={setForm}
                    searchable={false}
                  />
                  <MyInput
                    width="100%"
                    selectData={airwayLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    disableByField="isValid"
                    selectDataValue="lovDisplayVale"
                    fieldType="select"
                    fieldName="airwayGrade"
                    record={form}
                    setRecord={setForm}
                    searchable={false}
                  />
                </div>
              </Form>
            }
          />
          <SectionContainer
            title={<Text>Lab and Imaging Results</Text>}
            content={
              <div className="procedure-section-action">
                <MyButton
                  appearance="ghost"
                  prefixIcon={() => <FontAwesomeIcon icon={faPaperclip} />}
                  onClick={() => setAttachmentsModalOpen(true)}
                >
                  Attachments
                </MyButton>
                <MyButton
                  appearance="ghost"
                  onClick={() => setDiagnosticTestResults(true)}
                  prefixIcon={() => <FontAwesomeIcon icon={faFileWaveform} />}
                >
                  Open Results
                </MyButton>
              </div>
            }
          />
        </div>

        <MyModal
          open={attachmentsModalOpen}
          setOpen={setAttachmentsModalOpen}
          title="Attachments"
          size="lg"
          hideActionBtn
          content={
            <EncounterAttachment
              localEncounter={encounter}
              source="PROCEDURE_REQUEST_ATTACHMENT"
              sourceId={procedure?.id ? Number(procedure.id) : undefined}
              patientId={procedure?.patientId}
              refetchAttachmentList={false}
              setRefetchAttachmentList={() => {}}
            />
          }
        />
        <MyModal
          open={diagnosticTestResults}
          setOpen={setDiagnosticTestResults}
          content={<DiagnosticsResult patient={patient} encounter={encounter} />}
          title="Diagnostic Test Results"
          size="70vw"
          bodyheight="80vh"
        />
      </div>
    );
  }
);

export default PreProcedureAssessment;
