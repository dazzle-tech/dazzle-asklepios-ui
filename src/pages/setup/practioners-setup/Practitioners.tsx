import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
  useGetDepartmentsQuery,
  useGetFacilitiesQuery,
  useGetPractitionersQuery,
  useSavePractitionerMutation
} from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApPractitioner } from '@/types/model-types';
import { newApPractitioner } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';

const Practitioners = () => {
  const [practitioner, setPractitioner] = useState<ApPractitioner>({ ...newApPractitioner });
  const [popupOpen, setPopupOpen] = useState(false);

  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [facilityListRequest, setFacilityListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  const [departmentListRequest, setDepartmentListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });

  const [savePractitioner, savePractitionerMutation] = useSavePractitionerMutation();

  const { data: facilityListResponse } = useGetFacilitiesQuery(facilityListRequest);
  const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);
  const { data: practitionerListResponse } = useGetPractitionersQuery(listRequest);

  const handleNew = () => {
    setPopupOpen(true);
  };

  const handleSave = () => {
    setPopupOpen(false);
    savePractitioner(practitioner).unwrap();
  };

  useEffect(() => {
    if (practitioner.primaryFacilityKey) {
      setDepartmentListRequest(
        addFilterToListRequest('facility_key', 'match', practitioner.primaryFacilityKey, {
          ...departmentListRequest,
          ignore: false
        })
      );
    }
  }, [practitioner.primaryFacilityKey]);

  useEffect(() => {
    if (savePractitionerMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [savePractitionerMutation.data]);

  const isSelected = rowData => {
    if (rowData && practitioner && rowData.key === practitioner.key) {
      return 'selected-row';
    } else return '';
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

  return (
    <Panel
      header={
        <h3 className="title">
          <Translate>Practitioners</Translate>
        </h3>
      }
    >
      <ButtonToolbar>
        <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
          Add New
        </IconButton>
        <IconButton
          disabled={!practitioner.key}
          appearance="primary"
          onClick={() => setPopupOpen(true)}
          color="green"
          icon={<EditIcon />}
        >
          Edit Selected
        </IconButton>
        <IconButton
          disabled={true || !practitioner.key}
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
        data={practitionerListResponse?.object ?? []}
        onRowClick={rowData => {
          setPractitioner(rowData);
        }}
        rowClassName={isSelected}
      >
        <Column sortable flexGrow={1}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('primaryFacilityKey', e)} />
            <Translate>Primary Facility</Translate>
          </HeaderCell>
          <Cell dataKey="primaryFacilityKey" />
        </Column>
        <Column sortable flexGrow={1}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('departmentKey', e)} />
            <Translate>Department</Translate>
          </HeaderCell>
          <Cell dataKey="departmentKey" />
        </Column>
        <Column sortable flexGrow={4}>
          <HeaderCell>
            <Input onChange={e => handleFilterChange('practitionerFullName', e)} />
            <Translate>Practitioner Name</Translate>
          </HeaderCell>
          <Cell dataKey="practitionerFullName" />
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
          total={practitionerListResponse?.extraNumeric ?? 0}
        />
      </div>

      <Modal open={popupOpen} overflow>
        <Modal.Title>
          <Translate>New/Edit Practitioner</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid>
            <MyInput
              fieldName="practitionerFullName"
              record={practitioner}
              setRecord={setPractitioner}
            />
            <MyInput
              fieldName="primaryFacilityKey"
              fieldType="select"
              selectData={facilityListResponse?.object ?? []}
              selectDataLabel="facilityName"
              selectDataValue="key"
              record={practitioner}
              setRecord={setPractitioner}
            />
            <MyInput 
              fieldName="departmentKey"
              fieldType="select"
              selectData={departmentListResponse?.object ?? []}
              selectDataLabel="name"
              selectDataValue="key"
              record={practitioner}
              setRecord={setPractitioner}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button appearance="primary" onClick={handleSave}>
              Save
            </Button>
            <Button appearance="primary" color="red" onClick={() => setPopupOpen(false)}>
              Cancel
            </Button>
          </Stack>
        </Modal.Footer>
      </Modal>
    </Panel>
  );
};

export default Practitioners;
