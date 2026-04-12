import Translate from '@/components/Translate';
import {
  useDeactivateUserMutation,
  useGetFacilitiesQuery,
} from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useEffect, useState } from 'react';
import { MdModeEdit } from 'react-icons/md';
import { Panel, Tooltip, Whisper, Form } from 'rsuite';

import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MyTab from '@/components/MyTab';
import { Box } from '@mui/material';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAddUserMutation, useGetUsersBasicQuery, useUpdateUserMutation } from '@/services/userService';
import { newApUser } from '@/types/model-types-constructor-new';
import { ApUser } from '@/types/model-types-new';
import { notify } from '@/utils/uiReducerActions';
import ReactDOMServer from 'react-dom/server';
import AddEditUser from './AddEditUser';
import AccessRole from './tabs/AccessRole';
import LicensesTab from './tabs/LicensesTab';
import DepartmentsTab from './tabs/DepartmentsTab';
import ResetPasswordTab from './tabs/ResetPasswordTab';

import './styles.less';
const Users = () => {
  const dispatch = useAppDispatch();
  const [user, setUser] = useState<ApUser>({
    ...newApUser
    // isValid: true
  });

  const [width, setWidth] = useState<number>(window.innerWidth);
  const [canProceed, setCanProceed] = useState(false);
  const [openConfirmDeleteUserModal, setOpenConfirmDeleteUserModal] = useState<boolean>(false);
  const [stateOfDeleteUserModal, setStateOfDeleteUserModal] = useState<string>("delete");
  const [popupOpen, setPopupOpen] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    login: '',
  });

  // Save user
  const [saveUser, saveUserMutation] = useAddUserMutation();
  // Fetch users list response
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


  const [updateUser] = useUpdateUserMutation();

  // Fetch Facilities list response
  const { data: facilityListResponse, refetch: refetchFacility } = useGetFacilitiesQuery({
    ...initialListRequest,
    pageSize: 1000
  });
  // Deactivate/Activate user
  const [deactivateActivateUser] = useDeactivateUserMutation();

  // Pagination values

  const handlePageChange = (_: unknown, newPage: number) => {
    setPageIndex(newPage);
  }
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageIndex(0);

  };

  const users = usersResponse?.data ?? [];
  const totalCount = usersResponse?.totalCount ?? 0;


  // Available fields for filtering
  const filterFields = [
    { label: 'Full Name', value: 'fullName' },
    { label: 'User Name', value: 'login' },
    { label: 'job Role', value: 'jobRoleLvalue' },
    { label: 'Facility', value: 'organizationKey' },
    { label: 'Access Role', value: 'accessRoleKey' }
  ];
  // Page header setup
  const divContent = (
    "Users"
  );


useEffect(() => {
  dispatch(setPageCode('Users'));
  dispatch(setDivContent(divContent));

  return () => {
    dispatch(setPageCode(''));
    dispatch(setDivContent(''));
  };
}, [dispatch]);

  // ClassName for selected row
  const isSelected = rowData => {
    if (rowData && user && rowData.id === user.id) {
      return 'selected-row';
    } else return '';
  };

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

   
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

  // Handle Save User
  const handleSave = async () => {
    try {
      if (user.id !== undefined) {
        const response = await updateUser({ ...user }).unwrap();
        dispatch(notify({ msg: 'The User has been updated successfully', sev: 'success' }));
        setUser({ ...response });
        refetch();
      } else {
        const response = await saveUser({ ...user }).unwrap();

        dispatch(notify({ msg: 'The User has been saved successfully', sev: 'success' }));
        refetch();
      }

      refetchFacility();
      setCanProceed(true);
   } catch (error: any) {
  console.error("❌ Error saving user:", error);

  const apiError = error?.data;
  const message = apiError?.message?.toLowerCase();

  const knownErrors: Record<string, string> = {
    "error.emailexists": "This email is already in use",
    "error.userexists": "This username is already in use",
  };

  const backendMessage =
    (message && knownErrors[message]) ||
    apiError?.fieldErrors?.[0]?.message ||
    (message ? formatErrorKey(message) : '') ||
    apiError?.detail ||
    "Failed to save user";

  dispatch(
    notify({
      msg: backendMessage,
      sev: "warning",
    })
  );
}
  };

  // Handle click on Add New button
  const handleAddNew = () => {
    setUser({ ...newApUser });

    setPopupOpen(true);
  };
  // Handle Deactivate/Activate
  const handleDactivateUser = async data => {
    const process = data.isValid ? 'Deactivated' : 'Activated';
    try {
      await deactivateActivateUser({
        user: { ...data, isValid: !data.isValid }
      })
        .unwrap()
        .then(() => {
          setOpenConfirmDeleteUserModal(false);
          dispatch(notify({ msg: 'The User was successfully ' + process, sev: 'success' }));
          refetch();
        });
    } catch (error) {
      dispatch(notify({ msg: 'Failed to ' + process + ' this User', sev: 'error' }));
    }
  };

  //icons column (Edit, Privilege, Licenses & Certifications, Reset Password, Departments Active/Deactivate)
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
      {/* <FaMedal
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
      /> */}
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
    // {
    //   key: 'jobRoleLvalue',
    //   title: <Translate>job Role</Translate>,
    //   flexGrow: 4,
    //   render: rowData => {
    //     return (
    //       <p>
    //         {rowData.jobRoleLvalue ? rowData.jobRoleLvalue.lovDisplayVale : rowData.jobRoleLkey}
    //       </p>
    //     );
    //   }
    // },
    // {
    //   key: 'organizationKey',
    //   title: <Translate>Facility</Translate>,
    //   flexGrow: 3,
    //   render: rowData => (
    //     <span>
    //       {conjureValueBasedOnKeyFromList(
    //         facilityListResponse?.object ?? [],
    //         rowData.accessRoleKey,
    //         'facilityName'
    //       )}
    //     </span>
    //   )
    // },
    // {
    //   key: 'accessRoleKey',
    //   title: <Translate>Access Role</Translate>,
    //   flexGrow: 3,
    //   render: rowData => (
    //     <span>
    //       {conjureValueBasedOnKeyFromList(
    //         accessRoleListResponse?.object ?? [],
    //         rowData.accessRoleKey,
    //         'name'
    //       )}
    //     </span>
    //   )
    // },
    // {
    //   key: 'isValid',
    //   title: <Translate>Is Valid</Translate>,
    //   flexGrow: 3,
    //   render: rowData => (rowData.isValid ? 'Active' : 'InActive')
    // },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];
  // Filter form rendered above the table
  const tableFilters = (
    <Form fluid>
      <div className='users-table-main-filter-container'>
        <MyInput
          fieldName="name"
          fieldLabel='Name'
          fieldType="text"
          record={filters}
          setRecord={setFilters}
        />

        <MyInput
          fieldName="email"
          fieldType="text"
          fieldLabel='Email'
          record={filters}
          setRecord={setFilters}
        />

        <MyInput
          fieldName="login"
          fieldType="text"
          fieldLabel={<Translate>Username</Translate>}
          record={filters}
          setRecord={setFilters}
        />
      </div>
    </Form>
  );

  useEffect(() => {
    if (popupOpen && user?.id) {
      setCanProceed(true);
    } else {
      setCanProceed(false);
    }
  }, [popupOpen, user]);

  // Tabs for user-related actions (Privilege, Licenses, Reset Password, Departments)
  const tabData = [
    {
      title: 'Privilege',
      content: <AccessRole user={user} />,
      disabled: !user?.id,
    },
    {
      title: 'Licenses & Certifications',
      content: (
        <LicensesTab user={user} />
      ),
      disabled: !user?.id,
    },
    {
      title: 'Reset Password',
      content: (
        <ResetPasswordTab user={user} width={width} />
      ),
      disabled: !user?.id,
    },
    {
      title: 'Departments',
      content: (
        <DepartmentsTab user={user} width={width} />
      ),
      disabled: !user?.id,
    },
  ];

  const tabContent = () => (
    <Box mt={3}>
      <MyTab data={tabData} />
    </Box>
  );

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
      <div>
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
      </div>

      {/* User-related tabs (similar behavior to ProductSetup tabs) */}
      {user?.id && tabContent()}

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
