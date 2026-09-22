import React from 'react';
import { Loader, Message } from 'rsuite';
import Translate from '@/components/Translate';
import { formatEnumString } from '@/utils';
import { useResolveCoverageContractQuery } from '@/services/setup/coverageManagement/coverageManagementService';
import type { PatientInsurance } from '@/types/model-types-new';

type Props = {
  insurance?: PatientInsurance | null;
  encounterType?: string | null;
  isWaseelEnabled?: boolean | null;
  payerNphiesId?: string | null;
};

const CoverageContractTermsSummary = ({
  insurance,
  encounterType,
  isWaseelEnabled,
  payerNphiesId
}: Props) => {
  const resolvedPayerNphiesId =
    (insurance?.payerNphiesId ? String(insurance.payerNphiesId) : '') ||
    (payerNphiesId ? String(payerNphiesId) : '');

  const canResolve = Boolean(
    insurance?.id && insurance.policyNumber && resolvedPayerNphiesId
  );

  const { data, isFetching, isError } = useResolveCoverageContractQuery(
    {
      payerNphiesId: resolvedPayerNphiesId || undefined,
      tpaName: insurance?.tpaName || undefined,
      policyNumber: insurance?.policyNumber ? String(insurance.policyNumber) : undefined,
      className: insurance?.policyClassName || undefined,
      encounterType: encounterType || undefined
    },
    { skip: !canResolve }
  );

  if (!canResolve) {
    return null;
  }

  const isWaseel = isWaseelEnabled !== false;
  const copayment = data?.copayment;
  const copaymentLabel = copayment
    ? copayment.valueType === 'FIXED' || String(copayment.valueType).toUpperCase() === 'FIXED'
      ? `${copayment.valueAmount}`
      : `${copayment.valueAmount}%`
    : null;

  return (
    <div className="coverage-contract-summary">
      <p className="payment-info__subsection-title">
        <Translate>Contract Terms</Translate>
      </p>
      {isFetching ? (
        <Loader content="Matching coverage contract..." />
      ) : isError ? (
        <Message type="warning" showIcon>
          Unable to match a coverage contract right now. Existing patient-share calculation is unchanged.
        </Message>
      ) : data?.matched ? (
        <Message type={isWaseel ? 'info' : 'success'} showIcon>
          <div className="coverage-contract-summary__body">
            <div>
              Contract {data.contract?.code || '-'} · Policy {data.contract?.policyNumber || insurance?.policyNumber} ·
              Class {data.contract?.className || insurance?.policyClassName || '-'}
            </div>
            {isWaseel ? (
              <div>
                Wasel eligibility still drives claim share and co-payment. Contract terms stay in effect for
                exclusions, limits, and pre-approval.
              </div>
            ) : copaymentLabel ? (
              <div>
                Patient share from Contract Terms: {copaymentLabel}
                {copayment?.encounterType
                  ? ` (${formatEnumString(copayment.encounterType)})`
                  : ''}
                . Wasel eligibility is not required for this payer.
              </div>
            ) : (
              <div>
                Coverage contract matched, but no co-payment rule was found for this encounter type. Existing
                insurance defaults will be used if available.
              </div>
            )}
          </div>
        </Message>
      ) : (
        <Message type="warning" showIcon>
          {data?.matchReason ||
            'No coverage contract matches this insurance policy. Patient share uses insurance defaults if configured.'}
        </Message>
      )}
    </div>
  );
};

export default CoverageContractTermsSummary;
