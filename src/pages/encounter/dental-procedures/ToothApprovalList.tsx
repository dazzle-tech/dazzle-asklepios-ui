import React from 'react';
import Translate from '@/components/Translate';
import { DentalToothApproval, DentalToothApprovalStatus } from '@/types/model-types-new';
import { formatStoredToothNumber } from './toothChart';

const STATUS_LABELS: Record<DentalToothApprovalStatus, string | null> = {
  NO_APPROVAL_NEEDED: null,
  PENDING_APPROVAL: 'Pending approval',
  APPROVED: 'Approved',
  PARTIALLY_APPROVED: 'Partially approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled'
};

type ToothApprovalListProps = {
  approvals: DentalToothApproval[];
};

/** Each tooth of a dental procedure with its insurance state (one billing line per tooth). */
const ToothApprovalList: React.FC<ToothApprovalListProps> = ({ approvals }) => (
  <div className="tooth-approval-list">
    {approvals.map(({ toothNumber, status }) => {
      const label = STATUS_LABELS[status];
      return (
        <span
          key={toothNumber}
          className={`tooth-approval-list__tooth tooth-approval-list__tooth--${status.toLowerCase()}`}
        >
          <strong>{formatStoredToothNumber(toothNumber)}</strong>
          {label && (
            <span className="tooth-approval-list__status">
              <Translate>{label}</Translate>
            </span>
          )}
        </span>
      );
    })}
  </div>
);

export default ToothApprovalList;
