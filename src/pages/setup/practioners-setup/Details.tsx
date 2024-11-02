import React, { useEffect, useState } from "react";
import { Input, Modal, Pagination, Panel, Table, TagPicker, Radio, RadioGroup, PanelGroup, Placeholder, InputGroup, Drawer } from 'rsuite';
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
  newApPractitioner,
  newApUser
} from '@/types/model-types-constructor';
import {
  useGetUsersQuery,
  useGetLovValuesByCodeQuery,
  useRemoveUserMutation,
  useSavePractitionerMutation

} from '@/services/setupService';
import PageIcon from '@rsuite/icons/Page';
import { initialListRequest, ListRequest } from "@/types/types";
import SearchIcon from '@rsuite/icons/Search';
import { useGetPatientsQuery } from "@/services/patientService";
import { ApPractitioner, ApUser } from "@/types/model-types";


const Details = (props) => {
  const [editing, setEditing] = useState(true);

  const { data: gndrLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  const { data: eduLvlLovQueryResponse } = useGetLovValuesByCodeQuery('EDU_LEVEL');
  const [searchResultVisible, setSearchResultVisible] = useState(false);
  const [patientSearchTarget, setPatientSearchTarget] = useState('primary'); // primary, relation, etc..
  const { data: specialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SPECIALTY');
  const { data: subSpecialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY');

  const [searchKeyword, setSearchKeyword] = useState('');
  const [user, setUser] = useState<ApUser>({ ...newApUser });

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest
    ,
    ignore: !searchKeyword
      || searchKeyword.length < 3
  });
  const [practitioner, setPractitioner] = useState<ApPractitioner>({ ...newApPractitioner });
  const [savePractitioner, savePractitionerMutation] = useSavePractitionerMutation();
  const { data: userListResponse, refetch: refetchUsers } = useGetUsersQuery(listRequest);

  useEffect(() => {
    if (props.newPrac === false) {
      setPractitioner(props.practitionerData)
    }
  }, [props.practitionerData])


  // useEffect(() => {
  //   if (user.key) {
  //     setPractitioner({})
  //   }
  // }, [user])

  useEffect(() => {
    if (practitioner.linkedUser) {
      console.log(practitioner.linkedUser)
    }
  }, [practitioner])


  const handleSave = () => {
    savePractitioner(practitioner).unwrap().then(() => {
      setPractitioner(newApPractitioner)

    }).then(props.back).then(props.refetchPractitioners);
  };

  useEffect(() => {
    if (savePractitionerMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [savePractitionerMutation.data]);

  useEffect(() => {
    console.log(props.practitionerData)
  }, [props.practitionerData])

  const search = () => {
    // setPatientSearchTarget(target);
    console.log(searchKeyword.length)
    if (searchKeyword && searchKeyword.length >= 3) {
      setSearchResultVisible(true);

      setListRequest({
        ...listRequest,
        ignore: false,
        filters: [
          {
            operator: 'containsIgnoreCase',
            value: searchKeyword,
            fieldName: "full_name"
          },
        ]
      });
    }
  };

  useEffect(() => {
    if (props.practitioner)
      console.log(props.practitioner)
  }, [props.practitioner])

  useEffect(() => {
    console.log(user);
    setSearchResultVisible(false)
  }, [user])

  useEffect(() => {
    console.log(searchKeyword);
  }, [searchKeyword])

  const InputForms = (editing) => {
    return (
      <div>
        <Form layout='inline' fluid>
          <MyInput disabled={!editing} column fieldName="practitionerFirstName" required
            record={practitioner} setRecord={setPractitioner}
          />


          <MyInput disabled={!editing} column fieldName="practitionerLastName" required
            record={practitioner} setRecord={setPractitioner}
          />

          <MyInput disabled={true} column fieldName="practitionerFullName" required
            record={practitioner} setRecord={setPractitioner}
          />


        </Form>



        <Form layout='inline' fluid>
          <MyInput disabled={!editing} column fieldName="practitionerEmail" required record={practitioner} setRecord={setPractitioner} />
          <MyInput disabled={!editing} column fieldName="practitionerPhoneNumber" required record={practitioner} setRecord={setPractitioner} />

          <MyInput disabled={!editing}
            column
            fieldLabel="sex at birth"
            fieldType="select"
            fieldName="sexAtBirthLkey"
            selectData={gndrLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={practitioner} setRecord={setPractitioner} />


          <MyInput disabled={!editing}
            column
            fieldType="date"
            fieldLabel="DOB"
            fieldName="dob"
            record={practitioner} setRecord={setPractitioner} />



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
            fieldLabel="job role"
            fieldType="select"
            fieldName="jobRoleLkey"
            selectData={
              // jobRoleLovQueryResponse?.object ?? 
              []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={practitioner} setRecord={setPractitioner} />


          <Form layout='inline' fluid>
            <MyInput disabled={!editing}
              column
              fieldLabel="Speciality"
              fieldType="select"
              fieldName="speciality"
              selectData={specialityLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={practitioner} setRecord={setPractitioner} />

            <MyInput disabled={!editing}
              column
              fieldLabel="Sub Speciality"
              fieldType="select"
              fieldName="subSpeciality"
              selectData={subSpecialityLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={practitioner} setRecord={setPractitioner} />

            <MyInput disabled={!editing}
              column
              fieldLabel="Default Medical License"
              fieldName="defaultMedicalLicense"
              record={practitioner} setRecord={setPractitioner}
            />

            <MyInput disabled={!editing}
              column
              fieldType="date"
              fieldLabel="Valid Until"
              fieldName="defaultLicenseValidUntil"
              record={practitioner} setRecord={setPractitioner} />


            <MyInput disabled={!editing}
              column
              fieldLabel="Secondary License"
              fieldName="secondaryMedicalLicense"
              record={practitioner} setRecord={setPractitioner} />

            <MyInput disabled={!editing}
              column
              fieldType="date"
              fieldLabel="Valid Until"
              fieldName="secondaryLicenseValidUntil"
              record={practitioner} setRecord={setPractitioner} />

            <MyInput disabled={!editing}
              column
              fieldLabel="Educational Level"
              fieldType="select"
              fieldName="educationalLevel"
              selectData={eduLvlLovQueryResponse?.object ??
                []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={practitioner} setRecord={setPractitioner} />

          </Form>

          <MyInput disabled={!editing}
            width={165}
            column
            fieldLabel="Appointable"
            fieldType="checkbox"
            fieldName="appointable"
            record={practitioner} setRecord={setPractitioner}

          />
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
            onClick={props.back}
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
            onClick={() => handleSave()}
          >
            <Translate>Save</Translate>
          </IconButton>
          <InputGroup inside style={{ width: '350px', direction: 'ltr' }}>
            <Input
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  search();
                }
              }}
              placeholder={'Search Users '}
              value={searchKeyword}
              onChange={e => setSearchKeyword(e)}
            />
            <InputGroup.Button onClick={() => search()} >
              <SearchIcon />
            </InputGroup.Button>
          </InputGroup>

        </ButtonToolbar>
        <hr />

        {InputForms(editing)}

        <Drawer
          size="lg"
          placement={'left'}
          open={searchResultVisible}
          onClose={() => { setSearchResultVisible(false) }}
        >
          <Drawer.Header>
            <Drawer.Title>User List - Search Results</Drawer.Title>
            {/* <Drawer.Actions>{conjurePatientSearchBar(patientSearchTarget)}</Drawer.Actions> */}
          </Drawer.Header>
          <Drawer.Body>
            <small>
              * <Translate>Click to select User</Translate>
            </small>
            <Table
              height={600}
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
              onRowClick={rowData => {
                setUser(rowData);

              }}
              data=
              {userListResponse?.object ??
                []}
            >
              <Column sortable flexGrow={3}>
                <HeaderCell>
                  {/* <Input onChange={e => handleFilterChange('fullName', e)} /> */}
                  <Translate>User Name</Translate>
                </HeaderCell>
                <Cell dataKey="fullName" />
              </Column>
              <Column sortable flexGrow={3}>
                <HeaderCell>
                  {/* <Input onChange={e => handleFilterChange('mobileNumber', e)} /> */}
                  <Translate>Mobile Number</Translate>
                </HeaderCell>
                <Cell dataKey="phoneNumber" />
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
                total={
                  // patientListResponse?.extraNumeric ??
                  0}
              />
            </div>
          </Drawer.Body>
        </Drawer>


      </Panel>
    </div>









  )
};


export default Details;