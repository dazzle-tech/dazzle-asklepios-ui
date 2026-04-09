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

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import {
  CurrentMedicationForm,
  CurrentMedicationCreate,
  CurrentMedicationUpdate
} from '@/types/model-types-new';

const handleCrudError = (err: any, dispatch: any) => {
  const msg = err?.data?.message || err?.data?.title || 'Unexpected error';

  dispatch(notify({ msg, sev: 'warning' }));
};

const AddCurrentMedication = ({ open, setOpen, initialData, patient }) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<CurrentMedicationForm>({
    id: undefined,
    patientId: 0,
    activeIngredientId: undefined,
    instructions: '',
    startDate: null
  });

  const [addCurrentMedication] = useAddCurrentMedicationMutation();
  const [updateCurrentMedication] = useUpdateCurrentMedicationMutation();

  const { data: activeIngredientsResponse } = useGetActiveIngredientsQuery({
    page: 0,
    size: 1000
  });

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
        instructions: '',
        startDate: null
      });
    }
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
          instructions: formData.instructions,
          startDate: formData.startDate
        };

        await updateCurrentMedication(payload).unwrap();
        dispatch(notify({ msg: 'Medication updated successfully', sev: 'success' }));
      } else {
        const payload: CurrentMedicationCreate = {
          patientId: Number(patient?.id),
          activeIngredientId: formData.activeIngredientId,
          instructions: formData.instructions,
          startDate: formData.startDate
        };

        await addCurrentMedication(payload).unwrap();
        dispatch(notify({ msg: 'Medication added successfully', sev: 'success' }));
      }

      setOpen(false);
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
            width="100%"
            column
            fieldLabel="Start Date"
            fieldType="date"
            fieldName="startDate"
            record={formData}
            setRecord={setFormData}
            required
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 10 }}>
        <Col md={24}>
          <MyInput
            width="100%"
            column
            fieldLabel="Instructions"
            fieldType="textarea"
            fieldName="instructions"
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
