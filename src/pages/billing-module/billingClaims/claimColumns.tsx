import React from 'react';
import { Checkbox, Tooltip, Whisper } from 'rsuite';

import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import type { ColumnConfig } from '@/components/MyTable/MyTable';
import type { ClaimTrackingResponse } from '@/types/model-types-new';
import { calculateAgeFormat, formatDateWithoutSeconds, formatEnumString } from '@/utils';

import ClaimRowActions from './ClaimRowActions';
import { canReturnClaimForResubmit, formatMoney, getClaimItems, getStatusColor } from './utils';
import type { ClaimRowHandlers } from './types';

type GetClaimColumnsParams = {
  handlers: ClaimRowHandlers;
  encounterMap: Map<number, any>;
  patientMap: Map<string, any>;
  canSelect?: boolean;
  selectedIds?: number[];
  pageReturnableIds?: number[];
  onToggleRow?: (id: number) => void;
  onTogglePage?: () => void;
};

const RETURN_LOCKED_MESSAGE =
  'Only submitting, submitted, or accepted claims can be returned to the batch.';

export const getClaimColumns = ({
  handlers,
  encounterMap,
  patientMap,
  canSelect = false,
  selectedIds = [],
  pageReturnableIds = [],
  onToggleRow,
  onTogglePage
}: GetClaimColumnsParams): ColumnConfig[] => [
  ...(canSelect
    ? [
        {
          key: 'select',
          title: (
            <div className="bc-select-cell" onClick={event => event.stopPropagation()}>
              <Checkbox
                checked={
                  pageReturnableIds.length > 0 &&
                  pageReturnableIds.every(id => selectedIds.includes(id))
                }
                indeterminate={
                  pageReturnableIds.some(id => selectedIds.includes(id)) &&
                  !pageReturnableIds.every(id => selectedIds.includes(id))
                }
                disabled={pageReturnableIds.length === 0}
                onChange={() => onTogglePage?.()}
              />
            </div>
          ),
          width: 52,
          render: (row: ClaimTrackingResponse) => {
            const claimId = row.id;
            if (claimId == null) {
              return null;
            }
            const returnable = canReturnClaimForResubmit(row);
            const checkbox = (
              <div className="bc-select-cell" onClick={event => event.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.includes(claimId)}
                  disabled={!returnable}
                  onChange={() => returnable && onToggleRow?.(claimId)}
                />
              </div>
            );
            if (returnable) {
              return checkbox;
            }
            return (
              <Whisper trigger="hover" placement="top" speaker={<Tooltip>{RETURN_LOCKED_MESSAGE}</Tooltip>}>
                <span>{checkbox}</span>
              </Whisper>
            );
          }
        } as ColumnConfig
      ]
    : []),
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
    width: 96,
    render: (row: ClaimTrackingResponse) => (
      <ClaimRowActions row={row} {...handlers} />
    )
  }
];
