import React from 'react';
import { Form } from 'rsuite';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import './styles.less';

import Translate from '@/components/Translate';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';

import { ConflictDecision } from './types';
import { getEntityLabel } from './utils';
import ConflictCard from './ConflictCard';

interface Props {
    reason: string;
    setReason: (value: string) => void;
    groupedConflicts: Record<string, ConflictDecision[]>;
    decisions: ConflictDecision[];
    lovBulkResponse: any;
    handleDecisionChange: (index: number, finalDecision: string) => void;
    handleValueChange: (index: number, value: any) => void;

    // ✅ Smart rules
    ruleConflicts?: any[];
    handleRuleDecisionChange?: (code: string, decision: string) => void;
}

const MergeConflictsView: React.FC<Props> = ({
    reason,
    setReason,
    groupedConflicts,
    decisions,
    lovBulkResponse,
    handleDecisionChange,
    handleValueChange,
    ruleConflicts,
    handleRuleDecisionChange
}) => {
    console.log("MergeConflictsView - groupedConflicts:", groupedConflicts);
    const mode = useSelector((state: any) => state.ui.mode);

    return (
        <div
            className={`merge-preview-content ${
                mode === 'dark' ? 'dark' : 'light'
            }`}
        >

            {/* ✅ Reason */}
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

            {/* ✅ Field Conflicts */}
            <div className="merge-preview-sections">
                {Object.entries(groupedConflicts).map(
                    ([entityName, entityConflicts]) => (
                        <div
                            key={entityName}
                            className="merge-preview-entity-section"
                        >
                            <SectionContainer
                                title={
                                    <Translate>
                                        {getEntityLabel(entityName)}
                                    </Translate>
                                }
                                icon={faExclamationTriangle}
                                content={
                                    <div className="merge-preview-conflict-list">
                                        {entityConflicts.map(
                                            (conflict, idx) => {

                                                const globalIdx =
                                                    decisions.findIndex(
                                                        d =>
                                                            d.entityName === conflict.entityName &&
                                                            d.fieldName === conflict.fieldName &&
                                                            d.fromRecordId === conflict.fromRecordId
                                                    );

                                                const decision = decisions[globalIdx];

                                                if (!decision) return null;

                                                return (
                                                    <ConflictCard
                                                        key={`${entityName}-${conflict.fieldName || conflict.matchKey}-${idx}`}
                                                        entityName={entityName}
                                                        conflict={conflict}
                                                        decision={decision}
                                                        globalIdx={globalIdx}
                                                        lovBulkResponse={lovBulkResponse}
                                                        handleDecisionChange={handleDecisionChange}
                                                        handleValueChange={handleValueChange}
                                                    />
                                                );
                                            }
                                        )}
                                    </div>
                                }
                            />
                        </div>
                    )
                )}
            </div>

            {/* ✅ ✅ ✅ Smart Rules (NEW SECTION) */}
            {ruleConflicts && ruleConflicts.length > 0 && (
                <div className="merge-preview-entity-section">
                    <SectionContainer
                        title={<Translate>Smart Rules</Translate>}
                        icon={faExclamationTriangle}
                        content={
                            <div>

                                {ruleConflicts.map((rule: any) => (

                                    <div
                                        key={rule.code}
                                        style={{
                                            border: '1px solid #e5e5e5',
                                            borderRadius: 8,
                                            padding: 16,
                                            marginBottom: 16,
                                            background: '#fafafa'
                                        }}
                                    >

                                        {/* ✅ Rule title */}
                                        <div style={{ fontWeight: 600, marginBottom: 10 }}>
                                            {rule.message}
                                        </div>

                                        {/* ✅ Records */}
                                        <div style={{ display: 'flex', gap: 16 }}>
                                            {rule.records?.map((rec: any, i: number) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        border: '1px solid #ddd',
                                                        padding: 10,
                                                        borderRadius: 6,
                                                        background: '#fff'
                                                    }}
                                                >
                                                    {Object.entries(rec).map(([key, value]) => (
                                                        <div key={key}>
                                                            <strong>{key}:</strong> {String(value)}
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>

                                        {/* ✅ Decision buttons */}
                                        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                            {rule.decisionOptions?.map((option: string) => (
                                                <MyButton
                                                    key={option}
                                                    appearance="subtle"
                                                    onClick={() =>
                                                        handleRuleDecisionChange?.(rule.code, option)
                                                    }
                                                >
                                                    {option}
                                                </MyButton>
                                            ))}
                                        </div>

                                    </div>
                                ))}

                            </div>
                        }
                    />
                </div>
            )}

        </div>
    );
};

export default MergeConflictsView;
