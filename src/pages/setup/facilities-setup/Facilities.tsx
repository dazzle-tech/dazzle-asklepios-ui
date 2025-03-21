import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { useGetFacilitiesQuery, useSaveFacilityMutation, useRemoveFacilityMutation } from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import { Block, Check, DocPass, Edit, History, Icon, PlusRound, Detail } from '@rsuite/icons';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApFacility } from '@/types/model-types';
import { newApAddresses, newApFacility, newApDepartment } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import ArowBackIcon from '@rsuite/icons/ArowBack';

import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { Address } from 'cluster';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
const Facilities = () => {
  const dispatch = useAppDispatch();

  const [facility, setFacility] = useState<ApFacility>({ ...newApFacility });
  const [address, setAddress] = useState<Address>({ ...newApAddresses });
  const [departments, setDepartments] = useState<Address>({ ...newApDepartment });
  const [editing, setEditing] = useState(false);

  const [popupOpen, setPopupOpen] = useState(false);
  const [validationResult, setValidationResult] = useState({});
  // const { data: cityLovQueryResponse } = useGetLovValuesByCodeQuery('CITY');

  const { data: contryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
  const { data: cityLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'CITY',
    parentValueKey: address?.countryLkey
  });
  const { data: stateLovQueryResponse } = useGetLovValuesByCodeQuery('STATE');
  const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');

  const { data: fsltyTypeLovQueryResponse } = useGetLovValuesByCodeQuery('FSLTY_TYP');


  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const { data: facilityListResponse } = useGetFacilitiesQuery(listRequest);

  const [saveFacility, saveFacilityMutation] = useSaveFacilityMutation();
  const [removeFacility, removeFacilityMutation] = useRemoveFacilityMutation()

  const [detailsPanle, setDetailsPanle] = useState(false);
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Facilities</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Facilities'));
  dispatch(setDivContent(divContentHTML));
  const handleNew = () => {
    setAddress(newApAddresses)
    setFacility(newApFacility)
    setDepartments(newApDepartment)
    setPopupOpen(true);

  };


  const handleSave = () => {
    console.log({ ...facility, address })
    setPopupOpen(false);
    setEditing(false)
    saveFacility({ ...facility, address }).unwrap();
  };
  const handleRemove = () => {
    console.log({ ...facility, address })
    setPopupOpen(false);
    setEditing(false)
    removeFacility(facility).unwrap().then(() => {
      refetchFacility()
    });
  };


  useEffect(() => {
    if (saveFacilityMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveFacilityMutation.data]);

  const isSelected = rowData => {
    if (rowData && facility && rowData.key === facility.key) {
      return 'selected-row';
    } else return '';
  };

  const inputForms = (newEntry) => {
    return (
      <div>
        <Form layout="inline" fluid>

          <MyInput disabled={!editing && !newEntry} fieldLabel="Facility ID" column fieldName="facilityId" required record={facility} setRecord={setFacility} />

          <MyInput disabled={!editing && !newEntry} column fieldName="facilityName" record={facility} setRecord={setFacility} />
          <MyInput
            disabled={!editing && !newEntry}
            column
            fieldName="facilityRegistrationDate"
            fieldType="date"
            record={facility}
            setRecord={setFacility}
          />
          <MyInput
            disabled={!editing && !newEntry}
            required
            width={165}
            vr={validationResult}
            column
            fieldLabel="FacilityType"
            fieldType="select"
            fieldName="facilityTypeLkey"
            selectData={fsltyTypeLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={facility}
            setRecord={setFacility}
          />
        </Form>
        <br />
        {/* ==================Adresses================= */}
        <Form layout="inline" fluid>
          <MyInput
            disabled={!editing && !newEntry}
            required
            width={165}
            vr={validationResult}
            column
            fieldLabel="facility Country"
            fieldType="select"
            fieldName="countryLkey"
            selectData={contryLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={address} setRecord={setAddress}
          />

          <MyInput disabled={!editing && !newEntry} column fieldLabel="facilityPostal/ZIP" fieldName="postalCode" record={address} setRecord={setAddress} />
          <MyInput
            disabled={!editing && !newEntry}
            required
            width={165}
            vr={validationResult}
            column
            fieldLabel="facilityCity"
            fieldType="select"
            fieldName="cityLkey"
            selectData={cityLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={address} setRecord={setAddress}
          />
          <MyInput
            disabled={!editing && !newEntry}
            required
            width={165}
            vr={validationResult}
            column
            fieldLabel="State/Region"
            fieldType="select"
            fieldName="stateProvinceRegionLkey"
            selectData={stateLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={address} setRecord={setAddress}
          />
          <MyInput disabled={!editing && !newEntry} column fieldLabel="Street" fieldName="streetAddressLine1" required record={address} setRecord={setAddress} />
        </Form>
        <br />
        {/* ==================Adresses================= */}


        <Form layout="inline" fluid>
          <MyInput disabled={!editing && !newEntry} column fieldName="facilityPhone1" required record={facility} setRecord={setFacility} />
          <MyInput disabled={!editing && !newEntry} column fieldName="facilityPhone2" required record={facility} setRecord={setFacility} />
          <MyInput disabled={!editing && !newEntry} column fieldName="facilityEmailAddress" record={facility} setRecord={setFacility} />
          <MyInput disabled={!editing && !newEntry} column fieldName="facilityFax" required record={facility} setRecord={setFacility} />
          <MyInput
            disabled={!editing && !newEntry}
            required
            width={165}
            vr={validationResult}
            column
            fieldLabel="Default Currency"
            fieldType="select"
            fieldName="defaultCurrencyLkey"
            selectData={currencyLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={facility} setRecord={setFacility}
          />

          <MyInput
            disabled={!editing && !newEntry}
            column
            fieldName="facilityBriefDesc"
            fieldType="textarea"
            record={facility}
            setRecord={setFacility}
          />
        </Form>
      </div>
    );
  };

  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'startsWithIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent("  "));
    };
  }, [location.pathname, dispatch])
  return (
    <div>

      {
        detailsPanle ?
          //===================================== Facilities Details
          <Panel style={{ background: 'white' }}
            header={
              <h3 className="title">
                <Translate>Facilities Details</Translate>
              </h3>
            }
          >
            <ButtonToolbar>
              <IconButton appearance="primary" icon={<ArowBackIcon />}
                onClick={() => {setDetailsPanle(false),setEditing(false)}}>
                Back
              </IconButton>
              <IconButton
                disabled={editing}
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

            </ButtonToolbar>
            <hr />
            {inputForms(false)}

            <Tabs>
              <TabList>
                <Tab>
                  <Translate>Facility Departments</Translate>
                </Tab>
                <Tab>
                  <Translate>Facility Administrative Staff</Translate>
                </Tab>
                <Tab>
                  <Translate>Facility Finance Staff</Translate>
                </Tab>
                <Tab>
                  <Translate>Facility Taxes</Translate>
                </Tab>
                <Tab>
                  <Translate>Facility Appointment User</Translate>
                </Tab>
                <Tab>
                  <Translate>Facility Settings</Translate>
                </Tab>
                <Tab>
                  <Translate>Credentialing Information</Translate>
                </Tab>
              </TabList>

              <TabPanel>
                <h4>Facility Departments</h4>
                <Table
                  height={400}
                  headerHeight={40}
                  rowHeight={50}
                  bordered
                  cellBordered
                  // onRowClick={setSelectedInsurance}
                  data={departments ?? []}
                >


                  <Column flexGrow={4}>
                    <HeaderCell>Key</HeaderCell>
                    <Cell dataKey="key" />
                  </Column>

                  <Column flexGrow={4}>
                    <HeaderCell>Description</HeaderCell>

                    <Cell dataKey="name" />
                  </Column>



                </Table>
              </TabPanel>

              <TabPanel>
                <h4>Facility Administrative Staff</h4>
                {/* Add content or components related to Administrative Staff here */}
              </TabPanel>
              <TabPanel>
                <h4>Facility Finance Staff</h4>
                {/* Add content or components related to Finance Staff here */}
              </TabPanel>
              <TabPanel>
                <h4>Facility Taxes</h4>
                {/* Add content or components related to Taxes here */}
              </TabPanel>
              <TabPanel>
                <h4>Facility Appointment User</h4>
                {/* Add content or components related to Appointment User here */}
              </TabPanel>
              <TabPanel>
                <h4>Facility Settings</h4>
                {/* Add content or components related to Settings here */}
              </TabPanel>
              <TabPanel>
                <h4>Credentialing Information</h4>
                {/* Add content or components related to Credentialing Information here */}
              </TabPanel>
            </Tabs>




          </Panel>
          //===================================== Facilities Details

          :

          <div>
            <Panel style={{ background: 'white' }}
            >

              <ButtonToolbar>
                <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
                  Add New
                </IconButton>
                <IconButton
                  disabled={!facility.key}
                  appearance="primary"
                  onClick={() => {

                    setDetailsPanle(true)
                  }
                  }
                  color="green"
                  icon={<EditIcon />}
                >
                  Edit Selected
                </IconButton>
                <IconButton
                  onClick={() => {
                    handleRemove(facility)
                  }}
                  disabled={!facility.key}
                  appearance="primary"
                  color="red"
                  icon={<TrashIcon />}
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
                data={facilityListResponse?.object ?? []}
                onRowClick={rowData => {
                  setFacility(rowData);
                  setAddress(rowData.address);
                  setDepartments(rowData.department)
                }}
                rowClassName={isSelected}
              >
                <Column sortable flexGrow={1}>
                  <HeaderCell align="center">
                    <Input onChange={e => handleFilterChange('facilityId', e)} />
                    <Translate>ID</Translate>
                  </HeaderCell>
                  <Cell dataKey="facilityId" />
                </Column>
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Input onChange={e => handleFilterChange('facilityName', e)} />
                    <Translate>Facility Name</Translate>
                  </HeaderCell>
                  <Cell dataKey="facilityName" />
                </Column>
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Input onChange={e => handleFilterChange('facilityRegistrationDate', e)} />
                    <Translate>Registration Date</Translate>
                  </HeaderCell>
                  <Cell dataKey="facilityRegistrationDate" />
                </Column>
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Input onChange={e => handleFilterChange('facilityEmailAddress', e)} />
                    <Translate>Email Address</Translate>
                  </HeaderCell>
                  <Cell dataKey="facilityEmailAddress" />
                </Column>
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Input onChange={e => handleFilterChange('facilityBriefDesc', e)} />
                    <Translate>Brief Description</Translate>
                  </HeaderCell>
                  <Cell dataKey="facilityBriefDesc" />
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
                  total={facilityListResponse?.extraNumeric ?? 0}
                />
              </div>

              <Modal size={'lg'} open={popupOpen} overflow>
                <Modal.Title>
                  <Translate>New Facility</Translate>
                </Modal.Title>
                <Modal.Body>
                  {inputForms(true)}
                </Modal.Body>
                <Modal.Footer>
                  <Stack spacing={2} divider={<Divider vertical />}>
                    <Button appearance="primary" onClick={handleSave}>
                      Save
                    </Button>
                    <Button appearance="primary" color="red" onClick={() => { setPopupOpen(false), setAddress(newApAddresses), setDepartments(newApDepartment) }}>
                      Cancel
                    </Button>
                  </Stack>
                </Modal.Footer>
              </Modal>
            </Panel >
          </div>
      }
    </div>

  );
};

export default Facilities;
