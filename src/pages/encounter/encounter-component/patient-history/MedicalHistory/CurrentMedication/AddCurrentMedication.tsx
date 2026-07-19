import React, { useEffect, useState } from 'react';
import { Col, Form, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPills } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';

import {
  useAddCurrentMedicationMutation,
  useUpdateCurrentMedicationMutation
} from '@/services/patients/currentMedicationService';

import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useEnumOptions } from '@/services/enumsApi';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import {
  CurrentMedicationForm,
  CurrentMedicationCreate,
  CurrentMedicationUpdate
} from '@/types/model-types-new';

const handleCrudError = (err: any, dispatch: any) => {
  const data = err?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const normalizeMsg = (msg: string) => {
      const m = (msg || '').toLowerCase();
      if (m.includes('must not be null')) return 'is required';
      if (m.includes('must not be blank')) return 'must not be blank';
      if (m.includes('size must be between')) return 'length is out of range';
      if (m.includes('must be greater')) return 'value is too small';
      if (m.includes('must be less')) return 'value is too large';
      if (m.includes('must be a date in the past or in the present')) return 'cannot be a future date';
      return msg || 'invalid value';
    };

    const lines = data.fieldErrors.map((fe: any) => `• ${fe.field}: ${normalizeMsg(fe.message)}`);

    dispatch(notify({ msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix, sev: 'warning' }));
    return;
  }

  const messageProp: string = data?.message || '';
  const humanMsg = data?.detail || data?.title || messageProp || 'Unexpected error';

  dispatch(notify({ msg: humanMsg + suffix, sev: 'warning' }));
};

const AddCurrentMedication = ({ open, setOpen, initialData, patient }) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<CurrentMedicationForm>({
    id: undefined,
    patientId: 0,
    activeIngredientId: undefined,
    dosage: null,
    unit: null,
    frequency: null,
    startDate: null
  });

  const [startDateResetKey, setStartDateResetKey] = useState(0);

  const [addCurrentMedication] = useAddCurrentMedicationMutation();
  const [updateCurrentMedication] = useUpdateCurrentMedicationMutation();

  const { data: activeIngredientsResponse } = useGetActiveIngredientsQuery({
    page: 0,
    size: 1000
  });

  const unitOptions = useEnumOptions('UOM');
  const frequencyOptions = useEnumOptions('MedFrequency');

  const activeIngredientOptions =
    activeIngredientsResponse?.data
      ?.filter(item => item.isActive)
      .map(item => ({
        label: item.name,
        value: item.id
      })) || [];

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        patientId: Number(patient?.id)
      });
    } else {
      setFormData({
        id: undefined,
        patientId: Number(patient?.id),
        activeIngredientId: undefined,
        dosage: null,
        unit: null,
        frequency: null,
        startDate: null
      });
    }
    setStartDateResetKey(prev => prev + 1);
  }, [initialData, open, patient?.id]);

  const handleSave = async () => {
    if (!formData.activeIngredientId) {
      dispatch(notify({ msg: 'Medication is required', sev: 'warning' }));
      return;
    }

    if (!formData.startDate) {
      dispatch(notify({ msg: 'Start Date is required', sev: 'warning' }));
      return;
    }

    try {
      if (formData.id) {
        const payload: CurrentMedicationUpdate = {
          id: formData.id,
          patientId: Number(patient?.id),
          activeIngredientId: formData.activeIngredientId,
          dosage: formData.dosage,
          unit: formData.unit,
          frequency: formData.frequency,
          startDate: formData.startDate
        };

        await updateCurrentMedication(payload).unwrap();
        dispatch(notify({ msg: 'Medication updated successfully', sev: 'success' }));
        setOpen(false);
      } else {
        const payload: CurrentMedicationCreate = {
          patientId: Number(patient?.id),
          activeIngredientId: formData.activeIngredientId,
          dosage: formData.dosage,
          unit: formData.unit,
          frequency: formData.frequency,
          startDate: formData.startDate
        };
        console.log('Adding current medication with payload:', payload);
        await addCurrentMedication(payload).unwrap();
        dispatch(notify({ msg: 'Medication added successfully', sev: 'success' }));
        setFormData({
          id: undefined,
          patientId: Number(patient?.id),
          activeIngredientId: undefined,
          dosage: null,
          unit: null,
          frequency: null,
          startDate: null
        });
        setStartDateResetKey(prev => prev + 1);
      }
    } catch (err) {
      handleCrudError(err, dispatch);
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  const content = (
    <Form fluid className="fields-container">
      <Row gutter={16}>
        {/* Medication */}
        <Col md={12}>
          <MyInput
            width="100%"
            column
            fieldLabel="Medication"
            fieldName="activeIngredientId"
            fieldType="select"
            selectData={activeIngredientOptions}
            selectDataLabel="label"
            selectDataValue="value"
            record={formData}
            setRecord={setFormData}
            searchable
            required
          />
        </Col>

        <Col md={12}>
          <MyInput
            key={startDateResetKey}
            width="100%"
            column
            fieldLabel="Start Date"
            fieldType="date"
            fieldName="startDate"
            disableFutureDates
            record={formData}
            setRecord={setFormData}
            required
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 10 }}>
        <Col md={8}>
          <MyInput
            width="100%"
            column
            fieldLabel="Dosage"
            fieldType="number"
            fieldName="dosage"
            record={formData}
            setRecord={setFormData}
          />
        </Col>

        <Col md={8}>
          <MyInput
            width="100%"
            column
            fieldType="select"
            fieldLabel="Unit"
            selectData={unitOptions}
            selectDataLabel="label"
            selectDataValue="value"
            fieldName="unit"
            record={formData}
            setRecord={setFormData}
          />
        </Col>

        <Col md={8}>
          <MyInput
            width="100%"
            column
            fieldType="select"
            fieldLabel="Frequency"
            selectData={frequencyOptions}
            selectDataLabel="label"
            selectDataValue="value"
            fieldName="frequency"
            record={formData}
            setRecord={setFormData}
          />
        </Col>
      </Row>
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add / Edit Current Medication"
      steps={[
        {
          title: 'Current Medication',
          icon: <FontAwesomeIcon icon={faPills} />
        }
      ]}
      actionButtonFunction={handleSave}
      position="right"
      size="33vw"
      content={<div dir={dir}>{content}</div>}
    />
  );
};

export default AddCurrentMedication;
