export const formatMoney = (value: unknown) => {
  if (value == null || value === '') return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);

  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatSettlementStatus = (status?: string | null) => {
  if (!status) return '-';

  return String(status)
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getSettlementStatusColor = (status?: string | null) => {
  const normalized = String(status ?? '').toUpperCase();

  if (normalized === 'SETTLED') return '#16a34a';
  if (normalized === 'PARTIALLY_SETTLED') return '#d97706';
  if (normalized === 'REJECTED') return '#dc2626';

  return '#64748b';
};
