import React, { useState, useMemo } from 'react';
import { Message, toaster } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheck,
    faEye,
    faArrowLeft
} from '@fortawesome/free-solid-svg-icons';

import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';

import { useGetLovValuesBulkByKeysQuery } from '@/services/setupService';

import { ConflictDecision, MergePreviewModalProps } from './types';
import MergeConflictsView from './MergeConflictsView';
import MergeSummaryView from './MergeSummaryView';
import { sanitizeDecisionsForApi } from './utils';

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
    ruleConflicts,
    onBackToConflicts
}) => {

    const [reason, setReason] = useState('Duplicate patient record');
    const [decisions, setDecisions] = useState<ConflictDecision[]>([]);
    const [summaryDecisions, setSummaryDecisions] = useState<ConflictDecision[]>([]);
    const [summaryReason, setSummaryReason] = useState('');
    console.log("Summary Data in MergePreviewModal:", summaryData);
    // ✅ ✅ NEW → rule decisions
    const [ruleDecisions, setRuleDecisions] = useState<Record<string, string>>({});


    // ✅ group conflicts
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

    // ✅ initialize decisions
    React.useEffect(() => {
        if (open && conflicts.length > 0) {
            const initialized = conflicts.map(conflict => ({
                ...conflict,
                finalDecision: conflict.suggestedDecision,
                selectedValue:
                    conflict.suggestedDecision === 'TAKE_FROM'
                        ? conflict.fromValue
                        : conflict.suggestedDecision === 'KEEP_TO'
                            ? conflict.toValue
                            : conflict.suggestedDecision === 'ADD_FROM_RECORD'
                                ? conflict.matchKey || conflict.fromValue
                                : conflict.suggestedDecision === 'IGNORE_FROM_RECORD'
                                    ? conflict.matchKey || conflict.fromValue
                                    : ''
            }));

            setDecisions(initialized);
        }

        if (open && conflicts.length === 0) {
            setDecisions([]);
        }
    }, [open, conflicts]);

    // ✅ LOV
    const lovKeys = useMemo(() => {
        return Array.from(
            new Set(
                decisions
                    .filter(d => d.inputType === 'LOV' && d.inputSource)
                    .map(d => d.inputSource as string)
            )
        );
    }, [decisions]);

    const { data: lovBulkResponse } = useGetLovValuesBulkByKeysQuery(
        lovKeys,
        { skip: lovKeys.length === 0 }
    );


    // ✅ field decision
    const handleDecisionChange = (index: number, finalDecision: string) => {
        const updated = [...decisions];

        updated[index].finalDecision = finalDecision;

        if (finalDecision === 'TAKE_FROM') {
            updated[index].selectedValue = updated[index].fromValue;
        } else if (finalDecision === 'KEEP_TO') {
            updated[index].selectedValue = updated[index].toValue;
        } else if (finalDecision === 'ADD_FROM_RECORD') {
            updated[index].selectedValue =
                updated[index].matchKey || updated[index].fromValue;
        } else if (finalDecision === 'IGNORE_FROM_RECORD') {
            updated[index].selectedValue =
                updated[index].matchKey || updated[index].fromValue;
        } else if (finalDecision === 'MANUAL') {
            updated[index].selectedValue = '';
        }

        setDecisions(updated);
    };

    const handleValueChange = (index: number, value: any) => {
        const updated = [...decisions];
        updated[index].selectedValue = value;
        setDecisions(updated);
    };

    // ✅ ✅ NEW → rule decisions handler
    const handleRuleDecisionChange = (code: string, decision: string) => {
        setRuleDecisions(prev => ({
            ...prev,
            [code]: decision
        }));
    };

    // ✅ validation
    const allDecisionsComplete = useMemo(() => {
        return decisions.every(d => {
            if (!d.finalDecision) return false;

            if (d.finalDecision === 'MANUAL') {
                return (
                    d.selectedValue !== null &&
                    d.selectedValue !== undefined &&
                    String(d.selectedValue).trim() !== ''
                );
            }

            return true;
        });
    }, [decisions]);

    // ✅ review
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

        const apiDecisions = sanitizeDecisionsForApi(decisions);

        setSummaryDecisions(apiDecisions as ConflictDecision[]);
        setSummaryReason(reason);

        onReviewSummary(apiDecisions, reason, conflicts, autoTransfers);
    };

    // ✅ ✅ confirm merge (with ruleDecisions)
    const handleConfirmMerge = () => {
        onConfirmMerge(
            sanitizeDecisionsForApi(summaryDecisions),
            summaryReason,
            ruleDecisions   // ✅ CRITICAL
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
            <MyButton onClick={onCancel} disabled={loading} appearance="subtle">
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
            title={
                <Translate>
                    {showSummary
                        ? 'Merge Summary - Review Changes'
                        : 'Merge Preview - Resolve Conflicts'}
                </Translate>
            }
            content={
                <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '24px' }}>
                    {showSummary && summaryData ? (
                        <MergeSummaryView
                            summaryReason={summaryReason}
                            summaryData={summaryData}
                        />
                    ) : (
                        <MergeConflictsView
                            reason={reason}
                            setReason={setReason}
                            groupedConflicts={groupedConflicts}
                            decisions={decisions}
                            lovBulkResponse={lovBulkResponse}
                            handleDecisionChange={handleDecisionChange}
                            handleValueChange={handleValueChange}

                            // ✅ ✅ FIX HERE
                            ruleConflicts={ruleConflicts || []}
                            handleRuleDecisionChange={handleRuleDecisionChange}
                        />
                    )}
                </div>
            }
            footerButtons={renderFooterButtons()}
        />
    );
};

export default MergePreviewModal;