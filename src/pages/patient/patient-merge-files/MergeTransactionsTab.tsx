import {
    faHistory
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useMemo, useState } from 'react';
import { Loader, Panel } from 'rsuite';

import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';

import { useLazyGetMergeTransactionChangesQuery } from '@/services/patients/patientMergeService';

import { useSelector } from 'react-redux';
import { Form } from 'rsuite';
import MergeTransactionCard from './MergeTransactionCard';
import MergeTransactionChangesModal from './MergeTransactionChangesModal';
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
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'MERGED' | 'UNDO'>('ALL');
    const [changesModalOpen, setChangesModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

    const [
        getTransactionChanges,
        { data: changesData, isFetching: changesLoading, error: changesError }
    ] = useLazyGetMergeTransactionChangesQuery();

    const filteredTransactions = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        return transactions.filter((transaction: any) => {
            const matchesSearch =
                !searchValue ||
                transaction.fromPatientName?.toLowerCase().includes(searchValue) ||
                transaction.toPatientName?.toLowerCase().includes(searchValue) ||
                transaction.fromPatientMrn?.toLowerCase().includes(searchValue) ||
                transaction.toPatientMrn?.toLowerCase().includes(searchValue) ||
                transaction.transactionNumber?.toLowerCase().includes(searchValue);

            let matchesStatus = true;

            if (statusFilter === 'MERGED') {
                matchesStatus = transaction.mergeStatus === 'MERGED';
            }

            if (statusFilter === 'UNDO') {
                matchesStatus = transaction.mergeStatus === 'UNDO';
            }

            return matchesSearch && matchesStatus;
        });
    }, [transactions, search, statusFilter]);

    const mode = useSelector((state: any) => state.ui.mode);


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
                    <div
                        className={`merge-transactions-root ${mode === 'dark' ? 'dark' : 'light'
                            }`}
                    >
                        <div className="merge-transactions-search">
                            <Form fluid>
                                <MyInput
                                    fieldType="text"
                                    fieldName="search"
                                    fieldLabel=""
                                    placeholder="Search by patient name or MRN or Transaction Number"
                                    record={{ search }}
                                    setRecord={(updated: any) =>
                                        setSearch(updated?.search || '')
                                    }
                                    width={350}
                                />
                            </Form>
                        </div>
                        <div className="merge-transactions-filters">

                            <div
                                className={`merge-filter-badge merge-filter-merged ${statusFilter === 'MERGED' ? 'active' : ''
                                    }`}
                                onClick={() =>
                                    setStatusFilter(statusFilter === 'MERGED' ? 'ALL' : 'MERGED')
                                }
                            >
                                <Translate>Merged</Translate>
                                {/* <div className="count">{mergedCount}</div> */}
                            </div>

                            <div
                                className={`merge-filter-badge merge-filter-undone ${statusFilter === 'UNDO' ? 'active' : ''
                                    }`}
                                onClick={() =>
                                    setStatusFilter(statusFilter === 'UNDO' ? 'ALL' : 'UNDO')
                                }
                            >
                                <Translate>Undone</Translate>
                                {/* <div className="count">{undoneCount}</div> */}
                            </div>

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
                                    <MergeTransactionCard
                                        key={transaction.mergeLogId}
                                        transaction={transaction}
                                        undoLoading={undoLoading}
                                        onViewChanges={handleViewChanges}
                                        onRequestUndo={onRequestUndo}
                                    />
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