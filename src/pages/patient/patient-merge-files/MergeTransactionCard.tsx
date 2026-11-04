import MyButton from "@/components/MyButton/MyButton";
import Translate from "@/components/Translate";
import { formatDate, formatEnumString } from "@/utils";
import { faCodeMerge, faEye, faUndo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Panel } from "rsuite";
type MergeTransactionCardProps = {
  transaction: any;
  undoLoading: boolean;
  onViewChanges: (transaction: any) => void;
  onRequestUndo: (mergeLogId: number) => void;
};
import './styles.less';


const MergeTransactionCard = ({
  transaction,
  undoLoading,
  onViewChanges,
  onRequestUndo
}: MergeTransactionCardProps) => {
  const isMerged = transaction.mergeStatus === 'MERGED';
   const formatTime = (value?: string) => {
        if (!value) return '-';

        return new Date(value).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
     const formatDate = (value?: string) => {
        if (!value) return '-';

        return new Date(value).toLocaleDateString('ar-SA');
    };
  return (
    <Panel
      key={transaction.mergeLogId}
      bordered
      className="merge-transaction-card"
    >
      <div className="merge-transaction-grid">
        <div>
          <div className="merge-transaction-number">
            {transaction.transactionNumber || '-'}
          </div>

          <div className="merge-transaction-title">
            <Translate>Source Patient</Translate>
          </div>

          <div className="merge-transaction-heading">
            {transaction.fromPatientName || '-'}
          </div>

          <div className="merge-transaction-meta">
            <strong>MRN:</strong> {transaction.fromPatientMrn || '-'}
          </div>

          <div className="merge-transaction-small">
            <Translate>Merged</Translate>: {formatDate(transaction.mergedAt)}
          </div>
        </div>

        <div className="merge-transaction-divider">
          <div className="merge-transaction-divider-line" />
          <FontAwesomeIcon icon={faCodeMerge} className="merge-transaction-arrow" />
          <div className="merge-transaction-divider-line" />
        </div>

        <div>
          <div className="merge-transaction-title">
            <Translate>Target Patient</Translate>
          </div>

          <div className="merge-transaction-heading">
            {transaction.toPatientName || '-'}
          </div>

          <div className="merge-transaction-meta">
            <strong>MRN:</strong> {transaction.toPatientMrn || '-'}
          </div>

          <div className="merge-transaction-small">
            <Translate>Status</Translate>:{' '}
            <span
              className={`merge-status-badge ${
                isMerged ? 'merge-status-merged' : 'merge-status-undone'
              }`}
            >
              {formatEnumString(transaction.mergeStatus) || 'UNKNOWN'}
            </span>
          </div>
        </div>

        <div className="merge-transaction-actions">
          <div className="merge-transaction-action-content">
            <div className="merge-transaction-title">
              <Translate>Merged By</Translate>
            </div>

            <div className="merge-transaction-meta">
              {transaction.mergedBy || '-'}
            </div>

            <div className="merge-transaction-small">
              {formatTime(transaction.mergedAt)}
            </div>
          </div>

          <div className="merge-transaction-buttons">
            <MyButton
              size="sm"
              appearance="ghost"
              onClick={() => onViewChanges(transaction)}
              prefixIcon={() => <FontAwesomeIcon icon={faEye} />}
            >
              <Translate>View Changes</Translate>
            </MyButton>

            {transaction.canUndo && isMerged && (
              <MyButton
                size="sm"
                color="red"
                appearance="primary"
                loading={undoLoading}
                onClick={() => onRequestUndo(transaction.mergeLogId)}
                className="merge-button-undo"
                prefixIcon={() => <FontAwesomeIcon icon={faUndo} />}
              >
                <Translate>Undo</Translate>
              </MyButton>
            )}
          </div>
        </div>
      </div>

      {transaction.reason && (
        <div className="merge-transaction-reason">
          <div className="merge-transaction-reason-title">
            <Translate>Reason</Translate>
          </div>

          <div className="merge-transaction-reason-text">
            {transaction.reason}
          </div>
        </div>
      )}
    </Panel>
  );
};

export default MergeTransactionCard;