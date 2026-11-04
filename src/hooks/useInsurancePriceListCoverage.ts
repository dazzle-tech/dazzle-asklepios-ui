import { useCallback, useState } from 'react';

import {
  useCheckInsurancePriceListCoverageMutation,
  type InsurancePriceListCoverageCheckRequest,
  type InsurancePriceListCoverageCheckResult
} from '@/services/billing/billingTransactionService';

type CoverageCheckInput = Omit<InsurancePriceListCoverageCheckRequest, 'encounterId'>;

export const useInsurancePriceListCoverage = (encounterId?: number | null) => {
  const [checkCoverage] = useCheckInsurancePriceListCoverageMutation();
  const [uncoveredItems, setUncoveredItems] = useState<InsurancePriceListCoverageCheckResult[]>(
    []
  );

  const clearUncoveredItems = useCallback(() => {
    setUncoveredItems([]);
  }, []);

  const checkItem = useCallback(
    async (input: CoverageCheckInput) => {
      if (!encounterId || !input.billingItemType) {
        setUncoveredItems([]);
        return null;
      }

      try {
        const result = await checkCoverage({
          encounterId,
          ...input
        }).unwrap();

        setUncoveredItems(result.requiresCashConfirmation ? [result] : []);
        return result;
      } catch {
        setUncoveredItems([]);
        return null;
      }
    },
    [checkCoverage, encounterId]
  );

  const checkItems = useCallback(
    async (inputs: CoverageCheckInput[]) => {
      if (!encounterId || !inputs.length) {
        setUncoveredItems([]);
        return [];
      }

      const results = await Promise.all(
        inputs.map(async input => {
          try {
            return await checkCoverage({
              encounterId,
              ...input
            }).unwrap();
          } catch {
            return null;
          }
        })
      );

      const uncovered = results.filter(
        (item): item is InsurancePriceListCoverageCheckResult =>
          Boolean(item?.requiresCashConfirmation)
      );
      setUncoveredItems(uncovered);
      return uncovered;
    },
    [checkCoverage, encounterId]
  );

  return {
    uncoveredItems,
    requiresCashConfirmation: uncoveredItems.length > 0,
    checkItem,
    checkItems,
    clearUncoveredItems
  };
};
