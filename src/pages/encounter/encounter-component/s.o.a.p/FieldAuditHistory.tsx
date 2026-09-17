
import React from 'react';
// import MyTable, { ColumnConfig } from '@/components/MyTable';
import type { EncounterAssessmentLog, EncounterPlanFieldAudit, PatientEncounterFieldAudit } from '@/types/model-types-new';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';

interface FieldAuditHistoryModalProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    audit: PatientEncounterFieldAudit[] | EncounterAssessmentLog[] | EncounterPlanFieldAudit[];
    fieldName: string;
}

const FieldAuditHistoryModal = ({
    open,
    setOpen,
    audit,
    fieldName
}: FieldAuditHistoryModalProps) => {
    const fieldAudit = audit.filter(item => item.fieldName === fieldName);

    const columns = [
        {
            key: 'oldValue',
            title: 'Old Value',
        },
        {
            key: 'newValue',
            title: 'New Value',
        },
        {
            key: 'logBy',
            title: 'Changed By',
        },
        {
            key: 'logDate',
            title: 'Date',
            render: row => new Date(row.logDate).toLocaleString()
        }
    ];

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Field History"
            size="70vw"
            hideActionBtn
            content={
                <MyTable
                    data={fieldAudit}
                    columns={columns}
                    height={450}
                    dontTranslateData
                />
            }
        />
    );
};

export default FieldAuditHistoryModal;
