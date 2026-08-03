import React from 'react';

import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import type { ColumnConfig } from '@/components/MyTable/MyTable';
import type { PreAuthorizationTrackingResponse } from '@/types/model-types-new';
import { calculateAgeFormat, formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { Tooltip, Whisper } from 'rsuite';

import PreAuthorizationRowActions from './PreAuthorizationRowActions';
import {
  formatMoney,
  getPreAuthItems,
  getStatusColor,
  joinItemField
} from './utils';
import type { PreAuthorizationRowHandlers } from './types';

type GetPreAuthorizationColumnsParams = {
  handlers: PreAuthorizationRowHandlers;
  encounterMap: Map<number, any>;
  patientMap: Map<string, any>;
};

const renderStacked = (lines: string[]) => {
  if (!lines.length) return '-';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.35 }}>
      {lines.map((line, index) => (
        <span key={`${line}-${index}`}>{line}</span>
      ))}
    </div>
  );
};

export const getPreAuthorizationColumns = ({
  handlers,
  encounterMap,
  patientMap
}: GetPreAuthorizationColumnsParams): ColumnConfig[] => [
  {
    key: 'preAuthRefNo',
    title: <Translate>Pre-Auth Ref No</Translate>,
    flexGrow: 3,
    render: (row: PreAuthorizationTrackingResponse) => row.preAuthRefNo || '-'
  },
  {
    key: 'approvalRequestId',
    title: <Translate>Approval Request ID</Translate>,
    flexGrow: 3,
    render: (row: PreAuthorizationTrackingResponse) => row.approvalRequestId || '-'
  },
  {
    key: 'approvalResponseId',
    title: <Translate>Approval Response ID</Translate>,
    flexGrow: 3,
    render: (row: PreAuthorizationTrackingResponse) => row.approvalResponseId || '-'
  },
  {
    key: 'patientId',
    title: <Translate>Patient</Translate>,
    flexGrow: 4,
    fullText: true,
    render: (row: PreAuthorizationTrackingResponse) => {
      const patient = patientMap.get(String(row.patientId));

      const firstName = String(patient?.firstName ?? '').trim();
      const secondName = String(patient?.secondName ?? '').trim();
      const thirdName = String(patient?.thirdName ?? '').trim();
      const lastName = String(patient?.lastName ?? '').trim();

      const fullName =
        [firstName, secondName, thirdName, lastName].filter(Boolean).join(' ') || '-';
      const mrn = patient?.medicalRecordNumber ?? '-';
      const dob = patient?.dateOfBirth ?? null;
      const age = dob ? calculateAgeFormat(dob) : '-';
      const gender = formatEnumString(patient?.sexAtBirth) || patient?.sexAtBirth || '-';
      const mobile = patient?.primaryMobileNumber ?? '-';

      const speaker = (
        <Tooltip>
          <div>MRN: {mrn}</div>
          <div>Age: {age}</div>
          <div>Gender: {gender}</div>
          <div>DOB: {dob ? dob : '-'}</div>
          <div>Mobile: {mobile}</div>
        </Tooltip>
      );

      return (
        <Whisper trigger="hover" placement="top" speaker={speaker}>
          <div style={{ cursor: 'pointer' }}>
            {mrn !== '-' ? `${fullName} - ${mrn}` : fullName}
          </div>
        </Whisper>
      );
    }
  },
  {
    key: 'encounterId',
    title: <Translate>Visit Number</Translate>,
    flexGrow: 2,
    render: (row: PreAuthorizationTrackingResponse) => {
      const encounter = encounterMap.get(row.encounterId);
      return encounter?.encounterNumber || row.encounterId || '-';
    }
  },
  {
    key: 'visitDate',
    title: <Translate>Visit Date</Translate>,
    flexGrow: 3,
    render: (row: PreAuthorizationTrackingResponse) => {
      const encounter = encounterMap.get(row.encounterId);
      return formatDateWithoutSeconds(encounter?.createdDate) || '-';
    }
  },
  {
    key: 'itemCode',
    title: <Translate>Item Code</Translate>,
    flexGrow: 3,
    fullText: true,
    render: (row: PreAuthorizationTrackingResponse) =>
      renderStacked(
        getPreAuthItems(row)
          .map(item => String(item.itemCode ?? '').trim())
          .filter(Boolean)
      )
  },
  {
    key: 'itemName',
    title: <Translate>Item Name</Translate>,
    flexGrow: 4,
    fullText: true,
    render: (row: PreAuthorizationTrackingResponse) =>
      renderStacked(
        getPreAuthItems(row)
          .map(item => String(item.itemDescription ?? item.nonStandardDesc ?? '').trim())
          .filter(Boolean)
      )
  },
  {
    key: 'itemType',
    title: <Translate>Item Type</Translate>,
    flexGrow: 2,
    render: (row: PreAuthorizationTrackingResponse) =>
      joinItemField(row, item => item.itemType)
  },
  {
    key: 'itemDecision',
    title: <Translate>Item Decision</Translate>,
    flexGrow: 3,
    render: (row: PreAuthorizationTrackingResponse) =>
      renderStacked(
        getPreAuthItems(row).map(item => {
          const decision = String(item.itemDecision ?? '').trim();
          const code = String(item.itemCode ?? '').trim();
          if (!decision && !code) return '';
          return decision || '-';
        }).filter(Boolean)
      )
  },
  {
    key: 'itemQuantity',
    title: <Translate>Qty</Translate>,
    flexGrow: 2,
    render: (row: PreAuthorizationTrackingResponse) =>
      renderStacked(
        getPreAuthItems(row).map(item => {
          const qty = item.quantity != null ? String(item.quantity) : '';
          const unit = String(item.quantityCode ?? '').trim();
          return [qty, unit].filter(Boolean).join(' ') || '';
        }).filter(Boolean)
      )
  },
  {
    key: 'itemNet',
    title: <Translate>Item Net</Translate>,
    flexGrow: 2,
    render: (row: PreAuthorizationTrackingResponse) =>
      renderStacked(getPreAuthItems(row).map(item => formatMoney(item.net)).filter(v => v !== '-'))
  },
  {
    key: 'waseelItemId',
    title: <Translate>Waseel Item ID</Translate>,
    flexGrow: 3,
    render: (row: PreAuthorizationTrackingResponse) =>
      joinItemField(row, item => item.waseelItemId)
  },
  {
    key: 'patientInsuranceId',
    title: <Translate>Insurance ID</Translate>,
    flexGrow: 2,
    render: (row: PreAuthorizationTrackingResponse) => row.patientInsuranceId || '-'
  },
  {
    key: 'eligibilityResponseId',
    title: <Translate>Eligibility Response ID</Translate>,
    flexGrow: 3,
    render: (row: PreAuthorizationTrackingResponse) => row.eligibilityResponseId || '-'
  },
  {
    key: 'dateOrdered',
    title: <Translate>Date Ordered</Translate>,
    flexGrow: 3,
    render: (row: PreAuthorizationTrackingResponse) => row.dateOrdered || '-'
  },
  {
    key: 'preauthType',
    title: <Translate>Type</Translate>,
    flexGrow: 2,
    render: (row: PreAuthorizationTrackingResponse) => row.preauthType || '-'
  },
  {
    key: 'preauthSubType',
    title: <Translate>Sub Type</Translate>,
    flexGrow: 2,
    render: (row: PreAuthorizationTrackingResponse) => row.preauthSubType || '-'
  },
  {
    key: 'totalNet',
    title: <Translate>Total Net</Translate>,
    flexGrow: 2,
    render: (row: PreAuthorizationTrackingResponse) => formatMoney(row.totalNet)
  },
  {
    key: 'status',
    title: <Translate>Status</Translate>,
    flexGrow: 3,
    render: (row: PreAuthorizationTrackingResponse) => (
      <MyBadgeStatus contant={row.status || '-'} color={getStatusColor(row.status)} />
    )
  },
  {
    key: 'outcome',
    title: <Translate>Outcome</Translate>,
    flexGrow: 3,
    render: (row: PreAuthorizationTrackingResponse) => row.outcome || '-'
  },
  {
    key: 'message',
    title: <Translate>Message</Translate>,
    flexGrow: 4,
    expandable: true,
    render: (row: PreAuthorizationTrackingResponse) => row.message || row.disposition || '-'
  },
  {
    key: 'itemDetails',
    title: <Translate>Item Details</Translate>,
    expandable: true,
    render: (row: PreAuthorizationTrackingResponse) => {
      const items = getPreAuthItems(row);
      if (!items.length) return '-';

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, index) => (
            <div
              key={item.id ?? `${item.sequence ?? index}-${item.itemCode ?? index}`}
              style={{
                borderBottom: index < items.length - 1 ? '1px solid #e5e7eb' : 'none',
                paddingBottom: index < items.length - 1 ? 8 : 0
              }}
            >
              <div>
                <strong>#{item.sequence ?? index + 1}</strong>{' '}
                {item.itemCode || '-'} — {item.itemDescription || item.nonStandardDesc || '-'}
              </div>
              <div>
                Type: {item.itemType || '-'} | Decision: {item.itemDecision || '-'} | Qty:{' '}
                {item.quantity ?? '-'} {item.quantityCode || ''}
              </div>
              <div>
                Unit: {formatMoney(item.unitPrice)} | Net: {formatMoney(item.net)} | Patient:{' '}
                {formatMoney(item.patientShare)} | Payer: {formatMoney(item.payerShare)}
              </div>
              <div>
                Waseel Item ID: {item.waseelItemId ?? '-'}
                {item.reasonCodes ? ` | Reason: ${item.reasonCodes}` : ''}
              </div>
            </div>
          ))}
        </div>
      );
    }
  },
  {
    key: 'isCancelled',
    title: <Translate>Cancelled</Translate>,
    flexGrow: 2,
    render: (row: PreAuthorizationTrackingResponse) =>
      row.isCancelled ? (
        <MyBadgeStatus contant="Yes" color="#dc3545" />
      ) : (
        <MyBadgeStatus contant="No" color="#28a745" />
      )
  },
  {
    key: 'cancelStatus',
    title: <Translate>Cancel Status</Translate>,
    flexGrow: 3,
    render: (row: PreAuthorizationTrackingResponse) => row.cancelStatus || '-'
  },
  {
    key: 'createdDate',
    title: <Translate>Created Date</Translate>,
    flexGrow: 3,
    render: (row: PreAuthorizationTrackingResponse) =>
      formatDateWithoutSeconds(row.createdDate) || '-'
  },
  {
    key: 'action',
    dataKey: '',
    title: <Translate>ACTION</Translate>,
    width: 220,
    align: 'center',
    render: (row: PreAuthorizationTrackingResponse) => (
      <PreAuthorizationRowActions row={row} {...handlers} />
    )
  }
];
