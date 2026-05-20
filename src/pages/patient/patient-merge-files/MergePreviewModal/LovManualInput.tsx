import React from 'react';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ConflictDecision } from './types';
import './styles.less';

interface Props {
    decision: ConflictDecision;
    globalIdx: number;
    handleValueChange: (index: number, value: any) => void;
}

const LovManualInput: React.FC<Props> = ({
    decision,
    globalIdx,
    handleValueChange
}) => {
    const { data: lovQueryResponse } = useGetLovValuesByCodeQuery(
        decision.inputSource || '',
        {
            skip: !decision.inputSource
        }
    );

    return (
        <MyInput
            fieldType="select"
            fieldName="selectedValue"
            fieldLabel="Select Value"
            placeholder="Select Value"
            record={{
                selectedValue: decision.selectedValue
            }}
            setRecord={(updatedRecord: any) =>
                handleValueChange(globalIdx, updatedRecord?.selectedValue)
            }
            selectData={lovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            searchable={false}
            width="100%"
            required
        />
    );
};

export default LovManualInput;