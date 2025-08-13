import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel, Whisper, Tooltip } from 'rsuite';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { FaMedal } from 'react-icons/fa';
import { FaAddressCard } from 'react-icons/fa';
import { FaUndo } from 'react-icons/fa';
import { RiLockPasswordFill } from 'react-icons/ri';
import ViewDepartments from './ViewDepartments';
import ViewLicenses from './ViewLicenses';
import { FaBuilding } from 'react-icons/fa';
import {
  useGetAccessRolesQuery,
  useGetFacilitiesQuery,
  useGetUsersQuery,
  useSaveUserMutation,
  useDeactivateUserMutation
} from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';

import { newApFacility } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import {
  addFilterToListRequest,
  conjureValueBasedOnKeyFromList,
  fromCamelCaseToDBName
} from '@/utils';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import AddEditUser from './AddEditUser';
import { notify } from '@/utils/uiReducerActions';
import MyButton from '@/components/MyButton/MyButton';
import ResetPassword from './ResetPassword';
import './styles.less';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { ApUser } from '@/types/model-types-new';
import { newApUser } from '@/types/model-types-constructor-new';
import { useAddUserMutation, useGetUserQuery, useUpdateUserMutation } from '@/services/userService';
const Users = () => {
  const dispatch = useAppDispatch();
  const [user, setUser] = useState<ApUser>({
    ...newApUser
    // isValid: true
  });
  console.log(newApUser)
  const [readyUser, setReadyUser] = useState(user);
  const [selectedFacility] = useState(newApFacility);
 
  const [record, setRecord] = useState({ filter: '', value: '' });
  const [width, setWidth] = useState<number>(window.innerWidth);

  const [openConfirmDeleteUserModal, setOpenConfirmDeleteUserModal] = useState<boolean>(false);
  const[stateOfDeleteUserModal, setStateOfDeleteUserModal] = useState<string>("delete");
  const [popupOpen, setPopupOpen] = useState(false);
  const [licensePopupOpen, setLicensePopupOpen] = useState(false);
  const [departmentsPopupOpen, setDepartmentsPopupOpen] = useState(false);
  const [resetPasswordPopupOpen, setResetPasswordPopupOpen] = useState<boolean>();
  
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  // Save user
  const [saveUser, saveUserMutation] = useAddUserMutation();
  // Fetch users list response
  const {data: userListResponse, refetch: refetchUsers, isFetching} = useGetUsersQuery(listRequest);
   const { data: users, isLoading  ,refetch} = useGetUserQuery();
   const [updateUser] = useUpdateUserMutation();
  // Fetch accessRoles list response
  const { data: accessRoleListResponse } = useGetAccessRolesQuery({
    ...initialListRequest,
    pageSize: 1000
  });
  // Fetch Facilities list response
  const { data: facilityListResponse, refetch: refetchFacility } = useGetFacilitiesQuery({
    ...initialListRequest,
    pageSize: 1000
  });
  // Deactivate/Activate user
  const [deactivateActivateUser] = useDeactivateUserMutation();

   // Pagination values
   const pageIndex = listRequest.pageNumber - 1;
   const rowsPerPage = listRequest.pageSize;
   const totalCount = userListResponse?.extraNumeric ?? 0;
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
    <div className='page-title'>
      <h5>Users</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Users'));
  dispatch(setDivContent(divContentHTML));
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

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  useEffect(() => {
    if (saveUserMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveUserMutation.data]);

  useEffect(() => {
    if (record['filter']) {
      handleFilterChange(record['filter'], record['value']);
    } else {
      setListRequest({
        ...initialListRequest,
        filters: [
          {
            fieldName: 'deleted_at',
            operator: 'isNull',
            value: undefined
          }
        ],
        pageSize: listRequest.pageSize,
        pageNumber: 1
      });
    }
  }, [record]);

 
  // Handle Save User
const handleSave = async () => {
  try {
    if (user.id !== undefined) {
    
      await updateUser({ ...user ,
        genderLkey:user.genderLkey?parseInt(user.genderLkey.toString(), 10):null
      ,jobRoleLkey: user.jobRoleLkey != null ? parseInt(user.jobRoleLkey.toString(), 10) : null}).unwrap();
      dispatch(notify({ msg: 'The User has been updated successfully', sev: 'success' }));
      refetch();
    } else {
   
      await saveUser({ ...user ,
        genderLkey:user.genderLkey?parseInt(user.genderLkey.toString(), 10):null
      ,jobRoleLkey: user.jobRoleLkey != null ? parseInt(user.jobRoleLkey.toString(), 10) : null}).unwrap();
      dispatch(notify({ msg: 'The User has been saved successfully', sev: 'success' }));
      refetch();
    }
    refetchFacility();
    setPopupOpen(false);

  } catch (error) {
    dispatch(notify({ msg: 'Failed to save this User', sev: 'error' }));
  }
};

  // Filter table
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
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
          refetchUsers();
        });
    } catch (error) {
      dispatch(notify({ msg: 'Failed to ' + process + ' this User', sev: 'error' }));
    }
  };
  // Change page
  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };
  // Change number of rows per pages
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
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
          setReadyUser(rowData);
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
    // {
    //   key: 'phoneNumber',
    //   title: <Translate>Phone Number</Translate>,
    //   flexGrow: 4
    // },
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
  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={record}
        setRecord={updatedRecord => {
          setRecord({
            ...record,
            filter: updatedRecord.filter,
            value: ''
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />
      <MyInput
        fieldName="value"
        fieldType="text"
        record={record}
        setRecord={setRecord}
        showLabel={false}
        placeholder="Search"
      />
    </Form>
  );
  return (
    <div>
      <div>
        <Panel>
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
          <MyTable
            data={users ?? []}
            columns={tableColumns}
            rowClassName={isSelected}
            onRowClick={rowData => {
              setUser(rowData);
            }}
            sortColumn={listRequest.sortBy}
            sortType={listRequest.sortType}
            onSortChange={(sortBy, sortType) => {
              if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
            }}
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            filters={filters()}
            loading={isLoading|| isFetching}
          />
          <AddEditUser
            open={popupOpen}
            setOpen={setPopupOpen}
            user={user}
            setUser={setUser}
            readyUser={readyUser}
            setReadyUser={setReadyUser}
            handleSave={handleSave}
            facilityListResponse={facilityListResponse}
            width={width}
          />
        </Panel>
      </div>
      <ResetPassword
        open={resetPasswordPopupOpen}
        setOpen={setResetPasswordPopupOpen}
        user={user}
        setUser={setUser}
        width={width}
      />
      <ViewDepartments open={departmentsPopupOpen} setOpen={setDepartmentsPopupOpen} user={user} width={width} />
      <ViewLicenses open={licensePopupOpen} setOpen={setLicensePopupOpen} user={user} width={width} />
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
