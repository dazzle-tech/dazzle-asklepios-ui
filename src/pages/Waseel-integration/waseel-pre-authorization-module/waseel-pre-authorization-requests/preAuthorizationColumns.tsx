import React from 'react';

import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import type { ColumnConfig } from '@/components/MyTable/MyTable';
import type { PreAuthorizationTrackingResponse } from '@/types/model-types-new';

import PreAuthorizationRowActions from './PreAuthorizationRowActions';
import { getStatusColor } from './utils';
import type { PreAuthorizationRowHandlers } from './types';

export const getPreAuthorizationColumns = (
  handlers: PreAuthorizationRowHandlers
): ColumnConfig[] => [
  {
    key: 'id',
    title: <Translate>Pre-Auth ID</Translate>,
    flexGrow: 2
  },
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
    title: <Translate>Patient ID</Translate>,
    flexGrow: 2
  },
  {
    key: 'encounterId',
    title: <Translate>Encounter ID</Translate>,
    flexGrow: 2
  },
  {
    key: 'patientInsuranceId',
    title: <Translate>Insurance ID</Translate>,
    flexGrow: 2
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
    render: (row: PreAuthorizationTrackingResponse) =>
      row.totalNet != null ? Number(row.totalNet).toLocaleString() : '-'
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
    render: (row: PreAuthorizationTrackingResponse) => row.createdDate || '-'
  },
  {
    key: 'action',
    dataKey: '',
    title: <Translate>ACTION</Translate>,
    width: 190,
    align: 'center',
    render: (row: PreAuthorizationTrackingResponse) => (
      <PreAuthorizationRowActions row={row} {...handlers} />
    )
  }
];
