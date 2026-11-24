import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { MdDelete, MdPerson } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatEnumString } from '@/utils';
import { useGetUsersByFacilityQuery } from '@/services/security/UserRoleService';
import { useGetActiveUsersByFacilityQuery } from '@/services/security/userDepartmentsService';
import { useUpdateDiscountApprovalUserMutation } from '@/services/billing/discountService';
import type { Discount } from '@/types/model-types-new';
import { extractDiscountErrorMessage } from './discountErrorHandler';

type FacilityUser = {
  id: number;
  firstName?: string;
  lastName?: string;
  login?: string;
  jobRole?: string | null;
  activated?: boolean;
};

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  discount: Discount | null;
  onSaved?: (saved?: Discount) => void;
};

const toIds = (ids?: Array<number | string> | null) =>
  (ids ?? []).map(id => Number(id)).filter(id => !Number.isNaN(id));

const asUserList = (value: unknown): FacilityUser[] => (Array.isArray(value) ? value : []);

const userLabel = (user?: FacilityUser | null) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.login || '';

const DiscountApprovalUserModal: React.FC<Props> = ({
  open,
  setOpen,
  discount,
  onSaved
}) => {
  const dispatch = useAppDispatch();
  const [approvalUserIds, setApprovalUserIds] = useState<number[]>([]);
  const [userToAdd, setUserToAdd] = useState<number | null>(null);
  const [updateApprovalUsers, { isLoading }] = useUpdateDiscountApprovalUserMutation();

  const facilityId = discount?.facilityId;
  const savedIds = toIds(discount?.approvalUserIds);

  const { data: facilityRoleUsers = [], isFetching: rolesFetching } = useGetUsersByFacilityQuery(
    facilityId as number,
    { skip: !open || !facilityId }
  );
  const { data: departmentUsers = [], isFetching: departmentsFetching } =
    useGetActiveUsersByFacilityQuery(facilityId as number, {
      skip: !open || !facilityId
    });

  const isFetching = rolesFetching || departmentsFetching;

  const facilityUsers: FacilityUser[] = useMemo(() => {
    const users = new Map<number, FacilityUser>();

    [...asUserList(facilityRoleUsers), ...asUserList(departmentUsers)].forEach(user => {
      if (user?.activated !== true || user.id == null) {
        return;
      }

      users.set(Number(user.id), user);
    });

    return Array.from(users.values());
  }, [facilityRoleUsers, departmentUsers]);

  const usersById = useMemo(() => {
    const map = new Map<number, FacilityUser>();
    facilityUsers.forEach(user => map.set(Number(user.id), user));
    return map;
  }, [facilityUsers]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setApprovalUserIds(savedIds);
    setUserToAdd(null);
  }, [open, discount?.id, savedIds.join(',')]);

  const availableUsers = facilityUsers
    .filter(user => !approvalUserIds.includes(Number(user.id)))
    .map(user => ({
      value: user.id,
      label: userLabel(user)
    }));

  const tableRows = approvalUserIds.map(id => {
    const user = usersById.get(id);

    return {
      id,
      name: userLabel(user) || `User ${id}`,
      login: user?.login || '-',
      jobRole: user?.jobRole || null
    };
  });

  const persistUsers = async (ids: number[]) => {
    const saved = await updateApprovalUsers({
      id: discount!.id!,
      approvalUserIds: ids
    }).unwrap();

    onSaved?.(saved);
  };

  const addUser = async () => {
    if (!discount?.id || userToAdd == null || approvalUserIds.includes(userToAdd) || isLoading) {
      return;
    }

    const nextIds = [...approvalUserIds, userToAdd];
    const previousIds = approvalUserIds;
    const selectedUser = userToAdd;

    setApprovalUserIds(nextIds);
    setUserToAdd(null);

    try {
      await persistUsers(nextIds);
      dispatch(notify({ msg: 'Approval user added', sev: 'success' }));
    } catch (error) {
      setApprovalUserIds(previousIds);
      setUserToAdd(selectedUser);
      dispatch(
        notify({
          msg: extractDiscountErrorMessage(error, 'Failed to add approval user'),
          sev: 'error'
        })
      );
    }
  };

  const removeUser = async (id: number) => {
    if (!discount?.id || isLoading) {
      return;
    }

    const nextIds = approvalUserIds.filter(userId => userId !== id);
    const previousIds = approvalUserIds;

    setApprovalUserIds(nextIds);

    try {
      await persistUsers(nextIds);
      dispatch(notify({ msg: 'Approval user removed', sev: 'success' }));
    } catch (error) {
      setApprovalUserIds(previousIds);
      dispatch(
        notify({
          msg: extractDiscountErrorMessage(error, 'Failed to remove approval user'),
          sev: 'error'
        })
      );
    }
  };

  const columns = [
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      flexGrow: 2
    },
    {
      key: 'login',
      title: <Translate>Login</Translate>,
      width: 160
    },
    {
      key: 'jobRole',
      title: <Translate>Role</Translate>,
      width: 160,
      render: (row: { jobRole?: string | null }) => (row.jobRole ? formatEnumString(row.jobRole) : '-')
    },
    {
      key: 'actions',
      title: <Translate>Remove</Translate>,
      width: 90,
      align: 'center' as const,
      render: (row: { id: number }) => (
        <MdDelete
          className="icons-style"
          title="Remove"
          size={22}
          fill="var(--primary-pink)"
          onClick={() => {
            if (!isLoading) {
              void removeUser(row.id);
            }
          }}
        />
      )
    }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Approval Users"
      position="right"
      hideCancel
      hideActionBtn
      steps={[{ title: 'Approval Users', icon: <MdPerson /> }]}
      size="56vw"
      content={() => (
        <Form fluid>
          <div className="discount-services-toolbar">
            <div className="discount-services-toolbar__picker">
              <MyInput
                width="100%"
                fieldLabel="User"
                fieldType="select"
                fieldName="userToAdd"
                selectData={availableUsers}
                selectDataLabel="label"
                selectDataValue="value"
                record={{ userToAdd }}
                setRecord={(value: { userToAdd?: number | null }) => {
                  const selected = value?.userToAdd;
                  setUserToAdd(selected == null || selected === ('' as any) ? null : Number(selected));
                }}
                placeholder="Select a user to add"
                searchable
                loading={isFetching}
                disabled={!facilityId}
              />
            </div>
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={() => {
                void addUser();
              }}
              width="109px"
              disabled={userToAdd == null || isLoading || !discount?.id}
              loading={isLoading}
            >
              Add
            </MyButton>
          </div>
          <br />
          <MyTable
            height={360}
            data={tableRows}
            columns={columns}
            loading={isFetching}
            enableExport={false}
          />
        </Form>
      )}
    />
  );
};

export default DiscountApprovalUserModal;
