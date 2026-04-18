import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import { useUpdateEncounterMutation } from '@/services/encounters/patientEncounterService';
import {
  useCreateVitalSignsMutation,
  useGetLatestVitalSignsByEncounterIdQuery,
  useGetLatestTriageVitalSignsByEncounterIdQuery
} from '@/services/medicalsheetsEncounter/observations/vitalSignsService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newVitalSigns } from '@/types/model-types-constructor-new';
import type { VitalSigns as VitalSignsModelObject } from '@/types/model-types-new';
import { notify } from '@/utils/uiReducerActions';
import { faHeartPulse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';

type VitalSignsProps = {
  patientId: number;
  encounterId: number;
  /**
   * If true:
   * - fetch latest TRIAGE vital signs by encounter
   * - prefill the form with that record (if exists)
   * - force isTriage to be true on save
   */
  isTriage?: boolean;
  encounter?: any;
  disabled?: boolean;
  width?: string;
  title?: React.ReactNode;
};

const VitalSigns: React.FC<VitalSignsProps> = ({
  patientId,
  encounterId,
  isTriage = false,
  encounter,
  disabled = false,
  width = '100%',
  title = 'Vital Signs'
}) => {
  const dispatch = useAppDispatch();

  // === LOVs ===
  const { data: bloodPressureMeasurementSiteLov } =
    useGetLovValuesByCodeQuery('BP_MEASURMENT_SITE');

  // === API ===
  const [createVitalSigns] = useCreateVitalSignsMutation();
  const [updateEncounter] = useUpdateEncounterMutation();

  // Non-triage latest
  const { data: latestVitalSignsByEncounterId } = useGetLatestVitalSignsByEncounterIdQuery(
    { encounterId },
    { skip: !encounterId || isTriage }
  );

  // Triage latest
  const { data: latestTriageVitalSignsByEncounterId } = useGetLatestTriageVitalSignsByEncounterIdQuery(
    { encounterId },
    { skip: !encounterId || !isTriage }
  );

  // === Local state ===
  const [meanArterialPressureValue, setMeanArterialPressureValue] = useState<string | null>(null);

  const [vitalSigns, setVitalSigns] = useState<VitalSignsModelObject>({
    ...newVitalSigns,
    patientId,
    encounterId,
    isTriage
  });


  useEffect(() => {
    const source = isTriage ? latestTriageVitalSignsByEncounterId : latestVitalSignsByEncounterId;
    if (!source) return;

    setVitalSigns(previousVitalSigns => ({
      ...previousVitalSigns,
      ...source,
      id: undefined,
      patientId,
      encounterId,
      isTriage,
      isActive:
        typeof (source as any)?.isActive === 'boolean'
          ? (source as any).isActive
          : true
    }));
  }, [
    isTriage,
    latestVitalSignsByEncounterId,
    latestTriageVitalSignsByEncounterId,
    patientId,
    encounterId
  ]);


  useEffect(() => {
    const diastolicValue = Number(vitalSigns?.bloodPressureDiastolic);
    const systolicValue = Number(vitalSigns?.bloodPressureSystolic);

    if (!isNaN(diastolicValue) && !isNaN(systolicValue)) {
      const calculatedMeanArterialPressure = ((2 * diastolicValue + systolicValue) / 3).toFixed(2);
      setMeanArterialPressureValue(calculatedMeanArterialPressure);
      return;
    }

    setMeanArterialPressureValue(null);
  }, [vitalSigns?.bloodPressureSystolic, vitalSigns?.bloodPressureDiastolic]);

  const vitalSignsCreatePayload = useMemo(() => {
    return {
      patientId,
      encounterId,
      bloodPressureSystolic: vitalSigns.bloodPressureSystolic ?? null,
      bloodPressureDiastolic: vitalSigns.bloodPressureDiastolic ?? null,
      measurementSite: vitalSigns.measurementSite ?? null,
      heartRate: vitalSigns.heartRate ?? null,
      temperature: vitalSigns.temperature ?? null,
      oxygenSaturation: vitalSigns.oxygenSaturation ?? null,
      respiratoryRate: vitalSigns.respiratoryRate ?? null,
      isTriage,
      isActive: typeof vitalSigns.isActive === 'boolean' ? vitalSigns.isActive : true,
      notes: vitalSigns.notes ?? null
    };
  }, [vitalSigns, patientId, encounterId, isTriage]);


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
        bloodPressureSystolic: 'Blood Pressure Systolic',
        bloodPressureDiastolic: 'Blood Pressure Diastolic',
        measurementSite: 'Measurement Site',
        heartRate: 'Heart Rate',
        temperature: 'Temperature',
        oxygenSaturation: 'Oxygen Saturation',
        respiratoryRate: 'Respiratory Rate',
        isTriage: 'Triage',
        isActive: 'Active',
        notes: 'Notes',
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
    const errorKey = messageProperty.startsWith('error.') ? messageProperty.substring(6) : undefined;

    const keyMap: Record<string, string> = {
      'payload.required': 'Vital signs payload is required.',
      'patient.required': 'Patient id is required.',
      'encounter.required': 'Encounter id is required.',
      'patient.notfound': 'Patient not found.',
      'patient.invalid': 'Invalid patient id.',
      'db.constraint': 'Database constraint violated while saving vital signs.'
    };

    const humanMessage =
      (errorKey && keyMap[errorKey]) ||
      data?.detail ||
      data?.title ||
      data?.message ||
      'Unexpected error';

    dispatch(notify({ msg: humanMessage + traceSuffix, sev: 'warning' }));
  };

  const handleSaveVitalSigns = async () => {
    if (!patientId) {
      dispatch(notify({ msg: 'Patient id is required.', sev: 'warning' }));
      return;
    }

    if (!encounterId) {
      dispatch(notify({ msg: 'Encounter id is required.', sev: 'warning' }));
      return;
    }

    try {
      const createResponse = await createVitalSigns(vitalSignsCreatePayload as any).unwrap();

      setVitalSigns(previousVitalSigns => ({
        ...previousVitalSigns,
        ...createResponse,
        patientId,
        encounterId,
        isTriage,
        id: undefined
      }));

      dispatch(notify({ msg: 'Vital signs saved successfully', sev: 'success' }));
    } catch (error: any) {
      showApiError(error);
    }
  };
console.log("vitalSigns---", vitalSigns);
  const handleClearVitalSigns = () => {
    setVitalSigns({
      ...newVitalSigns,
      patientId,
      encounterId,
      isTriage
    });
    setMeanArterialPressureValue(null);
  };

  return (
    <SectionContainer
      title={title}
      action={
        <Form fluid layout="inline">
          <MyButton onClick={handleSaveVitalSigns} disabled={disabled}>
            Save
          </MyButton>
          <MyButton onClick={handleClearVitalSigns} disabled={disabled}>
            Clear
          </MyButton>
        </Form>
      }
      content={
        <div style={width ? { width } : {}}>
          <Form fluid>
            <div className="vital-signs-handle-position-row">
              <MyInput
                width="100%"
                fieldType="number"
                fieldName="bloodPressureSystolic"
                record={vitalSigns}
                setRecord={setVitalSigns}
                disabled={disabled}
                required
              />

              <div className="gap-betwen-blood-pressures">/</div>

              <MyInput
                width="100%"
                fieldType="number"
                fieldName="bloodPressureDiastolic"
                record={vitalSigns}
                setRecord={setVitalSigns}
                disabled={disabled}
                required
              />

              <div className="container-Column">
                <MyLabel label="MAP" />
                <div>
                  <FontAwesomeIcon icon={faHeartPulse} className="my-icon" />
                  <text>{meanArterialPressureValue}</text>
                </div>
              </div>
            </div>

            <div className="margin-bot-10">
              <MyInput
                required={isTriage}
                width={isTriage ?"42%" : "100%"} 
                fieldType="select"
                fieldLabel="Measurment Site"
                fieldName="measurementSite"
                selectData={bloodPressureMeasurementSiteLov?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={vitalSigns}
                setRecord={setVitalSigns}
                disabled={disabled}
                searchable={false}
              />
            </div>

            <div className="vital-signs-handle-position-row">
              <MyInput
                required={isTriage}
                width="100%"
                fieldType="number"
                fieldName="heartRate"
                rightAddon="bpm"
                rightAddonwidth={45}
                record={vitalSigns}
                setRecord={setVitalSigns}
                disabled={disabled}
              />

              <MyInput
                required
                width="100%"
                fieldType="number"
                rightAddon="C"
                fieldName="temperature"
                record={vitalSigns}
                setRecord={setVitalSigns}
                disabled={disabled}
                allowDecimal
              />
            </div>

            <div className="vital-signs-handle-position-row">
              <MyInput
                required={isTriage}
                width="100%"
                fieldType="number"
                rightAddon=" % "
                fieldName="oxygenSaturation"
                record={vitalSigns}
                setRecord={setVitalSigns}
                disabled={disabled}
                allowDecimal
              />

              <MyInput
                required={isTriage}
                width="100%"
                fieldType="number"
                rightAddon="bpm"
                rightAddonwidth={45}
                fieldName="respiratoryRate"
                fieldLabel="R.R"
                record={vitalSigns}
                setRecord={setVitalSigns}
                disabled={disabled}
              />
            </div>

            <MyInput
              fieldLabel="Note"
              width="100%"
              fieldName="notes"
              fieldType="textarea"
              record={vitalSigns}
              setRecord={setVitalSigns}
              disabled={disabled}
            />
          </Form>
        </div>
      }
    />
  );
};

export default VitalSigns;
