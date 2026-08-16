import React from 'react';
import { Tooltip, Whisper } from 'rsuite';
import { FaEye, FaPaperPlane, FaRotate } from 'react-icons/fa6';

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
    <div className="bc-actions" onClick={e => e.stopPropagation()}>
      <Whisper placement="top" trigger="hover" speaker={<Tooltip>Preview claim</Tooltip>}>
        <button type="button" className="bc-action" onClick={() => onPreview(row)} aria-label="Preview">
          <FaEye size={14} />
        </button>
      </Whisper>

      <Whisper placement="top" trigger="hover" speaker={<Tooltip>Resubmit to Waseel</Tooltip>}>
        <button
          type="button"
          className="bc-action"
          disabled={!canResubmit}
          onClick={() => canResubmit && onResubmit(row)}
          aria-label="Resubmit"
        >
          <FaPaperPlane size={13} />
        </button>
      </Whisper>

      <Whisper placement="top" trigger="hover" speaker={<Tooltip>Refresh upload summary</Tooltip>}>
        <button
          type="button"
          className="bc-action"
          disabled={!canRefresh}
          onClick={() => canRefresh && onRefreshUpload(row)}
          aria-label="Refresh upload"
        >
          <FaRotate size={13} />
        </button>
      </Whisper>
    </div>
  );
};

export default ClaimRowActions;
