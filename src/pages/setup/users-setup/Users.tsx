import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table, Radio, RadioGroup, PanelGroup } from 'rsuite';
import { faUser } from '@fortawesome/free-solid-svg-icons';
const { Column, HeaderCell, Cell } = Table;
import { Check, Edit, PlusRound } from '@rsuite/icons';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import ReloadIcon from '@rsuite/icons/Reload';
import UserChangeIcon from '@rsuite/icons/UserChange';
import { MdModeEdit } from 'react-icons/md';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { MdDelete } from 'react-icons/md';
import { IoSettingsSharp } from 'react-icons/io5';
import {
  useGetAccessRolesQuery,
  useGetFacilitiesQuery,
  useGetLicenseQuery,
  useGetUsersQuery,
  useSaveUserMutation,
  useGetDepartmentsQuery,
  useSaveUserMidicalLicenseMutation,
  useRemoveUserMidicalLicenseMutation,
  useGetUserDepartmentsQuery,
  useResetUserPasswordMutation,
  useSaveFacilityDepartmentMutation,
  useRemoveUserFacilityDepartmentMutation,
  useDeactivateUserMutation
} from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApUser, ApUserMedicalLicense } from '@/types/model-types';
import { newApFacility, newApUser, newApUserMedicalLicense } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import {
  addFilterToListRequest,
  conjureValueBasedOnKeyFromList,
  fromCamelCaseToDBName
} from '@/utils';
import { useGetLovValuesByCodeQuery, useRemoveUserMutation } from '@/services/setupService';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import BackButton from '@/components/BackButton/BackButton';
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
import AddEditUser from './AddEditUser';
import { notify } from '@/utils/uiReducerActions';

const Users = () => {
  // const [facilities, setFacilities] = useState([])

  const [user, setUser] = useState<ApUser>({
    ...newApUser,
    isValid: true
  });

  const [userLicense, setUserLicense] = useState<ApUserMedicalLicense>({
    ...newApUserMedicalLicense
  });
  const [readyUser, setReadyUser] = useState(user);

  const [selectedLicense, setSelectedLicense] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(newApFacility);

  useEffect(() => {
    if (selectedFacility) {
      const selectedFacilities = selectedFacility?.key;
      const filtered =
        departmentsListResponse?.object?.filter(department =>
          selectedFacilities.includes(department.facilityKey)
        ) ?? [];

      console.log(filtered);
      setFilteredDepartments(filtered);
    }
  }, [selectedFacility]);

  const [saveUserMidicalLicense, setSaveUserMidicalLicense] = useSaveUserMidicalLicenseMutation();
  const [removeUserMidicalLicense, setRemoveUserMidicalLicense] =
    useRemoveUserMidicalLicenseMutation();
  const [resetUserPassword, setResetUserPassword] = useResetUserPasswordMutation();

  const [popupOpen, setPopupOpen] = useState(false);
  const [licensePopupOpen, setLicensePopupOpen] = useState(false);

  const [resetPasswordPopupOpen, setResetPasswordPopupOpen] = useState();

  const [userBrowsing, setUserBrowsing] = useState(false);
  const [resetVia, setResetVia] = useState('email');

  const [selectedDepartmentFromTable, setSelectedDepartmentFromTable] = useState();

  const dispatch = useAppDispatch();

  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [licenseListRequest, setLicenseListRequest] = useState<ListRequest>({
    ...initialListRequest
  });

  const { data: licenseListResponse, refetch: refetchLicense } =
    useGetLicenseQuery(licenseListRequest);

  const [saveUser, saveUserMutation] = useSaveUserMutation();
  const [saveDepartment, saveDepartmentMutation] = useSaveFacilityDepartmentMutation();

  const [removeUserFacilityDepartment, removeUserFacilityDepartmentMutation] =
    useRemoveUserFacilityDepartmentMutation();

  const { data: userListResponse, refetch: refetchUsers } = useGetUsersQuery(listRequest);
  const { data: accessRoleListResponse } = useGetAccessRolesQuery({
    ...initialListRequest,
    pageSize: 1000
  });
  const { data: facilityListResponse, refetch: refetchFacility } = useGetFacilitiesQuery({
    ...initialListRequest,
    pageSize: 1000
  });
  const { data: departmentsListResponse, refetch: refetchDepartments } = useGetDepartmentsQuery({
    ...initialListRequest,
    pageSize: 1000
  });

  const { data: userDepartmentsResponse, refetch: refetchUserDepartments } =
    useGetUserDepartmentsQuery(user?.key);

  // const { data: gndrLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  // const { data: jobRoleLovQueryResponse } = useGetLovValuesByCodeQuery('JOB_ROLE');
  const [detailsPanle, setDetailsPanle] = useState(false);
  const [editing, setEditing] = useState();
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [filteredlicense, setFilteredlicense] = useState([]);
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Users</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Users'));
  dispatch(setDivContent(divContentHTML));
  useEffect(() => {
    if (user?.key && licenseListResponse?.object) {
      const filteredLicenses = licenseListResponse.object.filter(
        license => license.userKey === user.key
      );
      setFilteredlicense(filteredLicenses);
      console.log('Filtered Licenses:', filteredLicenses);
    } else {
      console.log('No user or license list to filter.');
    }
  }, [user, licenseListResponse]);
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);
  useEffect(() => {
    const filterKeys = user._facilitiesInput || [];
    const filtered =
      facilityListResponse?.object?.filter(facility => filterKeys.includes(facility.key)) ?? [];
    setFilteredFacilities(filtered);
  }, [facilityListResponse?.object, user._facilitiesInput]);

  const [removeUser, { isLoading, isSuccess, isError }] = useRemoveUserMutation();
  const [deactivateActivateUser] = useDeactivateUserMutation();

  const [selectedFacilityDepartment, setSelectedFacilityDepartment] = useState();

  const handleSaveLicense = () => {
    saveUserMidicalLicense({
      ...userLicense,
      userKey: user.key
    })
      .unwrap()
      .then(() => {
        refetchLicense();
        handleCloseLicense();
      });
  };

  const handleRemoveLicense = () => {
    removeUserMidicalLicense(userLicense)
      .unwrap()
      .then(() => {
        refetchLicense();
        handleCloseLicense();
      });
  };

  const handleCloseLicense = () => {
    setLicensePopupOpen(false);
    setUserLicense(newApUserMedicalLicense);
    setSelectedLicense(newApUserMedicalLicense);
  };

  const [newDepartmentPopupOpen, setNewDepartmentPopupOpen] = useState(false);

  const handleSave = async () => {
    try {
      const updatedUser = {
        ...user,
        selectedDepartmentsFacilityKey: selectedFacility?.key,
        username: readyUser.username
      };

      await saveUser(updatedUser).unwrap();

      setUser(updatedUser);
      setReadyUser(updatedUser);
      console.log("on save");
      setEditing(false);
      refetchUsers();
      refetchFacility();
      refetchDepartments();
      setNewDepartmentPopupOpen(false);
      setPopupOpen(false);

      console.log('User updated:', updatedUser);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleFacilityDepartmentSave = () => {
    const facilityDepartment = {
      userKey: user?.key,
      departmentKey: selectedFacilityDepartment?.key,
      facilitiyKey: selectedFacility?.key
    };

    saveDepartment(facilityDepartment)
      .unwrap()
      .then(result => {
        console.log('Save successful', result);
        refetchUserDepartments();
        setNewDepartmentPopupOpen(false);
        setSelectedFacilityDepartment(null);
      })
      .catch(error => {
        console.error('Save failed', error);
      });

    console.log(facilityDepartment);
  };

  const handleResetPassword = () => {
    console.log(resetVia);
    resetUserPassword(user)
      .then(() => {
        console.log(`${user.firstName}'s password was successfully changed`);
      })
      .then(() => {
        setResetPasswordPopupOpen(false);
      });
  };

  useEffect(() => {
    if (saveUserMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveUserMutation.data]);

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

  const handleAddNew = () => {
    console.log("on Add New");
    // setReadyUser(newApUser);
    // setUser(newApUser);
    setPopupOpen(true);
    
    console.log("new");
    
  };
  useEffect(()=>{
     console.log("username: " + readyUser?.username);
  },[readyUser]);

  const handleRemoveUser = async data => {
    console.log('removing ' + data.key);
    try {
      const response = await removeUser({
        user: data
      })
        .unwrap()
        .then(() => {
          refetchUsers();
        });

      console.log('user removed successfully:', response);
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };

  const handleDactivateUser = async data => {
    const process = data.isValid ? "Deactivated" : "Activated";
    try {
         await deactivateActivateUser({
        user: { ...data, isValid: !data.isValid }
      })
        .unwrap()
        .then(() => {
          dispatch(notify({msg: "The user was successfully " + process , sev: "success"}));
          refetchUsers();
        });

    } catch (error) {
    }
  };

  const handleRemoveUserFacilityDepartment = () => {
    if (selectedDepartmentFromTable) {
      removeUserFacilityDepartment(selectedDepartmentFromTable)
        .unwrap()
        .then(() => {
          refetchUserDepartments();
          setSelectedDepartmentFromTable(null);
        });
    }
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };
  
     //icons column (View Departments, Add Details, Edite, Active/Deactivate)
     const iconsForActions = (rowData: ApUser) => (
      <div className='container-of-icons-facilities'>
        <IoSettingsSharp
                title="Setup Module Screens"
                size={24}
                fill="var(--primary-gray)"
               
              />
        <MdModeEdit
          title="Edit"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setPopupOpen(true);
            setUser(rowData);
            setReadyUser(rowData);
          }}
        />
        {rowData?.isValid ?
        // back to this function when update the filter(status) in back end 
        <MdDelete
         title="Deactivate"
         size={24}
         fill="var(--primary-pink)"
         onClick={() => handleDactivateUser(rowData)}
         />
        :
        <FontAwesomeIcon title="Active" icon={faRotateRight} style={{color: "var(--primary-gray)" }} onClick={() => handleDactivateUser(rowData)}/>
        }
      </div>
    );

  //Table columns
  const tableColumns = [
    {
      key: 'fullName',
      title: <Translate>Full Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'username',
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
      key: 'jobRoleLvalue',
      title: <Translate>job Role</Translate>,
      flexGrow: 4,
      render: rowData => {
        return (
          <p>
            {rowData.jobRoleLvalue ? rowData.jobRoleLvalue.lovDisplayVale : rowData.jobRoleLkey}
          </p>
        );
      }
    },
    {
      key: 'organizationKey',
      title: <Translate>Facility</Translate>,
      flexGrow: 3,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            facilityListResponse?.object ?? [],
            rowData.accessRoleKey,
            'facilityName'
          )}
        </span>
      )
    },
    {
      key: 'accessRoleKey',
      title: <Translate>Access Role</Translate>,
      flexGrow: 3,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            accessRoleListResponse?.object ?? [],
            rowData.accessRoleKey,
            'name'
          )}
        </span>
      )
    },
    {
      key: 'isValid',
      title: <Translate>Is Valid</Translate>,
      flexGrow: 3,
      render: rowData => (rowData.isValid ? 'Active' : 'InActive')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = userListResponse?.extraNumeric ?? 0;
  const [record, setRecord] = useState({ filter: '', value: '' });
  // Available fields for filtering
  const filterFields = [
    { label: 'Full Name', value: 'fullName' },
    { label: 'User Name', value: 'username' },
    { label: 'job Role', value: 'jobRoleLvalue' },
    { label: 'Facility', value: 'organizationKey' },
    { label: 'Access Role', value: 'accessRoleKey' }
  ];

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
  // Filter form rendered above the table
  const filters = () => (
    <Form layout="inline" fluid className="container-of-filter-fields-department">
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

 


  useEffect(() => {
    console.log(user);
    console.log("in effect 2 use username: " + user.username);
    console.log("in effect 2 readyUser username: " + readyUser.username);
    if (user.username.trim() !== '' && user.username != null) {
      setReadyUser({ ...user, username: readyUser.username ? readyUser.username : user.username });
    } else if (user.firstName) {
      setReadyUser({
        ...user,
        fullName: `${user.firstName} ${user.lastName || ''}`.trim(),
        username: (user.firstName.slice(0, 1) + (user.lastName || '')).toLowerCase()
      });
    }
  }, [user.firstName, user.lastName]);

  useEffect(() => {
    console.log(resetPasswordPopupOpen);
  }, [resetPasswordPopupOpen]);

  const handleShowInsuranceDetails = () => {
    setPopupOpen(true);
    setUserBrowsing(true);
  };

  useEffect(() => {
    setUserLicense(selectedLicense);
  }, [selectedLicense]);

  const handleBack = () => {
    setDetailsPanle(false);
    setReadyUser(newApUser);
    console.log("on back");
  };

  return (
    <div>
      {detailsPanle ? (
        <div style={{ height: '900px' }}>
          <Panel
            style={{ background: 'white' }}
            header={
              <h3 className="title">
                <Translate>User Details</Translate>
              </h3>
            }
          >
            <ButtonToolbar>
              <BackButton text="Back" onClick={handleBack} />
              <IconButton
                disabled={selectedLicense}
                appearance="primary"
                color="orange"
                icon={<Edit />}
                onClick={() => setEditing(true)}
              >
                <Translate>Edit</Translate>
              </IconButton>

              <IconButton
                disabled={!editing}
                appearance="primary"
                color="green"
                icon={<Check />}
                onClick={() => handleSave()}
              >
                <Translate>Save</Translate>
              </IconButton>

              <IconButton
                appearance="primary"
                color="red"
                icon={<ReloadIcon />}
                onClick={() => setResetPasswordPopupOpen(true)}
              >
                Reset Password
              </IconButton>
            </ButtonToolbar>
            <hr />

            {/* {InputForms(editing)} */}

            <Tabs>
              <TabList>
                <Tab>
                  <Translate>Departments</Translate>
                </Tab>
                <Tab>
                  <Translate>Privilege</Translate>
                </Tab>
                <Tab>
                  <Translate>Licenses & Certifications</Translate>
                </Tab>
                <Tab>
                  <Translate>Edit Log</Translate>
                </Tab>
              </TabList>

              <TabPanel>
                <hr />
                <ButtonToolbar>
                  <IconButton
                    appearance="primary"
                    icon={<AddOutlineIcon />}
                    disabled={!selectedFacility?.key}
                    onClick={() => setNewDepartmentPopupOpen(true)}
                  >
                    New Department
                  </IconButton>

                  <IconButton
                    appearance="primary"
                    color="red"
                    icon={<TrashIcon />}
                    disabled={!selectedDepartmentFromTable?.key}
                    onClick={() => handleRemoveUserFacilityDepartment()}
                  >
                    Delete Department
                  </IconButton>
                </ButtonToolbar>
                <br />

                <PanelGroup
                  accordion
                  // defaultActiveKey={1}
                  bordered
                >
                  {filteredFacilities.map((facility, index) => (
                    <Panel
                      onSelect={() => {
                        setSelectedFacility(facility);
                      }}
                      key={facility.key}
                      header={'Facility : ' + facility.facilityName}
                      eventKey={index + 1}
                    >
                      <Table
                        height={200}
                        onRowClick={rowData => {
                          setSelectedDepartmentFromTable(rowData);
                        }}
                        headerHeight={40}
                        rowHeight={50}
                        bordered
                        cellBordered
                        data={
                          selectedFacility && userDepartmentsResponse?.object
                            ? userDepartmentsResponse.object.filter(
                                department => department.facilitiyKey === selectedFacility.key // Match facility
                              )
                            : []
                        }
                      >
                        <Column flexGrow={4}>
                          <HeaderCell>
                            <Translate>Facility Name</Translate>
                          </HeaderCell>
                          <Cell dataKey="facilityName" />
                        </Column>

                        <Column flexGrow={4}>
                          <HeaderCell>
                            <Translate>Department Name</Translate>
                          </HeaderCell>
                          <Cell dataKey="departmentName" />
                        </Column>
                      </Table>
                    </Panel>
                  ))}
                </PanelGroup>
              </TabPanel>

              <TabPanel>
                <h4>Privilege</h4>
              </TabPanel>
              <TabPanel>
                <ButtonToolbar>
                  <IconButton
                    color="cyan"
                    icon={<PlusRound />}
                    onClick={() => {
                      setLicensePopupOpen(true);
                    }}
                    appearance="primary"
                  >
                    New License
                  </IconButton>

                  <IconButton
                    disabled={!selectedLicense?.key}
                    appearance="primary"
                    color="orange"
                    icon={<Edit />}
                    onClick={() => setLicensePopupOpen(true)}
                  >
                    <Translate>Edit</Translate>
                  </IconButton>

                  <IconButton
                    disabled={!selectedLicense?.key}
                    appearance="primary"
                    color="red"
                    icon={<TrashIcon />}
                    onClick={handleRemoveLicense}
                  >
                    <Translate>Delete</Translate>
                  </IconButton>
                </ButtonToolbar>
                <br />
                <br />

                <Table
                  height={600}
                  // sortColumn={patientRelationListRequest.sortBy}
                  // sortType={patientRelationListRequest.sortType}
                  onSortColumn={(sortBy, sortType) => {
                    if (sortBy)
                      setLicenseListRequest({
                        ...licenseListRequest,
                        sortBy,
                        sortType
                      });
                  }}
                  onRowClick={rowData => {
                    setSelectedLicense(rowData);
                  }}
                  headerHeight={40}
                  rowHeight={50}
                  bordered
                  cellBordered
                  data={filteredlicense}
                >
                  <Column sortable flexGrow={4}>
                    <HeaderCell>
                      <Translate>License Name</Translate>
                    </HeaderCell>
                    <Cell dataKey="licenseName" />
                  </Column>

                  <Column sortable flexGrow={4}>
                    <HeaderCell>
                      <Translate>License Number</Translate>
                    </HeaderCell>
                    <Cell dataKey="licenseNumber" />
                  </Column>

                  <Column sortable flexGrow={4}>
                    <HeaderCell>
                      <Translate>Valid To</Translate>
                    </HeaderCell>
                    <Cell dataKey="validTo" />
                  </Column>
                </Table>
              </TabPanel>
              <TabPanel>
                <h4>Shifts</h4>
              </TabPanel>
              <TabPanel>
                <h4>Cloned Users</h4>
              </TabPanel>
              <TabPanel>
                <h4>Edit Log</h4>
              </TabPanel>
            </Tabs>
          </Panel>
        </div>
      ) : (
        <div>
          <Panel style={{ background: 'white' }}>
            <ButtonToolbar>
              <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleAddNew}>
                Add New
              </IconButton>
              <IconButton
                disabled={!user.key}
                appearance="primary"
                onClick={() => {
                  setDetailsPanle(true);
                }}
                color="green"
                icon={<EditIcon />}
              >
                Edit Selected
              </IconButton>
              <IconButton
                disabled={!user.key}
                appearance="primary"
                color={user.isValid ? 'red' : 'green'}
                icon={user.isValid ? <TrashIcon /> : <UserChangeIcon />}
                onClick={() => {
                  handleDactivateUser(user), setUser(newApUser);
                }}
              >
                {user.isValid ? 'Deactivate User' : 'Activate User'}
              </IconButton>
            </ButtonToolbar>
            <hr />
            {/* hanan */}
            
            <MyTable
              data={userListResponse?.object ?? []}
              columns={tableColumns}
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
            />
            <AddEditUser
             open={popupOpen}
             setOpen={setPopupOpen}
           //   width,
             user={user}
             setUser={setUser}
             readyUser={readyUser}
             setReadyUser={setReadyUser}
             handleSave={handleSave}
             facilityListResponse={facilityListResponse}
            />
          </Panel>
        </div>
      )}
      {/* <========================= Password Modal ===========================> */}
      <Modal size={'lg'} open={resetPasswordPopupOpen} overflow>
        <Modal.Title>
          <Translate>{`Reset Password for ${user.firstName}`}</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form layout="inline" fluid>
            <MyInput disabled column fieldName="email" record={user} setRecord={setUser} />
            <MyInput disabled column fieldName="phoneNumber" record={user} setRecord={setUser} />
          </Form>
          <span>How would you like to reset the password?</span>
          <RadioGroup onChange={e => setResetVia(e)} name="radio-group-inline" defaultValue="email">
            <Radio value="email">Email</Radio>
            <Radio disabled value="phone">
              Phone Number
            </Radio>
          </RadioGroup>
        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button
              appearance="primary"
              onClick={() => {
                handleResetPassword();
              }}
            >
              Reset
            </Button>
            <Button
              appearance="primary"
              color="red"
              onClick={() => {
                setResetPasswordPopupOpen(false);
              }}
            >
              Cancel
            </Button>
          </Stack>
        </Modal.Footer>
      </Modal>
      {/* <========================= Password Modal ===========================> */}

      {/* <========================= License Modal ===========================> */}

      <Modal size={'lg'} open={licensePopupOpen} overflow>
        <Modal.Title>
          <Translate>License</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid layout="inline">
            <MyInput
              column
              fieldName="licenseName"
              required
              record={userLicense}
              setRecord={setUserLicense}
            />
            <MyInput
              column
              fieldName="licenseNumber"
              required
              record={userLicense}
              setRecord={setUserLicense}
            />
          </Form>

          <Form fluid layout="inline">
            <MyInput
              column
              fieldType="date"
              fieldLabel="Valid To"
              fieldName="validTo"
              record={userLicense}
              setRecord={setUserLicense}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button appearance="primary" onClick={() => handleSaveLicense()}>
              Save
            </Button>
            <Button
              appearance="primary"
              color="red"
              onClick={() => {
                handleCloseLicense();
              }}
            >
              Cancel
            </Button>
          </Stack>
        </Modal.Footer>
      </Modal>
      {/* <========================= License Modal ===========================> */}

      {/* <========================= New Department Modal ===========================> */}

      <Modal size={'md'} open={newDepartmentPopupOpen} overflow>
        <Modal.Title>
          <Translate>New Department</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid layout="inline">
            <MyInput
              column
              fieldLabel={`${selectedFacility.facilityName} Departments`}
              fieldType="select"
              fieldName="key"
              selectData={filteredDepartments ?? []}
              selectDataLabel="name"
              selectDataValue="key"
              record={selectedFacilityDepartment}
              setRecord={setSelectedFacilityDepartment}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button
              appearance="primary"
              onClick={() => {
                handleFacilityDepartmentSave();
              }}
            >
              Save
            </Button>
            <Button
              appearance="primary"
              color="red"
              onClick={() => {
                setNewDepartmentPopupOpen(false);
              }}
            >
              Cancel
            </Button>
          </Stack>
        </Modal.Footer>
      </Modal>
      {/* <========================= New Department Modal ===========================> */}
    </div>
  );
};

export default Users;
