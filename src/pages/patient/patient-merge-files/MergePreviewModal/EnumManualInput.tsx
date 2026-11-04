import React from 'react';
import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';
import { ConflictDecision } from './types';

interface Props {
    decision: ConflictDecision;
    globalIdx: number;
    handleValueChange: (index: number, value: any) => void;
}

const EnumManualInput: React.FC<Props> = ({
    decision,
    globalIdx,
    handleValueChange
}) => {
    const enumOptions = useEnumOptions(decision.inputSource || '');

    return (
        <MyInput
            fieldType="select"
            fieldName="selectedValue"
            fieldLabel="Select Value"
            record={{
                selectedValue: decision.selectedValue
            }}
            setRecord={(updatedRecord: any) =>
                handleValueChange(globalIdx, updatedRecord?.selectedValue)
            }
            isEnum
            selectData={enumOptions ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            searchable={false}
            width="100%"
            required
        />
    );
};

export default EnumManualInput;