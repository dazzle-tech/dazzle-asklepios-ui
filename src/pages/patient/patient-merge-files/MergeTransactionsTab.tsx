import React, { useState } from 'react';
import { Panel, Button, Modal, Loader, Message } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faUndo,
  faEye,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import { useLazyGetMergeTransactionChangesQuery } from '@/services/patients/patientMergeService';
import './styles.less';

interface MergeTransactionsTabProps {
  transactions?: any[];
  transactionsLoading: boolean;
  onRequestUndo: (mergeLogId: number) => void;
  undoLoading: boolean;
}

const MergeTransactionsTab: React.FC<MergeTransactionsTabProps> = ({
  transactions = [],
  transactionsLoading,
  onRequestUndo,
  undoLoading
}) => {
  const [changesModalOpen, setChangesModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const [
    getTransactionChanges,
    { data: changesData, isFetching: changesLoading, error: changesError }
  ] = useLazyGetMergeTransactionChangesQuery();

  const handleViewChanges = async (transaction: any) => {
    setSelectedTransaction(transaction);
    setChangesModalOpen(true);

    await getTransactionChanges({
      mergeLogId: transaction.mergeLogId
    });
  };

  const closeChangesModal = () => {
    setChangesModalOpen(false);
    setSelectedTransaction(null);
  };

  const formatDate = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('ar-SA');
  };

  const formatTime = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderFieldChanges = () => {
    const fieldChanges = changesData?.fieldChanges || [];

    if (fieldChanges.length === 0) {
      return (
        <div className="merge-changes-empty">
          No field changes found for this transaction.
        </div>
      );
    }

    return (
      <div className="merge-changes-section">
        <div className="merge-changes-section-title">
          <FontAwesomeIcon icon={faEdit} />
          <span>Field Changes</span>
          <span className="merge-changes-count">{fieldChanges.length}</span>
        </div>

        <div className="merge-changes-list">
          {fieldChanges.map((item: any, index: number) => (
            <div key={`${item.fieldName}-${index}`} className="merge-change-row">
              <div className="merge-change-field">
                <div className="merge-change-label">
                  {item.fieldLabel || item.fieldName}
                </div>
                <div className="merge-change-meta">
                  {item.entityName} / {item.tableName}
                </div>
              </div>

              <div className="merge-change-values">
                <span className="merge-change-old">
                  {item.oldValue || '-'}
                </span>

                <FontAwesomeIcon icon={faArrowRight} className="merge-change-arrow" />

                <span className="merge-change-new">
                  {item.newValue || '-'}
                </span>
              </div>

              <div className="merge-change-decision">
                {item.decision}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="merge-transactions-root">
      {transactionsLoading ? (
        <Panel className="merge-panel-empty">
          <p className="merge-panel-empty-text">Loading transactions...</p>
        </Panel>
      ) : transactions.length === 0 ? (
        <Panel className="merge-panel-empty">
          <p className="merge-panel-empty-text">No merge transactions found</p>
        </Panel>
      ) : (
        <div className="merge-transactions-list">
          {transactions.map((transaction: any) => (
            <Panel
              key={transaction.mergeLogId}
              bordered
              className="merge-transaction-card"
            >
              <div className="merge-transaction-grid">
                <div>
                  <div className="merge-transaction-title">Source</div>
                  <div className="merge-transaction-heading">
                    {transaction.fromPatientName || '-'}
                  </div>
                  <div className="merge-transaction-meta">
                    <strong>ID:</strong> {transaction.fromPatientId}
                  </div>
                  <div className="merge-transaction-small">
                    <div>Merged: {formatDate(transaction.mergedAt)}</div>
                  </div>
                </div>

                <div className="merge-transaction-divider">
                  <div className="merge-transaction-divider-line" />
                  <FontAwesomeIcon icon={faArrowRight} className="merge-transaction-arrow" />
                  <div className="merge-transaction-divider-line" />
                </div>

                <div>
                  <div className="merge-transaction-title">Target</div>
                  <div className="merge-transaction-heading">
                    {transaction.toPatientName || '-'}
                  </div>
                  <div className="merge-transaction-meta">
                    <strong>ID:</strong> {transaction.toPatientId}
                  </div>
                  <div className="merge-transaction-small">
                    <div>
                      Status:{' '}
                      <span
                        className={`merge-status-badge ${
                          transaction.mergeStatus === 'MERGED'
                            ? 'merge-status-merged'
                            : 'merge-status-undone'
                        }`}
                      >
                        {transaction.mergeStatus || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="merge-transaction-actions">
                  <div className="merge-transaction-action-content">
                    <div className="merge-transaction-title">Merged By</div>
                    <div className="merge-transaction-meta">
                      {transaction.mergedBy || '-'}
                    </div>
                    <div className="merge-transaction-small">
                      {formatTime(transaction.mergedAt)}
                    </div>
                  </div>

                  <div className="merge-transaction-buttons">
                    <Button
                      size="sm"
                      appearance="ghost"
                      onClick={() => handleViewChanges(transaction)}
                      startIcon={<FontAwesomeIcon icon={faEye} />}
                    >
                      View Changes
                    </Button>

                    {transaction.canUndo && transaction.mergeStatus === 'MERGED' && (
                      <Button
                        size="sm"
                        color="red"
                        appearance="primary"
                        loading={undoLoading}
                        onClick={() => onRequestUndo(transaction.mergeLogId)}
                        startIcon={<FontAwesomeIcon icon={faUndo} />}
                        className="merge-button-undo"
                      >
                        Undo
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {transaction.reason && (
                <div className="merge-transaction-reason">
                  <div className="merge-transaction-reason-title">Reason</div>
                  <div className="merge-transaction-reason-text">
                    {transaction.reason}
                  </div>
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}

      <Modal
        open={changesModalOpen}
        onClose={closeChangesModal}
        size="lg"
        backdrop="static"
      >
        <Modal.Header>
          <Modal.Title>
            Merge Transaction Changes #{selectedTransaction?.mergeLogId}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedTransaction && (
            <div className="merge-changes-header">
              <div>
                <strong>{selectedTransaction.fromPatientName}</strong>
                <span> #{selectedTransaction.fromPatientId}</span>
              </div>

              <FontAwesomeIcon icon={faArrowRight} />

              <div>
                <strong>{selectedTransaction.toPatientName}</strong>
                <span> #{selectedTransaction.toPatientId}</span>
              </div>
            </div>
          )}

          {changesLoading ? (
            <div className="merge-changes-loading">
              <Loader content="Loading changes..." />
            </div>
          ) : changesError ? (
            <Message showIcon type="error">
              Failed to load transaction changes.
            </Message>
          ) : (
            renderFieldChanges()
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={closeChangesModal} appearance="primary">
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MergeTransactionsTab;