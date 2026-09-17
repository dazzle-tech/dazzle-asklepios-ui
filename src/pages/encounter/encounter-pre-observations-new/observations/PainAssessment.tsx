import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Col, Row, } from 'rsuite';

import type { PainAssessment as PainAssessmentModel } from '@/types/model-types-new';
import { newPainAssessment } from '@/types/model-types-constructor-new';

import {
  useCreatePainAssessmentMutation,
  useGetLatestPainAssessmentByEncounterIdQuery
} from '@/services/medicalsheetsEncounter/observations/painAssessmentService';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useEnumOptions } from '@/services/enumsApi';

import './styles.less';
import NumericSlider from '@/components/NumericSlider';
import FacesSlider from '@/components/FacesSlider';
import FlaccComponent from '@/components/PatientFlaccComponent';
import { useGetLatestActiveFLACCPainScaleByEncounterQuery } from '@/services/encounters/flaccPainSacoreService';

type PainAssessmentProps = {
  patientId: number;
  encounterId: number;
  encounter?: any;
  disabled?: boolean;
  width?: string;
  title?: React.ReactNode;
};

const PainAssessment: React.FC<PainAssessmentProps> = ({
  patientId,
  encounterId,
  encounter,
  disabled = false,
  width = '100%',
  title = 'Pain Assessment'
}) => {
  const dispatch = useAppDispatch();
  const skipFlaccSyncRef = useRef(false);
  const { data: painPatternLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_PATTERN');
  const severityEnumResponse = useEnumOptions('Severity', { exclude: ['CRITICAL'] });
  const painAssessmentTypes = useEnumOptions('PainAssessmentTypes');

  const painLevelEnum = useEnumOptions('PainLevel', {
    labelOverrides: {
      LEVEL_0: '0',
      LEVEL_1: '1',
      LEVEL_2: '2',
      LEVEL_3: '3',
      LEVEL_4: '4',
      LEVEL_5: '5',
      LEVEL_6: '6',
      LEVEL_7: '7',
      LEVEL_8: '8',
      LEVEL_9: '9',
      LEVEL_10: '10'
    }
  });

  const painLevelSteps = useMemo(() => {
    const opts = (painLevelEnum as any)?.options ?? painLevelEnum ?? [];
    const parsed = (Array.isArray(opts) ? opts : [])
      .map((o: any) => {
        const value = String(o?.value ?? '');
        const label = String(o?.label ?? value);
        const m = value.match(/LEVEL_(\d+)/);
        const n = m ? Number(m[1]) : NaN;
        return { value, label, n };
      })
      .filter(x => Number.isFinite(x.n))
      .sort((a, b) => a.n - b.n);

    if (parsed.length === 0) {
      return Array.from({ length: 11 }).map((_, n) => ({
        value: `LEVEL_${n}`,
        label: String(n),
        n
      }));
    }
    return parsed;
  }, [painLevelEnum]);

  const minLevel = painLevelSteps[0]?.n ?? 0;
  const maxLevel = painLevelSteps[painLevelSteps.length - 1]?.n ?? 10;

  const {
    data: latestFlacc
  } = useGetLatestActiveFLACCPainScaleByEncounterQuery(
    encounterId,
    { skip: !encounterId }
  );
  // API
  const [createPainAssessment] = useCreatePainAssessmentMutation();
  const { data: latestByEncounter } = useGetLatestPainAssessmentByEncounterIdQuery(
    { encounterId },
    { skip: !encounterId }
  );

  // Local state
  const [record, setRecord] = useState<PainAssessmentModel>({
    ...newPainAssessment,
    patientId,
    encounterId
  });

  const painLevelValue = useMemo(() => {
    const painLevel = (record as any)?.painLevel as string | null | undefined;
    if (!painLevel) return minLevel;

    const found = painLevelSteps.find(x => x.value === painLevel);
    if (found) return found.n;
    const m = String(painLevel).match(/LEVEL_(\d+)/);
    return m ? Number(m[1]) : minLevel;
  }, [(record as any)?.painLevel, painLevelSteps, minLevel]);

  const getTrackColor = (value: number): string => {
    if (value === 0) return 'transparent';
    if (value >= 1 && value <= 3) return '#28a745';
    if (value >= 4 && value <= 7) return 'orange';
    return 'red';
  };

  const getSeverityFromPainLevel = (painLevel: string | null | undefined): string | null => {
    if (!painLevel) return null;
    const match = String(painLevel).match(/LEVEL_(\d+)/);
    const level = match ? Number(match[1]) : NaN;
    if (!Number.isFinite(level)) return null;
    if (level === 0) return 'NOTHING';
    if (level > 0 && level <= 3) return 'MILD_MINOR';
    if (level >= 4 && level <= 7) return 'MODERATE';
    if (level >= 8 && level <= 10) return 'SEVERE';
    return null;
  };

  const flaccPainLevelToSeverity: Record<string, string> = {
    NO_PAIN: 'NOTHING',
    MILD_PAIN: 'MILD_MINOR',
    MODERATE_PAIN: 'MODERATE',
    SEVERE_PAIN: 'SEVERE',
  };

  useEffect(() => {
    const type = record?.painAssessmentType;

    if (type === 'FLACC') {
      if (skipFlaccSyncRef.current) {
        skipFlaccSyncRef.current = false;
        return;
      }

      if (!latestFlacc) {
        setRecord(prev =>
          prev.painLevel === undefined && prev.painDegree === undefined
            ? prev
            : { ...prev, painLevel: undefined, painDegree: undefined }
        );
        return;
      }

      const nextPainDegree = flaccPainLevelToSeverity[latestFlacc.painLevel] ?? null;
      const nextPainLevel = `LEVEL_${latestFlacc.totalScore}` as any;

      setRecord(prev =>
        prev.painDegree === nextPainDegree && prev.painLevel === nextPainLevel
          ? prev
          : { ...prev, painDegree: nextPainDegree, painLevel: nextPainLevel }
      );
      return;
    }

    if (type === 'NUMERIC' || type === 'FACES') {
      setRecord(prev => {
        const nextSeverity = getSeverityFromPainLevel((prev as any)?.painLevel);
        return prev.painDegree === nextSeverity ? prev : { ...prev, painDegree: nextSeverity };
      });
    }
  }, [
    record?.painAssessmentType,
    record?.painLevel,
    latestFlacc?.painLevel,
    latestFlacc?.totalScore,
  ]);

  useEffect(() => {
    if (!latestByEncounter) return;

    if ((latestByEncounter as any)?.painAssessmentType === 'FLACC') {
      skipFlaccSyncRef.current = true;
    }

    setRecord(prev => ({
      ...prev,
      ...latestByEncounter,
      id: undefined,
      patientId,
      encounterId,
      isActive:
        typeof (latestByEncounter as any)?.isActive === 'boolean'
          ? (latestByEncounter as any).isActive
          : true
    }));
  }, [latestByEncounter, patientId, encounterId]);


  const createPayload = useMemo(() => {
  const isFlacc = (record as any)?.painAssessmentType === 'FLACC';

  return {
    patientId,
    encounterId,
    painDegree: record.painDegree ?? null,
    painDescription: isFlacc ? null : record.painDescription ?? null,
    painPattern: isFlacc ? null : (record as any)?.painPattern ?? null,
    painLevel: (record as any)?.painLevel ?? null,
    painAssessmentType: (record as any)?.painAssessmentType ?? null,
    isActive: typeof record.isActive === 'boolean' ? record.isActive : true
  };
}, [record, patientId, encounterId]);

  const normalizeFieldErrorMessage = (message: string) => {
    const messageLower = (message || '').toLowerCase();
    if (messageLower.includes('must not be null')) return 'is required';
    if (messageLower.includes('must not be blank')) return 'must not be blank';
    if (messageLower.includes('size must be between')) return 'length is out of range';
    if (messageLower.includes('must be greater')) return 'value is too small';
    if (messageLower.includes('must be less')) return 'value is too large';
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
        painDegree: 'Pain Degree',
        painPattern: 'Pain Pattern',
        painLevel: 'Pain Level',
        painDescription: 'Pain Description',
        isActive: 'Active',
        id: 'Id'
      };

      const lines = data.fieldErrors.map((fieldError: any) => {
        const label = fieldLabels[fieldError.field] ?? fieldError.field;
        return `• ${label}: ${normalizeFieldErrorMessage(fieldError.message)}`;
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
    const errorKey = messageProperty.startsWith('error.')
      ? messageProperty.substring(6)
      : undefined;

    const keyMap: Record<string, string> = {
      'payload.required': 'Pain assessment payload is required.',
      'patient.required': 'Patient id is required.',
      'encounter.required': 'Encounter id is required.',
      'isActive.required': 'isActive is required.'
    };

    const humanMessage =
      (errorKey && keyMap[errorKey]) ||
      data?.detail ||
      data?.title ||
      data?.message ||
      'Unexpected error';

    dispatch(notify({ msg: humanMessage + traceSuffix, sev: 'warning' }));
  };

  // Actions
  const handleSave = async () => {
    if (!patientId) {
      dispatch(notify({ msg: 'Patient id is required.', sev: 'warning' }));
      return;
    }
    if (!encounterId) {
      dispatch(notify({ msg: 'Encounter id is required.', sev: 'warning' }));
      return;
    }

    if (!record.painDegree) {
      dispatch(
        notify({
          msg: 'Please fix the following fields:\n• Pain Degree: must not be empty',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      const created = await createPainAssessment({
        ...createPayload,
        painLevel: (createPayload as any).painLevel ?? `LEVEL_${minLevel}`
      } as any).unwrap();

      setRecord(prev => ({
        ...prev,
        ...created,
        patientId,
        encounterId,
        id: undefined
      }));

      dispatch(notify({ msg: 'Pain assessment saved successfully', sev: 'success' }));
    } catch (err: any) {
      showApiError(err);
    }
  };

  const handleClear = () => {
    setRecord({
      ...newPainAssessment,
      patientId,
      encounterId
    });
  };

  return (
    <SectionContainer
      title={title}
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          <MyButton onClick={handleSave} disabled={disabled}>
            Save
          </MyButton>
          <MyButton onClick={handleClear} disabled={disabled}>
            Clear
          </MyButton>
        </div>
      }
      content={
        <div className="pain-assessment__wrapper" style={width ? { width } : {}}>
          <Row className="pain-assessment__row">
            <Col md={12}>
              <MyInput
                disabled
                width="100%"
                fieldLabel="Pain Degree"
                fieldType="select"
                fieldName="painDegree"
                selectData={severityEnumResponse ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={setRecord}
                searchable={false}
                required
              />
            </Col>

            {record?.painAssessmentType !== 'FLACC' && (
              <Col md={12}>
                <MyInput
                  disabled={disabled}
                  width="100%"
                  fieldLabel="Pain Pattern"
                  fieldType="select"
                  fieldName="painPattern"
                  selectData={painPatternLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  disableByField='isValid'

                  selectDataValue="key"
                  record={record}
                  setRecord={setRecord}
                  searchable={false}
                />
              </Col>
            )}
          </Row>

          <Row className="pain-assessment__row">
            <Col md={24}>
              <MyInput
                fieldType="select"
                width="100%"
                fieldLabel="Pain Assessment Type"
                selectData={painAssessmentTypes ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={setRecord}
                fieldName="painAssessmentType"
                disabled={disabled}
                required
              />
            </Col>
          </Row>

          {record?.painAssessmentType === 'NUMERIC' ? (
            <Row className="pain-assessment__row">
              <Col md={24}>
                <NumericSlider
                  label="Pain Level"
                  value={painLevelValue}
                  min={minLevel}
                  max={maxLevel}
                  required
                  disabled={disabled}
                  getTrackColor={getTrackColor}
                  onChange={value => {
                    const enumItem = painLevelSteps.find(x => x.n === value);
                    const enumValue = enumItem?.value ?? `LEVEL_${value}`;

                    setRecord(prev => ({
                      ...prev,
                      painLevel: enumValue as any,
                    }));
                  }}
                />
              </Col>
            </Row>
          ) : record?.painAssessmentType === 'FACES' ? (
            <Row className="pain-assessment__row">
              <Col md={24}>
                <FacesSlider
                  title={`Pain Level (${painLevelValue}-${maxLevel})`}
                  value={painLevelValue}
                  disabled={disabled}
                  getTrackColor={getTrackColor}
                  onChange={value => {
                    const enumItem = painLevelSteps.find(x => x.n === value);
                    const enumValue = enumItem?.value ?? `LEVEL_${value}`;

                    setRecord(prev => ({
                      ...prev,
                      painLevel: enumValue as any,
                    }));
                  }}
                />
              </Col>
            </Row>
          ) : record?.painAssessmentType === 'FLACC' ? (
            <Row className="pain-assessment__row">
              <Col md={24}>
                <FlaccComponent />
              </Col>
            </Row>
          ) : null}


          {record?.painAssessmentType !== 'FLACC' && (
            <Row className="pain-assessment__row">
              <Col md={24}>
                <MyInput
                  fieldType="textarea"
                  width="100%"
                  fieldLabel="Pain Description"
                  fieldName="painDescription"
                  record={record}
                  setRecord={setRecord}
                  disabled={disabled}
                />
              </Col>
            </Row>
          )}
        </div>
      }
    />
  );
};

export default PainAssessment;
