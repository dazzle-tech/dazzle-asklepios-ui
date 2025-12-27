import React, { useEffect } from 'react';
import { useGetActiveIngredientsByBrandQuery } from '@/services/setup/brandmedication/BrandMedicationActiveIngredientService';

type Props = {
  brandId: string | null;
  onLoaded: (brandId: string, actives: any[]) => void;
};

const BrandActivesPrefetcher: React.FC<Props> = ({ brandId, onLoaded }) => {
  const { data, isFetching, isError } = useGetActiveIngredientsByBrandQuery(brandId as any, {
    skip: !brandId
  });

  useEffect(() => {
    if (!brandId) return;
    if (isFetching || isError) return;

    const actives = (data as any)?.object ?? (Array.isArray(data) ? data : []);
    onLoaded(String(brandId), actives ?? []);
  }, [brandId, data, isFetching, isError, onLoaded]);

  return null;
};

export default BrandActivesPrefetcher;
