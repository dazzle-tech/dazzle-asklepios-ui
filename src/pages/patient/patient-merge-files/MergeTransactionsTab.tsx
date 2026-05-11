import React, { useState } from 'react';
import { Panel, Button, Loader, Message } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faUndo,
  faEye,
  faEdit,
  faCodeMerge,
  faHistory
} from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';

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
          <Translate>No field changes found for this transaction.</Translate>
        </div>
      );
    }

    return (
      <div className="merge-changes-section">
        <div className="merge-changes-section-title">
          <FontAwesomeIcon icon={faEdit} />
          <span>
            <Translate>Field Changes</Translate>
          </span>
          <span className="merge-changes-count">{fieldChanges.length}</span>
        </div>

        <div className="merge-changes-list">
          {fieldChanges.map((item: any, index: number) => (
            <div
              key={`${item.fieldName}-${index}`}
              className="merge-change-row"
            >
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

                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="merge-change-arrow"
                />

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
    <>
      <SectionContainer
        title={
          <div className="merge-transactions-title">
            <FontAwesomeIcon icon={faHistory} />
            <span>
              <Translate>Merge Transactions</Translate>
            </span>
            {!transactionsLoading && (
              <span className="merge-transactions-count">
                {transactions.length}
              </span>
            )}
          </div>
        }
        minHeight="auto"
        content={
          <div className="merge-transactions-root">
            {transactionsLoading ? (
              <Panel className="merge-panel-empty">
                <Loader
                  center
                  content={<Translate>Loading transactions...</Translate>}
                />
              </Panel>
            ) : transactions.length === 0 ? (
              <Panel className="merge-panel-empty">
                <p className="merge-panel-empty-text">
                  <Translate>No merge transactions found</Translate>
                </p>
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
                      {/* Source */}
                      <div>
                        <div className="merge-transaction-title">
                          <Translate>Source Patient</Translate>
                        </div>

                        <div className="merge-transaction-heading">
                          {transaction.fromPatientName || '-'}
                        </div>

                        <div className="merge-transaction-meta">
                          <strong>ID:</strong> {transaction.fromPatientId}
                        </div>

                        <div className="merge-transaction-small">
                          <Translate>Merged</Translate>:{' '}
                          {formatDate(transaction.mergedAt)}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="merge-transaction-divider">
                        <div className="merge-transaction-divider-line" />
                        <FontAwesomeIcon
                          icon={faCodeMerge}
                          className="merge-transaction-arrow"
                        />
                        <div className="merge-transaction-divider-line" />
                      </div>

                      {/* Target */}
                      <div>
                        <div className="merge-transaction-title">
                          <Translate>Target Patient</Translate>
                        </div>

                        <div className="merge-transaction-heading">
                          {transaction.toPatientName || '-'}
                        </div>

                        <div className="merge-transaction-meta">
                          <strong>ID:</strong> {transaction.toPatientId}
                        </div>

                        <div className="merge-transaction-small">
                          <Translate>Status</Translate>:{' '}
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

                      {/* Actions */}
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
                            onClick={() =>
                              handleViewChanges(transaction)
                            }
                            prefixIcon={() => (
                              <FontAwesomeIcon icon={faEye} />
                            )}
                          >
                            <Translate>View Changes</Translate>
                          </MyButton>

                          {transaction.canUndo &&
                            transaction.mergeStatus === 'MERGED' && (
                              <MyButton
                                size="sm"
                                color="red"
                                appearance="primary"
                                loading={undoLoading}
                                onClick={() =>
                                  onRequestUndo(
                                    transaction.mergeLogId
                                  )
                                }
                                className="merge-button-undo"
                                prefixIcon={() => (
                                  <FontAwesomeIcon icon={faUndo} />
                                )}
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
                ))}
              </div>
            )}
          </div>
        }
      />

      <MyModal
        open={changesModalOpen}
        setOpen={setChangesModalOpen}
        title={`Merge Transaction Changes #${selectedTransaction?.mergeLogId ?? ''}`}
        size="lg"
        content={
          <div className="merge-changes-modal-content">
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
                <Loader
                  center
                  content={<Translate>Loading changes...</Translate>}
                />
              </div>
            ) : changesError ? (
              <Message showIcon type="error">
                <Translate>
                  Failed to load transaction changes.
                </Translate>
              </Message>
            ) : (
              renderFieldChanges()
            )}
          </div>
        }
        hideCancel={true}
        actionButtonLabel="Close"
        actionButtonFunction={closeChangesModal}
      />
    </>
  );
};

export default MergeTransactionsTab;