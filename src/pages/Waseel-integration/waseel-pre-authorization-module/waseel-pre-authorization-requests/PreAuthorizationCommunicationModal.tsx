import React, { useEffect, useRef, useState } from 'react';
import { Form } from 'rsuite';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faPaperclip, faTrash } from '@fortawesome/free-solid-svg-icons';

export type CommunicationAttachmentFile = {
  file: File;
  attachmentName: string;
  attachmentType: string;
  fileSize: number;
};

type PreAuthorizationCommunicationModalProps = {
  open: boolean;
  communicationMessage: string;
  attachment: CommunicationAttachmentFile | null;
  isSubmitting: boolean;
  onClose: () => void;
  onMessageChange: (value: string) => void;
  onAttachmentChange: (value: CommunicationAttachmentFile | null) => void;
  onSubmit: () => void;
};

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

const ACCEPTED_TYPES =
  '.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt,application/pdf,image/jpeg,image/png,text/plain';

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const PreAuthorizationCommunicationModal: React.FC<
  PreAuthorizationCommunicationModalProps
> = ({
  open,
  communicationMessage,
  attachment,
  isSubmitting,
  onClose,
  onMessageChange,
  onAttachmentChange,
  onSubmit
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const record = { communicationMessage };

  useEffect(() => {
    if (!open) {
      setFileError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [open]);

  const canSubmit =
    !isSubmitting && (!!communicationMessage.trim() || !!attachment?.file);

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setFileError('Attachment must be 10 MB or smaller');
      onAttachmentChange(null);
      event.target.value = '';
      return;
    }

    setFileError(null);
    onAttachmentChange({
      file,
      attachmentName: file.name,
      attachmentType: file.type || 'application/octet-stream',
      fileSize: file.size
    });
  };

  const clearAttachment = () => {
    setFileError(null);
    onAttachmentChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={onClose}
      size="35vw"
      bodyheight="60vh"
      title="Pre-Authorization Communication"
      actionButtonLabel="Send"
      actionButtonFunction={onSubmit}
      isDisabledActionBtn={!canSubmit}
      cancelButtonLabel="Close"
      steps={[
        {
          title: 'Communication',
          icon: <FontAwesomeIcon icon={faCommentDots} />
        }
      ]}
      content={() => (
        <Form fluid style={{ width: '100%' }}>
          <MyInput
            width="100%"
            fieldType="textarea"
            fieldLabel="Message"
            fieldName="communicationMessage"
            height={120}
            record={record}
            setRecord={(value: { communicationMessage: string }) =>
              onMessageChange(value.communicationMessage)
            }
          />

          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>Attachment (optional)</div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              style={{ display: 'none' }}
              onChange={handleFileSelected}
            />

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  border: '1px solid #d0d5dd',
                  borderRadius: 6,
                  background: '#fff',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                <FontAwesomeIcon icon={faPaperclip} />
                {attachment ? 'Replace file' : 'Choose file'}
              </button>

              {attachment && (
                <button
                  type="button"
                  onClick={clearAttachment}
                  disabled={isSubmitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    border: '1px solid #f2c4c4',
                    borderRadius: 6,
                    background: '#fff5f5',
                    color: '#b42318',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                  Remove
                </button>
              )}
            </div>

            {attachment && (
              <div style={{ marginTop: 10, fontSize: 13, color: '#344054' }}>
                <div>
                  <strong>{attachment.attachmentName}</strong> ({formatFileSize(attachment.fileSize)})
                </div>
                <div>{attachment.attachmentType}</div>
              </div>
            )}

            {fileError && (
              <div style={{ marginTop: 8, color: '#b42318', fontSize: 13 }}>{fileError}</div>
            )}

            <div style={{ marginTop: 8, fontSize: 12, color: '#667085' }}>
              Files are saved like patient attachments (Spaces + pre_authorization_attachments), then
              sent to Waseel. Message, attachment, or both.
            </div>
          </div>
        </Form>
      )}
    />
  );
};

export default PreAuthorizationCommunicationModal;
