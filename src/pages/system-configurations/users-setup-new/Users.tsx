import Translate from '@/components/Translate';
import { useGetFacilitiesQuery } from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useEffect, useState } from 'react';
import { MdDelete, MdModeEdit, MdOutlineMail, MdPersonOff } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { Panel, Tooltip, Whisper, Form } from 'rsuite';

import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MyTab from '@/components/MyTab';
import { Box } from '@mui/material';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useAddUserMutation,
  useGetUsersBasicQuery,
  useUpdateUserMutation,
  useResendCreatePasswordEmailMutation,
  useToggleUserActivationMutation,
} from '@/services/userService';
import { newApUser } from '@/types/model-types-constructor-new';
import { ApUser } from '@/types/model-types-new';
import { notify } from '@/utils/uiReducerActions';
import AddEditUser from './AddEditUser';
import AccessRole from './tabs/AccessRole';
import LicensesTab from './tabs/LicensesTab';
import DepartmentsTab from './tabs/DepartmentsTab';
import ResetPasswordTab from './tabs/ResetPasswordTab';

import './styles.less';

const Users = () => {
  const dispatch = useAppDispatch();

  const [user, setUser] = useState<ApUser>({ ...newApUser });
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [canProceed, setCanProceed] = useState(false);
  const [openConfirmDeleteUserModal, setOpenConfirmDeleteUserModal] = useState<boolean>(false);
  const [stateOfDeleteUserModal, setStateOfDeleteUserModal] = useState<string>('delete');
  const [popupOpen, setPopupOpen] = useState(false);

  const [filters, setFilters] = useState({
    name: '',
    email: '',
    login: '',
  });

  const [saveUser] = useAddUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [resendCreatePasswordEmail] = useResendCreatePasswordEmailMutation();
  const [toggleUserActivation] = useToggleUserActivationMutation();

  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const {
    data: usersResponse,
    isLoading,
    refetch,
  } = useGetUsersBasicQuery({
    page: pageIndex,
    size: rowsPerPage,
    sort: 'id,asc',
    name: filters.name,
    email: filters.email,
    login: filters.login,
  });

  const { data: facilityListResponse, refetch: refetchFacility } = useGetFacilitiesQuery({
    ...initialListRequest,
    pageSize: 1000,
  });

  const users = usersResponse?.data ?? [];
  const totalCount = usersResponse?.totalCount ?? 0;

  useEffect(() => {
    dispatch(setPageCode('Users'));
    dispatch(setDivContent('Users'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCanProceed(!!(popupOpen && user?.id));
  }, [popupOpen, user]);

  const isSelected = rowData => {
    if (rowData && user && rowData.id === user.id) {
      return 'selected-row';
    }
    return '';
  };

  const formatErrorKey = (msg?: string) => {
    if (!msg) return '';

    const key = msg.split('.').pop() || msg;

    return key
      .replace(/exists/gi, ' already exists')
      .replace(/user/gi, 'login name')
      .replace(/email/gi, 'Email')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, s => s.toUpperCase());
  };

  const handleSave = async () => {
    try {
      if (user.id !== undefined) {
        const response = await updateUser({ ...user }).unwrap();

        dispatch(notify({ msg: 'The User has been updated successfully', sev: 'success' }));
        setUser({ ...response });
        refetch();
      } else {
        await saveUser({ ...user }).unwrap();

        dispatch(notify({ msg: 'The User has been saved successfully', sev: 'success' }));
        refetch();
      }

      refetchFacility();
      setCanProceed(true);
    } catch (error: any) {
      const apiError = error?.data;
      const message = apiError?.message?.toLowerCase();

      const knownErrors: Record<string, string> = {
        'error.emailexists': 'This email is already in use',
        'error.userexists': 'This username is already in use',
      };

      const backendMessage =
        (message && knownErrors[message]) ||
        apiError?.fieldErrors?.[0]?.message ||
        (message ? formatErrorKey(message) : '') ||
        apiError?.detail ||
        'Failed to save user';

      dispatch(
        notify({
          msg: backendMessage,
          sev: 'warning',
        })
      );
    }
  };

  const handleAddNew = () => {
    setUser({ ...newApUser });
    setPopupOpen(true);
  };

 const handleDactivateUser = async data => {
  const isCurrentlyActive = data?.activated === true;
  const process = isCurrentlyActive ? 'Deactivated' : 'Activated';

  try {
    await toggleUserActivation(data.login).unwrap();

    const updatedUser = {
      ...data,
      activated: !isCurrentlyActive,
      hasResetKey: isCurrentlyActive ? false : data?.hasResetKey,
    };

    setUser(updatedUser);
    setOpenConfirmDeleteUserModal(false);

    dispatch(
      notify({
        msg: 'The User was successfully ' + process,
        sev: 'success',
      })
    );

    refetch();
  } catch (error) {
    dispatch(
      notify({
        msg: 'Failed to ' + process + ' this User',
        sev: 'error',
      })
    );
  }
};
  const handleResendCreatePassword = async (login: string) => {
    try {
      await resendCreatePasswordEmail(login).unwrap();

      dispatch(
        notify({
          msg: 'Create password email sent successfully',
          sev: 'success',
        })
      );
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to send create password email',
          sev: 'error',
        })
      );
    }
  };

  const getUserStatus = (rowData: ApUser) => {
    const isPendingCreatePassword =
      rowData?.activated === false && rowData?.hasResetKey === true;

    const isDisabledByAdmin =
      rowData?.activated === false && rowData?.hasResetKey !== true;

    return {
      isPendingCreatePassword,
      isDisabledByAdmin,
      isActive: rowData?.activated === true,
    };
  };

  const iconsForActions = (rowData: ApUser) => {
    const { isPendingCreatePassword, isDisabledByAdmin } = getUserStatus(rowData);

    return (
      <div
        className="container-of-icons"
        style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
      >
        <MdModeEdit
          className="icons-style"
          title="Edit"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setPopupOpen(true);
            setUser(rowData);
          }}
        />

        {rowData?.activated ? (
          <Whisper
            placement="top"
            trigger="hover"
            speaker={<Tooltip>Deactivate account</Tooltip>}
          >
            <span style={{ display: 'inline-flex' }}>
              <MdDelete
                title="Deactivate"
                size={24}
                fill="var(--primary-pink)"
                className="icons-style"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setUser(rowData);
                  setStateOfDeleteUserModal('deactivate');
                  setOpenConfirmDeleteUserModal(true);
                }}
              />
            </span>
          </Whisper>
        ) : (
          <>
            {isPendingCreatePassword && (
              <Whisper
                placement="top"
                trigger="hover"
                speaker={<Tooltip>Account is not opened yet. Resend create password email</Tooltip>}
              >
                <span style={{ position: 'relative', display: 'inline-flex' }}>
                  <MdOutlineMail
                    className="icons-style"
                    title="Resend Create Password"
                    size={24}
                    fill="var(--primary-gray)"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleResendCreatePassword(rowData.login)}
                  />

                  <span
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'red',
                    }}
                  />
                </span>
              </Whisper>
            )}

            {isDisabledByAdmin && (
              <Whisper
                placement="top"
                trigger="hover"
                speaker={<Tooltip>Reactivate inactive account</Tooltip>}
              >
                <span style={{ display: 'inline-flex' }}>
                  <FaUndo
                    title="Reactivate"
                    size={22}
                    fill="var(--primary-gray)"
                    className="icons-style"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setUser(rowData);
                      setStateOfDeleteUserModal('reactivate');
                      setOpenConfirmDeleteUserModal(true);
                    }}
                  />
                </span>
              </Whisper>
            )}
          </>
        )}
      </div>
    );
  };

  const tableColumns = [
    {
      key: 'fullName',
      title: <Translate>Full Name</Translate>,
      flexGrow: 4,
      render: rowData => (
        <Whisper
          placement="top"
          trigger="hover"
          speaker={
            <Tooltip>
              <p>Facilities:</p>
              {(facilityListResponse?.object ?? []).map((item, index) => (
                <p key={index}>{item.facilityName}</p>
              ))}
            </Tooltip>
          }
        >
          <p>
            {rowData?.firstName} {rowData?.lastName}
          </p>
        </Whisper>
      ),
    },
    {
      key: 'login',
      title: <Translate>User Name</Translate>,
      flexGrow: 3,
    },
    {
      key: 'email',
      title: <Translate>Email</Translate>,
      flexGrow: 4,
    },
    {
      key: 'phoneNumber',
      title: <Translate>Phone Number</Translate>,
      flexGrow: 4,
    },
    {
      key: 'admin',
      title: <Translate>Admin</Translate>,
      flexGrow: 2,
      render: rowData => (rowData?.admin ? 'True' : 'False'),
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 3,
      render: rowData => {
        const { isPendingCreatePassword, isDisabledByAdmin, isActive } = getUserStatus(rowData);

        if (isActive) {
          return <span style={{ color: 'green' }}>Active</span>;
        }

        if (isPendingCreatePassword) {
          return <span style={{ color: 'orange' }}>Pending Password</span>;
        }

        if (isDisabledByAdmin) {
          return (
            <span style={{ color: 'red', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MdPersonOff size={18} />
              Inactive
            </span>
          );
        }

        return '-';
      },
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData),
    },
  ];

  const tableFilters = (
    <Form fluid>
      <div className="users-table-main-filter-container">
        <MyInput
          fieldName="name"
          fieldLabel="Name"
          fieldType="text"
          record={filters}
          setRecord={setFilters}
        />

        <MyInput
          fieldName="email"
          fieldType="text"
          fieldLabel="Email"
          record={filters}
          setRecord={setFilters}
        />

        <MyInput
          fieldName="login"
          fieldType="text"
          fieldLabel="Username"
          record={filters}
          setRecord={setFilters}
        />
      </div>
    </Form>
  );

  const tabData = [
    {
      title: 'Privilege',
      content: <AccessRole user={user} />,
      disabled: !user?.id,
    },
    {
      title: 'Licenses & Certifications',
      content: <LicensesTab user={user} />,
      disabled: !user?.id,
    },
    {
      title: 'Reset Password',
      content: <ResetPasswordTab user={user} width={width} />,
      disabled: !user?.id || !user?.activated, // Disable if user is inactive without pending create password
    },
    {
      title: 'Departments',
      content: <DepartmentsTab user={user} width={width} />,
      disabled: !user?.id,
    },
  ];

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  const handlePageChange = (_: unknown, newPage: number) => {
    setPageIndex(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageIndex(0);
  };

  return (
    <div dir={dir}>
      <Panel>
        <MyTable
          data={users}
          columns={tableColumns}
          rowClassName={isSelected}
          onRowClick={rowData => setUser(rowData)}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          filters={tableFilters}
          loading={isLoading}
          tableButtons={
            <div className="container-of-add-new-button">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={handleAddNew}
                width="109px"
              >
                Add New
              </MyButton>
            </div>
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
      </Panel>

      {user?.id && (
        <Box mt={3}>
          <MyTab data={tabData} />
        </Box>
      )}

      <DeletionConfirmationModal
        open={openConfirmDeleteUserModal}
        setOpen={setOpenConfirmDeleteUserModal}
        itemToDelete="User"
        actionButtonFunction={() => handleDactivateUser(user)}
        actionType={stateOfDeleteUserModal}
      />
    </div>
  );
};

export default Users;