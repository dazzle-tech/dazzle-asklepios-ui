import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
  useGetFacilitiesQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApResources } from '@/types/model-types';
import {  newApResources } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, fromCamelCaseToDBName } from '@/utils';
import { useGetResourcesQuery, useGetResourceTypeQuery, useSaveResourcesMutation } from '@/services/appointmentService';
import AvailabilityTime from './AvailabilityTime';

const Resources = () => {
  const [resources, setResources] = useState<ApResources>({ ...newApResources });
  const [popupOpen, setPopupOpen] = useState(false);

  const [isPractitioner, setISPractitioner] = useState(false);
  const [isDepartment, setISDepartment] = useState(false);
  const [isMedicalTest, setIsMedicalTest] = useState(false);
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });

  const [saveResources, saveResourcesMutation] = useSaveResourcesMutation();

  const { data: resourcesListResponse } = useGetResourcesQuery(listRequest);
  const {data: facilityListResponse } = useGetFacilitiesQuery(listRequest) ;
  const { data: resourceTypeLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_RESOURCE_TYPE');
  const resourceTypeListResponse = useGetResourceTypeQuery(resources.resourceTypeLkey || "");
  console.log(resourceTypeListResponse + "this is the list")
  const handleNew = () => {
    setResources({...newApResources})
    setPopupOpen(true);
  };

  const handleSave = () => {
    setPopupOpen(false);
    saveResources(resources).unwrap();
  };

  const handleClose = () => {
    setPopupOpen(false); 
    setISDepartment(false); 
    setISPractitioner(false);
  };

  useEffect(() => {
    console.log(resources.resourceKey);
    if (saveResourcesMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveResourcesMutation.data]);

  useEffect(() => {
    resourceTypeListResponse.refetch();
    switch (resources.resourceTypeLkey) {
      case '2039534205961578':
       setISPractitioner(true);
       setISDepartment(false);
       setIsMedicalTest(false);
       break;
      case '2039516279378421':
       setISDepartment(true);
       setISPractitioner(false);
       setIsMedicalTest(false);
       break;
       case '2039620472612029':
        setISDepartment(false);
        setISPractitioner(false);
        setIsMedicalTest(true);
        break;
    }
  }, [resources.resourceTypeLkey]);

  const isSelected = rowData => {
    if (rowData && resources && rowData.key === resources.key) {
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


  return (
    <Panel
      header={
        <h3 className="title">
          <Translate>Resources</Translate>
        </h3>
      }
    >
      <ButtonToolbar>
        <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
          Add New
        </IconButton>
        <IconButton
          disabled={!resources.key}
          appearance="primary"
          onClick={() => setPopupOpen(true)}
          color="green"
          icon={<EditIcon />}
        >
          Edit Selected
        </IconButton>
        <IconButton
          disabled={true || !resources.key}
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
        data={resourcesListResponse?.object ?? []}
        onRowClick={rowData => {
          setResources(rowData);
        }}
        rowClassName={isSelected}
      >
        {/* <Column sortable flexGrow={2}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('facilityKey', e)} />
            <Translate>Facility</Translate>
          </HeaderCell>
          <Cell>
                    {rowData => (
                      <span>
                        {conjureValueBasedOnKeyFromList(
                          facilityListResponse?.object ?? [],
                          rowData.facilityKey,
                          'facilityName'
                        )}
                      </span>
                    )}
                  </Cell>
        </Column> */}
        <Column sortable flexGrow={2}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('resourceTypeLkey', e)} />
            <Translate>Resource Type</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.resourceTypeLvalue ? rowData.resourceTypeLvalue.lovDisplayVale : rowData.resourceTypeLkey
            }
          </Cell>
        </Column>
        <Column sortable flexGrow={2}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('resourceName', e)} />
            <Translate>Resource Name</Translate>
          </HeaderCell>
          <Cell dataKey="resourceName" />
        </Column> 
        <Column sortable flexGrow={3}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('isValid', e)} />
            <Translate>Status</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.isValid ? 'Active' : 'InActive'
            }
          </Cell>
        </Column>
        <Column sortable flexGrow={3}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('createdAt', e)} />
            <Translate>Creation Date</Translate>
          </HeaderCell>
          <Cell> 
          {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ""}
          </Cell>
        </Column> 
        <Column sortable flexGrow={3}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('createdBy', e)} />
            <Translate> Created By</Translate>
          </HeaderCell>
          <Cell dataKey="createdBy" />
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
          total={resourcesListResponse?.extraNumeric ?? 0}
        />
      </div>

<AvailabilityTime resource={resources} />
      <Modal open={popupOpen} overflow>
        <Modal.Title>
          <Translate>New/Edit Resources</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid>
            {/* <MyInput
              fieldName="facilityKey"
              fieldType="select"
              selectData={facilityListResponse?.object ?? []}
              selectDataLabel="facilityName"
              selectDataValue="key"
              record={resources}
              setRecord={setResources}
            />  */}
            <MyInput
              fieldName="resourceTypeLkey"
              fieldType="select"
              selectData={resourceTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={resources}
              setRecord={setResources}
            /> 
            {isPractitioner && <MyInput
              fieldLabel="Resource"
              fieldName="resourceKey"
              fieldType="select"
              selectData={resourceTypeListResponse?.data?.object ?? []}
              selectDataLabel="practitionerFullName"
              selectDataValue="key"
              record={resources}
              setRecord={setResources}
            />} 
          
            {isDepartment && <MyInput
              fieldLabel="Resource"
              fieldName="resourceKey"
              fieldType="select"
              selectData={resourceTypeListResponse?.data?.object ?? []}
              selectDataLabel="name"
              selectDataValue="key"
              record={resources}
              setRecord={setResources}
            />} 

             
            {isMedicalTest && <MyInput
              fieldLabel="Resource"
              fieldName="resourceKey"
              fieldType="select"
              selectData={resourceTypeListResponse?.data?.object ?? []}
              selectDataLabel="testName"
              selectDataValue="key"
              record={resources}
              setRecord={setResources}
            />} 
            
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button appearance="primary" onClick={handleSave}>
              Save
            </Button>
            <Button appearance="primary" color="red" onClick={handleClose}>
              Cancel
            </Button>
          </Stack>
        </Modal.Footer>
      </Modal>
    </Panel>
  );
};

export default Resources;
