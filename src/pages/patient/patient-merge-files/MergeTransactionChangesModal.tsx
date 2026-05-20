import React from 'react';
import { Loader, Message } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRight,
    faHistory,
    faEdit
} from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import { useGetLovValuesByKeyQuery } from '@/services/setupService';
import { formatEnumString } from '@/utils';
import './styles.less';
interface Props {
    open: boolean;
    transaction: any;
    changesData: any;
    loading: boolean;
    error: any;
    onClose: () => void;
}

const TransactionChangeValue = ({
    value,
    inputType
}: {
    value: any;
    inputType?: string;
}) => {
    const hasValue =
        value !== null &&
        value !== undefined &&
        String(value).trim() !== '';

    const shouldFetchLov = inputType === 'LOV' && hasValue;


    const { data: lovValueResponse } = useGetLovValuesByKeyQuery(
        value,
        {
            skip: !shouldFetchLov
        }
    );

    if (!hasValue) {
        return <span className="merge-change-empty">-</span>;
    }

    if (inputType === 'LOV') {
        return (
            <span>
                {lovValueResponse?.object?.lovDisplayVale ??
                    lovValueResponse?.object?.lovDisplayValue ??
                    String(value)}
            </span>
        );
    }

    if (inputType === 'ENUM') {
        return (
            <span>
                {formatEnumString(String(value))}
            </span>
        );
    }

    return <span>{String(value)}</span>;
};

const MergeTransactionChangesModal: React.FC<Props> = ({
    open,
    transaction,
    changesData,
    loading,
    error,
    onClose
}) => {
    const handleModalOpen = (nextOpen: boolean) => {
        if (!nextOpen) {
            onClose();
        }
    };

    const renderFieldChanges = () => {
        const fieldChanges = changesData?.fieldChanges || [];

        if (fieldChanges.length === 0) {
            return (
                <div className="merge-changes-empty">
                    <Translate>
                        No field changes found for this transaction.
                    </Translate>
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

                    <span className="merge-changes-count">
                        {fieldChanges.length}
                    </span>
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
                                    {item.entityName}
                                </div>
                            </div>

                            <div className="merge-change-values">
                                <span className="merge-change-old">
                                    <TransactionChangeValue
                                        value={item.oldValue}
                                        inputType={item.inputType}
                                    />
                                </span>

                                <FontAwesomeIcon
                                    icon={faArrowRight}
                                    className="merge-change-arrow"
                                />

                                <span className="merge-change-new">
                                    <TransactionChangeValue
                                        value={item.newValue}
                                        inputType={item.inputType}
                                    />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

const mode = useSelector((state: any) => state.ui.mode);
    
    return (
        <MyModal
            open={open}
            setOpen={handleModalOpen}
            title={
                <div className="merge-changes-modal-title">
                    <FontAwesomeIcon icon={faHistory} />

                    <span>
                        <Translate>
                            Merge Transaction Changes
                        </Translate>
                    </span>
                </div>
            }
            size="lg"
            bodyheight="70vh"
            content={
                <div className="merge-changes-modal-content" className={`merge-transaction-changes-modal ${mode === 'dark' ? 'dark' : 'light'}`}>
                    {transaction && (
                        <div className="merge-changes-header">
                            <div className="merge-changes-patient-card source">
                                <div className="merge-changes-patient-label">
                                    <Translate>Source Patient</Translate>
                                </div>

                                <div className="merge-changes-patient-name">
                                    {transaction.fromPatientName || '-'}
                                </div>

                                <div className="merge-changes-patient-mrn">
                                    MRN: {transaction.fromPatientMrn || '-'}
                                </div>
                            </div>

                            <div className="merge-changes-header-arrow">
                                <FontAwesomeIcon icon={faArrowRight} />
                            </div>

                            <div className="merge-changes-patient-card target">
                                <div className="merge-changes-patient-label">
                                    <Translate>Target Patient</Translate>
                                </div>

                                <div className="merge-changes-patient-name">
                                    {transaction.toPatientName || '-'}
                                </div>

                                <div className="merge-changes-patient-mrn">
                                    MRN: {transaction.toPatientMrn || '-'}
                                </div>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="merge-changes-loading">
                            <Loader
                                center
                                content={
                                    <Translate>
                                        Loading changes...
                                    </Translate>
                                }
                            />
                        </div>
                    ) : error ? (
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
            hideCancel
            actionButtonLabel={<Translate>Close</Translate>}
            actionButtonFunction={onClose}
        />
    );
};

export default MergeTransactionChangesModal;