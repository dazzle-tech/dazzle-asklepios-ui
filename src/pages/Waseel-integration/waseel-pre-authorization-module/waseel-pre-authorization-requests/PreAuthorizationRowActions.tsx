import React from 'react';
import { Tooltip, Whisper } from 'rsuite';
import { FaEye, FaPrint, FaRotate } from 'react-icons/fa6';
import { MdCancel, MdOutlineMessage } from 'react-icons/md';

import type { PreAuthorizationTrackingResponse } from '@/types/model-types-new';

import { canCancelPreAuthorization } from './utils';
import type { PreAuthorizationRowHandlers } from './types';

type PreAuthorizationRowActionsProps = PreAuthorizationRowHandlers & {
  row: PreAuthorizationTrackingResponse;
};

const PreAuthorizationRowActions: React.FC<PreAuthorizationRowActionsProps> = ({
  row,
  onView,
  onRefreshFromWaseel,
  onCommunication,
  onCancel
}) => {
  const canCancel = canCancelPreAuthorization(row);
  const hasApprovalRequest = !!row.approvalRequestId;

  return (
    <div className="container-of-icons">
      <Whisper
        placement="top"
        trigger="hover"
        container={() => document.body}
        speaker={<Tooltip>Search / Refresh from Waseel</Tooltip>}
      >
        <span>
          <FaRotate
            className="icons-style"
            size={20}
            fill="var(--primary-gray)"
            onClick={() => onRefreshFromWaseel(row)}
            style={{
              cursor: hasApprovalRequest ? 'pointer' : 'not-allowed',
              opacity: hasApprovalRequest ? 1 : 0.35
            }}
          />
        </span>
      </Whisper>

      <Whisper
        placement="top"
        trigger="hover"
        container={() => document.body}
        speaker={<Tooltip>Communication</Tooltip>}
      >
        <span>
          <MdOutlineMessage
            className="icons-style"
            size={22}
            fill="var(--primary-gray)"
            onClick={() => onCommunication(row)}
            style={{
              cursor: hasApprovalRequest ? 'pointer' : 'not-allowed',
              opacity: hasApprovalRequest ? 1 : 0.35
            }}
          />
        </span>
      </Whisper>

      <Whisper
        placement="top"
        trigger="hover"
        container={() => document.body}
        speaker={<Tooltip>Cancel</Tooltip>}
      >
        <span>
          <MdCancel
            className="icons-style"
            size={22}
            fill="var(--primary-gray)"
            onClick={() => {
              if (canCancel) onCancel(row);
            }}
            style={{
              cursor: canCancel ? 'pointer' : 'not-allowed',
              opacity: canCancel ? 1 : 0.35
            }}
          />
        </span>
      </Whisper>
    </div>
  );
};

export default PreAuthorizationRowActions;
