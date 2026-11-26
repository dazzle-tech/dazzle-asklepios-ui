import React, { useMemo } from 'react';
import { Loader } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faUser,
  faShieldHalved,
  faStethoscope
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import {
  useGetEncounterFinancialStatementQuery,
  useGetStatementAuditTrailQuery,
  useGetStatementReceiptsQuery,
  useGetStatementServiceLinesQuery,
  useGetStatementTimelineQuery
} from '@/services/billing/patientFinancialStatementService';
import { formatBillingEnum } from '../utils/billingAccountingUtils';
import FinancialDonutChart from './FinancialDonutChart';
import { dash, money, statusLabel, statusTone, timestamp } from './statementFormatters';
import { useStatementCatalogLookups } from './useStatementCatalogLookups';
import useStatementTablePaging from './useStatementTablePaging';

type PatientFinancialStatementViewProps = {
  encounterId: number;
  fallbackCurrency?: string;
  onBack: () => void;
};

const Field = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="pfs-field">
    <div className="pfs-field__label">{label}</div>
    <div className="pfs-field__value">{value ?? '-'}</div>
  </div>
);

const StatusPill = ({ value }: { value?: string | null }) => (
  <span className={`pfs-pill pfs-pill--${statusTone(value)}`}>{statusLabel(value)}</span>
);

const BreakdownCard = ({
  title,
  rows,
  currency,
  note
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
  currency: string;
  note: string;
}) => (
  <div className="pfs-panel">
    <div className="pfs-panel__head">
      <h3>{title}</h3>
    </div>
    <div className="pfs-kv">
      {rows.map(row => (
        <div key={row.label} className="pfs-kv__row">
          <span>{row.label}</span>
          <strong>{money(row.value, currency)}</strong>
        </div>
      ))}
    </div>
    <div className="pfs-card__note">{note}</div>
  </div>
);

const PagedLedgerTable = ({
  title,
  badge,
  note,
  data,
  loading,
  totalCount,
  paging,
  columns,
  height = 360
}: {
  title: string;
  badge?: string;
  note?: string;
  data: any[];
  loading?: boolean;
  totalCount: number;
  paging: ReturnType<typeof useStatementTablePaging>;
  columns: any[];
  height?: number;
}) => (
  <section className="pfs-panel">
    <div className="pfs-panel__head">
      <h3>{title}</h3>
      {badge ? <span className="pfs-count">{badge}</span> : null}
    </div>
    {note ? <div className="pfs-card__note pfs-card__note--inline">{note}</div> : null}
    <MyTable
      data={data}
      loading={loading}
      height={height}
      page={paging.page}
      rowsPerPage={paging.rowsPerPage}
      totalCount={totalCount}
      onPageChange={paging.onPageChange}
      onRowsPerPageChange={paging.onRowsPerPageChange}
      columns={columns}
    />
  </section>
);

const PatientFinancialStatementView: React.FC<PatientFinancialStatementViewProps> = ({
  encounterId,
  fallbackCurrency = 'SAR',
  onBack
}) => {
  const navigate = useNavigate();
  const servicePaging = useStatementTablePaging(10);
  const receiptPaging = useStatementTablePaging(10);
  const timelinePaging = useStatementTablePaging(10);
  const auditPaging = useStatementTablePaging(5);

  const { data, isFetching, isError } = useGetEncounterFinancialStatementQuery(encounterId, {
    refetchOnMountOrArgChange: true
  });
  const serviceLinesQuery = useGetStatementServiceLinesQuery({
    encounterId,
    page: servicePaging.page,
    size: servicePaging.rowsPerPage
  });
  const receiptsQuery = useGetStatementReceiptsQuery({
    encounterId,
    page: receiptPaging.page,
    size: receiptPaging.rowsPerPage
  });
  const timelineQuery = useGetStatementTimelineQuery({
    encounterId,
    page: timelinePaging.page,
    size: timelinePaging.rowsPerPage
  });
  const auditQuery = useGetStatementAuditTrailQuery({
    encounterId,
    page: auditPaging.page,
    size: auditPaging.rowsPerPage
  });

  const lookups = useStatementCatalogLookups({
    facilityId: data?.visitPatient.facilityId,
    departmentId: data?.visitPatient.departmentId,
    practitionerId: data?.visitPatient.practitionerId
  });

  const currency = data?.header.currency ?? fallbackCurrency;

  const collectionRate = useMemo(() => {
    const billed = Number(data?.header.patientBilled ?? 0);
    const collected = Number(data?.header.collected ?? 0);
    if (billed <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((collected / billed) * 100)));
  }, [data]);

  if (isFetching && data == null) {
    return (
      <div className="pfs-empty">
        <Loader content="Loading patient financial statement..." />
      </div>
    );
  }

  if (isError || data == null) {
    return <div className="pfs-empty">Unable to load the financial statement for this visit.</div>;
  }

  const {
    header,
    visitPatient,
    coveragePayer,
    invoiceBreakdown,
    patientSettlement,
    insuranceSplit,
    claimFinancial,
    finalSettlement,
    footer
  } = data;

  return (
    <div className="pfs-statement">
      <div className="pfs-statement__toolbar">
        <MyButton
          appearance="ghost"
          prefixIcon={() => <FontAwesomeIcon icon={faArrowLeft} />}
          onClick={onBack}
        >
          Back to dashboard
        </MyButton>
      </div>

      <section className="pfs-banner">
        <div>
          <div className="pfs-banner__kicker">Patient Financial Statement</div>
          <h2 className="pfs-banner__title">{dash(header.encounterNumber)}</h2>
          <div className="pfs-banner__meta">
            {dash(header.patientName)} · MRN {dash(header.medicalRecordNumber)} ·{' '}
            {timestamp(header.encounterDateTime)} · {formatBillingEnum(header.visitType)}
          </div>
        </div>
        <div className="pfs-banner__side">
          <StatusPill value={header.financialStatus} />
          <div className="pfs-banner__invoice">Invoice {dash(header.invoiceNumber)}</div>
        </div>
      </section>

      <div className="pfs-kpis">
        <div className="pfs-kpi pfs-kpi--primary">
          <div className="pfs-kpi__label">Gross services</div>
          <div className="pfs-kpi__value">{money(header.grossServices, currency)}</div>
          <div className="pfs-kpi__hint">Before VAT</div>
        </div>
        <div className="pfs-kpi pfs-kpi--warning">
          <div className="pfs-kpi__label">VAT</div>
          <div className="pfs-kpi__value">{money(header.vatAmount, currency)}</div>
          <div className="pfs-kpi__hint">From service tax setup</div>
        </div>
        <div className="pfs-kpi pfs-kpi--purple">
          <div className="pfs-kpi__label">Patient billed</div>
          <div className="pfs-kpi__value">{money(header.patientBilled, currency)}</div>
          <div className="pfs-kpi__hint">Share including VAT</div>
        </div>
        <div className="pfs-kpi pfs-kpi--success">
          <div className="pfs-kpi__label">Collected</div>
          <div className={`pfs-kpi__value${header.collected > 0 ? ' is-success' : ''}`}>
            {money(header.collected, currency)}
          </div>
          <div className="pfs-kpi__hint">Allocated to this invoice</div>
        </div>
        <div className={`pfs-kpi ${header.outstanding > 0 ? 'pfs-kpi--danger' : 'pfs-kpi--success'}`}>
          <div className="pfs-kpi__label">Outstanding</div>
          <div className={`pfs-kpi__value${header.outstanding > 0 ? ' is-danger' : ' is-success'}`}>
            {money(header.outstanding, currency)}
          </div>
          <div className="pfs-kpi__hint">{header.outstanding <= 0 ? 'Settled' : 'Patient remaining'}</div>
        </div>
      </div>

      <div className="pfs-progress">
        <div className="pfs-progress__label">
          Collection progress <strong>{collectionRate}%</strong>
        </div>
        <div className="pfs-progress__track">
          <div className="pfs-progress__fill" style={{ width: `${collectionRate}%` }} />
        </div>
      </div>

      <div className="pfs-charts">
        <FinancialDonutChart
          title="Collection status"
          centerValue={`${collectionRate}%`}
          centerHint="Collected"
          currency={currency}
          slices={[
            { label: 'Collected', value: header.collected, color: 'var(--primary-green)' },
            { label: 'Outstanding', value: header.outstanding, color: 'var(--primary-red)' }
          ]}
        />
        <FinancialDonutChart
          title="Invoice composition"
          centerValue={money(invoiceBreakdown.totalBilled, currency)}
          centerHint="Invoice total"
          currency={currency}
          slices={[
            { label: 'Net services', value: invoiceBreakdown.netServices, color: 'var(--primary-blue)' },
            { label: 'VAT', value: invoiceBreakdown.vatAmount, color: 'var(--primary-orange)' },
            { label: 'Discount', value: invoiceBreakdown.discountAmount, color: 'var(--primary-gray)' }
          ]}
        />
        <FinancialDonutChart
          title="Responsibility split"
          centerValue={money(finalSettlement.patientBilled + finalSettlement.insuranceBilled, currency)}
          centerHint="Billed parties"
          currency={currency}
          slices={[
            { label: 'Patient', value: finalSettlement.patientBilled, color: 'var(--primary-purple)' },
            { label: 'Insurance', value: finalSettlement.insuranceBilled, color: 'var(--deep-blue)' }
          ]}
        />
      </div>

      <div className="pfs-info-grid">
        <div className="pfs-panel">
          <div className="pfs-panel__head">
            <h3>Visit & patient</h3>
          </div>
          <div className="pfs-person">
            <FontAwesomeIcon icon={faUser} />
            <div>
              <strong>{dash(visitPatient.patientName)}</strong>
              <div>
                MRN {dash(visitPatient.medicalRecordNumber)} · ID {dash(visitPatient.nationalId)}
              </div>
            </div>
          </div>
          <div className="pfs-fields">
            <Field label="Facility" value={lookups.facilityName} />
            <Field label="Clinic / Department" value={lookups.departmentName} />
            <Field
              label="Doctor"
              value={
                <>
                  <FontAwesomeIcon icon={faStethoscope} className="pfs-inline-icon" />
                  {lookups.practitionerName}
                </>
              }
            />
            <Field label="Visit type" value={formatBillingEnum(visitPatient.visitType)} />
            <Field label="Encounter date" value={timestamp(visitPatient.encounterDateTime)} />
            <Field label="Invoice" value={dash(visitPatient.invoiceNumber)} />
          </div>
        </div>

        <div className="pfs-panel">
          <div className="pfs-panel__head">
            <h3>Coverage & payer</h3>
          </div>
          <div className="pfs-person">
            <FontAwesomeIcon icon={faShieldHalved} />
            <div>
              <strong>{dash(coveragePayer.payerName)}</strong>
              <div>{formatBillingEnum(coveragePayer.coverageType)}</div>
            </div>
          </div>
          <div className="pfs-fields">
            <Field label="Member ID" value={dash(coveragePayer.memberId)} />
            <Field label="Policy number" value={dash(coveragePayer.policyNumber)} />
            <Field label="Eligibility" value={dash(coveragePayer.eligibility)} />
            <Field label="Authorization" value={dash(coveragePayer.authorization)} />
            <Field label="Claim number" value={dash(coveragePayer.claimNumber)} />
            <Field label="Financial status" value={<StatusPill value={coveragePayer.financialStatus} />} />
          </div>
        </div>
      </div>

      <PagedLedgerTable
        title="Charged services"
        badge={`${serviceLinesQuery.data?.totalElements ?? 0} lines`}
        data={serviceLinesQuery.data?.content ?? []}
        loading={serviceLinesQuery.isFetching}
        totalCount={serviceLinesQuery.data?.totalElements ?? 0}
        paging={servicePaging}
        height={420}
        columns={[
          { key: 'serviceCode', title: 'Code', render: row => dash(row.serviceCode) },
          { key: 'serviceName', title: 'Service', render: row => dash(row.serviceName) },
          { key: 'quantity', title: 'Qty', render: row => dash(row.quantity) },
          { key: 'unitPrice', title: 'Unit', render: row => money(row.unitPrice, currency) },
          { key: 'grossAmount', title: 'Gross', render: row => money(row.grossAmount, currency) },
          { key: 'discountAmount', title: 'Discount', render: row => money(row.discountAmount, currency) },
          { key: 'netAmount', title: 'Net', render: row => money(row.netAmount, currency) },
          { key: 'deductibleAmount', title: 'Deductible', render: row => money(row.deductibleAmount, currency) },
          { key: 'copayAmount', title: 'Co-payment', render: row => money(row.copayAmount, currency) },
          { key: 'nonCoveredAmount', title: 'Non-covered', render: row => money(row.nonCoveredAmount, currency) },
          { key: 'patientResponsibility', title: 'Patient', render: row => money(row.patientResponsibility, currency) },
          { key: 'insuranceShare', title: 'Insurance', render: row => money(row.insuranceShare, currency) },
          { key: 'vatAmount', title: 'VAT', render: row => money(row.vatAmount, currency) },
          { key: 'lineTotal', title: 'Line total', render: row => money(row.lineTotal, currency) }
        ]}
      />

      <div className="pfs-three">
        <BreakdownCard
          title="Invoice breakdown"
          currency={currency}
          rows={[
            { label: 'Gross services', value: invoiceBreakdown.grossServices },
            { label: 'Discount', value: invoiceBreakdown.discountAmount },
            { label: 'Net services', value: invoiceBreakdown.netServices },
            { label: 'Taxable amount', value: invoiceBreakdown.taxableAmount },
            { label: 'VAT', value: invoiceBreakdown.vatAmount },
            { label: 'Total billed', value: invoiceBreakdown.totalBilled }
          ]}
          note="VAT is taken from each service tax category. No fixed rate is applied."
        />
        <BreakdownCard
          title="Patient settlement"
          currency={currency}
          rows={[
            { label: 'Patient billed', value: patientSettlement.patientBilled },
            { label: 'Collected on invoice', value: patientSettlement.collectedOnInvoice },
            { label: 'Wallet reserved', value: patientSettlement.walletReserved },
            { label: 'Refunds / adjustments', value: patientSettlement.refundsAdjustments },
            { label: 'Outstanding', value: patientSettlement.outstanding }
          ]}
          note="Collected is invoice allocation. Wallet deposits appear in receipts below and do not count as extra visit collection."
        />
        <BreakdownCard
          title="Insurance split"
          currency={currency}
          rows={[
            { label: 'Eligible amount', value: insuranceSplit.eligibleAmount },
            { label: 'Deductible', value: insuranceSplit.deductibleAmount },
            { label: 'Patient co-payment', value: insuranceSplit.patientCopayment },
            { label: 'Insurance share', value: insuranceSplit.insuranceShare },
            { label: 'Non-covered', value: insuranceSplit.nonCoveredAmount }
          ]}
          note="Co-payment comes from benefits, contract, network and payer rules. It is not a fixed percentage."
        />
      </div>

      <PagedLedgerTable
        title="Receipts on this visit"
        note="Includes wallet top-ups posted on the encounter."
        data={receiptsQuery.data?.content ?? []}
        loading={receiptsQuery.isFetching}
        totalCount={receiptsQuery.data?.totalElements ?? 0}
        paging={receiptPaging}
        columns={[
          { key: 'paymentDate', title: 'Payment date', render: row => timestamp(row.paymentDate) },
          { key: 'receiptNumber', title: 'Receipt #', render: row => dash(row.receiptNumber) },
          { key: 'paymentMethod', title: 'Method', render: row => formatBillingEnum(row.paymentMethod) },
          { key: 'payer', title: 'Payer', render: row => dash(row.payer) },
          { key: 'status', title: 'Status', render: row => <StatusPill value={row.status} /> },
          { key: 'amount', title: 'Amount', render: row => money(row.amount, currency) }
        ]}
      />

      <section className="pfs-panel">
        <div className="pfs-panel__head">
          <h3>Insurance / claim financial</h3>
          {claimFinancial.claimId != null && (
            <MyButton appearance="ghost" onClick={() => navigate('/billing-claims')}>
              Claim details
            </MyButton>
          )}
        </div>
        {claimFinancial.rejectionReason ? (
          <div className="pfs-alert">
            Rejected amount stays on insurance until a business rule assigns it. Reason:{' '}
            {claimFinancial.rejectionReason}
          </div>
        ) : null}
        <div className="pfs-fields pfs-fields--dense">
          <Field label="Claim number" value={dash(claimFinancial.claimNumber)} />
          <Field label="Claim status" value={<StatusPill value={claimFinancial.claimStatus} />} />
          <Field label="Submitted amount" value={money(claimFinancial.submittedAmount, currency)} />
          <Field label="Approved amount" value={money(claimFinancial.approvedAmount, currency)} />
          <Field label="Rejected amount" value={money(claimFinancial.rejectedAmount, currency)} />
          <Field label="Resubmitted amount" value={money(claimFinancial.resubmittedAmount, currency)} />
          <Field label="Final approved amount" value={money(claimFinancial.finalApprovedAmount, currency)} />
          <Field label="Insurance payment received" value={money(claimFinancial.insurancePaymentReceived, currency)} />
          <Field label="Insurance outstanding" value={money(claimFinancial.insuranceOutstanding, currency)} />
        </div>
      </section>

      <PagedLedgerTable
        title="Financial transactions timeline"
        data={timelineQuery.data?.content ?? []}
        loading={timelineQuery.isFetching}
        totalCount={timelineQuery.data?.totalElements ?? 0}
        paging={timelinePaging}
        columns={[
          { key: 'transactionDate', title: 'Date', render: row => timestamp(row.transactionDate) },
          { key: 'transactionType', title: 'Type', render: row => formatBillingEnum(row.transactionType) },
          { key: 'reference', title: 'Reference', render: row => dash(row.reference) },
          { key: 'debit', title: 'Debit', render: row => money(row.debit, currency) },
          { key: 'credit', title: 'Credit', render: row => money(row.credit, currency) },
          { key: 'runningBalance', title: 'Running balance', render: row => money(row.runningBalance, currency) }
        ]}
      />

      <section className="pfs-panel">
        <div className="pfs-panel__head">
          <h3>Final visit financial</h3>
          <StatusPill value={finalSettlement.overallFinancialStatus} />
        </div>
        <div className="pfs-fields pfs-fields--dense">
          <Field label="Gross charges" value={money(finalSettlement.grossCharges, currency)} />
          <Field label="Patient billed" value={money(finalSettlement.patientBilled, currency)} />
          <Field label="Insurance billed" value={money(finalSettlement.insuranceBilled, currency)} />
          <Field label="Patient collected" value={money(finalSettlement.patientCollected, currency)} />
          <Field label="Insurance collected" value={money(finalSettlement.insuranceCollected, currency)} />
          <Field label="Total collected" value={money(finalSettlement.totalCollected, currency)} />
          <Field label="Patient outstanding" value={money(finalSettlement.patientOutstanding, currency)} />
          <Field label="Insurance outstanding" value={money(finalSettlement.insuranceOutstanding, currency)} />
          <Field label="Visit outstanding" value={money(finalSettlement.visitOutstanding, currency)} />
        </div>
        <MyTable
          data={finalSettlement.parties}
          height={220}
          columns={[
            { key: 'party', title: 'Party' },
            { key: 'billed', title: 'Billed', render: row => money(row.billed, currency) },
            { key: 'collected', title: 'Collected', render: row => money(row.collected, currency) },
            { key: 'outstanding', title: 'Outstanding', render: row => money(row.outstanding, currency) }
          ]}
        />
      </section>

      <PagedLedgerTable
        title="Audit trail"
        data={auditQuery.data?.content ?? []}
        loading={auditQuery.isFetching}
        totalCount={auditQuery.data?.totalElements ?? 0}
        paging={auditPaging}
        columns={[
          { key: 'eventDate', title: 'Date / Time', render: row => timestamp(row.eventDate) },
          { key: 'event', title: 'Event', render: row => formatBillingEnum(row.event) },
          { key: 'reference', title: 'Reference', render: row => dash(row.reference) },
          { key: 'user', title: 'User', render: row => dash(row.user) },
          { key: 'previousValue', title: 'Previous', render: row => dash(row.previousValue) },
          { key: 'newValue', title: 'New', render: row => dash(row.newValue) },
          { key: 'reason', title: 'Reason', render: row => dash(row.reason) }
        ]}
      />

      <section className="pfs-panel pfs-footer">
        <div className="pfs-fields pfs-fields--dense">
          <Field label="Prepared by" value={dash(footer.preparedBy)} />
          <Field label="Finalized by" value={dash(footer.finalizedBy)} />
          <Field label="Finalized date" value={timestamp(footer.finalizedDate)} />
          <Field label="Patient payment status" value={statusLabel(footer.patientPaymentStatus)} />
          <Field label="Insurance payment status" value={statusLabel(footer.insurancePaymentStatus)} />
          <Field label="Overall settlement status" value={statusLabel(footer.overallSettlementStatus)} />
          <Field label="Statement lifecycle" value={statusLabel(footer.statementLifecycle)} />
          <Field label="Generated date" value={timestamp(footer.generatedDate)} />
        </div>
        <div className="pfs-disclaimer">
          This Patient Financial Statement is a financial settlement report. It is not a substitute for an
          electronic tax invoice.
        </div>
      </section>
    </div>
  );
};

export default PatientFinancialStatementView;
