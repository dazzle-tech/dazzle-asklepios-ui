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
}) => (
  <Modal open={open} onClose={onClose} size="md" className="bc-modal">
    <Modal.Header>
      <Modal.Title>Waseel Upload Summary</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {!summary ? (
        <div className="bc-empty">No summary available.</div>
      ) : (
        <div className="bc-modal-grid">
          <div className="bc-modal-item">
            <span>Upload Name</span>
            <strong>{summary.uploadName ?? '-'}</strong>
          </div>
          <div className="bc-modal-item">
            <span>Upload ID</span>
            <strong>{summary.uploadId ?? '-'}</strong>
          </div>
          <div className="bc-modal-item">
            <span>Uploaded Claims</span>
            <strong>{summary.noOfUploadedClaims ?? 0}</strong>
          </div>
          <div className="bc-modal-item bc-modal-item--ok">
            <span>Accepted Claims</span>
            <strong>{summary.noOfAcceptedClaims ?? 0}</strong>
          </div>
          <div className="bc-modal-item">
            <span>Not Accepted</span>
            <strong>{summary.noOfNotAcceptedClaims ?? 0}</strong>
          </div>
          <div className="bc-modal-item bc-modal-item--ok">
            <span>Acceptance Ratio</span>
            <strong>{summary.ratioOfAccepted ?? 0}%</strong>
          </div>
          <div className="bc-modal-item">
            <span>Uploaded Amount</span>
            <strong>{formatMoney(summary.totalAmtOfUploadedClaims)}</strong>
          </div>
          <div className="bc-modal-item bc-modal-item--ok">
            <span>Accepted Amount</span>
            <strong>{formatMoney(summary.totalAmtOfAcceptedClaims)}</strong>
          </div>
          {summary.message ? (
            <div className="bc-modal-item bc-modal-item--msg">
              <span>Message</span>
              <strong>{summary.message}</strong>
            </div>
          ) : null}
        </div>
      )}
    </Modal.Body>
  </Modal>
);

export default ClaimUploadSummaryModal;
