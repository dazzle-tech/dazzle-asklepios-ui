import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import './AddResourceModal.less';
import MyModal from '@/components/MyModal/MyModal';
import { MdDelete } from 'react-icons/md';
import { newAvailabilityTemplateIntervalBreakCreateDTO } from '@/types/model-types-constructor-new';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { AvailabilityTemplateIntervalBreakCreateDTO, AvailabilityTemplateIntervalResponseVM } from '@/types/model-types-new';
import { useCreateAvailabilityTemplateIntervalBreakMutation, useDeleteAvailabilityTemplateIntervalBreakMutation, useGetAvailabilityTemplateIntervalBreaksByIntervalQuery } from '@/services/appointment/availabilityTemplate/availabilityTemplateIntervalBreak';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';



const AddBreakModal = ({
    interval,
    open,
    setOpen,
    ...props
}: {
    open: boolean;
    setOpen: any;
    interval: AvailabilityTemplateIntervalResponseVM;
    readOnly?: boolean;
}) => {
    const dispatch = useAppDispatch();
    const [openConfirmDeleteModal, setOpenConfirmDeleteModal] = useState<boolean>(false);
    const [record, setRecord] = useState<AvailabilityTemplateIntervalBreakCreateDTO>({ ...newAvailabilityTemplateIntervalBreakCreateDTO });
    const [idToDeleteBreak, setIdToDeleteBreak] = useState<number>(undefined);
    const { data = [], isFetching } =
        useGetAvailabilityTemplateIntervalBreaksByIntervalQuery(
            { intervalId: interval?.id },
            { skip: !interval?.id }
        );
    const [createAvailabilityTemplateIntervalBreak] = useCreateAvailabilityTemplateIntervalBreakMutation();
    const [deleteBreak] = useDeleteAvailabilityTemplateIntervalBreakMutation();
    const isValidTimeFormat = (time?: string) => {
        return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(time || '');
    };

    const timeToSeconds = (time: string) => {
        const parts = time.split(':').map(Number);

        const hours = parts[0] || 0;
        const minutes = parts[1] || 0;
        const seconds = parts[2] || 0;

        return hours * 3600 + minutes * 60 + seconds;
    };

    // extract the error message from the bad request that coming from the backend
    const extractErrorMessage = (response: any): string => {
        try {
            const msg = response?.data?.message;
            if (typeof msg === 'string') {
                return msg.replace(/^error\./i, '');
            }
            return '';
        } catch {
            return '';
        }
    };

    const handleSave = async () => {

        const errors = [];
        if (!interval?.id) {
            errors.push('There is no selected interval');
        }

        if (!record?.startTime) {
            errors.push('Start Time Break is required');
        }

        if (!record?.endTime) {
            errors.push('End Time Break is required');
        }
        if (record?.startTime && !isValidTimeFormat(record.startTime)) {
            errors.push('Start Time Break format is invalid (HH:mm or HH:mm:ss)');
        }

        if (record?.endTime && !isValidTimeFormat(record.endTime)) {
            errors.push('End Time Break format is invalid (HH:mm or HH:mm:ss)');
        }

        if (
            record?.startTime &&
            record?.endTime &&
            isValidTimeFormat(record.startTime) &&
            isValidTimeFormat(record.endTime)
        ) {
            const start = timeToSeconds(record.startTime);
            const end = timeToSeconds(record.endTime);

            if (start >= end) {
                errors.push('End Time must be after Start Time');
            }
        }

        if (record.startTime < interval.startTime || record.startTime > interval.endTime) {
            errors.push('Break must be within interval');
        }

        if (errors.length > 0) {
            dispatch(
                notify({
                    msg: errors.join(' ,'),
                    sev: 'warning'
                })
            );
            return;
        }

        await createAvailabilityTemplateIntervalBreak({ ...record, intervalId: interval?.id })
            .unwrap()
            .then(() => {
                dispatch(notify({ msg: 'Added Successfully', sev: 'success' }));
                setRecord({ ...newAvailabilityTemplateIntervalBreakCreateDTO })
            })
            .catch((e) => {
                const errorMsg = extractErrorMessage(e) || 'Save Failed';
                dispatch(notify({ msg: errorMsg, sev: 'warning' }));
            });
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteBreak({ id }).unwrap();
            dispatch(notify({ msg: 'Deleted Successfully', sev: 'success' }));
            setIdToDeleteBreak(undefined);
            setOpenConfirmDeleteModal(false);
        } catch {
            dispatch(notify({ msg: 'Delete Failed', sev: 'warning' }));
        }
    };

    const columns = [
        {
            key: 'startTime',
            title: 'Start Time',
        },
        {
            key: 'endTime',
            title: 'End Time',
        },
        {
            key: 'actions',
            title: '',
            render: (rowData) => (
                <div className="container-of-icons">
                    {!props?.readOnly && (
                        <MdDelete
                            size={22}
                            className="icons-style"
                            fill="var(--primary-pink)"
                            title="Delete"
                            onClick={() => {
                                setIdToDeleteBreak(rowData.id);
                                setOpenConfirmDeleteModal(true);
                            }}
                        />
                    )}
                </div>
            )
        }
    ];

    const conjureFormContent = () => (
        <Form fluid>
            <MyInput
                fieldName="startTime"
                fieldType='time'
                record={record}
                setRecord={setRecord}
                placeholder="Start Time Break"
                width="100%"
                required
                disabled={props?.readOnly}
            />

            <MyInput
                fieldName="endTime"
                fieldType="time"
                record={record}
                setRecord={setRecord}
                placeholder="End Time Break"
                width="100%"
                required
                disabled={props?.readOnly}
            />
            <MyButton onClick={handleSave}  disabled={props?.readOnly}>
                Add Break
            </MyButton>
            <MyTable
                columns={columns}
                data={data}
                loading={isFetching}
                height={300}
            />
            <DeletionConfirmationModal
                open={openConfirmDeleteModal}
                setOpen={setOpenConfirmDeleteModal}
                itemToDelete="Break"
                actionButtonFunction={() => handleDelete(idToDeleteBreak)}
                actionType="delete"
                confirmationQuestion="Are you sure you want to delete this Break?"
                actionButtonLabel="Delete"
            />
        </Form>
    );

    useEffect(() => {
        if (!openConfirmDeleteModal)
            setIdToDeleteBreak(undefined)
    }, [openConfirmDeleteModal]);
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title={"Add Break"}
            size="sm"
            content={conjureFormContent}
        hideActionBtn
        />
    );
};

export default AddBreakModal;

