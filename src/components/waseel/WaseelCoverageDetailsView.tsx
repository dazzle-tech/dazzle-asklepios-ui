import React, { useMemo } from 'react';
import { Loader, Message, Tag, Text } from 'rsuite';

import MyTable from '@/components/MyTable';
import type { ColumnConfig } from '@/components/MyTable/MyTable';
import {
  formatBillingEnum,
  formatBillingTimestamp,
  formatMoney
} from '@/pages/billing-module/accounting/utils/billingAccountingUtils';
import type {
  InsuranceBenefitRule,
  WaseelBenefitDetail,
  WaseelCoverageDetails
} from '@/types/model-types-new';
import {
  classifyBenefitTypeLabel,
  formatBenefitRuleLabel,
  formatBenefitValue,
  formatNetworkLabel,
  formatProviderTypeLabel,
  formatRawBenefitValue,
  resolveDisplayedCopaymentCap,
  resolveDisplayedCopaymentPercent,
  selectPreferredBillingBenefitRule,
  sortBenefitRulesForDisplay,
  isSameBenefitRule
} from '@/utils/waseelCoverageDisplay';

type WaseelCoverageDetailsViewProps = {
  waseelCoverage?: WaseelCoverageDetails | null;
  loading?: boolean;
  hasError?: boolean;
  currency?: string;
  variant?: 'payment' | 'billing';
  showEmptyMessage?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
};

const WaseelCoverageDetailsView: React.FC<WaseelCoverageDetailsViewProps> = ({
  waseelCoverage,
  loading = false,
  hasError = false,
  currency = 'SAR',
  variant = 'payment',
  showEmptyMessage = false,
  emptyMessage = 'Select a patient insurance to load Waseel coverage.',
  errorMessage =
    'No successful Waseel eligibility found. Please run eligibility check from the patient profile first.'
}) => {
  const metricsClassName =
    variant === 'payment'
      ? 'payment-info__waseel-metrics'
      : 'billing-accounting__waseel-metrics';

  const metricCardClassName =
    variant === 'payment'
      ? 'payment-info__metric-card'
      : 'billing-accounting__metric';

  const metricLabelClassName =
    variant === 'payment'
      ? 'payment-info__metric-label'
      : 'billing-accounting__metric-label';

  const metricValueClassName =
    variant === 'payment'
      ? undefined
      : 'billing-accounting__metric-value';

  const tableWrapperClassName =
    variant === 'payment'
      ? 'payment-info__table-wrapper payment-info__table-wrapper--compact'
      : undefined;

  const preferredRule = useMemo(
    () => selectPreferredBillingBenefitRule(waseelCoverage?.benefitRules),
    [waseelCoverage?.benefitRules]
  );

  const displayedCopayPercent = useMemo(
    () =>
      waseelCoverage
        ? resolveDisplayedCopaymentPercent(waseelCoverage)
        : null,
    [waseelCoverage]
  );

  const displayedCopayCap = useMemo(
    () =>
      waseelCoverage ? resolveDisplayedCopaymentCap(waseelCoverage) : null,
    [waseelCoverage]
  );

  const benefitRuleRows = useMemo(
    () =>
      sortBenefitRulesForDisplay(
        (waseelCoverage?.benefitRules ?? []).filter(
          rule => rule.benefitCategory !== '__GLOBAL__'
        ),
        preferredRule
      ),
    [preferredRule, waseelCoverage?.benefitRules]
  );

  const benefitRuleColumns = useMemo<ColumnConfig[]>(
    () => [
      {
        key: 'itemName',
        title: 'Service / Rule',
        dataKey: 'itemName',
        width: 220,
        render: (row: InsuranceBenefitRule) => (
          <div>
            <div>{formatBenefitRuleLabel(row)}</div>
            {isSameBenefitRule(row, preferredRule) ? (
              <Tag size="sm" color="blue" style={{ marginTop: 4 }}>
                Used for billing
              </Tag>
            ) : null}
          </div>
        )
      },
      {
        key: 'networkType',
        title: 'Network',
        dataKey: 'networkType',
        width: 120,
        render: (row: InsuranceBenefitRule) =>
          formatNetworkLabel(
            row.networkType,
            row.itemName,
            waseelCoverage?.network
          )
      },
      {
        key: 'providerType',
        title: 'Provider',
        dataKey: 'providerType',
        width: 130,
        render: (row: InsuranceBenefitRule) =>
          formatProviderTypeLabel(row.providerType)
      },
      {
        key: 'patientCopaymentPercentage',
        title: 'Copay %',
        dataKey: 'patientCopaymentPercentage',
        width: 90,
        render: (row: InsuranceBenefitRule) =>
          row.patientCopaymentPercentage != null
            ? `${row.patientCopaymentPercentage}%`
            : '-'
      },
      {
        key: 'patientMaximumCopayment',
        title: 'Copay Max (Patient)',
        dataKey: 'patientMaximumCopayment',
        width: 150,
        render: (row: InsuranceBenefitRule) =>
          formatBenefitValue(
            row.patientMaximumCopayment,
            null,
            row.currency ?? currency
          )
      },
      {
        key: 'maximumBenefit',
        title: 'Max Benefit (Insurance)',
        dataKey: 'maximumBenefit',
        width: 160,
        render: (row: InsuranceBenefitRule) =>
          formatBenefitValue(
            row.maximumBenefit,
            null,
            row.currency ?? currency
          )
      },
      {
        key: 'approvalLimit',
        title: 'Approval Limit',
        dataKey: 'approvalLimit',
        width: 130,
        render: (row: InsuranceBenefitRule) =>
          formatBenefitValue(
            row.approvalLimit,
            null,
            row.currency ?? currency
          )
      }
    ],
    [currency, preferredRule, waseelCoverage?.network]
  );

  const rawBenefitColumns = useMemo<ColumnConfig[]>(
    () => [
      {
        key: 'categoryKey',
        title: 'Category',
        dataKey: 'categoryKey',
        width: 180,
        render: (row: WaseelBenefitDetail) => row.categoryKey ?? '-'
      },
      {
        key: 'itemName',
        title: 'Item',
        dataKey: 'itemName',
        width: 180,
        render: (row: WaseelBenefitDetail) => row.itemName ?? '-'
      },
      {
        key: 'typeDisplay',
        title: 'Benefit Type',
        dataKey: 'typeDisplay',
        width: 220,
        render: (row: WaseelBenefitDetail) =>
          classifyBenefitTypeLabel(row.typeDisplay, row.typeCode)
      },
      {
        key: 'value',
        title: 'Value',
        dataKey: 'value',
        width: 120,
        render: (row: WaseelBenefitDetail) => formatRawBenefitValue(row)
      }
    ],
    []
  );

  const renderMetric = (
    label: string,
    value: React.ReactNode,
    key?: string
  ) => (
    <div className={metricCardClassName} key={key}>
      <span className={metricLabelClassName}>{label}</span>
      {metricValueClassName ? (
        <div className={metricValueClassName}>{value}</div>
      ) : (
        <strong>{value}</strong>
      )}
    </div>
  );

  if (showEmptyMessage) {
    return (
      <Message showIcon type="info">
        {emptyMessage}
      </Message>
    );
  }

  if (loading) {
    return variant === 'billing' ? (
      <div className="billing-accounting__empty">
        <Loader size="sm" content="Loading Waseel eligibility..." />
      </div>
    ) : (
      <Message showIcon type="info">
        Loading Waseel eligibility benefits...
      </Message>
    );
  }

  if (hasError) {
    return variant === 'billing' ? (
      <div className="billing-accounting__alert billing-accounting__alert--warning">
        <div>
          <Text weight="semibold">No Waseel eligibility found</Text>
          <Text muted size="sm">
            {errorMessage}
          </Text>
        </div>
      </div>
    ) : (
      <Message showIcon type="warning">
        {errorMessage}
      </Message>
    );
  }

  if (!waseelCoverage) {
    return null;
  }

  const coverageStatus =
    waseelCoverage.inforce ?? waseelCoverage.coverageStatus ?? '-';

  return (
    <>
      <div className={metricsClassName}>
        {renderMetric('Member ID', waseelCoverage.memberId ?? '-', 'memberId')}
        {renderMetric(
          'Policy Number',
          waseelCoverage.policyNumber ?? '-',
          'policyNumber'
        )}
        {renderMetric(
          'Policy Holder',
          waseelCoverage.policyHolder ?? '-',
          'policyHolder'
        )}
        {renderMetric(
          'Network',
          waseelCoverage.network ?? '-',
          'network'
        )}
        {renderMetric(
          'Coverage Status',
          variant === 'billing' ? (
            <Tag color="green" size="sm">
              {formatBillingEnum(String(coverageStatus))}
            </Tag>
          ) : (
            coverageStatus
          ),
          'coverageStatus'
        )}
        {renderMetric(
          'Copayment %',
          displayedCopayPercent != null ? `${displayedCopayPercent}%` : '-',
          'copaymentPercent'
        )}
        {renderMetric(
          'Copayment Max / Service',
          formatMoney(displayedCopayCap ?? 0, currency),
          'copaymentCap'
        )}
        {preferredRule?.maximumBenefit != null
          ? renderMetric(
              'Max Benefit (Insurance)',
              formatBenefitValue(
                preferredRule.maximumBenefit,
                null,
                preferredRule.currency ?? currency
              ),
              'maximumBenefit'
            )
          : null}
      </div>

      <div style={{ marginBottom: 12 }}>
        <Text muted size="sm">
          Eligibility checked{' '}
          {formatBillingTimestamp(waseelCoverage.eligibilityCheckedAt)}
          {waseelCoverage.eligibilityResponseId
            ? ` · NPHIES ${waseelCoverage.eligibilityResponseId}`
            : ''}
        </Text>
        {preferredRule ? (
          <Text size="sm" style={{ display: 'block', marginTop: 4 }}>
            Billing uses: {formatBenefitRuleLabel(preferredRule)}
          </Text>
        ) : null}
      </div>

      {benefitRuleRows.length > 0 ? (
        <div className={tableWrapperClassName} style={{ marginBottom: 12 }}>
          <Text weight="semibold" style={{ display: 'block', marginBottom: 8 }}>
            Benefit Rules
          </Text>
          <MyTable
            data={benefitRuleRows}
            columns={benefitRuleColumns}
            loading={loading}
            height={220}
            page={0}
            rowsPerPage={benefitRuleRows.length}
            totalCount={benefitRuleRows.length}
            onPageChange={() => undefined}
            onRowsPerPageChange={() => undefined}
          />
        </div>
      ) : null}

      {(waseelCoverage.benefits ?? []).length > 0 ? (
        <div className={tableWrapperClassName}>
          <Text weight="semibold" style={{ display: 'block', marginBottom: 8 }}>
            Eligibility Response Benefits
          </Text>
          <MyTable
            data={waseelCoverage.benefits ?? []}
            columns={rawBenefitColumns}
            loading={loading}
            height={220}
            page={0}
            rowsPerPage={waseelCoverage.benefits?.length ?? 0}
            totalCount={waseelCoverage.benefits?.length ?? 0}
            onPageChange={() => undefined}
            onRowsPerPageChange={() => undefined}
          />
        </div>
      ) : null}
    </>
  );
};

export default WaseelCoverageDetailsView;
