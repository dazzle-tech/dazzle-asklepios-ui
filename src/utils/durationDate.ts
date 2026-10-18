import dayjs from 'dayjs';

export type DurationType = 'YEARS' | 'MONTHS' | 'DAYS';

export type SavedDuration = {
  durationType: DurationType;
  duration: number;
  date: any;
} | null;

export const DURATION_TYPE_OPTIONS: {
  label: string;
  value: DurationType;
  dayjsUnit: 'year' | 'month' | 'day';
}[] = [
  { label: 'Years', value: 'YEARS', dayjsUnit: 'year' },
  { label: 'Months', value: 'MONTHS', dayjsUnit: 'month' },
  { label: 'Days', value: 'DAYS', dayjsUnit: 'day' }
];

// Matches the earliest date MyInput's date picker allows and the backend lower bound.
const MIN_DURATION_DATE = dayjs('1900-01-01');

// dayjs works in local time and clamps month/year shifts to the last day of the target month.
export const subtractDurationFromToday = (
  durationType: DurationType,
  amount: number
): string | null => {
  const unit = DURATION_TYPE_OPTIONS.find(option => option.value === durationType)?.dayjsUnit;
  if (!unit) return null;
  const result = dayjs().startOf('day').subtract(amount, unit);
  if (!result.isValid() || result.isBefore(MIN_DURATION_DATE)) return null;
  return result.format('YYYY-MM-DD');
};

export const isSameCalendarDay = (a: any, b: any) => {
  const toDay = (value: any) => (value ? dayjs(value).format('YYYY-MM-DD') : null);
  return toDay(a) === toDay(b);
};

export const getSavedDuration = (
  durationType: DurationType | null | undefined,
  duration: number | null | undefined,
  date: any
): SavedDuration =>
  durationType && duration !== null && duration !== undefined && date
    ? { durationType, duration, date }
    : null;

/**
 * Normalizes a Date Type / Number change and returns the preview date. Re-entering the saved
 * duration returns the saved date, because the backend keeps it instead of recalculating.
 */
export const resolveDurationInput = (
  rawDurationType: DurationType | null | undefined,
  rawDuration: number | null | undefined,
  saved: SavedDuration
): { durationType: DurationType | null; duration: number | null; date: any; error?: string } => {
  const durationType = rawDurationType || null;
  const duration = durationType ? rawDuration ?? null : null;

  if (duration !== null && (!Number.isInteger(duration) || duration < 0)) {
    return { durationType, duration, date: null, error: 'Number must be a non-negative whole number' };
  }

  if (!durationType || duration === null) {
    return { durationType, duration, date: null };
  }

  if (saved && saved.durationType === durationType && saved.duration === duration) {
    return { durationType, duration, date: saved.date };
  }

  const date = subtractDurationFromToday(durationType, duration);
  if (!date) {
    return { durationType, duration, date: null, error: 'The resulting date is out of range' };
  }

  return { durationType, duration, date };
};

export const isIncompleteDuration = (durationType: any, duration: any) =>
  (durationType === null || durationType === undefined) !==
  (duration === null || duration === undefined);
