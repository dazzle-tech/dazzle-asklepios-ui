import React, { useEffect, useState } from 'react';

import { Col, Form, Row } from 'rsuite';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLungsVirus } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';

import { useEnumOptions } from '@/services/enumsApi';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

import {
  useCreateClaimEncounterCopyPatientProblemMutation,
  useUpdateClaimEncounterCopyPatientProblemMutation
} from '@/services/billing/claimEncounterCopyPatientProblemService';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import MultiSelectAppender from '@/pages/medical-component/multi-select-appender/MultiSelectAppender';

const emptyPatientProblem = {
  condition: '',
  dateOfDiagnosis: null,
  conditionStatus: null,
  type: null,
  dateOfResolution: null,
  byPatient: true,
  sourceOfInformation: null,
  patientIsFree: false,
  freeText: ''
};

const normalizeSavedValue = (value: any) => {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string') return value.trim();

  if (typeof value === 'object') {
    return (
      value?.key ??
      value?.value ??
      value?.id ??
      value?.code ??
      value?.lovKey ??
      null
    );
  }

  return value;
};

const AddClaimEncounterCopyPatientProblem = ({
  open,
  setOpen,
  initialData,
  claimEncounterCopyId,
  onSaved
}) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<any>(emptyPatientProblem);
  const [formKey, setFormKey] = useState(0);

  const patientConditions = useEnumOptions('Condition');

  const { data: statusLov } =
    useGetLovValuesByCodeQuery('DIAGNOSIS_STATUS');

  const { data: typeLov } =
    useGetLovValuesByCodeQuery('DIAGNOSIS_TYPE');

  const { data: sourceLov } =
    useGetLovValuesByCodeQuery('RELATION');

  const [createPatientProblem, { isLoading: isCreating }] =
    useCreateClaimEncounterCopyPatientProblemMutation();

  const [updatePatientProblem, { isLoading: isUpdating }] =
    useUpdateClaimEncounterCopyPatientProblemMutation();

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...emptyPatientProblem,
        ...initialData,
        freeText: initialData.freeText || ''
      });
    } else {
      setFormData({
        ...emptyPatientProblem
      });
    }
  }, [initialData, open]);

  useEffect(() => {
    if (formData.patientIsFree) {
      setFormData(prev => ({
        ...prev,
        condition: '',
        dateOfDiagnosis: null,
        conditionStatus: null,
        type: null,
        dateOfResolution: null,
        byPatient: true,
        sourceOfInformation: null
      }));

      setFormKey(prev => prev + 1);
    }
  }, [formData.patientIsFree]);

  const handleSave = async () => {
    const normalizedType = normalizeSavedValue(formData.type);

    const normalizedConditionStatus =
      normalizeSavedValue(formData.conditionStatus);

    const normalizedSourceOfInformation = normalizeSavedValue(
      formData.byPatient ? null : formData.sourceOfInformation
    );

    const payload = {
      condition: formData.patientIsFree
        ? null
        : String(formData.condition ?? '').trim(),

      dateOfDiagnosis: formData.patientIsFree
        ? null
        : formData.dateOfDiagnosis,

      conditionStatus: formData.patientIsFree
        ? null
        : normalizedConditionStatus,

      type: formData.patientIsFree
        ? null
        : normalizedType,

      dateOfResolution: formData.patientIsFree
        ? null
        : formData.dateOfResolution,

      byPatient: formData.patientIsFree
        ? null
        : formData.byPatient,

      sourceOfInformation: formData.patientIsFree
        ? null
        : normalizedSourceOfInformation,

      patientIsFree: !!formData.patientIsFree,

      freeText: formData.patientIsFree
        ? String(formData.freeText ?? '').trim()
        : null
    };

    const errors: string[] = [];

    if (payload.patientIsFree) {
      if (!payload.freeText) {
        errors.push('Free Text is required');
      }
    } else {
      if (!payload.condition) {
        errors.push('Condition is required');
      }

      if (!payload.dateOfDiagnosis) {
        errors.push('Date of Diagnosis is required');
      }

      if (!payload.conditionStatus) {
        errors.push('Condition Status is required');
      }

      if (!payload.type) {
        errors.push('Type is required');
      }

      if (
        payload.byPatient === false &&
        !payload.sourceOfInformation
      ) {
        errors.push(
          'Source of Information is required when problem is not reported by patient'
        );
      }
    }

    if (errors.length) {
      dispatch(
        notify({
          msg: errors.join(', '),
          sev: 'warning'
        })
      );
      return;
    }

    if (!claimEncounterCopyId) {
      dispatch(
        notify({
          msg: 'Invalid claim encounter copy.',
          sev: 'error'
        })
      );
      return;
    }

    try {
      if (initialData?.id) {
        await updatePatientProblem({
          id: initialData.id,
          ...payload
        }).unwrap();

        dispatch(
          notify({
            msg: 'Patient problem updated successfully',
            sev: 'success'
          })
        );
      } else {
        await createPatientProblem({
          claimEncounterCopyId,
          ...payload
        }).unwrap();

        dispatch(
          notify({
            msg: 'Patient problem added successfully',
            sev: 'success'
          })
        );
      }

      onSaved?.();

      setOpen(false);
      setFormData({
        ...emptyPatientProblem
      });
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.detail ||
        error?.error ||
        'Failed to save Patient Problem.';

      dispatch(
        notify({
          msg: errorMessage,
          sev: 'error'
        })
      );
    }
  };

  const content = (
    <Form fluid className="fields-container">
      <Row>
        <MyInput
          width="14vw"
          column
          fieldLabel="Patient Is Free"
          fieldType="checkbox"
          fieldName="patientIsFree"
          record={formData}
          setRecord={setFormData}
        />

        <Row>
          <Col md={12}>
            <div style={{ marginBottom: 12 }}>
              <MultiSelectAppender
                disabled={formData.patientIsFree}
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
              required={!formData.patientIsFree}
              disabled={formData.patientIsFree}
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
              selectData={statusLov?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              disableByField="isValid"
              record={formData}
              setRecord={setFormData}
              searchable={false}
              required={!formData.patientIsFree}
              disabled={formData.patientIsFree}
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
              required={!formData.patientIsFree}
              disabled={formData.patientIsFree}
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
            disabled={formData.patientIsFree}
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
              disabled={formData.patientIsFree}
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
              disabled={
                formData.byPatient === true ||
                formData.patientIsFree
              }
            />
          </Col>
        </Row>

        {formData.patientIsFree && (
          <Row>
            <MyInput
              width="100%"
              column
              fieldLabel="Free Text"
              fieldType="textarea"
              fieldName="freeText"
              record={formData}
              setRecord={setFormData}
              required
            />
          </Row>
        )}
      </Row>
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
          ? 'Edit Patient Problem'
          : 'Add Patient Problem'
      }
      steps={[
        {
          title: 'Patient Problem',
          icon: <FontAwesomeIcon icon={faLungsVirus} />
        }
      ]}
      actionButtonFunction={handleSave}
      actionButtonDisabled={isCreating || isUpdating}
      position="right"
      size="33vw"
      content={<div dir={dir}>{content}</div>}
    />
  );
};

export default AddClaimEncounterCopyPatientProblem;