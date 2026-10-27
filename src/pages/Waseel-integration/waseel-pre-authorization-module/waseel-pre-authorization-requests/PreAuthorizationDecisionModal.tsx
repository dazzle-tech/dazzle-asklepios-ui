import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { Input, Message, Text } from 'rsuite';

import MyModal from '@/components/MyModal/MyModal';
import type {
  LocalPreAuthorizationDecision,
  PreAuthorizationTrackingResponse
} from '@/types/model-types-new';

type PreAuthorizationDecisionModalProps = {
  open: boolean;
  row: PreAuthorizationTrackingResponse | null;
  decision: LocalPreAuthorizationDecision | null;
  note: string;
  isSubmitting: boolean;
  onNoteChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
};

const PreAuthorizationDecisionModal: React.FC<PreAuthorizationDecisionModalProps> = ({
  open,
  row,
  decision,
  note,
  isSubmitting,
  onNoteChange,
  onClose,
  onSubmit
}) => {
  const approving = decision === 'APPROVED';
  const label = approving ? 'Approve' : 'Reject';

  return (
    <MyModal
      open={open}
      setOpen={(value: boolean) => {
        if (!value) onClose();
      }}
      size="36vw"
      bodyheight="38vh"
      title={`${label} Pre-Authorization`}
      actionButtonLabel={label}
      actionButtonFunction={onSubmit}
      actionButtonLoading={isSubmitting}
      isDisabledActionBtn={isSubmitting || row?.id == null || decision == null}
      cancelButtonLabel="Close"
      steps={[
        {
          title: approving ? 'Record payer approval' : 'Record payer rejection',
          icon: <FontAwesomeIcon icon={approving ? faCircleCheck : faCircleXmark} />
        }
      ]}
      content={() => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Message showIcon type={approving ? 'info' : 'warning'}>
            {approving
              ? 'The service will be billed with the insurance share of the coverage contract.'
              : 'The service will not be covered. It can then be paid as cash from the patient account.'}
          </Message>
          <Text>Note (optional)</Text>
          <Input
            as="textarea"
            rows={3}
            value={note}
            onChange={value => onNoteChange(String(value ?? ''))}
          />
        </div>
      )}
    />
  );
};

export default PreAuthorizationDecisionModal;
