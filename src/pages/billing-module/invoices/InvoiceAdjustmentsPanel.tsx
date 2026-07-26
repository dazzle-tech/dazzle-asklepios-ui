import React, { useMemo } from 'react';
import { Tag, Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';

import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import type {
  FinancialDocumentAdjustment,
  InvoiceAdjustmentSummary
} from '@/services/billing/financialDocumentAdjustmentService';

type InvoiceAdjustmentsPanelProps = {
  summary: InvoiceAdjustmentSummary | null | undefined;
  loading?: boolean;
  currency?: string;
  printDisabled?: boolean;
  onPrintAdjustment?: (adjustment: FinancialDocumentAdjustment) => void;
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

const InvoiceAdjustmentsPanel: React.FC<InvoiceAdjustmentsPanelProps> = ({
  summary,
  loading = false,
  currency = 'SAR',
  printDisabled = false,
  onPrintAdjustment
}) => {
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

      <MyTable data={adjustmentRows} columns={columns} loading={loading} />
    </div>
  );
};

export default InvoiceAdjustmentsPanel;
