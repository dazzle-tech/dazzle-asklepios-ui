import React, { useMemo, useState } from 'react';
import { Form } from 'rsuite';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import { MdModeEdit } from 'react-icons/md';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import CancellationModal from '@/components/CancellationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import UserDateCell from '@/components/UserDateCell';
import Translate from '@/components/Translate';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import { ClaimEncounterCopyFamilyHistory } from '@/types/model-types-new';

import AddClaimEncounterCopyFamilyHistory from './AddClaimEncounterCopyFamilyHistory';
import {
  useCancelClaimEncounterCopyFamilyHistoryMutation,
  useCreateClaimEncounterCopyFamilyHistoryMutation,
  useGetClaimEncounterCopyFamilyHistoriesQuery,
  useUpdateClaimEncounterCopyFamilyHistoryMutation
} from '@/services/billing/claimEncounterCopyFamilyHistoryService';
import ExpandableText from '@/components/ExpandMore/ExpandableText';
import { formatEnumString } from '@/utils';

interface ClaimEncounterCopyFamilyHistoryTableProps {
    claimEncounterCopyId: number;
}

const ClaimEncounterCopyFamilyHistoryTable = ({
    claimEncounterCopyId
}: ClaimEncounterCopyFamilyHistoryTableProps) => {
    const direction = localStorage.getItem('direction') || 'LTR';
    const dir = direction === 'RTL' ? 'rtl' : 'ltr';

    const dispatch = useAppDispatch();

    const [showCancelled, setShowCancelled] = useState(false);
    const [selectedHistory, setSelectedHistory] =
        useState<ClaimEncounterCopyFamilyHistory | null>(null);

    const [openModal, setOpenModal] = useState(false);
    const [openCancelModal, setOpenCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const [freeTextRecord, setFreeTextRecord] = useState({
        freeText: ''
    });
    const [editingFreeTextId, setEditingFreeTextId] =
        useState<number | null>(null);

    const {
        data: familyHistories = [],
        isFetching
    } = useGetClaimEncounterCopyFamilyHistoriesQuery({
        claimEncounterCopyId,
        showCancelled
    });

    const [
        cancelClaimEncounterCopyFamilyHistory,
        { isLoading: isCancelling }
    ] = useCancelClaimEncounterCopyFamilyHistoryMutation();

    const [
        createFamilyHistory,
        { isLoading: isSavingFreeText }
    ] = useCreateClaimEncounterCopyFamilyHistoryMutation();

    const [
        updateFamilyHistory,
        { isLoading: isUpdatingFreeText }
    ] = useUpdateClaimEncounterCopyFamilyHistoryMutation();

    const handleSaveFreeText = async () => {
        const freeText = freeTextRecord.freeText?.trim();

        if (!freeText) {
            dispatch(notify({ msg: 'Free Text is required.', sev: 'warning' }));
            return;
        }

        const payload = {
            condition: null,
            relation: null,
            inheritedDiseases: null,
            patientIsFree: true,
            freeText
        };

        try {
            if (editingFreeTextId !== null) {
                await updateFamilyHistory({
                    id: editingFreeTextId,
                    ...payload
                }).unwrap();

                dispatch(notify({ msg: 'Free Text updated successfully.', sev: 'success' }));
            } else {
                await createFamilyHistory({
                    claimEncounterCopyId,
                    ...payload
                }).unwrap();

                dispatch(notify({ msg: 'Free Text saved successfully.', sev: 'success' }));
            }

            setFreeTextRecord({ freeText: '' });
            setEditingFreeTextId(null);
        } catch (error: any) {
            const errorMessage =
                error?.data?.message ||
                error?.data?.detail ||
                error?.error ||
                `Failed to ${editingFreeTextId !== null ? 'update' : 'save'} Free Text.`;

            dispatch(notify({ msg: errorMessage, sev: 'error' }));
        }
    };

    const relations = useMemo(
        () => [
            { value: 'FATHER', label: 'Father' },
            { value: 'MOTHER', label: 'Mother' },
            { value: 'BROTHER', label: 'Brother' },
            { value: 'SISTER', label: 'Sister' },
            { value: 'GRANDFATHER', label: 'Grandfather' },
            { value: 'GRANDMOTHER', label: 'Grandmother' },
            { value: 'UNCLE', label: 'Uncle' },
            { value: 'AUNT', label: 'Aunt' }
        ],
        []
    );

    const handleAdd = () => {
        setSelectedHistory(null);
        setOpenModal(true);
    };

    const handleEdit = (row: ClaimEncounterCopyFamilyHistory) => {
        if (row?.patientIsFree === true) {
            setEditingFreeTextId(row.id);
            setFreeTextRecord({ freeText: row.freeText || '' });
            return;
        }

        setSelectedHistory(row);
        setOpenModal(true);
    };

    const handleCancel = async () => {
        if (!selectedHistory || !cancelReason.trim()) return;

        try {
            await cancelClaimEncounterCopyFamilyHistory({
                id: selectedHistory.id,
                cancellationReason: cancelReason.trim()
            }).unwrap();

            setOpenCancelModal(false);
            setCancelReason('');
            setSelectedHistory(null);
        } catch (error) {
            console.error(error);
        }
    };

    const isSelected = (row: ClaimEncounterCopyFamilyHistory) =>
        row.id === selectedHistory?.id ? 'selected-row' : '';

    const columns = [
        {
            key: 'freeText',
            title: <Translate>Free Text</Translate>,
            flexGrow: 2,
            render: (row: ClaimEncounterCopyFamilyHistory) =>
                row.patientIsFree && row.freeText ? (
                    <ExpandableText text={row.freeText} />
                ) : (
                    '-'
                )
        },
        {
            key: 'condition',
            title: <Translate>Condition</Translate>,
            flexGrow: 1.5,
            render: (row: ClaimEncounterCopyFamilyHistory) =>
                row.patientIsFree ? '-' : row.condition || '-'
        },
        {
            key: 'relation',
            title: <Translate>Relation</Translate>,
            flexGrow: 1,
            render: (row: ClaimEncounterCopyFamilyHistory) =>
                row.patientIsFree
                    ? '-'
                    : relations.find(item => item.value === row.relation)?.label ||
                    row.relation ||
                    '-'
        },
        {
            key: 'inheritedDiseases',
            title: <Translate>Inherited Diseases</Translate>,
            flexGrow: 1,
            render: (row: ClaimEncounterCopyFamilyHistory) =>
                row.patientIsFree
                    ? '-'
                    : row.inheritedDiseases
                        ? 'Yes'
                        : 'No'
        },
        {
            key: 'status',
            title: <Translate>Status</Translate>,
            flexGrow: 1,
            render: (row: ClaimEncounterCopyFamilyHistory) => (
                <MyBadgeStatus
                    contant={formatEnumString(row.status)}
                    color={
                        row.status === 'CANCELLED'
                            ? '#dc3545'
                            : row.status === 'ACTIVE'
                                ? '#28a745'
                                : '#6c757d'
                    }
                />
            )
        },
        {
            key: 'created',
            title: <Translate>Created By / Date</Translate>,
            flexGrow: 1.5,
            render: (row: ClaimEncounterCopyFamilyHistory) => (
                <UserDateCell
                    login={row.createdBy}
                    date={row.createdDate}
                />
            )
        },
        {
            key: 'lastModified',
            title: <Translate>Last Modified By / Date</Translate>,
            flexGrow: 1.5,
            render: (row: ClaimEncounterCopyFamilyHistory) => (
                <UserDateCell
                    login={row.lastModifiedBy}
                    date={row.lastModifiedDate}
                />
            )
        },
        {
            key: 'cancelled',
            title: <Translate>Cancelled By / Date</Translate>,
            flexGrow: 1.5,
            render: (row: ClaimEncounterCopyFamilyHistory) =>
                row.status === 'CANCELLED' ? (
                    <UserDateCell
                        login={row.cancelledBy}
                        date={row.cancelledDate}
                    />
                ) : (
                    '-'
                )
        },
        {
            key: 'cancellationReason',
            title: <Translate>Cancellation Reason</Translate>,
            flexGrow: 2,
            render: (row: ClaimEncounterCopyFamilyHistory) =>
                row.status === 'CANCELLED' && row.cancellationReason ? (
                    <ExpandableText text={row.cancellationReason} />
                ) : (
                    '-'
                )
        },

        {
            key: 'actions',
            title: 'Actions',
            render: (
                row: ClaimEncounterCopyFamilyHistory
            ) => (
                <div
                    className="flex-gap-12"
                    onClick={e =>
                        e.stopPropagation()
                    }
                >
                    {row.status !== 'CANCELLED' && (
                        <MdModeEdit
                            size={22}
                            fill="var(--primary-gray)"
                            className="pointer"
                            onClick={event => {
                                event.stopPropagation();
                                handleEdit(row);
                            }}
                        />
                    )}
                </div>
            )
        }
    ];

    return (
        <div dir={dir}>
            <div className="bt-div-3">
                <div className="flex-gap-12">
                    <MyButton
                        appearance="primary"
                        onClick={handleAdd}
                    >
                        Add Family History
                    </MyButton>

                    <MyButton
                        onClick={() => setOpenCancelModal(true)}
                        prefixIcon={() => <CloseOutlineIcon />}
                        disabled={
                            !selectedHistory ||
                            selectedHistory.status === 'CANCELLED' ||
                            isCancelling
                        }
                    >
                        <Translate>Cancel</Translate>
                    </MyButton>

                    <MyButton
                        disabled={
                            isSavingFreeText ||
                            isUpdatingFreeText ||
                            !freeTextRecord.freeText?.trim()
                        }
                        onClick={handleSaveFreeText}
                    >
                        {isSavingFreeText || isUpdatingFreeText
                            ? 'Saving...'
                            : editingFreeTextId !== null
                                ? 'Update'
                                : 'Save'}
                    </MyButton>
                </div>

                <div className="bt-right-3">
                    <MyInput
                        fieldLabel="Show Cancelled"
                        fieldType="check"
                        fieldName="showCancelled"
                        record={{ showCancelled }}
                        setRecord={(record: any) =>
                            setShowCancelled(!!record.showCancelled)
                        }
                        showLabel={false}
                    />
                </div>
            </div>

            <Form
                fluid
                formValue={freeTextRecord}
                onChange={(value: any) => setFreeTextRecord(value)}
            >
                <div style={{ marginBottom: 20, width: '100%' }}>
                    <MyInput
                        fieldType="textarea"
                        fieldLabel="Free Text"
                        fieldName="freeText"
                        record={freeTextRecord}
                        setRecord={setFreeTextRecord}
                        disabled={isSavingFreeText || isUpdatingFreeText}
                        width="100%"
                    />
                </div>
            </Form>

            <MyTable
                height={450}
                data={familyHistories}
                loading={isFetching}
                columns={columns}
                rowKey="id"
                onRowClick={row => setSelectedHistory(row)}
                rowClassName={isSelected}
            />

            <AddClaimEncounterCopyFamilyHistory
                open={openModal}
                setOpen={setOpenModal}
                claimEncounterCopyId={claimEncounterCopyId}
                initialData={selectedHistory}
            />

            <CancellationModal
                title="Cancel Family History"
                fieldLabel="Cancellation Reason"
                open={openCancelModal}
                setOpen={value => {
                    setOpenCancelModal(value);
                    if (!value) setCancelReason('');
                }}
                object={{ cancellationReason: cancelReason }}
                setObject={(object: any) =>
                    setCancelReason(object.cancellationReason || '')
                }
                handleCancle={handleCancel}
                fieldName="cancellationReason"
                required
            />
        </div>
    );
};

export default ClaimEncounterCopyFamilyHistoryTable;
