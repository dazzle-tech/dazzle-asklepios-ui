import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import {
  useCancelPatientActivityMutation,
  useCompletePatientActivityMutation
} from '@/services/patients/patientActivityService';
import type { PatientActivity } from '@/types/model-types-new';
import { useActivityCatalog } from './activityCatalog';
import OutcomePicker from './OutcomePicker';

type Mode = 'complete' | 'cancel';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  mode: Mode;
  activity?: PatientActivity | null;
  patientId: number;
};

const ActivityActionModal: React.FC<Props> = ({ open, setOpen, mode, activity, patientId }) => {
  const dispatch = useAppDispatch();
  const { templateByCode, templateName } = useActivityCatalog();
  const [record, setRecord] = useState({ note: '', outcome: '' });
  const [completeActivity, { isLoading: isCompleting }] = useCompletePatientActivityMutation();
  const [cancelActivity, { isLoading: isCancelling }] = useCancelPatientActivityMutation();
  const isComplete = mode === 'complete';
  const template = activity ? templateByCode.get(activity.activityType) : undefined;
  const outcomes = template?.outcomeOptions ?? [];
  const openItems = (activity?.checklist ?? []).filter(item => !item.done).length;

  useEffect(() => {
    if (open) setRecord({ note: '', outcome: '' });
  }, [open, activity?.id]);

  const handleSave = async () => {
    if (!activity?.id) return;
    const note = record.note.trim();

    if (isComplete) {
      if (template?.requireOutcome && !record.outcome) {
        dispatch(notify({ msg: 'Select an outcome', sev: 'warning' }));
        return;
      }
      if (!note && !record.outcome) {
        dispatch(notify({ msg: 'Add an outcome or a note', sev: 'warning' }));
        return;
      }
    } else if (!note) {
      dispatch(notify({ msg: 'Cancellation reason is required', sev: 'warning' }));
      return;
    }

    try {
      if (isComplete) {
        await completeActivity({
          id: activity.id,
          patientId,
          body: { outcome: record.outcome || null, outcomeNote: note || null }
        }).unwrap();
        dispatch(notify({ msg: 'Task completed', sev: 'success' }));
      } else {
        await cancelActivity({ id: activity.id, patientId, body: { cancellationReason: note } }).unwrap();
        dispatch(notify({ msg: 'Task cancelled', sev: 'success' }));
      }
      setOpen(false);
    } catch (error) {
      dispatch(notify({ msg: extractApiErrorMessage(error) || 'Failed to update task', sev: 'warning' }));
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={`${isComplete ? 'Complete' : 'Cancel'}: ${templateName(activity?.activityType)}`}
      size="40vw"
      actionButtonLabel={isComplete ? 'Complete' : 'Cancel Task'}
      actionButtonFunction={handleSave}
      actionButtonLoading={isCompleting || isCancelling}
      content={
        <Form fluid>
          {isComplete && openItems > 0 && (
            <p className="patient-activity-form-hint warning">
              <Translate>{`${openItems} checklist item(s) are still open.`}</Translate>
            </p>
          )}
          {isComplete && outcomes.length > 0 && (
            <OutcomePicker
              options={outcomes}
              value={record.outcome}
              onChange={outcome => setRecord({ ...record, outcome })}
              required={template?.requireOutcome}
            />
          )}
          <MyInput
            width="100%"
            fieldType="textarea"
            fieldName="note"
            fieldLabel={isComplete ? 'Outcome Note' : 'Cancellation Reason'}
            record={record}
            setRecord={setRecord}
            required={!isComplete || outcomes.length === 0}
          />
        </Form>
      }
    />
  );
};

export default ActivityActionModal;
