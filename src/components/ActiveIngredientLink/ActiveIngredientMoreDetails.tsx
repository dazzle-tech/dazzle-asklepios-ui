import React, { useEffect } from 'react';
import { Loader } from 'rsuite';
import Translate from '@/components/Translate';
import LovValueCell from '@/components/LovValueCell';
import { ActiveIngredient } from '@/types/model-types-new';
import { useGetActiveIngredientsByIdsMutation } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useGetByActiveIngredientIdQuery as useGetDrugInteractionsQuery } from '@/services/setup/activeIngredients/activeIngredientDrugInteractionService';
import { useGetFoodInteractionsByActiveIngredientIdQuery } from '@/services/setup/activeIngredients/ActiveIngredientFoodInteraction';
import { useGetAdverseEffectsByActiveIngredientIdQuery } from '@/services/setup/activeIngredients/activeIngredientAdverseEffectService';
import { useGetActiveIngredientSpecialPopulationsQuery } from '@/services/setup/activeIngredients/activeIngredientSpecialPopulationService';
import { useGetActiveIngredientPreRequestedTestsQuery } from '@/services/setup/activeIngredients/activeIngredientPreRequestedTestService';
import { useGetActiveIngredientSynonymsQuery } from '@/services/setup/activeIngredients/activeIngredientSynonymsService';

type Pair = { label: string; value?: string | null };

const hasText = (value?: string | null) => typeof value === 'string' && value.trim() !== '';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="ai-card__section">
    <div className="ai-card__section-title">
      <Translate>{title}</Translate>
    </div>
    {children}
  </div>
);

const PairList = ({ items }: { items: Pair[] }) => (
  <div className="ai-card__grid">
    {items.map(item => (
      <div key={item.label} className="ai-card__field">
        <div className="ai-card__field-label">
          <Translate>{item.label}</Translate>
        </div>
        <div className="ai-card__field-value">{item.value}</div>
      </div>
    ))}
  </div>
);

const withText = (items: Pair[]) => items.filter(item => hasText(item.value));

// Everything not shown on the short card. Loaded only when the user expands, so opening the card stays light.
const ActiveIngredientMoreDetails = ({
  ai,
  onRendered
}: {
  ai: ActiveIngredient;
  onRendered?: () => void;
}) => {
  const id = ai.id as number;

  const synonyms = useGetActiveIngredientSynonymsQuery(id);
  const drugInteractions = useGetDrugInteractionsQuery(id);
  const foodInteractions = useGetFoodInteractionsByActiveIngredientIdQuery(id);
  const adverseEffects = useGetAdverseEffectsByActiveIngredientIdQuery(id);
  const specialPopulations = useGetActiveIngredientSpecialPopulationsQuery(id);
  const preRequestedTests = useGetActiveIngredientPreRequestedTestsQuery(id);
  const [getIngredientsByIds, { data: interactedIngredients }] = useGetActiveIngredientsByIdsMutation();

  const interactedIds = (drugInteractions.data ?? [])
    .map(row => row.interactedIngredientId)
    .filter(value => value != null);
  const interactedKey = interactedIds.join(',');

  useEffect(() => {
    if (interactedIds.length) getIngredientsByIds(interactedIds);
    // interactedKey stands for the id list, which is a new array on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactedKey, getIngredientsByIds]);

  const loading = [
    synonyms,
    drugInteractions,
    foodInteractions,
    adverseEffects,
    specialPopulations,
    preRequestedTests
  ].some(query => query.isLoading);

  // The card grows when the details appear, so its position is recalculated
  useEffect(() => {
    const frame = requestAnimationFrame(() => onRendered?.());
    return () => cancelAnimationFrame(frame);
  }, [loading, interactedIngredients, onRendered]);

  if (loading) {
    return (
      <div className="ai-card__state">
        <Loader size="sm" />
      </div>
    );
  }

  const interactedName = (interactedId: number) =>
    interactedIngredients?.find(item => item.id === interactedId)?.name ?? `#${interactedId}`;

  const pharmacokinetics = withText([
    { label: 'Absorption', value: ai.pharmaAbsorption },
    { label: 'Volume of Distribution', value: ai.pharmaVolumeOfDistribution },
    { label: 'Protein Binding', value: ai.pharmaProteinBinding },
    { label: 'Metabolism', value: ai.pharmaMetabolism },
    { label: 'Clearance', value: ai.pharmaClearance },
    { label: 'Route of Elimination', value: ai.pharmaRouteOfElimination }
  ]);

  const renal = withText([
    { label: 'Stage 1', value: ai.doseAdjustmentRenalOne },
    { label: 'Stage 2', value: ai.doseAdjustmentRenalTwo },
    { label: 'Stage 3', value: ai.doseAdjustmentRenalThree },
    { label: 'Stage 4', value: ai.doseAdjustmentRenalFour }
  ]);

  const hepatic = withText([
    { label: 'Child-Pugh A', value: ai.doseAdjustmentPugA },
    { label: 'Child-Pugh B', value: ai.doseAdjustmentPugB },
    { label: 'Child-Pugh C', value: ai.doseAdjustmentPugC }
  ]);

  const synonymRows = synonyms.data ?? [];
  const drugRows = drugInteractions.data ?? [];
  const foodRows = foodInteractions.data ?? [];
  const adverseRows = adverseEffects.data ?? [];
  const populationRows = specialPopulations.data ?? [];
  const testRows = preRequestedTests.data ?? [];

  const nothing =
    !synonymRows.length &&
    !drugRows.length &&
    !foodRows.length &&
    !adverseRows.length &&
    !populationRows.length &&
    !testRows.length &&
    !pharmacokinetics.length &&
    !renal.length &&
    !hepatic.length &&
    !hasText(ai.mechanismOfAction) &&
    !hasText(ai.pregnancyNotes) &&
    !hasText(ai.lactationRiskNotes) &&
    !hasText(ai.toxicityDetails);

  if (nothing) {
    return (
      <div className="ai-card__state">
        <Translate>No more details recorded</Translate>
      </div>
    );
  }

  return (
    <div className="ai-card__more">
      {synonymRows.length > 0 && (
        <Section title="Synonyms">
          <div className="ai-card__flags">
            {synonymRows.map(row => (
              <span key={row.id} className="ai-card__flag ai-card__flag--neutral">
                {row.synonym}
              </span>
            ))}
          </div>
        </Section>
      )}

      {hasText(ai.mechanismOfAction) && (
        <Section title="Mechanism of Action">
          <div className="ai-card__paragraph">{ai.mechanismOfAction}</div>
        </Section>
      )}

      {drugRows.length > 0 && (
        <Section title="Drug Interactions">
          {drugRows.map(row => (
            <div key={row.id} className="ai-card__row">
              <div className="ai-card__row-head">
                <span className="ai-card__row-title">{interactedName(row.interactedIngredientId)}</span>
                {row.severity && (
                  <span className="ai-card__severity">
                    <LovValueCell valueKey={row.severity} />
                  </span>
                )}
              </div>
              {row.description && <div className="ai-card__row-text">{row.description}</div>}
            </div>
          ))}
        </Section>
      )}

      {foodRows.length > 0 && (
        <Section title="Food Interactions">
          {foodRows.map(row => (
            <div key={row.id} className="ai-card__row">
              <div className="ai-card__row-head">
                <span className="ai-card__row-title">{row.food}</span>
                {row.severity && (
                  <span className="ai-card__severity">
                    <LovValueCell valueKey={row.severity} />
                  </span>
                )}
              </div>
              {row.description && <div className="ai-card__row-text">{row.description}</div>}
            </div>
          ))}
        </Section>
      )}

      {adverseRows.length > 0 && (
        <Section title="Adverse Effects">
          <div className="ai-card__flags">
            {adverseRows.map((row: any) => (
              <span key={row.id} className="ai-card__flag ai-card__flag--neutral">
                {row.adverseEffect === 'Other' && row.otherDescription
                  ? row.otherDescription
                  : row.adverseEffect}
              </span>
            ))}
          </div>
        </Section>
      )}

      {populationRows.length > 0 && (
        <Section title="Special Populations">
          {populationRows.map((row: any) => (
            <div key={row.id} className="ai-card__row">
              <div className="ai-card__row-title">
                <LovValueCell valueKey={row.additionalPopulation ?? row.specialPopulation} />
              </div>
              {row.considerations && <div className="ai-card__row-text">{row.considerations}</div>}
            </div>
          ))}
        </Section>
      )}

      {(hasText(ai.pregnancyNotes) || hasText(ai.lactationRiskNotes)) && (
        <Section title="Pregnancy & Breastfeeding Notes">
          <PairList
            items={withText([
              { label: 'Pregnancy', value: ai.pregnancyNotes },
              { label: 'Breastfeeding', value: ai.lactationRiskNotes }
            ])}
          />
        </Section>
      )}

      {renal.length > 0 && (
        <Section title="Renal Dose Adjustment">
          <PairList items={renal} />
        </Section>
      )}

      {hepatic.length > 0 && (
        <Section title="Hepatic Dose Adjustment">
          <PairList items={hepatic} />
        </Section>
      )}

      {pharmacokinetics.length > 0 && (
        <Section title="Pharmacokinetics">
          <PairList items={pharmacokinetics} />
        </Section>
      )}

      {hasText(ai.toxicityDetails) && (
        <Section title="Toxicity">
          <div className="ai-card__paragraph">{ai.toxicityDetails}</div>
        </Section>
      )}

      {testRows.length > 0 && (
        <Section title="Tests Required Before Use">
          <div className="ai-card__flags">
            {testRows.map(row => (
              <span key={row.id} className="ai-card__flag ai-card__flag--info" title={row.description}>
                {row.name}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
};

export default ActiveIngredientMoreDetails;
