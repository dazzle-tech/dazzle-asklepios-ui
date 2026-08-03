import React from 'react';
import { Modal } from 'rsuite';

import type { WaseelClaimUploadResponse } from '@/types/model-types-new';
import { formatMoney } from './utils';

type ClaimUploadSummaryModalProps = {
  open: boolean;
  summary: WaseelClaimUploadResponse | null;
  onClose: () => void;
};

const ClaimUploadSummaryModal: React.FC<ClaimUploadSummaryModalProps> = ({
  open,
  summary,
  onClose
}) => {
  return (
    <Modal open={open} onClose={onClose} size="md">
      <Modal.Header>
        <Modal.Title>Waseel Upload Summary</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!summary ? (
          <div>No summary available.</div>
        ) : (
          <div className="claims-upload-summary-grid">
            <div>
              <span>Upload Name</span>
              <strong>{summary.uploadName ?? '-'}</strong>
            </div>
            <div>
              <span>Upload ID</span>
              <strong>{summary.uploadId ?? '-'}</strong>
            </div>
            <div>
              <span>Uploaded Claims</span>
              <strong>{summary.noOfUploadedClaims ?? 0}</strong>
            </div>
            <div>
              <span>Accepted Claims</span>
              <strong>{summary.noOfAcceptedClaims ?? 0}</strong>
            </div>
            <div>
              <span>Not Accepted</span>
              <strong>{summary.noOfNotAcceptedClaims ?? 0}</strong>
            </div>
            <div>
              <span>Uploaded Amount</span>
              <strong>{formatMoney(summary.totalAmtOfUploadedClaims)}</strong>
            </div>
            <div>
              <span>Accepted Amount</span>
              <strong>{formatMoney(summary.totalAmtOfAcceptedClaims)}</strong>
            </div>
            <div>
              <span>Acceptance Ratio</span>
              <strong>{summary.ratioOfAccepted ?? 0}%</strong>
            </div>
            {summary.message ? (
              <div className="claims-upload-summary-message">
                <span>Message</span>
                <strong>{summary.message}</strong>
              </div>
            ) : null}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ClaimUploadSummaryModal;
