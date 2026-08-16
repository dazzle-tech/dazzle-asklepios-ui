import type {
  CreateAdjustmentRequest,
  CreateDiscountCreditNoteRequest,
  InvoiceLineAdjustmentRequest
} from '@/services/billing/financialDocumentAdjustmentService';

const normalizeAction = (action?: string) => String(action ?? '').toUpperCase();

export const sanitizeAdjustmentLine = (
  line: InvoiceLineAdjustmentRequest
): Record<string, unknown> => {
  const action = normalizeAction(line.action);

  switch (action) {
    case 'REMOVE':
      return {
        action: 'REMOVE',
        documentItemId: Number(line.documentItemId)
      };
    case 'PARTIAL_CREDIT':
      return {
        action: 'PARTIAL_CREDIT',
        documentItemId: Number(line.documentItemId),
        amount: Number(line.amount)
      };
    case 'REDUCE':
      return {
        action: 'REDUCE',
        documentItemId: Number(line.documentItemId),
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice)
      };
    case 'ADD':
      return {
        action: 'ADD',
        chargeLineId: Number(line.chargeLineId)
      };
    case 'INCREASE':
      return {
        action: 'INCREASE',
        documentItemId: Number(line.documentItemId),
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice)
      };
    case 'ADD_NEW': {
      const billingItemType = String(line.billingItemType ?? '').toUpperCase();
      const payload: Record<string, unknown> = {
        action: 'ADD_NEW',
        billingItemType,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        currency: line.currency,
        serviceSource: line.serviceSource ?? 'SERVICE_AND_PRODUCT'
      };

      if (billingItemType === 'SERVICE' && line.serviceId != null) {
        payload.serviceId = Number(line.serviceId);
      }
      if (billingItemType === 'MEDICATION' && line.brandMedicationId != null) {
        payload.brandMedicationId = Number(line.brandMedicationId);
      }
      if (
        ['LABORATORY', 'RADIOLOGY'].includes(billingItemType) &&
        line.diagnosticTestId != null
      ) {
        payload.diagnosticTestId = Number(line.diagnosticTestId);
      }
      if (billingItemType === 'PROCEDURE' && line.procedureId != null) {
        payload.procedureId = Number(line.procedureId);
      }
      if (line.notes?.trim()) {
        payload.notes = line.notes.trim();
      }

      return payload;
    }
    default:
      return { ...line };
  }
};

export const sanitizeAdjustmentRequest = (
  body: CreateAdjustmentRequest
): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {
    lines: body.lines.map(sanitizeAdjustmentLine)
  };

  if (body.reason?.trim()) {
    sanitized.reason = body.reason.trim();
  }

  if (body.facilityId != null) {
    sanitized.facilityId = Number(body.facilityId);
  }

  if (body.requestId?.trim()) {
    sanitized.requestId = body.requestId.trim();
  }

  return sanitized;
};

export const sanitizeDiscountCreditNoteRequest = (
  body: CreateDiscountCreditNoteRequest
): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {
    scope: body.scope
  };

  if (body.documentItemId != null) {
    sanitized.documentItemId = Number(body.documentItemId);
  }
  if (body.discountAmount != null) {
    sanitized.discountAmount = Number(body.discountAmount);
  }
  if (body.discountPercent != null) {
    sanitized.discountPercent = Number(body.discountPercent);
  }
  if (body.reason?.trim()) {
    sanitized.reason = body.reason.trim();
  }
  if (body.facilityId != null) {
    sanitized.facilityId = Number(body.facilityId);
  }
  if (body.requestId?.trim()) {
    sanitized.requestId = body.requestId.trim();
  }

  return sanitized;
};
