import React, { useEffect, useState } from "react";
import { Input, Modal, Pagination, Panel, Table, TagPicker, Radio, RadioGroup, PanelGroup, Placeholder } from 'rsuite';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import { Form, Stack, Divider } from 'rsuite';
import Translate from '@/components/Translate';
const { Column, HeaderCell, Cell } = Table;
import ArowBackIcon from '@rsuite/icons/ArowBack';
import ReloadIcon from '@rsuite/icons/Reload';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import TrashIcon from '@rsuite/icons/Trash';
import { Block, Check, DocPass, Edit, History, Icon, PlusRound, Detail } from '@rsuite/icons';
import MyInput from '@/components/MyInput';
import Practitioners from "./Practitioners";
import {
    useGetLovValuesByCodeQuery,
    useRemoveUserMutation
} from '@/services/setupService';


const Details = (props) => {
    const [editing, setEditing] = useState(true);
    const { data: gndrLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const { data: eduLvlLovQueryResponse } = useGetLovValuesByCodeQuery('EDU_LEVEL');

    const { data: specialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SPECIALTY');
    const { data: subSpecialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY');

    useEffect(() => {
        if (props.practitioner)
            console.log(props.practitioner)
    }, [props.practitioner])
    const InputForms = (editing) => {
        return (
            <div>
                <Form layout='inline' fluid>
                    <MyInput disabled={!editing} column fieldName="firstName" required
                        record={props.practitioner} setRecord={props.setpractitioner}
                    />


                    <MyInput disabled={!editing} column fieldName="lastName" required
                        record={props.practitioner} setRecord={props.setpractitioner}
                    />

                    <MyInput disabled={true} column fieldName="fullName" required
                        record={props.practitioner} setRecord={props.setpractitioner}
                    />


                </Form>



                <Form layout='inline' fluid>
                    <MyInput disabled={!editing} column fieldName="email" required record={props.practitioner} setRecord={props.setpractitioner} />
                    <MyInput disabled={!editing} column fieldName="phoneNumber" required record={props.practitioner} setRecord={props.setpractitioner} />

                    <MyInput disabled={!editing}
                        column
                        fieldLabel="sex at birth"
                        fieldType="select"
                        fieldName="sexAtBirthLkey"
                        selectData={gndrLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={props.practitioner} setRecord={props.setpractitioner}
                    />


                    <MyInput disabled={!editing}
                        column
                        fieldType="date"
                        fieldLabel="DOB"
                        fieldName="dob"
                        record={props.practitioner} setRecord={props.setpractitioner}
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
                        column
                        fieldName="accessRoleKey"
                        fieldType="select"
                        selectData={
                            // accessRoleListResponse?.object ?? 
                            []}
                        selectDataLabel="name"
                        selectDataValue="key"
                        record={props.practitioner} setRecord={props.setpractitioner}

                    />

                    <MyInput disabled={!editing}
                        column
                        fieldLabel="job role"
                        fieldType="select"
                        fieldName="jobRoleLkey"
                        selectData={
                            // jobRoleLovQueryResponse?.object ?? 
                            []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={props.practitioner} setRecord={props.setpractitioner}

                    />

                    <MyInput disabled={!editing} column fieldName="jobDescription" required
                        record={props.practitioner} setRecord={props.setpractitioner}

                    />
                    <Form layout='inline' fluid>
                        <MyInput disabled={!editing}
                            column
                            fieldLabel="Speciality"
                            fieldType="select"
                            fieldName="speciality"
                            selectData={specialityLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={props.practitioner} setRecord={props.setpractitioner}

                        />
                        <MyInput disabled={!editing}
                            column
                            fieldLabel="Sub Speciality"
                            fieldType="select"
                            fieldName="subSpeciality"
                            selectData={subSpecialityLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={props.practitioner} setRecord={props.setpractitioner}

                        />

                        <MyInput disabled={!editing}
                            column
                            fieldLabel="Default Medical License"
                            fieldType="select"
                            fieldName="defaultMedicalLicense"
                            // selectDataLabel="facilityName"
                            // selectDataValue="key"
                            selectData={[]}
                            record={props.practitioner} setRecord={props.setpractitioner}

                        />
                        <MyInput disabled={!editing}
                            column
                            fieldType="date"
                            fieldLabel="Valid Until"
                            fieldName="defaultLicenseValidUntil"
                            record={props.practitioner} setRecord={props.setpractitioner}
                        />


                        <MyInput disabled={!editing}
                            column
                            fieldLabel="Secondary License"
                            fieldType="select"
                            fieldName="secondaryMedicalLicense"
                            selectData={ []}
                            // selectDataLabel="lovDisplayVale"
                            // selectDataValue="key"
                            record={props.practitioner} setRecord={props.setpractitioner}

                        />
                        <MyInput disabled={!editing}
                            column
                            fieldType="date"
                            fieldLabel="Valid Until"
                            fieldName="secondaryLicenseValidUntil"
                            record={props.practitioner} setRecord={props.setpractitioner}
                        />

                        <MyInput disabled={!editing}
                            column
                            fieldLabel="Educational Level"
                            fieldType="select"
                            fieldName="educationalLevel"
                            selectData={eduLvlLovQueryResponse?.object ??
                                []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={props.practitioner} setRecord={props.setpractitioner}

                        />
                    </Form>

                    {/* <MyInput disabled={!editing}
                width={165}
                column
                fieldLabel="Active User"
                fieldType="checkbox"
                fieldName="isValid"
                record={props.practitioner} setRecord={props.setpractitioner} 

              /> */}
                </Form>
            </div>
        )
    }


    return (

        <div style={{ height: "900px" }}>
            <Panel style={{ background: 'white' }}
                header={
                    <p className="title">
                        <Translate>practitioner Details</Translate>
                    </p>
                }
            >
                <ButtonToolbar>
                    <IconButton appearance="primary" icon={<ArowBackIcon />}
                    //   onClick={() => setDetailsPanle(false)}
                    >
                        Back
                    </IconButton>
                    <IconButton
                        //   disabled={selectedLicense}
                        appearance="primary"
                        color="orange"
                        icon={<Edit />}
                    //   onClick={() => setEditing(true)}
                    >
                        <Translate>Edit</Translate>
                    </IconButton>

                    <IconButton
                        //   disabled={!editing}
                        appearance="primary"
                        color="green"
                        icon={<Check />}
                    //   onClick={() => handleSave()}
                    >
                        <Translate>Save</Translate>
                    </IconButton>

                    <IconButton appearance="primary" color='red' icon={<ReloadIcon />}
                    //   onClick={() => setResetPasswordPopupOpen(true)}
                    >
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
                            <IconButton appearance="primary" icon={<AddOutlineIcon />}
                            // disabled={!selectedFacility?.key}
                            //   onClick={() => setNewDepartmentPopupOpen(true)}
                            >
                                New Department
                            </IconButton>

                            <IconButton appearance="primary" color='red' icon={<TrashIcon />}
                            // disabled={!selectedDepartmentFromTable?.key}
                            //   onClick={() => handleRemoveUserFacilityDepartment()}
                            >
                                Delete Department
                            </IconButton>



                        </ButtonToolbar>
                        <br />
                    </TabPanel>


                    <TabPanel>
                        <h4>Privilege</h4>
                    </TabPanel>
                    <TabPanel>
                        <ButtonToolbar>
                            <IconButton
                                color="cyan"
                                icon={<PlusRound />}
                                //   onClick={() => {
                                //     setLicensePopupOpen(true)
                                //   }}
                                appearance="primary"
                            >
                                New License
                            </IconButton>

                            <IconButton
                                //   disabled={!selectedLicense?.key}
                                appearance="primary"
                                color="orange"
                                icon={<Edit />}
                            //   onClick={() => setLicensePopupOpen(true)}
                            >
                                <Translate>Edit</Translate>
                            </IconButton>

                            <IconButton
                                //   disabled={!selectedLicense?.key}
                                appearance="primary" color="red" icon={<TrashIcon />}
                            //   onClick={handleRemoveLicense}
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
                            // onSortColumn={(sortBy, sortType) => {
                            //   if (sortBy)
                            //     setListRequest({
                            //       ...listRequest,
                            //       sortBy,
                            //       sortType
                            //     });
                            // }}
                            // onRowClick={(rowData) => { setSelectedLicense(rowData), console.log((rowData)) }}
                            headerHeight={40}
                            rowHeight={50}
                            bordered
                            cellBordered
                            data={
                                //   licenseListResponse.object ?? 
                                []
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









    )
};


export default Details;