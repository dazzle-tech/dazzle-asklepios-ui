import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHospitalUser } from '@fortawesome/free-solid-svg-icons';
import { newApPatientHospitalization } from '@/types/model-types-constructor';
import { useSavePatientHospitalizationMutation } from '@/services/patientService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';

const AddHospitalizations = ({ open, setOpen, initialData, patient }) => {

  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState(newApPatientHospitalization);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ ...newApPatientHospitalization, patientKey: patient?.key });
    }
  }, [initialData, open]);

  const { data: admissionTypeLov } = useGetLovValuesByCodeQuery('ADMISSION_TYPE');

  const [saveHospitalization] = useSavePatientHospitalizationMutation();

  const normalizePayload = (data) => ({
    ...data,
    dateOfAdmission:
      data.dateOfAdmission ? new Date(data.dateOfAdmission).getTime() : null
  });

  // const validateRequiredFields = () => {
  //   const requiredFields = [
  //     { key: 'facility', label: 'Facility' },
  //     { key: 'reason', label: 'Reason' },
  //     { key: 'dateOfAdmission', label: 'Date of admission' }
  //   ];

  //   const missing = requiredFields.filter(field => {
  //     const value = (formData as any)[field.key];
  //     return value === undefined || value === null || value === '';
  //   });

  //   if (missing.length > 0) {
  //     const msg =
  //       missing.length === 1
  //         ? `Please fill the required field: ${missing[0].label}.`
  //         : `Please fill the required fields: ${missing.map(f => f.label).join(', ')}.`;

  //     dispatch(
  //       notify({
  //         msg,
  //         sev: 'error'
  //       })
  //     );

  //     return false;
  //   }

  //   return true;
  // };

  const save = () => {
    // if (!validateRequiredFields()) {
    //   return;
    // }
    let errorMsg = "";
    if (!formData.facility) {
      if (!errorMsg)
        errorMsg = errorMsg + "Facility Can`t be empty"
      else
        errorMsg = errorMsg + ", Condition Can`t be empty"
    }
    if (!formData.reason) {
      if (!errorMsg)
        errorMsg = errorMsg + "Reason Can`t be empty"
      else
        errorMsg = errorMsg + ", Reason Can`t be empty"
    }
    if (!formData.dateOfAdmission) {
      if (!errorMsg)
        errorMsg = errorMsg + "Date Of Admission Can`t be empty"
      else
        errorMsg = errorMsg + ", Date Of Admission Can`t be empty"
    }

    if (!errorMsg) {
      const payload = normalizePayload(formData);
      saveHospitalization(payload)
        .unwrap()
        .then(() => {
          dispatch(notify({ msg: "Saved successfully", sev: "success" }));
          setOpen(false);
        })
        .catch(() =>
          dispatch(notify({ msg: "Saving failed", sev: "error" }))
        );
    }else{
     dispatch(notify({ msg: errorMsg, sev: "warning" }))
    }
  };

  const content = (
    <Form fluid layout="inline" className="fields-container">

      <MyInput
        width={200}
        column
        fieldLabel="Facility"
        fieldName="facility"
        record={formData}
        setRecord={setFormData}
        required
      />

      <MyInput
        width={200}
        column
        fieldLabel="Reason"
        fieldName="reason"
        record={formData}
        setRecord={setFormData}
        required
      />

      <MyInput
        width={200}
        column
        fieldLabel="Admission Type"
        fieldType="select"
        fieldName="admissionTypeLkey"
        selectData={admissionTypeLov?.object ?? []}
        selectDataValue="key"
        selectDataLabel="lovDisplayVale"
        record={formData}
        setRecord={setFormData}
        searchable={false}
      />

      <MyInput
        width={200}
        column
        fieldLabel="Date of admission"
        fieldType="date"
        fieldName="dateOfAdmission"
        record={formData}
        setRecord={setFormData}
        required
      />

      <MyInput
        width={200}
        column
        fieldLabel="Length of stay (days)"
        fieldType="number"
        fieldName="lengthOfStay"
        record={formData}
        setRecord={setFormData}
      />

      <MyInput
        width={200}
        column
        fieldLabel="Outcomes"
        fieldName="outcomes"
        record={formData}
        setRecord={setFormData}
      />

      <MyInput
        width={200}
        column
        fieldLabel="Medical Interventions Performed"
        fieldType="textarea"
        fieldName="medicalInterventionsPerformed"
        record={formData}
        setRecord={setFormData}
      />

    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add/Edit Hospitalizations"
      steps={[{ title: "Hospitalizations", icon: <FontAwesomeIcon icon={faHospitalUser} /> }]}
      actionButtonFunction={save}
      position="right"
      size="33vw"
      content={content}
    />
  );
};

export default AddHospitalizations;
