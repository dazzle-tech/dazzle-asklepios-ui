export const UNCOVERED_INSURANCE_ERROR_KEY = 'insurance.item.notInPriceList';

const getErrorData = (error: any) => {
  const data = error?.data ?? error?.error?.data ?? error;
  if (!data || typeof data !== 'object') {
    return {};
  }

  const properties =
    data.properties && typeof data.properties === 'object' ? data.properties : {};

  return { ...properties, ...data };
};

export const isUncoveredCashCancelled = (error: any): boolean => {
  return Boolean(getErrorData(error)?.userCancelledUncoveredCash);
};
