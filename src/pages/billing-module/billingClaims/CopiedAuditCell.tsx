import React from 'react';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import UserDateCell from '@/components/UserDateCell';

type CopyAudit = {
  createdBy?: string | null;
  createdDate?: string | null;
  originalCreatedBy?: string | null;
  originalCreatedDate?: string | null;
};

export const AddedInClaimBadge = () => (
  <div style={{ marginBottom: 4 }}>
    <MyBadgeStatus contant="ADDED IN CLAIM" color="#fd7e14" />
  </div>
);

// A claim record with no original was not copied from the visit; it was entered in the claim
export const isAddedInClaim = (row?: CopyAudit | null) =>
  !!row && !row.originalCreatedBy && !row.originalCreatedDate;

const CopiedAuditCell = ({ row }: { row?: CopyAudit | null }) => (
  <>
    {isAddedInClaim(row) && <AddedInClaimBadge />}
    <UserDateCell login={row?.createdBy} date={row?.createdDate} />
  </>
);

export default CopiedAuditCell;
