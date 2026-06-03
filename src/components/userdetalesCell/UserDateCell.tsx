import { formatDateWithoutSeconds } from '@/utils';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import React from 'react';
const UserDateCell = ({
  login,
  date
}: {
  login?: string | null;
  date?: string | null;
}) => {
  const { data: fullName } = useGetUserFullNameByLoginQuery(login!, {
    skip: !login
  });

  if (!login && !date) {
    return <span>-</span>;
  }

  return (
    <>
      <span>{login ? fullName || login : '-'}</span>
      <br />
      <span className="date-table-style">
        {date ? formatDateWithoutSeconds(date) : ''}
      </span>
    </>
  );
};

export default UserDateCell;