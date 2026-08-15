import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { Message, Text } from 'rsuite';

import MyModal from '@/components/MyModal/MyModal';
import type { PreAuthorizationTrackingResponse } from '@/types/model-types-new';

type PreAuthorizationResubmitModalProps = {
  open: boolean;
  row: PreAuthorizationTrackingResponse | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
};

const PreAuthorizationResubmitModal: React.FC<PreAuthorizationResubmitModalProps> = ({
  open,
  row,
  isSubmitting,
  onClose,
  onSubmit
}) => {
  const errorMessage = String(row?.message ?? row?.disposition ?? '').trim();

  return (
    <MyModal
      open={open}
      setOpen={(value: boolean) => {
        if (!value) onClose();
      }}
      size="36vw"
      bodyheight="38vh"
      title="Resubmit Pre-Authorization"
      actionButtonLabel="Resubmit"
      actionButtonFunction={onSubmit}
      actionButtonLoading={isSubmitting}
      isDisabledActionBtn={isSubmitting || row?.id == null}
      cancelButtonLabel="Close"
      steps={[
        {
          title: 'Copy and resend to Waseel',
          icon: <FontAwesomeIcon icon={faPaperPlane} />
        }
      ]}
      content={() => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Text>
            This copies the failed request, reapplies price-list pricing, and sends a new
            pre-authorization to Waseel.
          </Text>
          {errorMessage ? (
            <Message showIcon type="error">
              {errorMessage}
            </Message>
          ) : (
            <Message showIcon type="warning">
              The previous request failed or was rejected. A new request will be created.
            </Message>
          )}
        </div>
      )}
    />
  );
};

export default PreAuthorizationResubmitModal;
