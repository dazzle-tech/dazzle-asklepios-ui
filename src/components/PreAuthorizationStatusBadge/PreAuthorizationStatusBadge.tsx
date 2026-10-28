import React from 'react';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import {
  formatPreAuthorizationStatus,
  getPreAuthorizationStatusColor
} from '@/utils/preAuthorizationStatusDisplay';

type PreAuthorizationStatusBadgeProps = {
  status?: string | null;
};

/** Pre-authorization status of a billed item; a dash when no pre-authorization applies. */
const PreAuthorizationStatusBadge = ({ status }: PreAuthorizationStatusBadgeProps) => {
  if (!status) {
    return <>—</>;
  }

  return (
    <MyBadgeStatus
      contant={formatPreAuthorizationStatus(status)}
      color={getPreAuthorizationStatusColor(status)}
    />
  );
};

export default PreAuthorizationStatusBadge;
