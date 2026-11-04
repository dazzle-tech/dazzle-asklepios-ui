import React, { useMemo } from 'react';
import { Loader } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComments,
  faFileLines,
  faPaperclip,
  faCircleCheck,
  faCircleXmark,
  faDownload,
  faUser
} from '@fortawesome/free-solid-svg-icons';

import MyModal from '@/components/MyModal/MyModal';
import {
  useDownloadPreAuthorizationAttachmentMutation,
  useGetPreAuthorizationCommunicationsQuery
} from '@/services/waseel-integration/preAuthorizationService';
import type {
  PreAuthorizationCommunicationHistoryResponse,
  PreAuthorizationCommunicationPayloadHistory,
  PreAuthorizationTrackingResponse
} from '@/types/model-types-new';
import { formatDateWithoutSeconds } from '@/utils';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import './styles.less';

type Props = {
  open: boolean;
  row: PreAuthorizationTrackingResponse | null;
  onClose: () => void;
};

const formatFileSize = (bytes?: number | null) => {
  if (bytes == null) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const contentTypeLabel = (type?: string | null) => {
  switch (String(type ?? '').toUpperCase()) {
    case 'ATTACHMENT':
      return 'Attachment';
    case 'TEXT_AND_ATTACHMENT':
      return 'Text + Attachment';
    default:
      return 'Text';
  }
};

const contentTypeClass = (type?: string | null) => {
  switch (String(type ?? '').toUpperCase()) {
    case 'ATTACHMENT':
      return 'comm-chip attachment';
    case 'TEXT_AND_ATTACHMENT':
      return 'comm-chip mixed';
    default:
      return 'comm-chip text';
  }
};

const statusTone = (status?: string | null, outcome?: string | null) => {
  const value = `${status ?? ''} ${outcome ?? ''}`.toUpperCase();
  if (value.includes('ERROR') || value.includes('FAIL') || value.includes('REJECT')) {
    return 'danger';
  }
  if (value.includes('SUCCESS') || value.includes('COMPLETE') || value.includes('OK') || value.includes('QUEUED')) {
    return 'success';
  }
  return 'neutral';
};

const PayloadBlock: React.FC<{
  payload: PreAuthorizationCommunicationPayloadHistory;
  onOpenAttachment: (payload: PreAuthorizationCommunicationPayloadHistory) => void;
  openingAttachmentId?: number | null;
}> = ({ payload, onOpenAttachment, openingAttachmentId }) => {
  const sizeLabel = formatFileSize(payload.sizeBytes);
  const canOpen = payload.attachmentId != null;
  const isOpening = openingAttachmentId != null && openingAttachmentId === payload.attachmentId;

  return (
    <div className="comm-payload">
      <div className="comm-payload-top">
        <span className={contentTypeClass(payload.contentType)}>
          <FontAwesomeIcon
            icon={
              String(payload.contentType).toUpperCase().includes('ATTACHMENT')
                ? faPaperclip
                : faFileLines
            }
          />
          {contentTypeLabel(payload.contentType)}
        </span>
        {payload.claimItemId != null && (
          <span className="comm-meta-pill">Claim Item #{payload.claimItemId}</span>
        )}
      </div>

      {payload.payloadValue && (
        <div className="comm-message-box">
          <div className="comm-message-label">Message</div>
          <div className="comm-message-body">{payload.payloadValue}</div>
        </div>
      )}

      {(payload.attachmentId != null || payload.attachmentName) && (
        <div className="comm-attachment-card">
          <div className="comm-attachment-icon">
            <FontAwesomeIcon icon={faPaperclip} />
          </div>
          <div className="comm-attachment-info">
            <div className="comm-attachment-name">{payload.attachmentName || 'Attachment'}</div>
            <div className="comm-attachment-meta">
              {[payload.attachmentType, sizeLabel].filter(Boolean).join(' · ') || 'File'}
              {payload.isSentToWaseel ? ' · Sent to Waseel' : ''}
            </div>
          </div>
          {canOpen && (
            <button
              type="button"
              className="comm-download-btn"
              disabled={isOpening}
              onClick={() => onOpenAttachment(payload)}
            >
              <FontAwesomeIcon icon={faDownload} />
              {isOpening ? 'Opening...' : 'Open'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const CommunicationCard: React.FC<{
  item: PreAuthorizationCommunicationHistoryResponse;
  index: number;
  total: number;
  onOpenAttachment: (payload: PreAuthorizationCommunicationPayloadHistory) => void;
  openingAttachmentId?: number | null;
}> = ({ item, index, total, onOpenAttachment, openingAttachmentId }) => {
  const tone = statusTone(item.status, item.outcome);
  const payloads = Array.isArray(item.payloads) ? item.payloads : [];

  return (
    <div className="comm-timeline-item">
      <div className="comm-timeline-rail">
        <div className={`comm-timeline-dot ${tone}`}>
          <FontAwesomeIcon icon={tone === 'danger' ? faCircleXmark : faCircleCheck} />
        </div>
        {index < total - 1 && <div className="comm-timeline-line" />}
      </div>

      <div className={`comm-card ${tone}`}>
        <div className="comm-card-header">
          <div>
            <div className="comm-card-title">
              Communication #{total - index}
              {item.communicationId != null ? ` · ID ${item.communicationId}` : ''}
            </div>
            <div className="comm-card-subtitle">
              {formatDateWithoutSeconds(item.createdDate) || '-'}
              {item.createdBy ? ` · ${item.createdBy}` : ''}
            </div>
          </div>
          <div className={`comm-status-badge ${tone}`}>
            {item.status || item.outcome || 'Recorded'}
          </div>
        </div>

        {(item.message || item.outcome) && payloads.length === 0 && (
          <div className="comm-message-box">
            <div className="comm-message-label">Summary</div>
            <div className="comm-message-body">{item.message || item.outcome}</div>
          </div>
        )}

        <div className="comm-payload-list">
          {payloads.map((payload, payloadIndex) => (
            <PayloadBlock
              key={`${item.trackId}-${payload.attachmentId ?? payloadIndex}`}
              payload={payload}
              onOpenAttachment={onOpenAttachment}
              openingAttachmentId={openingAttachmentId}
            />
          ))}
        </div>

        <div className="comm-card-footer">
          {item.transactionId != null && <span>Txn {item.transactionId}</span>}
          {item.approvalResponseId != null && <span>Response {item.approvalResponseId}</span>}
          {item.createdBy && (
            <span>
              <FontAwesomeIcon icon={faUser} /> {item.createdBy}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const PreAuthorizationCommunicationsDrawer: React.FC<Props> = ({ open, row, onClose }) => {
  const dispatch = useAppDispatch();
  const preAuthorizationId = row?.id != null ? Number(row.id) : null;
  const [openingAttachmentId, setOpeningAttachmentId] = React.useState<number | null>(null);

  const { data, isFetching, isError } = useGetPreAuthorizationCommunicationsQuery(
    preAuthorizationId as number,
    { skip: !open || preAuthorizationId == null }
  );

  const [downloadAttachment] = useDownloadPreAuthorizationAttachmentMutation();

  const communications = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data]
  );

  const handleOpenAttachment = async (payload: PreAuthorizationCommunicationPayloadHistory) => {
    if (payload.attachmentId == null) return;

    try {
      setOpeningAttachmentId(payload.attachmentId);
      const blob = await downloadAttachment({
        id: Number(payload.attachmentId),
        mimeType: payload.attachmentType
      }).unwrap();

      const typedBlob =
        blob.type && blob.type !== 'application/octet-stream'
          ? blob
          : new Blob([blob], {
              type: payload.attachmentType || 'application/octet-stream'
            });

      const fileURL = window.URL.createObjectURL(typedBlob);
      window.open(fileURL, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(fileURL), 60_000);
    } catch {
      dispatch(notify({ msg: 'Failed to open attachment', sev: 'error' }));
    } finally {
      setOpeningAttachmentId(null);
    }
  };

  if (!open) return null;

  return (
    <MyModal
      open={open}
      setOpen={onClose}
      size="48vw"
      bodyheight="78vh"
      title="Communication History"
      cancelButtonLabel="Close"
      hideActionBtn
      steps={[
        {
          title: 'History',
          icon: <FontAwesomeIcon icon={faComments} />
        }
      ]}
      content={() => (
        <div className="comm-history-drawer">
          <div className="comm-history-summary">
            <div>
              <div className="comm-history-kicker">Pre-authorization</div>
              <div className="comm-history-title">
                {row?.preAuthRefNo || `Request #${row?.approvalRequestId || row?.id || '-'}`}
              </div>
              <div className="comm-history-meta">
                Response ID: {row?.approvalResponseId || '-'} ·{' '}
                {communications.length} communication
                {communications.length === 1 ? '' : 's'}
              </div>
            </div>
            <div className="comm-history-count">
              <FontAwesomeIcon icon={faComments} />
              <span>{communications.length}</span>
            </div>
          </div>

          {isFetching && (
            <div className="comm-history-empty">
              <Loader content="Loading communications..." />
            </div>
          )}

          {!isFetching && isError && (
            <div className="comm-history-empty error">
              Failed to load communication history.
            </div>
          )}

          {!isFetching && !isError && communications.length === 0 && (
            <div className="comm-history-empty">
              <FontAwesomeIcon icon={faComments} className="comm-empty-icon" />
              <div className="comm-empty-title">No communications yet</div>
              <div className="comm-empty-text">
                Text messages and attachments sent for this pre-authorization will appear here.
              </div>
            </div>
          )}

          {!isFetching && !isError && communications.length > 0 && (
            <div className="comm-timeline">
              {communications.map((item, index) => (
                <CommunicationCard
                  key={item.trackId ?? index}
                  item={item}
                  index={index}
                  total={communications.length}
                  onOpenAttachment={handleOpenAttachment}
                  openingAttachmentId={openingAttachmentId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    />
  );
};

export default PreAuthorizationCommunicationsDrawer;
