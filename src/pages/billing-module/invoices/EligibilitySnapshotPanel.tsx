import React from 'react';
import { Loader, Tag, Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSnowflake } from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import type { BillingEligibilitySnapshot } from '@/services/billing/invoiceGenerationService';

type EligibilitySnapshotPanelProps = {
  coverageType?: string;
  snapshot?: BillingEligibilitySnapshot | null;
  loading?: boolean;
  freezing?: boolean;
  onFreeze?: () => void;
  canFreeze?: boolean;
  currency?: string;
};

const formatMoney = (value?: number, currency = 'SAR') =>
  `${Number(value ?? 0).toFixed(2)} ${currency}`;

const EligibilitySnapshotPanel: React.FC<EligibilitySnapshotPanelProps> = ({
  coverageType,
  snapshot,
  loading = false,
  freezing = false,
  onFreeze,
  canFreeze = false,
  currency = 'SAR'
}) => {
  if (coverageType === 'SELF_PAY') {
    return (
      <div className="billing-invoices__snapshot billing-invoices__snapshot--muted">
        Self pay visit — Waseel eligibility snapshot is not required.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="billing-invoices__snapshot">
        <Loader size="sm" content="Loading eligibility snapshot..." />
      </div>
    );
  }

  return (
    <div className="billing-invoices__snapshot">
      <div className="billing-invoices__snapshot-header">
        <div>
          <Text weight="bold">Eligibility Snapshot</Text>
          <Text muted size="sm">
            Frozen coverage used for billing and invoicing. Values stay unchanged even if
            live eligibility changes later.
          </Text>
        </div>

        {snapshot?.frozen ? (
          <Tag color="green">Frozen</Tag>
        ) : (
          <Tag color="orange">Not frozen</Tag>
        )}
      </div>

      {snapshot?.frozen ? (
        <div className="billing-invoices__snapshot-grid">
          <div>
            <Text muted>Eligibility #</Text>
            <Text>{snapshot.eligibilityResponseId}</Text>
          </div>
          <div>
            <Text muted>Member ID</Text>
            <Text>{snapshot.memberId ?? '-'}</Text>
          </div>
          <div>
            <Text muted>Policy #</Text>
            <Text>{snapshot.policyNumber ?? '-'}</Text>
          </div>
          <div>
            <Text muted>Policy holder</Text>
            <Text>{snapshot.policyHolder ?? '-'}</Text>
          </div>
          <div>
            <Text muted>Network</Text>
            <Text>{snapshot.network ?? '-'}</Text>
          </div>
          <div>
            <Text muted>Coverage status</Text>
            <Text>{snapshot.coverageStatus ?? '-'}</Text>
          </div>
          <div>
            <Text muted>Copay %</Text>
            <Text>{snapshot.copaymentPercent ?? 0}%</Text>
          </div>
          <div>
            <Text muted>Copay cap</Text>
            <Text>{formatMoney(snapshot.copaymentCap, currency)}</Text>
          </div>
          <div>
            <Text muted>Frozen at</Text>
            <Text>
              {snapshot.frozenAt
                ? String(snapshot.frozenAt).substring(0, 19).replace('T', ' ')
                : '-'}
            </Text>
          </div>
          <div>
            <Text muted>Frozen by</Text>
            <Text>{snapshot.frozenBy ?? '-'}</Text>
          </div>
        </div>
      ) : (
        <div className="billing-invoices__snapshot-empty">
          <Text muted>
            No frozen eligibility yet. Freeze the latest successful Waseel response before
            financial close and invoicing.
          </Text>
          {canFreeze && onFreeze && (
            <MyButton
              appearance="primary"
              loading={freezing}
              onClick={onFreeze}
              style={{ marginTop: 12 }}
            >
              <FontAwesomeIcon icon={faSnowflake} /> Freeze Eligibility
            </MyButton>
          )}
        </div>
      )}
    </div>
  );
};

export default EligibilitySnapshotPanel;
