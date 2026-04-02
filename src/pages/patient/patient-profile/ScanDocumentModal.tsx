import React, { useRef, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useParseIdDocumentMutation } from '@/services/idParsingService';
import { useUploadAttachmentsMutation } from '@/services/patients/attachmentService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { SelectPicker } from 'rsuite';
import { useSelector } from 'react-redux';
import './styles.less';
type ScanDocumentModalProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  patientId: number | string | undefined;
  onUploadSuccess?: () => void;
  onIdParsed?: (parsedData: any) => void;
};

const ScanDocumentModal: React.FC<ScanDocumentModalProps> = ({
  open,
  setOpen,
  patientId,
  onUploadSuccess,
  onIdParsed
}) => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const mode = useSelector((state: any) => state.ui.mode);

  const [parseIdDocument] = useParseIdDocumentMutation();
  const [uploadAttachments] = useUploadAttachmentsMutation();

  // Document types that support ID parsing
  const ID_TYPES = ['ID_CARD', 'PASSPORT'];

  // Document types options
  const documentTypes = [
    { label: 'ID Card', value: 'ID_CARD' },
    { label: 'Passport', value: 'PASSPORT' },
    { label: 'Medical Report', value: 'MEDICAL_REPORT' },
    { label: 'Lab Result', value: 'LAB_RESULT' },
    { label: 'Insurance Card', value: 'INSURANCE_CARD' },
    { label: 'Prescription', value: 'PRESCRIPTION' },
    { label: 'X-Ray', value: 'XRAY' },
    { label: 'Other', value: 'OTHER' }
  ];

  const handleClickUpload = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleScanAndParse = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);

      // Step 1: Parse the ID document
      const parsedData = await parseIdDocument(selectedFile).unwrap();

      dispatch(
        notify({
          msg: 'ID Document Parsed Successfully',
          sev: 'success'
        })
      );

      // Step 2: Upload the attachment if patient exists
      if (patientId) {
        try {
          await uploadAttachments({
            patientId: Number(patientId),
            file: selectedFile,
            type: documentType || 'ID_CARD',
            details: details || 'Scanned ID Document',
            source: 'PATIENT_DOCUMENT'
          }).unwrap();

          dispatch(
            notify({
              msg: 'Document Uploaded Successfully',
              sev: 'success'
            })
          );
        } catch (uploadError: any) {
          console.warn('ID parsed but upload failed:', uploadError);
          console.error('Upload error details:', {
            status: uploadError?.status,
            data: uploadError?.data,
            message: uploadError?.message
          });
          // Continue anyway - parsing was successful
          dispatch(
            notify({
              msg: 'ID parsed successfully, but upload failed. Data will be auto-filled.',
              sev: 'warning'
            })
          );
        }
      }

      // Reset form
      setSelectedFile(null);
      setDocumentType('');
      setDetails('');
      setOpen(false);

      // Call callbacks
      onIdParsed?.(parsedData);
      onUploadSuccess?.();
    } catch (error: any) {
      console.error('Failed to parse ID document:', error);
      console.error('Error details:', {
        status: error?.status,
        data: error?.data,
        message: error?.message
      });

      const errorMessage =
        error?.data?.detail ||
        error?.data?.message ||
        error?.message ||
        'Failed to Parse ID Document. Please ensure the image is clear and try again.';

      dispatch(
        notify({
          msg: errorMessage,
          sev: 'error'
        })
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUploadOnly = async () => {
    if (!selectedFile || !patientId) {
      dispatch(
        notify({
          msg: 'Please select a file and ensure patient is saved',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      setIsProcessing(true);

      const uploadParams = {
        patientId: Number(patientId),
        file: selectedFile,
        type: documentType || 'OTHER',
        details: details || `Uploaded ${selectedFile.name}`,
        source: 'PATIENT_DOCUMENT'
      };

      const result = await uploadAttachments(uploadParams).unwrap();

      dispatch(
        notify({
          msg: 'Document Uploaded Successfully',
          sev: 'success'
        })
      );

      // Reset form
      setSelectedFile(null);
      setDocumentType('');
      setDetails('');
      setOpen(false);

      onUploadSuccess?.();
    } catch (error: any) {
      console.error('Upload failed:', error);
      console.error('Error details:', {
        status: error?.status,
        data: error?.data,
        message: error?.message
      });

      const errorMsg =
        error?.data?.detail ||
        error?.data?.message ||
        error?.message ||
        'Failed to Upload Document. Please check the file format and try again.';

      dispatch(
        notify({
          msg: errorMsg,
          sev: 'error'
        })
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isIdDocument = ID_TYPES.includes(documentType);
  const canScanAndParse = selectedFile && isIdDocument;
  const canUploadOnly = selectedFile && !isIdDocument && patientId;

  const content = (
  <div className={`scan-doc-wrapper ${mode === 'dark' ? 'dark' : 'light'}`}>
    {/* Header */}
    <div className="scan-doc-header">
      <div className="scan-doc-icon">📄</div>
      <div>
        <h3 className="scan-doc-title">
          <Translate>Scan & Upload Document</Translate>
        </h3>
        <p className="scan-doc-subtitle">
          <Translate>Upload and automatically parse patient ID documents</Translate>
        </p>
      </div>
    </div>

    {/* Instructions */}
    <div className="scan-doc-card">
      <div className="scan-doc-card-header">
        <span className="scan-doc-card-icon">i</span>
        <span className="scan-doc-card-title">
          <Translate>How it works</Translate>
        </span>
      </div>

      <ol className="scan-doc-steps">
        <li>
          <Translate>Select document type (ID Card/Passport for auto-parsing)</Translate>
        </li>
        <li>
          <Translate>Choose the document file to scan</Translate>
        </li>
        <li>
          <Translate>Click Scan & Parse to extract information automatically</Translate>
        </li>
        <li>
          <Translate>Patient data will be auto-filled from the document</Translate>
        </li>
      </ol>
    </div>

    {/* Document Type Selection */}
    <div>
      <label className="scan-doc-label">
        <Translate>Document Type</Translate>
        {isIdDocument && <span className="scan-doc-badge">AUTO-PARSE</span>}
      </label>

      <SelectPicker
        data={documentTypes}
        value={documentType}
        onChange={setDocumentType}
        placeholder="Select document type"
        searchable={false}
        style={{ width: '100%' }}
      />
    </div>

    {/* Details Input */}
    <div>
      <label className="scan-doc-label">
        <Translate>Details (Optional)</Translate>
      </label>
      <input
        className="scan-doc-input"
        type="text"
        value={details}
        onChange={e => setDetails(e.target.value)}
        placeholder="Add description or notes"
      />
    </div>

    {/* Upload File */}
    <div className="scan-doc-upload">
      <span className="scan-doc-label">
        <Translate>Upload Document</Translate>
      </span>

      <p className="scan-doc-upload-subtext">
        <Translate>Supports</Translate> <strong>PDF, JPG, PNG, JPEG</strong>{' '}
        <Translate>files. Maximum size 10MB.</Translate>
      </p>

      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
      />

      <div className="scan-doc-file-row">
        <div className="scan-doc-file-display">
          {selectedFile ? selectedFile.name : <Translate>No file selected</Translate>}
        </div>

        <MyButton appearance="ghost" onClick={handleClickUpload}>
          <Translate>Choose File</Translate>
        </MyButton>
      </div>

      {/* Action Buttons */}
      {isIdDocument ? (
        <MyButton
          onClick={handleScanAndParse}
          disabled={!canScanAndParse || isProcessing}
          loading={isProcessing}
          block
        >
          <Translate>Scan & Parse ID</Translate>
        </MyButton>
      ) : (
        <MyButton
          onClick={handleUploadOnly}
          disabled={!canUploadOnly || isProcessing}
          loading={isProcessing}
          block
        >
          <Translate>Upload Document</Translate>
        </MyButton>
      )}
    </div>
  </div>
);

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={<Translate>Scan Document</Translate>}
      size="500px"
      position="right"
      hideActionBtn
      hideBack
      content={<div dir={dir}>{content}</div>}
    />
  );
};

export default ScanDocumentModal;
