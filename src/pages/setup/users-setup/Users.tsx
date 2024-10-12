import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table, TagPicker, Radio, RadioGroup, PanelGroup, Placeholder } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import PageEndIcon from '@rsuite/icons/PageEnd';
import { Block, Check, DocPass, Edit, History, Icon, PlusRound, Detail } from '@rsuite/icons';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import ReloadIcon from '@rsuite/icons/Reload';

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
  useResetUserPasswordMutation
} from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApLicense, ApUser, ApUserMedicalLicense } from '@/types/model-types';
import { newApFacility, newApUser, newApUserMedicalLicense } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import {
  addFilterToListRequest,
  conjureValueBasedOnKeyFromList,
  fromCamelCaseToDBName
} from '@/utils';
import ArowBackIcon from '@rsuite/icons/ArowBack';
import {
  useGetLovValuesByCodeQuery,
  useRemoveUserMutation
} from '@/services/setupService';
import { first } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import MyToast from '@/components/MyToast/MyToast';

const Users = () => {
  // const [facilities, setFacilities] = useState([])

  const [user, setUser] = useState<ApUser>({
    ...newApUser
  });

  const [userLicense, setUserLicense] = useState<ApUserMedicalLicense>({
    ...newApUserMedicalLicense
  });
  const [readyUser, setReadyUser] = useState({
    user
  });

  const [selectedLicense, setSelectedLicense] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(newApFacility);

  useEffect(() => {
    console.log(selectedFacility)
    if (selectedFacility) {
      console.log(selectedFacility)
      console.log(departmentsListResponse?.object)

      const selectedFacilities = selectedFacility?.key

      const filtered = departmentsListResponse?.object?.filter(department =>
        selectedFacilities.includes(department.facilityKey)
      ) ?? [];

      console.log(filtered)
      setFilteredDepartments(filtered);
    }


  }, [selectedFacility])

  const [saveUserMidicalLicense, setSaveUserMidicalLicense] = useSaveUserMidicalLicenseMutation();
  const [removeUserMidicalLicense, setRemoveUserMidicalLicense] = useRemoveUserMidicalLicenseMutation();
  const [resetUserPassword,setResetUserPassword] = useResetUserPasswordMutation()


  const [popupOpen, setPopupOpen] = useState(false);
  const [licensePopupOpen, setLicensePopupOpen] = useState(false);

  const [resetPasswordPopupOpen, setResetPasswordPopupOpen] = useState();

  const [userBrowsing, setUserBrowsing] = useState(false);
  const [resetVia, setResetVia] = useState('email')


  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });

  const { data: licenseListResponse, refetch: refetchLicense } = useGetLicenseQuery(listRequest);

  const [saveUser, saveUserMutation] = useSaveUserMutation();

  const { data: userListResponse, refetch: refetchUsers } = useGetUsersQuery(listRequest);
  const { data: accessRoleListResponse } = useGetAccessRolesQuery({
    ...initialListRequest,
    pageSize: 1000
  });
  const { data: facilityListResponse } = useGetFacilitiesQuery({
    ...initialListRequest,
    pageSize: 1000
  });
  const { data: departmentsListResponse, refetch: refetchDepartments } = useGetDepartmentsQuery({
    ...initialListRequest,
    pageSize
      : 1000
  });

  const { data: userDepartmentsResponse, refetch: refetchUserDepartments } = useGetUserDepartmentsQuery(user?.key);

  useEffect(() => {
    console.log(userDepartmentsResponse)
  }, [userDepartmentsResponse])

  const { data: gndrLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  const { data: jobRoleLovQueryResponse } = useGetLovValuesByCodeQuery('JOB_ROLE');
  const [detailsPanle, setDetailsPanle] = useState(false);
  const [editing, setEditing] = useState();
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);

  useEffect(() => {
    console.log(filteredDepartments)
  }, [filteredDepartments])

  useEffect(() => {
    const filterKeys = user._facilitiesInput || [];
    const filtered = facilityListResponse?.object?.filter(facility =>
      filterKeys.includes(facility.key)
    ) ?? [];
    setFilteredFacilities(filtered);
  }, [facilityListResponse?.object, user._facilitiesInput]);

  const [removeUser, { isLoading, isSuccess, isError }] = useRemoveUserMutation();


  const handleSaveLicense = () => {


    console.log(licenseListResponse)
    console.log(userLicense)

    saveUserMidicalLicense({
      ...userLicense,
      userKey: user.key
    }).unwrap().then(() => {
      refetchLicense()
      handleCloseLicense()
    })
  }

  const handleRemoveLicense = () => {
    removeUserMidicalLicense(userLicense).unwrap().then(() => {
      refetchLicense()
      handleCloseLicense()

    })
  }

  const handleCloseLicense = () => {
    setLicensePopupOpen(false)
    setUserLicense(newApUserMedicalLicense)
    setSelectedLicense(newApUserMedicalLicense)
  }

  const [newDepartmentPopupOpen, setNewDepartmentPopupOpen] = useState(false)

  const handleSave = () => {
    saveUser({ ...user, selectedDepartmentsFacilityKey: selectedFacility?.key }).unwrap().then(() => {
      setEditing(false)
      refetchUsers()
      setSelectedFacility(null)
      setUser({ ...user, _depratmentsInput: [] })
      setNewDepartmentPopupOpen(false)
      refetchDepartments()

    })
    if (!detailsPanle) {
      setUser(newApUser)

    }
    console.log(user)

  };

  const handleResetPassword = () => {
    console.log(resetVia)
    resetUserPassword(user).then(()=>{
      console.log(`${user.firstName}'s password was successfully changed`)
    }).then(()=>{
      setResetPasswordPopupOpen(false)
    })

  };

  useEffect(() => {
    if (saveUserMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveUserMutation.data]);

  const isSelected = rowData => {
    if (rowData && user && rowData.key === user.key) {
      return 'selected-row';
    } else return '';
  };

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
    setPopupOpen(true);
    setReadyUser(newApUser)
    setUser(newApUser)

  }

  const handleRemoveUser = async (data) => {
    console.log('removing ' + data.key)
    try {
      const response = await removeUser({
        user: data
      }).unwrap().then(() => {
        refetchUsers()
      });

      console.log('user removed successfully:', response);
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };



  const InputForms = (editing) => {
    return (
      <div>
        <Form layout='inline' fluid>
          <MyInput disabled={!editing} column fieldName="firstName" required record={user} setRecord={setUser} />
          <MyInput disabled={!editing} column fieldName="secondName" required record={user} setRecord={setUser} />
          <MyInput disabled={!editing} column fieldName="lastName" required record={user} setRecord={setUser} />
          <MyInput disabled={true} column fieldName="fullName" required record={user} setRecord={setUser} />

        </Form>

        <Form layout='inline' fluid>

          <MyInput disabled={!editing} column fieldName="username" required record={readyUser} setRecord={setReadyUser} />
          <MyInput disabled={!editing}
            column
            fieldName="password"
            required
            fieldType="password"
            record={user}
            setRecord={setUser}
          />

        </Form>


        <Form layout='inline' fluid>
          <MyInput disabled={!editing} column fieldName="email" required record={user} setRecord={setUser} />
          <MyInput disabled={!editing} column fieldName="phoneNumber" required record={user} setRecord={setUser} />

          <MyInput disabled={!editing}
            column
            fieldLabel="sex at birth"
            fieldType="select"
            fieldName="sexAtBirthLkey"
            selectData={gndrLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={user}
            setRecord={setUser}
          />

          <MyInput disabled={!editing}
            column
            fieldType="date"
            fieldLabel="DOB"
            fieldName="dob"
            record={user}
            setRecord={setUser}
          />

        </Form>


        <Form
          // onClick={() => {
          //   const filterKeys = user._facilitiesInput; // This is the array you want to filter on ['3', '32260644964500']

          //   const filteredFacilities = facilityListResponse?.object?.filter(facility =>
          //     filterKeys.includes(facility.key)
          //   ) ?? [];

          //   console.log(filteredFacilities); // This will log the filtered facilities based on user._facilitiesInput
          // }}
          layout='inline'
          fluid
        >
          <MyInput disabled={!editing}
            width={300}
            column
            fieldLabel="Facility"
            selectData={facilityListResponse?.object ?? []}
            fieldType="multyPicker"
            selectDataLabel="facilityName"
            selectDataValue="key"
            fieldName="_facilitiesInput"
            record={user}
            setRecord={setUser}
          />

          <MyInput disabled={!editing}
            column
            fieldName="accessRoleKey"
            fieldType="select"
            selectData={accessRoleListResponse?.object ?? []}
            selectDataLabel="name"
            selectDataValue="key"
            record={user}
            setRecord={setUser}
          />

          <MyInput disabled={!editing}
            column
            fieldLabel="job role"
            fieldType="select"
            fieldName="jobRoleLkey"
            selectData={jobRoleLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={user}
            setRecord={setUser}
          />

          <MyInput disabled={!editing} column fieldName="jobDescription" required record={user} setRecord={setUser} />


          <MyInput disabled={!editing}
            width={165}
            column
            fieldLabel="Active User"
            fieldType="checkbox"
            fieldName="isValid"
            record={user}
            setRecord={setUser}
          />
        </Form>
      </div>
    )
  }




  useEffect(() => {
    console.log(user)
    if (user.firstName)
      setReadyUser({
        ...user,
        fullName: user.firstName + ' ' + user.lastName,
        username: (user.firstName.slice(0, 1) + user.lastName).toLowerCase()
      })
  }, [user])


  useEffect(() => {
    console.log(resetPasswordPopupOpen)

  }, [resetPasswordPopupOpen])

  const handleShowInsuranceDetails = () => {
    setPopupOpen(true)
    setUserBrowsing(true)
  }

  useEffect(() => {
    setUserLicense(selectedLicense)
  }, [selectedLicense])



  return (
    <div>


      {
        detailsPanle ?
          <div style={{ height: "900px" }}>
            <Panel style={{ background: 'white' }}
              header={
                <h3 className="title">
                  <Translate>User Details</Translate>
                </h3>
              }
            >
              <ButtonToolbar>
                <IconButton appearance="primary" icon={<ArowBackIcon />}
                  onClick={() => setDetailsPanle(false)}>
                  Back
                </IconButton>
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

                <IconButton appearance="primary" color='red' icon={<ReloadIcon />}
                  onClick={() => setResetPasswordPopupOpen(true)}>
                  Reset Password
                </IconButton>
              </ButtonToolbar>
              <hr />

              {InputForms(editing)}


              <Tabs>
                <TabList>

                  <Tab>
                    <Translate>Departments</Translate>
                  </Tab>
                  <Tab>
                    <Translate>Privilege</Translate>
                  </Tab>
                  <Tab>
                    <Translate>Licenses & Creftificated</Translate>
                  </Tab>
                  <Tab>
                    <Translate>Shifts</Translate>
                  </Tab>
                  <Tab>
                    <Translate>Cloned Users</Translate>
                  </Tab>
                  <Tab>
                    <Translate>Edit Log</Translate>
                  </Tab>

                </TabList>

                <TabPanel>
                  <hr />
                  <ButtonToolbar>
                    <IconButton appearance="primary" icon={<AddOutlineIcon />} disabled={!selectedFacility?.key}
                      onClick={() => setNewDepartmentPopupOpen(true)}
                    >
                      New Department
                    </IconButton>


                  </ButtonToolbar>
                  <br />

                  <PanelGroup accordion
                    // defaultActiveKey={1}
                    bordered>
                    {filteredFacilities.map((facility, index) => (
                      <Panel onSelect={() => { setSelectedFacility(facility) }} key={facility.key} header={"Facility : " + facility.facilityName} eventKey={index + 1}>

                        <Table
                          height={200}
                          // sortColumn={patientRelationListRequest.sortBy}
                          // sortType={patientRelationListRequest.sortType}
                          onSortColumn={(sortBy, sortType) => {
                            if (sortBy)
                              setListRequest({
                                ...listRequest,
                                sortBy,
                                sortType
                              });
                          }}
                          // onRowClick={(rowData) => { setSelectedLicense(rowData), console.log((rowData)) }}
                          headerHeight={40}
                          rowHeight={50}
                          bordered
                          cellBordered
                          data={
                            selectedFacility && userDepartmentsResponse?.object
                              ? userDepartmentsResponse.object.filter(department => 
                                  department.facilitiyKey === selectedFacility.key // Match facility
                                )
                              : []
                          }
                        >
                          <Column sortable flexGrow={4}>
                            <HeaderCell>
                              <Translate>Facility Name</Translate>
                            </HeaderCell>
                            <Cell dataKey="facilityName" />
                          </Column>

                          <Column sortable flexGrow={4}>
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
                        setLicensePopupOpen(true)
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
                      appearance="primary" color="red" icon={<TrashIcon />}
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
                        setListRequest({
                          ...listRequest,
                          sortBy,
                          sortType
                        });
                    }}
                    onRowClick={(rowData) => { setSelectedLicense(rowData), console.log((rowData)) }}
                    headerHeight={40}
                    rowHeight={50}
                    bordered
                    cellBordered
                    data={
                      licenseListResponse.object ?? []
                    }
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

          :
          <div>
            <Panel style={{ background: 'white' }}
              header={
                <h3 className="title">
                  <Translate>Users</Translate>
                </h3>
              }
            >
              <ButtonToolbar>
                <IconButton
                  appearance="primary" icon={<AddOutlineIcon />} onClick={handleAddNew}>
                  Add New
                </IconButton>
                <IconButton
                  disabled={!user.key}
                  appearance="primary"
                  onClick={() => { setDetailsPanle(true) }}
                  color="green"
                  icon={<EditIcon />}
                >
                  Edit Selected
                </IconButton>
                <IconButton
                  disabled={!user.key}
                  appearance="primary"
                  color="red"
                  icon={<TrashIcon />}
                  onClick={() => handleRemoveUser(user)}

                >
                  Delete Selected
                </IconButton>

              </ButtonToolbar>
              <hr />
              <Table
                height={400}
                sortColumn={listRequest.sortBy}
                sortType={listRequest.sortType}
                onSortColumn={(sortBy, sortType) => {
                  if (sortBy)
                    setListRequest({
                      ...listRequest,
                      sortBy,
                      sortType
                    });
                }}
                headerHeight={80}
                rowHeight={60}
                bordered
                cellBordered
                data={userListResponse?.object ?? []}
                onRowClick={rowData => {
                  setUser(rowData);
                }}
                rowClassName={isSelected}
              >

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Input onChange={e => handleFilterChange('fullName', e)} />
                    <Translate>Full Name</Translate>
                  </HeaderCell>
                  <Cell dataKey="fullName" />
                </Column>

                <Column sortable flexGrow={3}>
                  <HeaderCell align="center">
                    <Input onChange={e => handleFilterChange('username', e)} />
                    <Translate>Username</Translate>
                  </HeaderCell>
                  <Cell dataKey="username" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Input onChange={e => handleFilterChange('email', e)} />
                    <Translate>Email</Translate>
                  </HeaderCell>
                  <Cell dataKey="email" />
                </Column>
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Input onChange={e => handleFilterChange('phoneNumber', e)} />
                    <Translate>Phone Number</Translate>
                  </HeaderCell>
                  <Cell dataKey="phoneNumber" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Input onChange={e => handleFilterChange('jobDescription', e)} />
                    <Translate>Job Description</Translate>
                  </HeaderCell>
                  <Cell dataKey="jobDescription" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Input onChange={e => handleFilterChange('organizationKey', e)} />
                    <Translate>Organization</Translate>
                  </HeaderCell>
                  <Cell>
                    {rowData => (
                      <span>
                        {conjureValueBasedOnKeyFromList(
                          facilityListResponse?.object ?? [],
                          rowData.accessRoleKey,
                          'facilityName'
                        )}
                      </span>
                    )}
                  </Cell>
                </Column>
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Input onChange={e => handleFilterChange('accessRoleKey', e)} />
                    <Translate>Access Role</Translate>
                  </HeaderCell>
                  <Cell>
                    {rowData => (
                      <span>
                        {conjureValueBasedOnKeyFromList(
                          accessRoleListResponse?.object ?? [],
                          rowData.accessRoleKey,
                          'name'
                        )}
                      </span>
                    )}
                  </Cell>
                </Column>


              </Table>
              <div style={{ padding: 20 }}>
                <Pagination
                  prev
                  next
                  first
                  last
                  ellipsis
                  boundaryLinks
                  maxButtons={5}
                  size="xs"
                  layout={['limit', '|', 'pager']}
                  limitOptions={[5, 15, 30]}
                  limit={listRequest.pageSize}
                  activePage={listRequest.pageNumber}
                  onChangePage={pageNumber => {
                    setListRequest({ ...listRequest, pageNumber });
                  }}
                  onChangeLimit={pageSize => {
                    setListRequest({ ...listRequest, pageSize });
                  }}
                  total={userListResponse?.extraNumeric ?? 0}
                />
              </div>

              <Modal size={'lg'} open={popupOpen} overflow>
                <Modal.Title>
                  <Translate>New/Edit User</Translate>
                </Modal.Title>
                <Modal.Body>
                  {InputForms(true)}
                </Modal.Body>
                <Modal.Footer>
                  <Stack spacing={2} divider={<Divider vertical />}>
                    <Button appearance="primary" onClick={() => { handleSave(), setUserBrowsing(false) }}>
                      Save
                    </Button>
                    <Button appearance="primary" color="red" onClick={() => { setPopupOpen(false), setUserBrowsing(false) }}>
                      Cancel
                    </Button>
                  </Stack>
                </Modal.Footer>
              </Modal>


            </Panel>
          </div>


      }
      {/* <========================= Password Modal ===========================> */}
      <Modal size={'lg'} open={resetPasswordPopupOpen} overflow>
        <Modal.Title>
          <Translate>{`Reset Password for ${user.firstName}`}</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form layout='inline' fluid >
            <MyInput disabled column fieldName="email" record={user} setRecord={setUser} />
            <MyInput disabled column fieldName="phoneNumber" record={user} setRecord={setUser} />
          </Form>
          <span>How would you like to reset the password?</span>
          <RadioGroup onChange={(e) => setResetVia(e)} name="radio-group-inline" defaultValue="email">
            <Radio value="email">Email</Radio>
            <Radio value="phone">Phone Number</Radio>
          </RadioGroup>

        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button appearance="primary" onClick={() => { handleResetPassword() }}>
              Reset
            </Button>
            <Button appearance="primary" color="red" onClick={() => { setResetPasswordPopupOpen(false) }}>
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
          <Form fluid layout='inline'>
            <MyInput column fieldName="licenseName" required record={userLicense} setRecord={setUserLicense} />
            <MyInput column fieldName="licenseNumber" required record={userLicense} setRecord={setUserLicense} />
          </Form>

          <Form fluid layout='inline'>
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
            <Button appearance="primary" onClick={() => handleSaveLicense()} >
              Save
            </Button>
            <Button appearance="primary" color="red" onClick={() => { handleCloseLicense() }}>
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
          <Form fluid layout='inline'>
            <MyInput
              required
              width={300}
              column
              fieldLabel="Departments"
              fieldType="multyPicker"
              fieldName="genderLkey"
              selectData={filteredDepartments}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              selectDataLabel="name"
              fieldName="_depratmentsInput"
              record={user}
              setRecord={setUser}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button appearance="primary"
              onClick={() => {
                handleSave(),
                  console.log({ ...user, selectedDepartmentsFacilityKey: selectedFacility?.key })

              }}
            >
              Save
            </Button>
            <Button appearance="primary" color="red" onClick={() => { setNewDepartmentPopupOpen(false) }}>
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
