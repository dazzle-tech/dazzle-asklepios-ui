import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleHalfStroke, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { Input, InputNumber, Loader, Message, Text } from 'rsuite';

import MyModal from '@/components/MyModal/MyModal';
import type {
  LocalPreAuthorizationCoverageResponse,
  LocalPreAuthorizationDecision,
  PreAuthorizationTrackingResponse
} from '@/types/model-types-new';
import { formatMoney } from './utils';

type PreAuthorizationDecisionModalProps = {
  open: boolean;
  row: PreAuthorizationTrackingResponse | null;
  decision: LocalPreAuthorizationDecision | null;
  note: string;
  approvedAmount: number | null;
  coverage?: LocalPreAuthorizationCoverageResponse | null;
  coverageLoading?: boolean;
  isSubmitting: boolean;
  onNoteChange: (value: string) => void;
  onApprovedAmountChange: (value: number | null) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
};

const DECISION_COPY: Record<
  LocalPreAuthorizationDecision,
  { label: string; step: string; icon: typeof faCircleCheck; type: 'info' | 'warning'; message: string }
> = {
  APPROVED: {
    label: 'Approve',
    step: 'Record payer approval',
    icon: faCircleCheck,
    type: 'info',
    message: 'The service will be billed with the insurance share of the coverage contract.'
  },
  PARTIAL: {
    label: 'Partially Approve',
    step: 'Record partial approval',
    icon: faCircleHalfStroke,
    type: 'warning',
    message:
      'Insurance covers the approved amount only. The rest of the service is billed to the patient.'
  },
  REJECTED: {
    label: 'Reject',
    step: 'Record payer rejection',
    icon: faCircleXmark,
    type: 'warning',
    message:
      'The service will not be covered. In the patient account the patient can pay it in full as cash, or the service can be cancelled.'
  }
};

const PreAuthorizationDecisionModal: React.FC<PreAuthorizationDecisionModalProps> = ({
  open,
  row,
  decision,
  note,
  approvedAmount,
  coverage,
  coverageLoading = false,
  isSubmitting,
  onNoteChange,
  onApprovedAmountChange,
  onClose,
  onSubmit
}) => {
  const copy = DECISION_COPY[decision ?? 'APPROVED'];
  const label = copy.label;
  const partial = decision === 'PARTIAL';
  const maxApproved = Number(coverage?.insuranceShare ?? 0);
  const approvedAmountValid =
    !partial || (approvedAmount != null && approvedAmount > 0 && approvedAmount <= maxApproved);
  const patientPays =
    partial && coverage && approvedAmount != null
      ? Math.max(Number(coverage.netAmount) - approvedAmount, 0)
      : null;

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
      isDisabledActionBtn={
        isSubmitting || row?.id == null || decision == null || !approvedAmountValid
      }
      cancelButtonLabel="Close"
      steps={[
        {
          title: copy.step,
          icon: <FontAwesomeIcon icon={copy.icon} />
        }
      ]}
      content={() => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Message showIcon type={copy.type}>
            {copy.message}
          </Message>
          {partial &&
            (coverageLoading || !coverage ? (
              <Loader content="Loading contract coverage..." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Text>
                  Service net: {formatMoney(coverage.netAmount)} · Insurance share by contract:{' '}
                  {formatMoney(coverage.insuranceShare)} · Patient share:{' '}
                  {formatMoney(coverage.patientShare)}
                </Text>
                <Text>Approved insurance amount</Text>
                <InputNumber
                  min={0}
                  max={maxApproved}
                  step={0.01}
                  value={approvedAmount ?? undefined}
                  onChange={value =>
                    onApprovedAmountChange(value === '' || value == null ? null : Number(value))
                  }
                />
                {patientPays != null && (
                  <Text muted>Patient pays: {formatMoney(patientPays)}</Text>
                )}
                {approvedAmount != null && !approvedAmountValid && (
                  <Text style={{ color: 'var(--rs-text-error, #d32f2f)' }}>
                    Enter an amount greater than 0 and at most {formatMoney(maxApproved)}.
                  </Text>
                )}
              </div>
            ))}
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
