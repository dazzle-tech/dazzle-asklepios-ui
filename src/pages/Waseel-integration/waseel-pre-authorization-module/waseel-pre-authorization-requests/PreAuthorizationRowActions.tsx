import React from 'react';
import { Tooltip, Whisper } from 'rsuite';
import { FaRotate } from 'react-icons/fa6';
import { MdCancel, MdOutlineMessage, MdOutlineForum } from 'react-icons/md';

import type { PreAuthorizationTrackingResponse } from '@/types/model-types-new';

import { canCancelPreAuthorization } from './utils';
import type { PreAuthorizationRowHandlers } from './types';

type PreAuthorizationRowActionsProps = PreAuthorizationRowHandlers & {
  row: PreAuthorizationTrackingResponse;
};

const PreAuthorizationRowActions: React.FC<PreAuthorizationRowActionsProps> = ({
  row,
  onRefreshFromWaseel,
  onCommunication,
  onViewCommunications,
  onCancel
}) => {
  const canCancel = row.canCancel ?? canCancelPreAuthorization(row);
  const hasApprovalRequest = !!row.approvalRequestId;
  const canCommunicate =
    row.canCommunicate === true ||
    (!!row.searchCompleted && !row.isCancelled) ||
    (!!row.approvalResponseId && !row.isCancelled);
  const communicationCount = Number(row.communicationCount ?? 0);
  const hasCommunications = communicationCount > 0;

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
            onClick={() => {
              if (hasApprovalRequest) onRefreshFromWaseel(row);
            }}
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
        speaker={<Tooltip>Send Communication</Tooltip>}
      >
        <span>
          <MdOutlineMessage
            className="icons-style"
            size={22}
            fill="var(--primary-gray)"
            onClick={() => {
              if (canCommunicate) onCommunication(row);
            }}
            style={{
              cursor: canCommunicate ? 'pointer' : 'not-allowed',
              opacity: canCommunicate ? 1 : 0.35
            }}
          />
        </span>
      </Whisper>

      <Whisper
        placement="top"
        trigger="hover"
        container={() => document.body}
        speaker={<Tooltip>View Communications</Tooltip>}
      >
        <span className="action-icon-wrap">
          <MdOutlineForum
            className="icons-style"
            size={22}
            fill="var(--primary-gray)"
            onClick={() => onViewCommunications(row)}
            style={{
              cursor: 'pointer',
              opacity: hasCommunications ? 1 : 0.55
            }}
          />
          {hasCommunications && (
            <span className="action-icon-badge">
              {communicationCount > 99 ? '99+' : communicationCount}
            </span>
          )}
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
