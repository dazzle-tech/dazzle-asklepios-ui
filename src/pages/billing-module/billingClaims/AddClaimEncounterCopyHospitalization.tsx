
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHospitalUser } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';


import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useCreateClaimEncounterCopyHospitalizationMutation, useUpdateClaimEncounterCopyHospitalizationMutation } from '@/services/billing/claimEncounterCopyHospitalizationService';

const AddClaimEncounterCopyHospitalization = ({
  open,
  setOpen,
  initialData,
  claimEncounterCopyId
}) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<any>({
    facility: '',
    reason: '',
    admissionType: '',
    dateOfAdmission: null,
    lengthOfStayDays: null,
    outcomes: '',
    medicalInterventionsPerformed: '',
    patientIsFree: false,
    freeText: ''
  });

  const [createClaimEncounterCopyHospitalization] =
    useCreateClaimEncounterCopyHospitalizationMutation();

  const [updateClaimEncounterCopyHospitalization] =
    useUpdateClaimEncounterCopyHospitalizationMutation();

  useEffect(() => {
    if (initialData) {
      setFormData({
        facility: initialData.facility || '',
        reason: initialData.reason || '',
        admissionType: initialData.admissionType || '',
        dateOfAdmission: initialData.dateOfAdmission || null,
        lengthOfStayDays: initialData.lengthOfStayDays ?? null,
        outcomes: initialData.outcomes || '',
        medicalInterventionsPerformed:
          initialData.medicalInterventionsPerformed || '',
        patientIsFree: initialData.patientIsFree === true,
        freeText: initialData.freeText || ''
      });
    } else {
      setFormData({
        facility: '',
        reason: '',
        admissionType: '',
        dateOfAdmission: null,
        lengthOfStayDays: null,
        outcomes: '',
        medicalInterventionsPerformed: '',
        patientIsFree: false,
        freeText: ''
      });
    }
  }, [initialData, open]);

  const handleSave = async () => {
    const isFree = formData.patientIsFree === true;

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
      const errors: string[] = [];

      if (!formData.facility?.trim()) {
        errors.push('Facility can’t be empty');
      }

      if (!formData.reason?.trim()) {
        errors.push('Reason can’t be empty');
      }

      if (!formData.admissionType?.trim()) {
        errors.push('Admission Type can’t be empty');
      }

      if (!formData.dateOfAdmission) {
        errors.push('Date of admission can’t be empty');
      }

      if (errors.length > 0) {
        dispatch(
          notify({
            msg: errors.join(', '),
            sev: 'warning'
          })
        );
        return;
      }
    }

    const payload = {
      facility: isFree ? null : formData.facility,
      reason: isFree ? null : formData.reason,
      admissionType: isFree ? null : formData.admissionType,
      dateOfAdmission: isFree ? null : formData.dateOfAdmission,
      lengthOfStayDays: isFree ? null : formData.lengthOfStayDays,
      outcomes: isFree ? null : formData.outcomes,
      medicalInterventionsPerformed: isFree
        ? null
        : formData.medicalInterventionsPerformed,
      patientIsFree: isFree,
      freeText: isFree ? formData.freeText.trim() : null
    };

    try {
      if (initialData?.id) {
        await updateClaimEncounterCopyHospitalization({
          id: initialData.id,
          data: payload
        }).unwrap();

        dispatch(
          notify({
            msg: 'Hospitalization updated successfully.',
            sev: 'success'
          })
        );
      } else {
        await createClaimEncounterCopyHospitalization({
          claimEncounterCopyId,
          data: payload
        }).unwrap();

        dispatch(
          notify({
            msg: 'Hospitalization added successfully.',
            sev: 'success'
          })
        );
      }

      setOpen(false);
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.detail ||
        error?.error ||
        'Failed to save Hospitalization.';

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
        width="100%"
        column
        fieldType="check"
        fieldLabel="Patient is Free"
        fieldName="patientIsFree"
        record={formData}
        setRecord={setFormData}
      />

      {formData.patientIsFree ? (
        <MyInput
          width="100%"
          column
          fieldType="textarea"
          fieldLabel="Free Text"
          fieldName="freeText"
          record={formData}
          setRecord={setFormData}
          required
        />
      ) : (
        <>
          <MyInput
            width="100%"
            column
            fieldLabel="Facility"
            fieldName="facility"
            record={formData}
            setRecord={setFormData}
            required
          />

          <MyInput
            width="100%"
            column
            fieldLabel="Reason"
            fieldName="reason"
            record={formData}
            setRecord={setFormData}
            required
          />

          <MyInput
            width="100%"
            column
            fieldLabel="Admission Type"
            fieldName="admissionType"
            record={formData}
            setRecord={setFormData}
            required
          />

          <MyInput
            width="100%"
            column
            fieldLabel="Date of admission"
            fieldType="date"
            fieldName="dateOfAdmission"
            record={formData}
            setRecord={setFormData}
            disableFutureDates
            required
          />

          <MyInput
            width="100%"
            column
            fieldLabel="Length of stay (Days)"
            fieldType="number"
            fieldName="lengthOfStayDays"
            record={formData}
            setRecord={setFormData}
          />

          <MyInput
            width="100%"
            column
            fieldLabel="Outcomes"
            fieldName="outcomes"
            record={formData}
            setRecord={setFormData}
          />

          <MyInput
            width="100%"
            column
            fieldLabel="Medical Interventions Performed"
            fieldType="textarea"
            fieldName="medicalInterventionsPerformed"
            record={formData}
            setRecord={setFormData}
          />
        </>
      )}
    </Form>
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        initialData
          ? 'Edit Hospitalization'
          : 'Add Hospitalization'
      }
      steps={[
        {
          title: 'Hospitalizations',
          icon: <FontAwesomeIcon icon={faHospitalUser} />
        }
      ]}
      actionButtonFunction={handleSave}
      position="right"
      size="33vw"
      content={<div dir={dir}>{content}</div>}
    />
  );
};

export default AddClaimEncounterCopyHospitalization;
