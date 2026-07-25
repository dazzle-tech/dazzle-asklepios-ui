import React from 'react';
import { Text } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import type { PatientServiceAndProduct } from '@/types/model-types-new';

type CashFallbackBannerProps = {
  rejectedItems: PatientServiceAndProduct[];
  converting?: boolean;
  onConvertToCash: () => void;
};

const CashFallbackBanner: React.FC<CashFallbackBannerProps> = ({
  rejectedItems,
  converting = false,
  onConvertToCash
}) => {
  if (!rejectedItems.length) {
    return null;
  }

  return (
    <div className="billing-accounting__alert billing-accounting__alert--warning">
      <div>
        <Text weight="semibold">Waseel pre-authorization rejected</Text>
        <Text muted size="sm" style={{ marginTop: 4 }}>
          {rejectedItems.length} service
          {rejectedItems.length > 1 ? 's were' : ' was'} rejected by Waseel. You can re-price and
          bill the patient directly as cash instead of waiting for insurance approval.
        </Text>
      </div>
      <MyButton appearance="primary" loading={converting} onClick={onConvertToCash}>
        Bill patient directly (Cash)
      </MyButton>
    </div>
  );
};

export default CashFallbackBanner;
