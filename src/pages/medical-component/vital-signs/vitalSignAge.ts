export type VitalSignAgeRule = {
  vitalSignKey: string;
  ageFromMonths?: number | null;
  ageToMonths?: number | null;
  normalMin?: number | null;
  normalMax?: number | null;
};

type DateParts = { year: number; month: number; day: number };

/**
 * Reads a calendar date from 'YYYY-MM-DD' or an ISO date-time ('YYYY-MM-DDTHH:mm...'), using only the
 * date part as written (never converting through UTC, which can shift the day). Invalid dates → null.
 */
export const parseCalendarDate = (value: unknown): DateParts | null => {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
};

/**
 * The calendar date a reading was measured on, as 'YYYY-MM-DD' in the user's local time zone.
 * No recorded date (a new measurement recorded now) → today. A date-only string is used as written;
 * an instant/date-time is converted to the local calendar day (never sliced as UTC). A recorded date that
 * cannot be read → null, so no age-based styling is applied.
 * `toLocalKey` is the app's local-date formatter (formatDate from '@/utils').
 */
export const measurementDateKey = (
  recorded: unknown,
  todayKey: string,
  toLocalKey: (date: Date) => string
): string | null => {
  if (recorded === null || recorded === undefined || recorded === '') return todayKey;
  if (typeof recorded === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(recorded.trim())) {
    return recorded.trim();
  }
  const date = recorded instanceof Date ? recorded : new Date(recorded as any);
  return Number.isNaN(date.getTime()) ? null : toLocalKey(date);
};

/**
 * Completed calendar months between date of birth and the measurement date. Same rule as Java's
 * Period.between(...).toTotalMonths(): the month is only complete once the day of month is reached
 * (born 31 Jan → one month old on 1 Mar, not 28 Feb). Missing/invalid DOB, or DOB after the measurement
 * date → null.
 */
export const completedMonthsBetween = (dob: unknown, measurementDate: unknown): number | null => {
  const birth = parseCalendarDate(dob);
  const asOf = parseCalendarDate(measurementDate);
  if (!birth || !asOf) return null;

  let months = (asOf.year - birth.year) * 12 + (asOf.month - birth.month);
  if (asOf.day < birth.day) months -= 1;
  return months < 0 ? null : months;
};

/** The rule of this vital sign whose [ageFromMonths, ageToMonths) interval contains the age. */
export const findRuleForAge = (
  rules: VitalSignAgeRule[] | undefined,
  vitalSignKey: string,
  ageInMonths: number | null
): VitalSignAgeRule | undefined => {
  if (!rules || ageInMonths === null) return undefined;
  return rules.find(rule => {
    if (rule.vitalSignKey !== vitalSignKey) return false;
    const from = rule.ageFromMonths ?? 0;
    const to = rule.ageToMonths;
    return ageInMonths >= from && (to === null || to === undefined || ageInMonths < to);
  });
};

/** 'danger' only for a finite numeric reading strictly above the matched rule's Normal Max. */
export const dangerWhenAboveMax = (value: unknown, rule: VitalSignAgeRule | undefined): '' | 'danger' => {
  if (value === null || value === undefined || value === '') return '';
  const reading = Number(value);
  if (!Number.isFinite(reading)) return '';
  const max = rule?.normalMax;
  if (max === null || max === undefined) return '';
  const numericMax = Number(max);
  if (!Number.isFinite(numericMax)) return '';
  return reading > numericMax ? 'danger' : '';
};
