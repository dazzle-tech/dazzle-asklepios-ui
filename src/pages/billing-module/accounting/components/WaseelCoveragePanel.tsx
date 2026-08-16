import React from 'react';

import WaseelCoverageDetailsView from '@/components/waseel/WaseelCoverageDetailsView';
import type { WaseelCoverageDetails } from '@/types/model-types-new';

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

  return (
    <WaseelCoverageDetailsView
      variant="billing"
      waseelCoverage={waseelCoverage}
      loading={loading}
      hasError={hasError}
      currency={currency}
      showEmptyMessage={!selectedInsuranceId}
      emptyMessage="Select insurance in Prepare & calculate to view Waseel eligibility benefits here."
      errorMessage="Run eligibility from the patient profile, or switch to self pay in Prepare & calculate."
    />
  );
};

export default WaseelCoveragePanel;
