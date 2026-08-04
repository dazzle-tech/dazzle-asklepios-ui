import React, { useMemo } from 'react';
import { Table } from 'rsuite';

import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import type { ClaimTrackingResponse } from '@/types/model-types-new';
import { formatDateWithoutSeconds } from '@/utils';

import { formatMoney, getClaimItems, getStatusColor } from './utils';
import ClaimErrorsPanel from './ClaimErrorsPanel';

type ClaimPreviewProps = {
  claim: ClaimTrackingResponse;
  patient?: any;
  encounter?: any;
  onClose: () => void;
};

type FieldProps = {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
  mono?: boolean;
  msg?: boolean;
};

const Field: React.FC<FieldProps> = ({ label, value, wide, mono, msg }) => (
  <div className={`bc-field${wide ? ' bc-field--wide' : ''}`}>
    <span className="bc-field__label">{label}</span>
    <span
      className={`bc-field__value${mono ? ' bc-field__value--mono' : ''}${
        msg ? ' bc-field__value--msg' : ''
      }`}
    >
      {value ?? '-'}
    </span>
  </div>
);

type BlockProps = {
  title: string;
  children: React.ReactNode;
};

const Block: React.FC<BlockProps> = ({ title, children }) => (
  <section className="bc-block">
    <h3 className="bc-block__title">{title}</h3>
    <div className="bc-fields">{children}</div>
  </section>
);

const ClaimPreview: React.FC<ClaimPreviewProps> = ({ claim, patient, encounter, onClose }) => {
  const patientName = useMemo(() => {
    if (!patient) return '-';
    const parts = [
      patient?.firstName,
      patient?.secondName,
      patient?.thirdName,
      patient?.lastName
    ]
      .map((p: string) => String(p ?? '').trim())
      .filter(Boolean);
    return parts.join(' ') || '-';
  }, [patient]);

  const items = useMemo(() => getClaimItems(claim), [claim]);
  const encounterNo = encounter?.encounterNumber ?? claim.encounterId ?? '-';
  const title = claim.claimReference || claim.provClaimNo || `Claim #${claim.id}`;

  return (
    <aside className="bc-drawer" role="complementary" aria-label="Claim preview">
      <div className="bc-drawer__head">
        <div>
          <div className="bc-drawer__eyebrow">Insurance Claim</div>
          <div className="bc-drawer__title">{title}</div>
          <div className="bc-drawer__status-inline">
            <MyBadgeStatus contant={String(claim.status ?? '-')} color={getStatusColor(claim.status)} />
          </div>
        </div>
        <button type="button" className="bc-drawer__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <ClaimErrorsPanel
        errors={claim.validationErrors}
        status={claim.status}
        outcome={claim.outcome}
        statusDescription={claim.statusDescription ?? claim.message}
        compact
      />

      <div className="bc-drawer__body">
        <Block title="Claim Information">
          <Field label="Claim Reference" value={claim.claimReference} mono />
          <Field label="Provider Claim No" value={claim.provClaimNo} mono />
          <Field label="Total Net" value={formatMoney(claim.totalNet)} />
          <Field label="Upload Name" value={claim.uploadName} />
          <Field label="Upload ID" value={claim.uploadId} mono />
          <Field label="Invoice Document ID" value={claim.financialDocumentId} mono />
        </Block>

        <Block title="Patient & Encounter">
          <Field label="Patient" value={patientName} />
          <Field label="MRN" value={patient?.medicalRecordNumber} mono />
          <Field label="Encounter" value={encounterNo} />
        </Block>

        <Block title="Authorization Link">
          <Field label="Pre-Auth ID" value={claim.preAuthorizationId} mono />
          <Field label="Pre-Auth Ref No" value={claim.preAuthRefNo} mono />
          <Field label="Approval Response ID" value={claim.approvalResponseId} mono />
        </Block>

        <Block title="Submission Details">
          <Field label="Outcome" value={claim.outcome} />
          <Field
            label="Submitted At"
            value={claim.submittedAt ? formatDateWithoutSeconds(claim.submittedAt) : '-'}
          />
          <Field
            label="Created"
            value={claim.createdDate ? formatDateWithoutSeconds(claim.createdDate) : '-'}
          />
          <Field label="Message" value={claim.message} wide msg />
        </Block>

        <section className="bc-block">
          <h3 className="bc-block__title">Claim Items</h3>
          {items.length === 0 ? (
            <div className="bc-empty">No claim items available.</div>
          ) : (
            <div className="bc-items-table">
              <Table data={items} autoHeight rowHeight={42} headerHeight={36}>
                <Table.Column width={50} align="center">
                  <Table.HeaderCell>Seq</Table.HeaderCell>
                  <Table.Cell dataKey="sequence" />
                </Table.Column>
                <Table.Column width={90}>
                  <Table.HeaderCell>Type</Table.HeaderCell>
                  <Table.Cell dataKey="itemType" />
                </Table.Column>
                <Table.Column width={100}>
                  <Table.HeaderCell>Code</Table.HeaderCell>
                  <Table.Cell dataKey="itemCode" />
                </Table.Column>
                <Table.Column flexGrow={1} minWidth={100}>
                  <Table.HeaderCell>Description</Table.HeaderCell>
                  <Table.Cell dataKey="itemDescription" />
                </Table.Column>
                <Table.Column width={80} align="right">
                  <Table.HeaderCell>Net</Table.HeaderCell>
                  <Table.Cell>{(row: any) => formatMoney(row.net)}</Table.Cell>
                </Table.Column>
                <Table.Column width={90} align="right">
                  <Table.HeaderCell>Payer</Table.HeaderCell>
                  <Table.Cell>{(row: any) => formatMoney(row.payerShare)}</Table.Cell>
                </Table.Column>
              </Table>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
};

export default ClaimPreview;
