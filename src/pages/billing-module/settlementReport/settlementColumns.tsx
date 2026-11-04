import React from 'react';
import { Tooltip, Whisper } from 'rsuite';

import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import type { ColumnConfig } from '@/components/MyTable/MyTable';
import type { ClaimSettlementRowResponse } from '@/types/model-types-new';
import { calculateAgeFormat, formatDateWithoutSeconds, formatEnumString } from '@/utils';

import {
  formatMoney,
  formatSettlementStatus,
  getSettlementStatusColor
} from './utils';

const textOrDash = (value?: string | number | null) => {
  if (value == null) return '-';
  const text = String(value).trim();
  return text ? text : '-';
};

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
    key: 'patientName',
    title: <Translate>Patient Name</Translate>,
    width: 220,
    fullText: true,
    render: (row: ClaimSettlementRowResponse) => {
      const name = textOrDash(row.patientName);
      const mrn = textOrDash(row.medicalRecordNumber);
      return (
        <div className="sr-patient">
          <span>{name}</span>
          {mrn !== '-' && <small>{mrn}</small>}
        </div>
      );
    }
  },
  {
    key: 'patientInfo',
    title: <Translate>Patient Info</Translate>,
    width: 200,
    render: (row: ClaimSettlementRowResponse) => {
      const mrn = textOrDash(row.medicalRecordNumber);
      const gender = row.sexAtBirth
        ? formatEnumString(String(row.sexAtBirth)) || String(row.sexAtBirth)
        : '-';
      const age = row.dateOfBirth ? calculateAgeFormat(row.dateOfBirth) : '-';
      const speaker = (
        <Tooltip>
          <div>MRN: {mrn}</div>
          <div>Age: {age}</div>
          <div>Gender: {gender}</div>
          <div>Patient ID: {row.patientId ?? '-'}</div>
        </Tooltip>
      );

      return (
        <Whisper trigger="hover" placement="top" speaker={speaker}>
          <div className="sr-patient-info">
            <span>MRN {mrn}</span>
            <small>
              {gender} · {age}
            </small>
          </div>
        </Whisper>
      );
    }
  },
  {
    key: 'invoiceNumber',
    title: <Translate>Invoice No.</Translate>,
    width: 150,
    render: (row: ClaimSettlementRowResponse) => textOrDash(row.invoiceNumber)
  },
  {
    key: 'visitNumber',
    title: <Translate>Visit No.</Translate>,
    width: 140,
    render: (row: ClaimSettlementRowResponse) => textOrDash(row.visitNumber)
  },
  {
    key: 'visitType',
    title: <Translate>Visit Type</Translate>,
    width: 140,
    render: (row: ClaimSettlementRowResponse) =>
      row.visitType ? formatEnumString(String(row.visitType)) || row.visitType : '-'
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
