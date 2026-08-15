import type {
  InsuranceBenefitRule,
  WaseelBenefitDetail,
  WaseelCoverageDetails
} from '@/types/model-types-new';

const normalize = (value?: string | null): string =>
  (value ?? '').trim().toLowerCase();

const hasCopayPercent = (rule: InsuranceBenefitRule): boolean =>
  rule.patientCopaymentPercentage != null &&
  Number(rule.patientCopaymentPercentage) > 0;

const hasCopayValues = (rule: InsuranceBenefitRule): boolean =>
  hasCopayPercent(rule) || rule.patientMaximumCopayment != null;

const isCostBeneficiaryRule = (rule: InsuranceBenefitRule): boolean =>
  normalize(rule.benefitCategory) === 'cost beneficiary';

const isOutpatientRule = (rule: InsuranceBenefitRule): boolean => {
  const itemName = normalize(rule.itemName);
  const category = normalize(rule.benefitCategory);
  const providerType = normalize(rule.providerType);

  return (
    providerType.includes('outpatient') ||
    itemName.includes('outpatient') ||
    category.includes('outpatient') ||
    providerType.includes('other_healthcare')
  );
};

const isInNetworkRule = (rule: InsuranceBenefitRule): boolean => {
  if (normalize(rule.networkType) === 'in_network') {
    return true;
  }

  const itemName = normalize(rule.itemName);
  return itemName.includes('in network') || itemName.includes('in-network');
};

const ruleSpecificityScore = (rule: InsuranceBenefitRule): number => {
  let score = 0;

  if (hasCopayPercent(rule)) {
    score += 10;
  }
  if (rule.patientMaximumCopayment != null) {
    score += 4;
  }
  if (isInNetworkRule(rule)) {
    score += 8;
  }
  if (isOutpatientRule(rule)) {
    score += 8;
  }
  if (rule.itemName) {
    score += 2;
  }

  return score;
};

const compareRules = (
  left: InsuranceBenefitRule,
  right: InsuranceBenefitRule
): number => ruleSpecificityScore(left) - ruleSpecificityScore(right);

const findBestOutpatientRule = (
  rules: InsuranceBenefitRule[]
): InsuranceBenefitRule | null =>
  rules
    .filter(rule => !rule.globalDefault)
    .filter(rule => !isCostBeneficiaryRule(rule))
    .filter(hasCopayValues)
    .filter(isOutpatientRule)
    .filter(isInNetworkRule)
    .sort(compareRules)
    .at(-1) ?? null;

export const selectPreferredBillingBenefitRule = (
  rules?: InsuranceBenefitRule[] | null
): InsuranceBenefitRule | null => {
  if (!rules?.length) {
    return null;
  }

  const normalizedRules = rules.filter(rule => rule != null);

  const outpatientRule = findBestOutpatientRule(normalizedRules);
  if (outpatientRule && hasCopayPercent(outpatientRule)) {
    return outpatientRule;
  }

  const explicitGlobal = normalizedRules
    .filter(rule => rule.globalDefault)
    .filter(hasCopayValues)
    .sort(compareRules)
    .at(-1);

  if (explicitGlobal) {
    return explicitGlobal;
  }

  if (outpatientRule) {
    return outpatientRule;
  }

  return (
    normalizedRules
      .filter(rule => !rule.globalDefault)
      .filter(rule => !isCostBeneficiaryRule(rule))
      .filter(hasCopayValues)
      .filter(isInNetworkRule)
      .sort(compareRules)
      .at(-1) ?? null
  );
};

export const resolveDisplayedCopaymentPercent = (
  coverage: WaseelCoverageDetails
): number | null => {
  if (coverage.copaymentPercent != null) {
    return Number(coverage.copaymentPercent);
  }

  const preferredRule = selectPreferredBillingBenefitRule(
    coverage.benefitRules
  );

  if (preferredRule?.patientCopaymentPercentage != null) {
    return Number(preferredRule.patientCopaymentPercentage);
  }

  return null;
};

export const resolveDisplayedCopaymentCap = (
  coverage: WaseelCoverageDetails
): number | null => {
  if (coverage.copaymentCap != null) {
    return Number(coverage.copaymentCap);
  }

  const preferredRule = selectPreferredBillingBenefitRule(
    coverage.benefitRules
  );

  if (preferredRule?.patientMaximumCopayment != null) {
    return Number(preferredRule.patientMaximumCopayment);
  }

  return null;
};

export const formatNetworkLabel = (
  networkType?: string | null,
  itemName?: string | null,
  network?: string | null
): string => {
  if (networkType === 'IN_NETWORK') {
    return 'In Network';
  }
  if (networkType === 'OUT_OF_NETWORK') {
    return 'Out of Network';
  }

  const normalizedItem = normalize(itemName);
  if (normalizedItem.includes('in network') || normalizedItem.includes('in-network')) {
    return 'In Network';
  }
  if (
    normalizedItem.includes('out of network') ||
    normalizedItem.includes('out-of-network')
  ) {
    return 'Out of Network';
  }

  return network?.trim() || '-';
};

export const formatProviderTypeLabel = (
  providerType?: string | null
): string => {
  if (!providerType) {
    return '-';
  }

  return providerType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
};

export const formatBenefitRuleLabel = (rule: InsuranceBenefitRule): string => {
  const parts = [
    rule.itemName,
    rule.benefitCategory &&
    rule.benefitCategory !== '__GLOBAL__'
      ? rule.benefitCategory
      : null
  ].filter(Boolean);

  return parts.join(' · ') || 'Benefit rule';
};

export const formatBenefitValue = (
  value?: string | number | null,
  unit?: string | null,
  currency?: string | null
): string => {
  if (value == null || value === '') {
    return '-';
  }

  const suffix = currency || unit;
  return suffix ? `${value} ${suffix}` : String(value);
};

export const formatRawBenefitValue = (benefit: WaseelBenefitDetail): string => {
  if (benefit.value == null || benefit.value === '') {
    return benefit.unit ?? '-';
  }

  return benefit.unit
    ? `${benefit.value} ${benefit.unit}`
    : benefit.value;
};

export const isSameBenefitRule = (
  left: InsuranceBenefitRule,
  right?: InsuranceBenefitRule | null
): boolean => {
  if (!right) {
    return false;
  }

  if (left.id != null && right.id != null) {
    return left.id === right.id;
  }

  return (
    left.benefitCategory === right.benefitCategory &&
    left.itemName === right.itemName &&
    left.networkType === right.networkType &&
    left.providerType === right.providerType
  );
};

export const sortBenefitRulesForDisplay = (
  rules: InsuranceBenefitRule[],
  preferredRule?: InsuranceBenefitRule | null
): InsuranceBenefitRule[] =>
  [...rules].sort((left, right) => {
    const leftPreferred = isSameBenefitRule(left, preferredRule);
    const rightPreferred = isSameBenefitRule(right, preferredRule);

    if (leftPreferred !== rightPreferred) {
      return leftPreferred ? -1 : 1;
    }

    if (Boolean(left.globalDefault) !== Boolean(right.globalDefault)) {
      return left.globalDefault ? 1 : -1;
    }

    return compareRules(left, right);
  });

export const isPatientCopayBenefitType = (
  typeDisplay?: string | null,
  typeCode?: string | null
): boolean => {
  const display = normalize(typeDisplay);
  const code = normalize(typeCode);

  return (
    display.includes('copayment') ||
    display.includes('co-payment') ||
    code.includes('copay')
  );
};

export const classifyBenefitTypeLabel = (
  typeDisplay?: string | null,
  typeCode?: string | null
): string => {
  const display = normalize(typeDisplay);
  const code = normalize(typeCode);

  if (display.includes('copayment percent') || code.includes('percent')) {
    return 'Patient Copay %';
  }
  if (display.includes('copayment maximum') && display.includes('service')) {
    return 'Patient Copay Max / Service';
  }
  if (display.includes('maximum benefit allowable')) {
    return 'Insurance Max Benefit';
  }
  if (display.includes('approval')) {
    return 'Insurance Approval Limit';
  }

  return typeDisplay ?? typeCode ?? 'Benefit';
};

export type InsuranceCopayInput = {
  copaymentPercent?: number | null;
  copaymentCap?: number | null;
};

const toCopayAmount = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const resolveInsuranceCopayFromCoverage = (
  coverage?: WaseelCoverageDetails | null
): InsuranceCopayInput | null => {
  if (!coverage) {
    return null;
  }

  const copaymentPercent = resolveDisplayedCopaymentPercent(coverage);
  const copaymentCap = resolveDisplayedCopaymentCap(coverage);

  if (copaymentPercent == null && copaymentCap == null) {
    return null;
  }

  return {
    copaymentPercent,
    copaymentCap
  };
};

export const resolveInsuranceCopayFromPlan = (
  plan?: {
    patientShare?: number | string | null;
    maxLimit?: number | string | null;
  } | null
): InsuranceCopayInput | null => {
  if (!plan) {
    return null;
  }

  const copaymentPercent = toCopayAmount(plan.patientShare);
  const copaymentCap = toCopayAmount(plan.maxLimit);

  if (copaymentPercent == null && copaymentCap == null) {
    return null;
  }

  return {
    copaymentPercent,
    copaymentCap
  };
};

/**
 * Patient copay from plan percent with optional per-service cap.
 * Matches backend InsuranceCalculationService patient-side logic.
 */
export const calculateInsuranceSplitFromCopay = (
  netAmount: number,
  copay?: InsuranceCopayInput | null
): { patientShare: number; insuranceShare: number } => {
  const net = Number.isFinite(Number(netAmount)) ? Number(netAmount) : 0;

  if (net <= 0) {
    return { patientShare: 0, insuranceShare: 0 };
  }

  if (!copay) {
    return { patientShare: net, insuranceShare: 0 };
  }

  const percent = toCopayAmount(copay.copaymentPercent);
  const cap = toCopayAmount(copay.copaymentCap);
  const hasPercent = percent != null && percent > 0;
  const hasCap = cap != null && cap > 0;

  if (!hasPercent && !hasCap) {
    return { patientShare: net, insuranceShare: 0 };
  }

  let patientShare = hasPercent ? (net * percent) / 100 : 0;

  if (hasCap) {
    patientShare = Math.min(patientShare, cap);
  }

  patientShare = Math.min(Math.max(0, patientShare), net);

  return {
    patientShare,
    insuranceShare: Math.max(0, net - patientShare)
  };
};
