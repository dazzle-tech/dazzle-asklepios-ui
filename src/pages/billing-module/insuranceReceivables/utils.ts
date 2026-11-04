export const formatMoney = (value: unknown, currency?: string | null) => {
  if (value == null || value === '') return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);

  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return currency ? `${formatted} ${currency}` : formatted;
};

export const getOverallStatusColor = (status?: string | null) => {
  const normalized = String(status ?? '').toUpperCase();

  if (normalized === 'SETTLED') return '#16a34a';
  if (normalized === 'OUTSTANDING') return '#dc2626';
  if (normalized === 'PENDING_CLAIMS') return '#d97706';
  if (normalized === 'NO_ACTIVITY') return '#64748b';

  return '#2563eb';
};

export const formatOverallStatus = (status?: string | null) => {
  if (!status) return '-';
  return String(status)
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
