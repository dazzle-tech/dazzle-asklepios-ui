import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';

type DeactivationReasonModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** What is being deactivated, e.g. "Payer Company", "Policy" or "Class". */
  itemLabel: string;
  itemName?: string | null;
  onConfirm: (reason: string) => void;
};

/**
 * Asks why an insurance company, policy or class is being deactivated.
 * The reason is shown to users wherever patient or visit registration is blocked because of it.
 */
const DeactivationReasonModal: React.FC<DeactivationReasonModalProps> = ({
  open,
  setOpen,
  itemLabel,
  itemName,
  onConfirm
}) => {
  const [record, setRecord] = useState<{ reason: string }>({ reason: '' });
  const reason = record.reason?.trim() ?? '';

  useEffect(() => {
    if (open) {
      setRecord({ reason: '' });
    }
  }, [open]);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={itemName ? `Deactivate ${itemLabel} - ${itemName}` : `Deactivate ${itemLabel}`}
      size="480px"
      bodyheight="30vh"
      actionButtonLabel="Deactivate"
      actionButtonFunction={() => onConfirm(reason)}
      isDisabledActionBtn={!reason}
      modalColor="var(--primary-pink)"
      content={
        <Form fluid>
          <p>
            Patients and visits can no longer be registered under this {itemLabel.toLowerCase()}. The reason below is
            shown to users when registration is blocked.
          </p>
          <MyInput
            required
            width="100%"
            fieldLabel="Reason"
            fieldType="textarea"
            fieldName="reason"
            record={record}
            setRecord={setRecord}
            placeholder={`Why is this ${itemLabel.toLowerCase()} being deactivated?`}
          />
        </Form>
      }
    />
  );
};

export default DeactivationReasonModal;
