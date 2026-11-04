import React, { useEffect, useMemo, useState } from 'react';
import { Loader, Tag, Text } from 'rsuite';

import type { PatientEncounter } from '@/types/model-types-new';
import { useGetPractitionersBulkMutation } from '@/services/setup/practitioner/PractitionerService';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import {
  formatBillingEnum,
  formatBillingTimestamp,
  formatEncounterDisplayLabel,
  formatEncounterLifecycleLabel,
  formatEncounterTreatmentLabel,
  formatMoney
} from '../utils/billingAccountingUtils';
import { shouldShowEncounterTreatmentStatus } from '@/utils/encounterStatusHelpers';

type EncounterSelectorProps = {
  encounters: PatientEncounter[];
  selectedEncounterId: number | null;
  loading?: boolean;
  onSelect: (encounterId: number) => void;
  remainingToPay?: number;
  remainingLoading?: boolean;
  currency?: string;
};

const practitionerDisplayName = (practitioner: {
  firstName?: string | null;
  lastName?: string | null;
} | null) => {
  if (!practitioner) return null;
  const name = [practitioner.firstName, practitioner.lastName].filter(Boolean).join(' ').trim();
  return name || null;
};

const DoctorName = ({ name }: { name: string }) => (
  <span className="billing-accounting__encounter-person">
    <span className="billing-accounting__encounter-person-label">Doctor</span>
    {name}
  </span>
);

const TreatmentStarterName = ({ login }: { login: string }) => {
  const { data } = useGetUserFullNameByLoginQuery(login);
  const name = (typeof data === 'string' ? data.trim() : '') || login;

  return <DoctorName name={name} />;
};

const EncounterPerson = ({
  encounter,
  practitionersById
}: {
  encounter: PatientEncounter;
  practitionersById: Record<string, { firstName?: string | null; lastName?: string | null }>;
}) => {
  const type = String(encounter.encounterType ?? '').toUpperCase();
  const practitionerId = encounter.practitionerId;
  const practitionerName = practitionerId
    ? practitionerDisplayName(practitionersById[String(practitionerId)])
    : null;

  if (type === 'CLINIC') {
    return practitionerName ? <DoctorName name={practitionerName} /> : null;
  }

  if (type !== 'EMERGENCY') {
    return null;
  }

  if (practitionerId) {
    return practitionerName ? <DoctorName name={practitionerName} /> : null;
  }

  const startedBy = encounter.startedBy?.trim();
  return startedBy ? <TreatmentStarterName login={startedBy} /> : null;
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
  const [getPractitionersBulk] = useGetPractitionersBulkMutation();
  const [practitionersById, setPractitionersById] = useState<
    Record<string, { firstName?: string | null; lastName?: string | null }>
  >({});

  const practitionerIds = useMemo(
    () =>
      Array.from(
        new Set(
          encounters
            .map(encounter => encounter.practitionerId)
            .filter((id): id is number => id != null && Number(id) > 0)
        )
      ),
    [encounters]
  );
  const practitionerIdsKey = practitionerIds.join(',');

  useEffect(() => {
    if (!practitionerIds.length) {
      setPractitionersById(prev => (Object.keys(prev).length ? {} : prev));
      return;
    }

    let cancelled = false;

    void getPractitionersBulk(practitionerIds)
      .unwrap()
      .then((result: any) => {
        if (cancelled) return;
        const rows = Array.isArray(result) ? result : [];
        setPractitionersById(
          Object.fromEntries(rows.map((practitioner: any) => [String(practitioner.id), practitioner]))
        );
      })
      .catch(() => {
        if (!cancelled) {
          setPractitionersById(prev => (Object.keys(prev).length ? {} : prev));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [getPractitionersBulk, practitionerIds, practitionerIdsKey]);

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
              <span>{formatBillingTimestamp(encounter.createdDate?.toString())}</span>
              <Tag size="sm">{formatEncounterLifecycleLabel(encounter)}</Tag>
              {shouldShowEncounterTreatmentStatus(encounter) && (
                <Tag size="sm" color="blue">
                  {formatEncounterTreatmentLabel(encounter)}
                </Tag>
              )}
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
            <EncounterPerson encounter={encounter} practitionersById={practitionersById} />
          </button>
        );
      })}
    </div>
  );
};

export default EncounterSelector;
