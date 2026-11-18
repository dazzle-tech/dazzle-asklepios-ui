/**
 * Quantity to dispense for a prescription line: dose x times per day x days, rounded up.
 * E.g. 1 tablet once daily for 1 week = 7; 5 ml three times daily for 7 days = 105; 1 tablet weekly for 4 weeks = 4.
 *
 * Same rules as the backend (PrescriptionQuantityCalculator), which fills the quantity when none is sent.
 * Empty (left to the doctor) when the dose, frequency or duration is missing, and for frequencies without a fixed
 * count (with food, as directed...). As needed counts as once a day; Other starts at 1. Ranges count at their
 * maximum ("every 4 to 6 hours" = 6 a day).
 */

/** doses every `days` days. */
type Rate = { doses: number; days: number };

const rate = (doses: number, days = 1): Rate => ({ doses, days });

/**
 * Frequency -> rate. Custom instructions use a MED_FREQUENCY LOV (by its value code),
 * predefined instructions the MedFrequency enum name.
 */
const RATES: Record<string, Rate> = {
  // MED_FREQUENCY LOV value codes (custom instructions)
  MD_FREQ_QD: rate(1),
  MD_FREQ_QAM: rate(1),
  MD_FREQ_QPM: rate(1),
  MD_FREQ_QHS: rate(1),
  MD_FREQ_BID: rate(2),
  MD_FREQ_Q12H: rate(2),
  MD_FREQ_TID: rate(3),
  MD_FREQ_Q8H: rate(3),
  MD_FREQ_QID: rate(4),
  MD_FREQ_Q6H: rate(4),
  MD_FREQ_Q4H: rate(6),
  'MD_FREQ_Q4-6H': rate(6),
  MD_FREQ_QOD: rate(1, 2),
  // As needed counts as once a day (e.g. 2 tablets as needed for 1 day = 2)
  MD_FREQ_PRN: rate(1),
  // MedFrequency enum names (predefined instructions)
  ONCE_DAILY: rate(1),
  EVERY_MORNING: rate(1),
  EVERY_EVENING: rate(1),
  AT_BEDTIME: rate(1),
  EVERY_24_HOURS: rate(1),
  TWICE_DAILY: rate(2),
  EVERY_12_HOURS: rate(2),
  THREE_TIMES_DAILY: rate(3),
  EVERY_8_HOURS: rate(3),
  FOUR_TIMES_DAILY: rate(4),
  EVERY_6_HOURS: rate(4),
  EVERY_4_HOURS: rate(6),
  EVERY_4_TO_6_HOURS: rate(6),
  EVERY_2_TO_3_HOURS: rate(12),
  EVERY_OTHER_DAY: rate(1, 2),
  EVERY_48_HOURS: rate(1, 2),
  EVERY_72_HOURS: rate(1, 3),
  WEEKLY: rate(1, 7),
  EVERY_2_WEEKS: rate(1, 14),
  MONTHLY: rate(1, 30),
  AS_NEEDED: rate(1),
  AS_NEEDED_EVERY_4_TO_6_HOURS: rate(1)
};

/** Other: no fixed count, so the quantity starts at 1 and the doctor changes it if needed. */
const DEFAULT_ONE = new Set(['MD_FREQ_OTHER', 'OTHER']);

/** MED_DURATION value codes -> days. */
const DAYS_PER_UNIT: Record<string, number> = {
  MED_DUR_DAYS: 1,
  MED_DUR_WKS: 7,
  MED_DUR_MNTH: 30
};

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Quantity, or null when it cannot be calculated. */
export const calculateQuantity = (
  dose: unknown,
  frequencyCode: string | null | undefined,
  duration: unknown,
  durationCode: string | null | undefined
): number | null => {
  if (frequencyCode && DEFAULT_ONE.has(String(frequencyCode).trim())) return 1;
  const d = toNumber(dose);
  const len = toNumber(duration);
  const r = frequencyCode ? RATES[String(frequencyCode).trim()] : undefined;
  const perUnit = durationCode ? DAYS_PER_UNIT[String(durationCode).trim()] : undefined;
  if (d === null || len === null || !r || !perUnit) return null;
  // Round away floating point noise before rounding up (e.g. 2.5 x 3 x 5 = 37.5 -> 38).
  const total = Math.round(((d * r.doses * len * perUnit) / r.days) * 1e6) / 1e6;
  return Math.ceil(total);
};
