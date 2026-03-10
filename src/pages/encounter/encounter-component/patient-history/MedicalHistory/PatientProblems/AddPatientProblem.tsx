import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLungsVirus } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';

import { useEnumOptions } from '@/services/enumsApi';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  useAddPatientProblemMutation,
  useUpdatePatientProblemMutation
} from '@/services/patients/patientProblemService';
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
      if (m.includes('size must be between')) return 'length is out of range';
      if (m.includes('must be greater')) return 'value is too small';
      if (m.includes('must be less')) return 'value is too large';
      return msg || 'invalid value';
    };

    const lines = data.fieldErrors.map((fe: any) => `• ${fe.field}: ${normalizeMsg(fe.message)}`);

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix,
        sev: 'warning'
      })
    );
    return;
  }

  const messageProp: string = data?.message || '';
  if (
    messageProp.includes('ConstraintViolationImpl') ||
    messageProp.includes('Validation failed')
  ) {
    const violations: string[] = [];

    const violationPattern = /propertyPath=(\w+).*?interpolatedMessage='([^']+)'/g;
    let match;

    while ((match = violationPattern.exec(messageProp)) !== null) {
      const field = match[1];
      const message = match[2];

      const normalizedMsg = message.includes('must not be null')
        ? 'is required'
        : message.includes('must not be blank')
        ? 'must not be blank'
        : message.includes('size must be between')
        ? 'length is out of range'
        : message.includes('must be greater')
        ? 'value is too small'
        : message.includes('must be less')
        ? 'value is too large'
        : message;

      violations.push(`• ${field}: ${normalizedMsg}`);
    }

    if (violations.length > 0) {
      dispatch(
        notify({
          msg: `Please fix the following fields:\n${violations.join('\n')}` + suffix,
          sev: 'warning'
        })
      );
      return;
    }
  }

  const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : data?.error;

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  dispatch(notify({ msg: humanMsg + suffix, sev: 'warning' }));
};

const PATIENT_PROBLEM_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Patient problem payload is required.',
  'source.required': 'Source of information is required when problem is not reported by patient.',
  'type.required': 'Type is required.',
  'patient.invalid': 'Invalid patient reference.',
  'patient.notfound': 'Patient not found.',
  'db.constraint': 'Database constraint violation.',
  'field.required': 'This field is required.',
  'validation.failed': 'Please fix validation errors.',
  'duplicate.entry': 'A patient problem with these values already exists.',
  notfound: 'Patient problem not found.'
};

const emptyPatientProblem = {
  id: undefined,
  patientId: undefined,
  condition: '',
  dateOfDiagnosis: null,
  status: null,
  type: null,
  dateOfResolution: null,
  byPatient: true,
  sourceOfInformation: null
};

const AddPatientProblem = ({ open, setOpen, initialData, patient }) => {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<any>(emptyPatientProblem);

  const statusOptions = useEnumOptions('EncounterVaccinationStatus');
  const { data: typeLov } = useGetLovValuesByCodeQuery('DIAGNOSIS_TYPE');
  const { data: sourceLov } = useGetLovValuesByCodeQuery('RELATION');

  const [addPatientProblem] = useAddPatientProblemMutation();
  const [updatePatientProblem] = useUpdatePatientProblemMutation();

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData, patientId: Number(patient?.id) });
    } else {
      setFormData({ ...emptyPatientProblem, patientId: Number(patient?.id) });
    }
  }, [initialData, open, patient?.id]);

  const handleSave = async () => {
    const payload = {
      id: formData.id,
      patientId: Number(patient.id),
      condition: formData.condition,
      dateOfDiagnosis: formData.dateOfDiagnosis,
      status: formData.status,
      type: formData.type,
      dateOfResolution: formData.dateOfResolution,
      byPatient: formData.byPatient,
      sourceOfInformation: formData.byPatient ? null : formData.sourceOfInformation
    };

    try {
      if (formData.id) {
        await updatePatientProblem(payload).unwrap();
        dispatch(notify({ msg: 'Patient problem updated successfully', sev: 'success' }));
      } else {
        await addPatientProblem(payload).unwrap();
        dispatch(notify({ msg: 'Patient problem added successfully', sev: 'success' }));
      }

      setOpen(false);
    } catch (err: any) {
      handleCrudError(err, dispatch, PATIENT_PROBLEM_ERROR_MAP);
    }
  };

  const content = (
    <Form fluid layout="inline" className="fields-container">
      <MyInput
        width={200}
        column
        fieldLabel="Condition"
        fieldName="condition"
        record={formData}
        setRecord={setFormData}
        required
      />

      <MyInput
        width={200}
        column
        fieldLabel="Date of diagnosis"
        fieldType="date"
        fieldName="dateOfDiagnosis"
        record={formData}
        setRecord={setFormData}
        required
      />

      <MyInput
        width={200}
        column
        fieldLabel="Status"
        fieldType="select"
        fieldName="status"
        selectData={statusOptions ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={formData}
        setRecord={setFormData}
        searchable={false}
        required
      />

      <MyInput
        width={200}
        column
        fieldLabel="Type"
        fieldType="select"
        fieldName="type"
        selectData={typeLov?.object ?? []}
        selectDataValue="key"
        selectDataLabel="lovDisplayVale"
        record={formData}
        setRecord={setFormData}
        searchable={false}
        required
      />

      <MyInput
        width={200}
        column
        fieldLabel="Date of resolution"
        fieldType="date"
        fieldName="dateOfResolution"
        record={formData}
        setRecord={setFormData}
      />

      <MyInput
        width={200}
        column
        fieldLabel="By Patient"
        fieldType="checkbox"
        fieldName="byPatient"
        record={formData}
        setRecord={setFormData}
      />

      <MyInput
        width={200}
        column
        fieldLabel="Source of information"
        fieldType="select"
        fieldName="sourceOfInformation"
        selectData={sourceLov?.object ?? []}
        selectDataValue="key"
        selectDataLabel="lovDisplayVale"
        record={formData}
        setRecord={setFormData}
        searchable={false}
        disabled={formData.byPatient === true}
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add / Edit Patient Problem"
      steps={[
        {
          title: 'Patient Problem',
          icon: <FontAwesomeIcon icon={faLungsVirus} />
        }
      ]}
      actionButtonFunction={handleSave}
      position="right"
      size="33vw"
      content={content}
    />
  );
};

export default AddPatientProblem;
