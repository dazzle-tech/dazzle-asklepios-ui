import { useMemo } from 'react';
import { formatEnumString } from '@/utils';
import { useGetUsersBasicQuery } from '@/services/userService';

type BasicUser = { login: string; firstName?: string; lastName?: string; jobRole?: string; activated?: boolean };

const STAFF_LIMIT = 500;

/**
 * Active users as select options, narrowed to the given job roles when there are any.
 * A user already picked stays in the list even when their role no longer matches.
 */
export const useStaffOptions = (roles: string[] = [], keep?: string | null, skip = false) => {
  const { data } = useGetUsersBasicQuery({ page: 0, size: STAFF_LIMIT, sort: 'firstName,asc' }, { skip });

  return useMemo(() => {
    const users = (data?.data ?? []) as BasicUser[];
    return users
      .filter(user => user.activated !== false)
      .filter(user => !roles.length || !user.jobRole || roles.includes(user.jobRole) || user.login === keep)
      .map(user => ({
        value: user.login,
        label: `${[user.firstName, user.lastName].filter(Boolean).join(' ') || user.login}${
          user.jobRole ? ` · ${formatEnumString(user.jobRole)}` : ''
        }`
      }));
  }, [data, roles, keep]);
};
