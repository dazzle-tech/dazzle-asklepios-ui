import React, { useMemo, useState } from 'react';
import { Tag, Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';

import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import type {
  FinancialDocumentAdjustment,
  InvoiceAdjustmentSummary,
  InvoiceLineItem
} from '@/services/billing/financialDocumentAdjustmentService';
import {
  useSyncInvoicePaymentsMutation
} from '@/services/billing/financialDocumentAdjustmentService';
import PayInvoiceBalanceModal from './PayInvoiceBalanceModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

type InvoiceAdjustmentsPanelProps = {
  summary: InvoiceAdjustmentSummary | null | undefined;
  invoiceId?: number | null;
  lineItems?: InvoiceLineItem[];
  loading?: boolean;
  currency?: string;
  printDisabled?: boolean;
  onPrintAdjustment?: (adjustment: FinancialDocumentAdjustment) => void;
  onPaymentCompleted?: () => void;
};

type AdjustmentRow = {
  key: string;
  adjustment: FinancialDocumentAdjustment;
  isFirstAdjustmentRow: boolean;
  documentNumber: string;
  documentType: string;
  action?: string;
  itemCode?: string | null;
  itemDescription?: string | null;
  quantity?: number;
  unitPrice?: number;
  netAmount?: number;
  createdDate?: string;
  reason?: string | null;
};

const formatMoney = (value?: number, currency = 'SAR') => {
  const amount = Number(value ?? 0);
  return `${amount.toFixed(2)} ${currency}`;
};

const adjustmentTypeLabel = (type?: string) => {
  switch (String(type ?? '').toUpperCase()) {
    case 'CREDIT_NOTE':
      return 'Credit Note';
    case 'DEBIT_NOTE':
      return 'Debit Note';
    default:
      return type ?? '-';
  }
};

const adjustmentTypeColor = (type?: string) => {
  switch (String(type ?? '').toUpperCase()) {
    case 'CREDIT_NOTE':
      return 'orange';
    case 'DEBIT_NOTE':
      return 'blue';
    default:
      return 'cyan';
  }
};

const lineActionLabel = (action?: string) => {
  switch (String(action ?? '').toUpperCase()) {
    case 'REMOVE':
      return 'Remove';
    case 'PARTIAL_CREDIT':
      return 'Partial credit';
    case 'REDUCE':
      return 'Reduce';
    case 'ADD':
      return 'Add from visit';
    case 'ADD_NEW':
      return 'Add new service';
    case 'INCREASE':
      return 'Increase';
    default:
      return action ?? '-';
  }
};

const formatAdjustmentLabel = (
  type?: string | null,
  rate?: number | null,
  fixedAmount?: number | null
) => {
  if (type === 'PERCENTAGE' && rate != null) {
    return `${rate}%`;
  }

  if (type === 'FIXED_AMOUNT' && fixedAmount != null) {
    return `Fixed ${fixedAmount}`;
  }

  return type ?? '-';
};

const InvoiceAdjustmentsPanel: React.FC<InvoiceAdjustmentsPanelProps> = ({
  summary,
  invoiceId,
  lineItems = [],
  loading = false,
  currency = 'SAR',
  printDisabled = false,
  onPrintAdjustment,
  onPaymentCompleted
}) => {
  const dispatch = useAppDispatch();
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [syncInvoicePayments, { isLoading: syncingPayments }] =
    useSyncInvoicePaymentsMutation();
  const resolvedCurrency = summary?.currency ?? currency;

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
              action: item.adjustmentAction,
              itemCode: item.itemCode,
              itemDescription: item.itemDescription,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              netAmount: item.netAmount,
              createdDate: adjustment.createdDate,
              reason: adjustment.adjustmentReason
            }))
          : [
              {
                key: `${adjustment.id}-header`,
                adjustment,
                isFirstAdjustmentRow: true,
                documentNumber: adjustment.documentNumber,
                documentType: adjustment.documentType,
                action: undefined,
                itemCode: undefined,
                itemDescription: adjustment.adjustmentReason ?? 'Header adjustment',
                quantity: undefined,
                unitPrice: undefined,
                netAmount: adjustment.totalAmount,
                createdDate: adjustment.createdDate,
                reason: adjustment.adjustmentReason
              }
            ]
      ),
    [summary?.adjustments]
  );

  const pricingDetailRows = useMemo(
    () =>
      lineItems.flatMap(item => {
        const discounts = item.appliedDiscounts ?? [];
        const taxes = item.appliedTaxes ?? [];

        if (discounts.length === 0 && taxes.length === 0) {
          return [];
        }

        return [
          ...discounts.map((discount, index) => ({
            key: `${item.id}-discount-${index}`,
            service: item.itemDescription ?? item.itemCode ?? '-',
            kind: 'Discount',
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
            service: item.itemDescription ?? item.itemCode ?? '-',
            kind: 'Tax',
            rule: tax.code ?? tax.name ?? tax.source ?? '-',
            type: formatAdjustmentLabel(tax.taxType, tax.rate, tax.fixedAmount),
            scope: tax.applicableOn ?? tax.source ?? '-',
            amount: tax.appliedAmount ?? 0
          }))
        ];
      }),
    [lineItems]
  );

  const outstandingBalance = Number(summary?.outstandingBalance ?? 0);
  const canPayOutstanding = outstandingBalance > 0 && invoiceId != null;

  const handleSyncPayments = async () => {
    if (invoiceId == null) return;

    try {
      const result = await syncInvoicePayments(invoiceId).unwrap();
      dispatch(
        notify({
          msg: `Synced billing payments. Paid ${formatMoney(result.paidAmount, resolvedCurrency)} · remaining ${formatMoney(result.outstandingAmount, resolvedCurrency)}.`,
          sev: 'success'
        })
      );
      onPaymentCompleted?.();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.message ?? error?.data?.detail ?? 'Unable to sync invoice payments.',
          sev: 'error'
        })
      );
    }
  };

  const columns = useMemo(
    () => [
      { key: 'documentNumber', title: 'Document #' },
      {
        key: 'documentType',
        title: 'Type',
        render: (row: AdjustmentRow) => (
          <Tag color={adjustmentTypeColor(row.documentType)}>
            {adjustmentTypeLabel(row.documentType)}
          </Tag>
        )
      },
      {
        key: 'action',
        title: 'Line Action',
        render: (row: AdjustmentRow) => lineActionLabel(row.action)
      },
      { key: 'itemCode', title: 'Code', render: (row: AdjustmentRow) => row.itemCode ?? '-' },
      {
        key: 'itemDescription',
        title: 'Service',
        render: (row: AdjustmentRow) => row.itemDescription ?? '-'
      },
      {
        key: 'quantity',
        title: 'Qty',
        render: (row: AdjustmentRow) => (row.quantity != null ? row.quantity : '-')
      },
      {
        key: 'unitPrice',
        title: 'Unit Price',
        render: (row: AdjustmentRow) =>
          row.unitPrice != null ? formatMoney(row.unitPrice, resolvedCurrency) : '-'
      },
      {
        key: 'netAmount',
        title: 'Amount',
        render: (row: AdjustmentRow) => formatMoney(row.netAmount, resolvedCurrency)
      },
      {
        key: 'createdDate',
        title: 'Date',
        render: (row: AdjustmentRow) =>
          row.createdDate ? String(row.createdDate).substring(0, 10) : '-'
      },
      ...(onPrintAdjustment
        ? [
            {
              key: 'print',
              title: 'Report',
              render: (row: AdjustmentRow) =>
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
                    <FontAwesomeIcon icon={faPrint} /> Print
                  </MyButton>
                ) : null
            }
          ]
        : [])
    ],
    [onPrintAdjustment, printDisabled, resolvedCurrency]
  );

  if (summary == null) {
    return null;
  }

  return (
    <div className="billing-invoices__adjustments">
      <div className="billing-invoices__adjustments-header">
        <Text weight="bold">Invoice Adjustments — {summary.documentNumber}</Text>
        <div style={{ display: 'flex', gap: 8 }}>
          {canPayOutstanding && Number(summary.totalPaid ?? 0) === 0 ? (
            <MyButton
              size="sm"
              appearance="ghost"
              loading={syncingPayments}
              onClick={handleSyncPayments}
            >
              Sync billing payments
            </MyButton>
          ) : null}
          {canPayOutstanding ? (
            <MyButton size="sm" appearance="primary" onClick={() => setPayModalOpen(true)}>
              Pay outstanding
            </MyButton>
          ) : null}
        </div>
      </div>

      <div className="billing-invoices__adjustments-summary">
        <div>
          <Text muted>Invoice Total</Text>
          <Text>{formatMoney(summary.invoiceTotal, resolvedCurrency)}</Text>
        </div>
        <div>
          <Text muted>Credit Notes</Text>
          <Text>{formatMoney(summary.totalCreditNotes, resolvedCurrency)}</Text>
        </div>
        <div>
          <Text muted>Debit Notes</Text>
          <Text>{formatMoney(summary.totalDebitNotes, resolvedCurrency)}</Text>
        </div>
        <div>
          <Text muted>Paid</Text>
          <Text>{formatMoney(summary.totalPaid, resolvedCurrency)}</Text>
        </div>
        <div>
          <Text muted>Outstanding</Text>
          <Text weight="bold">
            {formatMoney(summary.outstandingBalance, resolvedCurrency)}
          </Text>
        </div>
      </div>

      {pricingDetailRows.length > 0 ? (
        <>
          <Text weight="bold" style={{ marginTop: 16, marginBottom: 8 }}>
            Line pricing snapshot
          </Text>
          <MyTable
            data={pricingDetailRows}
            loading={loading}
            columns={[
              { key: 'service', title: 'Service' },
              { key: 'kind', title: 'Kind' },
              { key: 'rule', title: 'Rule' },
              { key: 'type', title: 'Type / Value' },
              { key: 'scope', title: 'Scope' },
              {
                key: 'amount',
                title: 'Applied',
                render: (row: (typeof pricingDetailRows)[number]) =>
                  formatMoney(row.amount, resolvedCurrency)
              }
            ]}
          />
        </>
      ) : null}

      <MyTable data={adjustmentRows} columns={columns} loading={loading} />

      {invoiceId != null ? (
        <PayInvoiceBalanceModal
          open={payModalOpen}
          onClose={() => setPayModalOpen(false)}
          invoiceId={invoiceId}
          documentNumber={summary.documentNumber}
          outstandingAmount={outstandingBalance}
          currency={resolvedCurrency}
          onPaid={(_result, _context) => onPaymentCompleted?.()}
        />
      ) : null}
    </div>
  );
};

export default InvoiceAdjustmentsPanel;
