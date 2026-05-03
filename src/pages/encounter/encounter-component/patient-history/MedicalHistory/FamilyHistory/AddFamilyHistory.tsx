import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPeopleRoof } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  useAddFamilyHistoryMutation,
  useUpdateFamilyHistoryMutation
} from '@/services/patients/familyHistoryService';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useEnumOptions } from '@/services/enumsApi';

/*  ERROR HANDLER  */

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  /* ---------- FIELD ERRORS ---------- */

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const normalizeMsg = (msg: string) => {
      const m = (msg || '').toLowerCase();
      if (m.includes('must not be null')) return 'is required';
      if (m.includes('must not be blank')) return 'must not be blank';
      if (m.includes('size must be between')) return 'length is out of range';
      return msg || 'invalid value';
    };

    const lines = data.fieldErrors.map((fe: any) => `• ${fe.field}: ${normalizeMsg(fe.message)}`);

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix,
        sev: 'error'
      })
    );
    return;
  }

  /* ---------- CONSTRAINT VIOLATIONS ---------- */

  const messageProp: string = data?.message || '';

  if (
    messageProp.includes('ConstraintViolationImpl') ||
    messageProp.includes('Validation failed')
  ) {
    const violations: string[] = [];
    const pattern = /propertyPath=(\w+).*?interpolatedMessage='([^']+)'/g;
    let match;

    while ((match = pattern.exec(messageProp)) !== null) {
      const field = match[1];
      const message = match[2];

      const normalized = message.includes('must not be null')
        ? 'is required'
        : message.includes('must not be blank')
        ? 'must not be blank'
        : message;

      violations.push(`• ${field}: ${normalized}`);
    }

    if (violations.length > 0) {
      dispatch(
        notify({
          msg: `Please fix the following fields:\n${violations.join('\n')}` + suffix,
          sev: 'error'
        })
      );
      return;
    }
  }

  /* ---------- BUSINESS / DB ERRORS ---------- */

  const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : data?.errorKey;

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
};

/*  ERROR MAP  */

const FAMILY_HISTORY_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Family history payload is required.',
  'patient.invalid': 'Invalid patient reference.',
  duplicate: 'Family history entry already exists.',
  'db.constraint': 'Database constraint violation.',
  notfound: 'Family history record not found.'
};

/*  DEFAULT MODEL  */

const emptyFamilyHistory = {
  id: undefined,
  patientId: undefined,
  condition: '',
  relation: null,
  inheritedDiseases: false
};

/*  COMPONENT  */

const AddFamilyHistory = ({ open, setOpen, initialData, patient }) => {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<any>(emptyFamilyHistory);

  /* ENUM OPTIONS */

  const relations = useEnumOptions('Relations');

  /* MUTATIONS */

  const [addFamilyHistory] = useAddFamilyHistoryMutation();
  const [updateFamilyHistory] = useUpdateFamilyHistoryMutation();

  /* LOAD */

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        patientId: Number(patient?.id)
      });
    } else {
      setFormData({
        ...emptyFamilyHistory,
        patientId: Number(patient?.id)
      });
    }
  }, [initialData, open, patient?.id]);

  /* SAVE */

  const handleSave = async () => {
    let errorMsg = '';

    if (!formData.condition) {
      errorMsg = 'Condition can’t be empty';
    }

    if (!formData.relation) {
      errorMsg = errorMsg ? `${errorMsg}, Relation can’t be empty` : 'Relation can’t be empty';
    }

    if (errorMsg) {
      dispatch(notify({ msg: errorMsg, sev: 'warning' }));
      return;
    }

    const payload = {
      id: formData.id,
      patientId: Number(patient.id),
      condition: formData.condition,
      relation: formData.relation,
      inheritedDiseases: Boolean(formData.inheritedDiseases)
    };

    try {
      if (formData.id) {
        await updateFamilyHistory(payload).unwrap();
        dispatch(notify({ msg: 'Family history updated successfully', sev: 'success' }));
      } else {
        await addFamilyHistory(payload).unwrap();
        dispatch(notify({ msg: 'Family history added successfully', sev: 'success' }));
      }

      setOpen(false);
    } catch (err: any) {
      handleCrudError(err, dispatch, FAMILY_HISTORY_ERROR_MAP);
    }
  };

  /* CONTENT */

  const content = (
    <Form fluid layout="inline" className="fields-container">
      <MyInput
        width={'100%'}
        column
        fieldLabel="Condition"
        fieldName="condition"
        record={formData}
        setRecord={setFormData}
        required
      />

      <MyInput
        width={'100%'}
        column
        fieldLabel="Relation"
        fieldType="select"
        fieldName="relation"
        selectData={relations ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={formData}
        setRecord={setFormData}
        searchable={false}
        required
      />

      <MyInput
        width={'100%'}
        column
        fieldLabel="Inherited Diseases"
        fieldType="checkbox"
        fieldName="inheritedDiseases"
        record={formData}
        setRecord={setFormData}
      />
    </Form>
  );

  /* MODAL */

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add / Edit Family History"
      steps={[
        {
          title: 'Family History',
          icon: <FontAwesomeIcon icon={faPeopleRoof} />
        }
      ]}
      actionButtonFunction={handleSave}
      position="right"
      size="33vw"
      content={<div dir={dir}>{content}</div>}
    />
  );
};

export default AddFamilyHistory;
