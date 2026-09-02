import React from 'react';
import { Tooltip, Whisper } from 'rsuite';

import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import type { ColumnConfig } from '@/components/MyTable/MyTable';
import type { ClaimTrackingResponse } from '@/types/model-types-new';
import { calculateAgeFormat, formatDateWithoutSeconds, formatEnumString } from '@/utils';

import ClaimRowActions from './ClaimRowActions';
import { formatMoney, getClaimItems, getStatusColor } from './utils';
import type { ClaimRowHandlers } from './types';

type GetClaimColumnsParams = {
  handlers: ClaimRowHandlers;
  encounterMap: Map<number, any>;
  patientMap: Map<string, any>;
};

export const getClaimColumns = ({
  handlers,
  encounterMap,
  patientMap
}: GetClaimColumnsParams): ColumnConfig[] => [
  {
    key: 'claimReference',
    title: <Translate>Claim Reference</Translate>,
    flexGrow: 3,
    fullText: true,
    render: (row: ClaimTrackingResponse) => (
      <span className="bc-cell-ref">{row.claimReference || row.provClaimNo || '-'}</span>
    )
  },
  {
    key: 'uploadName',
    title: <Translate>Upload Name</Translate>,
    flexGrow: 3,
    fullText: true,
    render: (row: ClaimTrackingResponse) => row.uploadName || '-'
  },
  {
    key: 'uploadId',
    title: <Translate>Upload ID</Translate>,
    flexGrow: 2,
    render: (row: ClaimTrackingResponse) => row.uploadId ?? '-'
  },
  {
    key: 'patientId',
    title: <Translate>Patient</Translate>,
    flexGrow: 4,
    fullText: true,
    render: (row: ClaimTrackingResponse) => {
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
          <div className="bc-cell-patient">
            {mrn !== '-' ? `${fullName} — ${mrn}` : fullName}
          </div>
        </Whisper>
      );
    }
  },
  {
    key: 'encounterId',
    title: <Translate>Encounter</Translate>,
    flexGrow: 2,
    render: (row: ClaimTrackingResponse) => {
      const encounter = encounterMap.get(Number(row.encounterId));
      return <span>{encounter?.encounterNumber || row.encounterId || '-'}</span>;
    }
  },
  {
    key: 'preAuthRefNo',
    title: <Translate>Pre-Auth Ref</Translate>,
    flexGrow: 3,
    fullText: true,
    render: (row: ClaimTrackingResponse) => row.preAuthRefNo || row.approvalResponseId || '-'
  },
  {
    key: 'claimType',
    title: <Translate>Type</Translate>,
    flexGrow: 2,
    render: (row: ClaimTrackingResponse) => formatEnumString(row.claimType) || '-'
  },
  {
    key: 'claimSubType',
    title: <Translate>Sub Type</Translate>,
    flexGrow: 2,
    render: (row: ClaimTrackingResponse) => formatEnumString(row.claimSubType) || '-'
  },
  {
    key: 'items',
    title: <Translate>Items</Translate>,
    flexGrow: 2,
    render: (row: ClaimTrackingResponse) => getClaimItems(row).length || 0
  },
  {
    key: 'totalNet',
    title: <Translate>Total Net</Translate>,
    flexGrow: 2,
    render: (row: ClaimTrackingResponse) => (
      <span className="bc-cell-money">{formatMoney(row.totalNet)}</span>
    )
  },
  {
    key: 'status',
    title: <Translate>Status</Translate>,
    flexGrow: 2,
    render: (row: ClaimTrackingResponse) => (
      <MyBadgeStatus
        contant={String(row.status ?? '-')}
        color={getStatusColor(row.status)}
      />
    )
  },
  {
    key: 'submittedAt',
    title: <Translate>Submitted</Translate>,
    flexGrow: 3,
    render: (row: ClaimTrackingResponse) =>
      row.submittedAt ? formatDateWithoutSeconds(row.submittedAt) : '-'
  },
  {
    key: 'actions',
    title: <Translate>Actions</Translate>,
    width: 130,
    render: (row: ClaimTrackingResponse) => (
      <ClaimRowActions row={row} {...handlers} />
    )
  }
];
