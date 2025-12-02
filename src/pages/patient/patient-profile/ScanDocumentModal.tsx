import React, { useRef, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useParseIdDocumentMutation } from '@/services/idParsingService';
import { useUploadAttachmentsMutation } from '@/services/patients/attachmentService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { SelectPicker } from 'rsuite';

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

      console.log('Starting ID parsing for file:', selectedFile.name);

      // Step 1: Parse the ID document
      const parsedData = await parseIdDocument(selectedFile).unwrap();

      console.log('ID parsed successfully:', parsedData);

      dispatch(
        notify({
          msg: 'ID Document Parsed Successfully',
          sev: 'success'
        })
      );

      // Step 2: Upload the attachment if patient exists
      if (patientId) {
        try {
          console.log('Uploading attachment for patient:', patientId);

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

      console.log('Uploading with params:', {
        patientId: uploadParams.patientId,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        type: uploadParams.type,
        details: uploadParams.details,
        source: uploadParams.source
      });

      const result = await uploadAttachments(uploadParams).unwrap();

      console.log('Upload successful:', result);

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
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '25px',
          paddingBottom: '20px',
          borderBottom: '1px solid #e5e5ea'
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: '#f0f0f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}
        >
          📄
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            <Translate>Scan & Upload Document</Translate>
          </h3>
          <p style={{ margin: '5px 0 0', color: '#8e8e93', fontSize: '14px' }}>
            <Translate>Upload and automatically parse patient ID documents</Translate>
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          backgroundColor: '#f9f9fb',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px'
          }}
        >
          <span
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#007aff',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            i
          </span>
          <span style={{ fontWeight: 600, fontSize: '15px' }}>
            <Translate>How it works</Translate>
          </span>
        </div>
        <ol style={{ margin: '0', paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
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
      <div style={{ marginBottom: '20px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 500,
            fontSize: '14px'
          }}
        >
          <Translate>Document Type</Translate>
          {isIdDocument && (
            <span
              style={{
                marginLeft: '8px',
                padding: '2px 8px',
                backgroundColor: '#007aff',
                color: 'white',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              AUTO-PARSE
            </span>
          )}
        </label>
        <SelectPicker
          data={documentTypes}
          value={documentType}
          onChange={setDocumentType}
          placeholder="Select document type"
          style={{ width: '100%' }}
          searchable={false}
        />
      </div>

      {/* Details Input */}
      <div style={{ marginBottom: '20px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 500,
            fontSize: '14px'
          }}
        >
          <Translate>Details (Optional)</Translate>
        </label>
        <input
          type="text"
          value={details}
          onChange={e => setDetails(e.target.value)}
          placeholder="Add description or notes"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e5e5ea',
            borderRadius: '6px',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Upload File */}
      <div
        style={{
          backgroundColor: '#f9f9fb',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontWeight: 500, fontSize: '14px' }}>
            <Translate>Upload Document</Translate>
          </span>
        </div>

        <p
          style={{
            margin: '0 0 15px',
            color: '#8e8e93',
            fontSize: '13px'
          }}
        >
          <Translate>Supports</Translate> <strong>PDF, JPG, PNG, JPEG</strong>{' '}
          <Translate>files. Maximum size 10MB.</Translate>
        </p>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />

        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '15px'
          }}
        >
          <div
            style={{
              flex: 1,
              padding: '10px 12px',
              backgroundColor: 'white',
              border: '1px solid #e5e5ea',
              borderRadius: '6px',
              fontSize: '14px',
              color: selectedFile ? '#000' : '#8e8e93',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
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

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={<Translate>Scan Document</Translate>}
      size="500px"
      position="right"
      hideActionBtn
      hideBack
      content={content}
    />
  );
};

export default ScanDocumentModal;
