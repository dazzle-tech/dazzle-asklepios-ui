import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPeopleRoof } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';

import {
  useCreateClaimEncounterCopyFamilyHistoryMutation,
  useUpdateClaimEncounterCopyFamilyHistoryMutation
} from '@/services/billing/claimEncounterCopyFamilyHistoryService';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useEnumOptions } from '@/services/enumsApi';

const emptyFamilyHistory = {
  id: undefined,
  condition: '',
  relation: null,
  inheritedDiseases: false,
  patientIsFree: false,
  freeText: ''
};

const AddClaimEncounterCopyFamilyHistory = ({
  open,
  setOpen,
  initialData,
  claimEncounterCopyId
}) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<any>(
    emptyFamilyHistory
  );

  const relations = useEnumOptions('Relations', {
    exclude: [
      'SPOUSE',
      'FRIEND',
      'SON',
      'DAUGHTER',
      'MOTHER_IN_LAW',
      'FATHER_IN_LAW',
      'SON_IN_LAW',
      'DAUGHTER_IN_LAW',
      'STEPFATHER',
      'STEPMOTHER',
      'STEPDAUGHTER',
      'STEPBROTHER',
      'STEPSON',
      'GRANDSON',
      'GRANDDAUGHTER',
      'STEPSISTER',
      'COUSIN'
    ]
  });

  const [
    createFamilyHistory,
    { isLoading: isCreating }
  ] =
    useCreateClaimEncounterCopyFamilyHistoryMutation();

  const [
    updateFamilyHistory,
    { isLoading: isUpdating }
  ] =
    useUpdateClaimEncounterCopyFamilyHistoryMutation();

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        patientIsFree: initialData.patientIsFree ?? false,
        condition: initialData.condition ?? '',
        relation: initialData.relation ?? null,
        inheritedDiseases:
          initialData.inheritedDiseases ?? false,
        freeText: initialData.freeText ?? ''
      });
    } else {
      setFormData(emptyFamilyHistory);
    }
  }, [initialData, open]);

  const handleSave = async () => {
    const isFree = Boolean(formData.patientIsFree);

    if (isFree) {
      if (!formData.freeText?.trim()) {
        dispatch(
          notify({
            msg: 'Free Text is required.',
            sev: 'warning'
          })
        );
        return;
      }
    } else {
      let errorMsg = '';

      if (!formData.condition?.trim()) {
        errorMsg = 'Condition can’t be empty';
      }

      if (!formData.relation) {
        errorMsg = errorMsg
          ? `${errorMsg}, Relation can’t be empty`
          : 'Relation can’t be empty';
      }

      if (errorMsg) {
        dispatch(
          notify({
            msg: errorMsg,
            sev: 'warning'
          })
        );
        return;
      }
    }

    const payload = {
      condition: isFree
        ? null
        : formData.condition?.trim(),
      relation: isFree
        ? null
        : formData.relation,
      inheritedDiseases: isFree
        ? null
        : formData.inheritedDiseases,
      patientIsFree: isFree,
      freeText: isFree
        ? formData.freeText.trim()
        : null
    };

    try {
      if (formData.id) {
        await updateFamilyHistory({
          id: formData.id,
          ...payload
        }).unwrap();

        dispatch(
          notify({
            msg: 'Family history updated successfully.',
            sev: 'success'
          })
        );
      } else {
        await createFamilyHistory({
          claimEncounterCopyId,
          ...payload
        }).unwrap();

        dispatch(
          notify({
            msg: 'Family history added successfully.',
            sev: 'success'
          })
        );
      }

      setFormData(emptyFamilyHistory);
      setOpen(false);
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.detail ||
        error?.error ||
        'Failed to save Family History.';

      dispatch(
        notify({
          msg: errorMessage,
          sev: 'error'
        })
      );
    }
  };

  const content = (
    <Form fluid layout="inline" className="fields-container">
      <MyInput
        width="14vw"
        column
        fieldLabel="Condition"
        fieldName="condition"
        record={formData}
        setRecord={setFormData}
        required={!formData.patientIsFree}
        disabled={formData.patientIsFree}
      />

      <MyInput
        width="14vw"
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
        required={!formData.patientIsFree}
        disabled={formData.patientIsFree}
      />

      <MyInput
        width="14vw"
        column
        fieldLabel="Inherited Diseases"
        fieldType="checkbox"
        fieldName="inheritedDiseases"
        record={formData}
        setRecord={setFormData}
        disabled={formData.patientIsFree}
      />

      <MyInput
        width="100%"
        column
        fieldType="textarea"
        fieldLabel="Free Text"
        fieldName="freeText"
        record={formData}
        setRecord={setFormData}
        disabled={!formData.patientIsFree}
        required={formData.patientIsFree}
      />

      <MyInput
        width="14vw"
        column
        fieldLabel="Patient Is Free"
        fieldType="checkbox"
        fieldName="patientIsFree"
        record={formData}
        setRecord={setFormData}
      />
    </Form>
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add / Edit Family History"
      steps={[
        {
          title: 'Family History',
          icon: (
            <FontAwesomeIcon icon={faPeopleRoof} />
          )
        }
      ]}
      actionButtonFunction={handleSave}
      position="right"
      size="33vw"
      content={
        <div dir={dir}>
          {content}
        </div>
      }
    />
  );
};

export default AddClaimEncounterCopyFamilyHistory;