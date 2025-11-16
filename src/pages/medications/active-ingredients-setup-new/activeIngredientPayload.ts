import { ActiveIngredient } from '@/types/model-types-new';

const toOptionalString = (value?: string | null): string | null => {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toOptionalNumber = (value?: string | number | null): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toBoolean = (value?: boolean | null): boolean => value ?? false;

export const sanitizeActiveIngredient = (input: ActiveIngredient): ActiveIngredient => ({
  id: input.id,
  name: (input.name ?? '').trim(),
  drugClassId: toOptionalNumber(input.drugClassId),
  atcCode: toOptionalString(input.atcCode),
  otc: toBoolean(input.otc),
  hasSynonyms: toBoolean(input.hasSynonyms),
  antimicrobial: toBoolean(input.antimicrobial),
  highRiskMed: toBoolean(input.highRiskMed),
  abortiveMedication: toBoolean(input.abortiveMedication),
  laborInducingMed: toBoolean(input.laborInducingMed),
  isControlled: toBoolean(input.isControlled),
  controlled: input.controlled ?? null,
  hasBlackBoxWarning: toBoolean(input.hasBlackBoxWarning),
  blackBoxWarning: toOptionalString(
    typeof input.blackBoxWarning === 'string' ? input.blackBoxWarning : ''
  ),
  isActive: toBoolean(input.isActive ?? true),
  toxicityMaximumDose: toOptionalString(input.toxicityMaximumDose),
  toxicityMaximumDosePerUnit: toOptionalString(
    typeof input.toxicityMaximumDosePerUnit === 'string'
      ? input.toxicityMaximumDosePerUnit
      : input.toxicityMaximumDosePerUnit != null
      ? String(input.toxicityMaximumDosePerUnit)
      : null
  ),
  toxicityDetails: toOptionalString(input.toxicityDetails),
  mechanismOfAction: toOptionalString(input.mechanismOfAction),
  pharmaAbsorption: toOptionalString(input.pharmaAbsorption),
  pharmaRouteOfElimination: toOptionalString(input.pharmaRouteOfElimination),
  pharmaVolumeOfDistribution: toOptionalString(input.pharmaVolumeOfDistribution),
  pharmaHalfLife: toOptionalString(input.pharmaHalfLife),
  pharmaProteinBinding: toOptionalString(input.pharmaProteinBinding),
  pharmaClearance: toOptionalString(input.pharmaClearance),
  pharmaMetabolism: toOptionalString(input.pharmaMetabolism),
  pregnancyCategory: toOptionalString(input.pregnancyCategory),
  pregnancyNotes: toOptionalString(input.pregnancyNotes),
  lactationRisk: toOptionalString(input.lactationRisk),
  lactationRiskNotes: toOptionalString(input.lactationRiskNotes),
  doseAdjustmentRenal: toBoolean(input.doseAdjustmentRenal),
  doseAdjustmentRenalOne: toOptionalString(input.doseAdjustmentRenalOne),
  doseAdjustmentRenalTwo: toOptionalString(input.doseAdjustmentRenalTwo),
  doseAdjustmentRenalThree: toOptionalString(input.doseAdjustmentRenalThree),
  doseAdjustmentRenalFour: toOptionalString(input.doseAdjustmentRenalFour),
  doseAdjustmentHepatic: toBoolean(input.doseAdjustmentHepatic),
  doseAdjustmentPugA: toOptionalString(input.doseAdjustmentPugA),
  doseAdjustmentPugB: toOptionalString(input.doseAdjustmentPugB),
  doseAdjustmentPugC: toOptionalString(input.doseAdjustmentPugC)
});

