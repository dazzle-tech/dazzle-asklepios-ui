import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Col, Form, Row } from 'rsuite';

import type {
  AdditionalMeasurements as AdditionalMeasurementsModel,
  Patient
} from '@/types/model-types-new';
import { newAdditionalMeasurements } from '@/types/model-types-constructor-new';

import {
  useCreateAdditionalMeasurementsInfantMutation,
  useCreateAdditionalMeasurementsGeriatricMutation,
  useGetLatestAdditionalMeasurementsByEncounterIdQuery,
  type AdditionalMeasurementsInfantCreateDTO,
  type AdditionalMeasurementsGeriatricCreateDTO
} from '@/services/medicalsheetsEncounter/observations/additionalMeasurementsService';

import { useLazyGetAgeGroupByBirthDateQuery } from '@/services/setup/ageGroupService';

type AdditionalMeasurementsProps = {
  patient: Patient; 
  encounterId: number;
  encounter?: any;
  disabled?: boolean;
  width?: string;
  title?: React.ReactNode;
};

const AdditionalMeasurements: React.FC<AdditionalMeasurementsProps> = ({
  patient,
  encounterId,
  encounter,
  disabled = false,
  width = '100%',
  title = 'Additional Measurements'
}) => {
  const dispatch = useAppDispatch();

  const patientId = Number((patient as any)?.id);

  const [ageGroupValue, setAgeGroupValue] = useState<{ ageGroup: string }>({ ageGroup: '' });
  const lastProcessedDOB = useRef<string | null>(null);

  const [fetchAgeGroupByBirthDate] = useLazyGetAgeGroupByBirthDateQuery();

  useEffect(() => {
    const dob =
      (patient as any)?.dateOfBirth

    if (!dob) {
      setAgeGroupValue({ ageGroup: '' });
      lastProcessedDOB.current = null;
      return;
    }

    if (lastProcessedDOB.current === String(dob)) return;
    lastProcessedDOB.current = String(dob);

    const birthDate =
      String(dob).includes('T') ? String(dob).split('T')[0] : String(dob);

    fetchAgeGroupByBirthDate({ birthDate } as any)
      .unwrap()
      .then(res => {
        // ProfileTabs expects res?.ageGroup
        setAgeGroupValue({ ageGroup: res?.ageGroup ?? '' });
      })
      .catch(err => {
        setAgeGroupValue({ ageGroup: '' });
      });
  }, [(patient as any)?.id, (patient as any)?.dateOfBirth]);

  const apiAgeGroup = useMemo(() => {
    const ag = (ageGroupValue?.ageGroup ?? '').toUpperCase();
    if (ag === 'INFANT') return 'INFANT';
    if (ag === 'NEONATE') return 'NEONATE';
    if (ag === 'GERIATRIC') return 'GERIATRIC';
    return null;
  }, [ageGroupValue?.ageGroup]);

  const isInfant = apiAgeGroup === 'INFANT' || apiAgeGroup === 'NEONATE';
  const isGeriatric = apiAgeGroup === 'GERIATRIC';

  // =========================
  // API
  // =========================
  const [createInfant] = useCreateAdditionalMeasurementsInfantMutation();
  const [createGeriatric] = useCreateAdditionalMeasurementsGeriatricMutation();

  const { data: latestByEncounter } = useGetLatestAdditionalMeasurementsByEncounterIdQuery(
    { encounterId },
    { skip: !encounterId }
  );

  // =========================
  // Local state
  // =========================
  const [record, setRecord] = useState<AdditionalMeasurementsModel>({
    ...newAdditionalMeasurements,
    patientId,
    encounterId,
    ageGroup: (apiAgeGroup as any) ?? (newAdditionalMeasurements as any)?.ageGroup
  });

  useEffect(() => {
    setRecord(prev => ({
      ...prev,
      patientId,
      encounterId,
      ageGroup: (apiAgeGroup as any) ?? (prev as any)?.ageGroup
    }));
  }, [patientId, encounterId, apiAgeGroup]);

  useEffect(() => {
    if (!latestByEncounter) return;

    setRecord(prev => ({
      ...prev,
      ...latestByEncounter,
      id: undefined,
      patientId,
      encounterId,
      ageGroup: (apiAgeGroup as any) ?? (latestByEncounter as any)?.ageGroup,

      dehydration: Boolean((latestByEncounter as any)?.dehydration ?? false),
      nasalFlaring: Boolean((latestByEncounter as any)?.nasalFlaring ?? false),
      responseToLight: Boolean((latestByEncounter as any)?.responseToLight ?? false),
      pupilResponse: Boolean((latestByEncounter as any)?.pupilResponse ?? false),
      abilityToFollowTarget: Boolean((latestByEncounter as any)?.abilityToFollowTarget ?? false),
      colorTesting: Boolean((latestByEncounter as any)?.colorTesting ?? false),

      fallRisk: Boolean((latestByEncounter as any)?.fallRisk ?? false),
      visionProblemsAffectingFunction: Boolean(
        (latestByEncounter as any)?.visionProblemsAffectingFunction ?? false
      ),
      hearingProblemsAffectingFunction: Boolean(
        (latestByEncounter as any)?.hearingProblemsAffectingFunction ?? false
      ),

      isActive:
        typeof (latestByEncounter as any)?.isActive === 'boolean'
          ? (latestByEncounter as any).isActive
          : true
    }));
  }, [latestByEncounter, patientId, encounterId, apiAgeGroup]);

  const infantCreatePayload: AdditionalMeasurementsInfantCreateDTO | null = useMemo(() => {
    if (!isInfant || !apiAgeGroup) return null;

    return {
      patientId,
      encounterId,
      ageGroup: apiAgeGroup as 'INFANT' | 'NEONATE',
      hearingTest: (record.hearingTest ?? '').trim(),
      dehydration: Boolean(record.dehydration ?? false),
      nasalFlaring: Boolean(record.nasalFlaring ?? false),
      responseToLight: Boolean(record.responseToLight ?? false),
      pupilResponse: Boolean(record.pupilResponse ?? false),
      abilityToFollowTarget: Boolean(record.abilityToFollowTarget ?? false),
      colorTesting: Boolean(record.colorTesting ?? false),
      isActive: typeof record.isActive === 'boolean' ? record.isActive : true
    };
  }, [isInfant, apiAgeGroup, record, patientId, encounterId]);

  const geriatricCreatePayload: AdditionalMeasurementsGeriatricCreateDTO | null = useMemo(() => {
    if (!isGeriatric || !apiAgeGroup) return null;

    return {
      patientId,
      encounterId,
      ageGroup: 'GERIATRIC',
      fallRisk: Boolean(record.fallRisk ?? false),
      visionProblemsAffectingFunction: Boolean(record.visionProblemsAffectingFunction ?? false),
      hearingProblemsAffectingFunction: Boolean(record.hearingProblemsAffectingFunction ?? false),
      details: (record.details ?? null) as any,
      actionToTake: (record.actionToTake ?? '').trim(),
      isActive: typeof record.isActive === 'boolean' ? record.isActive : true
    };
  }, [isGeriatric, apiAgeGroup, record, patientId, encounterId]);

  const normalizeFieldErrorMessage = (message: string) => {
    const m = (message || '').toLowerCase();
    if (m.includes('must not be null')) return 'is required';
    if (m.includes('must not be blank')) return 'must not be blank';
    if (m.includes('size must be between')) return 'length is out of range';
    if (m.includes('must be greater')) return 'value is too small';
    if (m.includes('must be less')) return 'value is too large';
    return message || 'invalid value';
  };

  const showApiError = (error: any) => {
    const data = error?.data ?? {};
    const traceId = data?.traceId || data?.requestId || data?.correlationId;
    const traceSuffix = traceId ? `\nTrace ID: ${traceId}` : '';

    const isValidationError =
      data?.message === 'error.validation' ||
      data?.title === 'Method argument not valid' ||
      (typeof data?.type === 'string' && data.type.includes('constraint-violation'));

    if (isValidationError && Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
      const fieldLabels: Record<string, string> = {
        patientId: 'Patient',
        encounterId: 'Encounter',
        ageGroup: 'Age Group',
        hearingTest: 'Hearing Test',
        dehydration: 'Dehydration',
        nasalFlaring: 'Nasal Flaring',
        responseToLight: 'Response to Light',
        pupilResponse: 'Pupil Response',
        abilityToFollowTarget: 'Ability to Follow Target',
        colorTesting: 'Color Testing',
        fallRisk: 'Fall Risk',
        visionProblemsAffectingFunction: 'Vision problems affecting function',
        hearingProblemsAffectingFunction: 'Hearing problems affecting function',
        details: 'Details',
        actionToTake: 'Action to take',
        isActive: 'Active',
        id: 'Id'
      };

      const lines = data.fieldErrors.map((fe: any) => {
        const label = fieldLabels[fe.field] ?? fe.field;
        return `• ${label}: ${normalizeFieldErrorMessage(fe.message)}`;
      });

      dispatch(
        notify({
          msg: `Please fix the following fields:\n${lines.join('\n')}` + traceSuffix,
          sev: 'warning'
        })
      );
      return;
    }

    const messageProperty: string = data?.message || '';
    const errorKey = messageProperty.startsWith('error.') ? messageProperty.substring(6) : undefined;

    const keyMap: Record<string, string> = {
      'payload.required': 'Additional measurements payload is required.',
      'patient.required': 'Patient id is required.',
      'encounter.required': 'Encounter id is required.',
      'ageGroup.required': 'Age group is required.',
      'patient.notfound': 'Patient not found.',
      'patient.invalid': 'Invalid patient id.',
      'db.constraint': 'Database constraint violated while saving additional measurements.'
    };

    const human =
      (errorKey && keyMap[errorKey]) ||
      data?.detail ||
      data?.title ||
      data?.message ||
      'Unexpected error';

    dispatch(notify({ msg: human + traceSuffix, sev: 'warning' }));
  };

  const handleSave = async () => {
    if (!patientId) {
      dispatch(notify({ msg: 'Patient id is required.', sev: 'warning' }));
      return;
    }
    if (!encounterId) {
      dispatch(notify({ msg: 'Encounter id is required.', sev: 'warning' }));
      return;
    }
    if (!apiAgeGroup) {
      dispatch(notify({ msg: 'Age group is required.', sev: 'warning' }));
      return;
    }

    if (isInfant) {
      const ht = (record.hearingTest ?? '').trim();
      if (!ht) {
        dispatch(notify({ msg: 'Hearing Test is required.', sev: 'warning' }));
        return;
      }
    }

    if (isGeriatric) {
      const action = (record.actionToTake ?? '').trim();
      if (!action) {
        dispatch(notify({ msg: 'Action to take is required.', sev: 'warning' }));
        return;
      }
    }

    try {
      let created: AdditionalMeasurementsModel | null = null;

      if (isInfant && infantCreatePayload) {
        created = await createInfant(infantCreatePayload as any).unwrap();
        
      } else if (isGeriatric && geriatricCreatePayload) {
        created = await createGeriatric(geriatricCreatePayload as any).unwrap();
      } else {
        dispatch(
          notify({
            msg: 'Unsupported age group for Additional Measurements.',
            sev: 'warning'
          })
        );
        return;
      }

      setRecord(prev => ({
        ...prev,
        ...created,
        patientId,
        encounterId,
        ageGroup: apiAgeGroup as any,
        id: undefined
      }));

      dispatch(notify({ msg: 'Additional measurements saved successfully', sev: 'success' }));
    } catch (e: any) {
      showApiError(e);
    }
  };

  const handleClear = () => {
    setRecord({
      ...newAdditionalMeasurements,
      patientId,
      encounterId,
      ageGroup: (apiAgeGroup as any) ?? (newAdditionalMeasurements as any).ageGroup,
      hearingTest: '',
      dehydration: false,
      nasalFlaring: false,
      responseToLight: false,
      pupilResponse: false,
      abilityToFollowTarget: false,
      colorTesting: false,
      fallRisk: false,
      visionProblemsAffectingFunction: false,
      hearingProblemsAffectingFunction: false
    });
  };

  if (!isInfant && !isGeriatric) return null;

  return (
    <SectionContainer
      title={title}
      action={
        <Form fluid layout="inline">
          <MyButton onClick={handleSave} disabled={disabled}>
            Save
          </MyButton>
          <MyButton onClick={handleClear} disabled={disabled}>
            Clear
          </MyButton>
        </Form>
      }
      content={
        <div style={width ? { width } : {}}>
          <Form fluid>
            {isInfant && (
              <>
                <Row className="rows-gap">
                  <Col md={24}>
                    <MyInput
                      width="100%"
                      fieldName="hearingTest"
                      fieldLabel="Hearing Test"
                      record={record}
                      setRecord={setRecord}
                      disabled={disabled}
                      required
                    />
                  </Col>
                </Row>

                <Row className="rows-gap">
                  <Col md={8}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="dehydration"
                      fieldLabel="Dehydration"
                      checkedLabel="positive"
                      unCheckedLabel="negative"
                      record={record}
                      setRecord={setRecord}
                      disabled={disabled}
                    />
                  </Col>

                  <Col md={8}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="nasalFlaring"
                      fieldLabel="Nasal Flaring"
                      checkedLabel="positive"
                      unCheckedLabel="negative"
                      record={record}
                      setRecord={setRecord}
                      disabled={disabled}
                    />
                  </Col>

                  <Col md={8}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="responseToLight"
                      fieldLabel="Response to Light"
                      checkedLabel="positive"
                      unCheckedLabel="negative"
                      record={record}
                      setRecord={setRecord}
                      disabled={disabled}
                    />
                  </Col>
                </Row>

                <Row className="rows-gap">
                  <Col md={8}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="pupilResponse"
                      fieldLabel="Pupil Response"
                      checkedLabel="positive"
                      unCheckedLabel="negative"
                      record={record}
                      setRecord={setRecord}
                      disabled={disabled}
                    />
                  </Col>

                  <Col md={8}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="abilityToFollowTarget"
                      fieldLabel="Ability to Follow Target"
                      checkedLabel="positive"
                      unCheckedLabel="negative"
                      record={record}
                      setRecord={setRecord}
                      disabled={disabled}
                    />
                  </Col>

                  <Col md={8}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="colorTesting"
                      fieldLabel="Color Testing"
                      checkedLabel="positive"
                      unCheckedLabel="negative"
                      record={record}
                      setRecord={setRecord}
                      disabled={disabled}
                    />
                  </Col>
                </Row>
              </>
            )}

            {isGeriatric && (
              <>
                <Row className="rows-gap">
                  <Col md={24}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="fallRisk"
                      fieldLabel="Fall risk"
                      checkedLabel="yes"
                      unCheckedLabel="no"
                      record={record}
                      setRecord={setRecord}
                      disabled={disabled}
                      required
                    />
                  </Col>
                </Row>

                <Row className="rows-gap">
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="visionProblemsAffectingFunction"
                      fieldLabel="Vision problems affecting function"
                      checkedLabel="yes"
                      unCheckedLabel="no"
                      record={record}
                      setRecord={setRecord}
                      disabled={disabled}
                      required
                    />
                  </Col>

                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="hearingProblemsAffectingFunction"
                      fieldLabel="Hearing problems affecting function"
                      checkedLabel="yes"
                      unCheckedLabel="no"
                      record={record}
                      setRecord={setRecord}
                      disabled={disabled}
                      required
                    />
                  </Col>
                </Row>

                <Row className="rows-gap">
                  <Col md={24}>
                    <MyInput
                      width="100%"
                      fieldType="textarea"
                      fieldName="details"
                      fieldLabel="Details"
                      record={record}
                      setRecord={setRecord}
                      disabled={disabled}
                    />
                  </Col>
                </Row>

                <Row className="rows-gap">
                  <Col md={24}>
                    <MyInput
                      width="100%"
                      fieldType="textarea"
                      fieldName="actionToTake"
                      fieldLabel="Action to take"
                      record={record}
                      setRecord={setRecord}
                      disabled={disabled}
                      required
                    />
                  </Col>
                </Row>
              </>
            )}
          </Form>
        </div>
      }
    />
  );
};

export default AdditionalMeasurements;
