import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import { faLaptop } from '@fortawesome/free-solid-svg-icons';
import { useGetAccessRolesQuery, useGetFacilitiesQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { initialListRequest, ListRequest } from '@/types/types';
import { Input, Modal, Pagination, Panel, Table, Radio, RadioGroup, PanelGroup } from 'rsuite';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import { Form, Stack, Divider } from 'rsuite';
import './styles.less';
import { newApUser } from '@/types/model-types-constructor';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Translate from '@/components/Translate';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import TrashIcon from '@rsuite/icons/Trash';

const { Column, HeaderCell, Cell } = Table;
const AddEditUser = ({
  open,
  setOpen,
//   width,
  user,
//   setUser,
//   readyUser,
//   setReadyUser,
  handleSave,
//   facilityListResponse,
  selectedFacility
//   accessRoleListResponse
}) => {
 
   


  // Modal content
  const conjureFormContent = stepNumber => {
      switch (stepNumber) {
        case 0:
          return (      
          
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
                            //   onClick={() => setNewDepartmentPopupOpen(true)}
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
          );
        }
    };
 
  return (
    <MyModal
    open={open}
                 setOpen={setOpen}
                 title={user?.key ? 'Edit User' : 'New User'}
                 position="right"
                 content={conjureFormContent}
                 actionButtonLabel={user?.key ? 'Save' : 'Create'}
                 actionButtonFunction={handleSave}
                 // size={width > 600 ? '570px' : '300px'}
                 steps={[
                        { title: 'User Info', icon: faUser }
                 ]}
    />
  );
};
export default AddEditUser;