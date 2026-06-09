import React from 'react';
import { Modal } from 'rsuite';

import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';

type PreAuthorizationCancelModalProps = {
  open: boolean;
  cancelReason: string;
  isSubmitting: boolean;
  onClose: () => void;
  onCancelReasonChange: (value: string) => void;
  onSubmit: () => void;
};

const PreAuthorizationCancelModal: React.FC<PreAuthorizationCancelModalProps> = ({
  open,
  cancelReason,
  isSubmitting,
  onClose,
  onCancelReasonChange,
  onSubmit
}) => (
  <Modal open={open} onClose={onClose} size="xs">
    <Modal.Header>
      <Modal.Title>Cancel Pre-Authorization</Modal.Title>
    </Modal.Header>

    <Modal.Body>
      <MyInput
        fieldName="cancelReason"
        fieldLabel="Cancel Reason"
        fieldType="textarea"
        record={{ cancelReason }}
        setRecord={(value: { cancelReason: string }) => onCancelReasonChange(value.cancelReason)}
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
        disabled={!cancelReason}
        onClick={onSubmit}
      >
        Submit Cancel
      </MyButton>
    </Modal.Footer>
  </Modal>
);

export default PreAuthorizationCancelModal;
