import Translate from '@/components/Translate';
import {
  useDeactivateUserMutation,
  useGetFacilitiesQuery
} from '@/services/setupService';

import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useEffect, useState } from 'react';
import { FaAddressCard, FaBuilding, FaMedal } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';
import { Panel, Tooltip, Whisper, Form } from 'rsuite';

import ViewDepartments from './ViewDepartments-new';
import ViewLicenses from './ViewLicenses';

import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';

import {
  useAddUserMutation,
  useGetUsersBasicQuery,
  useUpdateUserMutation
} from '@/services/userService';

import { newApUser } from '@/types/model-types-constructor-new';
import { ApUser } from '@/types/model-types-new';
import { notify } from '@/utils/uiReducerActions';

import AddEditUser from './AddEditUser';
import ResetPassword from './ResetPassword';

import './styles.less';
import { formatEnumString } from '@/utils';

const Users = () => {
  const dispatch = useAppDispatch();

  const [user, setUser] = useState<ApUser>({ ...newApUser });
  const [record, setRecord] = useState({
    login: '',
    name: '',
    email: ''
  });

  const [popupOpen, setPopupOpen] = useState(false);
  const [licensePopupOpen, setLicensePopupOpen] = useState(false);
  const [departmentsPopupOpen, setDepartmentsPopupOpen] = useState(false);
  const [resetPasswordPopupOpen, setResetPasswordPopupOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  const [canProceed, setCanProceed] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);

  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // ===== API =====
  const {
    data: usersResponse,
    isLoading,
    refetch
  } = useGetUsersBasicQuery({
  page: pageIndex,
  size: rowsPerPage,
  sort: `${sortColumn},${sortType}`,
  login: record.login,
  email: record.email,
  name: record.name
});

const users = usersResponse?.data ?? [];
const totalCount = usersResponse?.totalCount ?? 0;

  const [saveUser] = useAddUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deactivateActivateUser] = useDeactivateUserMutation();

  const { data: facilityListResponse } = useGetFacilitiesQuery({
    pageSize: 1000
  });

  // ===== effects =====
  useEffect(() => {
    dispatch(setPageCode('Users'));
    dispatch(setDivContent('Users'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // لما يتغير البحث → رجّع الصفحة للأول
  useEffect(() => {
    setPageIndex(0);
  }, [record]);

  useEffect(() => {
    setCanProceed(!!(popupOpen && user?.id));
  }, [popupOpen, user]);

  // ===== handlers =====
  const handleSave = async () => {
    try {
      if (user.id) {
        const response = await updateUser(user).unwrap();
        setUser(response);
        dispatch(notify({ msg: 'User updated successfully', sev: 'success' }));
      } else {
        await saveUser(user).unwrap();
        dispatch(notify({ msg: 'User saved successfully', sev: 'success' }));
      }
      refetch();
      setCanProceed(true);
    } catch (error: any) {
      const message = error?.data?.message?.toLowerCase();
      dispatch(
        notify({
          msg:
            message === 'error.emailexists'
              ? 'This email is already in use'
              : 'Failed to save user',
          sev: 'error'
        })
      );
    }
  };

  // const handleDeactivateUser = async (data: ApUser) => {
  //   const action = data.isValid ? 'Deactivated' : 'Activated';
  //   try {
  //     await deactivateActivateUser({
  //       user: { ...data, isValid: !data.isValid }
  //     }).unwrap();
  //     dispatch(notify({ msg: `User ${action} successfully`, sev: 'success' }));
  //     refetch();
  //   } catch {
  //     dispatch(notify({ msg: `Failed to ${action} user`, sev: 'error' }));
  //   }
  // };

  // ===== filters =====
  
  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
  setSortColumn(column);
  setSortType(type);
  setPageIndex(0);
};

  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        fieldName="name"
        fieldType="text"
        record={record}
        setRecord={setRecord}
        showLabel={false}
        placeholder="Search name"
      />
      <MyInput
        fieldName="login"
        fieldType="text"
        record={record}
        setRecord={setRecord}
        showLabel={false}
        placeholder="Search username"
      />
      <MyInput
        fieldName="email"
        fieldType="text"
        record={record}
        setRecord={setRecord}
        showLabel={false}
        placeholder="Search email"
      />
    </Form>
  );

  const iconsForActions = (rowData: ApUser) => (
    <div className="container-of-icons">
      <MdModeEdit
        className='icons-style'
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setPopupOpen(true);
          setUser(rowData);
        }}
      />
      <FaMedal
        className='icons-style'
        title="Privilege"
        fill="var(--primary-gray)"
        size={24}
      />
      <FaAddressCard
        className='icons-style'
        title="Licenses & Certifications"
        fill="var(--primary-gray)"
        size={24}
        onClick={() => setLicensePopupOpen(true)}
      />
      <RiLockPasswordFill
        className='icons-style'
        title="Reset Password"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setResetPasswordPopupOpen(true)}
      />
      <FaBuilding
        className='icons-style'
        title="Departments"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setDepartmentsPopupOpen(true);
        }}
      />
      {/* {rowData?.isValid ? (
        <MdDelete
          className='icons-style'
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() =>{setStateOfDeleteUserModal("deactivate"); setOpenConfirmDeleteUserModal(true);}}
        />
      ) : (
        <FaUndo
          className='icons-style'
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {setStateOfDeleteUserModal("reactivate"); setOpenConfirmDeleteUserModal(true);}}
        />
      )} */}
    </div>
  );
  //Table columns
  const tableColumns = [
    {
      key: 'fullName',
      title: <Translate>Full Name</Translate>,
      flexGrow: 4,
      render: rowData => {
        return (
          <Whisper
            placement="top"
            trigger="hover"
            speaker={
              <Tooltip>
                <p>Facilities:</p>
                {(facilityListResponse?.object ?? []).map((item, index) => (
                  <p key={index}>{item.facilityName}</p>
                ))}{' '}
              </Tooltip>
            }
          >
            <p>{rowData?.firstName}  {rowData?.lastName}</p> 
          </Whisper>
        );
      }
    },
    {
      key: 'login',
      title: <Translate>User Name</Translate>,
      flexGrow: 3
    },
    {
      key: 'email',
      title: <Translate>Email</Translate>,
      flexGrow: 4
    },
    {
      key: 'phoneNumber',
      title: <Translate>Phone Number</Translate>,
      flexGrow: 4
    },
    {
      key: 'admin',
      title: <Translate>Admin</Translate>,
      flexGrow: 2,
      render: rowData => {
        return rowData?.admin ? 'True' : 'False';
      }
    },
    {
      key: 'jobRoleLvalue',
      title: <Translate>job Role</Translate>,
      flexGrow: 4,
      render: rowData => {
        return (
          <p>
            {formatEnumString(rowData.jobRole)}
          </p>
        );
      }
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

    const handlePageChange = (_: unknown, newPage: number) => {
        setPageIndex(newPage);
    }
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPageIndex(0);

    };


  return (
    <Panel>
      <MyTable
        data={users}
        columns={tableColumns}
        loading={isLoading}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        filters={filters()}
        tableButtons={
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            onClick={() => {
              setUser({ ...newApUser });
              setPopupOpen(true);
            }}
          >
            Add New
          </MyButton>
        }
      />

      <AddEditUser
        open={popupOpen}
        setOpen={setPopupOpen}
        user={user}
        setUser={setUser}
        handleSave={handleSave}
        width={width}
        canProceed={canProceed}
        setCanProceed={setCanProceed}
      />

      <ResetPassword
        open={resetPasswordPopupOpen}
        setOpen={setResetPasswordPopupOpen}
        user={user}
        setUser={setUser}
        width={width}
      />

      <ViewDepartments
        open={departmentsPopupOpen}
        setOpen={setDepartmentsPopupOpen}
        user={user}
        width={width}
      />
      <ViewLicenses
        open={licensePopupOpen}
        setOpen={setLicensePopupOpen}
        user={user}
        width={width}
      />

      {/* <DeletionConfirmationModal
        open={false}
        setOpen={() => {}}
        itemToDelete="User"
        actionButtonFunction={() => handleDeactivateUser(user)}
        actionType="delete"
      /> */}
    </Panel>
  );
};

export default Users;
