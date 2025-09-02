 
 export type DayValue = '0' | '1' | '2' | '3' | '4' | '5' | '6';

export interface DayOption {
  label: string;
  value: DayValue;
}

 export const DAYS: DayOption[] = [
  { label: 'Saturday', value: '0' },
  { label: 'Sunday', value: '1' },
  { label: 'Monday', value: '2' },
  { label: 'Tuesday', value: '3' },
  { label: 'Wednesday', value: '4' },
  { label: 'Thursday', value: '5' },
  { label: 'Friday', value: '6' },
];

 export function mapJsDayToCustom(jsDay: number): DayValue {
  // JS: 0=Sunday ... 6=Saturday
  // Custom: 0=Saturday ... 6=Friday
  const mapping: Record<number, DayValue> = {
    0: '1', // Sunday
    1: '2', // Monday
    2: '3', // Tuesday
    3: '4', // Wednesday
    4: '5', // Thursday
    5: '6', // Friday
    6: '0', // Saturday
  };
  return mapping[jsDay];
}
