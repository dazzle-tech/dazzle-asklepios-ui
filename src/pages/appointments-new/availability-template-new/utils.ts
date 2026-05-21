export type AllowedService = { id: number | null; service: string | null };

export const extractErrorMessage = (response: any): string => {
  try {
    const msg = response?.data?.message;
    return typeof msg === 'string' ? msg.replace(/^error\./i, '') : '';
  } catch {
    return '';
  }
};

export const normalizeAllowedServices = (raw: any): AllowedService[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s: any) => {
      if (typeof s === 'string') return { id: null, service: s };
      if (s && typeof s === 'object' && 'service' in s) return { id: s.id ?? null, service: s.service ?? null };
      return null;
    })
    .filter((s): s is AllowedService => s !== null);
};

export const hexToRGBA = (hex: string, opacity = 0.2): string => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const isValidTimeFormat = (time?: string): boolean =>
  /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(time || '');

export const timeToSeconds = (time: string): number => {
  const [h = 0, m = 0, s = 0] = time.split(':').map(Number);
  return h * 3600 + m * 60 + s;
};
