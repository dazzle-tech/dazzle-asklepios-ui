import React, { useEffect, useMemo, useRef } from 'react';
import Translate from '@/components/Translate';
import AiValidationResult from '@/components/AiValidationResult/AiValidationResult';
import { useValidateTestsMutation } from '@/services/medicationTestOrdersValidation/MedicationTestOrdersValidation';
import type { TestValidationRequestDTO } from '@/types/model-types-new';

type Props = {
  aiPayload?: { patientId?: number; encounterId?: number; orderNumber?: number } | null;
  onReadyChange?: (ready: boolean) => void;
  onContinueWithoutAi?: () => void;
  onEditOrder?: () => void;
};

const PatientHistorySummary: React.FC<Props> = ({
  aiPayload = null,
  onReadyChange,
  onContinueWithoutAi,
  onEditOrder
}) => {
  const [validateTests, validation] = useValidateTestsMutation();
  const lastCallKeyRef = useRef<string | null>(null);

  const request = useMemo<TestValidationRequestDTO | null>(() => {
    const patientId = Number(aiPayload?.patientId);
    const encounterId = Number(aiPayload?.encounterId);
    // The backend reads the tests from this order; without it the AI gets an empty list
    const orderNumber = Number(aiPayload?.orderNumber) || undefined;
    if (!patientId || !encounterId) return null;
    return { patientId, encounterId, orderNumber };
  }, [aiPayload]);

  const runValidation = () => {
    if (request) validateTests(request as any);
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
      onEdit={onEditOrder}
      editLabel="Edit order"
      loadingLabel="AI is validating the tests"
      noIssuesText="The tests look appropriate for this patient."
      unavailableText="Your order is saved. You can continue."
    />
  );
};

export default PatientHistorySummary;
