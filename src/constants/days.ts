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