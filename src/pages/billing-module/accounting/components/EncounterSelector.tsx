import React from 'react';
import { Loader, Tag, Text } from 'rsuite';

import type { PatientEncounter } from '@/types/model-types-new';
import {
  formatBillingEnum,
  formatBillingTimestamp,
  formatEncounterDisplayLabel,
  formatEncounterLifecycleLabel,
  formatEncounterTreatmentLabel,
  formatMoney
} from '../utils/billingAccountingUtils';

type EncounterSelectorProps = {
  encounters: PatientEncounter[];
  selectedEncounterId: number | null;
  loading?: boolean;
  onSelect: (encounterId: number) => void;
  remainingToPay?: number;
  remainingLoading?: boolean;
  currency?: string;
};

const EncounterSelector: React.FC<EncounterSelectorProps> = ({
  encounters,
  selectedEncounterId,
  loading = false,
  onSelect,
  remainingToPay = 0,
  remainingLoading = false,
  currency = 'SAR'
}) => {
  if (loading) {
    return (
      <div className="billing-accounting__empty">
        <Loader size="sm" content="Loading encounters..." />
      </div>
    );
  }

  if (!encounters.length) {
    return (
      <div className="billing-accounting__empty">
        No encounters found for this patient.
      </div>
    );
  }

  return (
    <div className="billing-accounting__encounter-list">
      {encounters.map(encounter => {
        const isActive = encounter.id === selectedEncounterId;

        return (
          <button
            key={encounter.id}
            type="button"
            className={`billing-accounting__encounter-item${
              isActive ? ' billing-accounting__encounter-item--active' : ''
            }`}
            onClick={() => onSelect(encounter.id)}
          >
            <Text weight="semibold">
              {formatEncounterDisplayLabel(encounter) ??
                'Encounter'}
            </Text>
            <div className="billing-accounting__encounter-meta">
              <span>{formatBillingEnum(encounter.encounterType)}</span>
              <span>{formatBillingTimestamp(encounter.encounterDate?.toString())}</span>
              <Tag size="sm">{formatEncounterLifecycleLabel(encounter)}</Tag>
              <Tag size="sm" color="blue">
                {formatEncounterTreatmentLabel(encounter)}
              </Tag>
              {isActive && (
                <Tag
                  size="sm"
                  color={remainingLoading ? 'cyan' : remainingToPay > 0 ? 'orange' : 'green'}
                >
                  Remaining{' '}
                  {remainingLoading ? '—' : formatMoney(remainingToPay, currency)}
                </Tag>
              )}
              {encounter.startedDate && (
                <span>Started {formatBillingTimestamp(encounter.startedDate)}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default EncounterSelector;
