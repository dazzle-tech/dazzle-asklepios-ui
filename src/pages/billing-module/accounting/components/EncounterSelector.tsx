import React from 'react';
import { Loader, Tag, Text } from 'rsuite';

import type { PatientEncounter } from '@/types/model-types-new';
import { formatBillingTimestamp, formatMoney } from '../utils/billingAccountingUtils';
import {
  getEncounterLifecycleStatus,
  getEncounterTreatmentStatus
} from '@/utils/encounterStatusHelpers';

type EncounterSelectorProps = {
  encounters: PatientEncounter[];
  selectedEncounterId: number | null;
  loading?: boolean;
  onSelect: (encounterId: number) => void;
  remainingToPay?: number;
  currency?: string;
};

const EncounterSelector: React.FC<EncounterSelectorProps> = ({
  encounters,
  selectedEncounterId,
  loading = false,
  onSelect,
  remainingToPay = 0,
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
        const encounterAny = encounter as PatientEncounter & {
          encounterNumber?: string | null;
          createdAt?: string | null;
        };
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
              {encounterAny.encounterNumber
                ? `#${encounterAny.encounterNumber}`
                : `Encounter #${encounter.id}`}
            </Text>
            <div className="billing-accounting__encounter-meta">
              <span>{encounter.encounterType}</span>
              <span>{formatBillingTimestamp(encounter.encounterDate?.toString())}</span>
              <Tag size="sm">{getEncounterLifecycleStatus(encounter) || 'OPEN'}</Tag>
              <Tag size="sm" color="blue">
                {getEncounterTreatmentStatus(encounter) || 'NEW'}
              </Tag>
              {isActive && (
                <Tag
                  size="sm"
                  color={remainingToPay > 0 ? 'orange' : 'green'}
                >
                  Remaining {formatMoney(remainingToPay, currency)}
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
