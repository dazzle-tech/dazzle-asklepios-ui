import type { PaymentReceiptData } from '@/pages/patient/patient-profile/PatientQuickAppoinment/paymentPreviewUtils';
import type {
  CollectInvoiceBalanceResult,
  InvoiceAdjustmentSummary,
  InvoiceLineItem
} from '@/services/billing/financialDocumentAdjustmentService';
import type { PatientFinancialInvoice } from '@/services/billing/invoiceGenerationService';
import {
  resolvePatientDisplayName,
  resolvePatientMrn,
  resolvePaymentReceiptNumber
} from '@/pages/billing-module/accounting/utils/billingAccountingUtils';

export const buildInvoicePaymentReceipt = ({
  paymentResult,
  invoice,
  summary,
  lineItems,
  patient,
  currency = 'SAR',
  paymentMethodLabel = 'Payment'
}: {
  paymentResult: CollectInvoiceBalanceResult;
  invoice?: PatientFinancialInvoice | null;
  summary?: InvoiceAdjustmentSummary | null;
  lineItems?: InvoiceLineItem[];
  patient?: any;
  currency?: string;
  paymentMethodLabel?: string;
}): PaymentReceiptData => {
  const amount = Number(paymentResult.collectedAmount ?? 0);
  const resolvedCurrency = String(paymentResult.currency ?? currency);

  const payableLines = (lineItems ?? []).filter(
    item => Number(item.remainingAmount ?? 0) >= 0
  );

  const items =
    payableLines.length > 0
      ? payableLines.map(item => ({
          name: item.itemDescription ?? item.itemCode ?? `Line #${item.id}`,
          type: 'INVOICE_LINE',
          quantity: Number(item.quantity ?? 1),
          unitPrice: Number(item.netAmount ?? 0) / Math.max(1, Number(item.quantity ?? 1)),
          netAmount: Number(item.netAmount ?? 0),
          patientShare: Number(item.netAmount ?? 0),
          taxAmount: Number(item.taxAmount ?? 0)
        }))
      : [
          {
            name: `Invoice balance ${invoice?.documentNumber ?? summary?.documentNumber ?? ''}`.trim(),
            type: 'INVOICE',
            quantity: 1,
            unitPrice: amount,
            netAmount: amount,
            patientShare: amount
          }
        ];

  const netAmount = amount;
  // Document lines already carry only this party's tax; a partial payment
  // shows the matching part of it.
  const linesNet = payableLines.reduce(
    (sum, item) => sum + Number(item.netAmount ?? 0),
    0
  );
  const linesTax = payableLines.reduce(
    (sum, item) => sum + Number(item.taxAmount ?? 0),
    0
  );
  const taxAmount =
    linesNet > 0 ? linesTax * Math.min(1, netAmount / linesNet) : 0;

  return {
    receiptNumber: resolvePaymentReceiptNumber(paymentResult),
    transactionNumber: paymentResult.paymentTransactionNumber ?? '-',
    paymentDate: new Date().toLocaleString(),
    patientName: resolvePatientDisplayName(patient),
    patientMrn: resolvePatientMrn(patient),
    facilityName: 'Healthcare Facility',
    currency: resolvedCurrency,
    paymentMethod: paymentMethodLabel,
    items,
    totals: {
      grossAmount: Math.max(0, netAmount - taxAmount),
      discountAmount: 0,
      exemptionAmount: 0,
      taxAmount,
      netAmount,
      patientResponsibilityAmount: netAmount,
      insuranceResponsibilityAmount: 0,
      patientOutstandingAmount: Number(paymentResult.outstandingAmount ?? 0),
      isPreview: false
    },
    notes: `Invoice payment for ${invoice?.documentNumber ?? summary?.documentNumber ?? 'invoice'}`
  };
};
