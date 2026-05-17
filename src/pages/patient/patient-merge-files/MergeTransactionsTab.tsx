import React, { useMemo, useState } from 'react';
import { Panel, Loader } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUndo,
    faEye,
    faCodeMerge,
    faHistory
} from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';

import { useLazyGetMergeTransactionChangesQuery } from '@/services/patients/patientMergeService';

import './styles.less';
import MergeTransactionChangesModal from './MergeTransactionChangesModal';
import { Form } from 'rsuite';

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
    const [search, setSearch] = useState('');
    const [changesModalOpen, setChangesModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

    const [
        getTransactionChanges,
        { data: changesData, isFetching: changesLoading, error: changesError }
    ] = useLazyGetMergeTransactionChangesQuery();

    const filteredTransactions = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        if (!searchValue) {
            return transactions;
        }

        return transactions.filter((transaction: any) => {
            return (
                transaction.fromPatientName?.toLowerCase().includes(searchValue) ||
                transaction.toPatientName?.toLowerCase().includes(searchValue) ||
                transaction.fromPatientMrn?.toLowerCase().includes(searchValue) ||
                transaction.toPatientMrn?.toLowerCase().includes(searchValue)
            );
        });
    }, [transactions, search]);

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
                                {filteredTransactions.length}
                            </span>
                        )}
                    </div>
                }
                minHeight="auto"
                content={
                    <div className="merge-transactions-root">
                        <div className="merge-transactions-search">
                            <Form fluid>
                                <MyInput
                                    fieldType="text"
                                    fieldName="search"
                                    fieldLabel=""
                                    placeholder="Search by patient name or MRN"
                                    record={{ search }}
                                    setRecord={(updated: any) =>
                                        setSearch(updated?.search || '')
                                    }
                                    width={350}
                                />
                            </Form>
                        </div>

                        {transactionsLoading ? (
                            <Panel className="merge-panel-empty">
                                <Loader
                                    center
                                    content={
                                        <Translate>
                                            Loading transactions...
                                        </Translate>
                                    }
                                />
                            </Panel>
                        ) : filteredTransactions.length === 0 ? (
                            <Panel className="merge-panel-empty">
                                <p className="merge-panel-empty-text">
                                    <Translate>No merge transactions found</Translate>
                                </p>
                            </Panel>
                        ) : (
                            <div className="merge-transactions-list">
                                {filteredTransactions.map((transaction: any) => (
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
                                                    <strong>MRN:</strong>{' '}
                                                    {transaction.fromPatientMrn || '-'}
                                                </div>

                                                <div className="merge-transaction-small">
                                                    <Translate>Merged</Translate>:{' '}
                                                    {formatDate(transaction.mergedAt)}
                                                </div>
                                            </div>

                                            <div className="merge-transaction-divider">
                                                <div className="merge-transaction-divider-line" />

                                                <FontAwesomeIcon
                                                    icon={faCodeMerge}
                                                    className="merge-transaction-arrow"
                                                />

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
                                                    <strong>MRN:</strong>{' '}
                                                    {transaction.toPatientMrn || '-'}
                                                </div>

                                                <div className="merge-transaction-small">
                                                    <Translate>Status</Translate>:{' '}
                                                    <span
                                                        className={`merge-status-badge ${transaction.mergeStatus === 'MERGED'
                                                                ? 'merge-status-merged'
                                                                : 'merge-status-undone'
                                                            }`}
                                                    >
                                                        {transaction.mergeStatus || 'UNKNOWN'}
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
                                                                    <FontAwesomeIcon
                                                                        icon={faUndo}
                                                                    />
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

            <MergeTransactionChangesModal
                open={changesModalOpen}
                transaction={selectedTransaction}
                changesData={changesData}
                loading={changesLoading}
                error={changesError}
                onClose={closeChangesModal}
            />
        </>
    );
};

export default MergeTransactionsTab;