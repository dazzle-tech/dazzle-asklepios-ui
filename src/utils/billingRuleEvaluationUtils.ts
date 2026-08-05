import type {
  BillingEventType,
  BillingItemType,
  BillingRuleEvaluationRequest,
  BillingRuleEvaluationResponse
} from '@/types/model-types-new';
import { BillingSettlementPath } from '@/types/model-types-new';
import { testTypeToBillingItemType } from '@/components/BillingRuleSelect/BillingRuleSelect';

export const buildBillingRuleEvaluationRequest = (
  billingItemType: BillingItemType,
  billingEvent: BillingEventType,
  itemIds: {
    serviceId?: number | null;
    procedureId?: number | null;
    diagnosticTestId?: number | null;
    brandMedicationId?: number | null;
  }
): BillingRuleEvaluationRequest => ({
  billingItemType,
  billingEvent,
  serviceId: itemIds.serviceId ?? null,
  procedureId: itemIds.procedureId ?? null,
  diagnosticTestId: itemIds.diagnosticTestId ?? null,
  brandMedicationId: itemIds.brandMedicationId ?? null
});

export const resolveDiagnosticBillingItemType = (
  orderType?: string | null
): BillingItemType | null => {
  if (!orderType) {
    return 'LABORATORY';
  }

  if (orderType === 'RADIOLOGY') {
    return 'RADIOLOGY';
  }

  if (orderType === 'PATHOLOGY') {
    return 'PATHOLOGY';
  }

  return testTypeToBillingItemType(orderType) ?? 'LABORATORY';
};

export const getBillingRuleNotificationSeverity = (
  evaluation: BillingRuleEvaluationResponse
): 'error' | 'warning' | 'info' | 'success' => {
  if (!evaluation.ruleFound) {
    return 'error';
  }

  if (!evaluation.eventMatches) {
    return 'info';
  }

  if (evaluation.settlementPath === BillingSettlementPath.LEDGER_DEBIT_AT_CHECKOUT) {
    return 'info';
  }

  return 'success';
};

export const formatBillingRuleEvaluationMessage = (
  evaluation: BillingRuleEvaluationResponse
): string => {
  if (!evaluation.ruleFound) {
    return (
      evaluation.message ??
      'No billing rule is configured for this item type. Add a default rule in Billing Rule Setup or assign a rule to the catalog item.'
    );
  }

  return evaluation.message ?? 'Billing rule resolved successfully.';
};

export const extractBillingRuleErrorMessage = (error: any): string => {
  const data = error?.data ?? error ?? {};
  const errorKey = String(data?.errorKey ?? data?.message ?? '');

  if (
    errorKey.includes('billingRule.notConfigured') ||
    errorKey.includes('defaultBillingRule.notfound') ||
    errorKey.includes('billingRule.notfound')
  ) {
    return (
      data?.detail ??
      data?.title ??
      data?.message ??
      'No billing rule is configured for this item. Add one in Billing Rule Setup before continuing.'
    );
  }

  const message = data?.detail ?? data?.title ?? data?.message;
  if (typeof message === 'string' && message.trim()) {
    return message.replace(/^error\./i, '');
  }

  return 'Unable to validate billing rule for this item.';
};
