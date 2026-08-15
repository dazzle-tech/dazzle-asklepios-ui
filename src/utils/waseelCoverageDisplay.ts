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
    category.includes('outpatient')
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

const firstNonBlank = (
  ...values: Array<string | number | null | undefined>
): string | undefined => {
  for (const value of values) {
    if (value == null) {
      continue;
    }

    const text = String(value).trim();
    if (text) {
      return text;
    }
  }

  return undefined;
};

export const overlayPatientInsuranceWithWaseelCoverage = <
  T extends Record<string, any>
>(
  insurance: T | null | undefined,
  coverage?: WaseelCoverageDetails | null
): T | null | undefined => {
  if (!insurance || !coverage) {
    return insurance;
  }

  return {
    ...insurance,
    memberCardId:
      firstNonBlank(coverage.memberId, insurance.memberCardId) ??
      insurance.memberCardId,
    policyNumber:
      firstNonBlank(coverage.policyNumber, insurance.policyNumber) ??
      insurance.policyNumber,
    policyHolderName:
      firstNonBlank(coverage.policyHolder, insurance.policyHolderName) ??
      insurance.policyHolderName,
    policyClassName:
      firstNonBlank(coverage.policyClassName, insurance.policyClassName) ??
      insurance.policyClassName,
    expirationDate:
      firstNonBlank(coverage.expiryDate, insurance.expirationDate) ??
      insurance.expirationDate,
    planCode:
      firstNonBlank(coverage.planCode, insurance.planCode) ??
      insurance.planCode,
    groupName:
      firstNonBlank(coverage.groupName, insurance.groupName) ??
      insurance.groupName,
    groupNumber:
      firstNonBlank(coverage.groupNumber, insurance.groupNumber) ??
      insurance.groupNumber,
    payerName:
      firstNonBlank(coverage.payerName, insurance.payerName) ??
      insurance.payerName
  };
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
