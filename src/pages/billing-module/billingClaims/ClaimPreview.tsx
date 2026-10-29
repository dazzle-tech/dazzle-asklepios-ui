import React, { useMemo } from 'react';
import { Tag } from 'rsuite';

import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyLabel from '@/components/MyLabel/MyLabel';
import MyModal from '@/components/MyModal/MyModal';
import MyTable, { type ColumnConfig } from '@/components/MyTable/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import {
  formatBillingPriceSource,
  formatMoney as formatBillingMoney
} from '@/pages/billing-module/accounting/utils/billingAccountingUtils';
import { useGetEncounterBillingSummaryQuery } from '@/services/billing/billingTransactionService';
import type {
  ClaimTrackingItemResponse,
  ClaimTrackingResponse,
  EncounterBillingItemSummary
} from '@/types/model-types-new';
import { calculateAgeFormat, formatDate, formatDateWithoutSeconds, formatEnumString } from '@/utils';

import ClaimErrorsPanel from './ClaimErrorsPanel';
import { formatMoney, getClaimItems, getStatusColor } from './utils';

type ClaimPreviewProps = {
  claim: ClaimTrackingResponse;
  patient?: any;
  encounter?: any;
  onClose: () => void;
};

type DetailFieldProps = {
  label: string;
  value?: React.ReactNode;
  wide?: boolean;
};

const displayValue = (value: React.ReactNode) => {
  if (value == null || value === '') return '-';
  return value;
};

const DetailField: React.FC<DetailFieldProps> = ({ label, value, wide }) => (
  <div className={`bc-detail-field${wide ? ' bc-detail-field--wide' : ''}`}>
    <MyLabel label={label} size="small" />
    <div className="bc-detail-field__value">{displayValue(value)}</div>
  </div>
);

const DetailGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bc-detail-grid">{children}</div>
);

const formatDob = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatDate(date);
};

const moneyCell = (value: unknown, currency = 'SAR') => (
  <span className="bc-cell-money">{formatBillingMoney(Number(value ?? 0), currency)}</span>
);

type ClaimLineView = {
  sequence: number | null;
  itemType: string | null;
  itemCode: string | null;
  description: string | null;
  priceSource: string | null;
  readPrice: number | null;
  patientShare: number | null;
  payerShare: number | null;
  currency: string;
};

const matchChargeLine = (
  item: ClaimTrackingItemResponse,
  byChargeLineId: Map<number, EncounterBillingItemSummary>,
  byItemCode: Map<string, EncounterBillingItemSummary>
) => {
  if (item.billingChargeLineId != null && byChargeLineId.has(item.billingChargeLineId)) {
    return byChargeLineId.get(item.billingChargeLineId);
  }
  const code = String(item.itemCode ?? '').trim();
  return code ? byItemCode.get(code) : undefined;
};

const enumLabel = (value: unknown) => {
  if (typeof value !== 'string' || !value) return value == null || value === '' ? '-' : String(value);
  return formatEnumString(value) || value;
};

const ClaimPreview: React.FC<ClaimPreviewProps> = ({ claim, patient, encounter, onClose }) => {
  const patientName = useMemo(() => {
    if (!patient) return '-';
    const parts = [patient?.firstName, patient?.secondName, patient?.thirdName, patient?.lastName]
      .map((part: string) => String(part ?? '').trim())
      .filter(Boolean);
    return parts.join(' ') || '-';
  }, [patient]);

  const items = useMemo(() => getClaimItems(claim), [claim]);
  const { data: billingSummary } = useGetEncounterBillingSummaryQuery(
    { encounterId: Number(claim.encounterId) },
    { skip: claim.encounterId == null }
  );
  const lineViews = useMemo<ClaimLineView[]>(() => {
    const chargeLines = billingSummary?.items ?? [];
    const byChargeLineId = new Map(chargeLines.map(line => [line.chargeLineId, line]));
    const byItemCode = new Map(
      chargeLines
        .filter(line => String(line.itemCode ?? '').trim())
        .map(line => [String(line.itemCode).trim(), line])
    );

    return items.map(item => {
      const charge = matchChargeLine(item, byChargeLineId, byItemCode);
      const currency = String(charge?.currency ?? billingSummary?.currency ?? 'SAR');
      return {
        sequence: item.sequence ?? null,
        itemType: item.itemType ?? null,
        itemCode: item.itemCode ?? null,
        description: item.itemDescription ?? charge?.itemName ?? null,
        priceSource: charge?.priceSource ?? null,
        readPrice: charge?.unitPrice ?? item.unitPrice ?? null,
        patientShare: charge?.patientResponsibilityAmount ?? item.patientShare ?? null,
        payerShare: item.payerShare ?? charge?.insuranceResponsibilityAmount ?? null,
        currency
      };
    });
  }, [billingSummary, items]);
  const itemTotals = useMemo(
    () =>
      lineViews.reduce(
        (totals, item) => ({
          patient: totals.patient + (Number(item.patientShare) || 0),
          payer: totals.payer + (Number(item.payerShare) || 0)
        }),
        { patient: 0, payer: 0 }
      ),
    [lineViews]
  );
  const encounterNo = encounter?.encounterNumber || '-';
  const encounterDate =
    encounter?.encounterDate ?? encounter?.startDate ?? encounter?.visitDate ?? null;
  const encounterType = encounter?.encounterType ?? encounter?.visitType ?? null;
  const encounterStatus = encounter?.status ?? encounter?.encounterStatus ?? null;
  const patientDob = patient?.dateOfBirth ?? null;
  const patientAge = patientDob ? calculateAgeFormat(patientDob) : '-';
  const patientGender = formatEnumString(patient?.sexAtBirth ?? '') || patient?.sexAtBirth || '-';
  const title = claim.claimReference || claim.provClaimNo || `Claim #${claim.id}`;

  const itemColumns = useMemo<ColumnConfig[]>(
    () => [
      {
        key: 'sequence',
        title: 'Seq',
        width: 52,
        align: 'center',
        render: (row: ClaimLineView) => row.sequence ?? '-'
      },
      {
        key: 'itemType',
        title: 'Type',
        width: 96,
        render: (row: ClaimLineView) => formatEnumString(row.itemType ?? '') || row.itemType || '-'
      },
      {
        key: 'itemCode',
        title: 'Code',
        width: 150,
        render: (row: ClaimLineView) => <span className="bc-cell-code">{row.itemCode || '-'}</span>
      },
      {
        key: 'description',
        title: 'Description',
        width: 260,
        render: (row: ClaimLineView) => row.description || '-'
      },
      {
        key: 'readPrice',
        title: 'Price read from',
        width: 220,
        render: (row: ClaimLineView) => (
          <span className="bc-read-price">
            <Tag size="sm">{formatBillingPriceSource(row.priceSource)}</Tag>
            <span className="bc-cell-money">
              {row.readPrice == null ? '-' : formatBillingMoney(row.readPrice, row.currency)}
            </span>
          </span>
        )
      },
      {
        key: 'patientShare',
        title: 'Patient share',
        width: 150,
        align: 'right',
        render: (row: ClaimLineView) => moneyCell(row.patientShare, row.currency)
      },
      {
        key: 'payerShare',
        title: 'Payer share',
        width: 150,
        align: 'right',
        render: (row: ClaimLineView) => moneyCell(row.payerShare, row.currency)
      }
    ],
    []
  );

  return (
    <MyModal
      open
      setOpen={nextOpen => {
        if (!nextOpen) onClose();
      }}
      position="center"
      size="92vw"
      bodyheight="78vh"
      hideCancel
      hideActionBtn
      title={
        <span className="bc-preview-title">
          <span>{title}</span>
          <MyBadgeStatus contant={String(claim.status ?? '-')} color={getStatusColor(claim.status)} />
        </span>
      }
      content={
        <div className="bc-preview-body">
          <ClaimErrorsPanel
            errors={claim.validationErrors}
            status={claim.status}
            outcome={claim.outcome}
            statusDescription={claim.statusDescription ?? claim.message}
            compact
          />
        <div className="bc-section bc-section--claim">
          <SectionContainer
            title="Claim Information"
            content={
              <DetailGrid>
                <DetailField label="Claim Reference" value={claim.claimReference} />
                <DetailField label="Provider Claim No" value={claim.provClaimNo} />
                <DetailField label="Total Net" value={formatMoney(claim.totalNet)} />
                <DetailField label="Upload Name" value={claim.uploadName} />
                <DetailField
                  label="Type"
                  value={formatEnumString(claim.claimType ?? '') || claim.claimType}
                />
                <DetailField
                  label="Sub Type"
                  value={formatEnumString(claim.claimSubType ?? '') || claim.claimSubType}
                />
              </DetailGrid>
            }
          />
        </div>

        <div className="bc-section bc-section--patient">
          <SectionContainer
            title="Patient & Encounter"
            content={
              <DetailGrid>
                <DetailField label="Patient" value={patientName} />
                <DetailField label="MRN" value={patient?.medicalRecordNumber} />
                <DetailField label="Date of Birth" value={formatDob(patientDob)} />
                <DetailField label="Age" value={patientAge} />
                <DetailField label="Gender" value={patientGender} />
                <DetailField label="Encounter" value={encounterNo} />
                <DetailField
                  label="Encounter Date"
                  value={encounterDate ? formatDateWithoutSeconds(encounterDate) : '-'}
                />
                <DetailField label="Encounter Type" value={enumLabel(encounterType)} />
                <DetailField label="Encounter Status" value={enumLabel(encounterStatus)} />
              </DetailGrid>
            }
          />
        </div>

        <div className="bc-section bc-section--auth">
          <SectionContainer
            title="Authorization Link"
            content={
              <DetailGrid>
                <DetailField label="Pre-Auth Ref No" value={claim.preAuthRefNo} />
              </DetailGrid>
            }
          />
        </div>

        <div className="bc-section bc-section--submission">
          <SectionContainer
            title="Submission Details"
            content={
              <DetailGrid>
                <DetailField label="Outcome" value={claim.outcome} />
                <DetailField
                  label="Submitted At"
                  value={claim.submittedAt ? formatDateWithoutSeconds(claim.submittedAt) : '-'}
                />
                <DetailField
                  label="Created"
                  value={claim.createdDate ? formatDateWithoutSeconds(claim.createdDate) : '-'}
                />
                <DetailField label="Status Description" value={claim.statusDescription} wide />
                <DetailField label="Message" value={claim.message} wide />
              </DetailGrid>
            }
          />
        </div>

        <div className="bc-section bc-section--items">
          <SectionContainer
            title="Claim Items"
            content={
              <div className="bc-claim-items">
                <div className="bc-items-summary">
                  <span className="bc-items-summary__chip">
                    Items <strong>{items.length}</strong>
                  </span>
                  <span className="bc-items-summary__chip bc-items-summary__chip--patient">
                    Patient share <strong>{formatBillingMoney(itemTotals.patient)}</strong>
                  </span>
                  <span className="bc-items-summary__chip bc-items-summary__chip--payer">
                    Payer share <strong>{formatBillingMoney(itemTotals.payer)}</strong>
                  </span>
                </div>
                <MyTable data={lineViews} columns={itemColumns} height={380} dontTranslateData />
              </div>
            }
          />
        </div>
        </div>
      }
    />
  );
};

export default ClaimPreview;
