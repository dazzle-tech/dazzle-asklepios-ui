/** Slider and face color for a 0-10 pain level. */
export const getPainTrackColor = (value: number): string => {
  if (value === 0) return 'transparent';
  if (value >= 1 && value <= 3) return '#28a745';
  if (value >= 4 && value <= 7) return 'orange';
  return 'red';
};
