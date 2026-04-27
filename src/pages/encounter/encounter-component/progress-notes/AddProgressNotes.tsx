import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom, faFileLines } from '@fortawesome/free-solid-svg-icons';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import { useCreateMutation, useUpdateMutation } from '@/services/patients/progressNoteService';

import { ProgressNote } from '@/types/model-types-new';
import { newProgressNote } from '@/types/model-types-constructor-new';

import './styles.less';

const PROGRESS_NOTE_FIELD_LABELS: Record<string, string> = {
  patientId: 'Patient',
  encounterId: 'Encounter',
  noteText: 'Progress Note'
};

const PROGRESS_NOTE_ERROR_MAP: Record<string, string> = {
  'patient.notfound': 'Patient not found.',
  'encounter.notfound': 'Encounter not found.',
  'already.cancelled': 'Progress note already cancelled.',
  'already.cancelled.update': 'Cancelled progress note cannot be updated.',
  'db.constraint': 'Database constraint violation.'
};

const handleCrudError = (err: any, dispatch: any) => {
  const data = err?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const lines = data.fieldErrors.map((fe: any) => {
      const label = PROGRESS_NOTE_FIELD_LABELS[fe.field] || fe.field;

      let normalized = fe.message;
      const msg = (fe.message || '').toLowerCase();

      if (msg.includes('must not be null')) normalized = 'is required';
      else if (msg.includes('must not be blank')) normalized = 'must not be blank';

      return `• ${label}: ${normalized}`;
    });

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}${suffix}`,
        sev: 'warning'
      })
    );
    return;
  }

  const errorKey =
    data?.errorKey ||
    (typeof data?.message === 'string' && data.message.startsWith('error.')
      ? data.message.replace('error.', '')
      : undefined);

  if (errorKey && PROGRESS_NOTE_ERROR_MAP[errorKey]) {
    dispatch(
      notify({
        msg: PROGRESS_NOTE_ERROR_MAP[errorKey] + suffix,
        sev: 'warning'
      })
    );
    return;
  }

  dispatch(
    notify({
      msg: (data?.detail || data?.title || 'Unexpected error occurred') + suffix,
      sev: 'warning'
    })
  );
};

const AddProgressNotes = ({ open, setOpen, progressNote, patient, encounter, edit, refetch }) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<ProgressNote>({ ...newProgressNote });

  const [createNote] = useCreateMutation();
  const [updateNote] = useUpdateMutation();

  useEffect(() => {
    if (!open) return;

    if (progressNote?.id) {
      setFormData({ ...progressNote });
    } else {
      setFormData({
        ...newProgressNote,
        patientId: patient?.id,
        encounterId: encounter?.id
      });
    }
  }, [open, progressNote, patient?.id, encounter?.id]);

  const handleClear = () => {
    setFormData({
      ...newProgressNote,
      patientId: patient?.id,
      encounterId: encounter?.id
    });
  };

  const handleSave = async () => {
    try {
      if (formData.id) {
        await updateNote({
          id: formData.id!,
          noteText: formData.noteText
        }).unwrap();

        dispatch(notify({ msg: 'Progress Note updated successfully', sev: 'success' }));
      } else {
        await createNote({
          patientId: formData.patientId,
          encounterId: formData.encounterId,
          noteText: formData.noteText
        }).unwrap();

        dispatch(notify({ msg: 'Progress Note added successfully', sev: 'success' }));
      }

      refetch?.();
      setOpen(false);
      handleClear();
    } catch (err: any) {
      handleCrudError(err, dispatch);
    }
  };


          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Progress Notes"
      size="32vw"
      position="right"
      actionButtonFunction={handleSave}
      isDisabledActionBtn={edit || !formData.noteText}
      steps={[
        {
          title: 'Progress Notes',
          icon: <FontAwesomeIcon icon={faFileLines} />,
          footer: (
            <MyButton appearance="ghost" disabled={edit} onClick={handleClear}>
              <FontAwesomeIcon icon={faBroom} /> Clear
            </MyButton>
          )
        }
      ]}
      content={
        <Form fluid dir={dir}>
          <MyInput
            column
            width={400}
            height={200}
            fieldLabel="Progress Notes"
            fieldType="textarea"
            fieldName="noteText"
            record={formData}
            setRecord={setFormData}
            required
            disabled={edit}
            allowEnterNewLine
          />
        </Form>
      }
    />
  );
};

export default AddProgressNotes;
