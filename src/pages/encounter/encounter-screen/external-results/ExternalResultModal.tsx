import React, { useEffect, useRef, useState } from 'react';
import { FaMagic } from 'react-icons/fa';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { extractErrorMessage } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import {
  ExternalDocumentType,
  ExternalLabResultData,
  ExternalLabResultEntry,
  ExternalRadiologyReportData,
  ExternalRadiologyReportEntry,
  Patient,
  PatientEncounter,
  ProcessExternalDocumentResponse
} from '@/types/model-types-new';
import { useProcessExternalDocumentMutation } from '@/services/ai-services/externalDocumentService';
import {
  useSaveExternalLabResultsMutation,
  useSaveExternalRadiologyReportsMutation
} from '@/services/patients/externalResultService';
import { ExternalLabResultsEditor, ExternalRadiologyReportsEditor, isCriticalMarker } from './ExternalResultView';
import {
  ErrorStep,
  ExtractedText,
  MismatchStep,
  OutdatedStep,
  PatientCard,
  UnreadableStep,
  UploadStep,
  validateFile,
  WaitingStep
} from './ExternalResultSteps';
import './styles.less';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  patient?: Patient;
  encounter?: PatientEncounter;
};

type Phase = 'upload' | 'waiting' | 'review' | 'mismatch' | 'outdated' | 'unreadable' | 'error';

const SLOW_HINT_MS = 15000;

const phaseOf = (response: ProcessExternalDocumentResponse): Phase => {
  if (response.status === 'processed') return 'review';
  if (response.status === 'irrelevant') return 'outdated';
  return response.processingMetadata?.stage === 'patient_validation' ? 'mismatch' : 'unreadable';
};

const ExternalResultModal: React.FC<Props> = ({ open, setOpen, patient, encounter }) => {
  const dispatch = useAppDispatch();
  const [processExternalDocument] = useProcessExternalDocumentMutation();
  const [saveLabResults, { isLoading: isSavingLab }] = useSaveExternalLabResultsMutation();
  const [saveRadiologyReports, { isLoading: isSavingRadiology }] = useSaveExternalRadiologyReportsMutation();

  const requestRef = useRef<{ abort: () => void } | null>(null);
  const [phase, setPhase] = useState<Phase>('upload');
  const [slow, setSlow] = useState(false);
  const [documentType, setDocumentType] = useState<ExternalDocumentType>('LAB');
  const [translate, setTranslate] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState('');
  const [result, setResult] = useState<ProcessExternalDocumentResponse | null>(null);
  // Editable copies of what the AI extracted; these are what gets saved
  const [labRows, setLabRows] = useState<ExternalLabResultEntry[]>([]);
  const [radiologyReports, setRadiologyReports] = useState<ExternalRadiologyReportEntry[]>([]);

  const isSaving = isSavingLab || isSavingRadiology;
  const isLab = result?.structuredData?.documentType === 'lab_result';
  const canSave = (isLab ? labRows.length > 0 : radiologyReports.length > 0) && !isSaving;
  const criticalCount = isLab
    ? labRows.filter(row => isCriticalMarker(row.marker)).length
    : radiologyReports.filter(report => report.severity === 'CRITICAL').length;

  const cancelRequest = () => {
    requestRef.current?.abort();
    requestRef.current = null;
  };

  const startOver = () => {
    setFile(null);
    setFileError(null);
    setResult(null);
    setLabRows([]);
    setRadiologyReports([]);
    setPhase('upload');
  };

  // Every time the popup opens it starts clean; closing it stops a running request
  useEffect(() => {
    if (open) {
      startOver();
      setDocumentType('LAB');
      setTranslate(false);
      setTargetLanguage('en');
    } else {
      cancelRequest();
    }
  }, [open]);

  useEffect(() => {
    setSlow(false);
    if (phase !== 'waiting') return;
    const timer = setTimeout(() => setSlow(true), SLOW_HINT_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleFile = (selected: File | null) => {
    const error = selected ? validateFile(selected) : null;
    setFileError(error);
    setFile(error ? null : selected);
  };

  const handleProcess = async () => {
    if (!file || !patient?.id) return;
    setPhase('waiting');

    const request = processExternalDocument({
      file,
      documentType,
      patientId: Number(patient.id),
      translate,
      targetLanguage
    });
    requestRef.current = request;

    try {
      const response = await request.unwrap();
      if (requestRef.current !== request) return;

      const data = response.structuredData;
      setResult(response);
      setLabRows(data?.documentType === 'lab_result' ? [...((data as ExternalLabResultData).results ?? [])] : []);
      setRadiologyReports(
        data && data.documentType !== 'lab_result' ? [...((data as ExternalRadiologyReportData).reports ?? [])] : []
      );
      setPhase(phaseOf(response));
    } catch (error: any) {
      if (requestRef.current !== request || error?.name === 'AbortError') return;
      setErrorDetails(extractErrorMessage(error) || String(error?.status ?? ''));
      setPhase('error');
    }
  };

  const handleCancelWaiting = () => {
    cancelRequest();
    setPhase('upload');
  };

  const handleSave = async () => {
    if (!result || !patient?.id) return;

    if (isLab && labRows.some(row => !row.testName?.trim())) {
      dispatch(notify({ msg: 'Test name is required for every row', sev: 'warning' }));
      return;
    }

    const extraction = {
      patientId: Number(patient.id),
      encounterId: encounter?.id ? Number(encounter.id) : null,
      rawExtractedText: result.rawExtractedText ?? null,
      detectedLanguage: result.detectedLanguage ?? null,
      translated: !!result.translated
    };

    try {
      if (isLab) {
        await saveLabResults({ data: { ...extraction, results: labRows }, file }).unwrap();
      } else {
        await saveRadiologyReports({ data: { ...extraction, reports: radiologyReports }, file }).unwrap();
      }
      dispatch(notify({ msg: 'Saved to Diagnostics Test Result and Attachments', sev: 'success' }));
      setOpen(false);
    } catch (error: any) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Failed to save the document.',
          sev: 'error'
        })
      );
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const reviewContent = (
    <>
      <PatientCard patient={patient} />
      <h3 className="external-result__title">
        <Translate>Review structured data</Translate>
      </h3>
      <div className="external-result__chips">
        <span className="ok">
          <Translate>Patient matches</Translate>
        </span>
        <span className="ok">
          <Translate>Still relevant</Translate>
        </span>
        {result?.detectedLanguage && (
          <span>
            <Translate>Detected</Translate>: {result.detectedLanguage.toUpperCase()}
          </span>
        )}
        <span>
          <Translate>{result?.translated ? 'Translated' : 'Not translated'}</Translate>
        </span>
      </div>

      {criticalCount > 0 && (
        <div className="external-result__critical" role="status">
          {criticalCount} <Translate>{criticalCount === 1 ? 'critical value, review first' : 'critical values, review first'}</Translate>
        </div>
      )}

      {isLab ? (
        <ExternalLabResultsEditor rows={labRows} onChange={setLabRows} />
      ) : (
        <ExternalRadiologyReportsEditor reports={radiologyReports} onChange={setRadiologyReports} />
      )}

      <ExtractedText text={result?.rawExtractedText} />

      <div className="external-result__save-note">
        <span>
          <Translate>Will be saved to</Translate>: <Translate>Diagnostics Test Result + Attachments</Translate>
        </span>
        <small>
          <Translate>AI can make mistakes. Confirm before saving to the chart.</Translate>
        </small>
      </div>
    </>
  );

  const steps: Record<Phase, React.ReactNode> = {
    upload: (
      <UploadStep
        patient={patient}
        file={file}
        fileError={fileError}
        documentType={documentType}
        translate={translate}
        targetLanguage={targetLanguage}
        onFile={handleFile}
        onDocumentType={setDocumentType}
        onTranslate={setTranslate}
        onTargetLanguage={setTargetLanguage}
      />
    ),
    waiting: <WaitingStep patient={patient} file={file} slow={slow} />,
    review: reviewContent,
    mismatch: <MismatchStep patient={patient} reason={result?.reason} metadata={result?.processingMetadata} />,
    outdated: (
      <OutdatedStep
        patient={patient}
        reason={result?.reason}
        metadata={result?.processingMetadata}
        rawText={result?.rawExtractedText}
      />
    ),
    unreadable: <UnreadableStep patient={patient} reason={result?.reason} metadata={result?.processingMetadata} />,
    error: <ErrorStep patient={patient} details={errorDetails} />
  };

  const footers: Record<Phase, React.ReactNode> = {
    upload: (
      <MyButton prefixIcon={FaMagic} onClick={handleProcess} disabled={!file || !patient?.id}>
        Process with AI
      </MyButton>
    ),
    waiting: (
      <MyButton appearance="subtle" onClick={handleCancelWaiting}>
        Cancel
      </MyButton>
    ),
    review: (
      <>
        <MyButton appearance="ghost" onClick={startOver}>
          Process another
        </MyButton>
        <MyButton onClick={handleSave} disabled={!canSave} loading={isSaving}>
          Save to visit
        </MyButton>
      </>
    ),
    mismatch: <MyButton onClick={startOver}>Try another file</MyButton>,
    outdated: <MyButton onClick={startOver}>Process another</MyButton>,
    unreadable: <MyButton onClick={startOver}>Try another file</MyButton>,
    error: <MyButton onClick={handleProcess}>Try again</MyButton>
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        <span className="external-result__modal-title">
          <Translate>Scan Document</Translate>
          <span>AI</span>
        </span>
      }
      size={phase === 'review' ? '1000px' : '560px'}
      hideBack
      hideActionBtn
      hideCancel={phase === 'waiting'}
      cancelButtonLabel={phase === 'upload' || phase === 'review' ? 'Cancel' : 'Close'}
      content={
        <div dir={dir} className="external-result">
          {steps[phase]}
        </div>
      }
      footerButtons={footers[phase]}
    />
  );
};

export default ExternalResultModal;
