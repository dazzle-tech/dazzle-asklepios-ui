import React from 'react';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import { formatDateWithoutSeconds } from '@/utils';

export const UserFullNameCell = ({
  login
}: {
  login?: string | null;
}) => {
  const { data: fullName } = useGetUserFullNameByLoginQuery(login!, {
    skip: !login
  });

  return <>{fullName || login || '-'}</>;
};

const UserDateCell = ({
  login,
  date
}: {
  login?: string | null;
  date?: string | null;
}) => {
  return (
    <>
      <UserFullNameCell login={login} />

      {date && (
        <>
          <br />
          <span className="date-table-style">
            {formatDateWithoutSeconds(date)}
          </span>
        </>
      )}
    </>
  );
};

export default UserDateCell;