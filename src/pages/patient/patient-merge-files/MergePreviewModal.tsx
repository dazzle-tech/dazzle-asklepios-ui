import React, { useState, useMemo } from 'react';
import { Form, Input, SelectPicker, Message, toaster } from 'rsuite';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faArrowRight, faPlus, faTimes, faList, faExclamationTriangle, faTag, faQuestionCircle, faCheck, faEye, faArrowLeft, faCheckCircle, faFileAlt, faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';

interface ConflictDecision {
    entityName: string;
    tableName: string;
    fromRecordId: any;
    toRecordId: any;
    matchKey: string;
    fieldName: string | null;
    fieldLabel: string;
    fromValue: any;
    toValue: any;
    suggestedDecision: string;
    finalDecision?: string;
    selectedValue?: any;
}

interface MergePreviewModalProps {
    open: boolean;
    conflicts: any[];
    autoTransfers?: any[];
    fromPatientId?: number;
    toPatientId?: number;
    onReviewSummary: (
        decisions: any[],
        reason: string,
        autoTransfers: any[]
    ) => void;
    onConfirmMerge: (
        decisions: any[],
        reason: string,
    ) => void;
    onCancel: () => void;
    loading?: boolean;
    showSummary?: boolean;
    summaryData?: any;
    onBackToConflicts?: () => void;
}

const MergePreviewModal: React.FC<MergePreviewModalProps> = ({
    open,
    conflicts = [],
    autoTransfers = [],

    onReviewSummary,
    onConfirmMerge,
    onCancel,
    loading = false,
    showSummary = false,
    summaryData,
    onBackToConflicts
}) => {
    const [reason, setReason] = useState('Duplicate patient record');
    const [decisions, setDecisions] = useState<ConflictDecision[]>([]);
    const [summaryDecisions, setSummaryDecisions] = useState<ConflictDecision[]>([]);
    const [summaryReason, setSummaryReason] = useState('');
    const groupedConflicts = useMemo(() => {
        const groups: Record<string, ConflictDecision[]> = {};

        conflicts.forEach(conflict => {
            const key = conflict.entityName || 'OTHER';
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(conflict);
        });

        return groups;
    }, [conflicts]);

    React.useEffect(() => {
        if (open && conflicts.length > 0) {
            const initialized = conflicts.map(conflict => ({
                ...conflict,
                finalDecision: conflict.suggestedDecision,
                selectedValue:
                    conflict.suggestedDecision === 'TAKE_FROM' ? conflict.fromValue :
                        conflict.suggestedDecision === 'KEEP_TO' ? conflict.toValue :
                            conflict.suggestedDecision === 'ADD_FROM_RECORD' ? conflict.matchKey || conflict.fromValue :
                                conflict.suggestedDecision === 'IGNORE_FROM_RECORD' ? conflict.matchKey || conflict.fromValue :
                                    null
            }));
            setDecisions(initialized);
        }
    }, [open, conflicts]);

    const handleDecisionChange = (index: number, finalDecision: string) => {
        const updated = [...decisions];
        updated[index].finalDecision = finalDecision;

        if (finalDecision === 'TAKE_FROM') {
            updated[index].selectedValue = updated[index].fromValue;
        } else if (finalDecision === 'KEEP_TO') {
            updated[index].selectedValue = updated[index].toValue;
        } else if (finalDecision === 'ADD_FROM_RECORD') {
            updated[index].selectedValue = updated[index].matchKey || updated[index].fromValue;
        } else if (finalDecision === 'IGNORE_FROM_RECORD') {
            updated[index].selectedValue = updated[index].matchKey || updated[index].fromValue;
        }

        setDecisions(updated);
    };

    const handleValueChange = (index: number, value: any) => {
        const updated = [...decisions];
        updated[index].selectedValue = value;
        setDecisions(updated);
    };

    const allDecisionsComplete = useMemo(() => {
        return decisions.every(d => {
            if (!d.finalDecision) return false;
            if (d.finalDecision === 'MANUAL' && !d.selectedValue) return false;
            return true;
        });
    }, [decisions]);

    const getEntityLabel = (entityName: string) => {
        const labels: Record<string, string> = {
            'PATIENT': 'Patient Basic Information',
            'PATIENT_DOCUMENT': 'Documents',
            'PATIENT_ADDRESS': 'Addresses',
            'PATIENT_PHONE': 'Phone Numbers',
            'PATIENT_EMAIL': 'Email Addresses',
            'PATIENT_INSURANCE': 'Insurance',
            'ENCOUNTER': 'Encounters',
            'APPOINTMENT': 'Appointments',
            'MEDICATION': 'Medications'
        };
        return labels[entityName] || entityName;
    };

    const getDecisionOptions = (conflict: ConflictDecision) => {
        if (conflict.fieldName) {
            // Field-level conflict
            return [
                { label: 'Keep Target Value', value: 'KEEP_TO' },
                { label: 'Use Source Value', value: 'TAKE_FROM' },
                { label: 'Manual Entry', value: 'MANUAL' }
            ];
        } else {
            // Record-level conflict
            return [
                { label: 'Add to Target Patient', value: 'ADD_FROM_RECORD' },
                { label: 'Ignore This Record', value: 'IGNORE_FROM_RECORD' }
            ];
        }
    };

    const handleReviewSummary = () => {
        if (!allDecisionsComplete) {
            toaster.push(
                <Message showIcon type="warning">
                    Please complete all decisions before reviewing summary.
                </Message>,
                { placement: 'topCenter' }
            );
            return;
        }

        setSummaryDecisions([...decisions]);
        setSummaryReason(reason);

        onReviewSummary(decisions, reason, autoTransfers);
    };

    const handleConfirmMerge = () => {
        onConfirmMerge(
            summaryDecisions,
            summaryReason,
        );
    };

    const renderSummarySection = (title: string, items: any[]) => {
    if (!items || items.length === 0) return null;

    const getSectionIcon = (sectionTitle: string) => {
        switch (sectionTitle) {
        case 'Field Updates':
            return faEdit;
        case 'Auto Transfers':
            return faArrowRight;
        case 'Records To Add':
            return faPlus;
        case 'Ignored Items':
            return faTimes;
        default:
            return faList;
        }
    };

    const getDisplayValue = (value: any) => {
        return value != null && String(value).trim() !== ''
        ? String(value)
        : 'Automatically Generated';
    };

    return (
        <SectionContainer
        title={<Translate>{title}</Translate>}
        icon={getSectionIcon(title)}
        content={
            <div className="merge-preview-section-items">
            {items.map((item, idx) => {
                let description = '';

                if (title === 'Field Updates') {
                const oldValue =
                    item.oldValue != null &&
                    String(item.oldValue).trim() !== ''
                    ? String(item.oldValue)
                    : '-';

                const newValue =
                    item.newValue != null &&
                    String(item.newValue).trim() !== ''
                    ? String(item.newValue)
                    : '-';

                description = `${item.fieldLabel || ''}: ${oldValue} → ${newValue} (${item.decision || ''})`;
                }

                if (title === 'Auto Transfers') {
                const transferValue =
                    item.fromValue ??
                    item.newValue ??
                    item.value ??
                    item.toValue;

                description = `${item.fieldLabel || ''} will be filled with ${getDisplayValue(
                    transferValue
                )}`;
                }

                if (title === 'Records To Add') {
                description = `${item.entityName || ''} ${
                    item.matchKey || '-'
                } will be added to the primary patient`;
                }

                if (title === 'Ignored Items') {
                const ignoredValue =
                    item.oldValue ??
                    item.newValue ??
                    item.matchKey ??
                    '-';

                description = item.fieldLabel
                    ? `${item.fieldLabel} ${ignoredValue} will be ignored`
                    : `${item.entityName || ''} (${
                        item.matchKey ||
                        (item.recordId != null
                        ? `ID: ${item.recordId}`
                        : '-')
                    }) will be ignored`;
                }

                return (
                <Form fluid key={idx}>
                    <MyInput
                    fieldType="textarea"
                    fieldName={`summaryItem_${idx}`}
                    fieldLabel=""
                    record={{
                        [`summaryItem_${idx}`]: description
                    }}
                    setRecord={() => {}}
                    readOnly
                    rows={2}
                    width="100%"
                    />
                </Form>
                );
            })}
            </div>
        }
        />
    );
    };

    const renderSummaryContent = () => (
        <div className="merge-preview-content">
            <Form fluid>
                <MyInput
                    fieldType="textarea"
                    fieldName="summaryReason"
                    fieldLabel="Merge Reason"
                    record={{
                        summaryReason: summaryReason || '-'
                    }}
                    setRecord={() => { }}
                    readOnly
                    rows={3}
                    width="100%"
                />
            </Form>

            {renderSummarySection(
                'Field Updates',
                summaryData?.fieldUpdates || []
            )}

            {renderSummarySection(
                'Auto Transfers',
                summaryData?.autoTransfers || []
            )}

            {renderSummarySection(
                'Records To Add',
                summaryData?.recordsToAdd || []
            )}

            {renderSummarySection(
                'Ignored Items',
                summaryData?.ignoredItems || []
            )}
        </div>
    );

    const renderConflictsContent = () => {
    const renderReadonlyValue = (
        fieldLabel: string,
        value: any,
        type: 'from' | 'to'
    ) => (
        <div className={`merge-preview-value-card ${type}`}>
        <div className="merge-preview-value-card-header">
            <div className={`merge-preview-value-badge ${type}`}>
            <Translate>{fieldLabel}</Translate>
            </div>
        </div>

        <div className="merge-preview-value-card-content">
            {value != null && String(value).trim() !== ''
            ? String(value)
            : '-'}
        </div>
        </div>
    );

    return (
        <div className="merge-preview-content">
        {/* Merge Reason */}
        <div className="merge-preview-reason-card">
            <Form fluid>
            <MyInput
                fieldType="textarea"
                fieldName="reason"
                fieldLabel="Merge Reason"
                record={{ reason }}
                setRecord={(updatedRecord: any) =>
                setReason(updatedRecord?.reason ?? '')
                }
                rows={3}
                width="100%"
                required
            />
            </Form>
        </div>

        {/* Conflict Groups */}
        <div className="merge-preview-sections">
            {Object.entries(groupedConflicts).map(
            ([entityName, entityConflicts]) => (
                <div
                key={entityName}
                className="merge-preview-entity-section"
                >
                <SectionContainer
                    title={
                    <Translate>{getEntityLabel(entityName)}</Translate>
                    }
                    icon={faExclamationTriangle}
                    content={
                    <div className="merge-preview-conflict-list">
                        {entityConflicts.map((conflict, idx) => {
                        const globalIdx = decisions.findIndex(
                            d =>
                            d.entityName === conflict.entityName &&
                            d.fieldName === conflict.fieldName &&
                            d.fromRecordId === conflict.fromRecordId
                        );

                        const decision = decisions[globalIdx];

                        if (!decision) return null;

                        const title = conflict.fieldName
                            ? conflict.fieldLabel
                            : `${entityName} - ${conflict.matchKey}`;

                        return (
                            <div
                            key={`${entityName}-${conflict.fieldName || conflict.matchKey}-${idx}`}
                            className="merge-preview-conflict-card"
                            >
                            {/* Conflict Title */}
                            <div className="merge-preview-conflict-header">
                                <div className="merge-preview-conflict-title">
                                <Translate>{title}</Translate>
                                </div>
                            </div>

                            {/* Source / Target Values */}
                            {conflict.fieldName && (
                                <div className="merge-preview-values-grid">
                                {renderReadonlyValue(
                                    'From Patient',
                                    conflict.fromValue,
                                    'from'
                                )}

                                {renderReadonlyValue(
                                    'Primary Patient',
                                    conflict.toValue,
                                    'to'
                                )}
                                </div>
                            )}

                            {/* Decision Section */}
                            <div className="merge-preview-decision-area">
                                <Form fluid>
                                <MyInput
                                    fieldType="select"
                                    fieldName="finalDecision"
                                    fieldLabel="Decision"
                                    record={{
                                    finalDecision:
                                        decision.finalDecision
                                    }}
                                    setRecord={(updatedRecord: any) =>
                                    handleDecisionChange(
                                        globalIdx,
                                        updatedRecord?.finalDecision
                                    )
                                    }
                                    selectData={getDecisionOptions(
                                    conflict
                                    )}
                                    selectDataLabel="label"
                                    selectDataValue="value"
                                    cleanable={false}
                                    searchable={false}
                                    width="100%"
                                    required
                                />

                                {decision.finalDecision ===
                                    'MANUAL' && (
                                    <MyInput
                                    fieldType="text"
                                    fieldName="selectedValue"
                                    fieldLabel="Enter Value"
                                    record={{
                                        selectedValue:
                                        decision.selectedValue !=
                                        null
                                            ? String(
                                                decision.selectedValue
                                            )
                                            : ''
                                    }}
                                    setRecord={(
                                        updatedRecord: any
                                    ) =>
                                        handleValueChange(
                                        globalIdx,
                                        updatedRecord?.selectedValue
                                        )
                                    }
                                    width="100%"
                                    required
                                    />
                                )}
                                </Form>
                            </div>
                            </div>
                        );
                        })}
                    </div>
                    }
                />
                </div>
            )
            )}
        </div>
        </div>
    );
    };


    const setModalOpen = (nextOpen: boolean) => {
        if (!nextOpen) {
            onCancel();
        }
    };

    const BackToConflictsIcon = (props: any) => (
        <FontAwesomeIcon icon={faArrowLeft} style={props.style} />
    );

    const ConfirmMergeIcon = (props: any) => (
        <FontAwesomeIcon icon={faCheck} style={props.style} />
    );

    const ReviewSummaryIcon = (props: any) => (
        <FontAwesomeIcon icon={faEye} style={props.style} />
    );

    const renderFooterButtons = () => (
    <>
        <MyButton
        onClick={onCancel}
        disabled={loading}
        appearance="subtle"
        >
        <Translate>Cancel</Translate>
        </MyButton>

        {showSummary ? (
        <>
            <MyButton
            onClick={onBackToConflicts}
            disabled={loading}
            appearance="ghost"
            prefixIcon={BackToConflictsIcon}
            >
            <Translate>Back to Conflicts</Translate>
            </MyButton>

            <MyButton
            onClick={handleConfirmMerge}
            loading={loading}
            prefixIcon={ConfirmMergeIcon}
            >
            <Translate>Confirm Merge</Translate>
            </MyButton>
        </>
        ) : (
        <MyButton
            onClick={handleReviewSummary}
            loading={loading}
            disabled={!allDecisionsComplete || loading}
            prefixIcon={ReviewSummaryIcon}
        >
            <Translate>Review Summary</Translate>
        </MyButton>
        )}
    </>
    );

    return (
        <MyModal
            open={open}
            setOpen={setModalOpen}
            size="lg"
            bodyheight="75vh"
            customClassName="merge-preview-modal"
            hideCancel
            hideBack
            hideActionBtn
            title={<Translate>{showSummary ? 'Merge Summary - Review Changes' : 'Merge Preview - Resolve Conflicts'}</Translate>}
            content={
                <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '24px' }}>
                    {showSummary ? renderSummaryContent() : renderConflictsContent()}
                </div>
            }
            footerButtons={renderFooterButtons()}
        />
    );
};

export default MergePreviewModal;
