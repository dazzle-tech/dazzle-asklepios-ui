import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHospitalUser } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';

import {
  useAddHospitalizationMutation,
  useUpdateHospitalizationMutation
} from '@/services/patients/hospitalizationsService';
import { newHospitalization } from '@/types/model-types-constructor-new';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import Translate from '@/components/Translate';

/*  ERROR HANDLER  */

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  /*  FIELD ERRORS  */
  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const normalizeMsg = (msg: string) => {
      const m = (msg || '').toLowerCase();
      if (m.includes('must not be null')) return 'is required';
      if (m.includes('must not be blank')) return 'must not be blank';
      if (m.includes('size must be between')) return 'length is out of range';
      if (m.includes('must be greater')) return 'value is too small';
      if (m.includes('must be less')) return 'value is too large';
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

  /*  CONSTRAINT VIOLATIONS  */
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

  /*  BUSINESS / DB ERRORS  */
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

const PATIENT_ADMISSION_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Hospitalization payload is required.',
  'patient.invalid': 'Invalid patient reference.',
  duplicate: 'Hospitalization already exists for this patient.',
  'db.constraint': 'Database constraint violation.',
  notfound: 'Hospitalization record not found.'
};

/*  COMPONENT  */

const AddHospitalizations = ({ open, setOpen, initialData, patient }) => {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<any>(newHospitalization);

  /*  LOAD  */

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        patientId: Number(patient?.id)
      });
    } else {
      setFormData({
        ...newHospitalization,
        patientId: Number(patient?.id)
      });
    }
  }, [initialData, open, patient?.id]);

  /*  MUTATIONS  */

  const [addHospitalization] = useAddHospitalizationMutation();
  const [updateHospitalization] = useUpdateHospitalizationMutation();

  /*  SAVE  */

  const handleSave = async () => {
    let errorMsg = '';

    if (!formData.facility) errorMsg = 'Facility can’t be empty';
    if (!formData.reason)
      errorMsg = errorMsg ? `${errorMsg}, Reason can’t be empty` : 'Reason can’t be empty';
    if (!formData.dateOfAdmission)
      errorMsg = errorMsg
        ? `${errorMsg}, Date of admission can’t be empty`
        : 'Date of admission can’t be empty';
    if (!formData.admissionType)
      errorMsg = errorMsg
        ? `${errorMsg}, Admission Type can’t be empty`
        : 'Admission Type can’t be empty';

    if (errorMsg) {
      dispatch(notify({ msg: errorMsg, sev: 'warning' }));
      return;
    }

    const payload = {
      id: formData.id,
      patientId: Number(patient.id),
      facility: formData.facility,
      reason: formData.reason,
      admissionType: formData.admissionType,
      dateOfAdmission: formData.dateOfAdmission,
      lengthOfStayDays: formData.lengthOfStayDays,
      outcomes: formData.outcomes,
      medicalInterventionsPerformed: formData.medicalInterventionsPerformed
    };

    try {
      if (formData.id) {
        await updateHospitalization(payload).unwrap();
        dispatch(notify({ msg: 'Hospitalization updated successfully', sev: 'success' }));
      } else {
        await addHospitalization(payload).unwrap();
        dispatch(notify({ msg: 'Hospitalization added successfully', sev: 'success' }));
      }
      setOpen(false);
    } catch (err: any) {
      handleCrudError(err, dispatch, PATIENT_ADMISSION_ERROR_MAP);
    }
  };

  /*  CONTENT  */

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
        fieldName="admissionType"
        record={formData}
        setRecord={setFormData}
        required
      />

      <MyInput
        width={200}
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
        width={200}
        column
        fieldLabel={
          <span>
            <Translate>Length of stay</Translate>
            <Translate>(Days)</Translate>
          </span>
        }
        fieldType="number"
        fieldName="lengthOfStayDays"
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
        width={300}
        column
        fieldLabel="Medical Interventions Performed"
        fieldType="textarea"
        fieldName="medicalInterventionsPerformed"
        record={formData}
        setRecord={setFormData}
      />
    </Form>
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add / Edit Hospitalizations"
      steps={[{ title: 'Hospitalizations', icon: <FontAwesomeIcon icon={faHospitalUser} /> }]}
      actionButtonFunction={handleSave}
      position="right"
      size="33vw"
      content={<div dir={dir}>{content}</div>}
    />
  );
};

export default AddHospitalizations;
