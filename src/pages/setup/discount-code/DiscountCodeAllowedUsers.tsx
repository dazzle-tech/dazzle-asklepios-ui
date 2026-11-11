import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Form } from 'rsuite';
import { MdDelete } from 'react-icons/md';
import { FaUserCheck } from 'react-icons/fa';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useGetActiveUsersByFacilityQuery } from '@/services/security/UserRoleService';
import {
  useGetDiscountCodeAllowedUsersQuery,
  useReplaceDiscountCodeAllowedUsersMutation
} from '@/services/setup/discountCode/discountCodeService';
import type { DiscountCode, DiscountCodeAllowedUser } from '@/types/model-types-new';
import './styles.less';

type FacilityUser = {
  id: number;
  login?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  activated?: boolean;
};

type AllowedUsersProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  discountCode: DiscountCode;
};

const userName = (user: {
  firstName?: string | null;
  lastName?: string | null;
  login?: string | null;
  id?: number;
}) => {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.login || (user.id != null ? `User ${user.id}` : 'User');
};

const userLabel = (user: {
  firstName?: string | null;
  lastName?: string | null;
  login?: string | null;
  id?: number;
}) => {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (name && user.login) {
    return `${name} (${user.login})`;
  }
  return userName(user);
};

const extractErrorMessage = (error: any): string => {
  const data = error?.data ?? {};
  if (typeof data.title === 'string' && data.title && data.title !== 'Bad Request') {
    return data.title;
  }
  if (typeof data.detail === 'string' && data.detail) {
    return data.detail;
  }
  if (typeof data.message === 'string') {
    return data.message.replace(/^error\./i, '');
  }
  return 'Could not save allowed users';
};

const DiscountCodeAllowedUsers = ({ open, setOpen, discountCode }: AllowedUsersProps) => {
  const dispatch = useAppDispatch();
  const discountCodeId = discountCode?.id;
  const facilityId = discountCode?.facilityId;
  const [userIds, setUserIds] = useState<number[]>([]);
  const loadedFor = useRef<number | null>(null);
  const { data: facilityUsers = [], isFetching: isLoadingUsers } = useGetActiveUsersByFacilityQuery(
    facilityId,
    { skip: !open || facilityId == null }
  );
  const { currentData: allowedUsers, isFetching: isLoadingAllowed } = useGetDiscountCodeAllowedUsersQuery(
    discountCodeId as number,
    { skip: !open || discountCodeId == null }
  );
  const [replaceAllowedUsers, { isLoading: isSaving }] = useReplaceDiscountCodeAllowedUsersMutation();

  useEffect(() => {
    if (!open || discountCodeId == null) {
      loadedFor.current = null;
      setUserIds([]);
      return;
    }
    if (loadedFor.current !== discountCodeId) {
      setUserIds([]);
    }
    if (!allowedUsers || loadedFor.current === discountCodeId) {
      return;
    }
    loadedFor.current = discountCodeId;
    setUserIds(allowedUsers.map(user => user.userId));
  }, [open, discountCodeId, allowedUsers]);

  const usersById = useMemo(() => {
    const users = new Map<number, FacilityUser | DiscountCodeAllowedUser>();
    (facilityUsers as FacilityUser[])
      .filter(user => user?.activated !== false)
      .forEach(user => {
      if (user?.id != null) {
        users.set(user.id, user);
      }
    });
    (allowedUsers ?? []).forEach(user => {
      if (!users.has(user.userId)) {
        users.set(user.userId, user);
      }
    });
    return users;
  }, [facilityUsers, allowedUsers]);

  const userOptions = useMemo(
    () =>
      Array.from(usersById.entries()).map(([id, user]) => ({
        value: id,
        label: userLabel({
          id,
          firstName: user.firstName,
          lastName: user.lastName,
          login: user.login
        })
      })),
    [usersById]
  );

  const selectedUsers = userIds.flatMap(id => {
    const user = usersById.get(id);
    return user ? [{ id, user }] : [];
  });

  const handleUsersChange = (updated: any) => {
    const nextRecord = typeof updated === 'function' ? updated({ userIds }) : updated;
    const nextIds = Array.isArray(nextRecord?.userIds) ? nextRecord.userIds : [];
    setUserIds(nextIds.map((id: number | string) => Number(id)).filter(id => Number.isFinite(id)));
  };

  const handleSave = async () => {
    if (discountCodeId == null) {
      return;
    }
    try {
      await replaceAllowedUsers({ discountCodeId, userIds }).unwrap();
      dispatch(notify({ msg: 'Allowed users saved', sev: 'success' }));
      setOpen(false);
    } catch (error) {
      dispatch(notify({ msg: extractErrorMessage(error), sev: 'warning' }));
    }
  };

  const content = () => (
    <Form fluid>
      <p className="discount-code-allowed-hint">
        Choose the active users of this facility who can apply {discountCode?.code || 'this discount code'}.
      </p>
      <MyInput
        key={discountCodeId ?? 'discount-code-users'}
        width="100%"
        column
        fieldName="userIds"
        fieldType="checkPicker"
        fieldLabel="Allowed Users"
        record={{ userIds }}
        setRecord={handleUsersChange}
        selectData={userOptions}
        selectDataLabel="label"
        selectDataValue="value"
        loading={isLoadingUsers || isLoadingAllowed}
        searchable
        placeholder="Select users"
      />
      <div className="discount-code-allowed-list">
        {selectedUsers.length === 0 ? (
          <span className="discount-code-allowed-login">No users selected.</span>
        ) : (
          selectedUsers.map(({ id, user }) => (
            <div className="discount-code-allowed-row" key={id}>
              <div className="discount-code-allowed-name">
                <span>
                  {userName({
                    id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    login: user.login
                  })}
                </span>
                {user.login ? <span className="discount-code-allowed-login">{user.login}</span> : null}
              </div>
              <MdDelete
                className="icons-style"
                title="Remove"
                size={22}
                fill="var(--primary-pink)"
                onClick={() => setUserIds(current => current.filter(currentId => currentId !== id))}
              />
            </div>
          ))
        )}
      </div>
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      position="right"
      size="42vw"
      title={`Allowed Users${discountCode?.code ? ` — ${discountCode.code}` : ''}`}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      actionButtonLoading={isSaving}
      isDisabledActionBtn={discountCodeId == null || isLoadingAllowed}
      content={content}
      steps={[{ title: 'Allowed Users', icon: <FaUserCheck /> }]}
    />
  );
};

export default DiscountCodeAllowedUsers;
