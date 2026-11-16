import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Form, Modal } from 'rsuite';
import { LuScan, LuSparkle, LuAlertTriangle, LuX } from 'react-icons/lu';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useUploadAttachmentsMutation } from '@/services/patients/attachmentService';
import { useExtractAndParseMutation } from '@/services/ocr-parsing/ocrParsingService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import { Patient } from '@/types/model-types-new';
import './ScanDocumentModal.less';

type ScanDocumentModalProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  patientId: number | string | undefined;
  onUploadSuccess?: () => void;
  onIdParsed?: (parsedData: any) => void;
  localPatient: Patient;
  setLocalPatient: any;
};

type Phase = 'upload' | 'reading' | 'review' | 'error';
type DocType = 'ID_CARD' | 'PASSPORT' | 'OTHER';

type ReviewFields = {
  firstName: string;
  lastName: string;
  sexAtBirth: string;
  dateOfBirth: any;
  nationality: string;
  documentNo: string;
};

const EMPTY_FIELDS: ReviewFields = {
  firstName: '',
  lastName: '',
  sexAtBirth: '',
  dateOfBirth: null,
  nationality: '',
  documentNo: ''
};

const STEPS = ['Upload', 'AI reading', 'Review', 'Done'];
const READING_STEPS = [
  'Reading the document',
  'Finding name and ID number',
  'Checking dates',
  'Preparing your review'
];
const EXPECTED_FIELDS = ['Name', 'Date of birth', 'ID number', 'Nationality'];
const READING_STEP_MS = 1000;

const FIELD_LABELS: Record<keyof ReviewFields, string> = {
  firstName: 'Given names',
  lastName: 'Family name',
  sexAtBirth: 'Gender',
  dateOfBirth: 'Date of birth',
  nationality: 'Nationality',
  documentNo: 'Document number'
};

const ScanDocumentModal: React.FC<ScanDocumentModalProps> = ({
  open,
  setOpen,
  patientId,
  onUploadSuccess,
  localPatient,
  setLocalPatient
}) => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [phase, setPhase] = useState<Phase>('upload');
  const [docType, setDocType] = useState<DocType>('ID_CARD');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [readingStep, setReadingStep] = useState(0);
  const [fields, setFields] = useState<ReviewFields>(EMPTY_FIELDS);
  const [editedFields, setEditedFields] = useState<Set<keyof ReviewFields>>(new Set());
  const [errorMessage, setErrorMessage] = useState('');

  const genderOptions = useEnumOptions('Gender');
  const { data: nationalityLov } = useGetLovValuesByCodeQuery('NAT');

  const [extractAndParse] = useExtractAndParseMutation();
  const [uploadAttachments, { isLoading: isUploading }] = useUploadAttachmentsMutation();

  const isIdDocument = docType !== 'OTHER';
  const isPdf = !!file && /pdf/i.test(file.type || file.name);

  // Revoke the preview URL when the file changes or the modal unmounts
  useEffect(() => {
    if (!file || isPdf) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isPdf]);

  // Walk through the reading steps while the request runs; the last step waits for the response
  useEffect(() => {
    if (phase !== 'reading') return undefined;
    const timer = setInterval(
      () => setReadingStep(step => Math.min(step + 1, READING_STEPS.length - 1)),
      READING_STEP_MS
    );
    return () => clearInterval(timer);
  }, [phase]);

  const resetAll = () => {
    setPhase('upload');
    setDocType('ID_CARD');
    setFile(null);
    setShowNotes(false);
    setNotes('');
    setReadingStep(0);
    setFields(EMPTY_FIELDS);
    setEditedFields(new Set());
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetAll();
    setOpen(false);
  };

  const pickFile = (picked?: File | null) => {
    if (!picked) return;
    setFile(picked);
    setPhase('upload');
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScan = async () => {
    if (!file) return;
    setReadingStep(0);
    setPhase('reading');

    try {
      const parsed = await extractAndParse({ file }).unwrap();

      setFields({
        firstName: parsed?.givenNames ?? '',
        lastName: parsed?.familyName ?? '',
        sexAtBirth: parsed?.sex ?? '',
        // Parsed as a local date; new Date('YYYY-MM-DD') would read it as UTC and can shift the day
        dateOfBirth: parsed?.dateOfBirth ? dayjs(parsed.dateOfBirth as any).toDate() : null,
        nationality: parsed?.nationality ?? '',
        documentNo: parsed?.documentNumber != null ? String(parsed.documentNumber) : ''
      });
      setEditedFields(new Set());
      setPhase('review');
    } catch (error: any) {
      setErrorMessage(extractApiErrorMessage(error));
      setPhase('error');
    }
  };

  const handleUploadOnly = async () => {
    if (!file) return;
    if (!patientId) {
      dispatch(notify({ msg: 'Save the patient first to attach documents', sev: 'warning' }));
      return;
    }

    try {
      await uploadAttachments({
        patientId: Number(patientId),
        file,
        type: 'OTHER',
        details: notes || `Uploaded ${file.name}`,
        source: 'PATIENT_DOCUMENT'
      }).unwrap();

      dispatch(notify({ msg: 'Document saved to Attachments.', sev: 'success' }));
      onUploadSuccess?.();
      handleClose();
    } catch (error: any) {
      dispatch(notify({ msg: extractApiErrorMessage(error), sev: 'error' }));
    }
  };

  // Only fields the AI read (or the user typed) overwrite the form; empty ones keep the current value.
  // documentNo is not a Patient field (documents are saved separately), so it is shown for reference only.
  const handleApply = () => {
    const filled = Object.fromEntries(
      Object.entries(fields).filter(
        ([key, value]) => key !== 'documentNo' && value !== '' && value != null
      )
    );
    // The registration form stores dates as YYYY-MM-DD text, like the backend
    if (filled.dateOfBirth) {
      filled.dateOfBirth = dayjs(filled.dateOfBirth).format('YYYY-MM-DD');
    }
    setLocalPatient({ ...localPatient, ...filled });
    dispatch(
      notify({ msg: 'Patient details filled by AI. Please review before saving.', sev: 'success' })
    );
    handleClose();
  };

  const updateFields = (next: ReviewFields) => {
    const changed = (Object.keys(next) as (keyof ReviewFields)[]).filter(
      key => next[key] !== fields[key]
    );
    setFields(next);
    if (changed.length) {
      setEditedFields(prev => new Set([...prev, ...changed]));
    }
  };

  const activeStepIndex =
    phase === 'upload' ? 0 : phase === 'reading' ? 1 : phase === 'review' ? 2 : 0;

  const renderStepper = () => (
    <div className="smart-scan__stepper">
      {STEPS.map((label, index) => {
        const isError = phase === 'error' && index === activeStepIndex;
        const state = isError
          ? 'warn'
          : index < activeStepIndex
          ? 'done'
          : index === activeStepIndex
          ? 'on'
          : '';
        return (
          <React.Fragment key={label}>
            {index > 0 && <span className="smart-scan__stepper-sep" />}
            <span className={`smart-scan__step ${state}`}>
              <b>{isError ? '!' : state === 'done' ? '✓' : index + 1}</b>
              <Translate>{label}</Translate>
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderPreview = (scanning = false) =>
    file && (
      <div className={`smart-scan__preview${scanning ? ' scanning' : ''}`}>
        {previewUrl ? (
          <img src={previewUrl} alt="" />
        ) : (
          <div className="smart-scan__preview-pdf">PDF · {file.name}</div>
        )}
        {scanning && <span className="smart-scan__beam" aria-hidden="true" />}
      </div>
    );

  const renderUpload = () => (
    <>
      <div
        className={`smart-scan__drop${isDragging ? ' drag' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDragging(false);
          pickFile(e.dataTransfer.files?.[0]);
        }}
      >
        <span className="smart-scan__drop-icon">
          <LuScan size={34} />
          <LuSparkle size={12} className="smart-scan__drop-spark" />
        </span>
        <strong>
          <Translate>Drop an ID card or passport photo</Translate>
        </strong>
        <p>
          <Translate>AI will read the details for you</Translate>
        </p>
        <div className="smart-scan__chips">
          {EXPECTED_FIELDS.map(field => (
            <span key={field} className="smart-scan__chip">
              <Translate>{field}</Translate>
            </span>
          ))}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept=".pdf,.jpg,.jpeg,.png,image/*"
        onChange={e => pickFile(e.target.files?.[0])}
      />

      {file && (
        <>
          <div className="smart-scan__file-row">
            <span className="smart-scan__file-name">{file.name}</span>
            <button type="button" className="smart-scan__link" onClick={removeFile}>
              <Translate>Remove</Translate>
            </button>
          </div>
          {renderPreview()}
        </>
      )}

      <div className="smart-scan__types">
        {(['ID_CARD', 'PASSPORT'] as DocType[]).map(type => (
          <button
            key={type}
            type="button"
            aria-pressed={docType === type}
            onClick={() => setDocType(type)}
          >
            <Translate>{type === 'ID_CARD' ? 'ID Card' : 'Passport'}</Translate>
            <LuSparkle size={10} className="smart-scan__type-spark" />
          </button>
        ))}
        <button
          type="button"
          className="quiet"
          aria-pressed={docType === 'OTHER'}
          onClick={() => setDocType('OTHER')}
        >
          <Translate>Other document</Translate>
        </button>
      </div>
      {!isIdDocument && (
        <p className="smart-scan__hint">
          <Translate>
            Saved to Attachments. AI auto-fill works for ID cards and passports.
          </Translate>
        </p>
      )}

      <button
        type="button"
        className="smart-scan__link smart-scan__notes-toggle"
        onClick={() => setShowNotes(value => !value)}
      >
        <Translate>{showNotes ? 'Hide notes' : 'Add notes'}</Translate>
      </button>
      {showNotes && (
        <textarea
          className="smart-scan__notes"
          value={notes}
          placeholder="Optional notes…"
          onChange={e => setNotes(e.target.value)}
        />
      )}
    </>
  );

  const renderReading = () => (
    <>
      {renderPreview(true)}
      <ol className="smart-scan__progress">
        {READING_STEPS.map((step, index) => (
          <li
            key={step}
            className={index < readingStep ? 'done' : index === readingStep ? 'cur' : ''}
          >
            <span className="smart-scan__mark">{index < readingStep ? '✓' : ''}</span>
            <Translate>{step}</Translate>
          </li>
        ))}
      </ol>
    </>
  );

  const renderError = () => (
    <div className="smart-scan__error">
      <span className="smart-scan__state-icon">
        <LuAlertTriangle size={18} />
      </span>
      <h3>
        <Translate>Smart Scan could not read this document.</Translate>
      </h3>
      <p>
        <Translate>Try a clearer photo, or fill the details manually.</Translate>
      </p>
      {errorMessage && <p className="smart-scan__error-detail">{errorMessage}</p>}
    </div>
  );

  // MyInput labels are plain text, so the "edited" marker sits under the field
  const renderField = (key: keyof ReviewFields, input: React.ReactNode, className = '') => (
    <div className={className}>
      {input}
      {editedFields.has(key) && (
        <div className="smart-scan__edited">
          ✎ <Translate>Edited by you</Translate>
        </div>
      )}
    </div>
  );

  const renderReview = () => {
    const foundCount = Object.values(fields).filter(value => value !== '' && value != null).length;

    return (
      <>
        {renderPreview()}
        <div className="smart-scan__review-head">
          <LuSparkle size={14} />
          <h3>
            <Translate>AI found</Translate> {foundCount} <Translate>details</Translate>
          </h3>
        </div>
        <Form fluid className="smart-scan__fields">
          {renderField(
            'firstName',
            <MyInput
              fieldName="firstName"
              fieldLabel={FIELD_LABELS.firstName}
              record={fields}
              setRecord={updateFields}
              column
              width="100%"
            />
          )}
          {renderField(
            'lastName',
            <MyInput
              fieldName="lastName"
              fieldLabel={FIELD_LABELS.lastName}
              record={fields}
              setRecord={updateFields}
              column
              width="100%"
            />
          )}
          {renderField(
            'dateOfBirth',
            <MyInput
              fieldName="dateOfBirth"
              fieldType="date"
              fieldLabel={FIELD_LABELS.dateOfBirth}
              record={fields}
              setRecord={updateFields}
              column
              width="100%"
            />
          )}
          {renderField(
            'sexAtBirth',
            <MyInput
              fieldName="sexAtBirth"
              fieldType="select"
              fieldLabel={FIELD_LABELS.sexAtBirth}
              selectData={genderOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              searchable={false}
              record={fields}
              setRecord={updateFields}
              column
              width="100%"
            />
          )}
          {renderField(
            'nationality',
            <MyInput
              fieldName="nationality"
              fieldType="select"
              fieldLabel={FIELD_LABELS.nationality}
              selectData={nationalityLov?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={fields}
              setRecord={updateFields}
              column
              width="100%"
            />
          )}
          <div className="smart-scan__full">
            <MyInput
              fieldName="documentNo"
              fieldLabel={FIELD_LABELS.documentNo}
              record={fields}
              setRecord={updateFields}
              disabled
              column
              width="100%"
            />
            <div className="smart-scan__hint">
              <Translate>For reference. Add it from the Documents tab.</Translate>
            </div>
          </div>
        </Form>
      </>
    );
  };

  const renderFooter = () => {
    if (phase === 'reading') {
      return (
        <div className="smart-scan__actions">
          <MyButton appearance="subtle" onClick={handleClose}>
            Cancel
          </MyButton>
        </div>
      );
    }

    if (phase === 'error') {
      return (
        <div className="smart-scan__actions">
          <MyButton appearance="subtle" onClick={handleClose}>
            Close
          </MyButton>
          <MyButton onClick={() => setPhase('upload')}>Try again</MyButton>
        </div>
      );
    }

    if (phase === 'review') {
      return (
        <>
          <div className="smart-scan__foot-note">
            <Translate>AI can make mistakes. Please confirm the details before saving.</Translate>
          </div>
          <div className="smart-scan__actions">
            <MyButton appearance="subtle" onClick={handleClose}>
              Cancel
            </MyButton>
            <MyButton appearance="ghost" onClick={() => setPhase('upload')}>
              Scan again
            </MyButton>
            <MyButton onClick={handleApply}>Apply to form</MyButton>
          </div>
        </>
      );
    }

    return (
      <div className="smart-scan__actions">
        <MyButton appearance="subtle" onClick={handleClose}>
          Cancel
        </MyButton>
        {isIdDocument ? (
          <MyButton prefixIcon={LuSparkle} disabled={!file} onClick={handleScan}>
            Scan with AI
          </MyButton>
        ) : (
          <MyButton
            disabled={!file || isUploading}
            loading={isUploading}
            onClick={handleUploadOnly}
          >
            Save to Attachments
          </MyButton>
        )}
      </div>
    );
  };

  const direction = localStorage.getItem('direction') || 'LTR';

  return (
    <Modal open={open} onClose={handleClose} size="sm" className="smart-scan" backdrop="static">
      <div dir={direction === 'RTL' ? 'rtl' : 'ltr'}>
        <div className="smart-scan__head">
          <div className="smart-scan__head-row">
            <span className="smart-scan__title-icon">
              <LuScan size={18} />
              <LuSparkle size={7} className="smart-scan__title-spark" />
            </span>
            <h2>
              <Translate>Smart Scan</Translate>
            </h2>
            <span className="smart-scan__ai-chip">AI</span>
            <button
              type="button"
              className="smart-scan__close"
              aria-label="Close"
              onClick={handleClose}
            >
              <LuX size={16} />
            </button>
          </div>
          <p className="smart-scan__sub">
            <Translate>AI reads the document. You review before anything is filled.</Translate>
          </p>
          {renderStepper()}
        </div>

        <div className="smart-scan__body">
          {phase === 'upload' && renderUpload()}
          {phase === 'reading' && renderReading()}
          {phase === 'review' && renderReview()}
          {phase === 'error' && renderError()}
        </div>

        <div className="smart-scan__foot">{renderFooter()}</div>
      </div>
    </Modal>
  );
};

export default ScanDocumentModal;
