import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';

type InvestigationReasonModalProps = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  actionLabel?: string;
};

/**
 * Asked on visit Complete and financial close when a Waseel insurance visit has no laboratory or
 * radiology investigation: the reason is sent on the claim with the "investigation not performed" code.
 */
const InvestigationReasonModal = ({
  open,
  loading,
  onClose,
  onSubmit,
  actionLabel = 'Save & Financial Close'
}: InvestigationReasonModalProps) => {
  const [record, setRecord] = useState<{ investigationNotPerformedReason?: string }>({});

  useEffect(() => {
    if (open) {
      setRecord({});
    }
  }, [open]);

  const reason = record.investigationNotPerformedReason?.trim() ?? '';

  return (
    <MyModal
      open={open}
      setOpen={(value: boolean) => {
        if (!value) onClose();
      }}
      title="Investigations Not Performed"
      size="40vw"
      bodyheight="auto"
      actionButtonLabel={actionLabel}
      isDisabledActionBtn={!reason}
      actionButtonLoading={loading}
      actionButtonFunction={() => onSubmit(reason)}
      handleCancelFunction={onClose}
      content={
        <Form fluid>
          <MyInput
            fieldName="investigationNotPerformedReason"
            fieldLabel="Why were no laboratory or radiology investigations performed?"
            fieldType="textarea"
            record={record}
            setRecord={setRecord}
            width="100%"
          />
        </Form>
      }
    />
  );
};

export default InvestigationReasonModal;
