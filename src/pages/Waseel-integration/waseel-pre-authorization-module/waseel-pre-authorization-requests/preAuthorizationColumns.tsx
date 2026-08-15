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
    <div className="preauth-table__stacked">
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
    key: 'action',
    dataKey: '',
    title: <Translate>Action</Translate>,
    width: 230,
    align: 'center',
    render: (row: PreAuthorizationTrackingResponse) => (
      <PreAuthorizationRowActions row={row} {...handlers} />
    )
  },
  {
    key: 'status',
    title: <Translate>Status</Translate>,
    width: 130,
    render: (row: PreAuthorizationTrackingResponse) => (
      <MyBadgeStatus contant={row.status || '-'} color={getStatusColor(row.status)} />
    )
  },
  {
    key: 'patientId',
    title: <Translate>Patient</Translate>,
    width: 220,
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
          <div className="preauth-table__patient-cell">
            {mrn !== '-' ? `${fullName} - ${mrn}` : fullName}
          </div>
        </Whisper>
      );
    }
  },
  {
    key: 'encounterId',
    title: <Translate>Visit</Translate>,
    width: 110,
    render: (row: PreAuthorizationTrackingResponse) => {
      const encounter = encounterMap.get(row.encounterId);
      return encounter?.encounterNumber || row.encounterId || '-';
    }
  },
  {
    key: 'visitDate',
    title: <Translate>Visit Date</Translate>,
    width: 140,
    render: (row: PreAuthorizationTrackingResponse) => {
      const encounter = encounterMap.get(row.encounterId);
      return formatDateWithoutSeconds(encounter?.createdDate) || '-';
    }
  },
  {
    key: 'itemCode',
    title: <Translate>Item Code</Translate>,
    width: 130,
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
    width: 200,
    render: (row: PreAuthorizationTrackingResponse) =>
      renderStacked(
        getPreAuthItems(row)
          .map(item => String(item.itemDescription ?? item.nonStandardDesc ?? '').trim())
          .filter(Boolean)
      )
  },
  {
    key: 'itemType',
    title: <Translate>Type</Translate>,
    width: 100,
    render: (row: PreAuthorizationTrackingResponse) =>
      joinItemField(row, item => item.itemType)
  },
  {
    key: 'itemDecision',
    title: <Translate>Decision</Translate>,
    width: 120,
    render: (row: PreAuthorizationTrackingResponse) =>
      renderStacked(
        getPreAuthItems(row).map(item => {
          const decision = String(item.itemDecision ?? '').trim();
          if (!decision) return '';
          return decision;
        }).filter(Boolean)
      )
  },
  {
    key: 'itemQuantity',
    title: <Translate>Qty</Translate>,
    width: 80,
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
    width: 100,
    render: (row: PreAuthorizationTrackingResponse) =>
      renderStacked(getPreAuthItems(row).map(item => formatMoney(item.net)).filter(v => v !== '-'))
  },
  {
    key: 'totalNet',
    title: <Translate>Total Net</Translate>,
    width: 100,
    render: (row: PreAuthorizationTrackingResponse) => formatMoney(row.totalNet)
  },
  {
    key: 'outcome',
    title: <Translate>Outcome</Translate>,
    width: 130,
    render: (row: PreAuthorizationTrackingResponse) => row.outcome || '-'
  },
  {
    key: 'preauthType',
    title: <Translate>Pre-Auth Type</Translate>,
    width: 110,
    render: (row: PreAuthorizationTrackingResponse) => row.preauthType || '-'
  },
  {
    key: 'dateOrdered',
    title: <Translate>Date Ordered</Translate>,
    width: 140,
    render: (row: PreAuthorizationTrackingResponse) => row.dateOrdered || '-'
  },
  {
    key: 'approvalRequestId',
    title: <Translate>Request ID</Translate>,
    width: 130,
    render: (row: PreAuthorizationTrackingResponse) => row.approvalRequestId || '-'
  },
  {
    key: 'approvalResponseId',
    title: <Translate>Response ID</Translate>,
    width: 130,
    render: (row: PreAuthorizationTrackingResponse) => row.approvalResponseId || '-'
  },
  {
    key: 'message',
    title: <Translate>Message</Translate>,
    width: 180,
    expandable: true,
    render: (row: PreAuthorizationTrackingResponse) => row.message || row.disposition || '-'
  },
  {
    key: 'isCancelled',
    title: <Translate>Cancelled</Translate>,
    width: 100,
    render: (row: PreAuthorizationTrackingResponse) =>
      row.isCancelled ? (
        <MyBadgeStatus contant="Yes" color="#dc3545" />
      ) : (
        <MyBadgeStatus contant="No" color="#28a745" />
      )
  },
  {
    key: 'createdDate',
    title: <Translate>Created</Translate>,
    width: 140,
    render: (row: PreAuthorizationTrackingResponse) =>
      formatDateWithoutSeconds(row.createdDate) || '-'
  }
];
