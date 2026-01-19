import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBedPulse } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  useAddSurgicalHistoryMutation,
  useUpdateSurgicalHistoryMutation
} from '@/services/patients/surgicalHistoryService';

import { newSurgicalHistory } from '@/types/model-types-constructor-new';
import { SurgicalHistory } from '@/types/model-types-new';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const normalizeMsg = (msg: string) => {
      const m = (msg || '').toLowerCase();
      if (m.includes('must not be null')) return 'is required';
      if (m.includes('must not be blank')) return 'must not be blank';
      return msg || 'invalid value';
    };

    const lines = data.fieldErrors.map((fe: any) => `• ${fe.field}: ${normalizeMsg(fe.message)}`);

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}${suffix}`,
        sev: 'error'
      })
    );
    return;
  }

  const messageProp: string = data?.message || '';
  const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : data?.errorKey;

  dispatch(
    notify({
      msg:
        keyMap[errorKey] ||
        data?.detail ||
        data?.title ||
        data?.message ||
        'Unexpected error' + suffix,
      sev: 'error'
    })
  );
};

const SURGICAL_HISTORY_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Surgical history payload is required.',
  'patient.invalid': 'Invalid patient reference.',
  'anesthesia.required': 'Anesthesia Type is required.',
  duplicate: 'Surgical history already exists.',
  'db.constraint': 'Database constraint violation.',
  notfound: 'Surgical history not found.'
};

const AddSurgicalHistory = ({ open, setOpen, initialData, patient }) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<SurgicalHistory>(newSurgicalHistory);
  const [openImplants, setOpenImplants] = useState({ open: false });

  const { data: anesthesiaLov } = useGetLovValuesByCodeQuery('ANESTH_TYPES');
  const { data: complicationsLov } = useGetLovValuesByCodeQuery('PROC_COMPLIC');
  const { data: adverseLov } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');

  const [addSurgicalHistory] = useAddSurgicalHistoryMutation();
  const [updateSurgicalHistory] = useUpdateSurgicalHistoryMutation();

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        patientId: Number(patient?.key),
        adverseReactionsToAnesthesia:
          typeof initialData.adverseReactionsToAnesthesia === 'string'
            ? initialData.adverseReactionsToAnesthesia.split(',')
            : initialData.adverseReactionsToAnesthesia || []
      });
      setOpenImplants({ open: initialData.hasImplantsOrDevices ?? false });
    } else {
      setFormData({
        ...newSurgicalHistory,
        patientId: Number(patient?.key),
        adverseReactionsToAnesthesia: []
      });
      setOpenImplants({ open: false });
    }
  }, [initialData, open, patient?.key]);

  const validateBeforeSave = () => {
    const errors: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate required fields
    if (!formData.surgery?.trim()) {
      errors.push('Surgery is required');
    }

    if (!formData.dateOfSurgery) {
      errors.push('Date of surgery is required');
    } else {
      const surgeryDate = new Date(formData.dateOfSurgery);
      surgeryDate.setHours(0, 0, 0, 0);
      if (surgeryDate > today) {
        errors.push('Date of surgery cannot be in the future');
      }
    }

    if (!formData.facility?.trim()) {
      errors.push('Facility is required');
    }

    if (!formData.anesthesiaType) {
      errors.push('Anesthesia type is required');
    }

    return errors;
  };

  const handleSave = async () => {
    const errors = validateBeforeSave();
    if (errors.length) {
      dispatch(notify({ msg: errors.join('\n'), sev: 'error' }));
      return;
    }

    const payload = {
      ...formData,
      patientId: Number(patient?.key),
      dateOfSurgery: formData.dateOfSurgery ? new Date(formData.dateOfSurgery).getTime() : null,
      hasImplantsOrDevices: openImplants.open,
      implantsOrDevicesDescription: openImplants.open
        ? formData.implantsOrDevicesDescription
        : null,
      adverseReactionsToAnesthesia: formData.adverseReactionsToAnesthesia?.length
        ? formData.adverseReactionsToAnesthesia.join(',')
        : null
    };

    try {
      if (formData.id) {
        await updateSurgicalHistory(payload).unwrap();
        dispatch(notify({ msg: 'Surgical history updated successfully', sev: 'success' }));
      } else {
        await addSurgicalHistory(payload).unwrap();
        dispatch(notify({ msg: 'Surgical history added successfully', sev: 'success' }));
      }
      setOpen(false);
    } catch (err: any) {
      handleCrudError(err, dispatch, SURGICAL_HISTORY_ERROR_MAP);
    }
  };

  const content = (
    <Form fluid layout="inline" className="fields-container">
      <MyInput
        width={200}
        column
        required
        fieldLabel="Surgery"
        fieldName="surgery"
        record={formData}
        setRecord={setFormData}
      />
      <MyInput
        width={200}
        column
        required
        fieldLabel="Date of surgery"
        fieldType="date"
        fieldName="dateOfSurgery"
        record={formData}
        setRecord={setFormData}
      />
      <MyInput
        width={200}
        column
        required
        fieldLabel="Facility"
        fieldName="facility"
        record={formData}
        setRecord={setFormData}
      />

      <MyInput
        width={200}
        column
        required
        fieldLabel="Anesthesia Type"
        fieldType="select"
        fieldName="anesthesiaType"
        selectData={anesthesiaLov?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={formData}
        setRecord={setFormData}
      />

      <MyInput
        width={200}
        column
        fieldLabel="Complications"
        fieldType="select"
        fieldName="complications"
        selectData={complicationsLov?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={formData}
        setRecord={setFormData}
      />

      <MyInput
        width={200}
        column
        fieldLabel="Adverse Reactions"
        fieldType="checkPicker"
        fieldName="adverseReactionsToAnesthesia"
        selectData={adverseLov?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={formData}
        setRecord={setFormData}
      />

      <MyInput
        width={200}
        column
        fieldLabel="Implants or Devices"
        fieldType="checkbox"
        fieldName="open"
        record={openImplants}
        setRecord={setOpenImplants}
      />

      <MyInput
        width={200}
        column
        fieldLabel="Implants/Devices Description"
        fieldName="implantsOrDevicesDescription"
        record={formData}
        setRecord={setFormData}
        disabled={!openImplants.open}
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={initialData ? 'Edit Surgical History' : 'Add Surgical History'}
      steps={[{ title: 'Surgical History', icon: <FontAwesomeIcon icon={faBedPulse} /> }]}
      actionButtonFunction={handleSave}
      position="right"
      size="33vw"
      content={content}
    />
  );
};

export default AddSurgicalHistory;
