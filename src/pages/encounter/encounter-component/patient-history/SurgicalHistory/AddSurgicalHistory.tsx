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

  // 1️⃣ Handle Bean Validation field errors
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
  const detail: string = data?.detail || '';
  const errorKey = messageProp?.startsWith('error.') ? messageProp.substring(6) : data?.errorKey;

  // 2️⃣ Handle surgical_history duplicate (case-insensitive unique index)
  if (
    detail?.includes('ux_surgical_history_patient_surgery_date_ci') ||
    messageProp?.includes('ux_surgical_history_patient_surgery_date_ci')
  ) {
    dispatch(
      notify({
        msg: `This surgery already exists for this patient on the same date.${suffix}`,
        sev: 'error'
      })
    );
    return;
  }

  // 3️⃣ Handle mapped backend error keys
  if (errorKey && keyMap[errorKey]) {
    dispatch(
      notify({
        msg: keyMap[errorKey] + suffix,
        sev: 'error'
      })
    );
    return;
  }

  // 4️⃣ Fallback
  dispatch(
    notify({
      msg: data?.detail || data?.title || data?.message || 'Unexpected error' + suffix,
      sev: 'error'
    })
  );
};

const SURGICAL_HISTORY_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Surgical history payload is required.',
  'patient.invalid': 'Invalid patient reference.',
  'anesthesia.required': 'Anesthesia Type is required.',
  duplicate: 'This surgery already exists for this patient on the same date.',
  'db.constraint': 'This surgery already exists for this patient on the same date.',
  notfound: 'Surgical history not found.'
};

type SurgicalHistoryForm = Omit<
  SurgicalHistory,
  'dateOfSurgery' | 'adverseReactionsToAnesthesia'
> & {
  dateOfSurgery: Date | string | number | null;
  adverseReactionsToAnesthesia: string[];
};

const emptySurgicalHistoryForm: SurgicalHistoryForm = {
  ...newSurgicalHistory,
  dateOfSurgery: null,
  adverseReactionsToAnesthesia: []
};

const toDate = (value: Date | string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toNoonTimestamp = (value: Date | string | number | null | undefined) => {
  const d = toDate(value);
  if (!d) return null;
  // Use local noon to avoid day-shift when the DB column is date-only
  d.setHours(12, 0, 0, 0);
  return d.getTime();
};

const toStringArray = (value: string | string[] | null | undefined) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
};

const AddSurgicalHistory = ({ open, setOpen, initialData, patient }) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<SurgicalHistoryForm>(emptySurgicalHistoryForm);
  const [openImplants, setOpenImplants] = useState({ open: false });

  const { data: anesthesiaLov } = useGetLovValuesByCodeQuery('ANESTH_TYPES');
  const { data: complicationsLov } = useGetLovValuesByCodeQuery('PROC_COMPLIC');
  const { data: adverseLov } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');

  const [addSurgicalHistory] = useAddSurgicalHistoryMutation();
  const [updateSurgicalHistory] = useUpdateSurgicalHistoryMutation();

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...emptySurgicalHistoryForm,
        ...initialData,
        patientId: Number(patient?.id),
        dateOfSurgery: toDate(initialData.dateOfSurgery),
        adverseReactionsToAnesthesia: toStringArray(initialData.adverseReactionsToAnesthesia)
      });
      setOpenImplants({ open: initialData.hasImplantsOrDevices ?? false });
    } else {
      setFormData({
        ...emptySurgicalHistoryForm,
        patientId: Number(patient?.id)
      });
      setOpenImplants({ open: false });
    }
  }, [initialData, open, patient?.id]);

  const validateBeforeSave = () => {
    const errors: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate required fields
    if (!formData.surgery?.trim()) {
      errors.push('Surgery is required');
    }

    const surgeryDateValue = toDate(formData.dateOfSurgery);
    if (!surgeryDateValue) {
      errors.push('Date of surgery is required');
    } else {
      const surgeryDate = new Date(surgeryDateValue);
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
      dispatch(notify({ msg: errors.join('\n'), sev: 'warning' }));
      return;
    }

    const payload = {
      ...formData,
      patientId: Number(patient?.id),
      dateOfSurgery: toNoonTimestamp(formData.dateOfSurgery),
      hasImplantsOrDevices: openImplants.open,
      implantsOrDevicesDescription: openImplants.open
        ? formData.implantsOrDevicesDescription
        : null,
      adverseReactionsToAnesthesia: formData.adverseReactionsToAnesthesia.length
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

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={initialData ? 'Edit Surgical History' : 'Add Surgical History'}
      steps={[{ title: 'Surgical History', icon: <FontAwesomeIcon icon={faBedPulse} /> }]}
      actionButtonFunction={handleSave}
      position="right"
      size="33vw"
      content={<div dir={dir}>{content}</div>}
    />
  );
};

export default AddSurgicalHistory;
