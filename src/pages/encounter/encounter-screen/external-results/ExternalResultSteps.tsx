import React, { useRef, useState } from 'react';
import { Message, Radio, RadioGroup, SelectPicker, Toggle } from 'rsuite';
import { FaExclamationTriangle, FaFileAlt, FaRegFileAlt, FaTimes, FaUserInjured } from 'react-icons/fa';
import { MdDocumentScanner } from 'react-icons/md';
import Translate from '@/components/Translate';
import { formatEnumString } from '@/utils';
import { ExternalDocumentMetadata, ExternalDocumentType, Patient } from '@/types/model-types-new';

// Accepted by both the AI document processor and encounter attachments (attachments reject CSV)
const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'txt', 'jpg', 'jpeg', 'png'];
export const MAX_FILE_MB = 20;

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'العربية', value: 'ar' }
];

export const validateFile = (file: File): string | null => {
  if (file.size === 0) return 'This file is empty. Choose another file.';
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `This file is larger than ${MAX_FILE_MB} MB. Choose a smaller file.`;
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return 'This file type is not supported. Use PDF (text), Word, TXT, JPG or PNG.';
  }
  return null;
};

const patientName = (patient?: Patient) => [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
const isoDate = (value: unknown) => (value ? String(value).slice(0, 10) : '');

/* ===================== Shared ===================== */

export const PatientCard = ({ patient }: { patient?: Patient }) => (
  <div className="external-result__patient">
    <FaUserInjured aria-hidden="true" />
    <div>
      <strong>
        <Translate>Checking against</Translate>: {patientName(patient)}
      </strong>
      <span>
        {[
          (patient as any)?.patientMrn && `# ${(patient as any).patientMrn}`,
          patient?.sexAtBirth && formatEnumString(patient.sexAtBirth),
          isoDate(patient?.dateOfBirth)
        ]
          .filter(Boolean)
          .join(' · ')}
      </span>
    </div>
  </div>
);

export const FileCard = ({ file, onRemove }: { file: File; onRemove?: () => void }) => (
  <div className="external-result__file-card">
    <FaFileAlt aria-hidden="true" />
    <strong>{file.name}</strong>
    {onRemove && (
      <button type="button" title="Remove" aria-label="Remove" onClick={onRemove}>
        <FaTimes />
      </button>
    )}
  </div>
);

export const ExtractedText = ({ text }: { text?: string | null }) =>
  text ? (
    <details className="external-result__raw">
      <summary>
        <Translate>View extracted text</Translate>
      </summary>
      <pre>{text}</pre>
    </details>
  ) : null;

/* ===================== Upload ===================== */

type UploadProps = {
  patient?: Patient;
  file: File | null;
  fileError: string | null;
  documentType: ExternalDocumentType;
  translate: boolean;
  targetLanguage: string;
  onFile: (file: File | null) => void;
  onDocumentType: (type: ExternalDocumentType) => void;
  onTranslate: (value: boolean) => void;
  onTargetLanguage: (language: string) => void;
};

export const UploadStep = ({
  patient,
  file,
  fileError,
  documentType,
  translate,
  targetLanguage,
  onFile,
  onDocumentType,
  onTranslate,
  onTargetLanguage
}: UploadProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const openPicker = () => inputRef.current?.click();

  return (
    <>
      <PatientCard patient={patient} />

      <div
        className={`external-result__drop${dragging ? ' dragging' : ''}`}
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          onFile(e.dataTransfer.files?.[0] ?? null);
        }}
      >
        <MdDocumentScanner size={30} aria-hidden="true" />
        <strong>
          <Translate>Drop a lab result or radiology report</Translate>
        </strong>
        <p>
          PDF (<Translate>text</Translate>), Word, TXT, JPG, PNG · <Translate>max</Translate> {MAX_FILE_MB} MB
        </p>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={ACCEPTED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
          onClick={e => e.stopPropagation()}
          onChange={e => {
            onFile(e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />
      </div>

      {fileError && (
        <Message type="error" showIcon>
          <Translate>{fileError}</Translate>
        </Message>
      )}
      {file && <FileCard file={file} onRemove={() => onFile(null)} />}

      <div className="external-result__field">
        <label>
          <Translate>Document type</Translate>
        </label>
        <RadioGroup inline value={documentType} onChange={value => onDocumentType(value as ExternalDocumentType)}>
          <Radio value="LAB">
            <Translate>Lab Result</Translate>
          </Radio>
          <Radio value="RADIOLOGY">
            <Translate>Radiology Report</Translate>
          </Radio>
        </RadioGroup>
      </div>

      <div className="external-result__option">
        <div>
          <span>
            <Translate>Translate if needed</Translate>
          </span>
          <small>
            <Translate>Translates when the document language differs from the target.</Translate>
          </small>
        </div>
        <Toggle checked={translate} onChange={onTranslate} size="sm" />
      </div>

      {translate && (
        <div className="external-result__option">
          <span>
            <Translate>Target language</Translate>
          </span>
          <SelectPicker
            data={LANGUAGE_OPTIONS}
            value={targetLanguage}
            onChange={value => onTargetLanguage(value ?? 'en')}
            cleanable={false}
            searchable={false}
            size="sm"
            style={{ width: 130 }}
          />
        </div>
      )}
    </>
  );
};

/* ===================== Waiting ===================== */

export const WaitingStep = ({ patient, file, slow }: { patient?: Patient; file: File | null; slow: boolean }) => (
  <>
    <PatientCard patient={patient} />
    {file && <FileCard file={file} />}
    <div className="external-result__wait" role="status">
      <MdDocumentScanner size={30} aria-hidden="true" />
      <strong>
        <Translate>AI is reading and organizing this document</Translate>
      </strong>
      <p>
        <Translate>This can take up to a minute.</Translate>
      </p>
      <div className="external-result__bar">
        <i />
      </div>
      {slow && (
        <p>
          <Translate>Still working. Larger documents take longer.</Translate>
        </p>
      )}
    </div>
  </>
);

/* ===================== Rejected ===================== */

const Notice = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <div className="external-result__notice">
    <FaExclamationTriangle aria-hidden="true" />
    <div>
      <h3>
        <Translate>{title}</Translate>
      </h3>
      {children}
    </div>
  </div>
);

const MISMATCH_LABELS: Record<string, string> = {
  full_name: 'Name',
  sex: 'Sex',
  date_of_birth: 'Date of Birth',
  patient_id: 'Patient ID'
};

// The AI sends sex in lower case (male / female)
const mismatchValue = (field: string, value?: string | null) => {
  if (!value) return '—';
  return field === 'sex' ? formatEnumString(value) : value;
};

type MismatchProps = {
  patient?: Patient;
  reason?: string | null;
  metadata?: ExternalDocumentMetadata | null;
};

export const MismatchStep = ({ patient, reason, metadata }: MismatchProps) => {
  const rows = metadata?.mismatch_details ?? [];

  return (
    <>
      <PatientCard patient={patient} />
      {/* The table lists each difference once; the reason text is only the fallback */}
      <Notice title="This document does not match the open patient">{!rows.length && <p>{reason}</p>}</Notice>
      {rows.length > 0 && (
        <table className="external-result__compare">
          <thead>
            <tr>
              <th />
              <th>
                <Translate>Patient Record</Translate>
              </th>
              <th>
                <Translate>In document</Translate>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.field}>
                <th>
                  <Translate>{MISMATCH_LABELS[row.field] ?? row.field}</Translate>
                </th>
                <td>{mismatchValue(row.field, row.patient_record_value)}</td>
                <td className="bad">{mismatchValue(row.field, row.document_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};

export const OutdatedStep = ({
  patient,
  reason,
  metadata,
  rawText
}: MismatchProps & { rawText?: string | null }) => (
  <>
    <PatientCard patient={patient} />
    <Notice title="This document is not clinically relevant right now">
      <p>
        {metadata?.document_date && metadata?.relevance_window_days ? (
          <>
            <Translate>Dated</Translate> {metadata.document_date}, <Translate>older than the allowed</Translate>{' '}
            {metadata.relevance_window_days} <Translate>days</Translate>.
          </>
        ) : (
          reason
        )}
      </p>
    </Notice>
    <ExtractedText text={rawText} />
  </>
);

export const UnreadableStep = ({ patient, reason }: MismatchProps) => (
  <>
    <PatientCard patient={patient} />
    <Notice title="We could not read this file">
      <p>{reason}</p>
      <small>
        <Translate>If this is a scanned PDF, upload the pages as JPG or PNG.</Translate>
      </small>
    </Notice>
  </>
);

export const ErrorStep = ({ patient, details }: { patient?: Patient; details?: string }) => (
  <>
    <PatientCard patient={patient} />
    <div className="external-result__error">
      <FaRegFileAlt size={28} aria-hidden="true" />
      <h3>
        <Translate>Scan is temporarily unavailable.</Translate>
      </h3>
      <p>
        <Translate>Your file was not saved. You can try again.</Translate>
      </p>
    </div>
    {details && (
      <details className="external-result__raw">
        <summary>
          <Translate>Technical details</Translate>
        </summary>
        <pre>{details}</pre>
      </details>
    )}
  </>
);
