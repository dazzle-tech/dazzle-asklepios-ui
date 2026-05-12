import React from 'react';
import { Form } from 'rsuite';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import Translate from '@/components/Translate';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';

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
}

const MergeConflictsView: React.FC<Props> = ({
    reason,
    setReason,
    groupedConflicts,
    decisions,
    lovBulkResponse,
    handleDecisionChange,
    handleValueChange
}) => {
    return (
        <div className="merge-preview-content">
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

export default MergeConflictsView;