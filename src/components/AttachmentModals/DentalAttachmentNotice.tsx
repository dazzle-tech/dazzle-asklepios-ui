import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';

/** Attachments uploaded on the Dental Procedures screen; they are sent with the claim. */
export const DENTAL_PROCEDURE_ATTACHMENT_SOURCE = 'DENTAL_PROCEDURE_ATTACHMENT';

/** What NPHIES accepts for a claim attachment (Waseel GapSheet, "attachment"). */
const NPHIES_EXTENSIONS = ['pdf', 'jpg', 'jpeg'];
const NPHIES_MAX_BYTES = 10 * 1024 * 1024;

const formatBytes = (bytes: number): string =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const extensionOf = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase();
};

/** Why NPHIES would not take the file; null when it would. */
const notAcceptedReason = (file: File): string | null => {
  if (!NPHIES_EXTENSIONS.includes(extensionOf(file.name))) {
    return 'File type not accepted. Use PDF, JPG or JPEG.';
  }
  if (file.size > NPHIES_MAX_BYTES) {
    return `${formatBytes(file.size)} is over the 10 MB limit.`;
  }
  return null;
};

interface DentalAttachmentNoticeProps {
  files: File[];
}

/**
 * Shown on the Dental Procedures attachments: these files go with the claim, so it lists what NPHIES
 * accepts and warns about the selected files it would not take. A warning only: the upload goes on.
 */
const DentalAttachmentNotice = ({ files }: DentalAttachmentNoticeProps) => {
  const notAccepted = files
    .map(file => ({ name: file.name, reason: notAcceptedReason(file) }))
    .filter((item): item is { name: string; reason: string } => item.reason !== null);

  return (
    <div className="dental-attachment-notice">
      <div className="dental-attachment-notice__panel">
        <FontAwesomeIcon icon={faCircleInfo} className="dental-attachment-notice__icon" />
        <div>
          <div className="dental-attachment-notice__title">
            <Translate>Dental attachments are sent with the claim</Translate>
          </div>
          <div className="dental-attachment-notice__chips">
            {NPHIES_EXTENSIONS.map(extension => (
              <span key={extension} className="dental-attachment-notice__chip">
                {extension.toUpperCase()}
              </span>
            ))}
            <span className="dental-attachment-notice__chip dental-attachment-notice__chip--size">
              <Translate>Up to</Translate> 10 MB
            </span>
          </div>
        </div>
      </div>

      {notAccepted.length > 0 && (
        <div className="dental-attachment-notice__panel dental-attachment-notice__panel--warning" role="alert">
          <FontAwesomeIcon icon={faTriangleExclamation} className="dental-attachment-notice__icon" />
          <div>
            <div className="dental-attachment-notice__title">
              <Translate>Will not be sent with the claim</Translate>
            </div>
            <ul className="dental-attachment-notice__list">
              {notAccepted.map(item => (
                <li key={item.name}>
                  <span className="dental-attachment-notice__file">{item.name}</span>
                  <span className="dental-attachment-notice__detail">
                    <Translate>{item.reason}</Translate>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentalAttachmentNotice;
