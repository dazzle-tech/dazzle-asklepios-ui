import React from 'react';

import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import type { ColumnConfig } from '@/components/MyTable/MyTable';
import type { ClaimSettlementRowResponse } from '@/types/model-types-new';
import { formatDateWithoutSeconds } from '@/utils';

import {
  formatMoney,
  formatSettlementStatus,
  getSettlementStatusColor
} from './utils';

export const getSettlementColumns = (): ColumnConfig[] => [
  {
    key: 'settlementNo',
    title: <Translate>Settlement No.</Translate>,
    width: 140,
    render: (row: ClaimSettlementRowResponse) => row.settlementNo || '-'
  },
  {
    key: 'settlementDate',
    title: <Translate>Settlement Date</Translate>,
    width: 160,
    render: (row: ClaimSettlementRowResponse) =>
      row.settlementDate ? formatDateWithoutSeconds(row.settlementDate) : '-'
  },
  {
    key: 'insuranceCompany',
    title: <Translate>Insurance Company</Translate>,
    width: 200,
    render: (row: ClaimSettlementRowResponse) => row.insuranceCompany || '-'
  },
  {
    key: 'tpa',
    title: <Translate>TPA</Translate>,
    width: 180,
    render: (row: ClaimSettlementRowResponse) => row.tpa || '-'
  },
  {
    key: 'claimNo',
    title: <Translate>Claim No.</Translate>,
    width: 160,
    render: (row: ClaimSettlementRowResponse) => row.claimNo || '-'
  },
  {
    key: 'claimDate',
    title: <Translate>Claim Date</Translate>,
    width: 160,
    render: (row: ClaimSettlementRowResponse) =>
      row.claimDate ? formatDateWithoutSeconds(row.claimDate) : '-'
  },
  {
    key: 'billedAmount',
    title: <Translate>Billed Amount</Translate>,
    width: 140,
    align: 'right',
    render: (row: ClaimSettlementRowResponse) => formatMoney(row.billedAmount)
  },
  {
    key: 'approvedAmount',
    title: <Translate>Approved Amount</Translate>,
    width: 150,
    align: 'right',
    render: (row: ClaimSettlementRowResponse) => formatMoney(row.approvedAmount)
  },
  {
    key: 'rejectedAmount',
    title: <Translate>Rejected Amount</Translate>,
    width: 150,
    align: 'right',
    render: (row: ClaimSettlementRowResponse) => formatMoney(row.rejectedAmount)
  },
  {
    key: 'patientShare',
    title: <Translate>Patient share</Translate>,
    width: 140,
    align: 'right',
    render: (row: ClaimSettlementRowResponse) => formatMoney(row.patientShare)
  },
  {
    key: 'insuranceAmount',
    title: <Translate>Insurance Amount</Translate>,
    width: 160,
    align: 'right',
    render: (row: ClaimSettlementRowResponse) => formatMoney(row.insuranceAmount)
  },
  {
    key: 'paidAmount',
    title: <Translate>Paid Amount</Translate>,
    width: 140,
    align: 'right',
    render: (row: ClaimSettlementRowResponse) => formatMoney(row.paidAmount)
  },
  {
    key: 'outstandingAmount',
    title: <Translate>Outstanding Amount</Translate>,
    width: 170,
    align: 'right',
    render: (row: ClaimSettlementRowResponse) => formatMoney(row.outstandingAmount)
  },
  {
    key: 'settlementStatus',
    title: <Translate>Settlement Status</Translate>,
    width: 160,
    render: (row: ClaimSettlementRowResponse) => (
      <MyBadgeStatus
        backgroundColor={getSettlementStatusColor(row.settlementStatus)}
        contant={formatSettlementStatus(row.settlementStatus)}
      />
    )
  }
];
