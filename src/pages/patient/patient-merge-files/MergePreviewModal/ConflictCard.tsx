import React from 'react';
import { Form } from 'rsuite';
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import { ConflictDecision } from './types';
import { getDecisionOptions } from './utils';
import ReadonlyValueCard from './ReadonlyValueCard';
import ManualInputRenderer from './ManualInputRenderer';
import './styles.less';

interface Props {
    entityName: string;
    conflict: ConflictDecision;
    decision: ConflictDecision;
    globalIdx: number;
    lovBulkResponse: any;
    handleDecisionChange: (index: number, finalDecision: string) => void;
    handleValueChange: (index: number, value: any) => void;
}

const ConflictCard: React.FC<Props> = ({
    entityName,
    conflict,
    decision,
    globalIdx,
    lovBulkResponse,
    handleDecisionChange,
    handleValueChange
}) => {
    const title = conflict.fieldName
        ? conflict.fieldLabel
        : `${entityName} - ${conflict.matchKey}`;

    return (
        <div
            className="merge-preview-conflict-card"
        >
            <div className="merge-preview-conflict-header">
                <div className="merge-preview-conflict-title">
                    <Translate>{title}</Translate>
                </div>
            </div>

            {conflict.fieldName && (
                <div className="merge-preview-values-grid">
                    <ReadonlyValueCard
                        fieldLabel="From Patient"
                        value={conflict.fromValue}
                        type="from"
                        inputType={conflict.inputType}

                    />

                    <ReadonlyValueCard
                        fieldLabel="Primary Patient"
                        value={conflict.toValue}
                        type="to"
                        inputType={conflict.inputType}
                    />
                </div>
            )}

            <div className="merge-preview-decision-area">
                <Form fluid>
                    <MyInput
                        fieldType="select"
                        fieldName="finalDecision"
                        fieldLabel="Decision"
                        record={{
                            finalDecision: decision.finalDecision
                        }}
                        setRecord={(updatedRecord: any) =>
                            handleDecisionChange(
                                globalIdx,
                                updatedRecord?.finalDecision
                            )
                        }
                        selectData={getDecisionOptions(conflict)}
                        selectDataLabel="label"
                        selectDataValue="value"
                        cleanable={false}
                        searchable={false}
                        width="100%"
                        required
                    />

                    {decision.finalDecision === 'MANUAL' && (
                        <ManualInputRenderer
                            decision={decision}
                            globalIdx={globalIdx}
                            handleValueChange={handleValueChange}
                        />
                    )}
                </Form>
            </div>
        </div>
    );
};

export default ConflictCard;