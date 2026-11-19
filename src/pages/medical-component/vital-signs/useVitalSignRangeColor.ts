import { useCallback, useMemo } from 'react';
import { formatDate } from '@/utils';
import { useGetPatientByIdQuery } from '@/services/patient/patientService';
import { useGetVitalSignRangesQuery } from '@/services/setup/vital-sign-range/vitalSignRangeService';
import {
  completedMonthsBetween,
  dangerWhenAboveMax,
  findRuleForAge,
  measurementDateKey
} from '@/pages/medical-component/vital-signs/vitalSignAge';

/**
 * Returns a function giving the MyInput `inputColor` for a vital sign reading of the given patient.
 * 'danger' (the existing red input style) only when the reading is strictly greater than the Normal Max
 * of the age rule matching the patient's age in completed months on the measurement date.
 * Missing/invalid DOB, DOB after the measurement date, no matching rule, or no Normal Max → no styling.
 * Normal Min is intentionally not used, and nothing here blocks saving.
 *
 * `recordedDate` is the recorded date of an existing reading; without one the reading is a new
 * measurement recorded now, so today's local date is used.
 */
export const useVitalSignRangeColor = (patientId?: number | null, recordedDate?: unknown) => {
  const { data: ranges } = useGetVitalSignRangesQuery();

  // currentData (not data): undefined while a different patient is loading, so the previous patient's
  // date of birth can never be used for the next patient.
  const { currentData: patient } = useGetPatientByIdQuery(
    { id: patientId as number },
    { skip: !patientId }
  );

  const dateOfBirth = patientId ? (patient as any)?.dateOfBirth : undefined;
  const recordedKey =
    recordedDate instanceof Date ? recordedDate.getTime() : (recordedDate as string | null | undefined);
  const todayKey = formatDate(new Date());

  const ageInMonths = useMemo(
    () =>
      completedMonthsBetween(dateOfBirth, measurementDateKey(recordedDate, todayKey, formatDate)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateOfBirth, recordedKey, todayKey]
  );

  return useCallback(
    (vitalSignKey: string, value: unknown): '' | 'danger' =>
      dangerWhenAboveMax(value, findRuleForAge(ranges, vitalSignKey, ageInMonths)),
    [ranges, ageInMonths]
  );
};
