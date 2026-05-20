import React from 'react';
import { Form } from 'rsuite';

import Translate from '@/components/Translate';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import './styles.less';

import { getSectionIcon } from './utils';
import { formatEnumString } from '@/utils';
import { useGetLovValuesByKeyQuery } from '@/services/setupService';

interface Props {
    summaryReason: string;
    summaryData: any;
}

const SummaryValue = ({
    value,
    inputType
}: {
    value: any;
    inputType?: string;
}) => {
    const shouldFetchLov =
        inputType === 'LOV' &&
        value !== null &&
        value !== undefined &&
        String(value).trim() !== '';

    const { data: lovValueResponse } = useGetLovValuesByKeyQuery(
        value,
        {
            skip: !shouldFetchLov
        }
    );

    if (value === null || value === undefined || String(value).trim() === '') {
        return <span className="merge-summary-empty">-</span>;
    }

    if (inputType === 'LOV') {
        return (
            <span className="merge-summary-value">
                {lovValueResponse?.object?.lovDisplayVale ??
                    lovValueResponse?.object?.lovDisplayValue ??
                    String(value)}
            </span>
        );
    }

    if (inputType === 'ENUM') {
        return (
            <span className="merge-summary-value">
                {formatEnumString(String(value))}
            </span>
        );
    }

    return (
        <span className="merge-summary-value">
            {String(value)}
        </span>
    );
};

const MergeSummaryView: React.FC<Props> = ({
    summaryReason,
    summaryData
}) => {
    const renderSummarySection = (title: string, items: any[]) => {
        if (!items || items.length === 0) return null;

        return (
            <SectionContainer
                title={<Translate>{title}</Translate>}
                icon={getSectionIcon(title)}
                content={
                    <div className="merge-summary-list">
                        {items.map((item, idx) => {
                            if (title === 'Field Updates') {
                                return (
                                    <div
                                        key={idx}
                                        className="merge-summary-card field-update"
                                    >
                                        <div className="merge-summary-card-header">
                                            <div className="merge-summary-title">
                                                <Translate>{item.fieldLabel || '-'}</Translate>
                                            </div>

                                            <div className="merge-summary-badge">
                                                {item.decision || '-'}
                                            </div>
                                        </div>

                                        <div className="merge-summary-values-row">
                                            <div className="merge-summary-value-box old">
                                                <div className="merge-summary-label">
                                                    <Translate>Old Value</Translate>
                                                </div>
                                                <SummaryValue
                                                    value={item.oldValue}
                                                    inputType={item.inputType}
                                                />
                                            </div>

                                            <div className="merge-summary-arrow">
                                                →
                                            </div>

                                            <div className="merge-summary-value-box new">
                                                <div className="merge-summary-label">
                                                    <Translate>New Value</Translate>
                                                </div>
                                                <SummaryValue
                                                    value={item.newValue}
                                                    inputType={item.inputType}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            if (title === 'Auto Transfers') {
                                const transferValue =
                                    item.fromValue ??
                                    item.newValue ??
                                    item.value ??
                                    item.toValue;

                                return (
                                    <div
                                        key={idx}
                                        className="merge-summary-card auto-transfer"
                                    >
                                        <div className="merge-summary-card-header">
                                            <div className="merge-summary-title">
                                                <Translate>{item.fieldLabel || '-'}</Translate>
                                            </div>

                                            <div className="merge-summary-badge">
                                                {item.decision || 'TAKE_FROM'}
                                            </div>
                                        </div>

                                        <div className="merge-summary-single-line">
                                            <Translate>Will be filled with</Translate>
                                            <SummaryValue
                                                value={transferValue}
                                                inputType={item.inputType}
                                            />
                                        </div>
                                    </div>
                                );
                            }

                            if (title === 'Records To Add') {
                                return (
                                    <div
                                        key={idx}
                                        className="merge-summary-card record-add"
                                    >
                                        <div className="merge-summary-card-header">
                                            <div className="merge-summary-title">
                                                <Translate>{item.entityName || '-'}</Translate>
                                            </div>

                                            <div className="merge-summary-badge">
                                                {item.decision || 'ADD_FROM_RECORD'}
                                            </div>
                                        </div>

                                        <div className="merge-summary-single-line">
                                            <span>{item.matchKey || '-'}</span>
                                            <Translate>will be added to the primary patient</Translate>
                                        </div>
                                    </div>
                                );
                            }

                            if (title === 'Ignored Items') {
                                const ignoredValue =
                                    item.oldValue ??
                                    item.newValue ??
                                    item.matchKey ??
                                    '-';

                                return (
                                    <div
                                        key={idx}
                                        className="merge-summary-card ignored"
                                    >
                                        <div className="merge-summary-card-header">
                                            <div className="merge-summary-title">
                                                <Translate>
                                                    {item.fieldLabel || item.entityName || '-'}
                                                </Translate>
                                            </div>

                                            <div className="merge-summary-badge">
                                                {item.decision || 'IGNORED'}
                                            </div>
                                        </div>

                                        <div className="merge-summary-single-line">
                                            <SummaryValue
                                                value={ignoredValue}
                                                inputType={item.inputType}
                                            />
                                            <Translate>will be ignored</Translate>
                                        </div>
                                    </div>
                                );
                            }

                            return null;
                        })}
                    </div>
                }
            />
        );
    };

    return (
        <div className="merge-preview-content">
            <Form fluid>
                <MyInput
                    fieldType="textarea"
                    fieldName="summaryReason"
                    fieldLabel="Merge Reason"
                    record={{
                        summaryReason: summaryReason || '-'
                    }}
                    setRecord={() => {}}
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
};

export default MergeSummaryView;