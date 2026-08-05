import type { PaymentReceiptData } from '@/pages/patient/patient-profile/PatientQuickAppoinment/paymentPreviewUtils';
import type {
  CollectInvoiceBalanceResult,
  InvoiceAdjustmentSummary,
  InvoiceLineItem
} from '@/services/billing/financialDocumentAdjustmentService';
import type { PatientFinancialInvoice } from '@/services/billing/invoiceGenerationService';
import {
  resolvePatientDisplayName,
  resolvePatientMrn
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
          patientShare: Number(item.netAmount ?? 0)
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

  return {
    receiptNumber:
      paymentResult.paymentNumber ?? String(paymentResult.paymentId ?? '-'),
    transactionNumber: paymentResult.paymentTransactionNumber ?? '-',
    paymentDate: new Date().toLocaleString(),
    patientName: resolvePatientDisplayName(patient),
    patientMrn: resolvePatientMrn(patient),
    facilityName: 'Healthcare Facility',
    currency: resolvedCurrency,
    paymentMethod: paymentMethodLabel,
    items,
    totals: {
      grossAmount: netAmount,
      discountAmount: 0,
      exemptionAmount: 0,
      taxAmount: 0,
      netAmount,
      patientResponsibilityAmount: netAmount,
      insuranceResponsibilityAmount: 0,
      patientOutstandingAmount: Number(paymentResult.outstandingAmount ?? 0),
      isPreview: false
    },
    notes: `Invoice payment for ${invoice?.documentNumber ?? summary?.documentNumber ?? 'invoice'}`
  };
};
