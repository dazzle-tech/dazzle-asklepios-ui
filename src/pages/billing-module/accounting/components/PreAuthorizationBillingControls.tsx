import React from 'react';
import { Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';

type PreAuthorizationBillingControlsProps = {
  visible?: boolean;
  pendingCount?: number;
  canCloseCalculation?: boolean;
  refreshing?: boolean;
  disabled?: boolean;
  onRefresh: () => void;
};

const PreAuthorizationBillingControls: React.FC<PreAuthorizationBillingControlsProps> = ({
  visible = false,
  pendingCount = 0,
  canCloseCalculation = true,
  refreshing = false,
  disabled = false,
  onRefresh
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="billing-accounting__preauth-toolbar">
      <div className="billing-accounting__preauth-toolbar-copy">
        <Text weight="semibold">Waseel pre-authorization</Text>
        <Text muted size="sm">
          {pendingCount > 0
            ? `${pendingCount} item(s) still pending payer approval. Refresh status from Waseel before closing the calculation.`
            : canCloseCalculation
              ? 'Statuses are up to date. You can continue billing and checkout.'
              : 'Refresh payer decisions from Waseel before closing the calculation.'}
        </Text>
      </div>
      <MyButton
        appearance="primary"
        loading={refreshing}
        disabled={disabled}
        prefixIcon={() => <FontAwesomeIcon icon={faRotateRight} />}
        onClick={onRefresh}
      >
        Refresh pre-authorization
      </MyButton>
    </div>
  );
};

export default PreAuthorizationBillingControls;
