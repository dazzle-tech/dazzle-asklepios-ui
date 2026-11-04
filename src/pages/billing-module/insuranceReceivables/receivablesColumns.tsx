import React from 'react';

import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import type { ColumnConfig } from '@/components/MyTable/MyTable';
import type { InsurancePayerReceivablesSummaryResponse } from '@/types/model-types-new';

import {
  formatMoney,
  formatOverallStatus,
  getOverallStatusColor
} from './utils';

export const getReceivablesColumns = (): ColumnConfig[] => [
  {
    key: 'payerName',
    title: <Translate>Insurance Payer</Translate>,
    flexGrow: 4,
    fullText: true,
    render: (row: InsurancePayerReceivablesSummaryResponse) =>
      row.payerName || (row.payerId != null ? `Payer #${row.payerId}` : '-')
  },
  {
    key: 'currency',
    title: <Translate>Currency</Translate>,
    flexGrow: 1,
    render: (row: InsurancePayerReceivablesSummaryResponse) => row.currency || '-'
  },
  {
    key: 'totalBilled',
    title: <Translate>Total Billed</Translate>,
    flexGrow: 2,
    render: (row: InsurancePayerReceivablesSummaryResponse) =>
      formatMoney(row.totalBilled, row.currency)
  },
  {
    key: 'totalReceived',
    title: <Translate>Total Received</Translate>,
    flexGrow: 2,
    render: (row: InsurancePayerReceivablesSummaryResponse) =>
      formatMoney(row.totalReceived, row.currency)
  },
  {
    key: 'outstandingBalance',
    title: <Translate>Outstanding</Translate>,
    flexGrow: 2,
    render: (row: InsurancePayerReceivablesSummaryResponse) =>
      formatMoney(row.outstandingBalance, row.currency)
  },
  {
    key: 'pendingClaims',
    title: <Translate>Pending Claims</Translate>,
    flexGrow: 1,
    render: (row: InsurancePayerReceivablesSummaryResponse) => row.pendingClaims ?? 0
  },
  {
    key: 'paidClaims',
    title: <Translate>Paid Claims</Translate>,
    flexGrow: 1,
    render: (row: InsurancePayerReceivablesSummaryResponse) => row.paidClaims ?? 0
  },
  {
    key: 'partiallyPaidClaims',
    title: <Translate>Partially Paid</Translate>,
    flexGrow: 1,
    render: (row: InsurancePayerReceivablesSummaryResponse) =>
      row.partiallyPaidClaims ?? 0
  },
  {
    key: 'rejectedClaims',
    title: <Translate>Rejected Claims</Translate>,
    flexGrow: 1,
    render: (row: InsurancePayerReceivablesSummaryResponse) => row.rejectedClaims ?? 0
  },
  {
    key: 'overallStatus',
    title: <Translate>Status</Translate>,
    flexGrow: 2,
    render: (row: InsurancePayerReceivablesSummaryResponse) => (
      <MyBadgeStatus
        backgroundColor={getOverallStatusColor(row.overallStatus)}
        contant={formatOverallStatus(row.overallStatus)}
      />
    )
  }
];
