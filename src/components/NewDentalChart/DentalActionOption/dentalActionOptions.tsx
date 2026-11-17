import React from 'react';

import Translate from '@/components/Translate';

import './DentalActionOption.less';

/**
 * Single source for the dental Action selector used by the Tooth Details (Chart) form and
 * Complete Treatment: same list, ordering, type label and menu item.
 *
 * Active actions only, conditions first, then treatments, each alphabetically by description.
 * The currently selected action is kept even if it has since been deactivated, so a saved
 * value still shows its label.
 */
export const buildDentalActionOptions = (
  dentalActions: any[] | null | undefined,
  selectedId?: number | string | null
) =>
  (dentalActions ?? [])
    .filter(
      action =>
        action.isActive !== false ||
        (selectedId != null && String(action.id) === String(selectedId))
    )
    .sort((a, b) => {
      const typeDifference =
        Number(a.type === 'TREATMENT') - Number(b.type === 'TREATMENT');

      return (
        typeDifference ||
        (a.description ?? '').localeCompare(b.description ?? '')
      );
    });

export const renderDentalActionMenuItem = (_label: any, action: any) => {
  const isTreatment = action?.type === 'TREATMENT';

  return (
    <div className="dental-action-option">
      <span>{action?.description}</span>

      <span
        className={
          isTreatment
            ? 'dental-action-type dental-action-type--treatment'
            : 'dental-action-type dental-action-type--condition'
        }
      >
        <Translate>{isTreatment ? 'Treatment' : 'Condition'}</Translate>
      </span>
    </div>
  );
};
