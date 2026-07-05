import React from 'react';

import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import type { ColumnConfig } from '@/components/MyTable/MyTable';
import type { PreAuthorizationTrackingResponse } from '@/types/model-types-new';
import { calculateAgeFormat, formatDateWithoutSeconds,formatDate, formatEnumString } from '@/utils';
import { Tooltip, Whisper } from 'rsuite';

import PreAuthorizationRowActions from './PreAuthorizationRowActions';
import { getStatusColor } from './utils';
import type { PreAuthorizationRowHandlers } from './types';

type GetPreAuthorizationColumnsParams = {
  handlers: PreAuthorizationRowHandlers;
  encounterMap: Map<number, any>;
  patientMap: Map<string, any>;
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
      const mobile = patient?.primaryMobileNumber ??  '-';

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
    render: (row: PreAuthorizationTrackingResponse) =>
      formatDateWithoutSeconds(row.createdDate) || '-'
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