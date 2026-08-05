export const isInsuranceClaimInvoice = (
  documentSubtype?: string | null
): boolean => String(documentSubtype ?? '').toUpperCase() === 'INSURANCE_CLAIM';

/** Patient-facing Pay is only for patient invoices — insurance claims settle via payer remittance. */
export const canCollectPatientPaymentOnInvoice = (
  outstandingBalance: number,
  invoiceId?: number | null,
  documentSubtype?: string | null
): boolean =>
  Number(outstandingBalance ?? 0) > 0 &&
  invoiceId != null &&
  !isInsuranceClaimInvoice(documentSubtype);

export const invoiceBalanceChipLabel = (
  isSettled: boolean,
  documentSubtype?: string | null
): string => {
  if (isSettled) {
    return 'Settled';
  }

  if (isInsuranceClaimInvoice(documentSubtype)) {
    return 'Awaiting payer';
  }

  return 'Balance due';
};

export const invoiceOutstandingLabel = (
  documentSubtype?: string | null
): string =>
  isInsuranceClaimInvoice(documentSubtype) ? 'Payer due' : 'Outstanding';

export const invoiceLineStatusLabel = (
  status?: string | null,
  documentSubtype?: string | null
): string => {
  const normalized = String(status ?? '').toUpperCase();

  if (isInsuranceClaimInvoice(documentSubtype)) {
    switch (normalized) {
      case 'PAID':
        return 'Paid by payer';
      case 'PARTIALLY_PAID':
        return 'Partial payer remittance';
      case 'PENDING':
        return 'Awaiting payer';
      default:
        return status ?? '-';
    }
  }

  switch (normalized) {
    case 'PAID':
      return 'Paid';
    case 'PARTIALLY_PAID':
      return 'Partial';
    case 'PENDING':
      return 'Unpaid';
    default:
      return status ?? '-';
  }
};
