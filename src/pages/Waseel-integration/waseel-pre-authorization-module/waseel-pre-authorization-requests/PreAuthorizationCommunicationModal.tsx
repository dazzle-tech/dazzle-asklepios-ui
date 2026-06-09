import React from 'react';
import { Modal } from 'rsuite';

import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';

type PreAuthorizationCommunicationModalProps = {
  open: boolean;
  communicationMessage: string;
  isSubmitting: boolean;
  onClose: () => void;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
};

const PreAuthorizationCommunicationModal: React.FC<PreAuthorizationCommunicationModalProps> = ({
  open,
  communicationMessage,
  isSubmitting,
  onClose,
  onMessageChange,
  onSubmit
}) => (
  <Modal open={open} onClose={onClose} size="sm">
    <Modal.Header>
      <Modal.Title>Pre-Authorization Communication</Modal.Title>
    </Modal.Header>

    <Modal.Body>
      <MyInput
        fieldName="communicationMessage"
        fieldLabel="Message"
        fieldType="textarea"
        record={{ communicationMessage }}
        setRecord={(value: { communicationMessage: string }) =>
          onMessageChange(value.communicationMessage)
        }
        width="100%"
      />
    </Modal.Body>

    <Modal.Footer>
      <MyButton appearance="ghost" onClick={onClose}>
        Close
      </MyButton>
      <MyButton
        color="var(--deep-blue)"
        loading={isSubmitting}
        disabled={!communicationMessage}
        onClick={onSubmit}
      >
        Send
      </MyButton>
    </Modal.Footer>
  </Modal>
);

export default PreAuthorizationCommunicationModal;
