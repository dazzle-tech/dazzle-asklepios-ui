import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import {
  useCreateBodyMeasurementsMutation,
  useGetLatestBodyMeasurementsByEncounterIdQuery
} from '@/services/medicalsheetsEncounter/observations/bodyMeasurementsService';
import type { BodyMeasurements as BodyMeasurementsModelObject } from '@/types/model-types-new';
import { newBodyMeasurements } from '@/types/model-types-constructor-new';
import { notify } from '@/utils/uiReducerActions';
import { faChildReaching, faPerson } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { useUpdateEncounterMutation } from '@/services/encounters/patientEncounterService';

type BodyMeasurementsProps = {
  patientId: number;
  encounterId: number;
  encounter?: any;
  disabled?: boolean;
  width?: string;
  title?: React.ReactNode;
};

const BodyMeasurements: React.FC<BodyMeasurementsProps> = ({
  patientId,
  encounterId,
  encounter,
  disabled = false,
  width = '100%',
  title = 'Body Measurements'
}) => {
  const dispatch = useAppDispatch();

  // === API ===
  const [createBodyMeasurements] = useCreateBodyMeasurementsMutation();
    const [updateEncounter] = useUpdateEncounterMutation();

  const { data: latestBodyMeasurementsByEncounterId } = useGetLatestBodyMeasurementsByEncounterIdQuery(
    { encounterId },
    { skip: !encounterId }
  );

  // === Local state ===
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurementsModelObject>({
    ...newBodyMeasurements,
    patientId,
    encounterId
  });

  const [bodyMassIndex, setBodyMassIndex] = useState<string>('');
  const [bodySurfaceArea, setBodySurfaceArea] = useState<string>('');

  useEffect(() => {
    if (!latestBodyMeasurementsByEncounterId) return;

    setBodyMeasurements(previousBodyMeasurements => ({
      ...previousBodyMeasurements,
      ...latestBodyMeasurementsByEncounterId,
      id: undefined,
      patientId,
      encounterId,
      isActive:
        typeof (latestBodyMeasurementsByEncounterId as any)?.isActive === 'boolean'
          ? (latestBodyMeasurementsByEncounterId as any).isActive
          : true
    }));
  }, [latestBodyMeasurementsByEncounterId, patientId, encounterId]);

  /**
   * Compute BMI & BSA based on weight/height.
   */
  useEffect(() => {
    const weightValue = Number(bodyMeasurements?.weight);
    const heightValue = Number(bodyMeasurements?.height);

    const hasValidWeight = !isNaN(weightValue) && weightValue > 0;
    const hasValidHeight = !isNaN(heightValue) && heightValue > 0;

    if (hasValidWeight && hasValidHeight) {
      const calculatedBodyMassIndex = (weightValue / (heightValue / 100) ** 2).toFixed(2);
      const calculatedBodySurfaceArea = Math.sqrt((weightValue * heightValue) / 3600).toFixed(2);
      setBodyMassIndex(calculatedBodyMassIndex);
      setBodySurfaceArea(calculatedBodySurfaceArea);
      return;
    }

    setBodyMassIndex('');
    setBodySurfaceArea('');
  }, [bodyMeasurements?.weight, bodyMeasurements?.height]);


  const bodyMeasurementsCreatePayload = useMemo(() => {
    return {
      patientId,
      encounterId,
      weight: bodyMeasurements.weight ?? null,
      height: bodyMeasurements.height ?? null,
      headCircumference: bodyMeasurements.headCircumference ?? null,
      isActive: typeof bodyMeasurements.isActive === 'boolean' ? bodyMeasurements.isActive : true
    };
  }, [bodyMeasurements, patientId, encounterId]);

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
        weight: 'Weight',
        height: 'Height',
        headCircumference: 'Head circumference',
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
    const errorKey = messageProperty.startsWith('error.') ? messageProperty.substring(6) : undefined;

    const keyMap: Record<string, string> = {
      'payload.required': 'Body measurements payload is required.',
      'patient.required': 'Patient id is required.',
      'encounter.required': 'Encounter id is required.',
      'patient.notfound': 'Patient not found.',
      'patient.invalid': 'Invalid patient id.',
      'db.constraint': 'Database constraint violated while saving body measurements.'
    };

    const humanMessage =
      (errorKey && keyMap[errorKey]) ||
      data?.detail ||
      data?.title ||
      data?.message ||
      'Unexpected error';

    dispatch(notify({ msg: humanMessage + traceSuffix, sev: 'warning' }));
  };

  const handleSaveBodyMeasurements = async () => {
    if (!patientId) {
      dispatch(notify({ msg: 'Patient id is required.', sev: 'warning' }));
      return;
    }

    if (!encounterId) {
      dispatch(notify({ msg: 'Encounter id is required.', sev: 'warning' }));
      return;
    }

    try {
      const createResponse = await createBodyMeasurements(bodyMeasurementsCreatePayload as any).unwrap();

      setBodyMeasurements(previousBodyMeasurements => ({
        ...previousBodyMeasurements,
        ...createResponse,
        patientId,
        encounterId,
        id: undefined 
      }));

      dispatch(notify({ msg: 'Body measurements saved successfully', sev: 'success' }));
        if (encounter && !encounter.isObserved) {
        const updated = await updateEncounter({
          id: encounterId,
          body: {
            id: encounter?.id,
            patientId: encounter?.patientId ?? encounter?.patient?.id ?? encounter?.patientObject?.id,
            encounterNumber: encounter?.encounterNumber ?? null,
            facilityId: encounter?.facilityId ?? null,
            departmentId: encounter?.departmentId ?? null,
            practitionerId: encounter?.practitionerId ?? null,
            encounterType: encounter?.encounterType ?? null,
            encounterReason: encounter?.encounterReason ?? null,
            followUpEncounterId: encounter?.followUpEncounterId ?? null,
            priorityLevel: encounter?.priorityLevel ?? null,
            originType: encounter?.originType ?? null,
            originName: encounter?.originName ?? null,
            notes: encounter?.notes ?? null,
            departmentDailySequenceNumber: encounter?.departmentDailySequenceNumber ?? null,
            encounterDate: encounter?.encounterDate ?? null,
            status: encounter?.status ?? null,
            chiefComplaint: encounter?.chiefComplaint ?? null,
            hasPrescription: encounter?.hasPrescription ?? false,
            hasOrder: encounter?.hasOrder ?? false,
            isObserved: true
          }
        }).unwrap();

        console.log('Encounter updated to observed:', updated);
      }
    } catch (error: any) {
      showApiError(error);
    }
  };

  const handleClearBodyMeasurements = () => {
    setBodyMeasurements({
      ...newBodyMeasurements,
      patientId,
      encounterId
    });
    setBodyMassIndex('');
    setBodySurfaceArea('');
  };

  return (
    <SectionContainer
      title={title}
      action={
        <Form fluid layout="inline">
          <MyButton onClick={handleSaveBodyMeasurements} disabled={disabled}>
            Save
          </MyButton>
          <MyButton onClick={handleClearBodyMeasurements} disabled={disabled}>
            Clear
          </MyButton>
        </Form>
      }
      content={
        <div style={width ? { width } : {}}>
          <Form fluid>
            <div className="rows-gap" style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <MyInput
                  width="100%"
                  fieldLabel="Weight"
                  fieldName="weight"
                  rightAddon="Kg"
                  fieldType="number"
                  record={bodyMeasurements}
                  setRecord={setBodyMeasurements}
                  disabled={disabled}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <div className="container-Column">
                  <MyLabel label="Body Mass Index" />
                  <div>
                    <FontAwesomeIcon icon={faPerson} className="my-icon" />
                    <text>{bodyMassIndex}</text>
                  </div>
                </div>
              </div>
            </div>
            <div className="rows-gap" style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <MyInput
                  width="100%"
                  fieldLabel="Height"
                  fieldName="height"
                  rightAddon="Cm"
                  fieldType="number"
                  record={bodyMeasurements}
                  setRecord={setBodyMeasurements}
                  disabled={disabled}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <div className="container-Column">
                  <MyLabel label="Body Surface Area" />
                  <div>
                    <FontAwesomeIcon icon={faChildReaching} className="my-icon" />
                    <text>{bodySurfaceArea}</text>
                  </div>
                </div>
              </div>
            </div>

            <div className="rows-gap" style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <MyInput
                  width="100%"
                  fieldLabel="Head circumference"
                  fieldName="headCircumference"
                  rightAddon="Cm"
                  rightAddonwidth={40}
                  fieldType="number"
                  record={bodyMeasurements}
                  setRecord={setBodyMeasurements}
                  disabled={disabled}
                />
              </div>

              <div style={{ flex: 1 }} />
            </div>
          </Form>
        </div>
      }
    />
  );
};

export default BodyMeasurements;
