import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { MdOutlineBolt } from 'react-icons/md';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import { useAddPatientActivityMutation } from '@/services/patients/patientActivityService';
import { useActivityCatalog } from './activityCatalog';
import OutcomePicker from './OutcomePicker';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  patientId: number;
  /** Template code to start with; empty lets the user pick. */
  activityType: string;
};

/** Logs something that already happened (a call, a message) as a completed activity. */
const QuickLogModal: React.FC<Props> = ({ open, setOpen, patientId, activityType }) => {
  const dispatch = useAppDispatch();
  const jobRole = useAppSelector(state => state.auth?.user?.jobRole) as string | undefined;
  const { templates, templateByCode, categoryName } = useActivityCatalog();
  const [record, setRecord] = useState({ activityType, outcome: '', note: '' });
  const [addActivity, { isLoading }] = useAddPatientActivityMutation();

  useEffect(() => {
    if (open) setRecord({ activityType, outcome: '', note: '' });
  }, [open, activityType]);

  const template = templateByCode.get(record.activityType);
  const outcomes = template?.outcomeOptions ?? [];

  const typeOptions = useMemo(
    () =>
      templates
        .filter(t => t.kind === 'ACTIVITY' && t.isActive)
        .filter(t => !t.creatorRoles?.length || (jobRole && t.creatorRoles.includes(jobRole)))
        .map(t => ({ value: t.code, label: `${t.name} · ${categoryName(t.categoryCode)}` })),
    [templates, jobRole, categoryName]
  );

  const handleSave = async () => {
    if (!record.activityType) {
      dispatch(notify({ msg: 'Pick what happened', sev: 'warning' }));
      return;
    }
    if (template?.requireOutcome && !record.outcome) {
      dispatch(notify({ msg: 'Select an outcome', sev: 'warning' }));
      return;
    }
    if (!record.note.trim() && !record.outcome) {
      dispatch(notify({ msg: 'Add an outcome or a note', sev: 'warning' }));
      return;
    }
    try {
      await addActivity({
        patientId,
        activityType: record.activityType,
        status: 'DONE',
        outcome: record.outcome || null,
        note: record.note.trim() || null
      }).unwrap();
      dispatch(notify({ msg: `${template?.name ?? 'Activity'} logged`, sev: 'success' }));
      setOpen(false);
    } catch (error) {
      dispatch(notify({ msg: extractApiErrorMessage(error) || 'Failed to log activity', sev: 'warning' }));
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={template ? `Log ${template.name}` : 'Log Activity'}
      icon={<MdOutlineBolt />}
      size="40vw"
      actionButtonLabel="Log"
      actionButtonFunction={handleSave}
      actionButtonLoading={isLoading}
      content={
        <Form fluid>
          <MyInput
            width="100%"
            fieldType="select"
            fieldName="activityType"
            fieldLabel="What Happened"
            selectData={typeOptions}
            selectDataLabel="label"
            selectDataValue="value"
            record={record}
            setRecord={next => setRecord({ ...next, outcome: '' })}
            required
          />
          {outcomes.length > 0 && (
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
            fieldLabel="Note"
            record={record}
            setRecord={setRecord}
            required={outcomes.length === 0}
          />
        </Form>
      }
    />
  );
};

export default QuickLogModal;
