import React from 'react';
import { Loader, Tag, Text } from 'rsuite';

import type { WaseelCoverageDetails } from '@/types/model-types-new';
import { formatBillingTimestamp, formatBillingEnum, formatMoney } from '../utils/billingAccountingUtils';

type WaseelCoveragePanelProps = {
  coverageType: 'SELF_PAY' | 'INSURANCE';
  selectedInsuranceId: number | null;
  waseelCoverage?: WaseelCoverageDetails | null;
  loading?: boolean;
  hasError?: boolean;
  currency?: string;
};

const WaseelCoveragePanel: React.FC<WaseelCoveragePanelProps> = ({
  coverageType,
  selectedInsuranceId,
  waseelCoverage,
  loading = false,
  hasError = false,
  currency = 'SAR'
}) => {
  if (coverageType === 'SELF_PAY') {
    return (
      <div className="billing-accounting__empty" style={{ padding: '16px 0' }}>
        Self pay selected in Prepare & calculate. No Waseel eligibility is required.
      </div>
    );
  }

  if (!selectedInsuranceId) {
    return (
      <div className="billing-accounting__empty" style={{ padding: '16px 0' }}>
        Select insurance in Prepare & calculate to view Waseel eligibility benefits here.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="billing-accounting__empty">
        <Loader size="sm" content="Loading Waseel eligibility..." />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="billing-accounting__alert billing-accounting__alert--warning">
        <div>
          <Text weight="semibold">No Waseel eligibility found</Text>
          <Text muted size="sm">
            Run eligibility from the patient profile, or switch to self pay in Prepare & calculate.
          </Text>
        </div>
      </div>
    );
  }

  if (!waseelCoverage) {
    return null;
  }

  return (
    <>
      <div className="billing-accounting__waseel-metrics">
        <div className="billing-accounting__metric">
          <div className="billing-accounting__metric-label">Copay %</div>
          <div className="billing-accounting__metric-value">
            {waseelCoverage.copaymentPercent ?? 0}%
          </div>
        </div>
        <div className="billing-accounting__metric">
          <div className="billing-accounting__metric-label">Copay cap</div>
          <div className="billing-accounting__metric-value">
            {formatMoney(waseelCoverage.copaymentCap ?? 0, currency)}
          </div>
        </div>
        <div className="billing-accounting__metric">
          <div className="billing-accounting__metric-label">Network</div>
          <div className="billing-accounting__metric-value">{waseelCoverage.network ?? '-'}</div>
        </div>
        <div className="billing-accounting__metric">
          <div className="billing-accounting__metric-label">Status</div>
          <div className="billing-accounting__metric-value">
            <Tag color="green" size="sm">
              {formatBillingEnum(
                waseelCoverage.inforce ?? waseelCoverage.coverageStatus ?? 'Unknown'
              )}
            </Tag>
          </div>
        </div>
      </div>

      <Text muted size="sm">
        Eligibility checked {formatBillingTimestamp(waseelCoverage.eligibilityCheckedAt)}
      </Text>

      {(waseelCoverage.benefits ?? []).length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text weight="semibold" style={{ marginBottom: 8 }}>
            Benefits
          </Text>
          <div style={{ display: 'grid', gap: 8 }}>
            {(waseelCoverage.benefits ?? []).slice(0, 6).map((benefit, index) => (
              <div key={`${benefit.itemCode ?? index}`} className="billing-accounting__metric">
                <div className="billing-accounting__metric-label">
                  {benefit.itemName ?? benefit.categoryKey ?? 'Benefit'}
                </div>
                <div className="billing-accounting__metric-value">
                  {benefit.value ?? '-'} {benefit.unit ?? ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default WaseelCoveragePanel;
