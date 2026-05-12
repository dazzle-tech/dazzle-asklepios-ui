import React from 'react';
import Translate from '@/components/Translate';
import { useGetLovValuesByKeyQuery } from '@/services/setupService';
import { formatEnumString } from '@/utils';

interface Props {
    fieldLabel: string;
    value: any;
    type: 'from' | 'to';
    inputType?: string;
}

const ReadonlyValueCard: React.FC<Props> = ({
    fieldLabel,
    value,
    type,
    inputType
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

    const getDisplayValue = () => {
        if (value === null || value === undefined || String(value).trim() === '') {
            return '-';
        }

        if (inputType === 'LOV') {
            return (
                lovValueResponse?.object?.lovDisplayVale ??

                String(value)
            );
        }
        if (inputType === 'ENUM') {
            return formatEnumString(String(value));
        }
        return String(value);
    };

    return (
        <div className={`merge-preview-value-card ${type}`}>
            <div className="merge-preview-value-card-header">
                <div className={`merge-preview-value-badge ${type}`}>
                    <Translate>{fieldLabel}</Translate>
                </div>
            </div>

            <div className="merge-preview-value-card-content">
                {getDisplayValue()}
            </div>
        </div>
    );
};

export default ReadonlyValueCard;