import MyModal from '@/components/MyModal/MyModal';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import Attachment from '@/images/Attachment.png';
import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form } from 'rsuite';
import './styles.less';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useUploadAttachmentsMutation as useUploadPatientAttachmentsMutation } from '@/services/patients/attachmentService';
import { useUploadAttachmentMutation as useUploadEncounterAttachmentMutation } from '@/services/encounters/attachmentsService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';

interface AttachmentUploadModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  patientId?: number;
  encounterId?: number;
  refetchData: () => void;
  source?: string;
  sourceId?: number; 
}

const AttachmentUploadModal = ({
  isOpen,
  setIsOpen,
  patientId,
  encounterId,
  refetchData,
  source = 'PATIENT_PROFILE_ATTACHMENT',
  sourceId
}: AttachmentUploadModalProps) => {
  const dispatch = useAppDispatch();
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Use appropriate mutation based on whether patientId or encounterId is provided
  const [uploadPatientAttachments, { isLoading: isLoadingPatient }] = useUploadPatientAttachmentsMutation();
  const [uploadEncounterAttachment, { isLoading: isLoadingEncounter }] = useUploadEncounterAttachmentMutation();
  
  const isLoading = isLoadingPatient || isLoadingEncounter;
  
  // Fetch attachment types LOV
  const { data: attachmentsLovQueryResponse } = useGetLovValuesByCodeQuery('ATTACH_TYPE');
  
  // Form fields state
  const [selectedAttachType, setSelectedAttachType] = useState<{ typeLkey: string }>({
    typeLkey: ''
  });
  const [attachmentDetails, setAttachmentDetails] = useState({ attachmentDetails: '' });

  // Handle Attachment File Upload Click
  const handleAttachmentFileUploadClick = () => {
    if (isOpen) attachmentFileInputRef.current?.click();
  };

  // Handle File Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      setSelectedFiles(filesArray);

      // Create preview URLs for images
      const urls: string[] = [];
      filesArray.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            urls.push(reader.result as string);
            if (urls.length === filesArray.length) {
              setPreviewUrls(urls);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  // Handle Reset
  const handleReset = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setSelectedAttachType({ typeLkey: '' });
    setAttachmentDetails({ attachmentDetails: '' });
    if (attachmentFileInputRef.current) {
      attachmentFileInputRef.current.value = '';
    }
  };

  // Handle Upload Action
  const handleUploadAction = async () => {
    if (selectedFiles.length === 0) {
      dispatch(notify({ msg: 'Please select at least one file', sev: 'warning' }));
      return;
    }

    try {
      if (encounterId) {
        // Upload encounter attachments one at a time (backend accepts single file)
        const uploadPromises = selectedFiles.map(file => 
          uploadEncounterAttachment({
            encounterId,
            file, // Single file
            type: selectedAttachType.typeLkey || undefined,
            details: attachmentDetails.attachmentDetails || undefined,
            source: source,
            sourceId: sourceId || 0 // Use 0 as default for general attachments, actual ID for order-specific
          }).unwrap()
        );
        
        await Promise.all(uploadPromises);
      } else if (patientId) {
        const uploadPromises = selectedFiles.map(file => 
          uploadPatientAttachments({
            patientId,
            file, 
            type: selectedAttachType.typeLkey || undefined,
            details: attachmentDetails.attachmentDetails || undefined,
            source: source
          }).unwrap()
        );
        
        await Promise.all(uploadPromises);
      } else {
        dispatch(notify({ msg: 'Patient ID or Encounter ID is required', sev: 'error' }));
        return;
      }

      dispatch(notify({ msg: 'Attachment(s) Uploaded Successfully', sev: 'success' }));
      handleReset();
      setIsOpen(false);
      refetchData();
    } catch (error: any) {
      console.error('Upload error details:', {
        error,
        errorData: error?.data,
        errorMessage: error?.data?.message,
        errorStatus: error?.status,
        fullError: JSON.stringify(error, null, 2)
      });
      dispatch(notify({ 
        msg: error?.data?.message || error?.message || 'Failed to Upload Attachment', 
        sev: 'error' 
      }));
    }
  };

  // Handle Close
  const handleClose = () => {
    handleReset();
    setIsOpen(false);
  };

  // Attachment Modal Content
  const content = () => (
    <>
      <div className="upload-file-container">
        <input
          type="file"
          ref={attachmentFileInputRef}
          className="upload-file-content"
          onChange={handleFileUpload}
          multiple
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
        />
        {previewUrls.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {previewUrls.map((url, index) => (
              <img
                key={index}
                alt={`Attachment Preview ${index + 1}`}
                width={150}
                height={150}
                style={{ objectFit: 'cover', cursor: 'pointer' }}
                onClick={handleAttachmentFileUploadClick}
                src={url}
              />
            ))}
          </div>
        ) : selectedFiles.length > 0 ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>{selectedFiles.length} file(s) selected</p>
            <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
              {selectedFiles.map((file, index) => (
                <li key={index}>
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <img
            alt={'Attachment Preview'}
            width={150}
            height={150}
            onClick={handleAttachmentFileUploadClick}
            src={Attachment}
            style={{ cursor: 'pointer' }}
          />
        )}
      </div>
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Click on the image above to select file(s) to upload
        </p>
        <p style={{ color: '#999', fontSize: '12px' }}>
          Supported formats: Images, PDF, Word, Excel
        </p>
      </div>
      <Form style={{ marginTop: '20px' }}>
        <MyInput
          width={550}
          fieldName="typeLkey"
          fieldType="select"
          selectData={attachmentsLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          fieldLabel="Type"
          selectDataValue="key"
          record={selectedAttachType}
          setRecord={setSelectedAttachType}
          searchable={false}
        />
        <MyInput
          width={550}
          record={attachmentDetails}
          setRecord={setAttachmentDetails}
          fieldType="textarea"
          fieldName="attachmentDetails"
          placeholder="Details"
          fieldLabel="Details"
        />
      </Form>
    </>
  );

  const modalTitle = encounterId ? "Upload Encounter Attachments" : "Upload Patient Attachments";

  return (
    <MyModal
      open={isOpen}
      setOpen={handleClose}
      title={modalTitle}
      size="sm"
      bodyheight="65vh"
      content={content}
      hideBack={true}
      steps={[{ title: 'Attachments', icon: <FontAwesomeIcon icon={faPaperclip} /> }]}
      actionButtonLabel="Upload"
      actionButtonFunction={handleUploadAction}
      isDisabledActionBtn={selectedFiles.length === 0 || isLoading}
    />
  );
};

export default AttachmentUploadModal;

