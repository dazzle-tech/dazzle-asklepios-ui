import React, { useState } from 'react';
import {
  Panel,
  Form,
  Whisper,
  Tooltip,
  Popover,
  Dropdown
} from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete } from 'react-icons/md';
import { FaEdit, FaListAlt } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { useGetDepartmentsQuery } from '@/services/setupService';
import { Tabs } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { FaFileExport, FaFileImport, FaFileWaveform, FaPaperclip, FaPaperPlane, FaPerson, FaPlay } from 'react-icons/fa6';
import InpatientTablePage from './InpatientTablePage';
import OutpatientTablePage from './OutpatientTablePage';

const Claimscreen = () => {

  const dispatch = useAppDispatch();


  const divContent = (
    "Claims"
  );
  dispatch(setPageCode('ProductList'));
  dispatch(setDivContent(divContent));


  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [filter, setFilter] = useState<any>({});
  const [openActionsMenu, setOpenActionsMenu] = useState(false);

  const { data: departmentListResponse } = useGetDepartmentsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const departmentOptions =
    departmentListResponse?.data?.map(dep => ({
      label: dep.name,
      value: dep.id
    })) ?? [];

  const content = (<>
    <div className="advanced-filters">
      <Form fluid className="dissss">
        <div className='advanced-filters-claims-screen'>
        <MyInput
          width="10vw"
          fieldLabel="Coding Status"
          fieldName="department"
          fieldType="checkPicker"
          selectData={departmentOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={filter}
          setRecord={setFilter}
        />

        <MyInput
          width="10vw"
          fieldLabel="Claim Billing Mode"
          fieldName="department"
          fieldType="checkPicker"
          selectData={departmentOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={filter}
          setRecord={setFilter}
        />

        <MyInput
          width="10vw"
          fieldLabel="Assigned"
          fieldName="department"
          fieldType="checkPicker"
          selectData={departmentOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={filter}
          setRecord={setFilter}
        />
        <MyInput
          fieldName="scheduledTransfusion"
          fieldType="check"
          fieldLabel="Assigned To Me"
          showLabel={false}
          record={filter}
          setRecord={setFilter}
        />

        <MyInput
          fieldName="scheduledTransfusion"
          fieldType="check"
          fieldLabel="Un Assigned"
          showLabel={false}
          record={filter}
          setRecord={setFilter}
        />

        <MyInput
          width="10vw"
          fieldLabel="Encounter Billing Mode"
          fieldName="department"
          fieldType="checkPicker"
          selectData={departmentOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={filter}
          setRecord={setFilter}
        /></div>
      </Form>
    </div></>);

  const filters = () => (
    <div className='my-table-filters'>
    <Form layout='inline' fluid>
      <div className='container-of-filter-fields-department-date-filters'>
        <MyInput
          fieldType="date"
          fieldLabel="From Date"
          fieldName="fromDate"
          record={filter}
          setRecord={setFilter}
          showLabel={false}
          column
        />
        <MyInput
          fieldType="date"
          fieldLabel="To Date"
          fieldName="toDate"
          record={filter}
          setRecord={setFilter}
          showLabel={false}
          column
        />
      </div>

      <SearchPatientCriteria record={filter} setRecord={setFilter} />

      <MyInput
        width="10vw"
        fieldLabel="Department"
        fieldName="department"
        fieldType="checkPicker"
        selectData={departmentOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={filter}
        setRecord={setFilter}
        column
      />
      <MyInput
        width="10vw"
        fieldLabel="Encounter Status"
        fieldName="department"
        fieldType="checkPicker"
        selectData={departmentOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={filter}
        setRecord={setFilter}
        column
      />

      <MyInput
        width="10vw"
        fieldLabel="insurance"
        fieldName="department"
        fieldType="checkPicker"
        selectData={departmentOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={filter}
        setRecord={setFilter}
        column
      />

    </Form>

          <AdvancedSearchFilters
        searchFilter={true}
        content={content}
      />
    </div>
  );

  return (
    <Panel>
        {filters()}

 <Tabs defaultActiveKey="1" appearance="subtle">


    <Tabs.Tab eventKey="1" title="OutPatient">
                <OutpatientTablePage />

    </Tabs.Tab>

    <Tabs.Tab eventKey="3" title="Inpatient">
                <InpatientTablePage />
    </Tabs.Tab>
  </Tabs>

</Panel>
  );
};

export default Claimscreen;