import React, { useState } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import {
  useCancelPatientActivityMutation,
  useCompletePatientActivityMutation
} from '@/services/patients/patientActivityService';

type Mode = 'complete' | 'cancel';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  mode: Mode;
  activityId?: number | null;
  patientId: number;
};

const ActivityActionModal: React.FC<Props> = ({ open, setOpen, mode, activityId, patientId }) => {
  const dispatch = useAppDispatch();
  const [note, setNote] = useState('');
  const [completeActivity, { isLoading: isCompleting }] = useCompletePatientActivityMutation();
  const [cancelActivity, { isLoading: isCancelling }] = useCancelPatientActivityMutation();
  const isComplete = mode === 'complete';

  const handleSave = async () => {
    const value = note.trim();
    if (!activityId) return;
    if (!value) {
      dispatch(
        notify({
          msg: isComplete ? 'Outcome note is required' : 'Cancellation reason is required',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      if (isComplete) {
        await completeActivity({
          id: activityId,
          patientId,
          body: { outcomeNote: value }
        }).unwrap();
        dispatch(notify({ msg: 'Activity completed', sev: 'success' }));
      } else {
        await cancelActivity({
          id: activityId,
          patientId,
          body: { cancellationReason: value }
        }).unwrap();
        dispatch(notify({ msg: 'Activity cancelled', sev: 'success' }));
      }
      setNote('');
      setOpen(false);
    } catch (error) {
      dispatch(
        notify({
          msg: extractApiErrorMessage(error) || 'Failed to update activity',
          sev: 'warning'
        })
      );
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={nextOpen => {
        if (!nextOpen) setNote('');
        setOpen(nextOpen);
      }}
      title={isComplete ? 'Complete Activity' : 'Cancel Activity'}
      size="40vw"
      actionButtonLabel={isComplete ? 'Complete' : 'Cancel Activity'}
      actionButtonFunction={handleSave}
      actionButtonLoading={isCompleting || isCancelling}
      content={
        <Form fluid>
          <MyInput
            width="100%"
            fieldType="textarea"
            fieldName="note"
            fieldLabel={isComplete ? 'Outcome' : 'Cancellation Reason'}
            record={{ note }}
            setRecord={(next: { note?: string }) => setNote(next?.note ?? '')}
            required
          />
        </Form>
      }
    />
  );
};

export default ActivityActionModal;
