import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { MdDelete } from 'react-icons/md';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { newAvailabilityTemplateIntervalBreakCreateDTO } from '@/types/model-types-constructor-new';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import {
  AvailabilityTemplateIntervalBreakCreateDTO,
  AvailabilityTemplateIntervalResponseVM,
} from '@/types/model-types-new';
import {
  useCreateAvailabilityTemplateIntervalBreakMutation,
  useDeleteAvailabilityTemplateIntervalBreakMutation,
  useGetAvailabilityTemplateIntervalBreaksByIntervalQuery,
} from '@/services/appointment/availabilityTemplate/availabilityTemplateIntervalBreak';
import { extractErrorMessage, isValidTimeFormat, timeToSeconds } from './utils';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  interval: AvailabilityTemplateIntervalResponseVM;
  readOnly?: boolean;
};

const AddBreakModal: React.FC<Props> = ({ open, setOpen, interval, readOnly }) => {
  const dispatch = useAppDispatch();
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [record, setRecord] = useState<AvailabilityTemplateIntervalBreakCreateDTO>({ ...newAvailabilityTemplateIntervalBreakCreateDTO });
  const [idToDelete, setIdToDelete] = useState<number | undefined>(undefined);

  const { data: breaks = [], isFetching } = useGetAvailabilityTemplateIntervalBreaksByIntervalQuery(
    { intervalId: interval?.id },
    { skip: !interval?.id }
  );
  const [createBreak] = useCreateAvailabilityTemplateIntervalBreakMutation();
  const [deleteBreak] = useDeleteAvailabilityTemplateIntervalBreakMutation();

  useEffect(() => {
    if (!openConfirmDelete) setIdToDelete(undefined);
  }, [openConfirmDelete]);

  const handleSave = async () => {
    const errors: string[] = [];

    if (!interval?.id) errors.push('There is no selected interval');
    if (!record?.startTime) errors.push('Start Time Break is required');
    if (!record?.endTime) errors.push('End Time Break is required');
    if (record?.startTime && !isValidTimeFormat(record.startTime)) errors.push('Start Time Break format is invalid (HH:mm or HH:mm:ss)');
    if (record?.endTime && !isValidTimeFormat(record.endTime)) errors.push('End Time Break format is invalid (HH:mm or HH:mm:ss)');

    if (record?.startTime && record?.endTime && isValidTimeFormat(record.startTime) && isValidTimeFormat(record.endTime)) {
      if (timeToSeconds(record.startTime) >= timeToSeconds(record.endTime)) {
        errors.push('End Time must be after Start Time');
      }
    }

    if (record.startTime < interval.startTime || record.startTime > interval.endTime) {
      errors.push('Break must be within interval');
    }

    if (errors.length > 0) {
      dispatch(notify({ msg: errors.join(' ,'), sev: 'warning' }));
      return;
    }

    await createBreak({ ...record, intervalId: interval?.id })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Added Successfully', sev: 'success' }));
        setRecord({ ...newAvailabilityTemplateIntervalBreakCreateDTO });
      })
      .catch(e => {
        dispatch(notify({ msg: extractErrorMessage(e) || 'Save Failed', sev: 'warning' }));
      });
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBreak({ id }).unwrap();
      dispatch(notify({ msg: 'Deleted Successfully', sev: 'success' }));
      setIdToDelete(undefined);
      setOpenConfirmDelete(false);
    } catch {
      dispatch(notify({ msg: 'Delete Failed', sev: 'warning' }));
    }
  };

  const columns = [
    { key: 'startTime', title: 'Start Time' },
    { key: 'endTime', title: 'End Time' },
    {
      key: 'actions',
      title: '',
      render: (rowData: any) => (
        <div className="container-of-icons">
          {!readOnly && (
            <MdDelete
              size={22}
              className="icons-style"
              fill="var(--primary-pink)"
              title="Delete"
              onClick={() => { setIdToDelete(rowData.id); setOpenConfirmDelete(true); }}
            />
          )}
        </div>
      ),
    },
  ];

  const formContent = () => (
    <Form fluid>
      <MyInput fieldName="startTime" fieldType="time" record={record} setRecord={setRecord} placeholder="Start Time Break" width="100%" required disabled={readOnly} />
      <MyInput fieldName="endTime" fieldType="time" record={record} setRecord={setRecord} placeholder="End Time Break" width="100%" required disabled={readOnly} />
      <MyButton onClick={handleSave} disabled={readOnly}>Add Break</MyButton>
      <MyTable columns={columns} data={breaks} loading={isFetching} height={300} />
      <DeletionConfirmationModal
        open={openConfirmDelete}
        setOpen={setOpenConfirmDelete}
        itemToDelete="Break"
        actionButtonFunction={() => handleDelete(idToDelete!)}
        actionType="delete"
        confirmationQuestion="Are you sure you want to delete this Break?"
        actionButtonLabel="Delete"
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add Break"
      size="sm"
      content={formContent}
      hideActionBtn
    />
  );
};

export default AddBreakModal;
