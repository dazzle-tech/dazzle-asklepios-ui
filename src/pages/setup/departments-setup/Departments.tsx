import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
import CheckIcon from '@rsuite/icons/Check';
import CloseIcon from '@rsuite/icons/Close';

const { Column, HeaderCell, Cell } = Table;
import {
  useGetFacilitiesQuery,
  useGetDepartmentsQuery,
  useSaveDepartmentMutation
} from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApDepartment } from '@/types/model-types';
import { newApDepartment } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import {
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
const Departments = () => {
  const [department, setDepartment] = useState<ApDepartment>({ ...newApDepartment });
  const [popupOpen, setPopupOpen] = useState(false);
  const [generateCode, setGenerateCode] = useState();

  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [facilityListRequest, setFacilityListRequest] = useState<ListRequest>({
    ...initialListRequest
  });

  const [saveDepartment, saveDepartmentMutation] = useSaveDepartmentMutation();
  const { data: depTTypesLovQueryResponse } = useGetLovValuesByCodeQuery('DEPARTMENT-TYP');


  const { data: facilityListResponse } = useGetFacilitiesQuery(facilityListRequest);
  const { data: departmentListResponse } = useGetDepartmentsQuery(listRequest);

  const handleNew = () => {
    generateFiveDigitCode()
    setDepartment({ ...newApDepartment })
    setPopupOpen(true);
    console.log(depTTypesLovQueryResponse)
  };

  const handleSave = () => {
    setPopupOpen(false);
    saveDepartment({ ...department, departmentCode: generateCode }).unwrap();
  };

  useEffect(() => {
    if (saveDepartmentMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveDepartmentMutation.data]);

  const isSelected = rowData => {
    if (rowData && department && rowData.key === department.key) {
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
  const generateFiveDigitCode = () => {
    const code = Math.floor(10000 + Math.random() * 90000);
    setGenerateCode(code);
  };
  return (
    <Panel
      header={
        <h3 className="title">
          <Translate>Departments</Translate>
        </h3>
      }
    >
      <ButtonToolbar>
        <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
          Add New
        </IconButton>
        <IconButton
          disabled={!department.key}
          appearance="primary"
          onClick={() => setPopupOpen(true)}
          color="green"
          icon={<EditIcon />}
        >
          Edit Selected
        </IconButton>
        <IconButton
          disabled={true || !department.key}
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
        data={departmentListResponse?.object ?? []}
        onRowClick={rowData => {
          setDepartment(rowData);
        }}
        rowClassName={isSelected}
      >
        <Column sortable flexGrow={1}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('facilityKey', e)} />
            <Translate>Facility</Translate>
          </HeaderCell>
          <Cell dataKey="facilityKey" />
        </Column>

        <Column sortable flexGrow={4}>
          <HeaderCell>
            <Input onChange={e => handleFilterChange('name', e)} />
            <Translate>Department Name</Translate>
          </HeaderCell>
          <Cell dataKey="name" />
        </Column>

        <Column sortable flexGrow={1}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('departmentCode', e)} />
            <Translate>Department Code</Translate>
          </HeaderCell>
          <Cell dataKey="departmentCode" />
        </Column>

        {/* <Column sortable flexGrow={1}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('appointable', e)} />
            <Translate>Appointable</Translate>
          </HeaderCell>
          <Cell >
          {rowData =>
             rowData.appointable?<CheckIcon style={{ fontSize: "2rem", marginRight: 10 }}/>:<CloseIcon style={{ fontSize: "2rem", marginRight: 10 }}/>
          }
          </Cell>
        </Column>         */}
   


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
          total={departmentListResponse?.extraNumeric ?? 0}
        />
      </div>

      <Modal open={popupOpen} overflow>
        <Modal.Title>
          <Translate>New/Edit Department</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid>
            <MyInput
              fieldName="facilityKey"
              fieldType="select"
              selectData={facilityListResponse?.object ?? []}
              selectDataLabel="facilityName"
              selectDataValue="key"
              record={department}
              setRecord={setDepartment}
            />
            <MyInput fieldName="name" record={department} setRecord={setDepartment} />
            <label>Department Code</label>
            <Input style={{ width: 260 }} disabled value={generateCode} />

            <MyInput
              fieldName="departmentTypeLkey"
              fieldLabel="Department Type"
              fieldType="select"
              selectData={depTTypesLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={department}
              setRecord={setDepartment}

            />
          </Form>
          <Form fluid layout='inline'>
            <MyInput
              width={165}
              column
              fieldLabel="Appointable"
              fieldType="checkbox"
              fieldName="appointable"
              record={department}
              setRecord={setDepartment}
            />
            <MyInput
              width={165}
              column
              fieldLabel="Has Triage"
              fieldType="checkbox"
              fieldName="hasTriage"
              record={department}
              setRecord={setDepartment}
            />
            <MyInput
              width={165}
              column
              fieldLabel="Is Valid"
              checkedLabel="Valid"
              unCheckedLabel="inValid"
              fieldType="checkbox"
              fieldName="isValid"
              record={department}
              setRecord={setDepartment}
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

export default Departments;
