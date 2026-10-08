import React, { useMemo, useState } from 'react';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import { MdModeEdit } from 'react-icons/md';

import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import CancellationModal from '@/components/CancellationModal';
import Translate from '@/components/Translate';
import ExpandableText from '@/components/ExpandMore/ExpandableText';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds } from '@/utils';

import {
    useGetClaimEncounterProgressNotesQuery,
    useUpdateClaimEncounterProgressNoteMutation,
    useCancelClaimEncounterProgressNoteMutation
} from '@/services/billing/claimEncounterProgressNoteService';

import { ClaimEncounterProgressNote } from '@/types/model-types-new';
import { Form } from 'rsuite';

type Props = {
    encounter: any;
    disabled?: boolean;
    claimEncounterCopyId: number;
};

const ClaimEncounterProgressNotes: React.FC<Props> = ({
    encounter,
    disabled = false,
    claimEncounterCopyId
}) => {
    const dispatch = useAppDispatch();

    const [showCancelled, setShowCancelled] = useState(false);

    const {
        data: notes = [],
        isLoading,
        refetch
    } = useGetClaimEncounterProgressNotesQuery(
        {
            claimEncounterCopyId,
            showCancelled
        },
        {
            skip: !claimEncounterCopyId
        }
    );

    const [updateProgressNote, { isLoading: isUpdating }] =
        useUpdateClaimEncounterProgressNoteMutation();

    const [cancelProgressNote, { isLoading: isCancelling }] =
        useCancelClaimEncounterProgressNoteMutation();

    const [selectedNote, setSelectedNote] =
        useState<ClaimEncounterProgressNote | null>(null);

    const [noteText, setNoteText] = useState('');
    const [openNoteModal, setOpenNoteModal] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const handleEdit = (note: ClaimEncounterProgressNote) => {
        if (note.cancelledDate || disabled) return;

        setSelectedNote(note);
        setNoteText(note.noteText);
        setOpenNoteModal(true);
    };

    const handleSave = async () => {
        if (!selectedNote || !noteText.trim()) return;

        try {
            await updateProgressNote({
                id: selectedNote.id,
                noteText: noteText.trim()
            }).unwrap();

            dispatch(
                notify({
                    msg: 'Progress Note updated successfully',
                    sev: 'success'
                })
            );

            setOpenNoteModal(false);
            setSelectedNote(null);
            setNoteText('');
            refetch();
        } catch {
            dispatch(
                notify({
                    msg: 'Update failed',
                    sev: 'error'
                })
            );
        }
    };

    const handleCancel = async () => {
        if (!selectedNote || !cancelReason.trim()) return;

        try {
            await cancelProgressNote({
                id: selectedNote.id,
                cancellationReason: cancelReason.trim()
            }).unwrap();

            dispatch(
                notify({
                    msg: 'Progress Note cancelled successfully',
                    sev: 'success'
                })
            );

            setCancelModalOpen(false);
            setSelectedNote(null);
            setCancelReason('');
            refetch();
        } catch {
            dispatch(
                notify({
                    msg: 'Cancel failed',
                    sev: 'error'
                })
            );
        }
    };

    const UserDateCell: React.FC<{
        login?: string | null;
        date?: string | null;
    }> = ({ login, date }) => {
        if (!date) return null;

        return (
            <>
                {login}
                <br />
                <span className="date-table-style">
                    {formatDateWithoutSeconds(date)}
                </span>
            </>
        );
    };

    const columns = useMemo(
        () => [
            {
                key: 'noteText',
                title: 'Progress Notes',
                dataKey: 'noteText',
                flexGrow: 2,
                render: (row: ClaimEncounterProgressNote) => (
                    <ExpandableText
                        text={row.noteText}
                        lines={3}
                    />
                )
            },
            {
                key: 'created',
                title: <Translate>CREATED AT / BY</Translate>,
                render: (row: ClaimEncounterProgressNote) => (
                    <UserDateCell
                        login={row.createdBy}
                        date={row.createdDate}
                    />
                )
            },
            {
                key: 'lastModified',
                title: 'LAST MODIFIED AT / BY',
                expandable: true,
                render: (row: ClaimEncounterProgressNote) => (
                    <UserDateCell
                        login={row.lastModifiedBy}
                        date={row.lastModifiedDate}
                    />
                )
            },
            {
                key: 'cancelled',
                title: 'CANCELLED AT / BY',
                expandable: true,
                render: (row: ClaimEncounterProgressNote) => (
                    <UserDateCell
                        login={row.cancelledBy}
                        date={row.cancelledDate}
                    />
                )
            },
            {
                key: 'cancellationReason',
                title: 'CANCELLATION REASON',
                expandable: true,
                render: (row: ClaimEncounterProgressNote) => (
                    <ExpandableText
                        text={row.cancellationReason || ''}
                        lines={2}
                    />
                )
            },
            {
                key: 'actions',
                title: 'ACTIONS',
                width: 120,
                render: (row: ClaimEncounterProgressNote) => (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <MdModeEdit
                            size={22}
                            onClick={() => handleEdit(row)}
                            style={{
                                cursor:
                                    row.cancelledDate || disabled
                                        ? 'not-allowed'
                                        : 'pointer',
                                color:
                                    row.cancelledDate || disabled
                                        ? '#ccc'
                                        : 'gray',
                                opacity:
                                    row.cancelledDate || disabled
                                        ? 0.5
                                        : 1
                            }}
                        />
                    </div>
                )
            }
        ],
        [disabled]
    );

    const isSelected = (
        row: ClaimEncounterProgressNote
    ) => (selectedNote?.id === row.id ? 'selected-row' : '');

    const direction = localStorage.getItem('direction') || 'LTR';
    const dir = direction === 'RTL' ? 'rtl' : 'ltr';

    return (
        <div dir={dir}>
            <div className="bt-div-3">
                <MyButton
                    onClick={() => setCancelModalOpen(true)}
                    prefixIcon={() => <CloseOutlineIcon />}
                    disabled={
                        !selectedNote ||
                        !!selectedNote.cancelledDate ||
                        disabled ||
                        isCancelling
                    }
                >
                    <Translate>Cancel</Translate>
                </MyButton>

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

            <MyTable
                data={notes}
                columns={columns}
                height={500}
                loading={isLoading}
                onRowClick={row => setSelectedNote(row)}
                rowClassName={isSelected}
            />

            <MyModal
                open={openNoteModal}
                setOpen={setOpenNoteModal}
                title="Edit Progress Note"
                size="35vw"
                position="center"
                actionButtonFunction={handleSave}
                content={
                    <div dir={dir}>
                        <Form>
                            <MyInput
                                fieldLabel="Progress Note"
                                fieldType="textarea"
                                fieldName="noteText"
                                record={{ noteText }}
                                setRecord={(record: any) =>
                                    setNoteText(record.noteText)
                                }
                                required
                                width="100%"
                                rows={6}
                            />
                        </Form>
                    </div>
                }
            />

            <CancellationModal
                title="Cancel Progress Note"
                fieldLabel="Cancellation Reason"
                open={cancelModalOpen}
                setOpen={setCancelModalOpen}
                object={{
                    cancellationReason: cancelReason
                }}
                setObject={(object: any) =>
                    setCancelReason(
                        object.cancellationReason || ''
                    )
                }
                handleCancle={handleCancel}
                fieldName="cancellationReason"
                required
            />
        </div>
    );
};

export default ClaimEncounterProgressNotes;