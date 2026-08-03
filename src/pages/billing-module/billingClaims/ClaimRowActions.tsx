import React from 'react';
import { Tooltip, Whisper } from 'rsuite';
import { FaEye, FaRotate, FaPaperPlane } from 'react-icons/fa6';

import type { ClaimTrackingResponse } from '@/types/model-types-new';
import type { ClaimRowHandlers } from './types';

type ClaimRowActionsProps = ClaimRowHandlers & {
  row: ClaimTrackingResponse;
};

const ClaimRowActions: React.FC<ClaimRowActionsProps> = ({
  row,
  onPreview,
  onResubmit,
  onRefreshUpload
}) => {
  const canResubmit = row.canResubmit === true && !!row.financialDocumentId;
  const canRefresh = row.canRefreshUpload === true && !!row.uploadId;

  return (
    <div className="claims-row-actions">
      <Whisper
        placement="top"
        trigger="hover"
        container={() => document.body}
        speaker={<Tooltip>Preview claim</Tooltip>}
      >
        <span>
          <FaEye
            className="claims-action-icon"
            size={18}
            onClick={() => onPreview(row)}
          />
        </span>
      </Whisper>

      <Whisper
        placement="top"
        trigger="hover"
        container={() => document.body}
        speaker={<Tooltip>Resubmit to Waseel</Tooltip>}
      >
        <span>
          <FaPaperPlane
            className="claims-action-icon"
            size={16}
            onClick={() => {
              if (canResubmit) onResubmit(row);
            }}
            style={{
              cursor: canResubmit ? 'pointer' : 'not-allowed',
              opacity: canResubmit ? 1 : 0.35
            }}
          />
        </span>
      </Whisper>

      <Whisper
        placement="top"
        trigger="hover"
        container={() => document.body}
        speaker={<Tooltip>Refresh upload summary</Tooltip>}
      >
        <span>
          <FaRotate
            className="claims-action-icon"
            size={16}
            onClick={() => {
              if (canRefresh) onRefreshUpload(row);
            }}
            style={{
              cursor: canRefresh ? 'pointer' : 'not-allowed',
              opacity: canRefresh ? 1 : 0.35
            }}
          />
        </span>
      </Whisper>
    </div>
  );
};

export default ClaimRowActions;
