import Translate from '@/components/Translate';
import {
  useDeactivateUserMutation,
  useGetFacilitiesQuery
} from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useEffect, useState } from 'react';
import { FaAddressCard, FaBuilding, FaMedal } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';
import { Panel, Tooltip, Whisper } from 'rsuite';
import ViewDepartments from './ViewDepartments';
import ViewLicenses from './ViewLicenses';

import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAddUserMutation, useGetUserQuery, useUpdateUserMutation } from '@/services/userService';
import { newApFacility } from '@/types/model-types-constructor';
import { newApUser } from '@/types/model-types-constructor-new';
import { ApUser } from '@/types/model-types-new';
import {
  addFilterToListRequest,
  fromCamelCaseToDBName
} from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import ReactDOMServer from 'react-dom/server';
import { Form } from 'rsuite';
import AddEditUser from './AddEditUser';
import ResetPassword from './ResetPassword';

import './styles.less';
const Users = () => {
  const dispatch = useAppDispatch();
  const [user, setUser] = useState<ApUser>({
    ...newApUser
    // isValid: true
  }); 

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

   const { data: users, isLoading  ,refetch} = useGetUserQuery();
   const [updateUser] = useUpdateUserMutation();
  
 
  // Fetch Facilities list response
  const { data: facilityListResponse, refetch: refetchFacility } = useGetFacilitiesQuery({
    ...initialListRequest,
    pageSize: 1000
  });
  // Deactivate/Activate user
  const [deactivateActivateUser] = useDeactivateUserMutation();

   // Pagination values
  const [pageIndex, setPageIndex] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const handlePageChange = (_: unknown, newPage: number) => {
        setPageIndex(newPage);
    }
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPageIndex(0);

    };
    const totalCount = users?.length ?? 0;
    const paginatedData = users?.slice(
        pageIndex * rowsPerPage,
        pageIndex * rowsPerPage + rowsPerPage
    );
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
    
      const saveduser=await updateUser({ ...user } ).unwrap();
      dispatch(notify({ msg: 'The User has been updated successfully', sev: 'success' }));
      setUser({...saveduser})
      refetch();
    } else {
   
     const saveduser= await saveUser({ ...user}).unwrap();
      dispatch(notify({ msg: 'The User has been saved successfully', sev: 'success' }));
      setUser({...saveduser})
      refetch();
    }
   
    

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
            data={paginatedData ?? []}
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
            loading={isLoading}
          />
          <AddEditUser
            open={popupOpen}
            setOpen={setPopupOpen}
            user={user}
            setUser={setUser}
            handleSave={handleSave}
           
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
