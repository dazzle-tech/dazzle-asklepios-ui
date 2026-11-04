export const FOLLOW_UP_REVIEW_WINDOW_DAYS = 14;

const startOfLocalDay = (value: unknown): Date | null => {
  if (value == null || value === '') {
    return null;
  }

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const resolveFollowUpEncounterId = (encounter: any): number | null => {
  const raw =
    encounter?.followUpEncounterId ??
    encounter?.followUpEncounter?.id ??
    null;
  const id = Number(raw);

  return Number.isFinite(id) && id > 0 ? id : null;
};

export const resolveEncounterCreatedDate = (encounter: any): unknown =>
  encounter?.createdDate ?? encounter?.createdAt ?? null;

export const isFollowUpEncounterReason = (encounter: any): boolean =>
  String(encounter?.encounterReason ?? '').toUpperCase() === 'FOLLOW_UP';

export const shouldSkipDefaultServicesForFollowUpReview = (
  encounter: any,
  previousEncounter?: any
): boolean => {
  if (!isFollowUpEncounterReason(encounter)) {
    return false;
  }

  const previous = previousEncounter ?? encounter?.followUpEncounter;
  const previousCreated = resolveEncounterCreatedDate(previous);
  const currentCreated =
    resolveEncounterCreatedDate(encounter) ?? new Date();

  const previousDay = startOfLocalDay(previousCreated);
  const currentDay = startOfLocalDay(currentCreated);

  if (previousDay == null || currentDay == null) {
    return false;
  }

  const daysBetween = Math.round(
    (currentDay.getTime() - previousDay.getTime()) / 86_400_000
  );

  return daysBetween >= 0 && daysBetween <= FOLLOW_UP_REVIEW_WINDOW_DAYS;
};
