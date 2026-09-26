import React, { useMemo, useState } from 'react';
import { Loader } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faCircleExclamation,
  faFileInvoiceDollar,
  faMinusCircle,
  faPlusCircle,
  faPrint,
  faReceipt,
  faSync,
  faTags,
  faListUl,
  faScaleBalanced
} from '@fortawesome/free-solid-svg-icons';

import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import PaymentReceiptModal from '@/pages/patient/patient-profile/PatientQuickAppoinment/PaymentReceiptModal';
import type { PaymentReceiptData } from '@/pages/patient/patient-profile/PatientQuickAppoinment/paymentPreviewUtils';
import type {
  CollectInvoiceBalanceResult,
  FinancialDocumentAdjustment,
  InvoiceAdjustmentSummary,
  InvoiceLineItem,
  InvoicePricingSummary
} from '@/services/billing/financialDocumentAdjustmentService';
import { useSyncInvoicePaymentsMutation } from '@/services/billing/financialDocumentAdjustmentService';
import type { PatientFinancialInvoice } from '@/services/billing/invoiceGenerationService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { buildInvoicePaymentReceipt } from '@/pages/billing-module/invoices/invoicePaymentReceiptUtils';
import PayInvoiceBalanceModal, {
  type InvoicePaymentCompletedContext
} from './PayInvoiceBalanceModal';
import {
  canCollectPatientPaymentOnInvoice,
  invoiceBalanceChipLabel,
  invoiceLineStatusLabel,
  invoiceOutstandingLabel,
  isInsuranceClaimInvoice,
  resolveInvoiceDisplayNumber,
  resolveInvoiceVisitNumber
} from './invoiceDisplayUtils';

type InvoiceDetailPanelProps = {
  invoice: PatientFinancialInvoice | null;
  summary: InvoiceAdjustmentSummary | null | undefined;
  lineItems: InvoiceLineItem[];
  pricingSummary?: InvoicePricingSummary | null;
  loading?: boolean;
  currency?: string;
  patient?: any;
  walletBalance?: number;
  walletReserved?: number;
  printDisabled?: boolean;
  canCreateCreditNote?: boolean;
  canCreateDebitNote?: boolean;
  canCreateDiscountCreditNote?: boolean;
  onPrintInvoice?: () => void;
  onPrintDetailedInvoice?: () => void;
  onPrintAdjustment?: (adjustment: FinancialDocumentAdjustment) => void;
  onCreateCreditNote?: () => void;
  onCreateDebitNote?: () => void;
  onCreateDiscountCreditNote?: () => void;
  onRefresh?: () => void;
  encounterDepartmentId?: number | null;
  visitNumber?: string;
};

const formatMoney = (value?: number, currency = 'SAR') => {
  const amount = Number(value ?? 0);
  return `${amount.toFixed(2)} ${currency}`;
};

const formatShortDate = (value?: string | null) => {
  if (!value) return '-';
  return String(value).substring(0, 10);
};

const lineStatusLabel = (status?: string, documentSubtype?: string | null) =>
  invoiceLineStatusLabel(status, documentSubtype);

const formatAdjustmentLabel = (
  type?: string | null,
  rate?: number | null,
  fixedAmount?: number | null
) => {
  if (type === 'PERCENTAGE' && rate != null) return `${rate}%`;
  if (type === 'FIXED_AMOUNT' && fixedAmount != null) return `Fixed ${fixedAmount}`;
  return type ?? '-';
};

type DetailTab = 'services' | 'adjustments' | 'pricing';

const InvoiceDetailPanel: React.FC<InvoiceDetailPanelProps> = ({
  invoice,
  summary,
  lineItems,
  pricingSummary,
  loading = false,
  currency = 'SAR',
  patient,
  walletBalance = 0,
  walletReserved = 0,
  printDisabled = false,
  canCreateCreditNote = false,
  canCreateDebitNote = false,
  canCreateDiscountCreditNote = false,
  onPrintInvoice,
  onPrintDetailedInvoice,
  onPrintAdjustment,
  onCreateCreditNote,
  onCreateDebitNote,
  onCreateDiscountCreditNote,
  onRefresh,
  encounterDepartmentId = null,
  visitNumber
}) => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<DetailTab>('services');
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [receiptModal, setReceiptModal] = useState<{
    open: boolean;
    receipt: PaymentReceiptData | null;
  }>({ open: false, receipt: null });

  const [syncInvoicePayments, { isLoading: syncingPayments }] =
    useSyncInvoicePaymentsMutation();

  const resolvedCurrency = summary?.currency ?? invoice?.currency ?? currency;
  const displayDocumentNumber = resolveInvoiceDisplayNumber(invoice, summary, pricingSummary);
  const outstandingBalance = Number(summary?.outstandingBalance ?? 0);
  const isInsuranceClaimInvoiceFlag = isInsuranceClaimInvoice(invoice?.documentSubtype);
  const canPayOutstanding = canCollectPatientPaymentOnInvoice(
    outstandingBalance,
    invoice?.id,
    invoice?.documentSubtype
  );
  const isSettled = outstandingBalance <= 0;

  const serviceRows = useMemo(
    () =>
      lineItems.map(item => ({
        key: String(item.id),
        ...item
      })),
    [lineItems]
  );

  const pricingDetailRows = useMemo(
    () => {
      const nameByLineId = new Map(
        serviceRows.map(row => [String(row.id), row.itemDescription ?? row.itemCode ?? '-'])
      );

      return lineItems.flatMap(item => {
        const serviceName = nameByLineId.get(String(item.id)) ?? item.itemDescription ?? '-';
        const discounts = item.appliedDiscounts ?? [];
        const taxes = item.appliedTaxes ?? [];

        return [
          ...discounts.map((discount, index) => ({
            key: `${item.id}-discount-${index}`,
            service: serviceName,
            kind: 'Discount',
            kindTone: 'discount' as const,
            rule: discount.code ?? discount.name ?? discount.source ?? '-',
            type: formatAdjustmentLabel(
              discount.discountType,
              discount.rate,
              discount.fixedAmount
            ),
            scope: discount.applicableOn ?? discount.source ?? '-',
            amount: discount.appliedAmount ?? 0
          })),
          ...taxes.map((tax, index) => ({
            key: `${item.id}-tax-${index}`,
            service: serviceName,
            kind: 'Tax',
            kindTone: 'tax' as const,
            rule: tax.code ?? tax.name ?? tax.source ?? '-',
            type: formatAdjustmentLabel(tax.taxType, tax.rate, tax.fixedAmount),
            scope: tax.applicableOn ?? tax.source ?? '-',
            amount: tax.appliedAmount ?? 0
          }))
        ];
      });
    },
    [lineItems, serviceRows]
  );

  const adjustmentRows = useMemo(
    () =>
      (summary?.adjustments ?? []).flatMap((adjustment: FinancialDocumentAdjustment) =>
        (adjustment.items?.length ?? 0) > 0
          ? adjustment.items!.map((item, index) => ({
              key: `${adjustment.id}-${item.id}`,
              adjustment,
              isFirstAdjustmentRow: index === 0,
              documentNumber: adjustment.documentNumber,
              documentType: adjustment.documentType,
              itemDescription: item.itemDescription,
              netAmount: item.netAmount,
              createdDate: adjustment.createdDate
            }))
          : [
              {
                key: `${adjustment.id}-header`,
                adjustment,
                isFirstAdjustmentRow: true,
                documentNumber: adjustment.documentNumber,
                documentType: adjustment.documentType,
                itemDescription: adjustment.adjustmentReason ?? 'Header adjustment',
                netAmount: adjustment.totalAmount,
                createdDate: adjustment.createdDate
              }
            ]
      ),
    [summary?.adjustments]
  );

  const handleSyncPayments = async () => {
    if (invoice?.id == null) return;

    try {
      const result = await syncInvoicePayments(invoice.id).unwrap();
      dispatch(
        notify({
          msg: `Synced billing payments. Paid ${formatMoney(result.paidAmount, resolvedCurrency)} · remaining ${formatMoney(result.outstandingAmount, resolvedCurrency)}.`,
          sev: 'success'
        })
      );
      onRefresh?.();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.message ?? error?.data?.detail ?? 'Unable to sync invoice payments.',
          sev: 'error'
        })
      );
    }
  };

  const handlePaymentCompleted = (
    result: CollectInvoiceBalanceResult,
    context: InvoicePaymentCompletedContext
  ) => {
    const receipt = buildInvoicePaymentReceipt({
      paymentResult: result,
      invoice,
      summary,
      lineItems,
      patient,
      currency: resolvedCurrency,
      paymentMethodLabel: context.paymentMethodLabel
    });

    setReceiptModal({ open: true, receipt });
    onRefresh?.();
  };

  if (invoice == null || summary == null) {
    return (
      <div className="invoice-detail invoice-detail--empty">
        <div className="invoice-detail__empty-icon">
          <FontAwesomeIcon icon={faFileInvoiceDollar} />
        </div>
        <h3 className="invoice-detail__empty-title">Select an invoice</h3>
        <p className="invoice-detail__empty-text">
          Choose an invoice from the list to review services, line payment status, adjustments,
          and collect any remaining balance.
        </p>
      </div>
    );
  }

  const tabs: { key: DetailTab; label: string; icon: typeof faListUl; count: number }[] = [
    { key: 'services', label: 'Services', icon: faListUl, count: serviceRows.length },
    {
      key: 'adjustments',
      label: 'Credit / debit',
      icon: faScaleBalanced,
      count: summary.adjustments?.length ?? 0
    },
    { key: 'pricing', label: 'Pricing rules', icon: faTags, count: pricingDetailRows.length }
  ];

  return (
    <div className={`invoice-detail${loading ? ' invoice-detail--loading' : ''}`}>
      <div className="invoice-detail__hero">
        <div className="invoice-detail__hero-main">
          <div className="invoice-detail__hero-icon">
            <FontAwesomeIcon icon={faFileInvoiceDollar} />
          </div>
          <div className="invoice-detail__hero-text">
            <span className="invoice-detail__eyebrow">
              {isInsuranceClaimInvoiceFlag ? 'Insurance claim invoice' : 'Patient invoice'}
            </span>
            <h2 className="invoice-detail__title">{displayDocumentNumber}</h2>
            <div className="invoice-detail__chips">
              <span className={`invoice-detail__chip invoice-detail__chip--status-${String(summary.status ?? '').toLowerCase()}`}>
                {summary.status}
              </span>
              <span
                className={`invoice-detail__chip ${
                  isSettled
                    ? 'invoice-detail__chip--settled'
                    : 'invoice-detail__chip--due'
                }`}
              >
                {isSettled ? (
                  <>
                    <FontAwesomeIcon icon={faCheckCircle} /> Settled
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCircleExclamation} />{' '}
                    {invoiceBalanceChipLabel(false, invoice?.documentSubtype)}
                  </>
                )}
              </span>
              {invoice.claimReference ? (
                <span className="invoice-detail__chip invoice-detail__chip--muted">
                  Claim {invoice.claimReference}
                </span>
              ) : null}
              {invoice.encounterId != null ? (
                <span className="invoice-detail__chip invoice-detail__chip--muted">
                  Visit {visitNumber ?? resolveInvoiceVisitNumber(invoice)}
                </span>
              ) : null}
              <span className="invoice-detail__chip invoice-detail__chip--muted">
                {formatShortDate(invoice.createdDate as string)}
              </span>
            </div>
          </div>
        </div>

        <div className="invoice-detail__hero-actions">
          {canPayOutstanding ? (
            <div className="invoice-detail__pay-block">
              {Number(summary.totalPaid ?? 0) === 0 ? (
                <MyButton
                  size="sm"
                  appearance="ghost"
                  loading={syncingPayments}
                  onClick={handleSyncPayments}
                >
                  <FontAwesomeIcon icon={faSync} /> Sync billing
                </MyButton>
              ) : null}
              <MyButton appearance="primary" onClick={() => setPayModalOpen(true)}>
                <FontAwesomeIcon icon={faReceipt} /> Pay {formatMoney(outstandingBalance, resolvedCurrency)}
              </MyButton>
            </div>
          ) : null}
          <div className="invoice-detail__toolbar">
            {onPrintInvoice ? (
              <MyButton
                size="sm"
                appearance="ghost"
                disabled={printDisabled}
                onClick={onPrintInvoice}
              >
                <FontAwesomeIcon icon={faPrint} /> Print
              </MyButton>
            ) : null}
            {onPrintDetailedInvoice ? (
              <MyButton
                size="sm"
                appearance="ghost"
                disabled={printDisabled}
                onClick={onPrintDetailedInvoice}
              >
                <FontAwesomeIcon icon={faFileInvoiceDollar} /> Credit invoice
              </MyButton>
            ) : null}
            {onCreateCreditNote ? (
              <MyButton
                size="sm"
                appearance="ghost"
                disabled={!canCreateCreditNote}
                onClick={onCreateCreditNote}
              >
                <FontAwesomeIcon icon={faMinusCircle} /> Credit note
              </MyButton>
            ) : null}
            {onCreateDiscountCreditNote ? (
              <MyButton
                size="sm"
                appearance="ghost"
                disabled={!canCreateDiscountCreditNote}
                onClick={onCreateDiscountCreditNote}
              >
                <FontAwesomeIcon icon={faTags} /> Discount
              </MyButton>
            ) : null}
            {onCreateDebitNote ? (
              <MyButton
                size="sm"
                appearance="ghost"
                disabled={!canCreateDebitNote}
                onClick={onCreateDebitNote}
              >
                <FontAwesomeIcon icon={faPlusCircle} /> Debit
              </MyButton>
            ) : null}
          </div>
        </div>
      </div>

      <div className="invoice-detail__metrics">
        <div className="invoice-detail__metric">
          <span className="invoice-detail__metric-label">Invoice total</span>
          <span className="invoice-detail__metric-value">
            {formatMoney(summary.invoiceTotal, resolvedCurrency)}
          </span>
        </div>
        <div className="invoice-detail__metric">
          <span className="invoice-detail__metric-label">Paid</span>
          <span className="invoice-detail__metric-value invoice-detail__metric-value--paid">
            {formatMoney(summary.totalPaid, resolvedCurrency)}
          </span>
        </div>
        <div
          className={`invoice-detail__metric invoice-detail__metric--highlight${
            isSettled ? ' invoice-detail__metric--settled' : ' invoice-detail__metric--due'
          }`}
        >
          <span className="invoice-detail__metric-label">
            {invoiceOutstandingLabel(invoice?.documentSubtype)}
          </span>
          <span className="invoice-detail__metric-value">
            {formatMoney(summary.outstandingBalance, resolvedCurrency)}
          </span>
        </div>
        <div className="invoice-detail__metric">
          <span className="invoice-detail__metric-label">Credit notes</span>
          <span className="invoice-detail__metric-value">
            {formatMoney(summary.totalCreditNotes, resolvedCurrency)}
          </span>
        </div>
        <div className="invoice-detail__metric">
          <span className="invoice-detail__metric-label">Debit notes</span>
          <span className="invoice-detail__metric-value">
            {formatMoney(summary.totalDebitNotes, resolvedCurrency)}
          </span>
        </div>
      </div>

      <div className="invoice-detail__tabs" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`invoice-detail__tab${
              activeTab === tab.key ? ' invoice-detail__tab--active' : ''
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            <FontAwesomeIcon icon={tab.icon} />
            {tab.label}
            <span className="invoice-detail__tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="invoice-detail__body">
        {loading ? (
          <div className="invoice-detail__loader">
            <Loader content="Loading invoice details…" />
          </div>
        ) : null}

        {activeTab === 'services' && !loading ? (
          <div className="invoice-detail__table-wrap">
            <MyTable
              data={serviceRows}
              loading={false}
              columns={[
                {
                  key: 'itemCode',
                  title: 'Code',
                  render: (row: InvoiceLineItem) => (
                    <span className="invoice-detail__code">{row.itemCode ?? '-'}</span>
                  )
                },
                {
                  key: 'itemDescription',
                  title: 'Service',
                  render: (row: InvoiceLineItem) => (
                    <span className="invoice-detail__service-name">
                      {row.itemDescription ?? '-'}
                    </span>
                  )
                },
                { key: 'quantity', title: 'Qty' },
                {
                  key: 'grossAmount',
                  title: 'Gross',
                  render: (row: InvoiceLineItem) => formatMoney(row.grossAmount, resolvedCurrency)
                },
                {
                  key: 'discountAmount',
                  title: 'Discount',
                  render: (row: InvoiceLineItem) => (
                    <span className="invoice-detail__amount-discount">
                      -{formatMoney(row.discountAmount, resolvedCurrency)}
                    </span>
                  )
                },
                {
                  key: 'taxAmount',
                  title: 'Tax',
                  render: (row: InvoiceLineItem) => formatMoney(row.taxAmount, resolvedCurrency)
                },
                {
                  key: 'netAmount',
                  title: 'Total',
                  render: (row: InvoiceLineItem) => (
                    <strong>{formatMoney(row.netAmount, resolvedCurrency)}</strong>
                  )
                },
                {
                  key: 'paidAmount',
                  title: 'Paid',
                  render: (row: InvoiceLineItem) => formatMoney(row.paidAmount, resolvedCurrency)
                },
                {
                  key: 'remainingAmount',
                  title: 'Remaining',
                  render: (row: InvoiceLineItem) => {
                    const remaining = Number(row.remainingAmount ?? 0);
                    return (
                      <span
                        className={
                          remaining > 0
                            ? 'invoice-detail__amount-due'
                            : 'invoice-detail__amount-zero'
                        }
                      >
                        {formatMoney(remaining, resolvedCurrency)}
                      </span>
                    );
                  }
                },
                {
                  key: 'status',
                  title: 'Status',
                  render: (row: InvoiceLineItem) => (
                    <span
                      className={`invoice-detail__line-status invoice-detail__line-status--${String(row.status ?? '').toLowerCase()}`}
                    >
                      {lineStatusLabel(row.status, invoice?.documentSubtype)}
                    </span>
                  )
                }
              ]}
            />
          </div>
        ) : null}

        {activeTab === 'adjustments' && !loading ? (
          adjustmentRows.length > 0 ? (
            <div className="invoice-detail__table-wrap">
              <MyTable
                data={adjustmentRows}
                loading={false}
                columns={[
                  { key: 'documentNumber', title: 'Document #' },
                  {
                    key: 'documentType',
                    title: 'Type',
                    render: (row: (typeof adjustmentRows)[number]) => (
                      <span
                        className={`invoice-detail__adj-type invoice-detail__adj-type--${String(row.documentType).toLowerCase()}`}
                      >
                        {row.documentType === 'CREDIT_NOTE' ? 'Credit note' : 'Debit note'}
                      </span>
                    )
                  },
                  {
                    key: 'itemDescription',
                    title: 'Description',
                    render: (row: (typeof adjustmentRows)[number]) => row.itemDescription ?? '-'
                  },
                  {
                    key: 'netAmount',
                    title: 'Amount',
                    render: (row: (typeof adjustmentRows)[number]) =>
                      formatMoney(row.netAmount, resolvedCurrency)
                  },
                  {
                    key: 'createdDate',
                    title: 'Date',
                    render: (row: (typeof adjustmentRows)[number]) =>
                      formatShortDate(row.createdDate as string)
                  },
                  ...(onPrintAdjustment
                    ? [
                        {
                          key: 'print',
                          title: '',
                          render: (row: (typeof adjustmentRows)[number]) =>
                            row.isFirstAdjustmentRow ? (
                              <MyButton
                                appearance="ghost"
                                size="sm"
                                disabled={printDisabled}
                                onClick={event => {
                                  event.stopPropagation();
                                  onPrintAdjustment(row.adjustment);
                                }}
                              >
                                <FontAwesomeIcon icon={faPrint} />
                              </MyButton>
                            ) : null
                        }
                      ]
                    : [])
                ]}
              />
            </div>
          ) : (
            <div className="invoice-detail__empty-tab">
              <FontAwesomeIcon icon={faScaleBalanced} />
              <p>No credit or debit notes linked to this invoice.</p>
            </div>
          )
        ) : null}

        {activeTab === 'pricing' && !loading ? (
          pricingDetailRows.length > 0 ? (
            <div className="invoice-detail__table-wrap">
              <MyTable
                data={pricingDetailRows}
                loading={false}
                columns={[
                  { key: 'service', title: 'Service' },
                  {
                    key: 'kind',
                    title: 'Kind',
                    render: (row: (typeof pricingDetailRows)[number]) => (
                      <span
                        className={`invoice-detail__rule-kind invoice-detail__rule-kind--${row.kindTone}`}
                      >
                        {row.kind}
                      </span>
                    )
                  },
                  { key: 'rule', title: 'Rule' },
                  { key: 'type', title: 'Type / value' },
                  { key: 'scope', title: 'Scope' },
                  {
                    key: 'amount',
                    title: 'Applied',
                    render: (row: (typeof pricingDetailRows)[number]) =>
                      row.kindTone === 'discount'
                        ? `-${formatMoney(row.amount, resolvedCurrency)}`
                        : formatMoney(row.amount, resolvedCurrency)
                  }
                ]}
              />
            </div>
          ) : (
            <div className="invoice-detail__empty-tab">
              <FontAwesomeIcon icon={faTags} />
              <p>
                {pricingSummary
                  ? `Rules: ${pricingSummary.discountRules?.map(r => r.code ?? r.name).join(', ') || 'none'} · Tax: ${pricingSummary.taxRules?.map(r => r.code ?? r.name).join(', ') || 'none'}`
                  : 'No pricing snapshot on file. Re-generate the invoice to capture rule details.'}
              </p>
            </div>
          )
        ) : null}
      </div>

      <PayInvoiceBalanceModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        invoiceId={invoice.id}
        patientId={invoice?.patientId ?? patient?.id ?? null}
        encounterId={invoice?.encounterId ?? null}
        documentNumber={displayDocumentNumber}
        summary={summary}
        lineItems={lineItems}
        pricingSummary={pricingSummary}
        outstandingAmount={outstandingBalance}
        currency={resolvedCurrency}
        walletBalance={walletBalance}
        walletReserved={walletReserved}
        onPaid={handlePaymentCompleted}
      />

      <PaymentReceiptModal
        open={receiptModal.open}
        receipt={receiptModal.receipt}
        autoPrint
        onClose={() => setReceiptModal({ open: false, receipt: null })}
      />
    </div>
  );
};

export default InvoiceDetailPanel;
