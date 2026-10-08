import React, { useEffect, useState } from 'react';
import { Col, Form, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPills } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';

import {
  useCreateClaimEncounterCopyCurrentMedicationMutation,
  useUpdateClaimEncounterCopyCurrentMedicationMutation
} from '@/services/billing/claimEncounterCopyCurrentMedicationService';

import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useEnumOptions } from '@/services/enumsApi';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import {
  ClaimEncounterCopyCurrentMedication,
  ClaimEncounterCopyCurrentMedicationCreateDTO,
  ClaimEncounterCopyCurrentMedicationUpdateDTO
} from '@/types/model-types-new';

interface AddClaimEncounterCopyCurrentMedicationProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  claimEncounterCopyId: number;
  initialData?: ClaimEncounterCopyCurrentMedication | null;
}

const AddClaimEncounterCopyCurrentMedication = ({
  open,
  setOpen,
  claimEncounterCopyId,
  initialData
}: AddClaimEncounterCopyCurrentMedicationProps) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState({
    activeIngredientId: undefined as number | undefined,
    dosage: null as number | null,
    unit: null as string | null,
    frequency: null as string | null,
    startDate: null as string | null,
    patientIsFree: false,
    freeText: null as string | null
  });

  const [startDateResetKey, setStartDateResetKey] = useState(0);

  const [createCurrentMedication] =
    useCreateClaimEncounterCopyCurrentMedicationMutation();

  const [updateCurrentMedication] =
    useUpdateClaimEncounterCopyCurrentMedicationMutation();

  const { data: activeIngredientsResponse } =
    useGetActiveIngredientsQuery({
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
        activeIngredientId: initialData.activeIngredientId,
        dosage: initialData.dosage ?? null,
        unit: initialData.unit ?? null,
        frequency: initialData.frequency ?? null,
        startDate: initialData.startDate ?? null,
        patientIsFree: initialData.patientIsFree,
        freeText: initialData.freeText ?? null
      });
    } else {
      setFormData({
        activeIngredientId: undefined,
        dosage: null,
        unit: null,
        frequency: null,
        startDate: null,
        patientIsFree: false,
        freeText: null
      });
    }

    setStartDateResetKey(prev => prev + 1);
  }, [initialData, open]);

  const handleSave = async () => {
    if (!formData.patientIsFree) {
      if (!formData.activeIngredientId) {
        dispatch(
          notify({
            msg: 'Medication is required',
            sev: 'warning'
          })
        );
        return;
      }

      if (!formData.startDate) {
        dispatch(
          notify({
            msg: 'Start Date is required',
            sev: 'warning'
          })
        );
        return;
      }
    } else if (!formData.freeText?.trim()) {
      dispatch(
        notify({
          msg: 'Free Text is required',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      if (initialData?.id) {
        const payload: ClaimEncounterCopyCurrentMedicationUpdateDTO = {
          activeIngredientId: formData.patientIsFree
            ? undefined
            : formData.activeIngredientId,
          dosage: formData.patientIsFree ? null : formData.dosage,
          unit: formData.patientIsFree ? undefined : formData.unit,
          frequency: formData.patientIsFree
            ? undefined
            : formData.frequency,
          startDate: formData.patientIsFree
            ? undefined
            : formData.startDate,
          patientIsFree: formData.patientIsFree,
          freeText: formData.patientIsFree
            ? formData.freeText?.trim()
            : undefined
        };

        await updateCurrentMedication({
          id: initialData.id,
          data: payload
        }).unwrap();

        dispatch(
          notify({
            msg: 'Medication updated successfully',
            sev: 'success'
          })
        );
      } else {
        const payload: ClaimEncounterCopyCurrentMedicationCreateDTO = {
          activeIngredientId: formData.patientIsFree
            ? undefined
            : formData.activeIngredientId,
          dosage: formData.patientIsFree ? null : formData.dosage,
          unit: formData.patientIsFree ? undefined : formData.unit,
          frequency: formData.patientIsFree
            ? undefined
            : formData.frequency,
          startDate: formData.patientIsFree
            ? undefined
            : formData.startDate,
          patientIsFree: formData.patientIsFree,
          freeText: formData.patientIsFree
            ? formData.freeText?.trim()
            : undefined
        };

        await createCurrentMedication({
          claimEncounterCopyId,
          data: payload
        }).unwrap();

        dispatch(
          notify({
            msg: 'Medication added successfully',
            sev: 'success'
          })
        );
      }

      setOpen(false);
    } catch (error: any) {
      const data = error?.data ?? {};
      const message =
        data?.detail ||
        data?.message ||
        data?.title ||
        error?.error ||
        'Unexpected error';

      dispatch(
        notify({
          msg: message,
          sev: 'warning'
        })
      );
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const content = (
    <Form fluid className="fields-container">
      <Row gutter={16}>
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
            required={!formData.patientIsFree}
            disabled={formData.patientIsFree}
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
            required={!formData.patientIsFree}
            disabled={formData.patientIsFree}
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
            disabled={formData.patientIsFree}
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
            disabled={formData.patientIsFree}
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
            disabled={formData.patientIsFree}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 10 }}>
        <Col md={24}>
          <MyInput
            width="100%"
            column
            fieldType="checkbox"
            fieldLabel="Patient Is Free"
            fieldName="patientIsFree"
            record={formData}
            setRecord={setFormData}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 10 }}>
        <Col md={24}>
          <MyInput
            width="100%"
            column
            fieldType="textarea"
            fieldLabel="Free Text"
            fieldName="freeText"
            record={formData}
            setRecord={setFormData}
            required={formData.patientIsFree}
            disabled={!formData.patientIsFree}
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

export default AddClaimEncounterCopyCurrentMedication;
