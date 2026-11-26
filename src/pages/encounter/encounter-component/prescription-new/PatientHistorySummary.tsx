import React, { useEffect, useMemo, useRef } from 'react';
import Translate from '@/components/Translate';
import AiValidationResult from '@/components/AiValidationResult/AiValidationResult';
import type { MedicationValidationRequestDTO } from '@/types/model-types-new';
import { useValidateMedicationMutation } from '@/services/medicationTestOrdersValidation/MedicationTestOrdersValidation';

type Props = {
  aiPayload?: any;
  onReadyChange?: (ready: boolean) => void;
  onContinueWithoutAi?: () => void;
  onEditPrescription?: () => void;
};

const PatientHistorySummary: React.FC<Props> = ({
  aiPayload = null,
  onReadyChange,
  onContinueWithoutAi,
  onEditPrescription
}) => {
  const [validateMedication, validation] = useValidateMedicationMutation();
  const lastCallKeyRef = useRef<string | null>(null);

  const request = useMemo<MedicationValidationRequestDTO | null>(() => {
    const patientId = Number(
      aiPayload?.patientId ?? aiPayload?.patient?.id ?? aiPayload?.patient?.key
    );
    const encounterId = Number(
      aiPayload?.encounterId ?? aiPayload?.encounter?.id ?? aiPayload?.encounter?.key
    );
    // The backend reads the medications from this prescription; without it the AI gets an empty list
    const prescriptionId = Number(aiPayload?.prescriptionId) || undefined;
    if (!patientId || !encounterId) return null;
    return { patientId, encounterId, prescriptionId };
  }, [aiPayload]);

  const runValidation = () => {
    if (request) validateMedication(request as any);
  };

  useEffect(() => {
    if (!request) return;
    const callKey = JSON.stringify(request);
    if (lastCallKeyRef.current === callKey) return;
    lastCallKeyRef.current = callKey;
    runValidation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  if (!request) {
    return (
      <div className="mv-state">
        <Translate>Validation payload not ready.</Translate>
      </div>
    );
  }

  return (
    <AiValidationResult
      validation={validation}
      onRetry={runValidation}
      onReadyChange={onReadyChange}
      onContinueWithoutAi={onContinueWithoutAi}
      onEdit={onEditPrescription}
      editLabel="Edit prescription"
      loadingLabel="AI is validating the medications"
      noIssuesText="The medications look appropriate for this patient."
      unavailableText="Your prescription is saved as a draft. You can continue."
    />
  );
};

export default PatientHistorySummary;
