import React from 'react';
import MyInput from '@/components/MyInput';
import { ConflictDecision } from './types';
import EnumManualInput from './EnumManualInput';
import LovManualInput from './LovManualInput';

interface Props {
    decision: ConflictDecision;
    globalIdx: number;
    handleValueChange: (index: number, value: any) => void;
}

const ManualInputRenderer: React.FC<Props> = ({
    decision,
    globalIdx,
    handleValueChange
}) => {
    if (decision.inputType === 'LOV') {
        return (
            <LovManualInput
                decision={decision}
                globalIdx={globalIdx}
                handleValueChange={handleValueChange}
            />
        );
    }

    if (decision.inputType === 'ENUM') {
        return (
            <EnumManualInput
                decision={decision}
                globalIdx={globalIdx}
                handleValueChange={handleValueChange}
            />
        );
    }

    if (decision.fieldType === 'boolean') {
        return (
            <MyInput
                fieldType="checkbox"
                fieldName="selectedValue"
                fieldLabel="Select Value"
                record={{ selectedValue: decision.selectedValue }}
                setRecord={(updatedRecord: any) =>
                    handleValueChange(globalIdx, updatedRecord?.selectedValue)
                }
                width="100%"
                required
            />
        );
    }

    if (
        decision.fieldType === 'date' ||
        decision.fieldType === 'timestamp'
    ) {
        return (
            <MyInput
                fieldType="date"
                fieldName="selectedValue"
                fieldLabel="Select Date"
                record={{ selectedValue: decision.selectedValue }}
                setRecord={(updatedRecord: any) =>
                    handleValueChange(globalIdx, updatedRecord?.selectedValue)
                }
                width="100%"
                required
            />
        );
    }

    if (
        decision.fieldType === 'integer' ||
        decision.fieldType === 'bigint' ||
        decision.fieldType === 'numeric'
    ) {
        return (
            <MyInput
                fieldType="number"
                fieldName="selectedValue"
                fieldLabel="Enter Value"
                record={{ selectedValue: decision.selectedValue }}
                setRecord={(updatedRecord: any) =>
                    handleValueChange(globalIdx, updatedRecord?.selectedValue)
                }
                width="100%"
                required
            />
        );
    }

    return (
        <MyInput
            fieldType="text"
            fieldName="selectedValue"
            fieldLabel="Enter Value"
            record={{
                selectedValue:
                    decision.selectedValue != null
                        ? String(decision.selectedValue)
                        : ''
            }}
            setRecord={(updatedRecord: any) =>
                handleValueChange(globalIdx, updatedRecord?.selectedValue)
            }
            width="100%"
            required
        />
    );
};

export default ManualInputRenderer;