
import React from 'react';
// import MyTable, { ColumnConfig } from '@/components/MyTable';
import type { EncounterAssessmentLog, EncounterPlanFieldAudit, PatientEncounterFieldAudit } from '@/types/model-types-new';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { useGetUsersByIdsQuery } from '@/services/userService';

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

    const nurseIds = Array.from(
        new Set(
            fieldAudit
                .flatMap(item => [item.oldValue, item.newValue])
                .filter(value => value !== null && value !== undefined && value !== '')
                .map(value => Number(value))
                .filter(value => !Number.isNaN(value))
        )
    );

    const { data: nurses = [] } = useGetUsersByIdsQuery(nurseIds, {
        skip: fieldName !== 'assignedNurseId' || nurseIds.length === 0
    });

    const getNurseName = (value: any) => {
        if (value === null || value === undefined || value === '') return '';

        const nurse = nurses.find(
            user => String(user.id) === String(value)
        );

        return nurse
            ? `${nurse.firstName ?? ''} ${nurse.lastName ?? ''}`.trim()
            : value;
    };

    const columns = [
        {
            key: 'oldValue',
            title: 'Old Value',
            render: row =>
                fieldName === 'assignedNurseId'
                    ? getNurseName(row.oldValue)
                    : row.oldValue
        },
        {
            key: 'newValue',
            title: 'New Value',
            render: row =>
                fieldName === 'assignedNurseId'
                    ? getNurseName(row.newValue)
                    : row.newValue
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
