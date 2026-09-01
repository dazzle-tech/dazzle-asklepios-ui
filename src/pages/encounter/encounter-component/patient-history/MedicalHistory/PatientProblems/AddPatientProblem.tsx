import React, { useEffect, useState } from 'react';
import { Col, Form, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLungsVirus } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';

import { useEnumOptions } from '@/services/enumsApi';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  useAddPatientProblemMutation,
  useUpdatePatientProblemMutation,
  useLazyGetPatientProblemsQuery
} from '@/services/patients/patientProblemService';

import {
  useUpdatePatientConditionsMutation,
  useLazyGetPatientByIdQuery
} from '@/services/patient/patientService';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MultiSelectAppender from '@/pages/medical-component/multi-select-appender/MultiSelectAppender';
import { setRefetchPatientSide } from '@/reducers/refetchPatientSide';

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

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? {};
  const messageProp: string = data?.message || '';

  const errorKey = messageProp.startsWith('error.')
    ? messageProp.substring(6)
    : data?.error;

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  dispatch(
    notify({
      msg: humanMsg,
      sev: 'warning'
    })
  );
};

const emptyPatientProblem = {
  id: undefined,
  patientId: undefined,
  condition: '',
  dateOfDiagnosis: null,
  conditionStatus: null,
  type: null,
  dateOfResolution: null,
  byPatient: true,
  sourceOfInformation: null
};

const normalizeConditions = (value = '') =>
  Array.from(
    new Set(
      String(value)
        .split(',')
        .map(x => x.trim())
        .filter(Boolean)
    )
  );

const AddPatientProblem = ({ open, setOpen, initialData, patient, onSaved }) => {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<any>(emptyPatientProblem);
  const [formKey, setFormKey] = useState(0);

  const patientConditions = useEnumOptions('Condition');
  const statusOptions = useEnumOptions('EncounterVaccinationStatus');

  const { data: typeLov } = useGetLovValuesByCodeQuery('DIAGNOSIS_TYPE');
  const { data: sourceLov } = useGetLovValuesByCodeQuery('RELATION');

  const [addPatientProblem] = useAddPatientProblemMutation();
  const [updatePatientProblem] = useUpdatePatientProblemMutation();
  const [updatePatientConditions] = useUpdatePatientConditionsMutation();
  const [getProblems] = useLazyGetPatientProblemsQuery();
  const [getPatient] = useLazyGetPatientByIdQuery();

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        patientId: Number(patient?.id)
      });
    } else {
      setFormData({
        ...emptyPatientProblem,
        patientId: Number(patient?.id)
      });
    }
  }, [initialData, open, patient?.id]);

  const handleSave = async () => {
    const payload = {
      id: formData.id,
      patientId: Number(patient.id),
      condition: formData.condition,
      dateOfDiagnosis: formData.dateOfDiagnosis,
      conditionStatus: formData.conditionStatus,
      type: formData.type,
      dateOfResolution: formData.dateOfResolution,
      byPatient: formData.byPatient,
      sourceOfInformation: formData.byPatient ? null : formData.sourceOfInformation
    };

    const errors: string[] = [];

    if (!payload.condition?.trim()) errors.push('Condition is required');
    if (!payload.dateOfDiagnosis) errors.push('Date of Diagnosis is required');
    if (!payload.conditionStatus) errors.push('Condition Status is required');
    if (!payload.type) errors.push('Type is required');

    if (errors.length) {
      dispatch(notify({ msg: errors.join(', '), sev: 'warning' }));
      return;
    }

    try {
      if (formData.id) {
        await updatePatientProblem(payload).unwrap();
      } else {
        await addPatientProblem(payload).unwrap();
      }

      const response = await getProblems(
        {
          patientId: patient.id,
          page: 0,
          size: 1000,
          showCancelled: false,
          timestamp: Date.now()
        } as any,
        true
      ).unwrap();

      const conditions = Array.from(
        new Set(
          [
            ...normalizeConditions(patient?.patientConditions),
            ...(response.data ?? []).flatMap((problem: any) =>
              normalizeConditions(problem.condition)
            ),
            ...normalizeConditions(payload.condition)
          ]
        )
      ).join(',');

      await updatePatientConditions({
        id: patient.id,
        patientConditions: conditions
      }).unwrap();
      await getPatient(
        {
          id: patient.id,
          timestamp: Date.now()
        } as any,
        true
      ).unwrap();

      dispatch(setRefetchPatientSide(true));
      onSaved?.();

      dispatch(
        notify({
          msg: formData.id
            ? 'Patient problem updated successfully'
            : 'Patient problem added successfully',
          sev: 'success'
        })
      );

      if (formData.id) {
        setOpen(false);
      } else {
        setFormData({
          ...emptyPatientProblem,
          patientId: Number(patient?.id)
        });
        setFormKey(prev => prev + 1);
      }
    } catch (err: any) {
      handleCrudError(err, dispatch, PATIENT_PROBLEM_ERROR_MAP);
    }
  };

  const content = (
    <Form fluid className="fields-container">
      <Row>
        <Row>
          <Col md={12}>
            <div style={{ marginBottom: 12 }}>
              <MultiSelectAppender
                key={formKey}
                label="Condition"
                options={patientConditions ?? []}
                optionLabel="label"
                optionValue="value"
                object={formData.condition ?? ''}
                setObject={(value: string) =>
                  setFormData(prev => ({
                    ...prev,
                    condition: value
                  }))
                }
              />
            </div>
          </Col>

          <Col md={12}>
            <MyInput
              width="100%"
              column
              fieldLabel="Date of diagnosis"
              fieldType="date"
              fieldName="dateOfDiagnosis"
              record={formData}
              setRecord={setFormData}
              disableFutureDates
              required
            />
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <MyInput
              width="100%"
              column
              fieldLabel="Condition Status"
              fieldType="select"
              fieldName="conditionStatus"
              selectData={statusOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={formData}
              setRecord={setFormData}
              searchable={false}
              required
            />
          </Col>

          <Col md={12}>
            <MyInput
              width="100%"
              column
              fieldLabel="Type"
              fieldType="select"
              fieldName="type"
              selectData={typeLov?.object ?? []}
              selectDataValue="key"
              selectDataLabel="lovDisplayVale"
              disableByField="isValid"
              record={formData}
              setRecord={setFormData}
              searchable={false}
              required
            />
          </Col>
        </Row>

        <Row>
          <MyInput
            width="100%"
            column
            fieldLabel="Date of resolution"
            fieldType="date"
            fieldName="dateOfResolution"
            record={formData}
            setRecord={setFormData}
          />
        </Row>

        <Row>
          <Col md={12}>
            <MyInput
              width="100%"
              column
              fieldLabel="By Patient"
              fieldType="checkbox"
              fieldName="byPatient"
              record={formData}
              setRecord={setFormData}
            />
          </Col>

          <Col md={12}>
            <MyInput
              width="100%"
              column
              fieldLabel="Source of information"
              fieldType="select"
              fieldName="sourceOfInformation"
              selectData={sourceLov?.object ?? []}
              selectDataValue="key"
              selectDataLabel="lovDisplayVale"
              disableByField="isValid"
              record={formData}
              setRecord={setFormData}
              searchable={false}
              disabled={formData.byPatient === true}
            />
          </Col>
        </Row>
      </Row>
    </Form>
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

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
      content={<div dir={dir}>{content}</div>}
    />
  );
};

export default AddPatientProblem;